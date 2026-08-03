import { CognitoIdentityProviderClient } from
  '@aws-sdk/client-cognito-identity-provider';

import { env } from '@/shared/config/env';

export const cognitoClient = new CognitoIdentityProviderClient({
  region: env.AWS_REGION,
});