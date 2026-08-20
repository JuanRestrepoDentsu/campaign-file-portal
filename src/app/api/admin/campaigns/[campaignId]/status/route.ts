import { proxyPortalApi } from '@/shared/api/portal-api-client';
type Context = { params: Promise<{ campaignId: string }> };
export async function PATCH(request: Request, context: Context) { return proxyPortalApi(request, `/admin/campaigns/${(await context.params).campaignId}/status`); }
