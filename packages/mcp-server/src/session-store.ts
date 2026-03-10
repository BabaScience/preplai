/**
 * @preplai/mcp-server — Session Store
 *
 * In-memory Map with MongoDB durability.
 * Fast reads from memory, writes go to both memory + MongoDB.
 */
import { randomUUID } from 'node:crypto';
import {
  Session as SessionModel,
  VisualScript,
  VisualScriptHeader,
  VisualScriptFrame,
  Narration,
} from '@preplai/db';

// ── Types ─────────────────────────────────────────────────────────────

export interface InMemorySession {
  id: string;
  title: string;
  aspect_ratio: string;
  api_key_id: string | null;
  script: any | null;
  created_at: number;
}

/**
 * Extract non-frame metadata from a script object for per-frame header storage.
 * Returns a JSON string of all properties except `frames` (stored per-frame),
 * `totalDuration` and `style` (stored as dedicated header fields).
 */
function extractScriptMetadata(script: any): string | null {
  if (!script) return null;
  const { frames, totalDuration, style, ...rest } = script;
  return Object.keys(rest).length > 0 ? JSON.stringify(rest) : null;
}

/**
 * Reconstruct a script object from per-frame header + frame documents.
 */
function reconstructScript(header: any, frames: any[]): any {
  const script: any = {
    frames,
    totalDuration: header.totalDuration,
  };
  if (header.style) {
    script.style = JSON.parse(header.style);
  }
  // Restore extra metadata (sceneId, language, etc.)
  if (header.metadataJson) {
    Object.assign(script, JSON.parse(header.metadataJson));
  }
  return script;
}

// ── Session Store ─────────────────────────────────────────────────────

export class SessionStore {
  private readonly store = new Map<string, InMemorySession>();

  /** Number of sessions currently in memory. */
  get size(): number {
    return this.store.size;
  }

  /**
   * Create a new session. Persists to MongoDB and caches in memory.
   */
  async createSession(
    title: string,
    aspect_ratio = '16:9',
    apiKeyId: string | null = null,
  ): Promise<InMemorySession> {
    const id = randomUUID();
    const now = Date.now();

    await SessionModel.create({
      id,
      title,
      aspectRatio: aspect_ratio,
      apiKeyId,
      createdAt: now,
    });

    const session: InMemorySession = {
      id,
      title,
      aspect_ratio,
      api_key_id: apiKeyId,
      script: null,
      created_at: now,
    };
    this.store.set(id, session);
    return session;
  }

  getSession(id: string): InMemorySession | null {
    return this.store.get(id) ?? null;
  }

  /**
   * Get session from memory, or hydrate from MongoDB if not present.
   * Use when serving player/SSE so sessions created by another process are visible.
   */
  async getSessionOrHydrate(id: string): Promise<InMemorySession | null> {
    const cached = this.store.get(id);
    if (cached) return cached;

    const row = await SessionModel.findOne({ id }).lean() as { id: string; title: string; aspectRatio: string; apiKeyId?: string | null; createdAt: number } | null;
    if (!row) return null;

    const script = await this._hydrateScript(id);

    const session: InMemorySession = {
      id: row.id,
      title: row.title,
      aspect_ratio: row.aspectRatio,
      api_key_id: row.apiKeyId ?? null,
      script,
      created_at: row.createdAt,
    };
    this.store.set(id, session);
    return session;
  }

  /**
   * Hydrate a script from per-frame storage (preferred) or legacy format (fallback).
   */
  private async _hydrateScript(sessionId: string): Promise<any> {
    // Try per-frame storage first (new format)
    const header = await VisualScriptHeader.findOne({ sessionId }).lean() as any;
    if (header) {
      const frameDocs = await VisualScriptFrame.find({ sessionId })
        .sort({ frameIndex: 1 })
        .lean();
      const frames = frameDocs.map((doc: any) => JSON.parse(doc.frameJson));
      return reconstructScript(header, frames);
    }

    // Fall back to legacy single-document format
    const scriptDoc = await VisualScript.findOne({ sessionId }).lean();
    const scriptData = scriptDoc && 'scriptJson' in scriptDoc ? scriptDoc.scriptJson : null;
    return scriptData ? JSON.parse(scriptData as string) : null;
  }

