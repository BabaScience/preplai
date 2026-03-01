/**
 * @preplai/mcp-server — Session Store Tests
 *
 * Tests for the in-memory session store with MongoDB backing.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb, closeDb } from '@preplai/db';
import { SessionStore } from './session-store.js';

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

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
  });

  describe('create + get', () => {
    it('createSession returns session with generated UUID', async () => {
      const session = await store.createSession('Test Title', '16:9');
      expect(session.id).toMatch(/^[0-9a-f]{8}-/);
      expect(session.title).toBe('Test Title');
      expect(session.aspect_ratio).toBe('16:9');
      expect(session.script).toBeNull();
      expect(session.created_at).toBeGreaterThan(0);
    });

    it('getSession retrieves created session', async () => {
      const created = await store.createSession('Retrieve Test', '16:9');
      const found = store.getSession(created.id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe('Retrieve Test');
    });

    it('getSession returns null for unknown ID', () => {
      expect(store.getSession('nonexistent-id')).toBeNull();
    });

    it('defaults aspect_ratio to 16:9', async () => {
      const session = await store.createSession('Default AR');
      expect(session.aspect_ratio).toBe('16:9');
    });
  });

  describe('setScript', () => {
    it('stores visual script in memory and DB', async () => {
      const session = await store.createSession('Script Test', '16:9');
      const script = {
        sceneId: session.id,
        totalDuration: 4000,
        frames: [{ id: 'f1', startTime: 0, endTime: 4000, entities: [], narrationSegment: '', description: '' }],
      };
      await store.setScript(session.id, script);

      const found = store.getSession(session.id);
      expect(found!.script).toEqual(script);
    });

    it('replaces existing script', async () => {
      const session = await store.createSession('Replace Test', '16:9');
      const script1 = { sceneId: session.id, totalDuration: 1000, frames: [{ id: 'f1', startTime: 0, endTime: 1000, entities: [], narrationSegment: '', description: '' }] };
      const script2 = { sceneId: session.id, totalDuration: 2000, frames: [{ id: 'f1', startTime: 0, endTime: 1000, entities: [], narrationSegment: '', description: '' }, { id: 'f2', startTime: 1000, endTime: 2000, entities: [], narrationSegment: '', description: '' }] };

      await store.setScript(session.id, script1);
      await store.setScript(session.id, script2);

      expect(store.getSession(session.id)!.script!.frames).toHaveLength(2);
    });

    it('throws for unknown session ID', async () => {
      await expect(store.setScript('bad-id', {} as any)).rejects.toThrow();
    });
  });

  describe('addNarration', () => {
    it('stores narration and returns narration ID', async () => {
      const session = await store.createSession('Narr Test', '16:9');
      const result = await store.addNarration(session.id, 'Hello world', 0);
      expect(result.narration_id).toMatch(/^[0-9a-f]{8}-/);
      expect(result.text_length).toBe(11);
    });

    it('throws for unknown session ID', async () => {
      await expect(store.addNarration('bad-id', 'text', 0)).rejects.toThrow();
    });
  });

  describe('loadFromDb', () => {
    it('restores sessions from MongoDB into memory', async () => {
      const store1 = new SessionStore();
      const s = await store1.createSession('Persistent', '4:3');
      const script = { sceneId: s.id, totalDuration: 1000, frames: [{ id: 'f1', startTime: 0, endTime: 1000, entities: [], narrationSegment: '', description: '' }] };
      await store1.setScript(s.id, script);

      const store2 = new SessionStore();
      await store2.loadFromDb();

      const restored = store2.getSession(s.id);
      expect(restored).not.toBeNull();
      expect(restored!.title).toBe('Persistent');
      expect(restored!.aspect_ratio).toBe('4:3');
      expect(restored!.script).toEqual(script);
    });
  });

  describe('listSessionsByKey', () => {
    it('returns only sessions for given api key', async () => {
      await store.createSession('A', '16:9', 'key-1');
      await store.createSession('B', '16:9', 'key-2');
      await store.createSession('C', '16:9', 'key-1');

      const list = store.listSessionsByKey('key-1');
      expect(list).toHaveLength(2);
      expect(list.map((s) => s.title).sort()).toEqual(['A', 'C']);
    });
  });
});
