import type { PayloadPostConfig } from '../types/index.js';

function trimSlash(input: string): string {
  return input.replace(/\/+$/, '');
}

export function buildAuthHeaders(config: PayloadPostConfig): Record<string, string> {
  if (config.auth.type === 'jwt') {
    return {
      Authorization: `JWT ${config.auth.token}`,
    };
  }

  if (config.auth.type === 'apiKey') {
    return {
      Authorization: `${config.auth.collection ?? config.collection} API-Key ${config.auth.key}`,
    };
  }

  throw new Error('Login auth requires token exchange before headers can be built.');
}

async function loginForToken(config: PayloadPostConfig): Promise<string> {
  if (config.auth.type !== 'login') {
    throw new Error('Login auth requires username/password credentials.');
  }

  const hasEmail = typeof config.auth.email === 'string';
  const hasUsername = typeof config.auth.username === 'string';
  if (hasEmail === hasUsername) {
    throw new Error('Login auth requires exactly one of email or username.');
  }

  const loginField = hasEmail ? 'email' : 'username';
  const loginValue = hasEmail ? config.auth.email : config.auth.username;

  const baseUrl = trimSlash(config.baseUrl);
  const url = `${baseUrl}/api/${config.auth.collection}/login`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      [loginField]: loginValue,
      password: config.auth.password,
    }),
  });

  const details = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof details === 'object' && details && 'message' in details
        ? String((details as { message?: unknown }).message ?? response.statusText)
        : response.statusText || `Login failed with status ${response.status}`;
    throw new Error(message);
  }

  if (typeof details !== 'object' || details === null || !('token' in details)) {
    throw new Error('Login response did not include a token.');
  }

  const token = String((details as { token?: unknown }).token ?? '');
  if (!token) {
    throw new Error('Login response did not include a token.');
  }

  return token;
}

export function createAuthHeadersResolver(config: PayloadPostConfig): () => Promise<Record<string, string>> {
  let cachedHeaders: Record<string, string> | null = null;
  let inFlight: Promise<Record<string, string>> | null = null;

  return async () => {
    if (cachedHeaders) {
      return cachedHeaders;
    }

    if (!inFlight) {
      inFlight = (async () => {
        if (config.auth.type === 'login') {
          const token = await loginForToken(config);
          return { Authorization: `JWT ${token}` };
        }

        return buildAuthHeaders(config);
      })();
    }

    cachedHeaders = await inFlight;
    inFlight = null;
    return cachedHeaders;
  };
}
