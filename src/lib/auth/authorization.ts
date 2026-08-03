import { redirect } from 'next/navigation';

import {
  getAuthenticatedSession,
} from '@/lib/auth/get-session';
import {
  findUserByCognitoSub,
  type AuthenticatedPortalUser,
  type PortalUserRole,
} from '@/modules/users/user.repository';

export async function requireAuthenticatedUser():
  Promise<AuthenticatedPortalUser> {
  const session =
    await getAuthenticatedSession();

  if (!session) {
    redirect('/login?error=session_expired');
  }

  const user = await findUserByCognitoSub(
    session.cognitoSub,
  );

  if (!user) {
    redirect('/login?error=user_not_registered');
  }

  if (user.status !== 'active') {
    redirect('/login?error=account_unavailable');
  }

  return user;
}

export async function requireRole(
  allowedRoles: PortalUserRole[],
): Promise<AuthenticatedPortalUser> {
  const user =
    await requireAuthenticatedUser();

  if (!allowedRoles.includes(user.role)) {
    redirect('/forbidden');
  }

  return user;
}