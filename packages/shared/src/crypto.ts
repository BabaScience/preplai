/**
 * @preplai/shared — Cryptographic Utilities
 *
 * API key generation and hashing. Single source of truth for key format.
 * Used by both the API (apps/api) and MCP server (packages/mcp-server).
 */
import { createHash, randomBytes } from 'node:crypto';

/** Prefix for all Preplai API keys */
export const KEY_PREFIX = 'plai_' as const;

/** Hash a raw API key using SHA-256. */
export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/** Generate a new API key with its hash and display prefix. */
export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const rawBytes = randomBytes(20);
  const key = KEY_PREFIX + rawBytes.toString('hex');
  const keyHash = hashKey(key);
  const keyPrefix = key.substring(0, 12);
  return { key, keyHash, keyPrefix };
}

/** Hash a secret string using SHA-256 (for OAuth client secrets, etc.). */
export function hashSecret(secret: string): string {
  return createHash('sha256').update(secret).digest('hex');
}
