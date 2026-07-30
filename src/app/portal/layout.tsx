import { redirect } from 'next/navigation';

import { getAuthenticatedSession } from '@/lib/auth/get-session';
import { findUserByCognitoSub } from '@/modules/users/user.repository';

type PortalLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default async function PortalLayout({
  children,
}: PortalLayoutProps) {
  const session = await getAuthenticatedSession();

  if (!session) {
    redirect('/login');
  }

  const user = await findUserByCognitoSub(
    session.cognitoSub,
  );

  if (!user || user.status !== 'active') {
    redirect('/login?error=account_unavailable');
  }

  return children;
}