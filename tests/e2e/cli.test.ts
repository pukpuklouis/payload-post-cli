import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { execFile as execFileCb } from 'node:child_process';

const execFile = promisify(execFileCb);
const binPath = resolve(process.cwd(), 'bin/payload-post');

test('CLI help exits successfully', async () => {
  const { stdout, stderr } = await execFile('node', [binPath, '--help']);
  assert.match(stdout, /Usage: payload-post/);
  assert.equal(stderr, '');
});

test('config init scaffolds a config file', async () => {
  const cwd = mkdtempSync(resolve(tmpdir(), 'payload-post-cli-e2e-'));
  const { stdout } = await execFile('node', [binPath, 'config', 'init'], { cwd });
  assert.match(stdout, /Created .*payload-post\.config\.ts/);
  assert.match(readFileSync(resolve(cwd, 'payload-post.config.ts'), 'utf8'), /export default/);
});

test('commands fail clearly when config is missing', async () => {
  const cwd = mkdtempSync(resolve(tmpdir(), 'payload-post-cli-e2e-missing-'));
  await assert.rejects(
    () => execFile('node', [binPath, 'list'], { cwd }),
    /No payload-post config found/,
  );
});
