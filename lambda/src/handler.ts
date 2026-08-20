import { ZodError } from 'zod';

import { CampaignServiceError } from '@/features/campaigns/errors/campaign-service-error';
import {
  campaignIdSchema,
  campaignListQuerySchema,
  campaignStatusMutationSchema,
  createCampaignSchema,
  updateCampaignSchema,
} from '@/features/campaigns/schemas/campaign.schema';
import { createCampaign } from '@/features/campaigns/services/create-campaign';
import {
  getCampaign,
  getCampaignFormOptions,
  getCampaigns,
} from '@/features/campaigns/services/get-campaigns';
import {
  changeCampaignStatus,
  updateCampaign,
} from '@/features/campaigns/services/update-campaign';
import { ClientServiceError } from '@/features/clients/errors/client-service-error';
import {
  clientIdSchema,
  clientListQuerySchema,
  createClientSchema,
  updateClientSchema,
} from '@/features/clients/schemas/client.schema';
import { createClient } from '@/features/clients/services/create-client';
import { getClient, getClients } from '@/features/clients/services/get-clients';
import { updateClient } from '@/features/clients/services/update-client';
import { getAdminDashboard } from '@/features/dashboard/services/get-admin-dashboard';
import { UploadServiceError } from '@/features/uploads/errors/upload-service-error';
import {
  findAccessibleCampaign,
  findAccessibleCampaigns,
  findUpload,
  findUploads,
} from '@/features/uploads/repositories/upload.repository';
import {
  campaignIdSchema as uploadCampaignIdSchema,
  completeMultipartSchema,
  initiateUploadSchema,
  uploadIdSchema,
  uploadListSchema,
} from '@/features/uploads/schemas/upload.schema';
import {
  abortLargeUpload,
  completeLargeUpload,
  initiateLargeUpload,
  queueProcessing,
} from '@/features/uploads/services/large-upload';
import { inspectDatabase } from '@/features/uploads/services/schema-inspection';
import { UserServiceError } from '@/features/users/errors/user-service-error';
import {
  findUserByCognitoSub,
  updateUserLastLogin,
} from '@/features/users/repositories/user.repository';
import {
  createUserSchema,
  updateUserSchema,
  userIdSchema,
  userListQuerySchema,
  userStatusMutationSchema,
} from '@/features/users/schemas/user.schema';
import { activateInvitedAuthenticatedUser } from '@/features/users/services/activate-invited-user';
import { changeUserStatus } from '@/features/users/services/change-user-status';
import { createUser } from '@/features/users/services/create-user';
import {
  getUser,
  getUsers,
  getUsersFormOptions,
} from '@/features/users/services/get-users';
import {
  resendUserInvitation,
  signOutUserSessions,
} from '@/features/users/services/user-session-actions';
import { updateUser } from '@/features/users/services/update-user';
import type { AuthenticatedPortalUser } from '@/features/users/repositories/user.repository';
import { db } from '@/shared/database/mysql';

type Headers = Record<string, string | undefined>;

type ApiGatewayEvent = {
  body?: string | null;
  headers?: Headers;
  httpMethod?: string;
  isBase64Encoded?: boolean;
  path?: string;
  queryStringParameters?: Record<string, string | undefined> | null;
  rawPath?: string;
  rawQueryString?: string;
  requestContext?: {
    authorizer?: {
      claims?: Record<string, string | undefined>;
      jwt?: { claims?: Record<string, string | undefined> };
    };
    http?: { method?: string; sourceIp?: string };
    identity?: { sourceIp?: string };
  };
};

type LambdaResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

const responseHeaders = {
  'Cache-Control': 'no-store',
  'Content-Type': 'application/json; charset=utf-8',
  'X-Content-Type-Options': 'nosniff',
};

function json(statusCode: number, body: unknown): LambdaResponse {
  return { statusCode, headers: responseHeaders, body: JSON.stringify(body) };
}

function getHeader(headers: Headers | undefined, name: string): string | undefined {
  const target = name.toLowerCase();
  const entry = Object.entries(headers ?? {}).find(([key]) => key.toLowerCase() === target);
  return entry?.[1];
}

