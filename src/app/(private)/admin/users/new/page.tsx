import Link from 'next/link';

import { UserForm } from '@/features/users/components/user-form';
import { getRemoteUserOptions } from '@/shared/api/portal-data';
import { requireRole } from '@/shared/auth/authorization';

export default async function NewUserPage() {
  const [, options] = await Promise.all([
    requireRole(['super_admin']),
    getRemoteUserOptions(),
  ]);
  return (
    <main className="px-6 py-8 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/users" className="text-sm font-medium text-slate-600 hover:text-slate-950">← Volver a usuarios</Link>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Nuevo usuario</h1>
          <p className="mt-2 text-slate-600">Crea la identidad en Cognito y envía la invitación por correo.</p>
          <div className="mt-8"><UserForm mode="create" options={options} /></div>
        </div>
      </div>
    </main>
  );
}
