/**
 * @pre/mcp-server — Server Entry Point Tests
 *
 * Tests the Fastify server wiring: routes, SSE, player HTML, health check.
 * Uses Fastify's inject() for HTTP-level testing without opening a port.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildServer, type ServerContext } from './server.js';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';

// ── Test server factory ──────────────────────────────────────────────

function createTestServer(): Promise<ServerContext> {
  const dbPath = join(tmpdir(), `pre-test-${randomUUID()}.db`);
  return buildServer({
    dbPath,
    logLevel: 'silent',
    baseUrl: 'http://localhost:3001',
  });
}

// ── Health Check ─────────────────────────────────────────────────────

describe('GET /health', () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = await createTestServer();
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should return 200 with status ok', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('ok');
    expect(body.version).toBe('1.0.0');
    expect(typeof body.sessions).toBe('number');
    expect(typeof body.uptime).toBe('number');
  });
});

// ── Player HTML Route ────────────────────────────────────────────────

describe('GET /player/:sessionId', () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = await createTestServer();
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should return HTML with session ID injected', async () => {
    const sessionId = 'test-session-123';
    const res = await ctx.app.inject({
      method: 'GET',
      url: `/player/${sessionId}`,
    });

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('data-session-id="test-session-123"');
  });

  it('should contain SVG canvas with correct viewBox', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/player/any-session',
    });

    expect(res.body).toContain('viewBox="0 0 1920 1080"');
    expect(res.body).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it('should contain entity-layer and connection-layer', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/player/any-session',
    });

    expect(res.body).toContain('id="entity-layer"');
    expect(res.body).toContain('id="connection-layer"');
    expect(res.body).toContain('id="overlay-layer"');
  });

  it('should include GSAP CDN script tags', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/player/any-session',
    });

    expect(res.body).toContain('gsap/3.13.0/gsap.min.js');
  });

  it('should include narrator overlay elements', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/player/any-session',
    });

    expect(res.body).toContain('id="narrator-overlay"');
    expect(res.body).toContain('id="narrator-text"');
  });

  it('should include arrowhead marker in defs', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/player/any-session',
    });

    expect(res.body).toContain('id="arrowhead-default"');
    expect(res.body).toContain('<marker');
  });

  it('should include vignette gradient in defs', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/player/any-session',
    });

    expect(res.body).toContain('id="bg-vignette"');
    expect(res.body).toContain('id="entity-glow"');
    expect(res.body).toContain('id="soft-shadow"');
  });

  it('should include dot grid layer', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/player/any-session',
    });

    expect(res.body).toContain('id="dot-grid"');
  });

  it('should include frame navigation', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/player/any-session',
    });

    expect(res.body).toContain('id="frame-nav"');
    expect(res.body).toContain('id="frame-counter"');
  });
});

// ── Player CSS Route ─────────────────────────────────────────────────

describe('GET /player.css', () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = await createTestServer();
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should return CSS with correct content type', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.css' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('text/css');
  });

  it('should contain .animate-element class', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.css' });
    expect(res.body).toContain('.animate-element');
    expect(res.body).toContain('transform-box: fill-box');
    expect(res.body).toContain('will-change: transform, opacity');
  });

  it('should contain @keyframes fadeInUp', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.css' });
    expect(res.body).toContain('@keyframes fadeInUp');
    expect(res.body).toContain('@keyframes fadeIn');
    expect(res.body).toContain('@keyframes drawIn');
  });

  it('should contain entrance animation classes', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.css' });
    expect(res.body).toContain('.entrance-fadeInUp');
    expect(res.body).toContain('.entrance-fadeIn');
    expect(res.body).toContain('.entrance-drawIn');
  });

  it('should contain narrator overlay styles', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.css' });
    expect(res.body).toContain('#narrator-overlay');
    expect(res.body).toContain('#narrator-text');
  });

  it('should use cinematic dark theme background', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.css' });
    expect(res.body).toContain('#0a0a14');
  });

  it('should contain Inter font family', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.css' });
    expect(res.body).toContain("'Inter'");
  });

  it('should contain frame navigation styles', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.css' });
    expect(res.body).toContain('#frame-nav');
    expect(res.body).toContain('#frame-counter');
  });

  it('should contain floatIn and pulseGlow keyframes', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.css' });
    expect(res.body).toContain('@keyframes floatIn');
    expect(res.body).toContain('@keyframes pulseGlow');
  });

  it('should contain entity-highlighted class', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.css' });
    expect(res.body).toContain('.entity-highlighted');
  });
});

// ── Player JS Route ──────────────────────────────────────────────────

describe('GET /player.js', () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = await createTestServer();
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should return JS with correct content type', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toContain('javascript');
  });

  it('should contain EventSource connection setup', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('EventSource');
    expect(res.body).toContain('/session/');
  });

  it('should contain double-<g> pattern implementation', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('createElementNS');
    expect(res.body).toContain('animate-element');
    expect(res.body).toContain('entrance-');
  });

  it('should contain postMessage bridge', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('postMessage');
    expect(res.body).toContain('pre:seek');
    expect(res.body).toContain('pre:next');
    expect(res.body).toContain('pre:prev');
  });

  it('should contain two-pass rendering (non-arrows then arrows)', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('nonArrows');
    expect(res.body).toContain('arrows');
    expect(res.body).toContain('entity-layer');
    expect(res.body).toContain('connection-layer');
  });

  it('should contain narrator update function', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('updateNarrator');
    expect(res.body).toContain('narrator-text');
  });

  it('should contain type-specific renderers', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('renderServer');
    expect(res.body).toContain('renderDatabase');
    expect(res.body).toContain('renderCloud');
    expect(res.body).toContain('renderUser');
    expect(res.body).toContain('renderConcept');
    expect(res.body).toContain('renderLabel');
    expect(res.body).toContain('renderCodeBlock');
    expect(res.body).toContain('renderGeneric');
  });

  it('should contain dispatch table and entity routing', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('dispatchEntity');
    expect(res.body).toContain('SHAPE_MAP');
  });

  it('should contain gradient creation utility', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('createGradient');
    expect(res.body).toContain('linearGradient');
  });

  it('should contain label truncation logic', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('truncLabel');
    expect(res.body).toContain('LABEL_MAX_CHARS');
  });

  it('should contain bezier arrow rendering with glow', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('renderArrowEntity');
    expect(res.body).toContain('ensureMarker');
    expect(res.body).toContain('curvature');
  });

  it('should contain frame navigation functions', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('goNext');
    expect(res.body).toContain('goPrev');
    expect(res.body).toContain('updateFrameCounter');
    expect(res.body).toContain('ArrowRight');
  });

  it('should contain dot grid initialization', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('initDotGrid');
    expect(res.body).toContain('dot-grid');
  });

  it('should contain staggered entrance delays', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/player.js' });
    expect(res.body).toContain('animationDelay');
    expect(res.body).toContain('j * 80');
  });
});

// ── API Routes ───────────────────────────────────────────────────────

describe('POST /api/create-session', () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = await createTestServer();
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should create a session and return session_id + player_url', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Test Presentation' }),
    });

    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    const inner = JSON.parse(result.content[0].text);
    expect(inner.success).toBe(true);
    expect(inner.data.session_id).toBeDefined();
    expect(inner.data.player_url).toContain('/player/');
    expect(inner.data.title).toBe('Test Presentation');
  });

  it('should create session with custom aspect ratio', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Wide Presentation', aspect_ratio: '4:3' }),
    });

    const result = JSON.parse(res.body);
    const inner = JSON.parse(result.content[0].text);
    expect(inner.data.aspect_ratio).toBe('4:3');
  });
});

describe('POST /api/add-scene', () => {
  let ctx: ServerContext;
  let sessionId: string;

  beforeAll(async () => {
    ctx = await createTestServer();

    // Create a session first
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Scene Test' }),
    });
    const result = JSON.parse(res.body);
    const inner = JSON.parse(result.content[0].text);
    sessionId = inner.data.session_id;
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should add a scene and return frame count', async () => {
    const visualScript = {
      sceneId: sessionId,
      totalDuration: 6000,
      frames: [{
        id: 'frame-1',
        startTime: 0,
        endTime: 6000,
        entities: [
          { id: 'srv-1', type: 'Server', position: { x: 30, y: 50 }, label: 'API Server' },
        ],
      }],
    };

    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, visual_script: visualScript }),
    });

    expect(res.statusCode).toBe(200);
    const result = JSON.parse(res.body);
    const inner = JSON.parse(result.content[0].text);
    expect(inner.success).toBe(true);
    expect(inner.data.frame_count).toBe(1);
    expect(inner.data.total_duration_ms).toBe(6000);
  });

  it('should return error for non-existent session', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: 'non-existent-id',
        visual_script: { sceneId: 'x', totalDuration: 1000, frames: [{ id: 'f-1', startTime: 0, endTime: 1000, entities: [] }] },
      }),
    });

    const result = JSON.parse(res.body);
    const inner = JSON.parse(result.content[0].text);
    expect(inner.success).toBe(false);
    expect(inner.error.code).toBe('SESSION_NOT_FOUND');
  });
});

describe('POST /api/update-scene', () => {
  let ctx: ServerContext;
  let sessionId: string;

  beforeAll(async () => {
    ctx = await createTestServer();

    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Update Test' }),
    });
    const result = JSON.parse(res.body);
    sessionId = JSON.parse(result.content[0].text).data.session_id;
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should update a scene successfully', async () => {
    // First add a scene
    const script1 = { sceneId: sessionId, totalDuration: 3000, frames: [{ id: 'f-1', startTime: 0, endTime: 3000, entities: [] }] };
    await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, visual_script: script1 }),
    });

    // Then update
    const script2 = {
      sceneId: sessionId,
      totalDuration: 9000,
      frames: [
        { id: 'f-1', startTime: 0, endTime: 4500, entities: [{ id: 'a', type: 'Server', position: { x: 50, y: 50 } }] },
        { id: 'f-2', startTime: 4500, endTime: 9000, entities: [{ id: 'b', type: 'Database', position: { x: 70, y: 50 } }] },
      ],
    };

    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/update-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, visual_script: script2 }),
    });

    const result = JSON.parse(res.body);
    const inner = JSON.parse(result.content[0].text);
    expect(inner.success).toBe(true);
    expect(inner.data.frame_count).toBe(2);
    expect(inner.data.total_duration_ms).toBe(9000);
  });
});

describe('POST /api/add-narration', () => {
  let ctx: ServerContext;
  let sessionId: string;

  beforeAll(async () => {
    ctx = await createTestServer();

    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Narration Test' }),
    });
    sessionId = JSON.parse(JSON.parse(res.body).content[0].text).data.session_id;

    // Add a scene so frame_index validation works
    await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        visual_script: {
          sceneId: sessionId,
          totalDuration: 3000,
          frames: [{ id: 'f-1', startTime: 0, endTime: 3000, entities: [] }],
        },
      }),
    });
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should add narration text', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/add-narration',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        text: 'This is the narration for frame 0.',
        frame_index: 0,
      }),
    });

    const result = JSON.parse(res.body);
    const inner = JSON.parse(result.content[0].text);
    expect(inner.success).toBe(true);
    expect(inner.data.narration_id).toBeDefined();
    expect(inner.data.text_length).toBe(34);
  });

  it('should reject out-of-range frame_index', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/add-narration',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        text: 'Should fail.',
        frame_index: 99,
      }),
    });

    const result = JSON.parse(res.body);
    const inner = JSON.parse(result.content[0].text);
    expect(inner.success).toBe(false);
    expect(inner.error.code).toBe('FRAME_NOT_FOUND');
  });
});

describe('POST /api/get-session-url', () => {
  let ctx: ServerContext;
  let sessionId: string;

  beforeAll(async () => {
    ctx = await createTestServer();

    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'URL Test' }),
    });
    sessionId = JSON.parse(JSON.parse(res.body).content[0].text).data.session_id;
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should return player_url and embed_url', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/get-session-url',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId }),
    });

    const result = JSON.parse(res.body);
    const inner = JSON.parse(result.content[0].text);
    expect(inner.success).toBe(true);
    expect(inner.data.player_url).toContain(`/player/${sessionId}`);
    expect(inner.data.embed_url).toContain(`?embed=1`);
  });

  it('should include stats when requested', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/get-session-url',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id: sessionId, include_stats: true }),
    });

    const result = JSON.parse(res.body);
    const inner = JSON.parse(result.content[0].text);
    expect(inner.data.title).toBe('URL Test');
    expect(inner.data.aspect_ratio).toBeDefined();
  });
});

// ── CORS ─────────────────────────────────────────────────────────────

describe('CORS headers', () => {
  let ctx: ServerContext;

  beforeAll(async () => {
    ctx = await createTestServer();
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should include CORS headers on responses', async () => {
    const res = await ctx.app.inject({ method: 'GET', url: '/health' });
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('should handle OPTIONS preflight', async () => {
    const res = await ctx.app.inject({ method: 'OPTIONS', url: '/api/create-session' });
    expect(res.statusCode).toBe(204);
    expect(res.headers['access-control-allow-methods']).toContain('POST');
  });
});

// ── SSE Endpoint ─────────────────────────────────────────────────────
// Note: Fastify inject() hangs on streaming endpoints. We test SSE
// via a real HTTP connection instead of inject().

describe('GET /session/:id/events (SSE)', () => {
  let ctx: ServerContext;
  let port: number;

  beforeAll(async () => {
    ctx = await createTestServer();
    // Listen on random port for real HTTP tests
    const address = await ctx.app.listen({ port: 0, host: '127.0.0.1' });
    const match = address.match(/:([0-9]+)$/);
    port = match ? Number(match[1]) : 0;
  });

  afterAll(async () => {
    await ctx.app.close();
    ctx.db.close();
  });

  it('should send connected event and set SSE headers', async () => {
    const result = await new Promise<{ headers: Record<string, string>; firstEvent: string }>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('SSE timeout')), 3000);

      const url = `http://127.0.0.1:${port}/session/test-sse/events`;
      // Use native http to test SSE (node fetch won't stream easily in test)
      import('http').then(({ default: http }) => {
        http.get(url, (res) => {
          const headers: Record<string, string> = {};
          for (const [key, val] of Object.entries(res.headers)) {
            if (typeof val === 'string') headers[key] = val;
          }

          let body = '';
          res.on('data', (chunk: Buffer) => {
            body += chunk.toString();
            // As soon as we get the connected event, resolve
            if (body.includes('"type":"connected"')) {
              clearTimeout(timeout);
              res.destroy();
              resolve({ headers, firstEvent: body });
            }
          });

          res.on('error', () => {
            // Connection destroyed by us — that's fine
          });
        }).on('error', reject);
      });
    });

    expect(result.headers['content-type']).toContain('text/event-stream');
    expect(result.firstEvent).toContain('"type":"connected"');
    expect(result.firstEvent).toContain('"sessionId":"test-sse"');
  });

  it('should deliver SSE events when scene is added', async () => {
    // Create a real session
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'SSE Test' }),
    });
    const sid = JSON.parse(JSON.parse(createRes.body).content[0].text).data.session_id;

    const events: string[] = [];

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('SSE delivery timeout')), 3000);

      import('http').then(({ default: http }) => {
        const req = http.get(`http://127.0.0.1:${port}/session/${sid}/events`, (res) => {
          res.on('data', (chunk: Buffer) => {
            events.push(chunk.toString());

            // After connected event, add a scene
            if (events.length === 1) {
              ctx.app.inject({
                method: 'POST',
                url: '/api/add-scene',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  session_id: sid,
                  visual_script: {
                    sceneId: sid,
                    totalDuration: 3000,
                    frames: [{
                      id: 'f-sse-1',
                      startTime: 0,
                      endTime: 3000,
                      entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
                    }],
                  },
                }),
              }).then(() => {
                // Give SSE a moment to deliver
                setTimeout(() => {
                  clearTimeout(timeout);
                  res.destroy();
                  resolve();
                }, 200);
              });
            }
          });

          res.on('error', () => { /* connection destroyed by us */ });
        });

        req.on('error', reject);
      });
    });

    const allData = events.join('');
    expect(allData).toContain('"type":"connected"');
    expect(allData).toContain('"type":"script_update"');
  });

  it('should send existing script immediately on SSE connect if session already has scenes', async () => {
    // Create session and add a scene BEFORE connecting SSE
    const createRes = await ctx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'SSE Replay Test' }),
    });
    const sid = JSON.parse(JSON.parse(createRes.body).content[0].text).data.session_id;

    // Add scene first (no SSE listener yet)
    await ctx.app.inject({
      method: 'POST',
      url: '/api/add-scene',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sid,
        visual_script: {
          sceneId: sid,
          totalDuration: 5000,
          frames: [{
            id: 'f-replay-1',
            startTime: 0,
            endTime: 5000,
            entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
          }],
        },
      }),
    });

    // NOW connect SSE — should receive connected + script_update with existing data
    const events = await new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('SSE replay timeout')), 3000);
      let body = '';

      import('http').then(({ default: http }) => {
        http.get(`http://127.0.0.1:${port}/session/${sid}/events`, (res) => {
          res.on('data', (chunk: Buffer) => {
            body += chunk.toString();
            // Wait for both connected and script_update
            if (body.includes('"type":"connected"') && body.includes('"type":"script_update"')) {
              clearTimeout(timeout);
              res.destroy();
              resolve(body);
            }
          });
          res.on('error', () => {});
        }).on('error', reject);
      });
    });

    expect(events).toContain('"type":"connected"');
    expect(events).toContain('"type":"script_update"');
    expect(events).toContain('"f-replay-1"');
  });
});
