/**
 * @preplai/mcp-server — Server Entry Point
 *
 * Thin Fastify boot file that wires all logic modules:
 * - McpServer SDK with 5 tool handlers
 * - SSE endpoint for player (GET /session/:id/events)
 * - Player HTML route (GET /player/:sessionId)
 * - Health check (GET /health)
 * - CORS
 *
 * All business logic lives in tools.ts, session-store.ts, sse.ts, db.ts.
 * This file is pure wiring — no business logic.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import { createDatabase } from './db.js';
import { SessionStore } from './session-store.js';
import { SseRegistry } from './sse.js';
import {
  handleCreateSession,
  handleAddScene,
  handleUpdateScene,
  handleAddNarration,
  handleGetSessionUrl,
  handleDeleteSession,
  handleRemoveScene,
} from './tools.js';
import { withErrorBoundary } from './errors.js';
import { PLAYER_HTML_TEMPLATE } from './player-html.js';
import { validateApiKey, trackUsage, checkSceneLimit, checkSessionLimit, createApiKey, authError, type ValidatedKey } from './auth.js';

// ── Config ────────────────────────────────────────────────────────────

export interface ServerConfig {
  port: number;
  host: string;
  baseUrl: string;
  dbPath: string;
  corsOrigin: string;
  logLevel: string;
}

export function getDefaultConfig(): ServerConfig {
  return {
    port: Number(process.env.PORT ?? 3001),
    host: process.env.HOST ?? '0.0.0.0',
    baseUrl: process.env.BASE_URL ?? 'http://localhost:3001',
    dbPath: process.env.DB_PATH ?? './preplai.db',
    corsOrigin: process.env.ALLOWED_ORIGINS ?? 'http://localhost:3001',
    logLevel: process.env.LOG_LEVEL ?? 'info',
  };
}

// ── Server Factory ────────────────────────────────────────────────────

export interface ServerContext {
  app: FastifyInstance;
  store: SessionStore;
  sse: SseRegistry;
  db: ReturnType<typeof createDatabase>;
}

/**
 * Build and configure a Fastify server with all routes.
 * Does NOT call listen() — the caller decides when to start.
 * This makes the server fully testable via fastify.inject().
 */
