import { createHmac } from 'node:crypto';

import { env } from '@/lib/env';

export function generateSecretHash(username: string): string {
  return createHmac('sha256', env.COGNITO_CLIENT_SECRET)
    .update(`${username}${env.COGNITO_CLIENT_ID}`)
    .digest('base64');
}