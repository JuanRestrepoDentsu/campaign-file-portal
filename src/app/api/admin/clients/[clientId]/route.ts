import { proxyPortalApi } from '@/shared/api/portal-api-client';
type Context = { params: Promise<{ clientId: string }> };
export async function GET(request: Request, context: Context) { return proxyPortalApi(request, `/admin/clients/${(await context.params).clientId}`); }
export async function PATCH(request: Request, context: Context) { return proxyPortalApi(request, `/admin/clients/${(await context.params).clientId}`); }
