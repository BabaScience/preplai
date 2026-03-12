/**
 * Prometheus metrics for @preplai/mcp-server.
 */
import mongoose from 'mongoose';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';
import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export const register = new Registry();

export const mcpToolCallsTotal = new Counter({
  name: 'mcp_tool_calls_total',
  help: 'Total MCP tool invocations',
  labelNames: ['tool'],
  registers: [register],
});

export const mcpAuthFailuresTotal = new Counter({
  name: 'mcp_auth_failures_total',
  help: 'Total MCP auth failures',
  labelNames: ['reason'],
  registers: [register],
});

export const mcpRateLimitHitsTotal = new Counter({
  name: 'mcp_rate_limit_hits_total',
  help: 'Total rate limit hits (global or tier)',
  labelNames: ['type'],
  registers: [register],
});

export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'path', 'status'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'path'],
  registers: [register],
});

export const mongodbConnectionReadyState = new Gauge({
  name: 'mongodb_connection_ready_state',
  help: 'MongoDB connection state (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)',
  registers: [register],
});

// ── Semantic Focus Metrics ──────────────────────────────────────────

export const semanticFocusLlmLatency = new Histogram({
  name: 'semantic_focus_llm_latency_seconds',
  help: 'Latency of Claude Haiku LLM calls for semantic focus cue generation',
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [register],
});

export const focusCueMethodTotal = new Counter({
  name: 'focus_cue_method_total',
  help: 'Total focus cue generation calls by method',
  labelNames: ['method'],
  registers: [register],
});

export const semanticFallbackTotal = new Counter({
  name: 'semantic_fallback_total',
  help: 'Total semantic focus fallback events by reason',
  labelNames: ['reason'],
  registers: [register],
});

export const ttsGenerationDuration = new Histogram({
  name: 'tts_generation_duration_seconds',
  help: 'Duration of ElevenLabs TTS audio generation per frame',
  buckets: [0.5, 1, 2, 5, 10, 20, 30],
  registers: [register],
});

// ── Quality Score Metrics ─────────────────────────────────────────────

export const qualityScoreOverall = new Histogram({
  name: 'quality_score_overall',
  help: 'Overall quality score (0-100) for visual scripts processed by add_scene',
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [register],
});

export const qualityScoreDimension = new Histogram({
  name: 'quality_score_dimension',
  help: 'Per-dimension quality score (0-100)',
  labelNames: ['dimension'],
  buckets: [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
  registers: [register],
});

export const qualityFrameCount = new Histogram({
  name: 'quality_frame_count',
  help: 'Number of frames per scored visual script',
  buckets: [1, 2, 3, 5, 8, 10, 15, 20, 50],
  registers: [register],
});

export const qualityEntityCount = new Histogram({
  name: 'quality_entity_count',
  help: 'Total entity count per scored visual script',
  buckets: [1, 5, 10, 20, 30, 50, 75, 100],
  registers: [register],
});

// ── Product Analytics Counters ────────────────────────────────────────

export const sessionCreatedTotal = new Counter({
  name: 'session_created_total',
  help: 'Total sessions created',
  registers: [register],
});

export const sceneAddedTotal = new Counter({
  name: 'scene_added_total',
  help: 'Total scenes added (append or replace)',
  labelNames: ['mode'],
  registers: [register],
});

export const playerUrlOpenedTotal = new Counter({
  name: 'player_url_opened_total',
  help: 'Total player URL opens (SSE connections)',
  registers: [register],
});

export const sessionCompletionRate = new Gauge({
  name: 'session_completion_rate',
  help: 'Ratio of sessions with ≥1 scene vs total sessions created (rolling)',
  registers: [register],
});

/**
 * Sanitize path for metrics to avoid high cardinality.
 */
function sanitizePath(path: string): string {
  if (path === '/health' || path === '/metrics') return path;
  return path
    .split('/')
    .map((seg) => {
      if (!seg) return seg;
      if (/^[\da-f-]{8,}$/i.test(seg) || seg.startsWith('plai_') || /^\d+$/.test(seg)) {
        return ':id';
      }
      return seg;
    })
    .join('/') || '/';
}

/**
 * Update MongoDB connection gauge. Call periodically or before metrics scrape.
 */
export function updateMongoConnectionGauge(): void {
  mongodbConnectionReadyState.set(mongoose.connection?.readyState ?? 0);
}

/**
 * Register metrics collection hook on Fastify app.
 */
export function registerMetricsHook(app: FastifyInstance): void {
  app.addHook('onRequest', (request: FastifyRequest, _reply: FastifyReply, done) => {
    (request as any).__metricsStart = performance.now();
    done();
  });
  app.addHook('onResponse', (request: FastifyRequest, reply: FastifyReply, done) => {
    const path = sanitizePath(request.url?.split('?')[0] ?? '/');
    const method = request.method;
    const status = String(reply.statusCode);
    const start = (request as any).__metricsStart as number | undefined;
    const duration = start !== undefined ? (performance.now() - start) / 1000 : 0;
    httpRequestsTotal.inc({ method, path, status });
    httpRequestDuration.observe({ method, path }, duration);
    done();
  });
}
