type AccessTokenPayload = {
  username?: string;
  exp?: number;
};

export function readAccessTokenPayload(
  token: string,
): AccessTokenPayload | null {
  try {
    const [, encodedPayload] = token.split('.');

    if (!encodedPayload) {
      return null;
    }

    const normalized = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const decoded = Buffer.from(
      normalized,
      'base64',
    ).toString('utf8');

    return JSON.parse(decoded) as AccessTokenPayload;
  } catch {
    return null;
  }
}