import Link from 'next/link';
import { notFound } from 'next/navigation';

import { UserForm } from '@/features/users/components/user-form';
import { userIdSchema } from '@/features/users/schemas/user.schema';
import { getUser, getUsersFormOptions } from '@/features/users/services/get-users';
import { requireRole } from '@/shared/auth/authorization';

type Props = { params: Promise<{ userId: string }> };

export default async function EditUserPage({ params }: Props) {
  await requireRole(['super_admin']);
  const id = userIdSchema.safeParse((await params).userId);
  if (!id.success) notFound();
  const [user, options] = await Promise.all([
    getUser(id.data),
    getUsersFormOptions(),
  ]);
  if (!user) notFound();

  return (
    <main className="px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/users" className="text-sm font-medium text-slate-600 hover:text-slate-950">← Volver a usuarios</Link>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Editar usuario</h1>
          <p className="mt-2 text-slate-600">Actualiza sus datos empresariales, rol y asignaciones.</p>
          <div className="mt-8">
            <UserForm
              mode="edit"
              userId={user.id}
              options={options}
              initialValues={{
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName ?? '',
                role: user.role,
                clientId: user.client ? String(user.client.id) : '',
                campaignIds: user.campaigns.map((campaign) => campaign.id),
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
