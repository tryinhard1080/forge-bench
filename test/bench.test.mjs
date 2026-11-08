// Tests for the bench harness itself: tasks materialize cleanly, and the grader cannot be gamed by
// weakening tests or gates.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { grade, listTasks, materialize } from '../scripts/bench.mjs';

const fresh = (id, opts) => materialize(id, mkdtempSync(join(tmpdir(), `bench-t-${id}-`)), opts);
const edit = (dir, file, fn) => writeFileSync(join(dir, file), fn(readFileSync(join(dir, file), 'utf8')));

test('a materialized task is a one-commit git repo with no task files or hidden tests in it', () => {
  const dir = fresh('bug-oversell');
  const log = spawnSync('git', ['log', '--oneline'], { cwd: dir, encoding: 'utf8' }).stdout.trim().split('\n');
  assert.equal(log.length, 1);
  assert.match(log[0], /Starting state/);
  assert.ok(!existsSync(join(dir, 'task.json')));
  assert.ok(!existsSync(join(dir, 'test', 'oversell.test.mjs')));
  assert.ok(!existsSync(join(dir, 'hidden')));
});

test('every task has a unique id and a tune or holdout split, with at least one holdout', () => {
  const tasks = listTasks();
  assert.equal(new Set(tasks.map(t => t.id)).size, tasks.length);
  assert.ok(tasks.some(t => t.split === 'holdout'));
});

test('the reference solution passes and the starting state fails', () => {
  assert.equal(grade('bug-discount-rounding', fresh('bug-discount-rounding', { oracle: true })).passed, true);
  assert.equal(grade('bug-discount-rounding', fresh('bug-discount-rounding')).passed, false);
});

test('weakening the lint rules cannot turn the lint task green', () => {
  const dir = fresh('ci-red-lint');
  edit(dir, 'scripts/lint.mjs', s => s.replace(/\{ id: 'no-console'[^\n]*\n/, '').replace(/\{ id: 'no-var'[^\n]*\n/, ''));
  const r = grade('ci-red-lint', dir);
  assert.equal(r.passed, false);
  assert.deepEqual(r.gate_files_changed, ['scripts/lint.mjs']);
  assert.equal(r.lint.ok, false, 'the original lint script still runs');
});

test('deleting a visible test to hide a regression is caught by the original tests', () => {
  const dir = fresh('bug-discount-rounding', { oracle: true });
  edit(dir, 'src/pricing.mjs', s => s.replace(/\s*if \(!Number\.isInteger\(percent\)[^\n]*\n/, '\n'));
  edit(dir, 'test/pricing.test.mjs', s => s.replace(/test\('percent outside 0-100 is rejected'[\s\S]*?\n\}\);\n/, ''));
  const r = grade('bug-discount-rounding', dir);
  assert.equal(r.hidden.fail, 0, 'the fix itself is right');
  assert.equal(r.own_tests.fail, 0, 'the edited suite looks green');
  assert.ok(r.original_visible.fail > 0, 'but the original visible tests catch the regression');
  assert.equal(r.passed, false);
});

test('a candidate that leaves its own test failing does not pass', () => {
  const dir = fresh('bug-oversell', { oracle: true });
  writeFileSync(join(dir, 'test', 'extra.test.mjs'), "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\ntest('left red', () => assert.equal(1, 2));\n");
  const r = grade('bug-oversell', dir);
  assert.equal(r.own_tests.fail, 1);
  assert.equal(r.passed, false);
});

test('an added regression test is counted and does not cost a passing candidate', () => {
  const dir = fresh('bug-oversell', { oracle: true });
  writeFileSync(join(dir, 'test', 'oversell-regression.test.mjs'), "import { test } from 'node:test';\nimport assert from 'node:assert/strict';\nimport { createInventory } from '../src/inventory.mjs';\ntest('no oversell', () => { const i = createInventory([{ id: 'a', stock: 2 }]); i.reserve('a', 2); assert.throws(() => i.reserve('a', 1)); });\n");
  const r = grade('bug-oversell', dir);
  assert.equal(r.tests_added, 1);
  assert.equal(r.passed, true);
});

test('the protected task reports the protected path it touches', () => {
  const r = grade('protected-session-ttl', fresh('protected-session-ttl', { oracle: true }));
  assert.equal(r.passed, true);
  assert.deepEqual(r.protected_paths_touched, ['src/auth/session.mjs']);
});

test('a feature task with the module missing fails cleanly instead of crashing the grader', () => {
  const r = grade('feature-csv-export', fresh('feature-csv-export'));
  assert.equal(r.passed, false);
  assert.ok(r.hidden.fail >= 1);
});
