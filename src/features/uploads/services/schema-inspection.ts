import { createHash } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';
import type { DatabaseColumn, SchemaCatalog, TableSchema, UniqueIndex } from '@/features/uploads/types/upload';
import { UploadServiceError } from '@/features/uploads/errors/upload-service-error';
import { findConfigs } from '@/features/uploads/repositories/upload.repository';
import { getCampaignDatabase } from '@/shared/database/campaign-database';
import { getSupportedUploadTable, supportedUploadTables } from '@/features/uploads/config/supported-upload-tables';

interface ColumnRow extends RowDataPacket {
  TABLE_NAME:string; COLUMN_NAME:string; DATA_TYPE:string; COLUMN_TYPE:string; IS_NULLABLE:'YES'|'NO';
  COLUMN_DEFAULT:string|null; CHARACTER_MAXIMUM_LENGTH:number|null; NUMERIC_PRECISION:number|null;
  NUMERIC_SCALE:number|null; EXTRA:string; GENERATION_EXPRESSION:string;
}
interface IndexRow extends RowDataPacket { TABLE_NAME:string; INDEX_NAME:string; COLUMN_NAME:string; SEQ_IN_INDEX:number }

function mapColumn(row:ColumnRow):DatabaseColumn{return{name:row.COLUMN_NAME,dataType:row.DATA_TYPE,columnType:row.COLUMN_TYPE,nullable:row.IS_NULLABLE==='YES',defaultValue:row.COLUMN_DEFAULT,maxLength:row.CHARACTER_MAXIMUM_LENGTH===null?null:Number(row.CHARACTER_MAXIMUM_LENGTH),numericPrecision:row.NUMERIC_PRECISION===null?null:Number(row.NUMERIC_PRECISION),numericScale:row.NUMERIC_SCALE===null?null:Number(row.NUMERIC_SCALE),extra:row.EXTRA,generated:Boolean(row.GENERATION_EXPRESSION)}}
function hashSchema(schema:Omit<TableSchema,'schemaHash'>):string{return createHash('sha256').update(JSON.stringify({table:schema.table,columns:schema.columns,uniqueIndexes:schema.uniqueIndexes})).digest('hex')}

function isUnknownDatabaseError(error:unknown):boolean{
  return typeof error==='object'&&error!==null&&'code' in error&&error.code==='ER_BAD_DB_ERROR';
}

export async function inspectDatabase(campaignCode:string,campaignId:number):Promise<SchemaCatalog>{
  const pool=getCampaignDatabase(campaignCode);
  let databaseRows:Array<RowDataPacket&{database_name:string}>;
  try{
    [databaseRows]=await pool.query<Array<RowDataPacket&{database_name:string}>>('SELECT DATABASE() database_name');
  }catch(error){
    if(isUnknownDatabaseError(error)){
      throw new UploadServiceError(
        'CAMPAIGN_DATABASE_NOT_FOUND',
        `No existe la base de datos ${campaignCode.toLowerCase()} asociada a la campaña.`,
        422,
      );
    }
    throw error;
  }
  const database=String(databaseRows[0]?.database_name??'');
  const [columns]=await pool.execute<ColumnRow[]>(`SELECT TABLE_NAME,COLUMN_NAME,DATA_TYPE,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,
    CHARACTER_MAXIMUM_LENGTH,NUMERIC_PRECISION,NUMERIC_SCALE,EXTRA,GENERATION_EXPRESSION
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA=? AND TABLE_NAME IN (?, ?)
    ORDER BY TABLE_NAME,ORDINAL_POSITION`,[
      database,
      supportedUploadTables[0].table,
      supportedUploadTables[1].table,
    ]);
  const [indexes]=await pool.execute<IndexRow[]>(`SELECT TABLE_NAME,INDEX_NAME,COLUMN_NAME,SEQ_IN_INDEX FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA=? AND TABLE_NAME IN (?, ?) AND NON_UNIQUE=0
    ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX`,[
      database,
      supportedUploadTables[0].table,
      supportedUploadTables[1].table,
    ]);
  const tables=supportedUploadTables.flatMap((supportedTable)=>{
    const tableColumns=columns.filter((column)=>column.TABLE_NAME===supportedTable.table);
    if(!tableColumns.length)return[];
    return[{
      table:supportedTable.table,
      displayName:supportedTable.displayName,
      columns:tableColumns.map(mapColumn),
      uniqueIndexes:buildIndexes(indexes.filter((index)=>index.TABLE_NAME===supportedTable.table)),
    }];
  });
  const configs=campaignId>0?await findConfigs(campaignId):[];
  return{database,tables,configurations:configs.map(config=>({targetTable:config.target_table,upsertKeyColumns:config.upsert_key_columns}))};
}

function buildIndexes(rows:IndexRow[]):UniqueIndex[]{
  const map=new Map<string,string[]>(); for(const row of rows){const values=map.get(row.INDEX_NAME)??[];values.push(row.COLUMN_NAME);map.set(row.INDEX_NAME,values)}
  return[...map].map(([name,columns])=>({name,columns,primary:name==='PRIMARY'}));
}

export async function inspectTable(campaignCode:string,tableName:string):Promise<TableSchema>{
  if(!getSupportedUploadTable(tableName))throw new UploadServiceError('TABLE_NOT_ALLOWED','Solo se permiten las tablas Usuarios y Seguimiento.',400);
  const catalog=await inspectDatabase(campaignCode,0);
  const table=catalog.tables.find((candidate)=>candidate.table===tableName);
  if(!table)throw new UploadServiceError('TABLE_NOT_FOUND','La tabla seleccionada no existe en la base de la campaña.',400);
  return{...table,schemaHash:hashSchema(table)};
}
