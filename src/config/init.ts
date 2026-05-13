import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const template = `import type { PayloadPostConfig } from 'payload-post-cli';

export default {
  baseUrl: 'http://localhost:3000',
  collection: 'posts',
  auth: { type: 'jwt', token: 'replace-me' },
  // Or log in with user credentials:
  // auth: { type: 'login', collection: 'users', username: 'writer', password: 'secret' },
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
} satisfies PayloadPostConfig;
`;

export function initConfigFile(cwd = process.cwd()): string {
  const target = resolve(cwd, 'payload-post.config.ts');

  if (existsSync(target)) {
    throw new Error(`Config already exists: ${target}`);
  }

  writeFileSync(target, template, 'utf8');
  return target;
}
