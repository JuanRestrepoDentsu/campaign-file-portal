import {
  NextResponse,
} from 'next/server';
import type {
  ZodError,
} from 'zod';

import {
  getAuditRequestContext,
} from '@/features/audit/services/create-audit-log';
import {
  ClientServiceError,
} from '@/features/clients/errors/client-service-error';
import {
  clientListQuerySchema,
  createClientSchema,
} from '@/features/clients/schemas/client.schema';
import {
  createClient,
} from '@/features/clients/services/create-client';
import {
  getClients,
} from '@/features/clients/services/get-clients';
import {
  authorizeApiRoles,
} from '@/shared/auth/api-authorization';

function validationResponse(
  error: ZodError,
) {
  return NextResponse.json(
    {
      message:
        'Revisa los datos enviados.',
      errors:
        error.flatten()
          .fieldErrors,
    },
    {
      status: 400,
    },
  );
}

export async function GET(
  request: Request,
) {
  const authorization =
    await authorizeApiRoles([
      'super_admin',
    ]);

  if (!authorization.authorized) {
    return authorization.response;
  }

  const url = new URL(
    request.url,
  );

  const validation =
    clientListQuerySchema.safeParse({
      page:
        url.searchParams.get(
          'page',
        ) ?? undefined,
      pageSize:
        url.searchParams.get(
          'pageSize',
        ) ?? undefined,
      search:
        url.searchParams.get(
          'search',
        ) ?? undefined,
      status:
        url.searchParams.get(
          'status',
        ) ?? undefined,
    });

  if (!validation.success) {
    return validationResponse(
      validation.error,
    );
  }

  try {
    const result =
      await getClients(
        validation.data,
      );

    return NextResponse.json(
      result,
    );
  } catch (error) {
    console.error(
      'Get clients error:',
      error,
    );

    return NextResponse.json(
      {
        message:
          'No fue posible consultar los clientes.',
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
) {
  const authorization =
    await authorizeApiRoles([
      'super_admin',
    ]);

  if (!authorization.authorized) {
    return authorization.response;
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
    createClientSchema.safeParse(
      body,
    );

  if (!validation.success) {
    return validationResponse(
      validation.error,
    );
  }

  try {
    const client =
      await createClient(
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

    return NextResponse.json(
      {
        message:
          'Cliente creado correctamente.',
        client,
      },
      {
        status: 201,
      },
    );
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
      'Create client error:',
      error,
    );

    return NextResponse.json(
      {
        message:
          'No fue posible crear el cliente.',
      },
      {
        status: 500,
      },
    );
  }
}
