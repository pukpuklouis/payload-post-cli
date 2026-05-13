import { ensureRequiredMappings, toPayloadData } from '../config/mapping.js';
import { createPayloadClient } from '../client/http.js';
import type { PayloadPostConfig, PostRecord, UpdatePostArgs } from '../types/index.js';

export async function updatePost(
  config: PayloadPostConfig,
  id: string,
  args: UpdatePostArgs,
  options: { verbose?: boolean | undefined } = {},
): Promise<PostRecord> {
  ensureRequiredMappings(config);
  const client = createPayloadClient(config, options);
  return (await client.updateById(id, toPayloadData(config, args))) as PostRecord;
}
