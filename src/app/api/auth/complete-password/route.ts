import {
  NotAuthorizedException,
  RespondToAuthChallengeCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { cognitoClient } from '@/lib/auth/cognito';
import {
  accessTokenCookie,
  idTokenCookie,
  refreshTokenCookie,
} from '@/lib/auth/cookies';
import { generateSecretHash } from '@/lib/auth/secret-hash';
import { env } from '@/lib/env';

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(10, 'La contraseña debe tener al menos 10 caracteres.')
      .regex(/[a-z]/, 'Debe incluir una letra minúscula.')
      .regex(/[A-Z]/, 'Debe incluir una letra mayúscula.')
      .regex(/[0-9]/, 'Debe incluir un número.')
      .regex(
        /[^a-zA-Z0-9]/,
        'Debe incluir un carácter especial.',
      ),
    confirmation: z.string(),
  })
  .refine((values) => values.password === values.confirmation, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmation'],
  });

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const validation = passwordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: 'Revisa la nueva contraseña.',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const cookieStore = await cookies();

    const session = cookieStore.get(
      'cognito_challenge_session',
    )?.value;

    const username = cookieStore.get(
      'cognito_challenge_username',
    )?.value;

    if (!session || !username) {
      return NextResponse.json(
        {
          message:
            'La sesión de activación expiró. Inicia sesión nuevamente.',
        },
        { status: 401 },
      );
    }

    const command = new RespondToAuthChallengeCommand({
      ClientId: env.COGNITO_CLIENT_ID,
      ChallengeName: 'NEW_PASSWORD_REQUIRED',
      Session: session,
      ChallengeResponses: {
        USERNAME: username,
        NEW_PASSWORD: validation.data.password,
        SECRET_HASH: generateSecretHash(username),
      },
    });

    const result = await cognitoClient.send(command);
    const authentication = result.AuthenticationResult;

    if (
      !authentication?.AccessToken ||
      !authentication.IdToken ||
      !authentication.RefreshToken
    ) {
      return NextResponse.json(
        { message: 'No fue posible completar la activación.' },
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

    cookieStore.delete('cognito_challenge_session');
    cookieStore.delete('cognito_challenge_username');

    return NextResponse.json({
      authenticated: true,
    });
  } catch (error) {
    console.error('Complete password error:', error);

    if (error instanceof NotAuthorizedException) {
      return NextResponse.json(
        {
          message:
            'La sesión de activación expiró. Inicia sesión nuevamente.',
        },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { message: 'No fue posible establecer la contraseña.' },
      { status: 500 },
    );
  }
}