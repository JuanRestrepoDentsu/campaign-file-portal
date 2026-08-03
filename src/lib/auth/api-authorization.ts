import { NextResponse } from 'next/server';

import {
  getAuthenticatedSession,
} from '@/lib/auth/get-session';
import {
  findUserByCognitoSub,
  type AuthenticatedPortalUser,
  type PortalUserRole,
} from '@/modules/users/user.repository';

type ApiAuthorizationResult =
  | {
      authorized: true;
      user: AuthenticatedPortalUser;
    }
  | {
      authorized: false;
      response: NextResponse;
    };

export async function authorizeApiRoles(
  allowedRoles: PortalUserRole[],
): Promise<ApiAuthorizationResult> {
  const session =
    await getAuthenticatedSession();

  if (!session) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          message: 'La sesión no es válida.',
        },
        { status: 401 },
      ),
    };
  }

  const user = await findUserByCognitoSub(
    session.cognitoSub,
  );

  if (!user || user.status !== 'active') {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          message:
            'El usuario no está habilitado.',
        },
        { status: 403 },
      ),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          message:
            'No tienes permisos para esta operación.',
        },
        { status: 403 },
      ),
    };
  }

  return {
    authorized: true,
    user,
  };
}