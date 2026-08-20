import { proxyPortalApi } from '@/shared/api/portal-api-client';
type Context = { params: Promise<{ campaignId: string }> };
export async function GET(request: Request, context: Context) { return proxyPortalApi(request, `/uploads/campaigns/${(await context.params).campaignId}/schema`); }
