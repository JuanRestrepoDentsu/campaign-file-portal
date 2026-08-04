import { cache } from 'react';
import { redirect } from 'next/navigation';

import type {
  AuthenticatedPortalUser,
  PortalUserRole,
} from '@/features/users/repositories/user.repository';
import { findUserByCognitoSub } from '@/features/users/repositories/user.repository';
import { activateInvitedAuthenticatedUser } from '@/features/users/services/activate-invited-user';
import { getAuthenticatedSession } from '@/shared/auth/get-session';

async function getRequiredAuthenticatedUser(): Promise<AuthenticatedPortalUser> {
  const session = await getAuthenticatedSession();
  if (!session) redirect('/login?error=session_expired');

  const found = await findUserByCognitoSub(session.cognitoSub);
  if (!found) redirect('/login?error=user_not_registered');

  const user = await activateInvitedAuthenticatedUser(found);
  if (user.status !== 'active') {
    redirect('/login?error=account_unavailable');
  }
  return user;
}

export const requireAuthenticatedUser = cache(getRequiredAuthenticatedUser);

export async function requireRole(
  allowedRoles: PortalUserRole[],
): Promise<AuthenticatedPortalUser> {
  const user = await requireAuthenticatedUser();
  if (!allowedRoles.includes(user.role)) redirect('/forbidden');
  return user;
}
