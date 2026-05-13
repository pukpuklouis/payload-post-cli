import { PayloadClientError } from './errors.js';
import { createAuthHeadersResolver } from './auth.js';
import type { PayloadPostConfig, QueryResult } from '../types/index.js';

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path?: string;
  query?: Record<string, unknown>;
  json?: unknown;
  headers?: Record<string, string>;
}

export interface ClientOptions {
  verbose?: boolean | undefined;
}

function trimSlash(input: string): string {
  return input.replace(/\/+$/, '');
}

function appendQueryParams(
  params: URLSearchParams,
  prefix: string,
  value: unknown,
): void {
  if (value === undefined || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      appendQueryParams(params, `${prefix}[${index}]`, item);
    });
    return;
  }

  if (typeof value === 'object') {
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      appendQueryParams(params, prefix ? `${prefix}[${key}]` : key, nested);
    }
    return;
  }

  params.set(prefix, String(value));
}

function encodeQuery(query?: RequestOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    appendQueryParams(params, key, value);
  }
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
}

export function createPayloadClient(config: PayloadPostConfig, clientOptions: ClientOptions = {}) {
  const baseUrl = trimSlash(config.baseUrl);
  const collectionBase = `${baseUrl}/api/${config.collection}`;
  const resolveAuthHeaders = createAuthHeadersResolver(config);

  async function request<T = unknown>(options: RequestOptions = {}): Promise<T> {
    const method = options.method ?? 'GET';
    const path = options.path ? `/${options.path.replace(/^\/+/, '')}` : '';
    const query = encodeQuery(options.query);
    const url = `${collectionBase}${path}${query}`;

    const headers: Record<string, string> = {
      ...(options.headers ?? {}),
    };
    const init: RequestInit = { method, headers };
    if (options.json !== undefined) {
      headers['content-type'] = 'application/json';
      init.body = JSON.stringify(options.json);
    }

    Object.assign(headers, await resolveAuthHeaders());

    if (clientOptions.verbose) {
      const bodyPreview = options.json === undefined ? '' : `\nbody: ${JSON.stringify(options.json)}`;
      process.stderr.write(`[payload-post] ${method} ${url}${bodyPreview}\n`);
    }

    const response = await fetch(url, init);

    if (!response.ok) {
      const details = await parseResponse<unknown>(response);
      const message =
        typeof details === 'object' && details && 'message' in details
          ? String((details as { message?: unknown }).message ?? response.statusText)
          : response.statusText || `Request failed with status ${response.status}`;
      throw new PayloadClientError(message, response.status, details);
    }

    return parseResponse<T>(response);
  }

  return {
    request,
    find: (query: Record<string, unknown>) =>
      request<QueryResult<Record<string, unknown>>>({ method: 'GET', query }),
    findById: (id: string, query: Record<string, unknown> = {}) =>
      request<Record<string, unknown>>({ method: 'GET', path: id, query }),
    create: (json: Record<string, unknown>, query: Record<string, unknown> = {}) =>
      request<Record<string, unknown>>({ method: 'POST', json, query }),
    updateById: (
      id: string,
      json: Record<string, unknown>,
      query: Record<string, unknown> = {},
    ) => request<Record<string, unknown>>({ method: 'PATCH', path: id, json, query }),
    deleteById: (id: string, query: Record<string, unknown> = {}) =>
      request<Record<string, unknown>>({ method: 'DELETE', path: id, query }),
  };
}
