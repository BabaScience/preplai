/**
 * @pre/mcp-server — E2E Pipeline Tests
 *
 * Full end-to-end pipeline tests that exercise the complete flow:
 *   Agent → API → SessionStore → SQLite → SSE → Player
 *
 * These tests verify that all packages work together correctly
 * through the server layer, with real HTTP calls and SSE streaming.
 *
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer, type ServerContext } from './server.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import http from 'http';

// ── Helpers ──────────────────────────────────────────────────────────

function createE2EServer(): Promise<ServerContext> {
  const dbPath = join(tmpdir(), `pre-e2e-${randomUUID()}.db`);
  return buildServer({
    dbPath,
    logLevel: 'silent',
    baseUrl: 'http://localhost:0',
  });
}

/** Parse the nested MCP tool response format */
function parseMcpResponse(body: string): { success: boolean; data?: any; error?: any } {
  const outer = JSON.parse(body);
  return JSON.parse(outer.content[0].text);
}

/** Collect SSE events from a real HTTP connection */
function collectSseEvents(
  port: number,
  sessionId: string,
  opts: { maxEvents?: number; timeoutMs?: number } = {},
): Promise<Array<Record<string, any>>> {
  const { maxEvents = 5, timeoutMs = 3000 } = opts;

  return new Promise((resolve, reject) => {
    const events: Array<Record<string, any>> = [];
    const timeout = setTimeout(() => {
      req.destroy();
      resolve(events);
    }, timeoutMs);

    const req = http.get(
      `http://127.0.0.1:${port}/session/${sessionId}/events`,
      (res) => {
        let buffer = '';
        res.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          // Parse SSE data lines
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? ''; // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                events.push(event);
                if (events.length >= maxEvents) {
                  clearTimeout(timeout);
                  res.destroy();
                  resolve(events);
                }
              } catch { /* partial JSON, wait for more */ }
            }
          }
        });

        res.on('error', () => { /* destroyed by us */ });
      },
    );

    req.on('error', (err) => {
      if ((err as any).code !== 'ECONNRESET') reject(err);
    });
  });
}

// ── E2E: Full Presentation Lifecycle ─────────────────────────────────

describe('E2E: Complete presentation lifecycle', () => {
  let ctx: ServerContext;
  let port: number;

  beforeAll(async () => {
    ctx = await createE2EServer();
    const address = await ctx.app.listen({ port: 0, host: '127.0.0.1' });
    port = Number(address.match(/:(\d+)$/)?.[1]);
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should complete the full agent workflow: create → add_scene → narrate → get_url', async () => {
    // Step 1: Create session
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'How Binary Search Works' }),
    });
    const createResult = parseMcpResponse(createRes.body);
    expect(createResult.success).toBe(true);
    const sessionId = createResult.data.session_id;
    expect(sessionId).toBeTruthy();
    expect(createResult.data.player_url).toContain(`/player/${sessionId}`);

    // Step 2: Add a multi-frame scene
    const visualScript = {
      sceneId: sessionId,
      totalDuration: 12000,
      frames: [
        {
          startTime: 0,
          endTime: 6000,
          entities: [
            { id: 'arr', type: 'Concept', position: { x: 50, y: 30 }, label: 'Sorted Array', color: '#4A90D9' },
            { id: 'lo', type: 'Concept', position: { x: 20, y: 70 }, label: 'lo = 0', color: '#27AE60' },
            { id: 'hi', type: 'Concept', position: { x: 80, y: 70 }, label: 'hi = n-1', color: '#E74C3C' },
            { id: 'mid', type: 'Concept', position: { x: 50, y: 70 }, label: 'mid', color: '#F5C842', highlight: true },
            { id: 'arrow-lo', type: 'Arrow', position: { x: 35, y: 50 }, sourceEntityId: 'lo', targetEntityId: 'arr', label: 'left bound' },
            { id: 'arrow-hi', type: 'Arrow', position: { x: 65, y: 50 }, sourceEntityId: 'hi', targetEntityId: 'arr', label: 'right bound' },
          ],
          narrationSegment: { text: 'Binary search maintains two pointers, lo and hi, narrowing the search space by half each step.' },
        },
        {
          startTime: 6000,
          endTime: 12000,
          entities: [
            { id: 'arr', type: 'Concept', position: { x: 50, y: 30 }, label: 'Sorted Array' },
            { id: 'lo2', type: 'Concept', position: { x: 35, y: 70 }, label: 'lo = mid+1', color: '#27AE60' },
            { id: 'hi2', type: 'Concept', position: { x: 65, y: 70 }, label: 'hi = n-1', color: '#E74C3C' },
            { id: 'mid2', type: 'Concept', position: { x: 50, y: 70 }, label: 'new mid', color: '#F5C842', highlight: true },
          ],
          narrationSegment: { text: 'If target > arr[mid], we move lo to mid+1, discarding the left half.' },
        },
      ],
    };

    const addRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, visual_script: visualScript }),
    });
    const addResult = parseMcpResponse(addRes.body);
    expect(addResult.success).toBe(true);
    expect(addResult.data.frame_count).toBe(2);
    expect(addResult.data.total_duration_ms).toBe(12000);

    // Step 3: Add narration
    const narRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/add-narration',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        text: 'Binary search is O(log n) — each comparison halves the search space.',
        frame_index: 0,
      }),
    });
    const narResult = parseMcpResponse(narRes.body);
    expect(narResult.success).toBe(true);
    expect(narResult.data.narration_id).toBeTruthy();

    // Step 4: Get session URL
    const urlRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/get-session-url',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, include_stats: true }),
    });
    const urlResult = parseMcpResponse(urlRes.body);
    expect(urlResult.success).toBe(true);
    expect(urlResult.data.player_url).toContain(sessionId);
    expect(urlResult.data.frame_count).toBe(2);
    expect(urlResult.data.total_duration_ms).toBe(12000);
    expect(urlResult.data.title).toBe('How Binary Search Works');
  });
});

