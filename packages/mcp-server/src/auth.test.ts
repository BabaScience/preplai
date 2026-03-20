/**
 * @preplai/mcp-server — Auth system tests
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb, closeDb } from '@preplai/db';
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

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  await connectDb();
}, 30000);

afterAll(async () => {
  await closeDb();
  if (mongod) await mongod.stop();
});

describe('API Key Generation', () => {
  it('generates keys with plai_ prefix', () => {
    const { key, keyHash, keyPrefix } = generateApiKey();
    expect(key).toMatch(/^plai_[a-f0-9]{40}$/);
    expect(keyPrefix).toBe(key.substring(0, 12));
    expect(keyHash).toHaveLength(64);
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
  it('creates an API key and stores hashed version', async () => {
    const result = await createApiKey('test@example.com');
    expect(result.key).toMatch(/^plai_/);
    expect(result.owner_email).toBe('test@example.com');
    expect(result.tier).toBe('free');
    expect(result.id).toBeTruthy();
  });

  it('validates a correct API key', async () => {
    const result = await createApiKey('test@example.com');
    const validated = await validateApiKey(result.key);
    expect(validated).not.toBeNull();
    expect(validated!.id).toBe(result.id);
    expect(validated!.owner_email).toBe('test@example.com');
    expect(validated!.tier).toBe('free');
    expect(validated!.limits).toEqual(TIER_LIMITS.free);
  });

  it('rejects invalid API key', async () => {
    const validated = await validateApiKey('plai_invalid_key_here_000000000000000000');
    expect(validated).toBeNull();
  });

  it('rejects keys without plai_ prefix', async () => {
    const validated = await validateApiKey('not_a_valid_key');
    expect(validated).toBeNull();
  });

  it('rejects empty key', async () => {
    expect(await validateApiKey('')).toBeNull();
  });

  it('creates key with custom tier', async () => {
    const result = await createApiKey('pro@example.com', 'pro');
    const validated = await validateApiKey(result.key);
    expect(validated!.tier).toBe('pro');
    expect(validated!.limits).toEqual(TIER_LIMITS.pro);
  });
});

describe('Usage Tracking', () => {
  let keyId: string;

  beforeEach(async () => {
    const result = await createApiKey('test@example.com');
    keyId = result.id;
  });

  it('tracks usage', async () => {
    await trackUsage(keyId, 'add_scene', 'session-1');
    await trackUsage(keyId, 'add_scene', 'session-1');
    await trackUsage(keyId, 'create_session');

    // Free tier has unlimited scenes (maxScenesPerMonth = -1), so checkSceneLimit returns allowed without current
    const limit = await checkSceneLimit(keyId, 'free');
    expect(limit.allowed).toBe(true);
  });
});
