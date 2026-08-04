import { UserServiceError } from '@/features/users/errors/user-service-error';
import {
  countValidCampaigns,
  isActiveClient,
} from '@/features/users/repositories/user.repository';
import type { UserBusinessInput } from '@/features/users/types/user';

export async function validateUserRelations(
  input: UserBusinessInput,
): Promise<void> {
  if (input.role === 'super_admin') {
    return;
  }

  if (!input.clientId || !(await isActiveClient(input.clientId))) {
    throw new UserServiceError(
      'USER_INVALID_CLIENT',
      'El cliente seleccionado no existe o está inactivo.',
      400,
    );
  }

  const validCampaigns = await countValidCampaigns(
    input.clientId,
    input.campaignIds,
  );

  if (validCampaigns !== input.campaignIds.length) {
    throw new UserServiceError(
      'USER_INVALID_CAMPAIGNS',
      'Una o más campañas no pertenecen al cliente o están inactivas.',
      400,
    );
  }
}
