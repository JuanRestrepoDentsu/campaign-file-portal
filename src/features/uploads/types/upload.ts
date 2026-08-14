export type UploadStatus =
  | 'uploading' | 'uploaded' | 'queued_validation' | 'validating'
  | 'ready_for_confirmation' | 'queued_processing' | 'processing'
  | 'completed' | 'completed_with_errors' | 'validation_failed'
  | 'failed' | 'cancelled' | 'expired';

export type CampaignUploadOption = {
  id: number; name: string; code: string; clientName: string;
};

export type DatabaseColumn = {
  name: string; dataType: string; columnType: string; nullable: boolean;
  defaultValue: string | null; maxLength: number | null; numericPrecision: number | null;
  numericScale: number | null; extra: string; generated: boolean;
};

export type UniqueIndex = { name: string; columns: string[]; primary: boolean };
export type TableSchema = { table: string; displayName: string; columns: DatabaseColumn[]; uniqueIndexes: UniqueIndex[]; schemaHash: string };
export type UploadConfiguration = { targetTable: string; upsertKeyColumns: string[] };
export type SchemaCatalog = { database: string; tables: Array<Omit<TableSchema, 'schemaHash'>>; configurations: UploadConfiguration[] };

export type UploadError = { rowNumber: number | null; columnName: string | null; code: string; message: string };
export type UploadSummary = {
  id: number; campaignId: number; campaignName: string; filename: string;
  status: UploadStatus; targetTable: string; upsertKeyColumns: string[];
  headers: string[]; totalRows: number; validRows: number; invalidRows: number;
  insertedRows: number; updatedRows: number; errorRows: number;
  progressRows: number; progressPercent: number; errorMessage: string | null;
  createdAt: Date; completedAt: Date | null; errors: UploadError[];
};
