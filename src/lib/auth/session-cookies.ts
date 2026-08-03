import type {
  AuthenticationResultType,
} from '@aws-sdk/client-cognito-identity-provider';
import type { ResponseCookies } from
  'next/dist/compiled/@edge-runtime/cookies';

import {
  accessTokenCookie,
  AUTH_COOKIE_NAMES,
  idTokenCookie,
  refreshTokenCookie,
  usernameCookie,
} from '@/lib/auth/cookies';

type CookieStore = Pick<ResponseCookies, 'set' | 'delete'>;

type SetAuthenticationCookiesInput = {
  cookieStore: CookieStore;
  authentication: AuthenticationResultType;
  username: string;
  existingRefreshToken?: string;
};

export function setAuthenticationCookies({
  cookieStore,
  authentication,
  username,
  existingRefreshToken,
}: SetAuthenticationCookiesInput): void {
  if (!authentication.AccessToken || !authentication.IdToken) {
    throw new Error(
      'Cognito no devolvió los tokens requeridos.',
    );
  }

  cookieStore.set(
    AUTH_COOKIE_NAMES.accessToken,
    authentication.AccessToken,
    accessTokenCookie,
  );

  cookieStore.set(
    AUTH_COOKIE_NAMES.idToken,
    authentication.IdToken,
    idTokenCookie,
  );

  /*
   * Cuando se usa REFRESH_TOKEN_AUTH normalmente Cognito
   * devuelve access e ID token, pero no uno nuevo de refresh.
   */
  const refreshToken =
    authentication.RefreshToken ?? existingRefreshToken;

  if (refreshToken) {
    cookieStore.set(
      AUTH_COOKIE_NAMES.refreshToken,
      refreshToken,
      refreshTokenCookie,
    );
  }

  cookieStore.set(
    AUTH_COOKIE_NAMES.username,
    username,
    usernameCookie,
  );
}

export function clearAuthenticationCookies(
  cookieStore: CookieStore,
): void {
  Object.values(AUTH_COOKIE_NAMES).forEach((name) => {
    cookieStore.delete(name);
  });
}