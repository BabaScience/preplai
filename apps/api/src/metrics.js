/**
 * Prometheus metrics for preplai-api.
 */
import mongoose from 'mongoose';
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

export const register = new Registry();

export const apiAuthFailuresTotal = new Counter({
  name: 'api_auth_failures_total',
  help: 'Total API auth failures',
  labelNames: ['reason'],
  registers: [register],
});

export const mongodbConnectionReadyState = new Gauge({
  name: 'mongodb_connection_ready_state',
  help: 'MongoDB connection state (0=disconnected, 1=connected, 2=connecting, 3=disconnecting)',
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

/**
 * Sanitize path for metrics to avoid high cardinality.
 * Keeps /health and /metrics as-is; replaces IDs in other paths.
 */
function sanitizePath(path) {
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
 * Express middleware to record request metrics.
 */
export function metricsMiddleware(req, res, next) {
  const start = performance.now();
  const path = sanitizePath(req.path || req.url?.split('?')[0] || '/');

  res.on('finish', () => {
    const duration = (performance.now() - start) / 1000;
    const status = String(res.statusCode);
    httpRequestsTotal.inc({ method: req.method, path, status });
    httpRequestDuration.observe({ method: req.method, path }, duration);
  });

  next();
}

/**
 * Update MongoDB connection gauge. Call periodically.
 */
export function updateMongoConnectionGauge() {
  mongodbConnectionReadyState.set(mongoose.connection?.readyState ?? 0);
}
