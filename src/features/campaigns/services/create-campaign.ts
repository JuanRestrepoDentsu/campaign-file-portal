import { createAuditLog } from '@/features/audit/services/create-audit-log';
import type { AuditRequestContext } from '@/features/audit/types/audit';
import {
  CampaignServiceError,
  isDuplicateEntryError,
} from '@/features/campaigns/errors/campaign-service-error';
import {
  insertCampaign,
  replaceCampaignUsers,
} from '@/features/campaigns/repositories/campaign.repository';
import type { CreateCampaignInput } from '@/features/campaigns/schemas/campaign.schema';
import type { PortalCampaign } from '@/features/campaigns/types/campaign';
import { validateCampaignRelations } from '@/features/campaigns/services/campaign-validation.service';
import { db } from '@/shared/database/mysql';

type Options = { actorUserId: number; requestContext: AuditRequestContext };

export async function createCampaign(
  input: CreateCampaignInput,
  options: Options,
): Promise<{ id: number }> {
  await validateCampaignRelations(input.clientId, input.userIds, {
    requireActiveClient: true,
  });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const campaignId = await insertCampaign(connection, input);
    await replaceCampaignUsers(connection, campaignId, input.userIds);
    await createAuditLog(connection, {
      actorUserId: options.actorUserId,
      action: 'campaign_created',
      entityType: 'campaign',
      entityId: String(campaignId),
      ipAddress: options.requestContext.ipAddress,
      userAgent: options.requestContext.userAgent,
      previousData: null,
      newData: {
        clientId: input.clientId,
        name: input.name,
        code: input.code,
        description: input.description,
        status: input.status,
        userIds: input.userIds,
      },
    });
    await connection.commit();
    return { id: campaignId };
  } catch (error) {
    await connection.rollback();
    if (isDuplicateEntryError(error)) {
      throw new CampaignServiceError(
        'CAMPAIGN_CODE_CONFLICT',
        'Ya existe una campaña con ese código.',
        409,
      );
    }
    throw error;
  } finally {
    connection.release();
  }
}

export function campaignAuditData(campaign: PortalCampaign) {
  return {
    clientId: campaign.client.id,
    name: campaign.name,
    code: campaign.code,
    description: campaign.description,
    status: campaign.status,
    userIds: campaign.assignedUsers.map((user) => user.id),
  };
}
