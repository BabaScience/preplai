/**
 * @preplai/mcp-server — Session utilities
 */
import type { SessionStore } from './session-store.js';

/** Verify the API key owns the session. Returns { ok, notFound } for route/tool handlers. */
export function verifySessionOwnership(
  store: SessionStore,
  sessionId: string,
  apiKeyId: string,
): { ok: boolean; notFound?: boolean } {
  const session = store.getSession(sessionId);
  if (!session) return { ok: false, notFound: true };
  if (session.api_key_id !== apiKeyId) return { ok: false };
  return { ok: true };
}