function parseBody(event: ApiGatewayEvent): unknown {
  if (!event.body) return {};
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;
  return JSON.parse(raw);
}

function getMethod(event: ApiGatewayEvent): string {
  return (event.requestContext?.http?.method ?? event.httpMethod ?? 'GET').toUpperCase();
}

function getPath(event: ApiGatewayEvent): string {
  let path = event.rawPath ?? event.path ?? '/';
  const basePath = (process.env.API_BASE_PATH ?? '').replace(/\/$/, '');
  if (basePath && path.startsWith(basePath)) path = path.slice(basePath.length) || '/';
  return path.replace(/\/+$/, '') || '/';
}

function getQuery(event: ApiGatewayEvent): Record<string, string | undefined> {
  if (event.queryStringParameters) return event.queryStringParameters;
  const params = new URLSearchParams(event.rawQueryString ?? '');
  return Object.fromEntries(params.entries());
}

function requestContext(event: ApiGatewayEvent) {
  return {
    ipAddress: (
      event.requestContext?.http?.sourceIp ??
      event.requestContext?.identity?.sourceIp ??
      getHeader(event.headers, 'x-forwarded-for')?.split(',')[0]?.trim() ??
      null
    )?.slice(0, 45) ?? null,
    userAgent: getHeader(event.headers, 'user-agent')?.slice(0, 500) ?? null,
  };
}

async function authenticate(event: ApiGatewayEvent): Promise<AuthenticatedPortalUser> {
  const authorization = getHeader(event.headers, 'authorization');
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new ApiError('UNAUTHENTICATED', 'La sesión no es válida.', 401);

  // API Gateway must validate the token with a Cognito/JWT authorizer before
  // invoking this function. Reading the validated claim here also avoids a
  // public JWKS request from a Lambda that runs in private subnets without NAT.
  const cognitoSub =
    event.requestContext?.authorizer?.jwt?.claims?.sub ??
    event.requestContext?.authorizer?.claims?.sub;
  if (!cognitoSub) {
    throw new ApiError(
      'AUTHORIZER_REQUIRED',
      'La API debe invocar esta función mediante un autorizador de Cognito.',
      401,
    );
  }

  const found = await findUserByCognitoSub(cognitoSub);
  if (!found) {
    throw new ApiError(
      'USER_NOT_REGISTERED',
      'El usuario está autenticado en Cognito, pero no está registrado en el portal.',
      403,
    );
  }
  const user = await activateInvitedAuthenticatedUser(found);
  if (user.status !== 'active') {
    throw new ApiError('USER_DISABLED', 'El usuario no está habilitado.', 403);
  }
  return user;
}

function requireSuperAdmin(user: AuthenticatedPortalUser): void {
  if (user.role !== 'super_admin') {
    throw new ApiError('FORBIDDEN', 'No tienes permisos para esta operación.', 403);
  }
}

class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
  }
}

function errorResponse(error: unknown): LambdaResponse {
  if (
    error instanceof ApiError ||
    error instanceof ClientServiceError ||
    error instanceof CampaignServiceError ||
    error instanceof UserServiceError ||
    error instanceof UploadServiceError
  ) {
    return json(error.status, { code: error.code, message: error.message });
  }
  if (error instanceof ZodError) {
    return json(400, {
      code: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son válidos.',
      errors: error.flatten().fieldErrors,
    });
  }
  if (error instanceof SyntaxError) {
    return json(400, { code: 'INVALID_JSON', message: 'El cuerpo no es JSON válido.' });
  }
  console.error('Portal API error:', error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack,
  } : error);
  return json(500, { code: 'INTERNAL_ERROR', message: 'No fue posible completar la operación.' });
}