// ── E2E: SSE Real-Time Delivery ──────────────────────────────────────

describe('E2E: SSE real-time delivery pipeline', () => {
  let ctx: ServerContext;
  let port: number;

  beforeAll(async () => {
    ctx = await createE2EServer();
    const address = await ctx.app.listen({ port: 0, host: '127.0.0.1' });
    port = Number(address.match(/:(\d+)$/)?.[1]);
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should deliver script_update event via SSE when scene is added', async () => {
    // Create session
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'SSE Delivery Test' }),
    });
    const sid = parseMcpResponse(createRes.body).data.session_id;

    // Start collecting SSE events
    const eventsPromise = collectSseEvents(port, sid, { maxEvents: 2, timeoutMs: 3000 });

    // Wait a bit for SSE connection to establish, then add scene
    await new Promise(r => setTimeout(r, 100));

    await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        visual_script: {
          sceneId: sid,
          totalDuration: 3000,
          frames: [{
            startTime: 0,
            endTime: 3000,
            entities: [
              { id: 'server-1', type: 'Server', position: { x: 30, y: 50 }, label: 'API' },
              { id: 'db-1', type: 'Database', position: { x: 70, y: 50 }, label: 'DB' },
            ],
          }],
        },
      }),
    });

    const events = await eventsPromise;

    // Should have connected event + script_update
    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events[0].type).toBe('connected');
    expect(events[0].sessionId).toBe(sid);
    expect(events[1].type).toBe('script_update');
    expect(events[1].script.frames[0].entities).toHaveLength(2);
  });

  it('should deliver narration_update event via SSE', async () => {
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Narration SSE Test' }),
    });
    const sid = parseMcpResponse(createRes.body).data.session_id;

    // Add a scene first (needed for narration frame validation)
    await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        visual_script: {
          sceneId: sid,
          totalDuration: 3000,
          frames: [{ startTime: 0, endTime: 3000, entities: [] }],
        },
      }),
    });

    // Start collecting SSE events
    const eventsPromise = collectSseEvents(port, sid, { maxEvents: 3, timeoutMs: 3000 });
    await new Promise(r => setTimeout(r, 100));

    // Add narration
    await ctx.app.inject({
      method: 'POST',
      url: '/api/add-narration',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        text: 'This is the narrator speaking.',
        frame_index: 0,
      }),
    });

    const events = await eventsPromise;

    // Should have: connected, script_update (from add_scene, if SSE was connected then), narration_update
    const narrationEvent = events.find(e => e.type === 'narration_update');
    expect(narrationEvent).toBeDefined();
    expect(narrationEvent!.text).toBe('This is the narrator speaking.');
    expect(narrationEvent!.frame_index).toBe(0);
  });

  it('should deliver update_scene event via SSE', async () => {
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Update SSE Test' }),
    });
    const sid = parseMcpResponse(createRes.body).data.session_id;

    // Add initial scene
    await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        visual_script: {
          sceneId: sid,
          totalDuration: 3000,
          frames: [{ startTime: 0, endTime: 3000, entities: [{ id: 'a', type: 'Server', position: { x: 50, y: 50 } }] }],
        },
      }),
    });

    // Connect SSE
    const eventsPromise = collectSseEvents(port, sid, { maxEvents: 2, timeoutMs: 3000 });
    await new Promise(r => setTimeout(r, 100));

    // Update scene
    await ctx.app.inject({
      method: 'POST',
      url: '/api/update-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        visual_script: {
          sceneId: sid,
          totalDuration: 6000,
          frames: [
            { startTime: 0, endTime: 3000, entities: [{ id: 'a', type: 'Server', position: { x: 30, y: 50 } }] },
            { startTime: 3000, endTime: 6000, entities: [{ id: 'b', type: 'Database', position: { x: 70, y: 50 } }] },
          ],
        },
      }),
    });

    const events = await eventsPromise;

    const scriptUpdate = events.find(e => e.type === 'script_update');
    expect(scriptUpdate).toBeDefined();
    expect(scriptUpdate!.script.frames).toHaveLength(2);
    expect(scriptUpdate!.script.totalDuration).toBe(6000);
  });
});

