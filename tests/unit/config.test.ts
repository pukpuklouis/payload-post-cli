import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { loadConfig } from '../../src/config/loader.js';
import { PayloadPostConfigSchema } from '../../src/config/schema.js';

test('PayloadPostConfigSchema applies defaults', () => {
  const parsed = PayloadPostConfigSchema.parse({
    baseUrl: 'http://localhost:3000',
    auth: { type: 'jwt', token: 'abc' },
  });

  assert.equal(parsed.collection, 'posts');
  assert.equal(parsed.fields.title, 'title');
});

test('loadConfig reads JSON config files', async () => {
  const cwd = mkdtempSync(resolve(tmpdir(), 'payload-post-cli-'));
  writeFileSync(
    resolve(cwd, 'payload-post.config.json'),
    JSON.stringify({
      baseUrl: 'http://localhost:3000',
      collection: 'articles',
      auth: { type: 'jwt', token: 'abc' },
    }),
    'utf8',
  );

  const config = await loadConfig({ cwd });
  assert.equal(config.collection, 'articles');
  assert.equal(config.auth.type, 'jwt');
});

test('PayloadPostConfigSchema accepts username/password login auth', () => {
  const parsed = PayloadPostConfigSchema.parse({
    baseUrl: 'http://localhost:3000',
    auth: {
      type: 'login',
      collection: 'users',
      username: 'writer',
      password: 'secret',
    },
  });

  assert.equal(parsed.auth.type, 'login');
  assert.equal(parsed.auth.collection, 'users');
});
