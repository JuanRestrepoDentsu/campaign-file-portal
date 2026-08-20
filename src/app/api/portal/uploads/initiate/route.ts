import { proxyPortalApi } from '@/shared/api/portal-api-client';
export const runtime = 'nodejs';
export function POST(request: Request) { return proxyPortalApi(request, '/uploads/initiate'); }
