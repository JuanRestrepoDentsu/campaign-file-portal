import { NextResponse } from 'next/server';

import { getAuditRequestContext } from '@/features/audit/services/create-audit-log';
import {
  userServiceErrorResponse,
  userValidationResponse,
} from '@/features/users/http/user-api-response';
import {
  createUserSchema,
  userListQuerySchema,
} from '@/features/users/schemas/user.schema';
import { createUser } from '@/features/users/services/create-user';
import { getUsers } from '@/features/users/services/get-users';
import { authorizeApiRoles } from '@/shared/auth/api-authorization';

export async function GET(request: Request) {
  const authorization = await authorizeApiRoles(['super_admin']);
  if (!authorization.authorized) return authorization.response;

  const url = new URL(request.url);
  const validation = userListQuerySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    pageSize: url.searchParams.get('pageSize') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
    role: url.searchParams.get('role') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    clientId: url.searchParams.get('clientId') ?? undefined,
  });
  if (!validation.success) return userValidationResponse(validation.error);

  try {
    return NextResponse.json(await getUsers(validation.data));
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { message: 'No fue posible consultar los usuarios.' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const authorization = await authorizeApiRoles(['super_admin']);
  if (!authorization.authorized) return authorization.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'El cuerpo de la solicitud no es JSON válido.' },
      { status: 400 },
    );
  }

  const validation = createUserSchema.safeParse(body);
  if (!validation.success) return userValidationResponse(validation.error);

  try {
    const user = await createUser(validation.data, {
      actorUserId: authorization.user.id,
      requestContext: getAuditRequestContext(request),
    });
    return NextResponse.json(
      { message: 'Usuario creado e invitación enviada.', user },
      { status: 201 },
    );
  } catch (error) {
    const controlled = userServiceErrorResponse(error);
    if (controlled) return controlled;
    console.error('Create user error:', error);
    return NextResponse.json(
      { message: 'No fue posible crear el usuario.' },
      { status: 500 },
    );
  }
}
