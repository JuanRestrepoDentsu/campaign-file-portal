import { NextResponse } from 'next/server';

import { getAuditRequestContext } from '@/features/audit/services/create-audit-log';
import { userServiceErrorResponse } from '@/features/users/http/user-api-response';
import { userIdSchema } from '@/features/users/schemas/user.schema';
import { resendUserInvitation } from '@/features/users/services/user-session-actions';
import { authorizeApiRoles } from '@/shared/auth/api-authorization';

type Context = { params: Promise<{ userId: string }> };

export async function POST(request: Request, context: Context) {
  const authorization = await authorizeApiRoles(['super_admin']);
  if (!authorization.authorized) return authorization.response;
  const id = userIdSchema.safeParse((await context.params).userId);
  if (!id.success) {
    return NextResponse.json({ message: 'Usuario inválido.' }, { status: 400 });
  }
  try {
    await resendUserInvitation(id.data, {
      actorUserId: authorization.user.id,
      requestContext: getAuditRequestContext(request),
    });
    return NextResponse.json({ message: 'Invitación reenviada correctamente.' });
  } catch (error) {
    const controlled = userServiceErrorResponse(error);
    if (controlled) return controlled;
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { message: 'No fue posible reenviar la invitación.' },
      { status: 500 },
    );
  }
}
