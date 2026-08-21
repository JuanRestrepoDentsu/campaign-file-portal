import { cache } from 'react';
import { redirect } from 'next/navigation';
import { PortalApiError } from '@/shared/api/portal-api-client';

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
  } catch (error) {
    console.error(
      'Remote current user validation failed:',
      error,
    );

    if (error instanceof PortalApiError) {
      if (error.status === 401) {
        redirect('/login?error=session_expired');
      }

      if (
        error.status === 403 &&
        [
          'USER_NOT_REGISTERED',
          'USER_DISABLED',
          'FORBIDDEN',
        ].includes(error.code)
      ) {
        redirect('/login?error=account_unavailable');
      }
    }

    /*
    * Un 403 genérico de API Gateway/WAF no significa
    * necesariamente que la cuenta esté deshabilitada.
    */
    redirect('/login?error=service_unavailable');
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
