import 'server-only';

import { cookies } from 'next/headers';

import { AUTH_COOKIE_NAMES } from '@/shared/auth/cookies';

export class PortalApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'PortalApiError';
  }
}

function apiUrl(path: string): URL {
  const base = process.env.PORTAL_API_URL?.trim();
  if (!base) throw new Error('Falta la variable PORTAL_API_URL.');
  return new URL(path.replace(/^\//, ''), `${base.replace(/\/$/, '')}/`);
}

async function accessToken(): Promise<string> {
  const token = (await cookies()).get(AUTH_COOKIE_NAMES.accessToken)?.value;
  if (!token) throw new PortalApiError(401, 'UNAUTHENTICATED', 'La sesión no es válida.');
  return token;
}

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new PortalApiError(502, 'INVALID_API_RESPONSE', 'La API privada devolvió una respuesta inválida.');
  }
}

export async function portalApi<T>(
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: init.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${await accessToken()}`,
      ...(init.body === undefined ? {} : { 'Content-Type': 'application/json' }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: 'no-store',
  });
  const payload = await parseResponse(response);
  if (!response.ok) {
    const error = payload as { code?: string; message?: string } | null;
    throw new PortalApiError(
      response.status,
      error?.code ?? 'PORTAL_API_ERROR',
      error?.message ?? 'No fue posible comunicarse con la API privada.',
      payload,
    );
  }
  return payload as T;
}

export async function proxyPortalApi(request: Request, path: string): Promise<Response> {
  let token: string;
  try {
    token = await accessToken();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'La sesión no es válida.';
    return Response.json({ code: 'UNAUTHENTICATED', message }, { status: 401 });
  }

  const sourceUrl = new URL(request.url);
  const target = apiUrl(path);
  target.search = sourceUrl.search;
  const method = request.method.toUpperCase();
  const hasBody = !['GET', 'HEAD'].includes(method);
  const body = hasBody ? await request.text() : undefined;
  const response = await fetch(target, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': request.headers.get('content-type') ?? 'application/json' } : {}),
      'User-Agent': request.headers.get('user-agent') ?? 'campaign-file-portal',
    },
    body: body || undefined,
    cache: 'no-store',
  });
  return new Response(response.body, {
    status: response.status,
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': response.headers.get('content-type') ?? 'application/json; charset=utf-8',
    },
  });
}