export async function buildServer(config: Partial<ServerConfig> = {}): Promise<ServerContext> {
  const cfg: ServerConfig = { ...getDefaultConfig(), ...config };

  // ── Database ──────────────────────────────────────────────────────
  const db = createDatabase(cfg.dbPath);
  const store = new SessionStore(db);
  store.loadFromDb();

  // Clean expired sessions on startup
  const cleaned = store.cleanExpiredSessions();
  if (cleaned > 0) {
    console.log(`[preplai] Cleaned ${cleaned} expired sessions`);
  }

  // Periodic cleanup every 6 hours
  setInterval(() => {
    const c = store.cleanExpiredSessions();
    if (c > 0) console.log(`[preplai] Periodic cleanup: removed ${c} expired sessions`);
  }, 6 * 60 * 60 * 1000);

  // ── SSE Registry ──────────────────────────────────────────────────
  const sse = new SseRegistry();

  // ── Fastify app ───────────────────────────────────────────────────
  const app = Fastify({
    logger: { level: cfg.logLevel },
  });

  // ── CORS ──────────────────────────────────────────────────────────
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', cfg.corsOrigin);
    reply.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id, X-Preplai-API-Key');

    if (request.method === 'OPTIONS') {
      reply.status(204).send();
    }
  });

  // ── Auth: API key validation ──────────────────────────────────────
  // Decorate request with validated key info
  app.decorateRequest('apiKey', null);

  // Routes that bypass auth
  const PUBLIC_ROUTES = new Set(['/health', '/player.css', '/player.js']);

  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0];

    // Public routes: no auth needed
    if (PUBLIC_ROUTES.has(path)) return;

    // Player pages: gated via session ownership (checked in route handler)
    if (path.startsWith('/player/')) return;

    // SSE endpoint: gated via session ownership (checked in route handler)
    if (path.startsWith('/session/') && path.endsWith('/events')) return;

    // API key provisioning endpoint (bootstrap): no auth
    if (path === '/api/keys' && request.method === 'POST') return;

    // All other routes require API key
    const key = request.headers['x-preplai-api-key'] as string | undefined;
    if (!key) {
      const err = authError('MISSING_API_KEY', 'API key required. Include X-Preplai-API-Key header.');
      reply.status(err.statusCode).send(err.body);
      return;
    }

    const validated = validateApiKey(db, key);
    if (!validated) {
      const err = authError('INVALID_API_KEY', 'Invalid or revoked API key.');
      reply.status(err.statusCode).send(err.body);
      return;
    }

    (request as any).apiKey = validated;
  });

  // ── Health check ──────────────────────────────────────────────────
  app.get('/health', async () => {
    return {
      status: 'ok',
      version: '1.0.0',
      sessions: store.size,
      uptime: process.uptime(),
    };
  });

  // ── API Key Management ────────────────────────────────────────────

  app.post<{ Body: { email: string; tier?: string } }>(
    '/api/keys',
    async (request, reply) => {
      const { email, tier } = request.body || {};
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        reply.status(400).send({
          success: false,
          error: { code: 'INVALID_EMAIL', message: 'A valid email is required.', suggestion: 'Provide a valid email address.' },
        });
        return;
      }

      // For now, anyone can create a free key. Paid tiers will require payment verification.
      const result = createApiKey(db, email, tier === 'pro' || tier === 'enterprise' ? tier : 'free');

      reply.status(201).send({
        success: true,
        data: {
          api_key: result.key,
          key_prefix: result.key_prefix,
          tier: result.tier,
          message: 'Store this API key securely — it cannot be retrieved again.',
        },
      });
    },
  );

  // ── SSE endpoint for player ───────────────────────────────────────
  app.get<{ Params: { id: string } }>('/session/:id/events', (request, reply) => {
    const { id } = request.params;
    const session = store.getSession(id);
    if (!session) {
      reply.status(404).send({ error: 'Session not found.' });
      return;
    }

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': cfg.corsOrigin,
    });

    // Send connected event
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', sessionId: id })}\n\n`);

    // If session already has a script, send it immediately so the player
    // doesn't sit empty when opened after add_scene was already called.
    if (session.script?.frames?.length) {
      reply.raw.write(`data: ${JSON.stringify({ type: 'script_update', script: session.script })}\n\n`);
    }

    // Register subscriber
    const sseReply = { raw: reply.raw };
    sse.subscribe(id, sseReply);

    // Cleanup on disconnect
    request.raw.on('close', () => {
      sse.unsubscribe(id, sseReply);
    });
  });

  // ── Player HTML route ─────────────────────────────────────────────
  // Player pages: accessible with session ID (UUID acts as capability token)
  // Future: add optional password protection or require viewer auth
  app.get<{ Params: { sessionId: string } }>('/player/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;
    const session = store.getSession(sessionId);
    if (!session) {
      reply.status(404).send({ error: 'Session not found or expired.' });
      return;
    }
    const html = PLAYER_HTML_TEMPLATE.replace(/\{\{SESSION_ID\}\}/g, sessionId);
    reply.type('text/html').send(html);
  });

  // ── Player static assets ──────────────────────────────────────────
  // player.css served inline for simplicity in V1 (no file bundler needed)
  app.get('/player.css', async (request, reply) => {
    const { PLAYER_CSS } = await import('./player-css.js');
    reply.type('text/css').send(PLAYER_CSS);
  });

  app.get('/player.js', async (request, reply) => {
    const { PLAYER_JS } = await import('./player-js.js');
    reply.type('application/javascript').send(PLAYER_JS);
  });

  // ── MCP-style API routes (REST wrappers over tool handlers) ───────
  // In V1, we expose the tool handlers directly via REST.
  // Full MCP SDK integration (fastify-mcp-server plugin) can be added
  // when the SDK is installed. For now, REST endpoints mirror the tools.

  const sceneDeps = { store, sse };
  const sessionUrlDeps = { store, baseUrl: cfg.baseUrl };
  const createDeps = { store, baseUrl: cfg.baseUrl };

  // Helper: verify session ownership
  function verifySessionOwnership(sessionId: string, apiKeyId: string): boolean {
    const session = store.getSession(sessionId);
    return session !== null && session.api_key_id === apiKeyId;
  }

  app.post<{ Body: { title: string; aspect_ratio?: string } }>(
    '/api/create-session',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      const limitCheck = checkSessionLimit(db, apiKey.id, apiKey.tier);
      if (!limitCheck.allowed) {
        reply.status(429).send(authError('RATE_LIMIT_EXCEEDED', limitCheck.reason!).body);
        return;
      }

      const handler = withErrorBoundary((args: any) => handleCreateSession(args, createDeps));
      const result = await handler({ ...request.body, _apiKeyId: apiKey.id });

      // Track usage
      try {
        const data = JSON.parse(result.content[0].text);
        if (data.success) {
          trackUsage(db, apiKey.id, 'create_session', data.data.session_id);
        }
      } catch {}

      return result;
    },
  );

  app.post<{ Body: { session_id: string; visual_script: any } }>(
    '/api/add-scene',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      if (!verifySessionOwnership(request.body.session_id, apiKey.id)) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }

      const sceneCheck = checkSceneLimit(db, apiKey.id, apiKey.tier);
      if (!sceneCheck.allowed) {
        reply.status(429).send(authError('RATE_LIMIT_EXCEEDED', sceneCheck.reason!).body);
        return;
      }

      const handler = withErrorBoundary((args: any) => handleAddScene(args, sceneDeps));
      const result = await handler(request.body);

      trackUsage(db, apiKey.id, 'add_scene', request.body.session_id);
      return result;
    },
  );

  app.post<{ Body: { session_id: string; visual_script: any } }>(
    '/api/update-scene',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      if (!verifySessionOwnership(request.body.session_id, apiKey.id)) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }

      const handler = withErrorBoundary((args: any) => handleUpdateScene(args, sceneDeps));
      const result = await handler(request.body);

      trackUsage(db, apiKey.id, 'update_scene', request.body.session_id);
      return result;
    },
  );

  app.post<{ Body: { session_id: string; text: string; frame_index?: number } }>(
    '/api/add-narration',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      if (!verifySessionOwnership(request.body.session_id, apiKey.id)) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }

      const handler = withErrorBoundary((args: any) => handleAddNarration(args, sceneDeps));
      const result = await handler(request.body);

      trackUsage(db, apiKey.id, 'add_narration', request.body.session_id);
      return result;
    },
  );

  app.post<{ Body: { session_id: string; include_stats?: boolean } }>(
    '/api/get-session-url',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      if (!verifySessionOwnership(request.body.session_id, apiKey.id)) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }

      const handler = withErrorBoundary((args: any) => handleGetSessionUrl(args, sessionUrlDeps));
      return handler(request.body);
    },
  );

  app.get<{ Querystring: { limit?: string } }>(
    '/api/sessions',
    async (request) => {
      const apiKey = (request as any).apiKey as ValidatedKey;
      const limit = Number(request.query.limit) || 20;

      // Only return sessions owned by this key
      const sessions = store.listSessionsByKey(apiKey.id).slice(0, Math.min(limit, 100));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              sessions: sessions.map(s => ({
                session_id: s.id,
                title: s.title,
                player_url: `${cfg.baseUrl}/player/${s.id}`,
                frame_count: s.script?.frames?.length ?? 0,
                created_at: new Date(s.created_at).toISOString(),
              })),
              total: sessions.length,
            },
          }),
        }],
      };
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/api/sessions/:id',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      if (!verifySessionOwnership(request.params.id, apiKey.id)) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }

      const handler = withErrorBoundary((args: any) => handleDeleteSession(args, { store }));
      return handler({ session_id: request.params.id });
    },
  );

  app.delete<{ Params: { sessionId: string }; Body: { frame_indices?: number[]; last_n?: number } }>(
    '/api/sessions/:sessionId/frames',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      if (!verifySessionOwnership(request.params.sessionId, apiKey.id)) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }

      const handler = withErrorBoundary((args: any) => handleRemoveScene(args, sceneDeps));
      return handler({ session_id: request.params.sessionId, ...request.body });
    },
  );

  return { app, store, sse, db };
}

// ── Standalone startup ──────────────────────────────────────────────

export async function startServer(config: Partial<ServerConfig> = {}): Promise<ServerContext> {
  const ctx = await buildServer(config);
  const cfg: ServerConfig = { ...getDefaultConfig(), ...config };

  await ctx.app.listen({ port: cfg.port, host: cfg.host });
  console.log(`[preplai] Server running at ${cfg.baseUrl}`);
  console.log(`[preplai] Player: ${cfg.baseUrl}/player/:sessionId`);
  console.log(`[preplai] Health: ${cfg.baseUrl}/health`);

  return ctx;
}

// Run if executed directly
const isMainModule = process.argv[1]?.endsWith('server.js') || process.argv[1]?.endsWith('server.ts');
if (isMainModule) {
  startServer().catch((err) => {
    console.error('[preplai] Failed to start:', err);
    process.exit(1);
  });
}
