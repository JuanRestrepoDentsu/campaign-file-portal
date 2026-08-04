import Link from 'next/link';
import {
  notFound,
} from 'next/navigation';

import {
  ClientForm,
} from '@/features/clients/components/client-form';
import {
  clientIdSchema,
} from '@/features/clients/schemas/client.schema';
import {
  getClient,
} from '@/features/clients/services/get-clients';
import {
  requireRole,
} from '@/shared/auth/authorization';

type EditClientPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function EditClientPage({
  params,
}: EditClientPageProps) {
  await requireRole([
    'super_admin',
  ]);

  const routeParams =
    await params;
  const idValidation =
    clientIdSchema.safeParse(
      routeParams.clientId,
    );

  if (!idValidation.success) {
    notFound();
  }

  const client =
    await getClient(
      idValidation.data,
    );

  if (!client) {
    notFound();
  }

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
            Editar cliente
          </h1>

          <p className="mt-2 text-slate-600">
            Actualiza la información y el estado de {client.name}.
          </p>

          <div className="mt-8">
            <ClientForm
              mode="edit"
              clientId={client.id}
              initialValues={{
                name: client.name,
                code: client.code,
                status:
                  client.status,
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
