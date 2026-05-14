import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
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

export function getGlobalConfigDir(): string {
  return resolve(homedir(), '.config', 'payload-post');
}

export function getGlobalConfigPath(): string {
  return resolve(getGlobalConfigDir(), 'payload-post.config.ts');
}

export function initConfigFile(outDir?: string): string {
  const targetDir = outDir ? resolve(outDir) : getGlobalConfigDir();
  const target = resolve(targetDir, 'payload-post.config.ts');

  if (existsSync(target)) {
    throw new Error(`Config already exists: ${target}`);
  }

  mkdirSync(targetDir, { recursive: true });
  writeFileSync(target, template, 'utf8');
  return target;
}
