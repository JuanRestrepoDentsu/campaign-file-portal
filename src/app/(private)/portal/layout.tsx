import type { ReactNode } from 'react';

import { PrivateHeader } from '@/shared/components/layout/private-header';
import { requireAuthenticatedUser } from '@/shared/auth/authorization';

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireAuthenticatedUser();

  const fullName =
    [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ') || user.email;

  return (
    <div className="min-h-screen bg-slate-50">
      <PrivateHeader
        userName={fullName}
        isAdmin={user.role === 'super_admin'}
      />

      {children}
    </div>
  );
}