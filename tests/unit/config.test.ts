import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { loadConfig } from '../../src/config/loader.js';
import {
  PayloadPostConfigSchema,
  PayloadPostWorkspaceConfigSchema,
} from '../../src/config/schema.js';

test('PayloadPostConfigSchema applies defaults', () => {
  const parsed = PayloadPostConfigSchema.parse({
    baseUrl: 'http://localhost:3000',
    auth: { type: 'jwt', token: 'abc' },
  });

  assert.equal(parsed.collection, 'posts');
  assert.equal(parsed.fields.title, 'title');
});

test('PayloadPostConfigSchema accepts list presentation overrides', () => {
  const parsed = PayloadPostConfigSchema.parse({
    baseUrl: 'http://localhost:3000',
    auth: { type: 'jwt', token: 'abc' },
    list: {
      columns: ['slug', 'title', 'status'],
      searchFields: ['slug', 'excerpt'],
    },
  });

  assert.deepEqual(parsed.list?.columns, ['slug', 'title', 'status']);
  assert.deepEqual(parsed.list?.searchFields, ['slug', 'excerpt']);
});

test('PayloadPostConfigSchema rejects invalid list columns', () => {
  assert.throws(
    () =>
      PayloadPostConfigSchema.parse({
        baseUrl: 'http://localhost:3000',
        auth: { type: 'jwt', token: 'abc' },
        list: {
          columns: ['title', 'title'] as never,
        },
      }),
    /list\.columns must not contain duplicates/,
  );
});

test('PayloadPostConfigSchema rejects invalid list search fields', () => {
  assert.throws(
    () =>
      PayloadPostConfigSchema.parse({
        baseUrl: 'http://localhost:3000',
        auth: { type: 'jwt', token: 'abc' },
        list: {
          searchFields: ['title', 'body'] as never,
        },
      }),
    /Invalid option|Invalid enum value/,
  );
});

test('loadConfig reads JSON config files', async () => {
  const cwd = mkdtempSync(resolve(tmpdir(), 'payload-post-cli-'));
  writeFileSync(
    resolve(cwd, 'payload-post.config.json'),
    JSON.stringify({
      defaultProfile: 'main',
      profiles: {
        main: {
          baseUrl: 'http://localhost:3000',
          collection: 'articles',
          auth: { type: 'jwt', token: 'abc' },
        },
        newsroom: {
          baseUrl: 'http://localhost:4000',
          collection: 'stories',
          auth: { type: 'jwt', token: 'xyz' },
        },
      },
    }),
    'utf8',
  );

  const config = await loadConfig({ cwd, profile: 'newsroom' });
  assert.equal(config.baseUrl, 'http://localhost:4000');
  assert.equal(config.collection, 'stories');
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

test('PayloadPostWorkspaceConfigSchema accepts multiple profiles', () => {
  const parsed = PayloadPostWorkspaceConfigSchema.parse({
    defaultProfile: 'main',
    profiles: {
      main: {
        baseUrl: 'http://localhost:3000',
        auth: { type: 'jwt', token: 'abc' },
      },
      secondary: {
        baseUrl: 'http://localhost:4000',
        auth: { type: 'jwt', token: 'def' },
      },
    },
  });

  assert.equal(parsed.defaultProfile, 'main');
  assert.equal(Object.keys(parsed.profiles).length, 2);
});
