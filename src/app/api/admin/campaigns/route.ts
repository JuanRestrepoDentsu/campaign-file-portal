import { proxyPortalApi } from '@/shared/api/portal-api-client';
export function GET(request: Request) { return proxyPortalApi(request, '/admin/campaigns'); }
export function POST(request: Request) { return proxyPortalApi(request, '/admin/campaigns'); }
