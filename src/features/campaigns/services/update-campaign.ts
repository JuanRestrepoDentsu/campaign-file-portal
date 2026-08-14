import { createAuditLog } from '@/features/audit/services/create-audit-log';
import type { AuditRequestContext } from '@/features/audit/types/audit';
import {
  CampaignServiceError,
  isDuplicateEntryError,
} from '@/features/campaigns/errors/campaign-service-error';
import {
  findCampaignByIdForUpdate,
  findCampaignById,
  replaceCampaignUsers,
  updateCampaignById,
  updateCampaignStatus,
} from '@/features/campaigns/repositories/campaign.repository';
import type {
  CampaignStatusMutationInput,
  UpdateCampaignInput,
} from '@/features/campaigns/schemas/campaign.schema';
import type { PortalCampaign } from '@/features/campaigns/types/campaign';
import { campaignAuditData } from '@/features/campaigns/services/create-campaign';
import { validateCampaignRelations } from '@/features/campaigns/services/campaign-validation.service';
import { db } from '@/shared/database/mysql';

type Options = { actorUserId: number; requestContext: AuditRequestContext };

function nextCampaign(previous: PortalCampaign, input: UpdateCampaignInput): PortalCampaign {
  const assignedUsers = input.userIds.map((id) => {
    const found = previous.assignedUsers.find((user) => user.id === id);
    return found ?? {
      id,
      email: '',
      firstName: '',
      lastName: null,
      status: 'active' as const,
    };
  });
  return {
    ...previous,
    client: { ...previous.client, id: input.clientId },
    name: input.name,
    code: input.code,
    description: input.description,
    status: input.status,
    assignedUsers,
    updatedAt: new Date(),
  };
}

export async function updateCampaign(
  campaignId: number,
  input: UpdateCampaignInput,
  options: Options,
): Promise<void> {
  const existing = await findCampaignById(campaignId);
  if (!existing) {
    throw new CampaignServiceError('CAMPAIGN_NOT_FOUND', 'La campaña no existe.', 404);
  }
  await validateCampaignRelations(input.clientId, input.userIds, {
    requireActiveClient:
      existing.client.id !== input.clientId || input.status === 'active',
  });

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const previous = await findCampaignByIdForUpdate(connection, campaignId);
    if (!previous) {
      throw new CampaignServiceError('CAMPAIGN_NOT_FOUND', 'La campaña no existe.', 404);
    }
    await updateCampaignById(connection, campaignId, input);
    await replaceCampaignUsers(connection, campaignId, input.userIds);
    const updated = nextCampaign(previous, input);
    await createAuditLog(connection, {
      actorUserId: options.actorUserId,
      action: 'campaign_updated',
      entityType: 'campaign',
      entityId: String(campaignId),
      ipAddress: options.requestContext.ipAddress,
      userAgent: options.requestContext.userAgent,
      previousData: campaignAuditData(previous),
      newData: campaignAuditData(updated),
    });
    await connection.commit();
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

export async function changeCampaignStatus(
  campaignId: number,
  input: CampaignStatusMutationInput,
  options: Options,
): Promise<void> {
  const existing = await findCampaignById(campaignId);
  if (!existing) {
    throw new CampaignServiceError('CAMPAIGN_NOT_FOUND', 'La campaña no existe.', 404);
  }
  if (input.status === 'active') {
    await validateCampaignRelations(
      existing.client.id,
      existing.assignedUsers.map((user) => user.id),
      { requireActiveClient: true },
    );
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const previous = await findCampaignByIdForUpdate(connection, campaignId);
    if (!previous) {
      throw new CampaignServiceError('CAMPAIGN_NOT_FOUND', 'La campaña no existe.', 404);
    }
    await updateCampaignStatus(connection, campaignId, input.status);
    const action = input.status === 'active'
      ? 'campaign_activated'
      : input.status === 'archived'
        ? 'campaign_archived'
        : 'campaign_deactivated';
    await createAuditLog(connection, {
      actorUserId: options.actorUserId,
      action,
      entityType: 'campaign',
      entityId: String(campaignId),
      ipAddress: options.requestContext.ipAddress,
      userAgent: options.requestContext.userAgent,
      previousData: { status: previous.status },
      newData: { status: input.status },
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
