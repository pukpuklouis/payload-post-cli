import test from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile as execFileCb } from 'node:child_process';
import { resolve } from 'node:path';

const execFile = promisify(execFileCb);
const binPath = resolve(process.cwd(), 'bin/payload-post');

test('tui once renders 3 panes and shortcut hints', async () => {
  const {stdout} = await execFile('node', [binPath, 'tui', '--once']);
  assert.match(stdout, /Filters/);
  assert.match(stdout, /Posts/);
  assert.match(stdout, /Details/);
  assert.match(stdout, /j\/k navigate/);
});

