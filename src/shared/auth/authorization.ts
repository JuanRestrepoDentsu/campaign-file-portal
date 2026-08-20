import { cache } from 'react';
import { redirect } from 'next/navigation';

import type {
  AuthenticatedPortalUser,
  PortalUserRole,
} from '@/features/users/repositories/user.repository';
import { getRemoteCurrentUser } from '@/shared/api/portal-data';
import { getAuthenticatedSession } from '@/shared/auth/get-session';

async function getRequiredAuthenticatedUser(): Promise<AuthenticatedPortalUser> {
  const session = await getAuthenticatedSession();
  if (!session) redirect('/login?error=session_expired');

  try {
    return await getRemoteCurrentUser();
  } catch {
    redirect('/login?error=account_unavailable');
  }
}

export const requireAuthenticatedUser = cache(getRequiredAuthenticatedUser);

export async function requireRole(
  allowedRoles: PortalUserRole[],
): Promise<AuthenticatedPortalUser> {
  const user = await requireAuthenticatedUser();
  if (!allowedRoles.includes(user.role)) redirect('/forbidden');
  return user;
}
