import { CognitoIdentityProviderClient } from
  '@aws-sdk/client-cognito-identity-provider';

import { env } from '@/lib/env';

export const cognitoClient = new CognitoIdentityProviderClient({
  region: env.AWS_REGION,
});