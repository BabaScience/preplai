/**
 * @pre/mcp-server — Database Layer
 *
 * SQLite persistence via better-sqlite3.
 * All functions are synchronous (better-sqlite3 is sync).
 */
import Database from 'better-sqlite3';

// ── Types ─────────────────────────────────────────────────────────────

export interface SessionRow {
  id: string;
  title: string;
  aspect_ratio: string;
  created_at: number;
}

export interface VisualScriptRow {
  session_id: string;
  script_json: string;
  updated_at: number;
}

export interface NarrationRow {
  id: string;
  session_id: string;
  frame_index: number;
  text: string;
  created_at: number;
}

// ── Database creation + schema init ───────────────────────────────────

export function createDatabase(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      aspect_ratio TEXT NOT NULL DEFAULT '16:9',
      created_at   INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visual_scripts (
      session_id   TEXT PRIMARY KEY,
      script_json  TEXT NOT NULL,
      updated_at   INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS narrations (
      id           TEXT PRIMARY KEY,
      session_id   TEXT NOT NULL,
      frame_index  INTEGER NOT NULL DEFAULT 0,
      text         TEXT NOT NULL,
      created_at   INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);

  return db;
}

// ── Session CRUD ──────────────────────────────────────────────────────

export function insertSession(
  db: Database.Database,
  row: SessionRow,
): void {
  db.prepare(
    'INSERT INTO sessions (id, title, aspect_ratio, created_at) VALUES (?, ?, ?, ?)'
  ).run(row.id, row.title, row.aspect_ratio, row.created_at);
}

export function getSessionRow(
  db: Database.Database,
  id: string,
): SessionRow | null {
  const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as SessionRow | undefined;
  return row ?? null;
}

export function getAllSessionRows(
  db: Database.Database,
): SessionRow[] {
  return db.prepare('SELECT * FROM sessions').all() as SessionRow[];
}

// ── Visual Script CRUD ────────────────────────────────────────────────

export function upsertVisualScript(
  db: Database.Database,
  row: VisualScriptRow,
): void {
  db.prepare(
    'INSERT OR REPLACE INTO visual_scripts (session_id, script_json, updated_at) VALUES (?, ?, ?)'
  ).run(row.session_id, row.script_json, row.updated_at);
}

export function getVisualScriptRow(
  db: Database.Database,
  sessionId: string,
): VisualScriptRow | null {
  const row = db.prepare(
    'SELECT * FROM visual_scripts WHERE session_id = ?'
  ).get(sessionId) as VisualScriptRow | undefined;
  return row ?? null;
}

// ── Narration CRUD ────────────────────────────────────────────────────

export function insertNarration(
  db: Database.Database,
  row: NarrationRow,
): void {
  db.prepare(
    'INSERT INTO narrations (id, session_id, frame_index, text, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(row.id, row.session_id, row.frame_index, row.text, row.created_at);
}

export function getNarrationsBySession(
  db: Database.Database,
  sessionId: string,
): NarrationRow[] {
  return db.prepare(
    'SELECT * FROM narrations WHERE session_id = ? ORDER BY created_at ASC'
  ).all(sessionId) as NarrationRow[];
}
