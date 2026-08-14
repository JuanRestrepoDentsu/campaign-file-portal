'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import type {
  CampaignUploadOption,
  SchemaCatalog,
} from '@/features/uploads/types/upload';

type UploadWizardProps = {
  campaigns: CampaignUploadOption[];
};

export function UploadWizard({
  campaigns,
}: UploadWizardProps) {
  const router = useRouter();
  const schemaRequestId = useRef(0);
  const [campaignId, setCampaignId] = useState('');
  const [schema, setSchema] = useState<SchemaCatalog | null>(null);
  const [table, setTable] = useState('');
  const [indexName, setIndexName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const selectedTable = useMemo(
    () => schema?.tables.find((item) => item.table === table) ?? null,
    [schema, table],
  );

  const selectedIndex = selectedTable?.uniqueIndexes.find(
    (item) => item.name === indexName,
  ) ?? null;

  async function handleCampaignChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const selectedCampaignId = event.target.value;
    const requestId = schemaRequestId.current + 1;
    schemaRequestId.current = requestId;

    setCampaignId(selectedCampaignId);
    setSchema(null);
    setTable('');
    setIndexName('');
    setMessage(null);

    if (!selectedCampaignId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/portal/uploads/campaigns/${selectedCampaignId}/schema`,
      );
      const body = await response.json() as SchemaCatalog & {
        message?: string;
      };

      if (!response.ok) {
        throw new Error(
          body.message ?? 'No fue posible consultar el esquema.',
        );
      }

      if (schemaRequestId.current !== requestId) {
        return;
      }

      const requestedConfiguredTableName = body.configurations[0]?.targetTable ?? '';
      const configuredTable = body.tables.find(
        (item) => item.table === requestedConfiguredTableName,
      );
      const configuredIndex = configuredTable?.uniqueIndexes.find(
        (item) =>
          JSON.stringify(item.columns) ===
          JSON.stringify(body.configurations[0]?.upsertKeyColumns),
      );

      setSchema(body);
      setTable(configuredTable?.table ?? '');
      setIndexName(configuredIndex?.name ?? '');
    } catch (error) {
      if (schemaRequestId.current === requestId) {
        setMessage(
          error instanceof Error
            ? error.message
            : 'No fue posible consultar el esquema.',
        );
      }
    } finally {
      if (schemaRequestId.current === requestId) {
        setLoading(false);
      }
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file || !campaignId || !selectedIndex) {
      return;
    }

    setLoading(true);
    setMessage(null);

    let uploadId: number | null = null;
    try {
      const response = await fetch('/api/portal/uploads/initiate', {
        method: 'POST',
        headers: {'content-type':'application/json'},
        body: JSON.stringify({campaignId:Number(campaignId),targetTable:table,upsertKeyColumns:selectedIndex.columns,filename:file.name,fileSize:file.size,contentType:file.type}),
      });
      const body = await response.json() as {
        uploadId?: number;
        partSize?: number;
        parts?: Array<{partNumber:number;url:string}>;
        message?: string;
      };
      if(!response.ok||!body.uploadId||!body.partSize||!body.parts)throw new Error(body.message??'No fue posible iniciar la carga.');
      uploadId=body.uploadId;let completed=0;
      const uploaded:Array<{partNumber:number;eTag:string}>=[];
      for(let start=0;start<body.parts.length;start+=3){const group=body.parts.slice(start,start+3);const results=await Promise.all(group.map(async part=>{const first=(part.partNumber-1)*body.partSize!;const put=await fetch(part.url,{method:'PUT',body:file.slice(first,Math.min(first+body.partSize!,file.size))});if(!put.ok)throw new Error(`Falló la parte ${part.partNumber}.`);const eTag=put.headers.get('etag');if(!eTag)throw new Error('S3 no expuso el encabezado ETag. Revisa CORS.');completed+=1;setProgress(Math.round(completed/body.parts!.length*100));return{partNumber:part.partNumber,eTag}}));uploaded.push(...results)}
      const closed=await fetch(`/api/portal/uploads/${uploadId}/complete`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({parts:uploaded.sort((a,b)=>a.partNumber-b.partNumber)})});const result=await closed.json() as{message?:string};if(!closed.ok)throw new Error(result.message??'No fue posible cerrar la carga.');
      router.push(`/portal/uploads/${uploadId}`);
      router.refresh();
    } catch (error) {
      if(uploadId)void fetch(`/api/portal/uploads/${uploadId}/abort`,{method:'POST'});
      setMessage(
        error instanceof Error
          ? error.message
          : 'No fue posible validar el archivo.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6"
    >
      {message && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {message}
        </div>
      )}

      <label className="block text-sm font-medium">
        Campaña
        <select
          value={campaignId}
          onChange={handleCampaignChange}
          className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          required
        >
          <option value="">Selecciona una campaña</option>
          {campaigns.map((campaign) => (
            <option key={campaign.id} value={campaign.id}>
              {campaign.clientName} — {campaign.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Tabla objetivo
        <select
          value={table}
          onChange={(event) => {
            const nextTable=event.target.value;
            setTable(nextTable);
            const configured=schema?.configurations.find(item=>item.targetTable===nextTable);
            const tableSchema=schema?.tables.find(item=>item.table===nextTable);
            const configuredIndex=tableSchema?.uniqueIndexes.find(item=>JSON.stringify(item.columns)===JSON.stringify(configured?.upsertKeyColumns));
            setIndexName(configuredIndex?.name??'');
          }}
          className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          disabled={!schema}
          required
        >
          <option value="">Selecciona una tabla</option>
          {schema?.tables.map((item) => (
            <option key={item.table} value={item.table}>
              {item.displayName}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Clave de actualización
        <select
          value={indexName}
          onChange={(event) => setIndexName(event.target.value)}
          className="mt-2 w-full rounded-lg border border-slate-300 p-2.5"
          disabled={!selectedTable}
          required
        >
          <option value="">Selecciona un índice único</option>
          {selectedTable?.uniqueIndexes.map((index) => (
            <option key={index.name} value={index.name}>
              {index.name}: {index.columns.join(' + ')}
            </option>
          ))}
        </select>
      </label>

      {selectedTable && (
        <div className="rounded-lg bg-slate-50 p-4 text-sm">
          <p className="font-medium">Columnas disponibles</p>
          <p className="mt-1 break-words text-slate-600">
            {selectedTable.columns
              .map((column) => column.name)
              .join(', ')}
          </p>
        </div>
      )}

      <label className="block text-sm font-medium">
        Archivo CSV
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-2 block w-full rounded-lg border border-slate-300 p-2.5"
          required
        />
      </label>

      <p className="text-xs text-slate-500">
        Máximo 120 MB y 4.000.000 de filas. La primera fila debe contener
        encabezados exactamente iguales a las columnas MySQL.
      </p>

      <button
        disabled={loading || !selectedIndex || !file}
        className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? `Cargando… ${progress}%` : 'Cargar y validar archivo'}
      </button>
    </form>
  );
}
