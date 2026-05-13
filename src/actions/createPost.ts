import { ensureRequiredMappings, toPayloadData } from '../config/mapping.js';
import { createPayloadClient } from '../client/http.js';
import type { CreatePostArgs, PayloadPostConfig, PostRecord } from '../types/index.js';

function ensureRequiredValues(args: CreatePostArgs): void {
  for (const key of ['title', 'slug'] as const) {
    const value = args[key];
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Missing required field: ${key}`);
    }
  }
}

export async function createPost(
  config: PayloadPostConfig,
  args: CreatePostArgs,
  options: { verbose?: boolean | undefined } = {},
): Promise<PostRecord> {
  ensureRequiredMappings(config);
  ensureRequiredValues(args);
  const client = createPayloadClient(config, options);

  const data = {
    ...args,
    status: args.status ?? 'draft',
  };

  const response = await client.create(toPayloadData(config, data));
  return response as PostRecord;
}
