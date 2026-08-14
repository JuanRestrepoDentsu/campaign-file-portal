export type CampaignStatus = 'active' | 'inactive' | 'archived';

export type CampaignClientSummary = {
  id: number;
  name: string;
  code: string;
  status: 'active' | 'inactive';
};

export type CampaignUserSummary = {
  id: number;
  email: string;
  firstName: string;
  lastName: string | null;
  status: 'invited' | 'active' | 'blocked' | 'inactive';
};

export type PortalCampaign = {
  id: number;
  client: CampaignClientSummary;
  name: string;
  code: string;
  description: string | null;
  status: CampaignStatus;
  assignedUsers: CampaignUserSummary[];
  createdAt: Date;
  updatedAt: Date;
};

export type CampaignMutationInput = {
  clientId: number;
  name: string;
  code: string;
  description: string | null;
  status: CampaignStatus;
  userIds: number[];
};

export type CampaignListFilters = {
  page: number;
  pageSize: number;
  search: string;
  status: CampaignStatus | 'all';
  clientId: number | null;
};

export type PaginatedCampaigns = {
  items: PortalCampaign[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: CampaignListFilters;
};

export type CampaignFormOptions = {
  clients: CampaignClientSummary[];
  users: Array<CampaignUserSummary & { clientId: number }>;
};
