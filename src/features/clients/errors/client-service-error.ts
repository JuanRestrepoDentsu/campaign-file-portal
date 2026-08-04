export type ClientErrorCode =
  | 'CLIENT_NOT_FOUND'
  | 'CLIENT_CODE_CONFLICT';

export class ClientServiceError extends Error {
  constructor(
    public readonly code:
      ClientErrorCode,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name =
      'ClientServiceError';
  }
}

export function isDuplicateEntryError(
  error: unknown,
): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ER_DUP_ENTRY'
  );
}
