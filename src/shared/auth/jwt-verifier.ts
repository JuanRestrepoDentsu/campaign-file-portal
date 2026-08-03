import { CognitoJwtVerifier } from 'aws-jwt-verify';

import { env } from '@/shared/config/env';

export const accessTokenVerifier =
  CognitoJwtVerifier.create({
    userPoolId: env.COGNITO_USER_POOL_ID,
    tokenUse: 'access',
    clientId: env.COGNITO_CLIENT_ID,
  });

export const idTokenVerifier =
  CognitoJwtVerifier.create({
    userPoolId: env.COGNITO_USER_POOL_ID,
    tokenUse: 'id',
    clientId: env.COGNITO_CLIENT_ID,
  });