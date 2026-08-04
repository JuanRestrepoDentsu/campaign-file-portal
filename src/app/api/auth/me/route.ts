import { NextResponse } from 'next/server';

import {
  findUserByCognitoSub,
  updateUserLastLogin,
} from '@/features/users/repositories/user.repository';
import { activateInvitedAuthenticatedUser } from '@/features/users/services/activate-invited-user';
import { getAuthenticatedSession } from '@/shared/auth/get-session';

export async function GET() {
  try {
    const session = await getAuthenticatedSession();
    if (!session) {
      return NextResponse.json(
        { authenticated: false, message: 'La sesión no es válida o expiró.' },
        { status: 401 },
      );
    }

    const found = await findUserByCognitoSub(session.cognitoSub);
    if (!found) {
      return NextResponse.json(
        {
          authenticated: false,
          code: 'USER_NOT_REGISTERED',
          message: 'El usuario está autenticado en Cognito, pero no está registrado en el portal.',
        },
        { status: 403 },
      );
    }

    const user = await activateInvitedAuthenticatedUser(found);
    if (user.status !== 'active') {
      return NextResponse.json(
        {
          authenticated: false,
          code: 'USER_DISABLED',
          message: 'El usuario no está habilitado para ingresar al portal.',
        },
        { status: 403 },
      );
    }

    await updateUserLastLogin(user.id);
    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: [user.firstName, user.lastName].filter(Boolean).join(' '),
        role: user.role,
        client: user.client,
        campaigns: user.campaigns,
      },
    });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { authenticated: false, message: 'No fue posible consultar la sesión del usuario.' },
      { status: 500 },
    );
  }
}
