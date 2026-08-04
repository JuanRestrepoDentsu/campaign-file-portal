import type {
  PoolConnection,
} from 'mysql2/promise';

import {
  insertAuditLog,
} from '@/features/audit/repositories/audit.repository';
import type {
  AuditLogInput,
  AuditRequestContext,
} from '@/features/audit/types/audit';

export async function createAuditLog(
  connection: PoolConnection,
  input: AuditLogInput,
): Promise<void> {
  await insertAuditLog(
    connection,
    input,
  );
}

export function getAuditRequestContext(
  request: Request,
): AuditRequestContext {
  const forwardedFor =
    request.headers.get(
      'x-forwarded-for',
    );

  const ipAddress =
    forwardedFor
      ?.split(',')[0]
      ?.trim() ||
    request.headers.get(
      'x-real-ip',
    );

  return {
    ipAddress:
      ipAddress?.slice(0, 45) ??
      null,
    userAgent:
      request.headers
        .get('user-agent')
        ?.slice(0, 500) ?? null,
  };
}
