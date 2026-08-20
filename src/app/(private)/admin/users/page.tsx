import Link from 'next/link';

import { UserTable } from '@/features/users/components/user-table';
import { userListQuerySchema } from '@/features/users/schemas/user.schema';
import { getRemoteUserOptions, getRemoteUsers } from '@/shared/api/portal-data';
import type { UserListFilters } from '@/features/users/types/user';
import { requireRole } from '@/shared/auth/authorization';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function pageHref(filters: UserListFilters, page: number) {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(filters.pageSize),
  });
  if (filters.search) params.set('search', filters.search);
  if (filters.role !== 'all') params.set('role', filters.role);
  if (filters.status !== 'all') params.set('status', filters.status);
  if (filters.clientId) params.set('clientId', String(filters.clientId));
  return `/admin/users?${params.toString()}`;
}

const NOTICES: Record<string, string> = {
  created: 'Usuario creado e invitación enviada.',
  updated: 'Usuario actualizado correctamente.',
};

export default async function UsersPage({ searchParams }: Props) {
  const params = await searchParams;
  const validation = userListQuerySchema.safeParse({
    page: first(params.page),
    pageSize: first(params.pageSize),
    search: first(params.search),
    role: first(params.role),
    status: first(params.status),
    clientId: first(params.clientId),
  });
  const filters: UserListFilters = validation.success
    ? validation.data
    : {
        page: 1,
        pageSize: 10,
        search: '',
        role: 'all',
        status: 'all',
        clientId: null,
      };

  const [currentUser, result, formOptions] = await Promise.all([
    requireRole(['super_admin']),
    getRemoteUsers(filters),
    getRemoteUserOptions(),
  ]);
  const notice = NOTICES[first(params.notice) ?? ''];

  return (
    <main className="px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Administración</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">Usuarios</h1>
            <p className="mt-2 text-slate-600">Administra identidad, acceso, roles y asignaciones.</p>
          </div>
          <Link href="/admin/users/new" className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800">
            Nuevo usuario
          </Link>
        </div>

        {notice && <p role="status" className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <form action="/admin/users" method="get" className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[minmax(200px,1fr)_180px_180px_220px_auto]">
            <input type="hidden" name="pageSize" value={filters.pageSize} />
            <input name="search" type="search" defaultValue={result.filters.search} placeholder="Nombre o correo" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm" />
            <select name="role" defaultValue={result.filters.role} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option value="all">Todos los roles</option>
              <option value="super_admin">Superadministrador</option>
              <option value="client_admin">Admin. cliente</option>
              <option value="client_user">Usuario cliente</option>
            </select>
            <select name="status" defaultValue={result.filters.status} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option value="all">Todos los estados</option>
              <option value="invited">Invitados</option>
              <option value="active">Activos</option>
              <option value="blocked">Bloqueados</option>
              <option value="inactive">Inactivos</option>
            </select>
            <select name="clientId" defaultValue={result.filters.clientId ?? ''} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm">
              <option value="">Todos los clientes</option>
              {formOptions.clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
            </select>
            <button className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Filtrar</button>
          </form>

          <UserTable users={result.items} currentUserId={currentUser.id} />

          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-6 py-4">
            <p className="text-sm text-slate-500">
              {result.pagination.totalItems.toLocaleString('es-CO')} usuario(s) · Página {result.pagination.page} de {result.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              {result.pagination.page > 1 ? <Link href={pageHref(filters, result.pagination.page - 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Anterior</Link> : <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">Anterior</span>}
              {result.pagination.page < result.pagination.totalPages ? <Link href={pageHref(filters, result.pagination.page + 1)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm">Siguiente</Link> : <span className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-400">Siguiente</span>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
