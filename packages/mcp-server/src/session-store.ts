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
   * Set or replace the VisualScript for a session.
   */
  async setScript(sessionId: string, script: any): Promise<void> {
    const session = this.store.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found in store.`);
    }

    const now = Date.now();
    await VisualScript.findOneAndUpdate(
      { sessionId },
      { scriptJson: JSON.stringify(script), updatedAt: now },
      { upsert: true },
    );

    session.script = script;
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
    const existed = this.store.has(id);
    if (existed) {
      await Promise.all([
        Narration.deleteMany({ sessionId: id }),
        VisualScript.deleteOne({ sessionId: id }),
        SessionModel.deleteOne({ id }),
      ]);
      this.store.delete(id);
    }
    return existed;
  }

  async cleanExpiredSessions(maxAgeMs = 7 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoff = Date.now() - maxAgeMs;
    let cleaned = 0;

    for (const [id, session] of this.store) {
      if (session.created_at < cutoff) {
        await this.deleteSession(id);
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
      const scriptDoc = await VisualScript.findOne({ sessionId: row.id }).lean();
      const scriptData = scriptDoc && 'scriptJson' in scriptDoc ? scriptDoc.scriptJson : null;
      this.store.set(row.id, {
        id: row.id,
        title: row.title,
        aspect_ratio: row.aspectRatio,
        api_key_id: row.apiKeyId ?? null,
        script: scriptData ? JSON.parse(scriptData as string) : null,
        created_at: row.createdAt,
      });
    }
  }
}
