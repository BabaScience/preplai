/**
 * @preplai/mcp-server — Authentication & Authorization
 *
 * API key validation against shared api_keys collection.
 * Keys are hashed with SHA-256 — only the hash is stored.
 */
import { randomUUID, createHash, randomBytes } from 'node:crypto';
import { ApiKey, McpUsageLog, Session, UsageLog, User } from '@preplai/db';
import { TIER_LIMITS as SHARED_TIER_LIMITS } from '@preplai/shared';

// ── Tier limits ──────────────────────────────────────────────────────

export interface TierLimits {
  maxSessions: number;
  maxScenesPerMonth: number;
  maxScenesPerSession: number;
  sessionExpiryDays: number;
}

export const TIER_LIMITS: Record<string, TierLimits> = SHARED_TIER_LIMITS as Record<string, TierLimits>;

// ── Key format ───────────────────────────────────────────────────────
const KEY_PREFIX = 'plai_';

export function generateApiKey(): { key: string; keyHash: string; keyPrefix: string } {
  const rawBytes = randomBytes(20);
  const key = KEY_PREFIX + rawBytes.toString('hex');
  const keyHash = hashKey(key);
  const keyPrefix = key.substring(0, 12);
  return { key, keyHash, keyPrefix };
}

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// ── API key creation (quick start — writes to shared collection) ────────

export interface CreateKeyResult {
  id: string;
  key: string;
  key_prefix: string;
  owner_email: string;
  tier: string;
  created_at: number;
}

export async function createApiKey(
  ownerEmail: string,
  tier = 'free',
): Promise<CreateKeyResult> {
  const { key, keyHash, keyPrefix } = generateApiKey();
  const now = Date.now();

  const doc = await ApiKey.create({
    userId: null,
    name: 'Quick Start',
    keyHash,
    keyPrefix,
    ownerEmail,
    tier: tier === 'pro' || tier === 'enterprise' ? tier : 'free',
  });

  return {
    id: doc._id.toString(),
    key,
    key_prefix: keyPrefix,
    owner_email: ownerEmail,
    tier: doc.tier,
    created_at: now,
  };
}

// ── API key validation ───────────────────────────────────────────────

export interface ValidatedKey {
  id: string;
  owner_email: string;
  tier: string;
  limits: TierLimits;
}

export async function validateApiKey(key: string): Promise<ValidatedKey | null> {
  if (!key || !key.startsWith(KEY_PREFIX)) return null;

  const keyHash = hashKey(key);
  const doc = await ApiKey.findOne({ keyHash, revoked: false });
  if (!doc) return null;

  doc.lastUsedAt = new Date();
  await doc.save();

  const limits = TIER_LIMITS[doc.tier] || TIER_LIMITS.free;

  return {
    id: doc._id.toString(),
    owner_email: doc.ownerEmail,
    tier: doc.tier,
    limits,
  };
}

/** Get or create an API key for an OAuth user (by userId). */
export async function getOrCreateApiKeyForUser(userId: string): Promise<ValidatedKey | null> {
  let apiKey = await ApiKey.findOne({ userId, revoked: false }).sort({ lastUsedAt: -1 });
  if (apiKey) {
    apiKey.lastUsedAt = new Date();
    await apiKey.save();
    const limits = TIER_LIMITS[apiKey.tier] || TIER_LIMITS.free;
    return {
      id: apiKey._id.toString(),
      owner_email: apiKey.ownerEmail,
      tier: apiKey.tier,
      limits,
    };
  }
  const user = (await User.findById(userId).select('email').lean()) as { email?: string } | null;
  if (!user?.email) return null;
  const { keyHash, keyPrefix } = generateApiKey(); // key discarded for OAuth-internal use
  const doc = await ApiKey.create({
    userId,
    name: 'OAuth',
    keyHash,
    keyPrefix,
    ownerEmail: user.email,
    tier: 'free',
  });
  const limits = TIER_LIMITS[doc.tier] || TIER_LIMITS.free;
  return {
    id: doc._id.toString(),
    owner_email: doc.ownerEmail,
    tier: doc.tier,
    limits,
  };
}

// ── User player preferences (theme + palette) ──────────────────────────

export interface UserPlayerPrefs {
  theme: 'cinema' | 'light';
  palette: string;
}

