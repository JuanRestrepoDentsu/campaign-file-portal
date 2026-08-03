import {
  InitiateAuthCommand,
  NotAuthorizedException,
  UserNotConfirmedException,
} from '@aws-sdk/client-cognito-identity-provider';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { cognitoClient } from '@/shared/auth/cognito';
import {
  challengeCookie,
  AUTH_COOKIE_NAMES,
} from '@/shared/auth/cookies';
import { generateSecretHash } from '@/shared/auth/secret-hash';
import { env } from '@/shared/config/env';
import {
  setAuthenticationCookies,
} from '@/shared/auth/session-cookies';
import {
  readAccessTokenPayload,
} from '@/shared/auth/token-payload';

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: 'Ingresa un correo y una contraseña válidos.',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const email = validation.data.email.toLowerCase();
    const password = validation.data.password;

    const command = new InitiateAuthCommand({
      ClientId: env.COGNITO_CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: generateSecretHash(email),
      },
    });

    const result = await cognitoClient.send(command);
    const cookieStore = await cookies();

    if (result.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
      if (!result.Session) {
        return NextResponse.json(
          { message: 'Cognito no devolvió una sesión de activación.' },
          { status: 500 },
        );
      }

      const username =
        result.ChallengeParameters?.USER_ID_FOR_SRP ??
        result.ChallengeParameters?.USERNAME ??
        email;

      cookieStore.set(
        AUTH_COOKIE_NAMES.challengeSession,
        result.Session,
        challengeCookie,
      );

      cookieStore.set(
        AUTH_COOKIE_NAMES.challengeUsername,
        username,
        challengeCookie,
      );

      return NextResponse.json({
        challenge: 'NEW_PASSWORD_REQUIRED',
      });
    }

    const authentication = result.AuthenticationResult;

    if (!authentication) {
      return NextResponse.json(
        {
          message: 'Cognito no devolvió una sesión válida.',
        },
        { status: 500 },
      );
    }

    if (!authentication.AccessToken) {
      return NextResponse.json(
        { message: 'No fue posible obtener el AccessToken de Cognito.' },
        { status: 500 },
      );
    }

    const tokenPayload = readAccessTokenPayload(authentication.AccessToken);

    const cognitoUsername =
      tokenPayload?.username ?? email;

    setAuthenticationCookies({
      cookieStore,
      authentication,
      username: cognitoUsername,
    });

    return NextResponse.json({
      authenticated: true,
    });
  } catch (error) {
    console.error('Login error:', error);

    if (
      error instanceof NotAuthorizedException ||
      error instanceof UserNotConfirmedException
    ) {
      return NextResponse.json(
        { message: 'Correo o contraseña incorrectos.' },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { message: 'No fue posible iniciar sesión.' },
      { status: 500 },
    );
  }
}