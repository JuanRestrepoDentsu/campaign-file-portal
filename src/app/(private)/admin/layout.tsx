import type { ReactNode } from 'react';

import { PrivateHeader } from '@/shared/components/layout/private-header';
import { requireRole } from '@/shared/auth/authorization';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireRole([
    'super_admin',
  ]);

  const fullName =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ') || user.email;

  return (
    <div className="min-h-screen bg-slate-50">
      <PrivateHeader
        userName={fullName}
        isAdmin
      />

      {children}
    </div>
  );
}