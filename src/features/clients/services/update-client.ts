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
  findClientByIdForUpdate,
  updateClientById,
} from '@/features/clients/repositories/client.repository';
import type {
  UpdateClientInput,
} from '@/features/clients/schemas/client.schema';
import type {
  ClientMutationInput,
  PortalClient,
} from '@/features/clients/types/client';
import {
  db,
} from '@/shared/database/mysql';

type UpdateClientOptions = {
  actorUserId: number;
  requestContext:
    AuditRequestContext;
};

function auditData(
  client: PortalClient,
) {
  return {
    name: client.name,
    code: client.code,
    status: client.status,
  };
}

export async function updateClient(
  clientId: number,
  input: UpdateClientInput,
  options: UpdateClientOptions,
): Promise<PortalClient> {
  const connection =
    await db.getConnection();

  try {
    await connection.beginTransaction();

    const previous =
      await findClientByIdForUpdate(
        connection,
        clientId,
      );

    if (!previous) {
      throw new ClientServiceError(
        'CLIENT_NOT_FOUND',
        'El cliente no existe.',
        404,
      );
    }

    const mutation:
      ClientMutationInput = {
      name:
        input.name ??
        previous.name,
      code:
        input.code ??
        previous.code,
      status:
        input.status ??
        previous.status,
    };

    await updateClientById(
      connection,
      clientId,
      mutation,
    );

    const updated: PortalClient = {
      ...previous,
      ...mutation,
      updatedAt: new Date(),
    };

    await createAuditLog(
      connection,
      {
        actorUserId:
          options.actorUserId,
        action:
          previous.status !==
            updated.status &&
          previous.name ===
            updated.name &&
          previous.code ===
            updated.code
            ? updated.status ===
                'active'
              ? 'client_activated'
              : 'client_deactivated'
            : 'client_updated',
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
        previousData:
          auditData(previous),
        newData:
          auditData(updated),
      },
    );

    await connection.commit();

    return updated;
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
