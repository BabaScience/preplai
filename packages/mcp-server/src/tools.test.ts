/**
 * @pre/mcp-server — MCP Tool Handler Tests (TDD)
 *
 * Tests for all 5 MCP tool handlers as pure functions.
 * Handlers receive dependencies (store, sse, baseUrl) via injection.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createDatabase } from './db.js';
import { SessionStore } from './session-store.js';
import { SseRegistry } from './sse.js';
import {
  handleCreateSession,
  handleAddScene,
  handleUpdateScene,
  handleAddNarration,
  handleGetSessionUrl,
} from './tools.js';

/** Helper to parse MCP tool result */
function parse(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text);
}

/** Minimal valid VisualScript for testing */
function makeScript(sessionId: string, frameCount = 1) {
  return {
    sceneId: sessionId,
    totalDuration: frameCount * 4000,
    frames: Array.from({ length: frameCount }, (_, i) => ({
      id: `frame-${i}`,
      startTime: i * 4000,
      endTime: (i + 1) * 4000,
      entities: [
        { id: `entity-${i}`, type: 'Server', position: { x: 50, y: 50 } },
      ],
      narrationSegment: '',
      description: `Frame ${i}`,
    })),
  };
}

describe('MCP Tool Handlers', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: SessionStore;
  let sse: SseRegistry;
  const baseUrl = 'http://localhost:3001';

  beforeEach(() => {
    db = createDatabase(':memory:');
    store = new SessionStore(db);
    sse = new SseRegistry();
  });

  // ── create_session ──────────────────────────────────────────────
  describe('handleCreateSession', () => {
    it('returns success with session_id and player_url', async () => {
      const result = await handleCreateSession(
        { title: 'Binary Search Intro', aspect_ratio: '16:9' },
        { store, baseUrl }
      );
      const data = parse(result);
      expect(data.success).toBe(true);
      expect(data.data.session_id).toMatch(/^[0-9a-f]{8}-/);
      expect(data.data.player_url).toBe(`${baseUrl}/player/${data.data.session_id}`);
      expect(data.data.embed_url).toBe(`${baseUrl}/player/${data.data.session_id}?embed=1`);
      expect(data.data.title).toBe('Binary Search Intro');
      expect(data.data.aspect_ratio).toBe('16:9');
      expect(data.data.created_at).toBeTruthy();
    });

    it('defaults aspect_ratio to 16:9', async () => {
      const result = await handleCreateSession(
        { title: 'No AR' },
        { store, baseUrl }
      );
      const data = parse(result);
      expect(data.data.aspect_ratio).toBe('16:9');
    });

    it('persists session in store', async () => {
      const result = await handleCreateSession(
        { title: 'Persist Check' },
        { store, baseUrl }
      );
      const { session_id } = parse(result).data;
      expect(store.getSession(session_id)).not.toBeNull();
    });
  });

  // ── add_scene ───────────────────────────────────────────────────
  describe('handleAddScene', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await handleCreateSession(
        { title: 'Scene Test' },
        { store, baseUrl }
      );
      sessionId = parse(result).data.session_id;
    });

    it('stores script and returns frame_count', async () => {
      const script = makeScript(sessionId, 3);
      const result = await handleAddScene(
        { session_id: sessionId, visual_script: script },
        { store, sse }
      );
      const data = parse(result);
      expect(data.success).toBe(true);
      expect(data.data.session_id).toBe(sessionId);
      expect(data.data.frame_count).toBe(3);
      expect(data.data.total_duration_ms).toBe(12000);
    });

    it('emits script_update SSE event', async () => {
      const emitSpy = vi.spyOn(sse, 'emit');
      const script = makeScript(sessionId);
      await handleAddScene(
        { session_id: sessionId, visual_script: script },
        { store, sse }
      );
      expect(emitSpy).toHaveBeenCalledWith(sessionId, {
        type: 'script_update',
        script,
      });
    });

    it('returns SESSION_NOT_FOUND for bad session_id', async () => {
      const script = makeScript('bad-uuid');
      const result = await handleAddScene(
        { session_id: 'bad-uuid', visual_script: script },
        { store, sse }
      );
      const data = parse(result);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('SESSION_NOT_FOUND');
    });
  });

  // ── update_scene ────────────────────────────────────────────────
  describe('handleUpdateScene', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await handleCreateSession(
        { title: 'Update Test' },
        { store, baseUrl }
      );
      sessionId = parse(result).data.session_id;
      // Add initial scene
      await handleAddScene(
        { session_id: sessionId, visual_script: makeScript(sessionId, 1) },
        { store, sse }
      );
    });

    it('replaces existing script', async () => {
      const newScript = makeScript(sessionId, 5);
      const result = await handleUpdateScene(
        { session_id: sessionId, visual_script: newScript },
        { store, sse }
      );
      const data = parse(result);
      expect(data.success).toBe(true);
      expect(data.data.frame_count).toBe(5);
      expect(data.data.total_duration_ms).toBe(20000);
    });

    it('emits script_update SSE event', async () => {
      const emitSpy = vi.spyOn(sse, 'emit');
      const newScript = makeScript(sessionId, 2);
      await handleUpdateScene(
        { session_id: sessionId, visual_script: newScript },
        { store, sse }
      );
      expect(emitSpy).toHaveBeenCalledWith(sessionId, {
        type: 'script_update',
        script: newScript,
      });
    });

    it('returns SESSION_NOT_FOUND for bad session_id', async () => {
      const result = await handleUpdateScene(
        { session_id: 'bad-uuid', visual_script: makeScript('bad') },
        { store, sse }
      );
      expect(parse(result).error.code).toBe('SESSION_NOT_FOUND');
    });
  });

  // ── add_narration ───────────────────────────────────────────────
  describe('handleAddNarration', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await handleCreateSession(
        { title: 'Narration Test' },
        { store, baseUrl }
      );
      sessionId = parse(result).data.session_id;
      await handleAddScene(
        { session_id: sessionId, visual_script: makeScript(sessionId, 3) },
        { store, sse }
      );
    });

    it('stores narration and returns narration_id', async () => {
      const result = await handleAddNarration(
        { session_id: sessionId, text: 'The server processes requests.', frame_index: 0 },
        { store, sse }
      );
      const data = parse(result);
      expect(data.success).toBe(true);
      expect(data.data.narration_id).toMatch(/^[0-9a-f]{8}-/);
      expect(data.data.frame_index).toBe(0);
      expect(data.data.text_length).toBe(30);
    });

    it('defaults frame_index to 0', async () => {
      const result = await handleAddNarration(
        { session_id: sessionId, text: 'Default frame' },
        { store, sse }
      );
      expect(parse(result).data.frame_index).toBe(0);
    });

    it('emits narration_update SSE event', async () => {
      const emitSpy = vi.spyOn(sse, 'emit');
      await handleAddNarration(
        { session_id: sessionId, text: 'Narration text', frame_index: 1 },
        { store, sse }
      );
      expect(emitSpy).toHaveBeenCalledWith(sessionId, expect.objectContaining({
        type: 'narration_update',
        text: 'Narration text',
        frame_index: 1,
      }));
    });

    it('returns FRAME_NOT_FOUND for out-of-range frame_index', async () => {
      const result = await handleAddNarration(
        { session_id: sessionId, text: 'Bad frame', frame_index: 10 },
        { store, sse }
      );
      const data = parse(result);
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FRAME_NOT_FOUND');
      expect(data.error.message).toContain('10');
    });

    it('returns SESSION_NOT_FOUND for bad session_id', async () => {
      const result = await handleAddNarration(
        { session_id: 'bad-id', text: 'Missing', frame_index: 0 },
        { store, sse }
      );
      expect(parse(result).error.code).toBe('SESSION_NOT_FOUND');
    });

    it('allows narration when no script exists yet (no frame validation)', async () => {
      // Create session without adding a scene
      const r = await handleCreateSession({ title: 'No Script' }, { store, baseUrl });
      const sid = parse(r).data.session_id;
      const result = await handleAddNarration(
        { session_id: sid, text: 'Early narration', frame_index: 0 },
        { store, sse }
      );
      expect(parse(result).success).toBe(true);
    });
  });

  // ── get_session_url ─────────────────────────────────────────────
  describe('handleGetSessionUrl', () => {
    let sessionId: string;

    beforeEach(async () => {
      const result = await handleCreateSession(
        { title: 'URL Test', aspect_ratio: '4:3' },
        { store, baseUrl }
      );
      sessionId = parse(result).data.session_id;
    });

    it('returns player_url and embed_url', async () => {
      const result = await handleGetSessionUrl(
        { session_id: sessionId },
        { store, baseUrl }
      );
      const data = parse(result);
      expect(data.success).toBe(true);
      expect(data.data.player_url).toContain(sessionId);
      expect(data.data.embed_url).toContain('embed=1');
    });

    it('includes stats when include_stats is true', async () => {
      // Add a script first
      await handleAddScene(
        { session_id: sessionId, visual_script: makeScript(sessionId, 2) },
        { store, sse }
      );

      const result = await handleGetSessionUrl(
        { session_id: sessionId, include_stats: true },
        { store, baseUrl }
      );
      const data = parse(result);
      expect(data.data.title).toBe('URL Test');
      expect(data.data.aspect_ratio).toBe('4:3');
      expect(data.data.frame_count).toBe(2);
      expect(data.data.total_duration_ms).toBe(8000);
      expect(data.data.created_at).toBeTruthy();
    });

    it('stats with no script shows zero counts', async () => {
      const result = await handleGetSessionUrl(
        { session_id: sessionId, include_stats: true },
        { store, baseUrl }
      );
      const data = parse(result);
      expect(data.data.frame_count).toBe(0);
      expect(data.data.total_duration_ms).toBe(0);
    });

    it('defaults include_stats to false (no stats fields)', async () => {
      const result = await handleGetSessionUrl(
        { session_id: sessionId },
        { store, baseUrl }
      );
      const data = parse(result);
      expect(data.data.title).toBeUndefined();
      expect(data.data.frame_count).toBeUndefined();
    });

    it('returns SESSION_NOT_FOUND for bad session_id', async () => {
      const result = await handleGetSessionUrl(
        { session_id: 'bad-id' },
        { store, baseUrl }
      );
      expect(parse(result).error.code).toBe('SESSION_NOT_FOUND');
    });
  });
});
