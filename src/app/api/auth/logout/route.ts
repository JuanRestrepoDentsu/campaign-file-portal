import {
  RevokeTokenCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { cognitoClient } from '@/shared/auth/cognito';
import {
  AUTH_COOKIE_NAMES,
} from '@/shared/auth/cookies';
import {
  clearAuthenticationCookies,
} from '@/shared/auth/session-cookies';
import { env } from '@/shared/config/env';

export async function POST() {
  const cookieStore = await cookies();

  const refreshToken = cookieStore.get(
    AUTH_COOKIE_NAMES.refreshToken,
  )?.value;

  try {
    if (refreshToken) {
      await cognitoClient.send(
        new RevokeTokenCommand({
          ClientId: env.COGNITO_CLIENT_ID,
          ClientSecret:
            env.COGNITO_CLIENT_SECRET,
          Token: refreshToken,
        }),
      );
    }
  } catch (error) {
    /*
     * Aunque falle Cognito, eliminamos la sesión local.
     * El error queda registrado para seguimiento.
     */
    console.error('Token revocation error:', error);
  }

  const response = NextResponse.json({
    success: true,
  });

  clearAuthenticationCookies(response.cookies);

  return response;
}