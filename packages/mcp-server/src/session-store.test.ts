/**
 * @pre/mcp-server — Session Store Tests (TDD)
 *
 * Tests for the in-memory session store with SQLite backing.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createDatabase } from './db.js';
import { SessionStore } from './session-store.js';

describe('SessionStore', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: SessionStore;

  beforeEach(() => {
    db = createDatabase(':memory:');
    store = new SessionStore(db);
  });

  // ── Basic operations ────────────────────────────────────────────
  describe('create + get', () => {
    it('createSession returns session with generated UUID', () => {
      const session = store.createSession('Test Title', '16:9');
      expect(session.id).toMatch(/^[0-9a-f]{8}-/);
      expect(session.title).toBe('Test Title');
      expect(session.aspect_ratio).toBe('16:9');
      expect(session.script).toBeNull();
      expect(session.created_at).toBeGreaterThan(0);
    });

    it('getSession retrieves created session', () => {
      const created = store.createSession('Retrieve Test', '16:9');
      const found = store.getSession(created.id);
      expect(found).not.toBeNull();
      expect(found!.title).toBe('Retrieve Test');
    });

    it('getSession returns null for unknown ID', () => {
      expect(store.getSession('nonexistent-id')).toBeNull();
    });

    it('defaults aspect_ratio to 16:9', () => {
      const session = store.createSession('Default AR');
      expect(session.aspect_ratio).toBe('16:9');
    });
  });

  // ── Script management ───────────────────────────────────────────
  describe('setScript', () => {
    it('stores visual script in memory and DB', () => {
      const session = store.createSession('Script Test', '16:9');
      const script = {
        sceneId: session.id,
        totalDuration: 4000,
        frames: [{ id: 'f1', startTime: 0, endTime: 4000, entities: [], narrationSegment: '', description: '' }],
      };
      store.setScript(session.id, script);

      const found = store.getSession(session.id);
      expect(found!.script).toEqual(script);
    });

    it('replaces existing script', () => {
      const session = store.createSession('Replace Test', '16:9');
      const script1 = { sceneId: session.id, totalDuration: 1000, frames: [{ id: 'f1', startTime: 0, endTime: 1000, entities: [], narrationSegment: '', description: '' }] };
      const script2 = { sceneId: session.id, totalDuration: 2000, frames: [{ id: 'f1', startTime: 0, endTime: 1000, entities: [], narrationSegment: '', description: '' }, { id: 'f2', startTime: 1000, endTime: 2000, entities: [], narrationSegment: '', description: '' }] };

      store.setScript(session.id, script1);
      store.setScript(session.id, script2);

      expect(store.getSession(session.id)!.script!.frames).toHaveLength(2);
    });

    it('throws for unknown session ID', () => {
      expect(() => store.setScript('bad-id', {} as any)).toThrow();
    });
  });

  // ── Narration management ────────────────────────────────────────
  describe('addNarration', () => {
    it('stores narration and returns narration ID', () => {
      const session = store.createSession('Narr Test', '16:9');
      const result = store.addNarration(session.id, 'Hello world', 0);
      expect(result.narration_id).toMatch(/^[0-9a-f]{8}-/);
      expect(result.text_length).toBe(11);
    });

    it('throws for unknown session ID', () => {
      expect(() => store.addNarration('bad-id', 'text', 0)).toThrow();
    });
  });

  // ── Warm load from DB ───────────────────────────────────────────
  describe('loadFromDb', () => {
    it('restores sessions from SQLite into memory', () => {
      // Create sessions in one store
      const store1 = new SessionStore(db);
      const s = store1.createSession('Persistent', '4:3');
      const script = { sceneId: s.id, totalDuration: 1000, frames: [{ id: 'f1', startTime: 0, endTime: 1000, entities: [], narrationSegment: '', description: '' }] };
      store1.setScript(s.id, script);

      // Create a new store from same DB (simulates server restart)
      const store2 = new SessionStore(db);
      store2.loadFromDb();

      const restored = store2.getSession(s.id);
      expect(restored).not.toBeNull();
      expect(restored!.title).toBe('Persistent');
      expect(restored!.script).toEqual(script);
    });

    it('loads empty store when DB is empty', () => {
      const freshDb = createDatabase(':memory:');
      const freshStore = new SessionStore(freshDb);
      freshStore.loadFromDb();
      expect(freshStore.getSession('anything')).toBeNull();
    });
  });

  // ── Size / count ────────────────────────────────────────────────
  describe('size', () => {
    it('returns number of sessions in memory', () => {
      expect(store.size).toBe(0);
      store.createSession('A');
      expect(store.size).toBe(1);
      store.createSession('B');
      expect(store.size).toBe(2);
    });
  });
});
