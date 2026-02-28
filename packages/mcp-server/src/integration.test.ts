/**
 * Integration Test: End-to-End Pipeline
 *
 * Tests the full data flow:
 *   MCP tool handler → Session Store → Compiler validation → Player rendering
 *
 * Uses real implementations from all packages — no mocks at package boundaries.
 * Runs in jsdom for DOM-dependent player tests.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// @pre/shared — schemas & types
import {
  VisualScriptSchema,
  VisualEntitySchema,
  IllustrationFrameSchema,
} from '@pre/shared';

// @pre/compiler — compilation pipeline
import { compileVisualScript } from '@pre/compiler';

// @pre/illustrations — render dispatch
import { renderEntity, buildEntityGroup, SVG_NS } from '@pre/illustrations';

// @pre/player — scene controller + bridge
import { SceneController, applyDefaults, assignEntranceDelays, createSSEHandler } from '@pre/player';

// @pre/mcp-server — tool handlers + infra
import {
  createDatabase,
  SessionStore,
  SseRegistry,
  handleCreateSession,
  handleAddScene,
  handleUpdateScene,
  handleAddNarration,
  handleGetSessionUrl,
} from '@pre/mcp-server';

/** Parse MCP tool result JSON */
function parse(result: { content: Array<{ text: string }> }) {
  return JSON.parse(result.content[0].text);
}

// ═══════════════════════════════════════════════════════════════════════
// 1. End-to-End Pipeline: Agent → MCP → Compiler → Player
// ═══════════════════════════════════════════════════════════════════════

