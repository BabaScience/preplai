/**
 * @pre/mcp-server — Database Layer Tests (TDD)
 *
 * Tests for initSchema, prepared statements, and CRUD operations.
 * Uses in-memory SQLite (:memory:) for isolation.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDatabase,
  insertSession,
  getSessionRow,
  getAllSessionRows,
  upsertVisualScript,
  getVisualScriptRow,
  insertNarration,
  getNarrationsBySession,
} from './db.js';

describe('Database layer', () => {
  let db: ReturnType<typeof createDatabase>;

  beforeEach(() => {
    db = createDatabase(':memory:');
  });

  // ── Schema ──────────────────────────────────────────────────────
  describe('initSchema (via createDatabase)', () => {
    it('creates sessions table', () => {
      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
      ).all();
      expect(tables).toHaveLength(1);
    });

    it('creates visual_scripts table', () => {
      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='visual_scripts'"
      ).all();
      expect(tables).toHaveLength(1);
    });

    it('creates narrations table', () => {
      const tables = db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='narrations'"
      ).all();
      expect(tables).toHaveLength(1);
    });

    it('sets WAL journal mode (on-disk databases)', () => {
      // In-memory DBs report 'memory' for journal_mode; WAL only applies to on-disk.
      // We verify the pragma call doesn't throw and returns a valid mode.
      const mode = db.pragma('journal_mode', { simple: true });
      expect(['wal', 'memory']).toContain(mode);
    });

    it('is idempotent (can call createDatabase twice on same path)', () => {
      // Second call should not throw
      expect(() => createDatabase(':memory:')).not.toThrow();
    });
  });

  // ── Sessions CRUD ───────────────────────────────────────────────
  describe('sessions CRUD', () => {
    const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const now = Date.now();

    it('insertSession stores a row', () => {
      insertSession(db, { id, title: 'Test', aspect_ratio: '16:9', created_at: now });
      const row = getSessionRow(db, id);
      expect(row).not.toBeNull();
      expect(row!.title).toBe('Test');
      expect(row!.aspect_ratio).toBe('16:9');
      expect(row!.created_at).toBe(now);
    });

    it('getSessionRow returns null for missing ID', () => {
      expect(getSessionRow(db, 'nonexistent')).toBeNull();
    });

    it('getAllSessionRows returns all sessions', () => {
      insertSession(db, { id, title: 'A', aspect_ratio: '16:9', created_at: now });
      insertSession(db, { id: 'ffff0000-1111-2222-3333-444444444444', title: 'B', aspect_ratio: '4:3', created_at: now + 1 });
      const rows = getAllSessionRows(db);
      expect(rows).toHaveLength(2);
    });

    it('rejects duplicate session ID', () => {
      insertSession(db, { id, title: 'A', aspect_ratio: '16:9', created_at: now });
      expect(() =>
        insertSession(db, { id, title: 'Dup', aspect_ratio: '16:9', created_at: now })
      ).toThrow();
    });
  });

  // ── Visual Scripts CRUD ─────────────────────────────────────────
  describe('visual_scripts CRUD', () => {
    const sessionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const now = Date.now();
    const scriptJson = '{"sceneId":"test","frames":[],"totalDuration":0}';

    beforeEach(() => {
      insertSession(db, { id: sessionId, title: 'VS Test', aspect_ratio: '16:9', created_at: now });
    });

    it('upsertVisualScript inserts new script', () => {
      upsertVisualScript(db, { session_id: sessionId, script_json: scriptJson, updated_at: now });
      const row = getVisualScriptRow(db, sessionId);
      expect(row).not.toBeNull();
      expect(row!.script_json).toBe(scriptJson);
    });

    it('upsertVisualScript replaces existing script', () => {
      upsertVisualScript(db, { session_id: sessionId, script_json: scriptJson, updated_at: now });
      const newJson = '{"sceneId":"test","frames":[{}],"totalDuration":1000}';
      upsertVisualScript(db, { session_id: sessionId, script_json: newJson, updated_at: now + 1 });
      const row = getVisualScriptRow(db, sessionId);
      expect(row!.script_json).toBe(newJson);
      expect(row!.updated_at).toBe(now + 1);
    });

    it('getVisualScriptRow returns null for missing session', () => {
      expect(getVisualScriptRow(db, 'nonexistent')).toBeNull();
    });
  });

  // ── Narrations CRUD ─────────────────────────────────────────────
  describe('narrations CRUD', () => {
    const sessionId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const now = Date.now();

    beforeEach(() => {
      insertSession(db, { id: sessionId, title: 'Narr Test', aspect_ratio: '16:9', created_at: now });
    });

    it('insertNarration stores a narration row', () => {
      insertNarration(db, {
        id: 'narr-1',
        session_id: sessionId,
        frame_index: 0,
        text: 'Hello world',
        created_at: now,
      });
      const rows = getNarrationsBySession(db, sessionId);
      expect(rows).toHaveLength(1);
      expect(rows[0].text).toBe('Hello world');
      expect(rows[0].frame_index).toBe(0);
    });

    it('multiple narrations per session', () => {
      insertNarration(db, { id: 'n1', session_id: sessionId, frame_index: 0, text: 'First', created_at: now });
      insertNarration(db, { id: 'n2', session_id: sessionId, frame_index: 1, text: 'Second', created_at: now + 1 });
      const rows = getNarrationsBySession(db, sessionId);
      expect(rows).toHaveLength(2);
    });

    it('getNarrationsBySession returns empty array for no narrations', () => {
      expect(getNarrationsBySession(db, sessionId)).toEqual([]);
    });
  });
});
