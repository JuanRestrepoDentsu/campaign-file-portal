import { proxyPortalApi } from '@/shared/api/portal-api-client';
export const runtime = 'nodejs';
type Context = { params: Promise<{ uploadId: string }> };
export async function POST(request: Request, context: Context) { return proxyPortalApi(request, `/uploads/${(await context.params).uploadId}/complete`); }
