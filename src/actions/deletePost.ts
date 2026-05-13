import { ensureRequiredMappings } from '../config/mapping.js';
import { createPayloadClient } from '../client/http.js';
import type { PayloadPostConfig } from '../types/index.js';

export async function deletePost(
  config: PayloadPostConfig,
  id: string,
  options: { verbose?: boolean | undefined } = {},
): Promise<{ ok: true; id: string }> {
  ensureRequiredMappings(config);
  const client = createPayloadClient(config, options);
  await client.deleteById(id);
  return { ok: true, id };
}
