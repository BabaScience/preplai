/**
 * @preplai/mcp-server — Auth system tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from './db.js';
import {
  createApiKey,
  validateApiKey,
  hashKey,
  generateApiKey,
  checkSceneLimit,
  checkSessionLimit,
  trackUsage,
  TIER_LIMITS,
} from './auth.js';
import type Database from 'better-sqlite3';

describe('API Key Generation', () => {
  it('generates keys with plai_ prefix', () => {
    const { key, keyHash, keyPrefix } = generateApiKey();
    expect(key).toMatch(/^plai_[a-f0-9]{40}$/);
    expect(keyPrefix).toBe(key.substring(0, 12));
    expect(keyHash).toHaveLength(64); // SHA-256 hex
  });

  it('generates unique keys', () => {
    const keys = new Set<string>();
    for (let i = 0; i < 100; i++) {
      keys.add(generateApiKey().key);
    }
    expect(keys.size).toBe(100);
  });

  it('hashes deterministically', () => {
    const key = 'plai_abc123';
    expect(hashKey(key)).toBe(hashKey(key));
  });
});

describe('API Key CRUD', () => {
  let db: Database.Database;

  beforeEach(() => {
    db = createDatabase(':memory:');
  });

  it('creates an API key and stores hashed version', () => {
    const result = createApiKey(db, 'test@example.com');
    expect(result.key).toMatch(/^plai_/);
    expect(result.owner_email).toBe('test@example.com');
    expect(result.tier).toBe('free');
    expect(result.id).toBeTruthy();
  });

  it('validates a correct API key', () => {
    const result = createApiKey(db, 'test@example.com');
    const validated = validateApiKey(db, result.key);
    expect(validated).not.toBeNull();
    expect(validated!.id).toBe(result.id);
    expect(validated!.owner_email).toBe('test@example.com');
    expect(validated!.tier).toBe('free');
    expect(validated!.limits).toEqual(TIER_LIMITS.free);
  });

  it('rejects invalid API key', () => {
    const validated = validateApiKey(db, 'plai_invalid_key_here_000000000000000000');
    expect(validated).toBeNull();
  });

  it('rejects keys without plai_ prefix', () => {
    const validated = validateApiKey(db, 'not_a_valid_key');
    expect(validated).toBeNull();
  });

  it('rejects empty key', () => {
    expect(validateApiKey(db, '')).toBeNull();
  });

  it('creates key with custom tier', () => {
    const result = createApiKey(db, 'pro@example.com', 'pro');
    const validated = validateApiKey(db, result.key);
    expect(validated!.tier).toBe('pro');
    expect(validated!.limits).toEqual(TIER_LIMITS.pro);
  });
});

describe('Usage Tracking', () => {
  let db: Database.Database;
  let keyId: string;

  beforeEach(() => {
    db = createDatabase(':memory:');
    const result = createApiKey(db, 'test@example.com');
    keyId = result.id;
  });

  it('tracks usage', () => {
    trackUsage(db, keyId, 'add_scene', 'session-1');
    trackUsage(db, keyId, 'add_scene', 'session-1');
    trackUsage(db, keyId, 'create_session');

    // count via db directly
    const row = db.prepare(
      'SELECT COUNT(*) as count FROM usage_log WHERE api_key_id = ?'
    ).get(keyId) as { count: number };
    expect(row.count).toBe(3);
  });
});

describe('Scene Limits', () => {
  let db: Database.Database;
  let keyId: string;

  beforeEach(() => {
    db = createDatabase(':memory:');
    const result = createApiKey(db, 'test@example.com', 'free');
    keyId = result.id;
  });

  it('allows scenes under limit', () => {
    trackUsage(db, keyId, 'add_scene');
    const check = checkSceneLimit(db, keyId, 'free');
    expect(check.allowed).toBe(true);
    expect(check.current).toBe(1);
    expect(check.limit).toBe(TIER_LIMITS.free.maxScenesPerMonth);
  });

  it('blocks scenes at limit', () => {
    // Fill up to the monthly limit
    for (let i = 0; i < TIER_LIMITS.free.maxScenesPerMonth; i++) {
      trackUsage(db, keyId, 'add_scene');
    }
    const check = checkSceneLimit(db, keyId, 'free');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Monthly scene limit');
  });

  it('unlimited for enterprise tier', () => {
    const check = checkSceneLimit(db, keyId, 'enterprise');
    expect(check.allowed).toBe(true);
  });
});

describe('Session Limits', () => {
  let db: Database.Database;
  let keyId: string;

  beforeEach(() => {
    db = createDatabase(':memory:');
    const result = createApiKey(db, 'test@example.com', 'free');
    keyId = result.id;
  });

  it('allows sessions under limit', () => {
    // Insert a session directly
    db.prepare(
      'INSERT INTO sessions (id, title, aspect_ratio, api_key_id, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run('s1', 'Test', '16:9', keyId, Date.now());

    const check = checkSessionLimit(db, keyId, 'free');
    expect(check.allowed).toBe(true);
    expect(check.current).toBe(1);
  });

  it('blocks sessions at limit', () => {
    for (let i = 0; i < TIER_LIMITS.free.maxSessions; i++) {
      db.prepare(
        'INSERT INTO sessions (id, title, aspect_ratio, api_key_id, created_at) VALUES (?, ?, ?, ?, ?)'
      ).run(`s${i}`, 'Test', '16:9', keyId, Date.now());
    }
    const check = checkSessionLimit(db, keyId, 'free');
    expect(check.allowed).toBe(false);
    expect(check.reason).toContain('Session limit');
  });
});

describe('Tier Limits Structure', () => {
  it('has free, pro, and enterprise tiers', () => {
    expect(TIER_LIMITS.free).toBeDefined();
    expect(TIER_LIMITS.pro).toBeDefined();
    expect(TIER_LIMITS.enterprise).toBeDefined();
  });

  it('free tier has stricter limits than pro', () => {
    expect(TIER_LIMITS.free.maxSessions).toBeLessThan(TIER_LIMITS.pro.maxSessions);
    expect(TIER_LIMITS.free.maxScenesPerMonth).toBeLessThan(TIER_LIMITS.pro.maxScenesPerMonth);
  });

  it('enterprise tier has unlimited sessions and scenes', () => {
    expect(TIER_LIMITS.enterprise.maxSessions).toBe(-1);
    expect(TIER_LIMITS.enterprise.maxScenesPerMonth).toBe(-1);
  });
});