// ── E2E: Player HTML serves correctly for real sessions ──────────────

describe('E2E: Player HTML integration', () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = await createE2EServer();
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should serve player HTML with correct session ID from a real session', async () => {
    // Create a real session
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Player HTML Test' }),
    });
    const sessionId = parseMcpResponse(createRes.body).data.session_id;

    // Load the player page
    const playerRes = await ctx.app.inject({
      method: 'GET',
      url: `/player/${sessionId}`,
    });

    expect(playerRes.statusCode).toBe(200);
    expect(playerRes.headers['content-type']).toContain('text/html');
    expect(playerRes.body).toContain(`data-session-id="${sessionId}"`);
    expect(playerRes.body).toContain('viewBox="0 0 1920 1080"');
    expect(playerRes.body).toContain('/player.js');
    expect(playerRes.body).toContain('/player.css');
  });
});

// ── E2E: Error propagation ───────────────────────────────────────────

describe('E2E: Error propagation', () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = await createE2EServer();
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should return SESSION_NOT_FOUND for invalid session on add_scene', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 'non-existent-uuid',
        visual_script: { sceneId: 'x', totalDuration: 1000, frames: [{ startTime: 0, endTime: 1000, entities: [] }] },
      }),
    });

    const result = parseMcpResponse(res.body);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('SESSION_NOT_FOUND');
    expect(result.error.suggestion).toContain('create_session');
  });

  it('should return SESSION_NOT_FOUND for invalid session on update_scene', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/update-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 'fake-id',
        visual_script: { sceneId: 'x', totalDuration: 1000, frames: [{ startTime: 0, endTime: 1000, entities: [] }] },
      }),
    });

    const result = parseMcpResponse(res.body);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('should return SESSION_NOT_FOUND for invalid session on add_narration', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/add-narration',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 'bad-id',
        text: 'Hello',
        frame_index: 0,
      }),
    });

    const result = parseMcpResponse(res.body);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('SESSION_NOT_FOUND');
  });

  it('should return FRAME_NOT_FOUND for out-of-range frame_index', async () => {
    // Create session and add scene
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Frame Error Test' }),
    });
    const sid = parseMcpResponse(createRes.body).data.session_id;

    await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        visual_script: {
          sceneId: sid,
          totalDuration: 3000,
          frames: [{ startTime: 0, endTime: 3000, entities: [] }],
        },
      }),
    });

    // Try to add narration to frame index 5 (only frame 0 exists)
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/add-narration',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        text: 'Should fail',
        frame_index: 5,
      }),
    });

    const result = parseMcpResponse(res.body);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('FRAME_NOT_FOUND');
  });

  it('should return SESSION_NOT_FOUND for get_session_url with invalid session', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/get-session-url',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: 'missing' }),
    });

    const result = parseMcpResponse(res.body);
    expect(result.success).toBe(false);
    expect(result.error.code).toBe('SESSION_NOT_FOUND');
  });
});

