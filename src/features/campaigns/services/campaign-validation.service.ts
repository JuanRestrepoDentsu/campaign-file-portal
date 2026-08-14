import { CampaignServiceError } from '@/features/campaigns/errors/campaign-service-error';
import {
  countValidUsers,
  isActiveClient,
} from '@/features/campaigns/repositories/campaign.repository';

export async function validateCampaignRelations(
  clientId: number,
  userIds: number[],
  options: { requireActiveClient: boolean },
): Promise<void> {
  if (options.requireActiveClient && !(await isActiveClient(clientId))) {
    throw new CampaignServiceError(
      'CAMPAIGN_INVALID_CLIENT',
      'El cliente seleccionado no existe o está inactivo.',
      400,
    );
  }

  const validUsers = await countValidUsers(clientId, userIds);
  if (validUsers !== userIds.length) {
    throw new CampaignServiceError(
      'CAMPAIGN_INVALID_USERS',
      'Uno o más usuarios no pertenecen al cliente seleccionado.',
      400,
    );
  }
}
