import { createAuditLog } from '@/features/audit/services/create-audit-log';
import type { AuditRequestContext } from '@/features/audit/types/audit';
import { UserServiceError } from '@/features/users/errors/user-service-error';
import {
  findUserByIdForUpdate,
  updateUserStatus,
} from '@/features/users/repositories/user.repository';
import { setCognitoEnabled } from '@/features/users/services/cognito-user.service';
import type { PortalUserStatus } from '@/features/users/types/user';
import { db } from '@/shared/database/mysql';

type ChangeStatusOptions = {
  actorUserId: number;
  requestContext: AuditRequestContext;
};

export async function changeUserStatus(
  userId: number,
  status: Exclude<PortalUserStatus, 'invited'>,
  options: ChangeStatusOptions,
): Promise<void> {
  if (userId === options.actorUserId && status !== 'active') {
    throw new UserServiceError(
      'USER_SELF_STATUS_CHANGE',
      'No puedes bloquear o desactivar tu propia cuenta.',
      409,
    );
  }

  const connection = await db.getConnection();
  let previousStatus: PortalUserStatus | null = null;
  let email: string | null = null;
  let cognitoChanged = false;
  let committed = false;

  try {
    await connection.beginTransaction();
    const previous = await findUserByIdForUpdate(connection, userId);
    if (!previous) {
      throw new UserServiceError('USER_NOT_FOUND', 'El usuario no existe.', 404);
    }
    previousStatus = previous.status;
    email = previous.email;

    const enabled = status === 'active';
    await setCognitoEnabled(previous.email, enabled);
    cognitoChanged = true;

    await updateUserStatus(connection, userId, status);
    await createAuditLog(connection, {
      actorUserId: options.actorUserId,
      action:
        status === 'active'
          ? 'user_activated'
          : status === 'blocked'
            ? 'user_blocked'
            : 'user_deactivated',
      entityType: 'user',
      entityId: String(userId),
      ipAddress: options.requestContext.ipAddress,
      userAgent: options.requestContext.userAgent,
      previousData: { status: previous.status },
      newData: { status },
    });
    await connection.commit();
    committed = true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();

    if (!committed && cognitoChanged && email && previousStatus) {
      try {
        await setCognitoEnabled(
          email,
          previousStatus === 'active' || previousStatus === 'invited',
        );
      } catch (compensationError) {
        console.error('User status compensation failed:', compensationError);
        throw new UserServiceError(
          'USER_COMPENSATION_FAILED',
          'El estado no se confirmó en MySQL y Cognito requiere revisión manual.',
          500,
          compensationError,
        );
      }
    }
  }
}
