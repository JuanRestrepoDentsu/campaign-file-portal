import type {
  PoolConnection,
} from 'mysql2/promise';

import type {
  AuditLogInput,
} from '@/features/audit/types/audit';

function toJson(
  value:
    | Record<string, unknown>
    | null
    | undefined,
): string | null {
  return value
    ? JSON.stringify(value)
    : null;
}

export async function insertAuditLog(
  connection: PoolConnection,
  input: AuditLogInput,
): Promise<void> {
  await connection.execute(
    `
      INSERT INTO portal_audit_logs (
        actor_user_id,
        action,
        entity_type,
        entity_id,
        ip_address,
        user_agent,
        previous_data,
        new_data,
        metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      input.actorUserId,
      input.action,
      input.entityType,
      input.entityId,
      input.ipAddress,
      input.userAgent,
      toJson(input.previousData),
      toJson(input.newData),
      toJson(input.metadata),
    ],
  );
}
