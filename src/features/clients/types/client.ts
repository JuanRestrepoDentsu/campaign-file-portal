export type ClientStatus =
  | 'active'
  | 'inactive';

export type PortalClient = {
  id: number;
  name: string;
  code: string;
  status: ClientStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientListFilters = {
  page: number;
  pageSize: number;
  search: string;
  status: ClientStatus | 'all';
};

export type PaginatedClients = {
  items: PortalClient[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  filters: Pick<
    ClientListFilters,
    'search' | 'status'
  >;
};

export type ClientMutationInput = {
  name: string;
  code: string;
  status: ClientStatus;
};
