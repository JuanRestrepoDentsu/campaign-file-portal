import {
  AdminAddUserToGroupCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminRemoveUserFromGroupCommand,
  AdminUserGlobalSignOutCommand,
  UsernameExistsException,
  UserNotFoundException,
} from '@aws-sdk/client-cognito-identity-provider';

import { UserServiceError } from '@/features/users/errors/user-service-error';
import type { PortalUserRole } from '@/features/users/types/user';
import { cognitoClient } from '@/shared/auth/cognito';
import { env } from '@/shared/config/env';

function mapCognitoError(error: unknown): never {
  if (error instanceof UsernameExistsException) {
    throw new UserServiceError(
      'USER_COGNITO_CONFLICT',
      'Ya existe un usuario en Cognito con ese correo.',
      409,
      error,
    );
  }

  if (error instanceof UserNotFoundException) {
    throw new UserServiceError(
      'USER_COGNITO_NOT_FOUND',
      'El usuario no existe en Cognito.',
      409,
      error,
    );
  }

  throw error;
}

export async function createCognitoUser(input: {
  email: string;
  firstName: string;
  lastName: string | null;
}): Promise<{ sub: string }> {
  try {
    const result = await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID,
        Username: input.email,
        DesiredDeliveryMediums: ['EMAIL'],
        UserAttributes: [
          { Name: 'email', Value: input.email },
          { Name: 'email_verified', Value: 'true' },
          { Name: 'given_name', Value: input.firstName },
          ...(input.lastName
            ? [{ Name: 'family_name', Value: input.lastName }]
            : []),
        ],
      }),
    );

    const sub = result.User?.Attributes?.find(
      (attribute) => attribute.Name === 'sub',
    )?.Value;

    if (!sub) {
      throw new Error('Cognito no devolvió el sub del usuario creado.');
    }

    return { sub };
  } catch (error) {
    return mapCognitoError(error);
  }
}

export async function deleteCognitoUser(username: string): Promise<void> {
  await cognitoClient.send(
    new AdminDeleteUserCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID,
      Username: username,
    }),
  );
}

export async function addCognitoGroup(
  username: string,
  role: PortalUserRole,
): Promise<void> {
  await cognitoClient.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID,
      Username: username,
      GroupName: role,
    }),
  );
}

export async function removeCognitoGroup(
  username: string,
  role: PortalUserRole,
): Promise<void> {
  await cognitoClient.send(
    new AdminRemoveUserFromGroupCommand({
      UserPoolId: env.COGNITO_USER_POOL_ID,
      Username: username,
      GroupName: role,
    }),
  );
}

export async function setCognitoEnabled(
  username: string,
  enabled: boolean,
): Promise<void> {
  try {
    await cognitoClient.send(
      enabled
        ? new AdminEnableUserCommand({
            UserPoolId: env.COGNITO_USER_POOL_ID,
            Username: username,
          })
        : new AdminDisableUserCommand({
            UserPoolId: env.COGNITO_USER_POOL_ID,
            Username: username,
          }),
    );
  } catch (error) {
    return mapCognitoError(error);
  }
}

export async function resendCognitoInvitation(
  username: string,
): Promise<void> {
  try {
    await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID,
        Username: username,
        MessageAction: 'RESEND',
        DesiredDeliveryMediums: ['EMAIL'],
      }),
    );
  } catch (error) {
    return mapCognitoError(error);
  }
}

export async function signOutCognitoUser(
  username: string,
): Promise<void> {
  try {
    await cognitoClient.send(
      new AdminUserGlobalSignOutCommand({
        UserPoolId: env.COGNITO_USER_POOL_ID,
        Username: username,
      }),
    );
  } catch (error) {
    return mapCognitoError(error);
  }
}
