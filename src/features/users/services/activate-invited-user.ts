import { createAuditLog } from '@/features/audit/services/create-audit-log';
import {
  findUserByIdForUpdate,
  updateUserStatus,
} from '@/features/users/repositories/user.repository';
import type { AuthenticatedPortalUser } from '@/features/users/repositories/user.repository';
import { db } from '@/shared/database/mysql';

export async function activateInvitedAuthenticatedUser(
  user: AuthenticatedPortalUser,
): Promise<AuthenticatedPortalUser> {
  if (user.status !== 'invited') return user;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const current = await findUserByIdForUpdate(connection, user.id);
    if (current?.status === 'invited') {
      await updateUserStatus(connection, user.id, 'active');
      await createAuditLog(connection, {
        actorUserId: user.id,
        action: 'user_activated',
        entityType: 'user',
        entityId: String(user.id),
        ipAddress: null,
        userAgent: null,
        previousData: { status: 'invited' },
        newData: { status: 'active' },
        metadata: { source: 'first_authenticated_request' },
      });
    }
    await connection.commit();
    return { ...user, status: current?.status === 'blocked' || current?.status === 'inactive' ? current.status : 'active' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
