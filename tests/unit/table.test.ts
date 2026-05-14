import test from 'node:test';
import assert from 'node:assert/strict';
import { formatPostsTable } from '../../src/formatters/table.js';

test('formatPostsTable uses the default column order', () => {
  const output = formatPostsTable([
    {
      title: 'Hello',
      slug: 'hello',
      status: 'draft',
      updatedAt: '2026-05-12T00:00:00.000Z',
    },
  ]);

  const [header] = output.split('\n');
  assert.match((header ?? '').trimEnd(), /^Title\s+Slug\s+Status\s+Updated At$/);
});

test('formatPostsTable respects custom column order and empty cells', () => {
  const output = formatPostsTable(
    [
      {
        title: 'Hello',
        slug: 'hello',
      },
    ],
    ['slug', 'title', 'author'],
  );

  const [header, divider, row] = output.split('\n');
  assert.match((header ?? '').trimEnd(), /^Slug\s+Title\s+Author$/);
  assert.match((divider ?? '').trimEnd(), /^-+\s+-+\s+-+$/);
  assert.match((row ?? '').trimEnd(), /^hello\s+Hello$/);
});
