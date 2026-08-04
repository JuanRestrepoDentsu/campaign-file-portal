import type {
  AuditRequestContext,
} from '@/features/audit/types/audit';
import {
  createAuditLog,
} from '@/features/audit/services/create-audit-log';
import {
  ClientServiceError,
  isDuplicateEntryError,
} from '@/features/clients/errors/client-service-error';
import {
  insertClient,
} from '@/features/clients/repositories/client.repository';
import type {
  CreateClientInput,
} from '@/features/clients/schemas/client.schema';
import type {
  PortalClient,
} from '@/features/clients/types/client';
import {
  db,
} from '@/shared/database/mysql';

type CreateClientOptions = {
  actorUserId: number;
  requestContext:
    AuditRequestContext;
};

export async function createClient(
  input: CreateClientInput,
  options: CreateClientOptions,
): Promise<PortalClient> {
  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    const clientId =
      await insertClient(
        connection,
        input,
      );

    const client: PortalClient = {
      id: clientId,
      name: input.name,
      code: input.code,
      status: input.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await createAuditLog(
      connection,
      {
        actorUserId:
          options.actorUserId,
        action:
          'client_created',
        entityType:
          'client',
        entityId:
          String(clientId),
        ipAddress:
          options.requestContext
            .ipAddress,
        userAgent:
          options.requestContext
            .userAgent,
        previousData: null,
        newData: {
          name: client.name,
          code: client.code,
          status: client.status,
        },
      },
    );

    await connection.commit();

    return client;
  } catch (error) {
    await connection.rollback();

    if (
      isDuplicateEntryError(error)
    ) {
      throw new ClientServiceError(
        'CLIENT_CODE_CONFLICT',
        'Ya existe un cliente con ese código.',
        409,
      );
    }

    throw error;
  } finally {
    connection.release();
  }
}
