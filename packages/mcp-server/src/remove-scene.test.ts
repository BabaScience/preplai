/**
 * @preplai/mcp-server — remove_scene tool tests
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { handleRemoveScene, handleCreateSession, handleAddScene } from './tools.js';
import { SessionStore } from './session-store.js';
import { SseRegistry } from './sse.js';
import { createDatabase } from './db.js';

function makeScript(sceneId: string, frameCount: number) {
  const frames = [];
  for (let i = 0; i < frameCount; i++) {
    frames.push({
      id: `${sceneId}-frame-${i}`,
      startTime: i * 5000,
      endTime: (i + 1) * 5000,
      entities: [{ id: `e${i}`, type: 'Label', position: { x: 50, y: 50 }, label: `Frame ${i}` }],
      narrationSegment: `Narration for frame ${i}`,
      description: `Frame ${i} description`,
    });
  }
  return {
    sceneId,
    frames,
    totalDuration: frameCount * 5000,
  };
}

describe('handleRemoveScene', () => {
  let store: SessionStore;
  let sse: SseRegistry;
  let sessionId: string;

  beforeEach(async () => {
    const db = createDatabase(':memory:');
    store = new SessionStore(db);
    sse = new SseRegistry();

    // Create a session with 3 frames
    const result = await handleCreateSession(
      { title: 'Test Pres' },
      { store, baseUrl: 'http://localhost:3001' },
    );
    const data = JSON.parse(result.content[0].text);
    sessionId = data.data.session_id;

    await handleAddScene(
      { session_id: sessionId, visual_script: makeScript('scene-1', 3) },
      { store, sse },
    );
  });

  it('removes last N frames', async () => {
    const result = await handleRemoveScene(
      { session_id: sessionId, last_n: 1 },
      { store, sse },
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.success).toBe(true);
    expect(data.data.removed_count).toBe(1);
    expect(data.data.remaining_frames).toBe(2);
  });

  it('removes specific frame indices', async () => {
    const result = await handleRemoveScene(
      { session_id: sessionId, frame_indices: [0, 2] },
      { store, sse },
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.success).toBe(true);
    expect(data.data.removed_count).toBe(2);
    expect(data.data.remaining_frames).toBe(1);
  });

  it('clears all frames when no args provided', async () => {
    const result = await handleRemoveScene(
      { session_id: sessionId },
      { store, sse },
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.success).toBe(true);
    expect(data.data.removed_count).toBe(3);
    expect(data.data.remaining_frames).toBe(0);
    expect(data.data.total_duration_ms).toBe(0);
  });

  it('returns NOT_FOUND for unknown session', async () => {
    const result = await handleRemoveScene(
      { session_id: 'nonexistent' },
      { store, sse },
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('returns error when session has no frames', async () => {
    // Create a fresh session with no scenes
    const createResult = await handleCreateSession(
      { title: 'Empty' },
      { store, baseUrl: 'http://localhost:3001' },
    );
    const createData = JSON.parse(createResult.content[0].text);
    const emptyId = createData.data.session_id;

    const result = await handleRemoveScene(
      { session_id: emptyId },
      { store, sse },
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('NO_FRAMES');
  });

  it('ignores out-of-range frame indices', async () => {
    const result = await handleRemoveScene(
      { session_id: sessionId, frame_indices: [0, 99] },
      { store, sse },
    );
    const data = JSON.parse(result.content[0].text);
    expect(data.success).toBe(true);
    expect(data.data.removed_count).toBe(1); // only index 0 was valid
    expect(data.data.remaining_frames).toBe(2);
  });

  it('emits SSE script_update after removal', async () => {
    let emitted: any = null;
    const origEmit = sse.emit.bind(sse);
    sse.emit = (id: string, data: any) => { emitted = data; origEmit(id, data); };

    await handleRemoveScene(
      { session_id: sessionId, last_n: 1 },
      { store, sse },
    );

    expect(emitted).not.toBeNull();
    expect(emitted.type).toBe('script_update');
    expect(emitted.script.frames).toHaveLength(2);
  });
});
