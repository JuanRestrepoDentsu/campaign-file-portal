import { createAuditLog } from '@/features/audit/services/create-audit-log';
import type { AuditRequestContext } from '@/features/audit/types/audit';
import { UserServiceError, isDuplicateEntryError } from '@/features/users/errors/user-service-error';
import { insertUser, replaceUserCampaigns } from '@/features/users/repositories/user.repository';
import type { CreateUserInput } from '@/features/users/schemas/user.schema';
import {
  addCognitoGroup,
  createCognitoUser,
  deleteCognitoUser,
} from '@/features/users/services/cognito-user.service';
import { validateUserRelations } from '@/features/users/services/user-validation.service';
import type { PortalUser } from '@/features/users/types/user';
import { db } from '@/shared/database/mysql';

type CreateUserOptions = {
  actorUserId: number;
  requestContext: AuditRequestContext;
};

export async function createUser(
  input: CreateUserInput,
  options: CreateUserOptions,
): Promise<PortalUser> {
  await validateUserRelations(input);

  const cognitoUser = await createCognitoUser(input);
  let mustDeleteCognitoUser = true;

  try {
    await addCognitoGroup(input.email, input.role);

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const userId = await insertUser(connection, {
        ...input,
        cognitoSub: cognitoUser.sub,
        status: 'invited',
      });
      await replaceUserCampaigns(connection, userId, input.campaignIds);

      await createAuditLog(connection, {
        actorUserId: options.actorUserId,
        action: 'user_created',
        entityType: 'user',
        entityId: String(userId),
        ipAddress: options.requestContext.ipAddress,
        userAgent: options.requestContext.userAgent,
        previousData: null,
        newData: {
          email: input.email,
          firstName: input.firstName,
          lastName: input.lastName,
          role: input.role,
          status: 'invited',
          clientId: input.clientId,
          campaignIds: input.campaignIds,
        },
      });

      await connection.commit();
      mustDeleteCognitoUser = false;

      const now = new Date();
      return {
        id: userId,
        cognitoSub: cognitoUser.sub,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        role: input.role,
        status: 'invited',
        client: null,
        campaigns: [],
        lastLoginAt: null,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      await connection.rollback();
      if (isDuplicateEntryError(error)) {
        throw new UserServiceError(
          'USER_EMAIL_CONFLICT',
          'Ya existe un usuario con ese correo.',
          409,
          error,
        );
      }
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    if (mustDeleteCognitoUser) {
      try {
        await deleteCognitoUser(input.email);
      } catch (compensationError) {
        console.error('Create user compensation failed:', compensationError);
        throw new UserServiceError(
          'USER_COMPENSATION_FAILED',
          'La creación no se completó y Cognito no pudo revertirse. Revisa el usuario antes de reintentar.',
          500,
          { error, compensationError },
        );
      }
    }
    throw error;
  }
}
