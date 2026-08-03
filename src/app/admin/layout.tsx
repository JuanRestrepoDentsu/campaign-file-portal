import { PrivateHeader } from '@/components/layout/private-header';
import { requireRole } from '@/lib/auth/authorization';

type AdminLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function AdminLayout({
  children,
}: AdminLayoutProps) {
  const user = await requireRole([
    'super_admin',
  ]);

  const fullName = [
    user.firstName,
    user.lastName,
  ]
    .filter(Boolean)
    .join(' ');

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