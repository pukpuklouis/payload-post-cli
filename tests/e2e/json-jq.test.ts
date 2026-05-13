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

function shellQuote(value: string): string {
  return "'" + value.replace(/'/g, "'\\''") + "'";
}

test('json output can be piped to jq and validated', async () => {
  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const auth = req.headers.authorization ?? '';
    if (auth !== 'JWT token') {
      res.writeHead(401, {'content-type': 'application/json'});
      res.end(JSON.stringify({message: 'Unauthorized'}));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/posts') {
      res.writeHead(200, {'content-type': 'application/json'});
      res.end(JSON.stringify({docs: [{title: 'Hello'}], totalDocs: 1, page: 1, limit: 10}));
      return;
    }

    res.writeHead(404, {'content-type': 'application/json'});
    res.end(JSON.stringify({message: 'Unhandled route'}));
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No server address');

  const cwd = mkdtempSync(resolve(tmpdir(), 'payload-post-json-jq-'));
  const configPath = resolve(cwd, 'config.json');
  writeFileSync(
    configPath,
    JSON.stringify({
      baseUrl: `http://127.0.0.1:${address.port}`,
      collection: 'posts',
      auth: {type: 'jwt', token: 'token'},
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
    }),
    'utf8',
  );

  try {
    const command = `node ${shellQuote(binPath)} --config ${shellQuote(configPath)} --json list | jq -e '.docs | length == 1 and .[0].title == "Hello"'`;
    const result = await execFile('sh', ['-lc', command], {cwd});
    assert.match(result.stdout, /true/);
  } finally {
    server.close();
    rmSync(cwd, {recursive: true, force: true});
  }
});
