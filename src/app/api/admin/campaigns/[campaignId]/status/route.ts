import { NextResponse } from 'next/server';

import { getAuditRequestContext } from '@/features/audit/services/create-audit-log';
import {
  campaignServiceErrorResponse,
  campaignValidationResponse,
} from '@/features/campaigns/http/campaign-api-response';
import {
  campaignIdSchema,
  campaignStatusMutationSchema,
} from '@/features/campaigns/schemas/campaign.schema';
import { changeCampaignStatus } from '@/features/campaigns/services/update-campaign';
import { authorizeApiRoles } from '@/shared/auth/api-authorization';

type Context = { params: Promise<{ campaignId: string }> };

export async function PATCH(request: Request, context: Context) {
  const authorization = await authorizeApiRoles(['super_admin']);
  if (!authorization.authorized) return authorization.response;
  const id = campaignIdSchema.safeParse((await context.params).campaignId);
  if (!id.success) {
    return NextResponse.json({ message: 'El identificador no es válido.' }, { status: 400 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: 'El cuerpo no es JSON válido.' }, { status: 400 });
  }
  const validation = campaignStatusMutationSchema.safeParse(body);
  if (!validation.success) return campaignValidationResponse(validation.error);
  try {
    await changeCampaignStatus(id.data, validation.data, {
      actorUserId: authorization.user.id,
      requestContext: getAuditRequestContext(request),
    });
    return NextResponse.json({ message: 'Estado actualizado correctamente.' });
  } catch (error) {
    const known = campaignServiceErrorResponse(error);
    if (known) return known;
    console.error('Change campaign status error:', error);
    return NextResponse.json(
      { message: 'No fue posible cambiar el estado.' },
      { status: 500 },
    );
  }
}
