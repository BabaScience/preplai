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
