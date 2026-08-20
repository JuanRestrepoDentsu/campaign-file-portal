import { proxyPortalApi } from '@/shared/api/portal-api-client';
export function GET(request: Request) { return proxyPortalApi(request, '/admin/users'); }
export function POST(request: Request) { return proxyPortalApi(request, '/admin/users'); }
