import { NextResponse } from 'next/server';

import type {
  AuthenticatedPortalUser,
  PortalUserRole,
} from '@/features/users/repositories/user.repository';
import { findUserByCognitoSub } from '@/features/users/repositories/user.repository';
import { activateInvitedAuthenticatedUser } from '@/features/users/services/activate-invited-user';
import { getAuthenticatedSession } from '@/shared/auth/get-session';

type Result =
  | { authorized: true; user: AuthenticatedPortalUser }
  | { authorized: false; response: NextResponse };

export async function authorizeApiRoles(
  allowedRoles: PortalUserRole[],
): Promise<Result> {
  const session = await getAuthenticatedSession();
  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json({ message: 'La sesión no es válida.' }, { status: 401 }),
    };
  }

  const found = await findUserByCognitoSub(session.cognitoSub);
  if (!found) {
    return {
      authorized: false,
      response: NextResponse.json({ message: 'El usuario no está registrado.' }, { status: 403 }),
    };
  }
  const user = await activateInvitedAuthenticatedUser(found);
  if (user.status !== 'active' || !allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json({ message: 'No tienes permisos para esta operación.' }, { status: 403 }),
    };
  }
  return { authorized: true, user };
}
