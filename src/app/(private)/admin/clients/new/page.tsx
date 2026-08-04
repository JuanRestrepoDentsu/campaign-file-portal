import Link from 'next/link';

import {
  ClientForm,
} from '@/features/clients/components/client-form';
import {
  requireRole,
} from '@/shared/auth/authorization';

export default async function NewClientPage() {
  await requireRole([
    'super_admin',
  ]);

  return (
    <main className="px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/clients"
          className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
        >
          ← Volver a clientes
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">
            Nuevo cliente
          </h1>

          <p className="mt-2 text-slate-600">
            Registra una organización para asociarle usuarios y campañas.
          </p>

          <div className="mt-8">
            <ClientForm mode="create" />
          </div>
        </div>
      </div>
    </main>
  );
}
