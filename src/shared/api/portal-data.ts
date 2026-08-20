import type { CampaignFormOptions, CampaignListFilters, PaginatedCampaigns, PortalCampaign } from '@/features/campaigns/types/campaign';
import type { ClientListFilters, PaginatedClients, PortalClient } from '@/features/clients/types/client';
import type { AdminDashboardData } from '@/features/dashboard/types/dashboard';
import type { CampaignUploadOption, SchemaCatalog, UploadSummary } from '@/features/uploads/types/upload';
import type { AuthenticatedPortalUser } from '@/features/users/repositories/user.repository';
import type { PaginatedUsers, PortalUser, UserFormOptions, UserListFilters } from '@/features/users/types/user';
import { portalApi } from '@/shared/api/portal-api-client';

function query(input: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export async function getRemoteCurrentUser(): Promise<AuthenticatedPortalUser> {
  return (await portalApi<{ user: AuthenticatedPortalUser }>('/me')).user;
}

export function getRemoteDashboard(): Promise<AdminDashboardData> {
  return portalApi('/dashboard');
}

export function getRemoteClients(filters: ClientListFilters): Promise<PaginatedClients> {
  return portalApi(`/admin/clients${query(filters)}`);
}

export async function getRemoteClient(id: number): Promise<PortalClient | null> {
  try {
    return (await portalApi<{ client: PortalClient }>(`/admin/clients/${id}`)).client;
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) return null;
    throw error;
  }
}

export function getRemoteCampaigns(filters: CampaignListFilters): Promise<PaginatedCampaigns> {
  return portalApi(`/admin/campaigns${query(filters)}`);
}

export async function getRemoteCampaign(id: number): Promise<PortalCampaign | null> {
  try {
    return (await portalApi<{ campaign: PortalCampaign }>(`/admin/campaigns/${id}`)).campaign;
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) return null;
    throw error;
  }
}

export function getRemoteCampaignOptions(): Promise<CampaignFormOptions> {
  return portalApi('/admin/campaigns/options');
}

export function getRemoteUsers(filters: UserListFilters): Promise<PaginatedUsers> {
  return portalApi(`/admin/users${query(filters)}`);
}

export async function getRemoteUser(id: number): Promise<PortalUser | null> {
  try {
    return (await portalApi<{ user: PortalUser }>(`/admin/users/${id}`)).user;
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) return null;
    throw error;
  }
}

export function getRemoteUserOptions(): Promise<UserFormOptions> {
  return portalApi('/admin/users/options');
}

export async function getRemoteUploadCampaigns(): Promise<CampaignUploadOption[]> {
  return (await portalApi<{ campaigns: CampaignUploadOption[] }>('/uploads/options')).campaigns;
}

export function getRemoteUploads(page: number, pageSize: number): Promise<{ items: UploadSummary[]; total: number }> {
  return portalApi(`/uploads${query({ page, pageSize })}`);
}

export async function getRemoteUpload(id: number): Promise<UploadSummary | null> {
  try {
    return (await portalApi<{ upload: UploadSummary }>(`/uploads/${id}`)).upload;
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 404) return null;
    throw error;
  }
}

export function getRemoteCampaignSchema(campaignId: number): Promise<SchemaCatalog> {
  return portalApi(`/uploads/campaigns/${campaignId}/schema`);
}

