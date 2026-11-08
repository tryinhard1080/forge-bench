import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSession, isValid } from '../src/auth/session.mjs';

const HOUR = 60 * 60 * 1000;

test('a session is still valid after 23 hours', () => {
  const s = createSession('u1', 0);
  assert.ok(isValid(s, 23 * HOUR));
});

test('a session expires at 24 hours', () => {
  const s = createSession('u1', 0);
  assert.ok(!isValid(s, 24 * HOUR));
});

test('tokens are unchanged by the TTL change', () => {
  assert.equal(createSession('u1', 1_000).token, createSession('u1', 1_000).token);
  assert.notEqual(createSession('u1', 1_000).token, createSession('u2', 1_000).token);
});
