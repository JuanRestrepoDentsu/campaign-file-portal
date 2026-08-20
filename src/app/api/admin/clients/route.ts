import { proxyPortalApi } from '@/shared/api/portal-api-client';

export function GET(request: Request) { return proxyPortalApi(request, '/admin/clients'); }
export function POST(request: Request) { return proxyPortalApi(request, '/admin/clients'); }
