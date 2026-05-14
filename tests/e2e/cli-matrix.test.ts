import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { execFile as execFileCb } from 'node:child_process';

const execFile = promisify(execFileCb);
const binPath = resolve(process.cwd(), 'bin/payload-post');

async function startMockPayloadServer() {
  const state = {
    posts: [
      {
        id: '1',
        title: 'Hello',
        slug: 'hello',
        status: 'draft',
        updatedAt: '2026-05-12T00:00:00.000Z',
      },
    ],
  };
  let lastQuery = '';

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const auth = req.headers.authorization ?? '';
    if (req.method === 'POST' && url.pathname === '/api/users/login') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const json = JSON.parse(body || '{}');
      if (json.username !== 'writer' || json.password !== 'secret') {
        res.writeHead(401, {'content-type': 'application/json'});
        res.end(JSON.stringify({message: 'Unauthorized'}));
        return;
      }

      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify({user: {id: 'u1'}, token: 'token', exp: 9999999999}));
      return;
    }

    if (auth !== 'JWT token' && auth !== 'posts API-Key secret') {
      res.writeHead(401, {'content-type': 'application/json'});
      res.end(JSON.stringify({message: 'Unauthorized'}));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/posts') {
      lastQuery = url.search;
      const status = url.searchParams.get('where[_status][equals]') ?? '';
      const searches = Array.from(url.searchParams.entries())
        .filter(([key]) => key.includes('[like]'))
        .map(([, value]) => value);
      const docs = state.posts.filter((post) => {
        const matchesStatus = status ? post.status === status : true;
        const matchesSearch = searches.length
          ? searches.some(
              (search) =>
                post.title.toLowerCase().includes(search.toLowerCase()) ||
                post.slug.toLowerCase().includes(search.toLowerCase()),
            )
          : true;
        return matchesStatus && matchesSearch;
      });
      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify({docs, totalDocs: docs.length, page: 1, limit: 10}));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/posts') {
      let body = '';
      for await (const chunk of req) body += chunk;
      const json = JSON.parse(body || '{}');
      if (!json.headline || !json.urlSlug) {
        res.writeHead(400, {'content-type': 'application/json'});
        res.end(JSON.stringify({message: 'Missing required field'}));
        return;
      }
      const created = {
        id: String(state.posts.length + 1),
        title: json.headline,
        slug: json.urlSlug,
        status: json._status ?? 'draft',
        updatedAt: '2026-05-12T00:00:00.000Z',
      };
      state.posts.push(created);
      res.writeHead(201, {'content-type': 'application/json'});
      res.end(JSON.stringify(created));
      return;
    }

    if (req.method === 'PATCH' && url.pathname.startsWith('/api/posts/')) {
      const id = url.pathname.split('/').pop() ?? '';
      const doc = state.posts.find((post) => post.id === id);
      if (!doc) {
        res.writeHead(404, {'content-type': 'application/json'});
        res.end(JSON.stringify({message: 'Not found'}));
        return;
      }
      let body = '';
      for await (const chunk of req) body += chunk;
      const json = JSON.parse(body || '{}');
      if (json.headline) doc.title = json.headline;
      if (json.urlSlug) doc.slug = json.urlSlug;
      if (json._status) doc.status = json._status;
      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify(doc));
      return;
    }

    if (req.method === 'DELETE' && url.pathname.startsWith('/api/posts/')) {
      const id = url.pathname.split('/').pop() ?? '';
      if (id === 'missing') {
        res.writeHead(404, {'content-type': 'application/json'});
        res.end(JSON.stringify({message: 'Not found'}));
        return;
      }
      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify({ok: true}));
      return;
    }

    res.writeHead(404, {'content-type': 'application/json'});
    res.end(JSON.stringify({message: 'Unhandled route'}));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No server address');
  return {
    server,
    url: `http://127.0.0.1:${address.port}`,
    getLastQuery: () => lastQuery,
  };
}