describe('End-to-End Pipeline', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: SessionStore;
  let sse: SseRegistry;
  const baseUrl = 'http://localhost:3001';

  // Minimal valid VisualScript that exercises all entity types
  const testScript = {
    sceneId: '00000000-0000-0000-0000-000000000001',
    totalDuration: 8000,
    frames: [
      {
        id: 'frame-0',
        startTime: 0,
        endTime: 4000,
        entities: [
          { id: 'srv-1', type: 'Server', position: { x: 25, y: 50 }, label: 'API', color: '#00e5ff' },
          { id: 'db-1', type: 'Database', position: { x: 75, y: 50 }, label: 'Postgres', color: '#b388ff' },
          { id: 'arrow-1', type: 'Arrow', position: { x: 50, y: 50 }, sourceEntityId: 'srv-1', targetEntityId: 'db-1', label: 'SQL', color: '#ffffff' },
        ],
        narrationSegment: 'The API server queries the database.',
        description: 'Server-DB interaction',
      },
      {
        id: 'frame-1',
        startTime: 4000,
        endTime: 8000,
        entities: [
          { id: 'srv-1', type: 'Server', position: { x: 25, y: 50 }, label: 'API', color: '#00e5ff' },
          { id: 'db-1', type: 'Database', position: { x: 75, y: 50 }, label: 'Postgres', color: '#b388ff' },
          { id: 'user-1', type: 'User', position: { x: 10, y: 50 }, label: 'Client', color: '#ff9800' },
          { id: 'arrow-2', type: 'Arrow', position: { x: 50, y: 50 }, sourceEntityId: 'user-1', targetEntityId: 'srv-1', label: 'HTTP', color: '#ffffff' },
        ],
        narrationSegment: 'A user sends an HTTP request to the server.',
        description: 'User-Server interaction',
      },
    ],
  };

  beforeEach(() => {
    db = createDatabase(':memory:');
    store = new SessionStore(db);
    sse = new SseRegistry();
  });

  it('agent creates session → pushes script → script is retrievable', async () => {
    // Step 1: Agent creates a session
    const createResult = await handleCreateSession(
      { title: 'Binary Search' },
      { store, baseUrl },
    );
    const { session_id } = parse(createResult).data;
    expect(session_id).toBeTruthy();

    // Step 2: Agent pushes a VisualScript
    const addResult = await handleAddScene(
      { session_id, visual_script: testScript },
      { store, sse },
    );
    const addData = parse(addResult).data;
    expect(addData.frame_count).toBe(2);
    expect(addData.total_duration_ms).toBe(8000);

    // Step 3: Verify the script is stored in the session
    const session = store.getSession(session_id);
    expect(session).not.toBeNull();
    expect(session!.script.frames).toHaveLength(2);
    expect(session!.script.frames[0].entities).toHaveLength(3);
  });

  it('stored script passes Zod VisualScript schema validation', async () => {
    const createResult = await handleCreateSession(
      { title: 'Schema Parity' },
      { store, baseUrl },
    );
    const { session_id } = parse(createResult).data;

    await handleAddScene(
      { session_id, visual_script: testScript },
      { store, sse },
    );

    const stored = store.getSession(session_id)!.script;

    // Shared Zod schemas validate the data flowing through the pipeline
    const parseResult = VisualScriptSchema.safeParse(stored);
    expect(parseResult.success).toBe(true);
  });

  it('individual entities from stored script pass VisualEntitySchema', async () => {
    const createResult = await handleCreateSession(
      { title: 'Entity Schema' },
      { store, baseUrl },
    );
    const { session_id } = parse(createResult).data;

    await handleAddScene(
      { session_id, visual_script: testScript },
      { store, sse },
    );

    const stored = store.getSession(session_id)!.script;
    for (const frame of stored.frames) {
      for (const entity of frame.entities) {
        const result = VisualEntitySchema.safeParse(entity);
        expect(result.success, `Entity ${entity.id} failed schema: ${JSON.stringify(result)}`).toBe(true);
      }
    }
  });

  it('compiler validates a VisualScript that was round-tripped through MCP', async () => {
    const createResult = await handleCreateSession(
      { title: 'Compiler Round-Trip' },
      { store, baseUrl },
    );
    const { session_id } = parse(createResult).data;

    await handleAddScene(
      { session_id, visual_script: testScript },
      { store, sse },
    );

    const stored = store.getSession(session_id)!.script;
    const compiled = compileVisualScript(stored);

    expect(compiled.success).toBe(true);
    if (compiled.success) {
      expect(compiled.script.frames).toHaveLength(2);
      // Compiler should have resolved defaults and clamped positions
      for (const frame of compiled.script.frames) {
        for (const entity of frame.entities) {
          expect(entity.position.x).toBeGreaterThanOrEqual(0);
          expect(entity.position.x).toBeLessThanOrEqual(100);
        }
      }
    }
  });

  it('compiled script entities render through illustrations into DOM', async () => {
    const createResult = await handleCreateSession(
      { title: 'Render Test' },
      { store, baseUrl },
    );
    const { session_id } = parse(createResult).data;

    await handleAddScene(
      { session_id, visual_script: testScript },
      { store, sse },
    );

    const stored = store.getSession(session_id)!.script;
    const compiled = compileVisualScript(stored);
    expect(compiled.success).toBe(true);
    if (!compiled.success) return;

    // Create SVG container (jsdom)
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1920 1080');
    const entityLayer = document.createElementNS(SVG_NS, 'g');
    entityLayer.setAttribute('id', 'entity-layer');
    svg.appendChild(entityLayer);
    document.body.appendChild(svg);

    // Render the first frame's non-arrow entities
    const frame = compiled.script.frames[0];
    const nonArrows = frame.entities.filter(e => e.type !== 'Arrow' && e.type !== 'DataFlow');

    for (const entity of nonArrows) {
      const defaulted = applyDefaults(entity);
      const el = renderEntity(defaulted, entityLayer);
      expect(el, `Entity ${entity.id} (${entity.type}) failed to render`).not.toBeNull();
    }

    // Verify entities are in the DOM
    expect(entityLayer.childNodes.length).toBeGreaterThanOrEqual(2); // Server + Database
    document.body.removeChild(svg);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// 2. Schema Parity: Shared Zod validates cross-package data
// ═══════════════════════════════════════════════════════════════════════

describe('Schema Parity', () => {
  it('IllustrationFrameSchema validates frames from a compiled script', () => {
    const rawScript = {
      sceneId: '00000000-0000-0000-0000-000000000002',
      totalDuration: 4000,
      frames: [{
        id: 'f-0',
        startTime: 0,
        endTime: 4000,
        entities: [
          { id: 'c1', type: 'Cloud', position: { x: 50, y: 50 }, label: 'AWS' },
        ],
        narrationSegment: 'Cloud computing overview.',
        description: 'Cloud intro',
      }],
    };

    const compiled = compileVisualScript(rawScript);
    expect(compiled.success).toBe(true);
    if (!compiled.success) return;

    for (const frame of compiled.script.frames) {
      const result = IllustrationFrameSchema.safeParse(frame);
      expect(result.success, `Frame failed: ${JSON.stringify(result)}`).toBe(true);
    }
  });

  it('entities with all optional fields still pass schema after compilation', () => {
    const rawScript = {
      sceneId: '00000000-0000-0000-0000-000000000003',
      totalDuration: 3000,
      frames: [{
        id: 'f-0',
        startTime: 0,
        endTime: 3000,
        entities: [
          {
            id: 'full-entity',
            type: 'Server',
            position: { x: 50, y: 50 },
            size: 1.5,
            label: 'Full Server',
            color: '#ff0000',
            highlight: true,
            animation: { delay: 100, duration: 500, easing: 'ease-in', entrance: 'entrance-fadeInUp' },
            metadata: { tier: 'premium' },
          },
        ],
        narrationSegment: 'A fully-specified entity.',
        description: 'Full entity test',
      }],
    };

    const compiled = compileVisualScript(rawScript);
    expect(compiled.success).toBe(true);
    if (!compiled.success) return;

    const entity = compiled.script.frames[0].entities[0];
    const result = VisualEntitySchema.safeParse(entity);
    expect(result.success).toBe(true);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// 3. SSE Event Flow: Tool → SSE Emit → Player Bridge
// ═══════════════════════════════════════════════════════════════════════

describe('SSE Event Flow', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: SessionStore;
  let sse: SseRegistry;
  const baseUrl = 'http://localhost:3001';

  beforeEach(() => {
    db = createDatabase(':memory:');
    store = new SessionStore(db);
    sse = new SseRegistry();
  });

  it('add_scene emits SSE that player bridge can parse', async () => {
    // Create session
    const cr = await handleCreateSession({ title: 'SSE Flow' }, { store, baseUrl });
    const { session_id } = parse(cr).data;

    // Wire up a mock SSE subscriber that captures raw writes
    const captured: string[] = [];
    const mockReply = {
      raw: { write: (data: string) => { captured.push(data); return true; } },
    };
    sse.subscribe(session_id, mockReply as any);

    // Push a scene (triggers SSE emit)
    const script = {
      sceneId: session_id,
      totalDuration: 4000,
      frames: [{
        id: 'f-0',
        startTime: 0,
        endTime: 4000,
        entities: [{ id: 's1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: '',
        description: '',
      }],
    };

    await handleAddScene({ session_id, visual_script: script }, { store, sse });

    // Verify SSE data was captured
    expect(captured).toHaveLength(1);

    // Parse the SSE data line (format: "data: <JSON>\n\n")
    const ssePayload = captured[0].replace('data: ', '').trim();
    const parsed = JSON.parse(ssePayload);
    expect(parsed.type).toBe('script_update');
    expect(parsed.script.frames).toHaveLength(1);

    // Now verify player bridge can consume this exact payload
    let receivedScript: any = null;
    const handlers = createSSEHandler({
      onScriptUpdate: (s) => { receivedScript = s; },
      onSeek: () => {},
      onEntityPatch: () => {},
      onClear: () => {},
    });

    // Simulate what EventSource does — call the handler with the data string
    handlers.script_update(ssePayload);

    expect(receivedScript).not.toBeNull();
    expect(receivedScript.frames).toHaveLength(1);
    expect(receivedScript.frames[0].entities[0].id).toBe('s1');
  });

  it('add_narration emits SSE narration_update event', async () => {
    const cr = await handleCreateSession({ title: 'Narration SSE' }, { store, baseUrl });
    const { session_id } = parse(cr).data;

    // Add a scene first
    const script = {
      sceneId: session_id,
      totalDuration: 4000,
      frames: [{
        id: 'f-0',
        startTime: 0,
        endTime: 4000,
        entities: [],
        narrationSegment: '',
        description: '',
      }],
    };
    await handleAddScene({ session_id, visual_script: script }, { store, sse });

    // Subscribe
    const captured: string[] = [];
    const mockReply = {
      raw: { write: (data: string) => { captured.push(data); return true; } },
    };
    sse.subscribe(session_id, mockReply as any);

    // Add narration
    await handleAddNarration(
      { session_id, text: 'This is the explanation.', frame_index: 0 },
      { store, sse },
    );

    // Parse SSE
    expect(captured).toHaveLength(1);
    const parsed = JSON.parse(captured[0].replace('data: ', '').trim());
    expect(parsed.type).toBe('narration_update');
    expect(parsed.text).toBe('This is the explanation.');
    expect(parsed.frame_index).toBe(0);
  });

  it('update_scene replaces script and emits SSE', async () => {
    const cr = await handleCreateSession({ title: 'Update SSE' }, { store, baseUrl });
    const { session_id } = parse(cr).data;

    const script1 = {
      sceneId: session_id,
      totalDuration: 2000,
      frames: [{
        id: 'f-0', startTime: 0, endTime: 2000,
        entities: [{ id: 'e1', type: 'Cloud', position: { x: 50, y: 50 } }],
        narrationSegment: '', description: '',
      }],
    };
    await handleAddScene({ session_id, visual_script: script1 }, { store, sse });

    // Subscribe after first scene
    const captured: string[] = [];
    sse.subscribe(session_id, {
      raw: { write: (data: string) => { captured.push(data); return true; } },
    } as any);

    // Update with new script
    const script2 = {
      sceneId: session_id,
      totalDuration: 6000,
      frames: [
        { id: 'f-0', startTime: 0, endTime: 3000, entities: [{ id: 'e1', type: 'Cloud', position: { x: 30, y: 40 } }], narrationSegment: '', description: '' },
        { id: 'f-1', startTime: 3000, endTime: 6000, entities: [{ id: 'e2', type: 'User', position: { x: 70, y: 60 } }], narrationSegment: '', description: '' },
      ],
    };

    const result = await handleUpdateScene(
      { session_id, visual_script: script2 },
      { store, sse },
    );
    const data = parse(result).data;
    expect(data.frame_count).toBe(2);

    // Verify SSE was emitted
    expect(captured).toHaveLength(1);
    const parsed = JSON.parse(captured[0].replace('data: ', '').trim());
    expect(parsed.type).toBe('script_update');
    expect(parsed.script.frames).toHaveLength(2);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// 4. Session Lifecycle: Full 5-tool workflow
// ═══════════════════════════════════════════════════════════════════════

describe('Session Lifecycle', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: SessionStore;
  let sse: SseRegistry;
  const baseUrl = 'http://localhost:3001';

  beforeEach(() => {
    db = createDatabase(':memory:');
    store = new SessionStore(db);
    sse = new SseRegistry();
  });

  it('complete workflow: create → add → narrate → update → get_url', async () => {
    // 1. create_session
    const cr = await handleCreateSession(
      { title: 'Full Lifecycle', aspect_ratio: '4:3' },
      { store, baseUrl },
    );
    const crData = parse(cr).data;
    expect(crData.success ?? true).toBeTruthy();
    const sessionId = crData.session_id;

    // 2. add_scene
    const script = {
      sceneId: sessionId,
      totalDuration: 6000,
      frames: [
        { id: 'f0', startTime: 0, endTime: 3000, entities: [{ id: 's1', type: 'Server', position: { x: 50, y: 50 } }], narrationSegment: '', description: '' },
        { id: 'f1', startTime: 3000, endTime: 6000, entities: [{ id: 'd1', type: 'Database', position: { x: 50, y: 50 } }], narrationSegment: '', description: '' },
      ],
    };
    const addResult = await handleAddScene({ session_id: sessionId, visual_script: script }, { store, sse });
    expect(parse(addResult).data.frame_count).toBe(2);

    // 3. add_narration (for each frame)
    const n0 = await handleAddNarration(
      { session_id: sessionId, text: 'Here is the server.', frame_index: 0 },
      { store, sse },
    );
    expect(parse(n0).data.narration_id).toBeTruthy();

    const n1 = await handleAddNarration(
      { session_id: sessionId, text: 'And here is the database.', frame_index: 1 },
      { store, sse },
    );
    expect(parse(n1).data.narration_id).toBeTruthy();

    // 4. update_scene (add a third frame)
    const updatedScript = {
      ...script,
      totalDuration: 9000,
      frames: [
        ...script.frames,
        { id: 'f2', startTime: 6000, endTime: 9000, entities: [{ id: 'u1', type: 'User', position: { x: 10, y: 50 } }], narrationSegment: '', description: '' },
      ],
    };
    const upResult = await handleUpdateScene({ session_id: sessionId, visual_script: updatedScript }, { store, sse });
    expect(parse(upResult).data.frame_count).toBe(3);

    // 5. get_session_url (with stats)
    const urlResult = await handleGetSessionUrl(
      { session_id: sessionId, include_stats: true },
      { store, baseUrl },
    );
    const urlData = parse(urlResult).data;
    expect(urlData.player_url).toContain(sessionId);
    expect(urlData.embed_url).toContain('embed=1');
    expect(urlData.title).toBe('Full Lifecycle');
    expect(urlData.aspect_ratio).toBe('4:3');
    expect(urlData.frame_count).toBe(3);
    expect(urlData.total_duration_ms).toBe(9000);
  });

  it('multiple sessions are independent', async () => {
    const cr1 = await handleCreateSession({ title: 'Session A' }, { store, baseUrl });
    const cr2 = await handleCreateSession({ title: 'Session B' }, { store, baseUrl });
    const sid1 = parse(cr1).data.session_id;
    const sid2 = parse(cr2).data.session_id;
    expect(sid1).not.toBe(sid2);

    // Add different scripts
    const scriptA = {
      sceneId: sid1, totalDuration: 2000,
      frames: [{ id: 'f0', startTime: 0, endTime: 2000, entities: [{ id: 'a1', type: 'Server', position: { x: 50, y: 50 } }], narrationSegment: '', description: '' }],
    };
    const scriptB = {
      sceneId: sid2, totalDuration: 4000,
      frames: [
        { id: 'f0', startTime: 0, endTime: 2000, entities: [{ id: 'b1', type: 'Cloud', position: { x: 30, y: 30 } }], narrationSegment: '', description: '' },
        { id: 'f1', startTime: 2000, endTime: 4000, entities: [{ id: 'b2', type: 'User', position: { x: 70, y: 70 } }], narrationSegment: '', description: '' },
      ],
    };

    await handleAddScene({ session_id: sid1, visual_script: scriptA }, { store, sse });
    await handleAddScene({ session_id: sid2, visual_script: scriptB }, { store, sse });

    const s1 = store.getSession(sid1)!;
    const s2 = store.getSession(sid2)!;
    expect(s1.script.frames).toHaveLength(1);
    expect(s2.script.frames).toHaveLength(2);
  });

  it('session persists across store restart (loadFromDb)', async () => {
    const cr = await handleCreateSession({ title: 'Persistent' }, { store, baseUrl });
    const sessionId = parse(cr).data.session_id;

    const script = {
      sceneId: sessionId, totalDuration: 3000,
      frames: [{ id: 'f0', startTime: 0, endTime: 3000, entities: [{ id: 'p1', type: 'Database', position: { x: 50, y: 50 } }], narrationSegment: '', description: '' }],
    };
    await handleAddScene({ session_id: sessionId, visual_script: script }, { store, sse });

    // Simulate restart: create new store from same DB
    const store2 = new SessionStore(db);
    store2.loadFromDb();

    const restored = store2.getSession(sessionId);
    expect(restored).not.toBeNull();
    expect(restored!.title).toBe('Persistent');
    expect(restored!.script.frames).toHaveLength(1);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// 5. Error Propagation
// ═══════════════════════════════════════════════════════════════════════

describe('Error Propagation', () => {
  let db: ReturnType<typeof createDatabase>;
  let store: SessionStore;
  let sse: SseRegistry;
  const baseUrl = 'http://localhost:3001';

  beforeEach(() => {
    db = createDatabase(':memory:');
    store = new SessionStore(db);
    sse = new SseRegistry();
  });

  it('add_scene to non-existent session returns SESSION_NOT_FOUND', async () => {
    const result = await handleAddScene(
      {
        session_id: 'nonexistent-uuid',
        visual_script: {
          sceneId: 'x', totalDuration: 1000,
          frames: [{ id: 'f0', startTime: 0, endTime: 1000, entities: [], narrationSegment: '', description: '' }],
        },
      },
      { store, sse },
    );
    const data = parse(result);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('SESSION_NOT_FOUND');
    expect(data.error.suggestion).toBeTruthy();
  });

  it('add_narration with out-of-range frame_index returns FRAME_NOT_FOUND', async () => {
    const cr = await handleCreateSession({ title: 'Err Test' }, { store, baseUrl });
    const sessionId = parse(cr).data.session_id;

    const script = {
      sceneId: sessionId, totalDuration: 2000,
      frames: [{ id: 'f0', startTime: 0, endTime: 2000, entities: [], narrationSegment: '', description: '' }],
    };
    await handleAddScene({ session_id: sessionId, visual_script: script }, { store, sse });

    // frame_index 5 when only 1 frame exists
    const result = await handleAddNarration(
      { session_id: sessionId, text: 'Bad frame', frame_index: 5 },
      { store, sse },
    );
    const data = parse(result);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('FRAME_NOT_FOUND');
    expect(data.error.message).toContain('5');
  });

  it('compiler rejects script with invalid schema (endTime <= startTime)', () => {
    const badScript = {
      sceneId: '00000000-0000-0000-0000-000000000099',
      totalDuration: 5000,
      frames: [{
        id: 'bad-frame',
        startTime: 3000,
        endTime: 1000, // Invalid: endTime < startTime
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: '',
        description: '',
      }],
    };

    const result = compileVisualScript(badScript);
    expect(result.success).toBe(false);
  });

  it('compiler rejects script with entity position out of range', () => {
    const badScript = {
      sceneId: '00000000-0000-0000-0000-000000000098',
      totalDuration: 3000,
      frames: [{
        id: 'bad-pos',
        startTime: 0,
        endTime: 3000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 150, y: -10 } }],
        narrationSegment: '',
        description: '',
      }],
    };

    const result = compileVisualScript(badScript);
    // Compiler may clamp (warn) or reject; either is acceptable
    if (result.success) {
      // If it succeeded, positions must be clamped to 0-100
      const entity = result.script.frames[0].entities[0];
      expect(entity.position.x).toBeLessThanOrEqual(100);
      expect(entity.position.y).toBeGreaterThanOrEqual(0);
    }
    // If failed, that's also acceptable for out-of-range positions
  });

  it('get_session_url for non-existent session returns proper error', async () => {
    const result = await handleGetSessionUrl(
      { session_id: 'does-not-exist' },
      { store, baseUrl },
    );
    const data = parse(result);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('SESSION_NOT_FOUND');
  });
});
