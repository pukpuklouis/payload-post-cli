import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAuthHeaders } from '../../src/client/auth.js';
import { createPayloadClient } from '../../src/client/http.js';
import type { PayloadPostConfig } from '../../src/types/index.js';

const config: PayloadPostConfig = {
  baseUrl: 'http://localhost:3000',
  collection: 'posts',
  auth: { type: 'apiKey', key: 'secret', collection: 'users' },
  fields: {
    title: 'headline',
    slug: 'urlSlug',
    status: '_status',
    excerpt: 'summary',
    content: 'body',
    updatedAt: 'lastModified',
    publishedAt: 'goLiveAt',
    author: 'writtenBy',
  },
};

test('buildAuthHeaders formats JWT and API key headers', () => {
  assert.deepEqual(buildAuthHeaders(config), {
    Authorization: 'users API-Key secret',
  });

  assert.deepEqual(
    buildAuthHeaders({ ...config, auth: { type: 'jwt', token: 'token' } }),
    { Authorization: 'JWT token' },
  );
});

test('createPayloadClient sends auth headers and serializes JSON', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const client = createPayloadClient(config);
    await client.create({ headline: 'x' }, { draft: true });

    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, 'http://localhost:3000/api/posts?draft=true');
    assert.equal(calls[0]?.init?.method, 'POST');
    assert.equal((calls[0]?.init?.headers as Record<string, string>).Authorization, 'users API-Key secret');
    assert.equal((calls[0]?.init?.headers as Record<string, string>)['content-type'], 'application/json');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('createPayloadClient writes verbose request details to stderr', async () => {
  const originalFetch = globalThis.fetch;
  const originalWrite = process.stderr.write;
  const stderr: string[] = [];
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })) as typeof fetch;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr.push(String(chunk));
    return true;
  }) as typeof process.stderr.write;

  try {
    const client = createPayloadClient(config, { verbose: true });
    await client.create({ headline: 'x' });
    assert.match(stderr.join(''), /\[payload-post\] POST http:\/\/localhost:3000\/api\/posts/);
  } finally {
    globalThis.fetch = originalFetch;
    process.stderr.write = originalWrite;
  }
});

test('createPayloadClient logs in once and reuses the JWT for subsequent requests', async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith('/api/users/login')) {
      return new Response(JSON.stringify({ token: 'fresh-token' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  try {
    const client = createPayloadClient({
      ...config,
      auth: {
        type: 'login',
        collection: 'users',
        username: 'writer',
        password: 'secret',
      },
    });

    await client.create({ headline: 'x' });
    await client.find({});

    assert.equal(calls[0]?.url, 'http://localhost:3000/api/users/login');
    assert.equal(calls[1]?.url, 'http://localhost:3000/api/posts');
    assert.equal((calls[1]?.init?.headers as Record<string, string>).Authorization, 'JWT fresh-token');
    assert.equal(calls[2]?.url, 'http://localhost:3000/api/posts');
    assert.equal((calls[2]?.init?.headers as Record<string, string>).Authorization, 'JWT fresh-token');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