test('command matrix, config override, JSON output, and error paths', async () => {
  const {server, url, getLastQuery} = await startMockPayloadServer();
  const cwd = mkdtempSync(resolve(tmpdir(), 'payload-post-cli-matrix-'));
  const configPath = resolve(cwd, 'custom.config.json');
  writeFileSync(
    configPath,
    JSON.stringify({
      defaultProfile: 'main',
      profiles: {
        main: {
          baseUrl: url,
          collection: 'posts',
          auth: {type: 'login', collection: 'users', username: 'writer', password: 'secret'},
          fields: {
            id: 'id',
            title: 'headline',
            slug: 'urlSlug',
            status: '_status',
            excerpt: 'summary',
            content: 'body',
            updatedAt: 'updatedAt',
            publishedAt: 'publishedAt',
            author: 'author',
          },
        },
        newsroom: {
          baseUrl: url,
          collection: 'posts',
          auth: {type: 'login', collection: 'users', username: 'writer', password: 'secret'},
          fields: {
            id: 'id',
            title: 'headline',
            slug: 'urlSlug',
            status: '_status',
            excerpt: 'summary',
            content: 'body',
            updatedAt: 'updatedAt',
            publishedAt: 'publishedAt',
            author: 'author',
          },
          list: {
            columns: ['slug', 'title', 'status'],
            searchFields: ['slug'],
          },
        },
      },
    }),
    'utf8',
  );

  try {
    const list = await execFile('node', [binPath, '--config', configPath, '--json', 'list'], {cwd});
    const parsed = JSON.parse(list.stdout);
    assert.equal(parsed.docs[0].title, 'Hello');

    const filtered = await execFile('node', [binPath, '--config', configPath, 'list', '--status', 'draft'], {cwd});
    assert.match(filtered.stdout, /Hello/);

    const searched = await execFile('node', [binPath, '--config', configPath, 'list', '--search', 'hell'], {cwd});
    assert.match(searched.stdout, /Hello/);

    const newsroom = await execFile(
      'node',
      [binPath, '--config', configPath, '--profile', 'newsroom', 'list', '--search', 'hello'],
      {cwd},
    );
    const newsroomHeader = newsroom.stdout.split('\n')[0]?.trimEnd() ?? '';
    assert.match(newsroomHeader, /^Slug\s+Title\s+Status$/);
    assert.doesNotMatch(newsroom.stdout, /Updated At/);
    assert.match(getLastQuery(), /where%5Bor%5D%5B0%5D%5BurlSlug%5D%5Blike%5D=hello/);
    assert.doesNotMatch(getLastQuery(), /headline/);

    const missingCollectionPath = resolve(cwd, 'missing-collection.config.json');
    writeFileSync(
      missingCollectionPath,
      JSON.stringify({
        baseUrl: url,
        collection: 'missing',
        auth: {type: 'login', collection: 'users', username: 'writer', password: 'secret'},
        fields: {
          id: 'id',
          title: 'headline',
          slug: 'urlSlug',
          status: '_status',
          excerpt: 'summary',
          content: 'body',
          updatedAt: 'updatedAt',
          publishedAt: 'publishedAt',
          author: 'author',
        },
      }),
      'utf8',
    );
    await assert.rejects(
      () => execFile('node', [binPath, '--config', missingCollectionPath, 'list'], {cwd}),
      /Unhandled route/,
    );

    const created = await execFile('node', [binPath, '--config', configPath, 'create', '--title', 'New', '--slug', 'new'], {cwd});
    assert.match(created.stdout, /New/);

    await assert.rejects(
      () => execFile('node', [binPath, '--config', configPath, 'create', '--slug', 'missing-title'], {cwd}),
      /Missing required field: title/,
    );

    const updated = await execFile('node', [binPath, '--config', configPath, 'update', '1', '--title', 'Updated'], {cwd});
    assert.match(updated.stdout, /Updated/);

    const published = await execFile('node', [binPath, '--config', configPath, 'publish', '1'], {cwd});
    assert.match(published.stdout, /published/);

    const unpublished = await execFile('node', [binPath, '--config', configPath, 'publish', '1', '--unpublish'], {cwd});
    assert.match(unpublished.stdout, /draft/);

    const deleted = await execFile('node', [binPath, '--config', configPath, 'delete', '1', '--yes'], {cwd});
    assert.match(deleted.stdout, /ok/);

    await assert.rejects(
      () => execFile('node', [binPath, '--config', configPath, 'update', 'missing', '--title', 'Nope'], {cwd}),
      /Not found/,
    );

    await assert.rejects(
      () => execFile('node', [binPath, '--config', configPath, 'delete', 'missing', '--yes'], {cwd}),
      /Not found/,
    );

    const badAuthPath = resolve(cwd, 'bad-auth.config.json');
    writeFileSync(
      badAuthPath,
      JSON.stringify({
        baseUrl: url,
        collection: 'posts',
        auth: {type: 'jwt', token: 'wrong'},
        fields: {
          id: 'id',
          title: 'headline',
          slug: 'urlSlug',
          status: '_status',
          excerpt: 'summary',
          content: 'body',
          updatedAt: 'updatedAt',
          publishedAt: 'publishedAt',
          author: 'author',
        },
      }),
      'utf8',
    );
    await assert.rejects(
      () => execFile('node', [binPath, '--config', badAuthPath, 'list'], {cwd}),
      /Unauthorized/,
    );
  } finally {
    server.close();
    rmSync(cwd, {recursive: true, force: true});
  }
});
