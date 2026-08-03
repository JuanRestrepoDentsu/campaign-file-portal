import { redirect } from 'next/navigation';

import {
  getAuthenticatedSession,
} from '@/shared/auth/get-session';
import {
  findUserByCognitoSub,
  type AuthenticatedPortalUser,
  type PortalUserRole,
} from '@/features/users/repositories/user.repository';
import { cache } from 'react';

async function getRequiredAuthenticatedUser():
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

export const requireAuthenticatedUser = cache(
  getRequiredAuthenticatedUser,
);

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