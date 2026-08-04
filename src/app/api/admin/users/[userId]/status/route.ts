import { NextResponse } from 'next/server';

import { getAuditRequestContext } from '@/features/audit/services/create-audit-log';
import {
  userServiceErrorResponse,
  userValidationResponse,
} from '@/features/users/http/user-api-response';
import {
  userIdSchema,
  userStatusMutationSchema,
} from '@/features/users/schemas/user.schema';
import { changeUserStatus } from '@/features/users/services/change-user-status';
import { authorizeApiRoles } from '@/shared/auth/api-authorization';

type Context = { params: Promise<{ userId: string }> };

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
    return NextResponse.json({ message: 'JSON inválido.' }, { status: 400 });
  }
  const validation = userStatusMutationSchema.safeParse(body);
  if (!validation.success) return userValidationResponse(validation.error);

  try {
    await changeUserStatus(id.data, validation.data.status, {
      actorUserId: authorization.user.id,
      requestContext: getAuditRequestContext(request),
    });
    return NextResponse.json({ message: 'Estado actualizado correctamente.' });
  } catch (error) {
    const controlled = userServiceErrorResponse(error);
    if (controlled) return controlled;
    console.error('Change user status error:', error);
    return NextResponse.json(
      { message: 'No fue posible cambiar el estado.' },
      { status: 500 },
    );
  }
}
