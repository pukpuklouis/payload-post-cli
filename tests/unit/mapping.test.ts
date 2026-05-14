import test from 'node:test';
import assert from 'node:assert/strict';
import { fromPayloadFields, toPayloadData, toPayloadField } from '../../src/config/mapping.js';
import type { PayloadPostConfig } from '../../src/types/index.js';

const config: PayloadPostConfig = {
  baseUrl: 'http://localhost:3000',
  collection: 'posts',
  auth: { type: 'jwt', token: 'abc' },
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

test('toPayloadField uses configured mappings and status fallback', () => {
  assert.equal(toPayloadField(config, 'title'), 'headline');
  assert.equal(toPayloadField(config, 'status'), '_status');
});

test('toPayloadData maps content and status fields', () => {
  const data = toPayloadData(config, {
    title: 'Hello',
    slug: 'hello',
    content: [{ children: [{ text: 'x' }] }],
    status: 'draft',
  });

  assert.equal(data.headline, 'Hello');
  assert.equal(data.urlSlug, 'hello');
  assert.equal(data._status, 'draft');
  assert.equal(typeof data.body, 'string');
});

test('fromPayloadFields maps known fields and fills publishedAt null', () => {
  const doc = fromPayloadFields(config, {
    id: '1',
    headline: 'Hello',
    urlSlug: 'hello',
    _status: 'published',
    body: [{ type: 'block' }],
    writtenBy: { id: 'u1', name: 'Ada' },
    lastModified: '2026-05-12T00:00:00.000Z',
  });

  assert.equal(doc.title, 'Hello');
  assert.equal(doc.slug, 'hello');
  assert.equal(doc.status, 'published');
  assert.equal(doc.author, 'Ada');
  assert.equal(doc.publishedAt, null);
  assert.equal(typeof doc.content, 'string');
});

test('fromPayloadFields preserves unmapped fields without warning', () => {
  const originalWarn = console.warn;
  let warnCount = 0;
  console.warn = () => {
    warnCount += 1;
  };

  try {
    const doc = fromPayloadFields(config, {
      id: '1',
      headline: 'Hello',
      customField: 'kept',
    });

    assert.equal(doc.customField, 'kept');
    assert.equal(warnCount, 0);
  } finally {
    console.warn = originalWarn;
  }
});
