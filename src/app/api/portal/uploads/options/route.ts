import { proxyPortalApi } from '@/shared/api/portal-api-client';
export function GET(request: Request) { return proxyPortalApi(request, '/uploads/options'); }
