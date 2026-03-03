/**
 * @preplai/mcp-server — Server Entry Point
 *
 * Thin Fastify boot file that wires all logic modules.
 * Uses MongoDB via @preplai/db for persistence.
 * Exposes MCP tools via Streamable HTTP at /mcp.
 */
import { config } from 'dotenv';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env from package root when present (dev/local). In production, env vars
// are typically set by the platform (Docker, K8s, etc.); dotenv no-ops if missing.
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });

import { AsyncLocalStorage } from 'node:async_hooks';
import Fastify, { type FastifyInstance } from 'fastify';
import FastifyCors from '@fastify/cors';
import FastifyRateLimit from '@fastify/rate-limit';
import { connectDb, closeDb } from '@preplai/db';
import FastifyMcpServer from 'fastify-mcp-server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
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
import {
  validateApiKey,
  trackUsage,
  checkSceneLimit,
  checkSessionLimit,
  createApiKey,
  authError,
  type ValidatedKey,
} from './auth.js';
import { validateOAuthToken } from './oauth-token.js';
import { registerMcpTools } from './mcp-tools.js';

/** AsyncLocalStorage for passing API key to MCP tool handlers (Streamable HTTP) */
export const apiKeyStore = new AsyncLocalStorage<ValidatedKey>();

// ── Config ────────────────────────────────────────────────────────────

export interface ServerConfig {
  port: number;
  host: string;
  baseUrl: string;
  mongoUri: string;
  corsOrigin: string;
  logLevel: string;
  rateLimitMax?: number;
  rateLimitWindow?: string;
}

export function getDefaultConfig(): ServerConfig {
  return {
    port: Number(process.env.PORT ?? 5005),
    host: process.env.HOST ?? '0.0.0.0',
    baseUrl: process.env.BASE_URL ?? 'http://localhost:5005',
    mongoUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/preplai',
    corsOrigin: process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://localhost:5005',
    logLevel: process.env.LOG_LEVEL ?? 'info',
  };
}

// ── Server Factory ────────────────────────────────────────────────────

export interface ServerContext {
  app: FastifyInstance;
  store: SessionStore;
  sse: SseRegistry;
}

/**
 * Build and configure a Fastify server with all routes.
 */
