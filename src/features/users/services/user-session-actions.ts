import { createAuditLog } from '@/features/audit/services/create-audit-log';
import type { AuditRequestContext } from '@/features/audit/types/audit';
import { UserServiceError } from '@/features/users/errors/user-service-error';
import { findUserByIdForUpdate } from '@/features/users/repositories/user.repository';
import {
  resendCognitoInvitation,
  signOutCognitoUser,
} from '@/features/users/services/cognito-user.service';
import { db } from '@/shared/database/mysql';

type ActionOptions = {
  actorUserId: number;
  requestContext: AuditRequestContext;
};

async function getUserEmail(userId: number): Promise<{
  email: string;
  status: string;
}> {
  const connection = await db.getConnection();
  try {
    const user = await findUserByIdForUpdate(connection, userId);
    if (!user) {
      throw new UserServiceError('USER_NOT_FOUND', 'El usuario no existe.', 404);
    }
    return { email: user.email, status: user.status };
  } finally {
    connection.release();
  }
}

async function auditCompletedAction(
  userId: number,
  action: string,
  options: ActionOptions,
): Promise<void> {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await createAuditLog(connection, {
      actorUserId: options.actorUserId,
      action,
      entityType: 'user',
      entityId: String(userId),
      ipAddress: options.requestContext.ipAddress,
      userAgent: options.requestContext.userAgent,
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error(`${action} audit failed after Cognito completed:`, error);
  } finally {
    connection.release();
  }
}

export async function resendUserInvitation(
  userId: number,
  options: ActionOptions,
): Promise<void> {
  const user = await getUserEmail(userId);
  if (user.status !== 'invited') {
    throw new UserServiceError(
      'USER_COGNITO_CONFLICT',
      'Solo se puede reenviar la invitación a usuarios pendientes.',
      409,
    );
  }
  await resendCognitoInvitation(user.email);
  await auditCompletedAction(userId, 'user_invitation_resent', options);
}

export async function signOutUserSessions(
  userId: number,
  options: ActionOptions,
): Promise<void> {
  const user = await getUserEmail(userId);
  await signOutCognitoUser(user.email);
  await auditCompletedAction(userId, 'user_sessions_revoked', options);
}