// ── E2E: Session persistence across server rebuild ───────────────────

describe('E2E: Session persistence', () => {
  it('should persist sessions in SQLite and reload on restart', async () => {
    const dbPath = join(tmpdir(), `pre-persist-${randomUUID()}.db`);

    // Server 1: Create session and add scene
    const ctx1 = await buildServer({ dbPath, logLevel: 'silent' });
    const createRes = await ctx1.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Persistent Session' }),
    });
    const sid = parseMcpResponse(createRes.body).data.session_id;

    await ctx1.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        visual_script: {
          sceneId: sid,
          totalDuration: 5000,
          frames: [
            { startTime: 0, endTime: 5000, entities: [{ id: 's1', type: 'Server', position: { x: 50, y: 50 } }] },
          ],
        },
      }),
    });

    await ctx1.app.close();
    ctx1.db.close();

    // Server 2: Rebuild from same DB — sessions should be loaded
    const ctx2 = await buildServer({ dbPath, logLevel: 'silent' });

    const urlRes = await ctx2.app.inject({
      method: 'POST',
      url: '/api/get-session-url',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sid, include_stats: true }),
    });

    const result = parseMcpResponse(urlRes.body);
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Persistent Session');
    expect(result.data.frame_count).toBe(1);
    expect(result.data.total_duration_ms).toBe(5000);

    await ctx2.app.close();
    ctx2.db.close();
  });
});

// ── E2E: Multi-session isolation ─────────────────────────────────────

describe('E2E: Multi-session isolation', () => {
  let ctx: ServerContext;
  let port: number;

  beforeAll(async () => {
    ctx = await createE2EServer();
    const address = await ctx.app.listen({ port: 0, host: '127.0.0.1' });
    port = Number(address.match(/:(\d+)$/)?.[1]);
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should isolate SSE events between different sessions', async () => {
    // Create two sessions
    const res1 = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Session A' }),
    });
    const sidA = parseMcpResponse(res1.body).data.session_id;

    const res2 = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Session B' }),
    });
    const sidB = parseMcpResponse(res2.body).data.session_id;

    // Connect SSE to session A
    const eventsA = collectSseEvents(port, sidA, { maxEvents: 2, timeoutMs: 2000 });
    await new Promise(r => setTimeout(r, 100));

    // Add scene to session B (should NOT appear in session A's SSE)
    await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sidB,
        visual_script: {
          sceneId: sidB,
          totalDuration: 1000,
          frames: [{ startTime: 0, endTime: 1000, entities: [{ id: 'b1', type: 'Server', position: { x: 50, y: 50 } }] }],
        },
      }),
    });

    // Add scene to session A (SHOULD appear)
    await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sidA,
        visual_script: {
          sceneId: sidA,
          totalDuration: 2000,
          frames: [{ startTime: 0, endTime: 2000, entities: [{ id: 'a1', type: 'Database', position: { x: 50, y: 50 } }] }],
        },
      }),
    });

    const events = await eventsA;

    // Should have connected + script_update for session A only
    expect(events[0].type).toBe('connected');
    expect(events[0].sessionId).toBe(sidA);

    const scriptEvent = events.find(e => e.type === 'script_update');
    expect(scriptEvent).toBeDefined();
    // The script should be session A's, not session B's
    expect(scriptEvent!.script.sceneId).toBe(sidA);
    expect(scriptEvent!.script.totalDuration).toBe(2000);
  });
});