export async function buildServer(config: Partial<ServerConfig> = {}): Promise<ServerContext> {
  const cfg: ServerConfig = { ...getDefaultConfig(), ...config };

  // ── Database ──────────────────────────────────────────────────────
  await connectDb(cfg.mongoUri);

  const store = new SessionStore();
  await store.loadFromDb();

  const cleaned = await store.cleanExpiredSessions();
  if (cleaned > 0) {
    console.log(`[preplai] Cleaned ${cleaned} expired sessions`);
  }

  const cleanupInterval = setInterval(async () => {
    const c = await store.cleanExpiredSessions();
    if (c > 0) console.log(`[preplai] Periodic cleanup: removed ${c} expired sessions`);
  }, 6 * 60 * 60 * 1000);

  // ── SSE Registry ──────────────────────────────────────────────────
  const sse = new SseRegistry();

  // ── Fastify app ───────────────────────────────────────────────────
  const app = Fastify({
    logger: { level: cfg.logLevel },
  });

  // ── CORS (supports multiple comma-separated origins) ──────────────
  const allowedOrigins = cfg.corsOrigin.split(',').map((o) => o.trim()).filter(Boolean);
  await app.register(FastifyCors, {
    origin: allowedOrigins.length > 0
      ? (origin, cb) => {
          if (!origin || allowedOrigins.includes(origin)) {
            cb(null, (origin || allowedOrigins[0]) ?? '*');
          } else {
            cb(null, false);
          }
        }
      : true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Mcp-Session-Id', 'X-Preplai-API-Key'],
  });

  // ── Rate limiting (global: 200 req/min per IP) ────────────────────
  await app.register(FastifyRateLimit, {
    max: cfg.rateLimitMax ?? Number(process.env.RATE_LIMIT_MAX ?? 200),
    timeWindow: cfg.rateLimitWindow ?? process.env.RATE_LIMIT_WINDOW ?? '1 minute',
  });

  // ── Auth: API key validation ──────────────────────────────────────
  app.decorateRequest('apiKey', null);

  // MCP session auth cache: some clients (e.g. Claude) send Bearer only on first request.
  // We store auth when we have it and reuse for subsequent requests with same Mcp-Session-Id.
  const MCP_SESSION_HEADER = 'mcp-session-id';
  const sessionAuth = new Map<string, ValidatedKey>();
  const SESSION_AUTH_TTL_MS = 60 * 60 * 1000; // 1 hour
  const sessionAuthExpiry = new Map<string, number>();

  const PUBLIC_ROUTES = new Set([
    '/health',
    '/player.css',
    '/player.js',
    '/.well-known/oauth-protected-resource',
  ]);

  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0];

    if (PUBLIC_ROUTES.has(path)) return;
    if (path.startsWith('/player/')) return;
    if (path.startsWith('/session/') && path.endsWith('/events')) return;
    if (path === '/api/keys' && request.method === 'POST') return;

    // Accept X-Preplai-API-Key or Authorization: Bearer <key|jwt>
    let token = request.headers['x-preplai-api-key'] as string | undefined;
    if (!token) {
      const auth = request.headers.authorization;
      if (auth?.startsWith('Bearer ')) token = auth.slice(7).trim();
    }

    const sessionId = request.headers[MCP_SESSION_HEADER] as string | undefined;

    let validated: ValidatedKey | null = null;

    if (token) {
      if (token.startsWith('plai_')) {
        validated = await validateApiKey(token);
      } else {
        validated = await validateOAuthToken(token);
      }
      if (validated && sessionId) {
        sessionAuth.set(sessionId, validated);
        sessionAuthExpiry.set(sessionId, Date.now() + SESSION_AUTH_TTL_MS);
      }
    }

    // Fallback: reuse auth from MCP session (clients like Claude may not re-send Bearer on every request)
    if (!validated && sessionId) {
      const expiry = sessionAuthExpiry.get(sessionId);
      if (expiry && expiry > Date.now()) {
        validated = sessionAuth.get(sessionId) ?? null;
      } else {
        sessionAuth.delete(sessionId);
        sessionAuthExpiry.delete(sessionId);
      }
    }

    if (!validated) {
      const err = authError(
        token ? 'INVALID_API_KEY' : 'MISSING_API_KEY',
        token ? 'Invalid or revoked API key.' : 'API key required. Include X-Preplai-API-Key header or Authorization: Bearer <key>.',
      );
      reply
        .status(err.statusCode)
        .header(
          'WWW-Authenticate',
          `Bearer resource_metadata="${cfg.baseUrl.replace(/\/$/, '')}/.well-known/oauth-protected-resource"`,
        )
        .send(err.body);
      return;
    }

    (request as any).apiKey = validated;
    // MCP transport reads req.auth and passes it to tools as extra.authInfo
    (request.raw as any).auth = validated;
    apiKeyStore.enterWith(validated);
  });

  // ── MCP: Streamable HTTP at /mcp ─────────────────────────────────────
  await app.register(FastifyMcpServer, {
    createMcpServer: () => {
      const mcp = new McpServer({ name: 'preplai', version: '0.1.0' });
      registerMcpTools(mcp, {
        store,
        sse,
        baseUrl: cfg.baseUrl,
        getApiKey: (extra?: unknown) =>
          (extra as { authInfo?: ValidatedKey })?.authInfo ?? apiKeyStore.getStore() ?? null,
      });
      return mcp;
    },
    endpoint: '/mcp',
  });

  // ── Protected Resource Metadata (RFC 9728) for OAuth discovery ───────
  const apiBase =
    process.env.NODE_ENV === 'production'
      ? 'https://api.preplai.com'
      : process.env.API_BASE_URL ?? 'http://localhost:5000';
  app.get('/.well-known/oauth-protected-resource', async () => {
    return {
      resource: cfg.baseUrl.replace(/\/$/, ''),
      authorization_servers: [apiBase],
      scopes_supported: ['mcp:preplai'],
      resource_name: 'preplai MCP',
    };
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

  // ── API Key Management (quick start) ───────────────────────────────
  app.post<{ Body: { email: string; tier?: string } }>(
    '/api/keys',
    { config: { rateLimit: { max: 5, timeWindow: '1 hour' } } },
    async (request, reply) => {
      const { email, tier } = request.body || {};
      if (!email || typeof email !== 'string' || !email.includes('@')) {
        reply.status(400).send({
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'A valid email is required.',
            suggestion: 'Provide a valid email address.',
          },
        });
        return;
      }

      const result = await createApiKey(
        email,
        tier === 'pro' || tier === 'enterprise' ? tier : 'free',
      );

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
  const resolveCorsOrigin = (requestOrigin: string | undefined): string => {
    if (!requestOrigin || allowedOrigins.length === 0) return allowedOrigins[0] ?? '*';
    return allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0] ?? '*';
  };

  app.get<{ Params: { id: string } }>('/session/:id/events', (request, reply) => {
    const { id } = request.params;
    const session = store.getSession(id);
    if (!session) {
      reply.status(404).send({ error: 'Session not found.' });
      return;
    }

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': resolveCorsOrigin(request.headers.origin as string),
    });

    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', sessionId: id })}\n\n`);

    if (session.script?.frames?.length) {
      reply.raw.write(`data: ${JSON.stringify({ type: 'script_update', script: session.script })}\n\n`);
    }

    const sseReply = { raw: reply.raw };
    sse.subscribe(id, sseReply);

    request.raw.on('close', () => {
      sse.unsubscribe(id, sseReply);
    });
  });

  // ── Player HTML route ─────────────────────────────────────────────
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
  app.get('/player.css', async (request, reply) => {
    const { PLAYER_CSS } = await import('./player-css.js');
    reply.type('text/css').send(PLAYER_CSS);
  });

  app.get('/player.js', async (request, reply) => {
    const { PLAYER_JS } = await import('./player-js.js');
    reply.type('text/javascript').send(PLAYER_JS);
  });

  // ── MCP-style API routes ──────────────────────────────────────────
  const sceneDeps = { store, sse };
  const sessionUrlDeps = { store, baseUrl: cfg.baseUrl };
  const createDeps = { store, baseUrl: cfg.baseUrl };

  function verifySessionOwnership(sessionId: string, apiKeyId: string): { ok: boolean; notFound?: boolean } {
    const session = store.getSession(sessionId);
    if (!session) return { ok: false, notFound: true };
    if (session.api_key_id !== apiKeyId) return { ok: false };
    return { ok: true };
  }

  app.post<{ Body: { title: string; aspect_ratio?: string } }>(
    '/api/create-session',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      const limitCheck = await checkSessionLimit(apiKey.id, apiKey.tier);
      if (!limitCheck.allowed) {
        reply.status(429).send(authError('RATE_LIMIT_EXCEEDED', limitCheck.reason!).body);
        return;
      }

      const handler = withErrorBoundary((args: any) => handleCreateSession(args, createDeps));
      const result = await handler({ ...request.body, _apiKeyId: apiKey.id });

      try {
        const data = JSON.parse(result.content[0].text);
        if (data.success) {
          await trackUsage(apiKey.id, 'create_session', data.data.session_id);
        }
      } catch {}

      return result;
    },
  );

  app.post<{ Body: { session_id: string; visual_script: any } }>(
    '/api/add-scene',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      const ownership = verifySessionOwnership(request.body.session_id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }
      if (!ownership.ok && ownership.notFound) {
        const handler = withErrorBoundary((args: any) => handleAddScene(args, sceneDeps));
        return handler(request.body);
      }

      const sceneCheck = await checkSceneLimit(apiKey.id, apiKey.tier);
      if (!sceneCheck.allowed) {
        reply.status(429).send(authError('RATE_LIMIT_EXCEEDED', sceneCheck.reason!).body);
        return;
      }

      const handler = withErrorBoundary((args: any) => handleAddScene(args, sceneDeps));
      const result = await handler(request.body);

      await trackUsage(apiKey.id, 'add_scene', request.body.session_id);
      return result;
    },
  );

  app.post<{ Body: { session_id: string; visual_script: any } }>(
    '/api/update-scene',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      const ownership = verifySessionOwnership(request.body.session_id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }
      if (!ownership.ok && ownership.notFound) {
        const handler = withErrorBoundary((args: any) => handleUpdateScene(args, sceneDeps));
        return handler(request.body);
      }

      const handler = withErrorBoundary((args: any) => handleUpdateScene(args, sceneDeps));
      const result = await handler(request.body);

      await trackUsage(apiKey.id, 'update_scene', request.body.session_id);
      return result;
    },
  );

  app.post<{ Body: { session_id: string; text: string; frame_index?: number } }>(
    '/api/add-narration',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      const ownership = verifySessionOwnership(request.body.session_id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }
      if (!ownership.ok && ownership.notFound) {
        const handler = withErrorBoundary((args: any) => handleAddNarration(args, sceneDeps));
        return handler(request.body);
      }

      const handler = withErrorBoundary((args: any) => handleAddNarration(args, sceneDeps));
      const result = await handler(request.body);

      await trackUsage(apiKey.id, 'add_narration', request.body.session_id);
      return result;
    },
  );

  app.post<{ Body: { session_id: string; include_stats?: boolean } }>(
    '/api/get-session-url',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      const ownership = verifySessionOwnership(request.body.session_id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }
      if (!ownership.ok && ownership.notFound) {
        const handler = withErrorBoundary((args: any) => handleGetSessionUrl(args, sessionUrlDeps));
        return handler(request.body);
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

      const sessions = store.listSessionsByKey(apiKey.id).slice(0, Math.min(limit, 100));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            data: {
              sessions: sessions.map((s) => ({
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

      const ownership = verifySessionOwnership(request.params.id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }
      if (!ownership.ok && ownership.notFound) {
        const handler = withErrorBoundary((args: any) => handleDeleteSession(args, { store }));
        return handler({ session_id: request.params.id });
      }

      const handler = withErrorBoundary((args: any) => handleDeleteSession(args, { store }));
      return handler({ session_id: request.params.id });
    },
  );

  app.delete<{ Params: { sessionId: string }; Body: { frame_indices?: number[]; last_n?: number } }>(
    '/api/sessions/:sessionId/frames',
    async (request, reply) => {
      const apiKey = (request as any).apiKey as ValidatedKey;

      const ownership = verifySessionOwnership(request.params.sessionId, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        reply.status(403).send(authError('FORBIDDEN', 'You do not own this session.').body);
        return;
      }
      if (!ownership.ok && ownership.notFound) {
        const handler = withErrorBoundary((args: any) => handleRemoveScene(args, sceneDeps));
        return handler({ session_id: request.params.sessionId, ...request.body });
      }

      const handler = withErrorBoundary((args: any) => handleRemoveScene(args, sceneDeps));
      return handler({ session_id: request.params.sessionId, ...request.body });
    },
  );

  // Store cleanup interval for graceful shutdown
  (app as any).__cleanupInterval = cleanupInterval;

  return { app, store, sse };
}

// ── Standalone startup & graceful shutdown ───────────────────────────

export async function startServer(config: Partial<ServerConfig> = {}): Promise<ServerContext> {
  const ctx = await buildServer(config);
  const cfg: ServerConfig = { ...getDefaultConfig(), ...config };

  await ctx.app.listen({ port: cfg.port, host: cfg.host });
  console.log(`[preplai] Server running at ${cfg.baseUrl}`);
  console.log(`[preplai] Player: ${cfg.baseUrl}/player/:sessionId`);
  console.log(`[preplai] Health: ${cfg.baseUrl}/health`);

  let shuttingDown = false;
  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[preplai] ${signal} received, shutting down gracefully...`);
    const interval = (ctx.app as any).__cleanupInterval;
    if (interval) clearInterval(interval);
    await ctx.app.close();
    await closeDb();
    process.exit(0);
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  return ctx;
}

const isMainModule = process.argv[1]?.endsWith('server.js') || process.argv[1]?.endsWith('server.ts');
if (isMainModule) {
  startServer().catch((err) => {
    console.error('[preplai] Failed to start:', err);
    process.exit(1);
  });
}
