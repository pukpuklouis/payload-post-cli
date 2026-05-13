import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { execFile as execFileCb } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const execFile = promisify(execFileCb);
const binPath = resolve(process.cwd(), 'bin/payload-post');

function jsonResponse(body: unknown, status = 200): ResponseInit & { body: string } {
  return {
    status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

async function main(): Promise<void> {
  const state = {
    token: 'local-token',
    post: {
      id: '1',
      headline: 'Hello Payload',
      urlSlug: 'hello-payload',
      _status: 'draft',
      updatedAt: '2026-05-12T00:00:00.000Z',
    },
  };

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const auth = req.headers.authorization ?? '';

    const send = ({status, headers, body}: ResponseInit & { body: string }) => {
      res.writeHead(status ?? 200, headers ?? {});
      res.end(body);
    };

    if (req.method === 'POST' && url.pathname === '/api/users/login') {
      let body = '';
      for await (const chunk of req) body += String(chunk);
      const parsed = JSON.parse(body || '{}') as { email?: string; username?: string; password?: string };
      assert.equal(parsed.username, 'writer');
      assert.equal(parsed.password, 'secret');
      send(jsonResponse({ token: state.token }));
      return;
    }

    if (auth !== `JWT ${state.token}`) {
      send(jsonResponse({ message: 'Unauthorized' }, 401));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/posts') {
      send(jsonResponse({ docs: [state.post], totalDocs: 1, page: 1, limit: 10 }));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/posts') {
      let body = '';
      for await (const chunk of req) body += String(chunk);
      const parsed = JSON.parse(body || '{}') as Record<string, unknown>;
      state.post = {
        ...state.post,
        headline: String(parsed.headline ?? state.post.headline),
        urlSlug: String(parsed.urlSlug ?? state.post.urlSlug),
        _status: String(parsed._status ?? 'draft'),
      };
      send(jsonResponse(state.post, 201));
      return;
    }

    if (req.method === 'PATCH' && url.pathname === '/api/posts/1') {
      let body = '';
      for await (const chunk of req) body += String(chunk);
      const parsed = JSON.parse(body || '{}') as Record<string, unknown>;
      state.post = {
        ...state.post,
        ...parsed,
      };
      send(jsonResponse(state.post));
      return;
    }

    if (req.method === 'DELETE' && url.pathname === '/api/posts/1') {
      state.post = { ...state.post, _status: 'draft' };
      send(jsonResponse({ ok: true }));
      return;
    }

    send(jsonResponse({ message: 'Unhandled route' }, 404));
  });

  await new Promise<void>((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No server address');

  const cwd = mkdtempSync(resolve(tmpdir(), 'payload-post-local-'));
  const configPath = resolve(cwd, 'payload-post.config.json');
  writeFileSync(
    configPath,
    JSON.stringify({
      baseUrl: `http://127.0.0.1:${address.port}`,
      collection: 'posts',
      auth: { type: 'login', collection: 'users', username: 'writer', password: 'secret' },
      fields: {
        id: 'id',
        title: 'headline',
        slug: 'urlSlug',
        status: '_status',
        excerpt: 'excerpt',
        content: 'content',
        updatedAt: 'updatedAt',
        publishedAt: 'publishedAt',
        author: 'author',
      },
    }),
    'utf8',
  );

  try {
    const list = await execFile('node', [binPath, '--config', configPath, '--json', 'list'], { cwd });
    const parsed = JSON.parse(list.stdout) as { docs?: Array<{ title?: string }> };
    assert.equal(parsed.docs?.[0]?.title, 'Hello Payload');

    const created = await execFile('node', [binPath, '--config', configPath, 'create', '--title', 'New', '--slug', 'new'], { cwd });
    assert.match(created.stdout, /New/);

    const updated = await execFile('node', [binPath, '--config', configPath, 'update', '1', '--title', 'Updated'], { cwd });
    assert.match(updated.stdout, /Updated/);

    const published = await execFile('node', [binPath, '--config', configPath, 'publish', '1'], { cwd });
    assert.match(published.stdout, /published/);

    const deleted = await execFile('node', [binPath, '--config', configPath, 'delete', '1', '--yes'], { cwd });
    assert.match(deleted.stdout, /ok/);

    console.log('local server ok');
  } finally {
    server.close();
    rmSync(cwd, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
