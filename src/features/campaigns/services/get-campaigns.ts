import {
  findCampaignById,
  findCampaigns,
  getCampaignFormOptions as findCampaignFormOptions,
} from '@/features/campaigns/repositories/campaign.repository';
import type {
  CampaignFormOptions,
  CampaignListFilters,
  PaginatedCampaigns,
  PortalCampaign,
} from '@/features/campaigns/types/campaign';

export function getCampaigns(filters: CampaignListFilters): Promise<PaginatedCampaigns> {
  return findCampaigns(filters);
}

export function getCampaign(campaignId: number): Promise<PortalCampaign | null> {
  return findCampaignById(campaignId);
}

export function getCampaignFormOptions(): Promise<CampaignFormOptions> {
  return findCampaignFormOptions();
}
