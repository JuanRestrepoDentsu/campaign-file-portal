import { cookies } from 'next/headers';

import { accessTokenVerifier } from '@/shared/auth/jwt-verifier';

export type AuthenticatedSession = {
  cognitoSub: string;
  username: string;
  groups: string[];
  expiresAt: number;
};

export async function getAuthenticatedSession():
  Promise<AuthenticatedSession | null> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token')?.value;

  if (!accessToken) {
    return null;
  }

  try {
    const payload =
      await accessTokenVerifier.verify(accessToken);

    return {
      cognitoSub: payload.sub,
      username: payload.username,
      groups: normalizeGroups(payload['cognito:groups']),
      expiresAt: payload.exp,
    };
  } catch (error) {
    console.error('Access token verification failed:', error);
    return null;
  }
}

function normalizeGroups(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (group): group is string =>
      typeof group === 'string',
  );
}