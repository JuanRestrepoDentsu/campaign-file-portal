import { createAuditLog } from '@/features/audit/services/create-audit-log';
import type { AuditRequestContext } from '@/features/audit/types/audit';
import { UserServiceError } from '@/features/users/errors/user-service-error';
import {
  findUserByIdForUpdate,
  replaceUserCampaigns,
  updateUserBusinessData,
} from '@/features/users/repositories/user.repository';
import type { UpdateUserInput } from '@/features/users/schemas/user.schema';
import {
  addCognitoGroup,
  removeCognitoGroup,
} from '@/features/users/services/cognito-user.service';
import { validateUserRelations } from '@/features/users/services/user-validation.service';
import type { PortalUser } from '@/features/users/types/user';
import { db } from '@/shared/database/mysql';

type UpdateUserOptions = {
  actorUserId: number;
  requestContext: AuditRequestContext;
};

function auditData(user: PortalUser) {
  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    status: user.status,
    clientId: user.client?.id ?? null,
    campaignIds: user.campaigns.map((campaign) => campaign.id),
  };
}

export async function updateUser(
  userId: number,
  input: UpdateUserInput,
  options: UpdateUserOptions,
): Promise<void> {
  await validateUserRelations(input);
  const connection = await db.getConnection();
  let previous: PortalUser | null = null;
  let newGroupAdded = false;
  let oldGroupRemoved = false;
  let committed = false;

  try {
    await connection.beginTransaction();
    previous = await findUserByIdForUpdate(connection, userId);
    if (!previous) {
      throw new UserServiceError('USER_NOT_FOUND', 'El usuario no existe.', 404);
    }

    if (previous.role !== input.role) {
      await addCognitoGroup(previous.email, input.role);
      newGroupAdded = true;
      await removeCognitoGroup(previous.email, previous.role);
      oldGroupRemoved = true;
    }

    await updateUserBusinessData(connection, userId, input);
    await replaceUserCampaigns(connection, userId, input.campaignIds);

    await createAuditLog(connection, {
      actorUserId: options.actorUserId,
      action: 'user_updated',
      entityType: 'user',
      entityId: String(userId),
      ipAddress: options.requestContext.ipAddress,
      userAgent: options.requestContext.userAgent,
      previousData: auditData(previous),
      newData: {
        email: previous.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        status: previous.status,
        clientId: input.clientId,
        campaignIds: input.campaignIds,
      },
    });

    await connection.commit();
    committed = true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();

    if (!committed && previous && (newGroupAdded || oldGroupRemoved)) {
      try {
        if (oldGroupRemoved) {
          await addCognitoGroup(previous.email, previous.role);
        }
        if (newGroupAdded) {
          await removeCognitoGroup(previous.email, input.role);
        }
      } catch (compensationError) {
        console.error('Update user compensation failed:', compensationError);
        throw new UserServiceError(
          'USER_COMPENSATION_FAILED',
          'La actualización no se completó y los grupos de Cognito requieren revisión manual.',
          500,
          compensationError,
        );
      }
    }
  }
}
