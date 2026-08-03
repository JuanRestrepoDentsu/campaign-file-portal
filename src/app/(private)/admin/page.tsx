import {
  requireRole,
} from '@/shared/auth/authorization';

export default async function AdminPage() {
  const user = await requireRole([
    'super_admin',
  ]);

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <div className="mx-auto max-w-6xl rounded-2xl border bg-white p-8">
        <h1 className="text-2xl font-semibold">
          Administración
        </h1>

        <p className="mt-2 text-slate-600">
          Bienvenido, {user.firstName}.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <a
            href="/admin/clients"
            className="rounded-xl border p-5 hover:bg-slate-50"
          >
            <h2 className="font-semibold">
              Clientes
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Administrar empresas y organizaciones.
            </p>
          </a>

          <a
            href="/admin/users"
            className="rounded-xl border p-5 hover:bg-slate-50"
          >
            <h2 className="font-semibold">
              Usuarios
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Crear usuarios y asignar permisos.
            </p>
          </a>

          <a
            href="/admin/campaigns"
            className="rounded-xl border p-5 hover:bg-slate-50"
          >
            <h2 className="font-semibold">
              Campañas
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Configurar campañas disponibles.
            </p>
          </a>
        </div>
      </div>
    </main>
  );
}