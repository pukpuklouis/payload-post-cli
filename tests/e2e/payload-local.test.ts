import test from 'node:test';
import assert from 'node:assert/strict';
import { promisify } from 'node:util';
import { execFile as execFileCb } from 'node:child_process';
import { resolve } from 'node:path';

const execFile = promisify(execFileCb);
const script = resolve(process.cwd(), 'tests/e2e/payload-local.run.ts');

test('local Payload instance supports posts collection CRUD', async () => {
  const {stdout, stderr} = await execFile('node', ['--import', 'tsx', script], {
    env: {
      ...process.env,
      NODE_ENV: 'test',
    },
  });

  assert.match(stdout, /local server ok/);
  assert.equal(stderr, '');
});