async function route(event: ApiGatewayEvent): Promise<LambdaResponse> {
  const method = getMethod(event);
  const path = getPath(event);
  const query = getQuery(event);

  if (method === 'GET' && path === '/health') {
    await db.query('SELECT 1');
    return json(200, { status: 'ok' });
  }

  const user = await authenticate(event);

  if (method === 'GET' && path === '/me') {
    await updateUserLastLogin(user.id);
    return json(200, { authenticated: true, user });
  }
  if (method === 'GET' && path === '/dashboard') {
    requireSuperAdmin(user);
    return json(200, await getAdminDashboard());
  }

  if (path === '/admin/clients') {
    requireSuperAdmin(user);
    if (method === 'GET') return json(200, await getClients(clientListQuerySchema.parse(query)));
    if (method === 'POST') {
      const client = await createClient(createClientSchema.parse(parseBody(event)), {
        actorUserId: user.id,
        requestContext: requestContext(event),
      });
      return json(201, { client });
    }
  }
  const clientMatch = path.match(/^\/admin\/clients\/(\d+)$/);
  if (clientMatch) {
    requireSuperAdmin(user);
    const id = clientIdSchema.parse(clientMatch[1]);
    if (method === 'GET') {
      const client = await getClient(id);
      if (!client) throw new ClientServiceError('CLIENT_NOT_FOUND', 'El cliente no existe.', 404);
      return json(200, { client });
    }
    if (method === 'PATCH') {
      const client = await updateClient(id, updateClientSchema.parse(parseBody(event)), {
        actorUserId: user.id,
        requestContext: requestContext(event),
      });
      return json(200, { client, message: 'Cliente actualizado correctamente.' });
    }
  }

  if (path === '/admin/users/options' && method === 'GET') {
    requireSuperAdmin(user);
    return json(200, await getUsersFormOptions());
  }
  if (path === '/admin/users') {
    requireSuperAdmin(user);
    if (method === 'GET') return json(200, await getUsers(userListQuerySchema.parse(query)));
    if (method === 'POST') {
      const created = await createUser(createUserSchema.parse(parseBody(event)), {
        actorUserId: user.id,
        requestContext: requestContext(event),
      });
      return json(201, { user: created });
    }
  }
  const userActionMatch = path.match(/^\/admin\/users\/(\d+)\/(status|resend-invitation|sign-out)$/);
  if (userActionMatch) {
    requireSuperAdmin(user);
    const id = userIdSchema.parse(userActionMatch[1]);
    const action = userActionMatch[2];
    const options = { actorUserId: user.id, requestContext: requestContext(event) };
    if (method === 'PATCH' && action === 'status') {
      const input = userStatusMutationSchema.parse(parseBody(event));
      await changeUserStatus(id, input.status, options);
      return json(200, { message: 'Estado actualizado correctamente.' });
    }
    if (method === 'POST' && action === 'resend-invitation') {
      await resendUserInvitation(id, options);
      return json(200, { message: 'Invitación reenviada correctamente.' });
    }
    if (method === 'POST' && action === 'sign-out') {
      await signOutUserSessions(id, options);
      return json(200, { message: 'Sesiones cerradas correctamente.' });
    }
  }
  const userMatch = path.match(/^\/admin\/users\/(\d+)$/);
  if (userMatch) {
    requireSuperAdmin(user);
    const id = userIdSchema.parse(userMatch[1]);
    if (method === 'GET') {
      const found = await getUser(id);
      if (!found) throw new UserServiceError('USER_NOT_FOUND', 'El usuario no existe.', 404);
      return json(200, { user: found });
    }
    if (method === 'PATCH') {
      await updateUser(id, updateUserSchema.parse(parseBody(event)), {
        actorUserId: user.id,
        requestContext: requestContext(event),
      });
      return json(200, { message: 'Usuario actualizado correctamente.' });
    }
  }

  if (path === '/admin/campaigns/options' && method === 'GET') {
    requireSuperAdmin(user);
    return json(200, await getCampaignFormOptions());
  }
  if (path === '/admin/campaigns') {
    requireSuperAdmin(user);
    if (method === 'GET') return json(200, await getCampaigns(campaignListQuerySchema.parse(query)));
    if (method === 'POST') {
      const created = await createCampaign(createCampaignSchema.parse(parseBody(event)), {
        actorUserId: user.id,
        requestContext: requestContext(event),
      });
      return json(201, { campaign: created });
    }
  }
  const campaignStatusMatch = path.match(/^\/admin\/campaigns\/(\d+)\/status$/);
  if (campaignStatusMatch) {
    requireSuperAdmin(user);
    if (method === 'PATCH') {
      const id = campaignIdSchema.parse(campaignStatusMatch[1]);
      await changeCampaignStatus(id, campaignStatusMutationSchema.parse(parseBody(event)), {
        actorUserId: user.id,
        requestContext: requestContext(event),
      });
      return json(200, { message: 'Estado actualizado correctamente.' });
    }
  }
  const campaignMatch = path.match(/^\/admin\/campaigns\/(\d+)$/);
  if (campaignMatch) {
    requireSuperAdmin(user);
    const id = campaignIdSchema.parse(campaignMatch[1]);
    if (method === 'GET') {
      const campaign = await getCampaign(id);
      if (!campaign) throw new CampaignServiceError('CAMPAIGN_NOT_FOUND', 'La campaña no existe.', 404);
      return json(200, { campaign });
    }
    if (method === 'PATCH') {
      await updateCampaign(id, updateCampaignSchema.parse(parseBody(event)), {
        actorUserId: user.id,
        requestContext: requestContext(event),
      });
      return json(200, { message: 'Campaña actualizada correctamente.' });
    }
  }

  if (path === '/uploads/options' && method === 'GET') {
    return json(200, { campaigns: await findAccessibleCampaigns(user) });
  }
  if (path === '/uploads') {
    if (method === 'GET') {
      const filters = uploadListSchema.parse(query);
      return json(200, { ...(await findUploads(user, filters.page, filters.pageSize)), ...filters });
    }
  }
  if (path === '/uploads/initiate' && method === 'POST') {
    return json(201, await initiateLargeUpload(user, initiateUploadSchema.parse(parseBody(event))));
  }
  const schemaMatch = path.match(/^\/uploads\/campaigns\/(\d+)\/schema$/);
  if (schemaMatch && method === 'GET') {
    const id = uploadCampaignIdSchema.parse(schemaMatch[1]);
    const campaign = await findAccessibleCampaign(user, id);
    if (!campaign) throw new UploadServiceError('CAMPAIGN_NOT_AVAILABLE', 'La campaña no está disponible.', 403);
    const catalog = await inspectDatabase(campaign.code, id);
    if (user.role === 'client_user') {
      if (!catalog.configurations.length) {
        throw new UploadServiceError('CONFIGURATION_REQUIRED', 'Un administrador debe configurar primero esta campaña.', 409);
      }
      const allowed = new Set(catalog.configurations.map((configuration) => configuration.targetTable));
      catalog.tables = catalog.tables.filter((table) => allowed.has(table.table));
    }
    return json(200, catalog);
  }
  const uploadActionMatch = path.match(/^\/uploads\/(\d+)\/(complete|confirm|abort)$/);
  if (uploadActionMatch && method === 'POST') {
    const id = uploadIdSchema.parse(uploadActionMatch[1]);
    if (uploadActionMatch[2] === 'complete') {
      const input = completeMultipartSchema.parse(parseBody(event));
      return json(202, await completeLargeUpload(user, id, input.parts));
    }
    if (uploadActionMatch[2] === 'confirm') {
      return json(202, await queueProcessing(user, id));
    }
    await abortLargeUpload(user, id);
    return json(200, { message: 'Carga cancelada.' });
  }
  const uploadMatch = path.match(/^\/uploads\/(\d+)$/);
  if (uploadMatch && method === 'GET') {
    const id = uploadIdSchema.parse(uploadMatch[1]);
    const upload = await findUpload(user, id);
    if (!upload) throw new UploadServiceError('UPLOAD_NOT_FOUND', 'La carga no existe.', 404);
    return json(200, { upload });
  }

  throw new ApiError('NOT_FOUND', 'La ruta solicitada no existe.', 404);
}

export async function handler(event: ApiGatewayEvent): Promise<LambdaResponse> {
  try {
    return await route(event);
  } catch (error) {
    return errorResponse(error);
  }
}
