/**
 * @preplai/mcp-server — Database Layer
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
  api_key_id: string | null;
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
    CREATE TABLE IF NOT EXISTS api_keys (
      id           TEXT PRIMARY KEY,
      key_hash     TEXT NOT NULL UNIQUE,
      key_prefix   TEXT NOT NULL,
      owner_email  TEXT NOT NULL,
      tier         TEXT NOT NULL DEFAULT 'free',
      created_at   INTEGER NOT NULL,
      last_used_at INTEGER,
      revoked      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      aspect_ratio TEXT NOT NULL DEFAULT '16:9',
      api_key_id   TEXT,
      created_at   INTEGER NOT NULL,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
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

    CREATE TABLE IF NOT EXISTS usage_log (
      id           TEXT PRIMARY KEY,
      api_key_id   TEXT NOT NULL,
      action       TEXT NOT NULL,
      session_id   TEXT,
      created_at   INTEGER NOT NULL,
      FOREIGN KEY (api_key_id) REFERENCES api_keys(id)
    );

    CREATE INDEX IF NOT EXISTS idx_usage_log_key ON usage_log(api_key_id);
    CREATE INDEX IF NOT EXISTS idx_usage_log_date ON usage_log(created_at);
  `);

  return db;
}

// ── Session CRUD ──────────────────────────────────────────────────────

export function insertSession(
  db: Database.Database,
  row: SessionRow,
): void {
  db.prepare(
    'INSERT INTO sessions (id, title, aspect_ratio, api_key_id, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(row.id, row.title, row.aspect_ratio, row.api_key_id, row.created_at);
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

// ── API Key types ─────────────────────────────────────────────────────

export interface ApiKeyRow {
  id: string;
  key_hash: string;
  key_prefix: string;
  owner_email: string;
  tier: string;
  created_at: number;
  last_used_at: number | null;
  revoked: number;
}

export interface UsageLogRow {
  id: string;
  api_key_id: string;
  action: string;
  session_id: string | null;
  created_at: number;
}

// ── API Key CRUD ──────────────────────────────────────────────────────

export function insertApiKey(db: Database.Database, row: ApiKeyRow): void {
  db.prepare(
    'INSERT INTO api_keys (id, key_hash, key_prefix, owner_email, tier, created_at, last_used_at, revoked) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(row.id, row.key_hash, row.key_prefix, row.owner_email, row.tier, row.created_at, row.last_used_at, row.revoked);
}

export function getApiKeyByHash(db: Database.Database, keyHash: string): ApiKeyRow | null {
  const row = db.prepare('SELECT * FROM api_keys WHERE key_hash = ? AND revoked = 0').get(keyHash) as ApiKeyRow | undefined;
  return row ?? null;
}

export function updateApiKeyLastUsed(db: Database.Database, id: string): void {
  db.prepare('UPDATE api_keys SET last_used_at = ? WHERE id = ?').run(Date.now(), id);
}

export function getApiKeyById(db: Database.Database, id: string): ApiKeyRow | null {
  const row = db.prepare('SELECT * FROM api_keys WHERE id = ?').get(id) as ApiKeyRow | undefined;
  return row ?? null;
}

export function revokeApiKey(db: Database.Database, id: string): void {
  db.prepare('UPDATE api_keys SET revoked = 1 WHERE id = ?').run(id);
}

// ── Usage Log CRUD ───────────────────────────────────────────────────

export function insertUsageLog(db: Database.Database, row: UsageLogRow): void {
  db.prepare(
    'INSERT INTO usage_log (id, api_key_id, action, session_id, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(row.id, row.api_key_id, row.action, row.session_id, row.created_at);
}

export function countUsageByKeyAndAction(
  db: Database.Database,
  apiKeyId: string,
  action: string,
  sinceMs?: number,
): number {
  if (sinceMs) {
    const row = db.prepare(
      'SELECT COUNT(*) as count FROM usage_log WHERE api_key_id = ? AND action = ? AND created_at >= ?'
    ).get(apiKeyId, action, sinceMs) as { count: number };
    return row.count;
  }
  const row = db.prepare(
    'SELECT COUNT(*) as count FROM usage_log WHERE api_key_id = ? AND action = ?'
  ).get(apiKeyId, action) as { count: number };
  return row.count;
}

export function getUsageByKey(db: Database.Database, apiKeyId: string, limit = 50): UsageLogRow[] {
  return db.prepare(
    'SELECT * FROM usage_log WHERE api_key_id = ? ORDER BY created_at DESC LIMIT ?'
  ).all(apiKeyId, limit) as UsageLogRow[];
}
