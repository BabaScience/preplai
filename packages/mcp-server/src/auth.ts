/**
 * @preplai/mcp-server — Authentication & Authorization
 *
 * API key generation, validation, and Fastify middleware.
 * Keys are hashed with SHA-256 before storage — only the hash is persisted.
 */
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  insertApiKey,
  getApiKeyByHash,
  updateApiKeyLastUsed,
  countUsageByKeyAndAction,
  insertUsageLog,
  type ApiKeyRow,
} from './db.js';

// ── Tier limits ──────────────────────────────────────────────────────

export interface TierLimits {
  maxSessions: number;
  maxScenesPerMonth: number;
  maxScenesPerSession: number;
  sessionExpiryDays: number;
}

export const TIER_LIMITS: Record<string, TierLimits> = {
  free: {
    maxSessions: 5,
    maxScenesPerMonth: 50,
    maxScenesPerSession: 10,
    sessionExpiryDays: 7,
  },
  pro: {
    maxSessions: 100,
    maxScenesPerMonth: 2000,
    maxScenesPerSession: 100,
    sessionExpiryDays: 90,
  },
  enterprise: {
    maxSessions: -1, // unlimited
    maxScenesPerMonth: -1,
    maxScenesPerSession: -1,
    sessionExpiryDays: 365,
  },
};

// ── Key format ───────────────────────────────────────────────────────
// Keys look like: plai_a1b2c3d4e5f6...  (plai_ prefix + 40 hex chars)

const KEY_PREFIX = 'plai_';

export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const rawBytes = randomBytes(20); // 40 hex chars
  const key = KEY_PREFIX + rawBytes.toString('hex');
  const keyHash = hashKey(key);
  const keyPrefix = key.substring(0, 12); // "plai_a1b2c3d" — enough to identify

  return { key, keyHash, keyPrefix };
}

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// ── API key creation ─────────────────────────────────────────────────

export interface CreateKeyResult {
  id: string;
  key: string;          // plaintext — only returned at creation time
  key_prefix: string;
  owner_email: string;
  tier: string;
  created_at: number;
}

export function createApiKey(
  db: Database.Database,
  ownerEmail: string,
  tier = 'free',
): CreateKeyResult {
  const { key, keyHash, keyPrefix } = generateApiKey();
  const id = randomUUID();
  const now = Date.now();

  insertApiKey(db, {
    id,
    key_hash: keyHash,
    key_prefix: keyPrefix,
    owner_email: ownerEmail,
    tier,
    created_at: now,
    last_used_at: null,
    revoked: 0,
  });

  return { id, key, key_prefix: keyPrefix, owner_email: ownerEmail, tier, created_at: now };
}

// ── API key validation ───────────────────────────────────────────────

export interface ValidatedKey {
  id: string;
  owner_email: string;
  tier: string;
  limits: TierLimits;
}

export function validateApiKey(db: Database.Database, key: string): ValidatedKey | null {
  if (!key || !key.startsWith(KEY_PREFIX)) return null;

  const keyHash = hashKey(key);
  const row = getApiKeyByHash(db, keyHash);
  if (!row) return null;

  // Update last_used_at
  updateApiKeyLastUsed(db, row.id);

  const limits = TIER_LIMITS[row.tier] || TIER_LIMITS.free;

  return {
    id: row.id,
    owner_email: row.owner_email,
    tier: row.tier,
    limits,
  };
}

// ── Usage tracking ───────────────────────────────────────────────────

export function trackUsage(
  db: Database.Database,
  apiKeyId: string,
  action: string,
  sessionId?: string,
): void {
  insertUsageLog(db, {
    id: randomUUID(),
    api_key_id: apiKeyId,
    action,
    session_id: sessionId ?? null,
    created_at: Date.now(),
  });
}

// ── Limit checking ───────────────────────────────────────────────────

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}

export function checkSceneLimit(
  db: Database.Database,
  apiKeyId: string,
  tier: string,
): LimitCheckResult {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  // Unlimited
  if (limits.maxScenesPerMonth === -1) return { allowed: true };

  // Count scenes added this month (since start of current month)
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const used = countUsageByKeyAndAction(db, apiKeyId, 'add_scene', monthStart);

  if (used >= limits.maxScenesPerMonth) {
    return {
      allowed: false,
      reason: `Monthly scene limit reached (${used}/${limits.maxScenesPerMonth}). Upgrade to Pro for more.`,
      current: used,
      limit: limits.maxScenesPerMonth,
    };
  }

  return { allowed: true, current: used, limit: limits.maxScenesPerMonth };
}

export function checkSessionLimit(
  db: Database.Database,
  apiKeyId: string,
  tier: string,
): LimitCheckResult {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

  // Unlimited
  if (limits.maxSessions === -1) return { allowed: true };

  // Count total active sessions for this key
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM sessions WHERE api_key_id = ?'
  ).get(apiKeyId) as { count: number };

  if (row.count >= limits.maxSessions) {
    return {
      allowed: false,
      reason: `Session limit reached (${row.count}/${limits.maxSessions}). Delete old sessions or upgrade to Pro.`,
      current: row.count,
      limit: limits.maxSessions,
    };
  }

  return { allowed: true, current: row.count, limit: limits.maxSessions };
}

// ── Error response for auth failures ─────────────────────────────────

export function authError(code: string, message: string): {
  statusCode: number;
  body: { success: false; error: { code: string; message: string; suggestion: string } };
} {
  return {
    statusCode: code === 'RATE_LIMIT_EXCEEDED' ? 429 : 401,
    body: {
      success: false,
      error: {
        code,
        message,
        suggestion: code === 'MISSING_API_KEY'
          ? 'Include your API key in the X-Preplai-API-Key header. Get one at https://preplai.com.'
          : code === 'INVALID_API_KEY'
          ? 'Check that your API key is correct and has not been revoked.'
          : code === 'RATE_LIMIT_EXCEEDED'
          ? 'You have reached your plan limit. Upgrade at https://preplai.com/pricing.'
          : 'Contact support at support@preplai.com.',
      },
    },
  };
}
