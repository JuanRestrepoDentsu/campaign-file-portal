import Link from 'next/link';

import { CampaignTable } from '@/features/campaigns/components/campaign-table';
import { campaignListQuerySchema } from '@/features/campaigns/schemas/campaign.schema';
import { getRemoteCampaignOptions, getRemoteCampaigns } from '@/shared/api/portal-data';
import type { CampaignListFilters } from '@/features/campaigns/types/campaign';
import { requireRole } from '@/shared/auth/authorization';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(filters: CampaignListFilters, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(filters.pageSize),
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.clientId !== null) params.set('clientId', String(filters.clientId));
  return `/admin/campaigns?${params.toString()}`;
}

const NOTICES: Record<string, string> = {
  created: 'Campaña creada correctamente.',
  updated: 'Campaña actualizada correctamente.',
};

export default async function CampaignsPage({ searchParams }: Props) {
  const params = await searchParams;
  const validation = campaignListQuerySchema.safeParse({
    page: first(params.page),
    pageSize: first(params.pageSize),
    search: first(params.search),
    status: first(params.status),
    clientId: first(params.clientId),
  });
  const filters: CampaignListFilters = validation.success ? validation.data : {
    page: 1, pageSize: 10, search: '', status: 'all', clientId: null,
  };
  const [, result, options] = await Promise.all([
    requireRole(['super_admin']),
    getRemoteCampaigns(filters),
    getRemoteCampaignOptions(),
  ]);
  const notice = NOTICES[first(params.notice) ?? ''];

  return (
    <main className="px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Administración</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Campañas</h1>
            <p className="mt-2 text-slate-600">Administra campañas, clientes y usuarios asignados.</p>
          </div>
          <Link href="/admin/campaigns/new" className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
            Nueva campaña
          </Link>
        </div>

        {notice && <p role="status" className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form action="/admin/campaigns" method="get" className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]">
            <input type="hidden" name="pageSize" value={filters.pageSize} />
            <input name="search" type="search" defaultValue={result.filters.search} placeholder="Buscar por nombre o código" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <select name="clientId" defaultValue={result.filters.clientId ?? ''} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option value="">Todos los clientes</option>
              {options.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
            <select name="status" defaultValue={result.filters.status} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="inactive">Inactivas</option>
              <option value="archived">Archivadas</option>
            </select>
            <button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Aplicar filtros</button>
          </form>

          <CampaignTable campaigns={result.items} />

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              {result.pagination.totalItems.toLocaleString('es-CO')} campaña(s) · Página {result.pagination.page} de {result.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              {result.pagination.page > 1
                ? <Link href={pageHref(filters, result.pagination.page - 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium">Anterior</Link>
                : <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">Anterior</span>}
              {result.pagination.page < result.pagination.totalPages
                ? <Link href={pageHref(filters, result.pagination.page + 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium">Siguiente</Link>
                : <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">Siguiente</span>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
