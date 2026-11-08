import { createHash } from 'node:crypto';

export const SESSION_TTL_MS = 60 * 60 * 1000;

export function createSession(userId, now = Date.now(), secret = 'dev-only-secret') {
  const token = createHash('sha256').update(`${userId}:${now}:${secret}`).digest('hex');
  return { userId, token, expiresAt: now + SESSION_TTL_MS };
}

export function isValid(session, now = Date.now()) {
  return Boolean(session?.token) && now < session.expiresAt;
}