  /**
   * Set or replace the VisualScript for a session (full rewrite).
   * Updates both legacy single-document and per-frame storage.
   * Use appendFrames() for incremental appends.
   */
  async setScript(sessionId: string, script: any): Promise<void> {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found in store.`);
    }

    const now = Date.now();
    const frames = script.frames ?? [];

    // Legacy format
    await VisualScript.findOneAndUpdate(
      { sessionId },
      { scriptJson: JSON.stringify(script), updatedAt: now },
      { upsert: true },
    );

    // Per-frame format: replace header + delete old frames + insert new ones
    await VisualScriptHeader.findOneAndUpdate(
      { sessionId },
      {
        totalDuration: script.totalDuration ?? 0,
        style: script.style ? JSON.stringify(script.style) : null,
        frameCount: frames.length,
        metadataJson: extractScriptMetadata(script),
        updatedAt: now,
      },
      { upsert: true },
    );

    // Delete all existing frames and rewrite (used by remove_frames, replace mode)
    await VisualScriptFrame.deleteMany({ sessionId });
    if (frames.length > 0) {
      const docs = frames.map((frame: any, i: number) => ({
        sessionId,
        frameIndex: i,
        frameJson: JSON.stringify(frame),
        updatedAt: now,
      }));
      await VisualScriptFrame.insertMany(docs);
    }

    session.script = script;
  }

  /**
   * Append frames to a session's VisualScript using per-frame storage.
   * Writes only the new frames (from startIndex onwards) as individual documents,
   * plus updates the header with total duration and frame count.
   * Also writes to legacy VisualScript.scriptJson for backward compatibility.
   */
  async appendFrames(sessionId: string, mergedScript: any, startIndex: number): Promise<void> {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found in store.`);
    }

    const now = Date.now();
    const frames = mergedScript.frames ?? [];
    const newFrames = frames.slice(startIndex);

    // 1. Upsert header with updated metadata
    await VisualScriptHeader.findOneAndUpdate(
      { sessionId },
      {
        totalDuration: mergedScript.totalDuration ?? 0,
        style: mergedScript.style ? JSON.stringify(mergedScript.style) : null,
        frameCount: frames.length,
        metadataJson: extractScriptMetadata(mergedScript),
        updatedAt: now,
      },
      { upsert: true },
    );

    // 2. Bulk-write only the new frames
    if (newFrames.length > 0) {
      const ops = newFrames.map((frame: any, i: number) => ({
        updateOne: {
          filter: { sessionId, frameIndex: startIndex + i },
          update: {
            $set: {
              frameJson: JSON.stringify(frame),
              updatedAt: now,
            },
          },
          upsert: true,
        },
      }));
      await VisualScriptFrame.bulkWrite(ops);
    }

    // 3. Also write legacy format for backward compatibility
    await VisualScript.findOneAndUpdate(
      { sessionId },
      { scriptJson: JSON.stringify(mergedScript), updatedAt: now },
      { upsert: true },
    );

    // 4. Update in-memory cache
    session.script = mergedScript;
  }

  /**
   * Add a narration entry for a session.
   */
  async addNarration(
    sessionId: string,
    text: string,
    frameIndex: number,
  ): Promise<{ narration_id: string; text_length: number; created_at: number }> {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found in store.`);
    }

    const narrationId = randomUUID();
    const now = Date.now();

    await Narration.create({
      id: narrationId,
      sessionId,
      frameIndex,
      text,
      createdAt: now,
    });

    return {
      narration_id: narrationId,
      text_length: text.length,
      created_at: now,
    };
  }

  listSessions(): InMemorySession[] {
    return Array.from(this.store.values())
      .sort((a, b) => b.created_at - a.created_at);
  }

  listSessionsByKey(apiKeyId: string): InMemorySession[] {
    return Array.from(this.store.values())
      .filter((s) => s.api_key_id === apiKeyId)
      .sort((a, b) => b.created_at - a.created_at);
  }

  async deleteSession(id: string): Promise<boolean> {
    const inMemory = this.store.has(id);

    // Always attempt MongoDB cleanup — session may exist only in DB after restart
    await Promise.all([
      Narration.deleteMany({ sessionId: id }),
      VisualScript.deleteOne({ sessionId: id }),
      VisualScriptHeader.deleteOne({ sessionId: id }),
      VisualScriptFrame.deleteMany({ sessionId: id }),
      SessionModel.deleteOne({ id }),
    ]);

    if (inMemory) {
      this.store.delete(id);
    }

    return inMemory;
  }

  /**
   * Clean expired sessions from both in-memory store AND MongoDB.
   * Queries MongoDB directly so sessions that only exist in the database
   * (e.g. after server restarts) are also cleaned up.
   */
  async cleanExpiredSessions(maxAgeMs = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = Date.now() - maxAgeMs;
    let cleaned = 0;

    // 1. Clean in-memory sessions
    for (const [id, session] of this.store) {
      if (session.created_at < cutoff) {
        await this.deleteSession(id);
        cleaned++;
      }
    }

    // 2. Clean MongoDB-only sessions (not in memory, e.g. after restart)
    const dbExpired = await SessionModel.find(
      { createdAt: { $lt: cutoff } },
      { id: 1 },
    ).lean();

    for (const row of dbExpired) {
      const sid = (row as any).id;
      if (!this.store.has(sid)) {
        // Already removed from memory (or was never loaded) — clean DB directly
        await Promise.all([
          Narration.deleteMany({ sessionId: sid }),
          VisualScript.deleteOne({ sessionId: sid }),
          VisualScriptHeader.deleteOne({ sessionId: sid }),
          VisualScriptFrame.deleteMany({ sessionId: sid }),
          SessionModel.deleteOne({ id: sid }),
        ]);
        cleaned++;
      }
    }

    return cleaned;
  }

  /**
   * Load all sessions from MongoDB into memory.
   */
  async loadFromDb(): Promise<void> {
    this.store.clear();

    const rows = await SessionModel.find({}).lean();
    for (const row of rows) {
      const script = await this._hydrateScript(row.id);

      this.store.set(row.id, {
        id: row.id,
        title: row.title,
        aspect_ratio: row.aspectRatio,
        api_key_id: row.apiKeyId ?? null,
        script,
        created_at: row.createdAt,
      });
    }
  }
}
