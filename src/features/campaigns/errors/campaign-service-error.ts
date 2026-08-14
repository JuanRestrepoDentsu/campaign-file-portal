export class CampaignServiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'CampaignServiceError';
  }
}

export function isDuplicateEntryError(error: unknown): boolean {
  return Boolean(
    error && typeof error === 'object' &&
    'code' in error && error.code === 'ER_DUP_ENTRY',
  );
}
