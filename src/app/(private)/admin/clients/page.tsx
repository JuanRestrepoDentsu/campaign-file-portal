import Link from 'next/link';

import {
  ClientTable,
} from '@/features/clients/components/client-table';
import {
  clientListQuerySchema,
} from '@/features/clients/schemas/client.schema';
import {
  getClients,
} from '@/features/clients/services/get-clients';
import type {
  ClientListFilters,
} from '@/features/clients/types/client';
import {
  requireRole,
} from '@/shared/auth/authorization';

type ClientsPageProps = {
  searchParams: Promise<
    Record<
      string,
      string |
        string[] |
        undefined
    >
  >;
};

function firstValue(
  value:
    | string
    | string[]
    | undefined,
): string | undefined {
  return Array.isArray(value)
    ? value[0]
    : value;
}

function buildPageHref(
  filters: ClientListFilters,
  page: number,
): string {
  const params =
    new URLSearchParams();

  params.set(
    'page',
    String(page),
  );
  params.set(
    'pageSize',
    String(filters.pageSize),
  );

  if (filters.search) {
    params.set(
      'search',
      filters.search,
    );
  }

  if (filters.status !== 'all') {
    params.set(
      'status',
      filters.status,
    );
  }

  return `/admin/clients?${params.toString()}`;
}

const NOTICES:
  Record<string, string> = {
  created:
    'Cliente creado correctamente.',
  updated:
    'Cliente actualizado correctamente.',
};

export default async function ClientsPage({
  searchParams,
}: ClientsPageProps) {
  const params =
    await searchParams;

  const validation =
    clientListQuerySchema.safeParse({
      page:
        firstValue(params.page),
      pageSize:
        firstValue(
          params.pageSize,
        ),
      search:
        firstValue(
          params.search,
        ),
      status:
        firstValue(
          params.status,
        ),
    });

  const filters:
    ClientListFilters =
    validation.success
      ? validation.data
      : {
          page: 1,
          pageSize: 10,
          search: '',
          status: 'all',
        };

  const [, result] =
    await Promise.all([
      requireRole([
        'super_admin',
      ]),
      getClients(filters),
    ]);

  const notice =
    NOTICES[
      firstValue(
        params.notice,
      ) ?? ''
    ];

  return (
    <main className="px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Administración
            </p>

            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
              Clientes
            </h1>

            <p className="mt-2 text-slate-600">
              Administra las organizaciones habilitadas en la plataforma.
            </p>
          </div>

          <Link
            href="/admin/clients/new"
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Nuevo cliente
          </Link>
        </div>

        {notice && (
          <p
            role="status"
            className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {notice}
          </p>
        )}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form
            action="/admin/clients"
            method="get"
            className="grid gap-4 border-b border-slate-200 p-5 md:grid-cols-[minmax(0,1fr)_220px_auto]"
          >
            <input
              type="hidden"
              name="pageSize"
              value={filters.pageSize}
            />

            <div>
              <label
                htmlFor="search"
                className="sr-only"
              >
                Buscar clientes
              </label>
              <input
                id="search"
                name="search"
                type="search"
                defaultValue={
                  result.filters.search
                }
                placeholder="Buscar por nombre o código"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            <div>
              <label
                htmlFor="status"
                className="sr-only"
              >
                Filtrar por estado
              </label>
              <select
                id="status"
                name="status"
                defaultValue={
                  result.filters.status
                }
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="all">
                  Todos los estados
                </option>
                <option value="active">
                  Activos
                </option>
                <option value="inactive">
                  Inactivos
                </option>
              </select>
            </div>

            <button
              type="submit"
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Aplicar filtros
            </button>
          </form>

          <ClientTable
            clients={result.items}
          />

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              {result.pagination
                .totalItems.toLocaleString(
                  'es-CO',
                )}{' '}
              cliente(s) · Página{' '}
              {
                result.pagination
                  .page
              }{' '}
              de{' '}
              {
                result.pagination
                  .totalPages
              }
            </p>

            <div className="flex gap-2">
              {result.pagination.page >
              1 ? (
                <Link
                  href={buildPageHref(
                    {
                      ...filters,
                      page:
                        result
                          .pagination
                          .page,
                    },
                    result.pagination
                      .page - 1,
                  )}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Anterior
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">
                  Anterior
                </span>
              )}

              {result.pagination.page <
              result.pagination
                .totalPages ? (
                <Link
                  href={buildPageHref(
                    {
                      ...filters,
                      page:
                        result
                          .pagination
                          .page,
                    },
                    result.pagination
                      .page + 1,
                  )}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Siguiente
                </Link>
              ) : (
                <span className="cursor-not-allowed rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">
                  Siguiente
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
