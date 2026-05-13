import { ensureRequiredMappings, fromPayloadFields, toPayloadField } from '../config/mapping.js';
import type { ListPostsArgs, PayloadPostConfig, PostRecord } from '../types/index.js';
import { createPayloadClient } from '../client/http.js';

export async function listPosts(
  config: PayloadPostConfig,
  args: ListPostsArgs = {},
  options: { verbose?: boolean | undefined } = {},
) {
  ensureRequiredMappings(config);
  const client = createPayloadClient(config, options);

  const where: Record<string, unknown> = {};

  if (args.status) {
    where[toPayloadField(config, 'status')] = { equals: args.status };
  }

  if (args.search) {
    const searchableFields = ['title', 'slug', 'excerpt', 'content']
      .map((field) => config.fields[field as keyof PayloadPostConfig['fields']] ?? field)
      .filter(Boolean);

    where.or = searchableFields.map((field) => ({
      [field]: { like: args.search },
    }));
  }

  const response = await client.find({
    limit: args.limit ?? config.pagination?.limit ?? 10,
    page: args.page ?? 1,
    sort: args.sort ?? '-updatedAt',
    where,
  });

  return {
    ...response,
    docs: response.docs.map((doc) => fromPayloadFields(config, doc) as PostRecord),
  };
}
