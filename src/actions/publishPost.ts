import { ensureRequiredMappings } from '../config/mapping.js';
import { createPayloadClient } from '../client/http.js';
import { toPayloadField } from '../config/mapping.js';
import type { PayloadPostConfig, PostRecord } from '../types/index.js';

export async function publishPost(
  config: PayloadPostConfig,
  id: string,
  options: { unpublish?: boolean; verbose?: boolean | undefined } = {},
): Promise<PostRecord> {
  ensureRequiredMappings(config);
  const client = createPayloadClient(config, { verbose: options.verbose });
  const statusField = toPayloadField(config, 'status');
  const status = options.unpublish ? 'draft' : 'published';
  return (await client.updateById(id, { [statusField]: status })) as PostRecord;
}
