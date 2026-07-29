import {
  InitiateAuthCommand,
  NotAuthorizedException,
  UserNotConfirmedException,
} from '@aws-sdk/client-cognito-identity-provider';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { cognitoClient } from '@/lib/auth/cognito';
import {
  accessTokenCookie,
  challengeCookie,
  idTokenCookie,
  refreshTokenCookie,
} from '@/lib/auth/cookies';
import { generateSecretHash } from '@/lib/auth/secret-hash';
import { env } from '@/lib/env';

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
        'cognito_challenge_session',
        result.Session,
        challengeCookie,
      );

      cookieStore.set(
        'cognito_challenge_username',
        username,
        challengeCookie,
      );

      return NextResponse.json({
        challenge: 'NEW_PASSWORD_REQUIRED',
      });
    }

    const authentication = result.AuthenticationResult;

    if (
      !authentication?.AccessToken ||
      !authentication.IdToken ||
      !authentication.RefreshToken
    ) {
      return NextResponse.json(
        { message: 'Cognito no devolvió una sesión válida.' },
        { status: 500 },
      );
    }

    cookieStore.set(
      'access_token',
      authentication.AccessToken,
      accessTokenCookie,
    );

    cookieStore.set(
      'id_token',
      authentication.IdToken,
      idTokenCookie,
    );

    cookieStore.set(
      'refresh_token',
      authentication.RefreshToken,
      refreshTokenCookie,
    );

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