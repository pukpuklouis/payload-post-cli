import test from 'node:test';
import assert from 'node:assert/strict';
import { createPost } from '../../src/actions/createPost.js';
import { deletePost } from '../../src/actions/deletePost.js';
import { listPosts } from '../../src/actions/listPosts.js';
import { publishPost } from '../../src/actions/publishPost.js';
import { updatePost } from '../../src/actions/updatePost.js';
import type { PayloadPostConfig } from '../../src/types/index.js';

const config: PayloadPostConfig = {
  baseUrl: 'http://localhost:3000',
  collection: 'posts',
  auth: { type: 'jwt', token: 'token' },
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
  pagination: { limit: 10 },
};

function withMockFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (url: string | URL, init?: RequestInit) => {
    return handler(String(url), init);
  }) as typeof fetch;
  return () => {
    globalThis.fetch = originalFetch;
  };
}

test('listPosts maps documents and builds search/status queries', async () => {
  const restore = withMockFetch((url) => {
    assert.match(url, /\/api\/posts\?/);
    assert.match(url, /where%5B_status%5D%5Bequals%5D=draft/);
    assert.match(url, /where%5Bor%5D%5B0%5D%5Bheadline%5D%5Blike%5D=hello/);
    return new Response(
      JSON.stringify({
        docs: [
          {
            id: '1',
            headline: 'Hello',
            urlSlug: 'hello',
            _status: 'draft',
            lastModified: '2026-05-12T00:00:00.000Z',
          },
        ],
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    );
  });

  try {
    const result = await listPosts(config, { status: 'draft', search: 'hello', page: 2, limit: 5 });
    assert.equal(result.docs[0]?.title, 'Hello');
    assert.equal(result.docs[0]?.status, 'draft');
  } finally {
    restore();
  }
});

test('listPosts uses profile-specific search fields', async () => {
  const restore = withMockFetch((url) => {
    assert.match(url, /\/api\/posts\?/);
    assert.doesNotMatch(url, /where%5Bor%5D%5B0%5D%5Bheadline%5D%5Blike%5D=hello/);
    assert.match(url, /where%5Bor%5D%5B0%5D%5BurlSlug%5D%5Blike%5D=hello/);
    return new Response(JSON.stringify({ docs: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  try {
    await listPosts(
      {
        ...config,
        list: {
          searchFields: ['slug', 'content'],
        },
      },
      { search: 'hello' },
    );
  } finally {
    restore();
  }
});

test('createPost requires fields and posts mapped JSON', async () => {
  const restore = withMockFetch((url, init) => {
    assert.equal(url, 'http://localhost:3000/api/posts');
    assert.equal(init?.method, 'POST');
    const body = JSON.parse(String(init?.body));
    assert.equal(body.headline, 'Hello');
    assert.equal(body.urlSlug, 'hello');
    assert.equal(body._status, 'draft');
    return new Response(JSON.stringify({ id: '1', headline: 'Hello' }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  });

  try {
    const result = await createPost(config, { title: 'Hello', slug: 'hello' });
    assert.equal(result.id, '1');
  } finally {
    restore();
  }
});

test('createPost rejects missing required fields', async () => {
  await assert.rejects(() => createPost(config, { slug: 'hello' }), /Missing required field: title/);
});

test('update/delete/publish actions hit the right REST verbs', async () => {
  const calls: Array<{ url: string; method?: string; body?: string | null }> = [];
  const restore = withMockFetch((url, init) => {
    calls.push({ url, method: init?.method, body: typeof init?.body === 'string' ? init.body : null });
    if (init?.method === 'DELETE') {
      return new Response(null, { status: 200 });
    }
    return new Response(JSON.stringify({ id: '1' }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  });

  try {
    await updatePost(config, '1', { title: 'New title' });
    await publishPost(config, '1');
    await publishPost(config, '1', { unpublish: true });
    await deletePost(config, '1');

    assert.equal(calls[0]?.method, 'PATCH');
    assert.equal(calls[1]?.method, 'PATCH');
    assert.equal(calls[2]?.method, 'PATCH');
    assert.equal(calls[3]?.method, 'DELETE');
  } finally {
    restore();
  }
});
