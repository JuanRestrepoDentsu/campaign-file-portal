import Link from 'next/link';

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl border bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold">
          Acceso no autorizado
        </h1>

        <p className="mt-3 text-slate-600">
          Tu cuenta no tiene permisos para ingresar
          a esta sección.
        </p>

        <Link
          href="/portal"
          className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white"
        >
          Volver al portal
        </Link>
      </div>
    </main>
  );
}