export type UserErrorCode =
  | 'USER_NOT_FOUND'
  | 'USER_EMAIL_CONFLICT'
  | 'USER_INVALID_CLIENT'
  | 'USER_INVALID_CAMPAIGNS'
  | 'USER_SELF_STATUS_CHANGE'
  | 'USER_COGNITO_CONFLICT'
  | 'USER_COGNITO_NOT_FOUND'
  | 'USER_COMPENSATION_FAILED';

export class UserServiceError extends Error {
  constructor(
    public readonly code: UserErrorCode,
    message: string,
    public readonly status: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'UserServiceError';
  }
}

export function isDuplicateEntryError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ER_DUP_ENTRY'
  );
}
