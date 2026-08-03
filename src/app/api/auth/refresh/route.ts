import {
  InitiateAuthCommand,
  NotAuthorizedException,
} from '@aws-sdk/client-cognito-identity-provider';
import { cookies } from 'next/headers';
import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { cognitoClient } from '@/lib/auth/cognito';
import {
  AUTH_COOKIE_NAMES,
} from '@/lib/auth/cookies';
import {
  generateSecretHash,
} from '@/lib/auth/secret-hash';
import {
  clearAuthenticationCookies,
  setAuthenticationCookies,
} from '@/lib/auth/session-cookies';
import { env } from '@/lib/env';

function getSafeReturnPath(
  request: NextRequest,
): string {
  const value = request.nextUrl.searchParams.get(
    'returnTo',
  );

  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//')
  ) {
    return '/portal';
  }

  return value;
}

export async function POST() {
  return refreshSession();
}

export async function GET(request: NextRequest) {
  const result = await refreshSession();

  if (!result.ok) {
    const loginUrl = new URL(
      '/login',
      request.url,
    );

    loginUrl.searchParams.set(
      'error',
      'session_expired',
    );

    const response = NextResponse.redirect(loginUrl);

    clearAuthenticationCookies(response.cookies);

    return response;
  }

  const redirectUrl = new URL(
    getSafeReturnPath(request),
    request.url,
  );

  /*
   * Copiamos los Set-Cookie producidos por la renovación
   * a la respuesta de redirección.
   */
  const response = NextResponse.redirect(redirectUrl);

  result.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie);
  });

  return response;
}

async function refreshSession(): Promise<NextResponse> {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get(
    AUTH_COOKIE_NAMES.refreshToken,
  )?.value;

  const username = cookieStore.get(
    AUTH_COOKIE_NAMES.username,
  )?.value;

  if (!refreshToken || !username) {
    const response = NextResponse.json(
      {
        refreshed: false,
        message: 'No existe una sesión renovable.',
      },
      { status: 401 },
    );

    clearAuthenticationCookies(response.cookies);

    return response;
  }

  try {
    const result = await cognitoClient.send(
      new InitiateAuthCommand({
        ClientId: env.COGNITO_CLIENT_ID,
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
          SECRET_HASH:
            generateSecretHash(username),
        },
      }),
    );

    if (!result.AuthenticationResult) {
      throw new Error(
        'Cognito no devolvió tokens renovados.',
      );
    }

    const response = NextResponse.json({
      refreshed: true,
    });

    setAuthenticationCookies({
      cookieStore: response.cookies,
      authentication: result.AuthenticationResult,
      username,
      existingRefreshToken: refreshToken,
    });

    return response;
  } catch (error) {
    console.error('Refresh session error:', error);

    const status =
      error instanceof NotAuthorizedException
        ? 401
        : 500;

    const response = NextResponse.json(
      {
        refreshed: false,
        message:
          status === 401
            ? 'La sesión expiró o fue revocada.'
            : 'No fue posible renovar la sesión.',
      },
      { status },
    );

    clearAuthenticationCookies(response.cookies);

    return response;
  }
}