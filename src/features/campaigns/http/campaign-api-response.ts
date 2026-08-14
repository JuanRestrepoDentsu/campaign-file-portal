import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

import { CampaignServiceError } from '@/features/campaigns/errors/campaign-service-error';

export function campaignValidationResponse(error: ZodError) {
  return NextResponse.json(
    { message: 'Revisa los datos enviados.', errors: error.flatten().fieldErrors },
    { status: 400 },
  );
}

export function campaignServiceErrorResponse(error: unknown): NextResponse | null {
  if (!(error instanceof CampaignServiceError)) return null;
  return NextResponse.json(
    { code: error.code, message: error.message },
    { status: error.status },
  );
}
