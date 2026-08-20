import { proxyPortalApi } from '@/shared/api/portal-api-client';
type Context = { params: Promise<{ userId: string }> };
export async function POST(request: Request, context: Context) { return proxyPortalApi(request, `/admin/users/${(await context.params).userId}/resend-invitation`); }
