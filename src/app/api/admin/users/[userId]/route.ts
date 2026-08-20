import { proxyPortalApi } from '@/shared/api/portal-api-client';
type Context = { params: Promise<{ userId: string }> };
export async function GET(request: Request, context: Context) { return proxyPortalApi(request, `/admin/users/${(await context.params).userId}`); }
export async function PATCH(request: Request, context: Context) { return proxyPortalApi(request, `/admin/users/${(await context.params).userId}`); }
