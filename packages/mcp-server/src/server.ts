/**
 * @pre/mcp-server — Server Entry Point
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
} from './tools.js';
import { withErrorBoundary } from './errors.js';
import { PLAYER_HTML_TEMPLATE } from './player-html.js';

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
    dbPath: process.env.DB_PATH ?? './pre.db',
    corsOrigin: process.env.ALLOWED_ORIGINS ?? '*',
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

  // ── SSE Registry ──────────────────────────────────────────────────
  const sse = new SseRegistry();

  // ── Fastify app ───────────────────────────────────────────────────
  const app = Fastify({
    logger: { level: cfg.logLevel },
  });

  // ── CORS ──────────────────────────────────────────────────────────
  app.addHook('onRequest', async (request, reply) => {
    reply.header('Access-Control-Allow-Origin', cfg.corsOrigin);
    reply.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id, X-PRE-API-Key');

    if (request.method === 'OPTIONS') {
      reply.status(204).send();
    }
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

  // ── SSE endpoint for player ───────────────────────────────────────
  app.get<{ Params: { id: string } }>('/session/:id/events', (request, reply) => {
    const { id } = request.params;

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': cfg.corsOrigin,
    });

    // Send connected event
    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', sessionId: id })}\n\n`);

    // Register subscriber
    const sseReply = { raw: reply.raw };
    sse.subscribe(id, sseReply);

    // Cleanup on disconnect
    request.raw.on('close', () => {
      sse.unsubscribe(id, sseReply);
    });
  });

  // ── Player HTML route ─────────────────────────────────────────────
  app.get<{ Params: { sessionId: string } }>('/player/:sessionId', async (request, reply) => {
    const { sessionId } = request.params;
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

  app.post<{ Body: { title: string; aspect_ratio?: string } }>(
    '/api/create-session',
    async (request) => {
      const handler = withErrorBoundary((args: any) => handleCreateSession(args, createDeps));
      return handler(request.body);
    },
  );

  app.post<{ Body: { session_id: string; visual_script: any } }>(
    '/api/add-scene',
    async (request) => {
      const handler = withErrorBoundary((args: any) => handleAddScene(args, sceneDeps));
      return handler(request.body);
    },
  );

  app.post<{ Body: { session_id: string; visual_script: any } }>(
    '/api/update-scene',
    async (request) => {
      const handler = withErrorBoundary((args: any) => handleUpdateScene(args, sceneDeps));
      return handler(request.body);
    },
  );

  app.post<{ Body: { session_id: string; text: string; frame_index?: number } }>(
    '/api/add-narration',
    async (request) => {
      const handler = withErrorBoundary((args: any) => handleAddNarration(args, sceneDeps));
      return handler(request.body);
    },
  );

  app.post<{ Body: { session_id: string; include_stats?: boolean } }>(
    '/api/get-session-url',
    async (request) => {
      const handler = withErrorBoundary((args: any) => handleGetSessionUrl(args, sessionUrlDeps));
      return handler(request.body);
    },
  );

  return { app, store, sse, db };
}

// ── Standalone startup ──────────────────────────────────────────────

export async function startServer(config: Partial<ServerConfig> = {}): Promise<ServerContext> {
  const ctx = await buildServer(config);
  const cfg: ServerConfig = { ...getDefaultConfig(), ...config };

  await ctx.app.listen({ port: cfg.port, host: cfg.host });
  console.log(`[PRE] Server running at ${cfg.baseUrl}`);
  console.log(`[PRE] Player: ${cfg.baseUrl}/player/:sessionId`);
  console.log(`[PRE] Health: ${cfg.baseUrl}/health`);

  return ctx;
}

// Run if executed directly
const isMainModule = process.argv[1]?.endsWith('server.js') || process.argv[1]?.endsWith('server.ts');
if (isMainModule) {
  startServer().catch((err) => {
    console.error('[PRE] Failed to start:', err);
    process.exit(1);
  });
}
