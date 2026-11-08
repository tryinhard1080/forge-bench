import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const PRISTINE_LINT_SHA256 = '3ebf94c6b8b474b8379697880bce0acb961c3ec1460219fa4d55a380714980ff';

test('lint passes', () => {
  const r = spawnSync(process.execPath, ['scripts/lint.mjs'], { cwd: root, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

test('the lint rules were not weakened', () => {
  const text = readFileSync(new URL('../scripts/lint.mjs', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.equal(createHash('sha256').update(text).digest('hex'), PRISTINE_LINT_SHA256);
});

test('the CI workflow still runs lint', () => {
  const ci = readFileSync(new URL('../.github/workflows/ci.yml', import.meta.url), 'utf8');
  assert.match(ci, /run: npm run lint/);
});