/** Get user's saved player theme and palette from API key. Returns defaults if key has no userId. */
export async function getUserPlayerPrefs(apiKeyId: string | undefined): Promise<UserPlayerPrefs> {
  const defaults = { theme: 'light' as const, palette: 'default' };

  if (!apiKeyId) {
    logPlayerPrefs('debug', { reason: 'no_api_key_id', prefs: defaults }, 'Using defaults: no API key');
    return defaults;
  }

  const key = await ApiKey.findById(apiKeyId).select('userId').lean() as { userId?: unknown } | null;
  const userId = key?.userId;
  if (!userId) {
    logPlayerPrefs('debug', { apiKeyIdPrefix: apiKeyId.slice(0, 8), reason: 'key_has_no_user_id', prefs: defaults }, 'Using defaults: API key not linked to user');
    return defaults;
  }

  const user = await User.findById(userId).select('playerTheme playerPalette').lean() as {
    playerTheme?: string;
    playerPalette?: string;
  } | null;
  if (!user) {
    logPlayerPrefs('debug', { userId: String(userId), reason: 'user_not_found', prefs: defaults }, 'Using defaults: user not found');
    return defaults;
  }

  const validThemes = ['cinema', 'light'];
  const validPalettes = ['default', 'ocean', 'sunset', 'forest', 'mono'];
  const prefs: UserPlayerPrefs = {
    theme: validThemes.includes(user.playerTheme ?? '') ? (user.playerTheme as 'cinema' | 'light') : 'light',
    palette: validPalettes.includes(user.playerPalette ?? '') ? (user.playerPalette as string) : 'default',
  };
  logPlayerPrefs('debug', { userId: String(userId), reason: 'from_dashboard', prefs }, 'Player prefs from dashboard');
  return prefs;
}

function logPlayerPrefs(level: string, obj: object, msg: string): void {
  if (process.env.NODE_ENV === 'production') return;
  const line = JSON.stringify({ level, msg, ...obj, time: Date.now() });
  process.stderr.write(line + '\n');
}

/** Build URL query string for player (style + palette). Always include both for explicit application. */
export function buildPlayerUrlSuffix(theme: string, palette: string): string {
  const params = new URLSearchParams();
  params.set('style', theme);
  params.set('palette', palette);
  return `?${params.toString()}`;
}

// ── Usage tracking ───────────────────────────────────────────────────

export async function trackUsage(
  apiKeyId: string,
  action: string,
  sessionId?: string,
): Promise<void> {
  await McpUsageLog.create({
    id: randomUUID(),
    apiKeyId,
    action,
    sessionId: sessionId ?? null,
    createdAt: Date.now(),
  });

  // Also write to UsageLog for dashboard when key has userId (dashboard-created keys)
  const key = await ApiKey.findById(apiKeyId).select('userId').lean() as { userId?: unknown } | null;
  if (key?.userId) {
    await UsageLog.create({
      userId: key.userId,
      apiKeyId,
      endpoint: action,
      tokensUsed: 0,
    });
  }
}

// ── Limit checking ───────────────────────────────────────────────────

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  current?: number;
  limit?: number;
}

export async function checkSceneLimit(
  apiKeyId: string,
  tier: string,
): Promise<LimitCheckResult> {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  if (limits.maxScenesPerMonth === -1) return { allowed: true };

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const used = await McpUsageLog.countDocuments({
    apiKeyId,
    action: 'add_scene',
    createdAt: { $gte: monthStart },
  });

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

export async function checkSessionLimit(
  apiKeyId: string,
  tier: string,
): Promise<LimitCheckResult> {
  const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;
  if (limits.maxSessions === -1) return { allowed: true };

  const count = await Session.countDocuments({ apiKeyId });

  if (count >= limits.maxSessions) {
    return {
      allowed: false,
      reason: `Session limit reached (${count}/${limits.maxSessions}). Delete old sessions or upgrade to Pro.`,
      current: count,
      limit: limits.maxSessions,
    };
  }
  return { allowed: true, current: count, limit: limits.maxSessions };
}

// ── Error response ──────────────────────────────────────────────────

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
          ? 'Web clients: use OAuth. Desktop clients: create an access token at https://preplai.com/dashboard/keys and use Authorization: Bearer <token>.'
          : code === 'INVALID_API_KEY'
          ? 'Check that your access token is correct and has not been revoked.'
          : code === 'RATE_LIMIT_EXCEEDED'
          ? 'You have reached your plan limit. Upgrade at https://preplai.com/pricing.'
          : 'Contact support at support@preplai.com.',
      },
    },
  };
}
