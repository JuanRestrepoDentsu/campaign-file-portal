export type PortalUserRole =
  | 'super_admin'
  | 'client_admin'
  | 'client_user';

export type PortalUserStatus =
  | 'invited'
  | 'active'
  | 'blocked'
  | 'inactive';

export type UserClientSummary = {
  id: number;
  name: string;
  code: string;
};

export type UserCampaignSummary = {
  id: number;
  name: string;
  code: string;
};

export type PortalUser = {
  id: number;
  cognitoSub: string;
  email: string;
  firstName: string;
  lastName: string | null;
  role: PortalUserRole;
  status: PortalUserStatus;
  client: UserClientSummary | null;
  campaigns: UserCampaignSummary[];
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserListFilters = {
  page: number;
  pageSize: number;
  search: string;
  role: PortalUserRole | 'all';
  status: PortalUserStatus | 'all';
  clientId: number | null;
};

export type PaginatedUsers = {
  items: PortalUser[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: UserListFilters;
};

export type UserBusinessInput = {
  firstName: string;
  lastName: string | null;
  role: PortalUserRole;
  clientId: number | null;
  campaignIds: number[];
};

export type CreateUserMutation =
  UserBusinessInput & {
    cognitoSub: string;
    email: string;
    status: 'invited';
  };

export type UserFormOptions = {
  clients: UserClientSummary[];
  campaigns: Array<
    UserCampaignSummary & {
      clientId: number;
    }
  >;
};
