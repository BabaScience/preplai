/**
 * Monitoring dashboard and aggregated metrics API.
 * Provides visual KPIs and statistics from API + MCP server.
 */
import { isDbConnected } from './db.js';
import { register } from './metrics.js';

const MCP_BASE_URL = process.env.MCP_BASE_URL || 'http://localhost:5005';

/**
 * Parse Prometheus text format into a structured summary.
 */
function parseMetricsSummary(text) {
  const summary = {
    http_requests_total: 0,
    http_requests_by_status: {},
    http_requests_by_path: {},
    http_request_duration_p95_ms: null,
  };

  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;
    const match = line.match(/^(\w+)\{([^}]*)\}\s+([\d.e+-]+)/);
    if (!match) continue;
    const [, name, labels, value] = match;
    const num = parseFloat(value);

    if (name === 'http_requests_total') {
      summary.http_requests_total += num;
      const statusMatch = labels.match(/status="([^"]+)"/);
      const pathMatch = labels.match(/path="([^"]+)"/);
      if (statusMatch) {
        const s = statusMatch[1];
        summary.http_requests_by_status[s] = (summary.http_requests_by_status[s] || 0) + num;
      }
      if (pathMatch) {
        const p = pathMatch[1];
        summary.http_requests_by_path[p] = (summary.http_requests_by_path[p] || 0) + num;
      }
    }
    if (name === 'http_request_duration_seconds_bucket' && labels.includes('le="+Inf"')) {
      // Use +Inf bucket as total count for histogram
      const pathMatch = labels.match(/path="([^"]+)"/);
      if (pathMatch) {
        summary.http_request_duration_p95_ms = num * 1000; // placeholder; p95 would need proper calc
      }
    }
  }

  return summary;
}

async function fetchWithTimeout(url, ms = 3000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return { ok: res.ok, status: res.status, data: await res.text() };
  } catch (err) {
    return { ok: false, error: err.message };
  } finally {
    clearTimeout(t);
  }
}

/**
 * GET /api/monitoring/overview
 * Aggregates health + metrics from API and MCP server.
 */
export async function getMonitoringOverview() {
  const dbConnected = isDbConnected();
  const apiHealth = {
    status: dbConnected ? 'ok' : 'degraded',
    db: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  };
  const apiMetrics = await register.metrics();
  const apiSummary = parseMetricsSummary(apiMetrics);

  let mcpHealth = null;
  let mcpSummary = null;

  try {
    const [healthRes, metricsRes] = await Promise.all([
      fetchWithTimeout(`${MCP_BASE_URL}/health`),
      fetchWithTimeout(`${MCP_BASE_URL}/metrics`),
    ]);

    if (!healthRes.error && healthRes.data) {
      try {
        mcpHealth = JSON.parse(healthRes.data);
      } catch {
        mcpHealth = { status: 'error', error: 'Invalid JSON from MCP health' };
      }
    } else {
      mcpHealth = { status: 'error', error: healthRes.error || 'MCP unreachable' };
    }

    if (!metricsRes.error && metricsRes.data) {
      mcpSummary = parseMetricsSummary(metricsRes.data);
    }
  } catch (err) {
    mcpHealth = { status: 'error', error: err.message };
  }

  return {
    api: {
      health: apiHealth,
      metrics: apiSummary,
    },
    mcp: mcpHealth
      ? {
          health: mcpHealth,
          metrics: mcpSummary,
        }
      : null,
    timestamp: new Date().toISOString(),
  };
}
