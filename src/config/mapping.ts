import { localFieldNames, type PayloadPostConfig, type PostRecord } from '../types/index.js';

const knownPassthroughFields = new Set([
  'createdAt',
  'updatedAt',
  'id',
  '_id',
  'docId',
  'totalDocs',
  'limit',
  'totalPages',
  'page',
  'pagingCounter',
  'hasPrevPage',
  'hasNextPage',
  'prevPage',
  'nextPage',
]);

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

export function ensureRequiredMappings(config: PayloadPostConfig): void {
  for (const key of ['title', 'slug', 'status'] as const) {
    const mapped = config.fields[key];
    if (typeof mapped !== 'string' || mapped.trim().length === 0) {
      throw new ConfigError(`missing field mapping for "${key}"`);
    }
  }
}

export function toPayloadField(config: PayloadPostConfig, localField: string): string {
  if (localField === 'status') {
    return config.fields.status ?? '_status';
  }

  return config.fields[localField as keyof PayloadPostConfig['fields']] ?? localField;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function fromPayloadFields(
  config: PayloadPostConfig,
  payloadDoc: Record<string, unknown>,
): PostRecord {
  const reverseMap = Object.entries(config.fields).reduce(
    (acc, [local, remote]) => {
      acc[remote] = local;
      return acc;
    },
    {} as Record<string, string>,
  );

  const result: PostRecord = {};

  for (const [key, value] of Object.entries(payloadDoc)) {
    const localKey = reverseMap[key] ?? key;

    if (!(localKey in result) && !localFieldNames.includes(localKey as (typeof localFieldNames)[number]) && !knownPassthroughFields.has(key)) {
      console.warn(`payload-post: unknown payload field "${key}" in response`);
    }

    if (localKey === 'content' && Array.isArray(value)) {
      result[localKey] = JSON.stringify(value);
      continue;
    }

    if (localKey === 'author' && isPlainObject(value)) {
      const name = value.name;
      result[localKey] = typeof name === 'string' ? name : String(value.id ?? '');
      continue;
    }

    result[localKey] = value as never;
  }

  if (!('publishedAt' in result)) {
    result.publishedAt = null;
  }

  return result;
}

export function toPayloadData(
  config: PayloadPostConfig,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const payloadData: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const remoteKey = toPayloadField(config, key);

    if (key === 'content' && Array.isArray(value)) {
      payloadData[remoteKey] = JSON.stringify(value);
      continue;
    }

    payloadData[remoteKey] = value;
  }

  return payloadData;
}
