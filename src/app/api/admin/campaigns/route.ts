import { NextResponse } from 'next/server';

import { getAuditRequestContext } from '@/features/audit/services/create-audit-log';
import {
  campaignServiceErrorResponse,
  campaignValidationResponse,
} from '@/features/campaigns/http/campaign-api-response';
import {
  campaignListQuerySchema,
  createCampaignSchema,
} from '@/features/campaigns/schemas/campaign.schema';
import { createCampaign } from '@/features/campaigns/services/create-campaign';
import { getCampaigns } from '@/features/campaigns/services/get-campaigns';
import { authorizeApiRoles } from '@/shared/auth/api-authorization';

export async function GET(request: Request) {
  const authorization = await authorizeApiRoles(['super_admin']);
  if (!authorization.authorized) return authorization.response;
  const url = new URL(request.url);
  const validation = campaignListQuerySchema.safeParse({
    page: url.searchParams.get('page') ?? undefined,
    pageSize: url.searchParams.get('pageSize') ?? undefined,
    search: url.searchParams.get('search') ?? undefined,
    status: url.searchParams.get('status') ?? undefined,
    clientId: url.searchParams.get('clientId') ?? undefined,
  });
  if (!validation.success) return campaignValidationResponse(validation.error);
  try {
    return NextResponse.json(await getCampaigns(validation.data));
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      { message: 'No fue posible consultar las campañas.' },
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
    return NextResponse.json({ message: 'El cuerpo no es JSON válido.' }, { status: 400 });
  }
  const validation = createCampaignSchema.safeParse(body);
  if (!validation.success) return campaignValidationResponse(validation.error);
  try {
    const campaign = await createCampaign(validation.data, {
      actorUserId: authorization.user.id,
      requestContext: getAuditRequestContext(request),
    });
    return NextResponse.json(
      { message: 'Campaña creada correctamente.', campaign },
      { status: 201 },
    );
  } catch (error) {
    const known = campaignServiceErrorResponse(error);
    if (known) return known;
    console.error('Create campaign error:', error);
    return NextResponse.json(
      { message: 'No fue posible crear la campaña.' },
      { status: 500 },
    );
  }
}
