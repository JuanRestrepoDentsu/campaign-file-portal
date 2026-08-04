import {
  NextResponse,
} from 'next/server';

import {
  getAuditRequestContext,
} from '@/features/audit/services/create-audit-log';
import {
  ClientServiceError,
} from '@/features/clients/errors/client-service-error';
import {
  clientIdSchema,
  updateClientSchema,
} from '@/features/clients/schemas/client.schema';
import {
  getClient,
} from '@/features/clients/services/get-clients';
import {
  updateClient,
} from '@/features/clients/services/update-client';
import {
  authorizeApiRoles,
} from '@/shared/auth/api-authorization';

type ClientRouteContext = {
  params: Promise<{
    clientId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: ClientRouteContext,
) {
  const authorization =
    await authorizeApiRoles([
      'super_admin',
    ]);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const params =
    await context.params;
  const idValidation =
    clientIdSchema.safeParse(
      params.clientId,
    );

  if (!idValidation.success) {
    return NextResponse.json(
      {
        message:
          'El identificador del cliente no es válido.',
      },
      {
        status: 400,
      },
    );
  }

  try {
    const client =
      await getClient(
        idValidation.data,
      );

    if (!client) {
      return NextResponse.json(
        {
          message:
            'El cliente no existe.',
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      client,
    });
  } catch (error) {
    console.error(
      'Get client error:',
      error,
    );

    return NextResponse.json(
      {
        message:
          'No fue posible consultar el cliente.',
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: ClientRouteContext,
) {
  const authorization =
    await authorizeApiRoles([
      'super_admin',
    ]);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const params =
    await context.params;
  const idValidation =
    clientIdSchema.safeParse(
      params.clientId,
    );

  if (!idValidation.success) {
    return NextResponse.json(
      {
        message:
          'El identificador del cliente no es válido.',
      },
      {
        status: 400,
      },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        message:
          'El cuerpo de la solicitud no es JSON válido.',
      },
      {
        status: 400,
      },
    );
  }

  const validation =
    updateClientSchema.safeParse(
      body,
    );

  if (!validation.success) {
    return NextResponse.json(
      {
        message:
          'Revisa los datos enviados.',
        errors:
          validation.error
            .flatten()
            .fieldErrors,
      },
      {
        status: 400,
      },
    );
  }

  try {
    const client =
      await updateClient(
        idValidation.data,
        validation.data,
        {
          actorUserId:
            authorization.user.id,
          requestContext:
            getAuditRequestContext(
              request,
            ),
        },
      );

    return NextResponse.json({
      message:
        'Cliente actualizado correctamente.',
      client,
    });
  } catch (error) {
    if (
      error instanceof
      ClientServiceError
    ) {
      return NextResponse.json(
        {
          code: error.code,
          message: error.message,
        },
        {
          status: error.status,
        },
      );
    }

    console.error(
      'Update client error:',
      error,
    );

    return NextResponse.json(
      {
        message:
          'No fue posible actualizar el cliente.',
      },
      {
        status: 500,
      },
    );
  }
}
