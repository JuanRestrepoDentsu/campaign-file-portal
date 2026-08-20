import { proxyPortalApi } from '@/shared/api/portal-api-client';
type Context = { params: Promise<{ uploadId: string }> };
export async function GET(request: Request, context: Context) { return proxyPortalApi(request, `/uploads/${(await context.params).uploadId}`); }