// ── E2E: Complex multi-entity scene rendering ────────────────────────

describe('E2E: Complex scene with multiple entity types', () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = await createE2EServer();
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should handle a scene with 6 entity types including arrows', async () => {
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Microservice Architecture' }),
    });
    const sid = parseMcpResponse(createRes.body).data.session_id;

    const complexScript = {
      sceneId: sid,
      totalDuration: 15000,
      frames: [
        {
          startTime: 0,
          endTime: 5000,
          entities: [
            { id: 'lb', type: 'Server', position: { x: 15, y: 50 }, label: 'Load Balancer', color: '#00D4FF' },
            { id: 'api-1', type: 'Server', position: { x: 40, y: 30 }, label: 'API Gateway', color: '#4A90D9' },
            { id: 'api-2', type: 'Server', position: { x: 40, y: 70 }, label: 'Auth Service', color: '#8B5CF6' },
            { id: 'db-main', type: 'Database', position: { x: 70, y: 30 }, label: 'PostgreSQL', color: '#27AE60' },
            { id: 'cache', type: 'Server', position: { x: 70, y: 70 }, label: 'Redis Cache', color: '#E67E22' },
            { id: 'queue', type: 'Concept', position: { x: 90, y: 50 }, label: 'Message Queue', color: '#E74C3C' },
            // Arrows
            { id: 'a1', type: 'Arrow', position: { x: 27, y: 40 }, sourceEntityId: 'lb', targetEntityId: 'api-1', label: 'HTTP' },
            { id: 'a2', type: 'Arrow', position: { x: 27, y: 60 }, sourceEntityId: 'lb', targetEntityId: 'api-2', label: 'HTTP' },
            { id: 'a3', type: 'Arrow', position: { x: 55, y: 30 }, sourceEntityId: 'api-1', targetEntityId: 'db-main', label: 'SQL' },
            { id: 'a4', type: 'Arrow', position: { x: 55, y: 70 }, sourceEntityId: 'api-2', targetEntityId: 'cache', label: 'GET/SET' },
            { id: 'a5', type: 'Arrow', position: { x: 80, y: 50 }, sourceEntityId: 'db-main', targetEntityId: 'queue', label: 'events' },
          ],
          narrationSegment: {
            text: 'The load balancer distributes traffic to the API gateway and auth service. Data flows to PostgreSQL and Redis, with events pushed to the message queue.',
          },
        },
        {
          startTime: 5000,
          endTime: 10000,
          entities: [
            { id: 'api-1', type: 'Server', position: { x: 30, y: 50 }, label: 'API Gateway', color: '#4A90D9', highlight: true },
            { id: 'db-main', type: 'Database', position: { x: 70, y: 50 }, label: 'PostgreSQL', color: '#27AE60' },
            { id: 'a-zoom', type: 'Arrow', position: { x: 50, y: 50 }, sourceEntityId: 'api-1', targetEntityId: 'db-main', label: 'SELECT * FROM users' },
          ],
          narrationSegment: {
            text: 'Zooming in on the API-to-database connection. The gateway issues SQL queries directly.',
          },
        },
        {
          startTime: 10000,
          endTime: 15000,
          entities: [
            { id: 'code', type: 'CodeBlock', position: { x: 50, y: 50 }, textContent: 'SELECT * FROM users\nWHERE active = true\nLIMIT 100;', label: 'Query' },
          ],
          narrationSegment: {
            text: 'Here is the actual SQL query being executed.',
          },
        },
      ],
    };

    const addRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sid, visual_script: complexScript }),
    });

    const result = parseMcpResponse(addRes.body);
    expect(result.success).toBe(true);
    expect(result.data.frame_count).toBe(3);
    expect(result.data.total_duration_ms).toBe(15000);

    // Verify session state persisted
    const urlRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/get-session-url',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sid, include_stats: true }),
    });
    const urlResult = parseMcpResponse(urlRes.body);
    expect(urlResult.data.frame_count).toBe(3);
    expect(urlResult.data.title).toBe('Microservice Architecture');
  });
});
