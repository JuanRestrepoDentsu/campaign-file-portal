import type { ResponseCookie } from
  'next/dist/compiled/@edge-runtime/cookies';

const isProduction = process.env.NODE_ENV === 'production';

const baseCookie: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax',
  path: '/',
};

export const accessTokenCookie: Partial<ResponseCookie> = {
  ...baseCookie,
  maxAge: 60 * 60,
};

export const idTokenCookie: Partial<ResponseCookie> = {
  ...baseCookie,
  maxAge: 60 * 60,
};

export const refreshTokenCookie: Partial<ResponseCookie> = {
  ...baseCookie,
  maxAge: 60 * 60 * 24 * 7,
};

export const usernameCookie: Partial<ResponseCookie> = {
  ...baseCookie,
  maxAge: 60 * 60 * 24 * 7,
};

export const challengeCookie: Partial<ResponseCookie> = {
  ...baseCookie,
  sameSite: 'strict',
  maxAge: 60 * 5,
};

export const AUTH_COOKIE_NAMES = {
  accessToken: 'access_token',
  idToken: 'id_token',
  refreshToken: 'refresh_token',
  username: 'cognito_username',
  challengeSession: 'cognito_challenge_session',
  challengeUsername: 'cognito_challenge_username',
} as const;