import {
  NextRequest,
  NextResponse,
} from 'next/server';

const PRIVATE_PATHS = [
  '/portal',
  '/admin',
];

const AUTH_PATHS = [
  '/login',
  '/complete-password',
];

// const SESSION_COOKIE_NAMES = [
//   'access_token',
//   'id_token',
//   'refresh_token',
//   'cognito_username',
//   'cognito_challenge_session',
//   'cognito_challenge_username',
// ];

// function clearSessionCookies(response: NextResponse): void {
//   SESSION_COOKIE_NAMES.forEach((name) => {
//     response.cookies.set({
//       name,
//       value: '',
//       expires: new Date(0),
//       path: '/',
//     });
//   });
// }

function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHS.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`),
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (path) =>
      pathname === path ||
      pathname.startsWith(`${path}/`),
  );
}

function readTokenExpiration(
  token: string,
): number | null {
  try {
    const [, encodedPayload] = token.split('.');

    if (!encodedPayload) {
      return null;
    }

    const normalized = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const payload = JSON.parse(
      atob(normalized),
    ) as {
      exp?: number;
    };

    return typeof payload.exp === 'number'
      ? payload.exp
      : null;
  } catch {
    return null;
  }
}

function buildRefreshUrl(
  request: NextRequest,
): URL {
  const url = new URL(
    '/api/auth/refresh',
    request.url,
  );

  url.searchParams.set(
    'returnTo',
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return url;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get(
    'access_token',
  )?.value;

  const refreshToken = request.cookies.get(
    'refresh_token',
  )?.value;

  if (isPrivatePath(pathname)) {
    if (!accessToken) {
      if (refreshToken) {
        return NextResponse.redirect(
          buildRefreshUrl(request),
        );
      }

      const loginUrl = new URL(
        '/login',
        request.url,
      );

      loginUrl.searchParams.set(
        'returnTo',
        `${pathname}${request.nextUrl.search}`,
      );

      return NextResponse.redirect(loginUrl);
    }

    const expiresAt = readTokenExpiration(
      accessToken,
    );

    const now = Math.floor(Date.now() / 1000);

    /*
     * Renovamos si el token expiró o si faltan menos
     * de 60 segundos para su vencimiento.
     */
    if (
      !expiresAt ||
      expiresAt <= now + 60
    ) {
      if (refreshToken) {
        return NextResponse.redirect(
          buildRefreshUrl(request),
        );
      }

      return NextResponse.redirect(
        new URL(
          '/login?error=session_expired',
          request.url,
        ),
      );
    }
  }

  /*
   * Si ya existe un access token, evitamos volver
   * al login. La validación completa ocurre después.
   */
  if (isAuthPath(pathname)) {
    const authenticationError =
      request.nextUrl.searchParams.get('error');

    /*
    * Si /portal detectó que la cuenta o la API no están
    * disponibles, permitimos mostrar el login y eliminamos
    * la sesión local. Esto evita el ciclo:
    *
    * /portal -> /login?error=... -> /portal
    */
    if (authenticationError) {
      return NextResponse.next();
    }

    if (accessToken) {
      return NextResponse.redirect(
        new URL('/portal', request.url),
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/portal/:path*',
    '/admin/:path*',
    '/login',
    '/complete-password',
  ],
};