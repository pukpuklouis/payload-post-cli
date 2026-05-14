import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const template = `import type { PayloadPostWorkspaceConfig } from '@anlstudio/payload-post-cli';

export default {
  defaultProfile: 'main',
  profiles: {
    main: {
      baseUrl: 'http://localhost:3000',
      collection: 'posts',
      auth: { type: 'jwt', token: 'replace-me' },
      // Or log in with user credentials:
      // auth: { type: 'login', collection: 'users', username: 'writer', password: 'secret' },
      list: {
        columns: ['title', 'slug', 'status', 'updatedAt'],
        searchFields: ['title', 'slug', 'excerpt', 'content'],
      },
      fields: {
        id: 'id',
        title: 'title',
        slug: 'slug',
        status: 'status',
        excerpt: 'excerpt',
        content: 'content',
        updatedAt: 'updatedAt',
        publishedAt: 'publishedAt',
        author: 'author',
      },
    },
  },
} satisfies PayloadPostWorkspaceConfig;
`;

export function initConfigFile(cwd = process.cwd()): string {
  const target = resolve(cwd, 'payload-post.config.ts');

  if (existsSync(target)) {
    throw new Error(`Config already exists: ${target}`);
  }

  writeFileSync(target, template, 'utf8');
  return target;
}
