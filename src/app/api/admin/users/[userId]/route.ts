import { NextResponse } from 'next/server';

import { getAuditRequestContext } from '@/features/audit/services/create-audit-log';
import {
  userServiceErrorResponse,
  userValidationResponse,
} from '@/features/users/http/user-api-response';
import {
  updateUserSchema,
  userIdSchema,
} from '@/features/users/schemas/user.schema';
import { getUser } from '@/features/users/services/get-users';
import { updateUser } from '@/features/users/services/update-user';
import { authorizeApiRoles } from '@/shared/auth/api-authorization';

type Context = { params: Promise<{ userId: string }> };

export async function GET(_request: Request, context: Context) {
  const authorization = await authorizeApiRoles(['super_admin']);
  if (!authorization.authorized) return authorization.response;
  const params = await context.params;
  const id = userIdSchema.safeParse(params.userId);
  if (!id.success) {
    return NextResponse.json(
      { message: 'El identificador del usuario no es válido.' },
      { status: 400 },
    );
  }
  const user = await getUser(id.data);
  return user
    ? NextResponse.json({ user })
    : NextResponse.json({ message: 'El usuario no existe.' }, { status: 404 });
}

export async function PATCH(request: Request, context: Context) {
  const authorization = await authorizeApiRoles(['super_admin']);
  if (!authorization.authorized) return authorization.response;
  const params = await context.params;
  const id = userIdSchema.safeParse(params.userId);
  if (!id.success) {
    return NextResponse.json(
      { message: 'El identificador del usuario no es válido.' },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'El cuerpo de la solicitud no es JSON válido.' },
      { status: 400 },
    );
  }
  const validation = updateUserSchema.safeParse(body);
  if (!validation.success) return userValidationResponse(validation.error);

  try {
    await updateUser(id.data, validation.data, {
      actorUserId: authorization.user.id,
      requestContext: getAuditRequestContext(request),
    });
    return NextResponse.json({ message: 'Usuario actualizado correctamente.' });
  } catch (error) {
    const controlled = userServiceErrorResponse(error);
    if (controlled) return controlled;
    console.error('Update user error:', error);
    return NextResponse.json(
      { message: 'No fue posible actualizar el usuario.' },
      { status: 500 },
    );
  }
}
