import {
  findClientById,
  findClients,
} from '@/features/clients/repositories/client.repository';
import type {
  ClientListFilters,
  PaginatedClients,
  PortalClient,
} from '@/features/clients/types/client';

export async function getClients(
  filters: ClientListFilters,
): Promise<PaginatedClients> {
  return findClients(filters);
}

export async function getClient(
  clientId: number,
): Promise<PortalClient | null> {
  return findClientById(
    clientId,
  );
}
