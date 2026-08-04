import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

import { UserServiceError } from '@/features/users/errors/user-service-error';

export function userValidationResponse(error: ZodError) {
  return NextResponse.json(
    {
      message: 'Revisa los datos enviados.',
      errors: error.flatten().fieldErrors,
    },
    { status: 400 },
  );
}

export function userServiceErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof UserServiceError)) {
    return null;
  }
  return NextResponse.json(
    { code: error.code, message: error.message },
    { status: error.status },
  );
}
