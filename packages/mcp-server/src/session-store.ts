/**
 * @preplai/mcp-server — Session Store
 *
 * In-memory Map with SQLite durability.
 * Fast reads from memory, writes go to both memory + SQLite.
 */
import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';
import {
  insertSession,
  getAllSessionRows,
  upsertVisualScript,
  getVisualScriptRow,
  insertNarration,
} from './db.js';

// ── Types ─────────────────────────────────────────────────────────────

export interface InMemorySession {
  id: string;
  title: string;
  aspect_ratio: string;
  api_key_id: string | null;
  script: any | null;
  created_at: number;
}

// ── Session Store ─────────────────────────────────────────────────────

export class SessionStore {
  private readonly store = new Map<string, InMemorySession>();
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /** Number of sessions currently in memory. */
  get size(): number {
    return this.store.size;
  }

  /**
   * Create a new session. Persists to SQLite and caches in memory.
   * Returns the in-memory session object.
   */
  createSession(title: string, aspect_ratio = '16:9', apiKeyId: string | null = null): InMemorySession {
    const id = randomUUID();
    const now = Date.now();

    // Persist to SQLite
    insertSession(this.db, { id, title, aspect_ratio, api_key_id: apiKeyId, created_at: now });

    // Cache in memory
    const session: InMemorySession = { id, title, aspect_ratio, api_key_id: apiKeyId, script: null, created_at: now };
    this.store.set(id, session);

    return session;
  }

  /**
   * Retrieve a session from the in-memory store.
   * Returns null if not found.
   */
  getSession(id: string): InMemorySession | null {
    return this.store.get(id) ?? null;
  }

  /**
   * Set or replace the VisualScript for a session.
   * Persists to SQLite and updates the memory cache.
   * Throws if session does not exist.
   */
  setScript(sessionId: string, script: any): void {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found in store.`);
    }

    const now = Date.now();
    upsertVisualScript(this.db, {
      session_id: sessionId,
      script_json: JSON.stringify(script),
      updated_at: now,
    });

    session.script = script;
  }

  /**
   * Add a narration entry for a session.
   * Persists to SQLite.
   * Throws if session does not exist.
   * Returns narration metadata.
   */
  addNarration(
    sessionId: string,
    text: string,
    frameIndex: number,
  ): { narration_id: string; text_length: number; created_at: number } {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found in store.`);
    }

    const narrationId = randomUUID();
    const now = Date.now();

    insertNarration(this.db, {
      id: narrationId,
      session_id: sessionId,
      frame_index: frameIndex,
      text,
      created_at: now,
    });

    return {
      narration_id: narrationId,
      text_length: text.length,
      created_at: now,
    };
  }

  /** List all sessions, most recent first. */
  listSessions(): InMemorySession[] {
    return Array.from(this.store.values())
      .sort((a, b) => b.created_at - a.created_at);
  }

  /** List sessions owned by a specific API key. */
  listSessionsByKey(apiKeyId: string): InMemorySession[] {
    return Array.from(this.store.values())
      .filter(s => s.api_key_id === apiKeyId)
      .sort((a, b) => b.created_at - a.created_at);
  }

  /** Delete a session from memory and SQLite. Returns true if it existed. */
  deleteSession(id: string): boolean {
    const existed = this.store.delete(id);
    if (existed) {
      this.db.prepare('DELETE FROM narrations WHERE session_id = ?').run(id);
      this.db.prepare('DELETE FROM visual_scripts WHERE session_id = ?').run(id);
      this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);
    }
    return existed;
  }

  /**
   * Delete sessions older than maxAgeMs.
   * Returns the number of sessions cleaned up.
   */
  cleanExpiredSessions(maxAgeMs: number = 7 * 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAgeMs;
    let cleaned = 0;

    for (const [id, session] of this.store) {
      if (session.created_at < cutoff) {
        this.deleteSession(id);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Load all sessions from SQLite into memory.
   * Called on server startup to warm the in-memory cache.
   */
  loadFromDb(): void {
    this.store.clear();

    const rows = getAllSessionRows(this.db);
    for (const row of rows) {
      const scriptRow = getVisualScriptRow(this.db, row.id);
      this.store.set(row.id, {
        id: row.id,
        title: row.title,
        aspect_ratio: row.aspect_ratio,
        api_key_id: row.api_key_id ?? null,
        script: scriptRow ? JSON.parse(scriptRow.script_json) : null,
        created_at: row.created_at,
      });
    }
  }
}
