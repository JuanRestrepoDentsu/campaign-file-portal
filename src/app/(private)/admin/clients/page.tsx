import Link from 'next/link';

export default function ClientsPage() {
  return (
    <main className="px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Administración
            </p>

            <h1 className="mt-1 text-3xl font-semibold text-slate-950">
              Clientes
            </h1>
          </div>

          <Link
            href="/admin/clients/new"
            className="rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
          >
            Nuevo cliente
          </Link>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-800">
            El módulo de clientes está listo para comenzar
          </p>

          <p className="mt-1 text-sm text-slate-500">
            En el siguiente bloque construiremos su listado,
            formulario y operaciones.
          </p>
        </div>
      </div>
    </main>
  );
}