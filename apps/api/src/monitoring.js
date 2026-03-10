/**
 * Monitoring dashboard and aggregated metrics API.
 * Provides visual KPIs and statistics from API + MCP server.
 */
import { isDbConnected, User, ApiKey, Session, McpUsageLog, UsageLog } from './db.js';
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
    // Semantic focus metrics
    focus_cue_method: {},          // { agent: N, llm: N, string: N }
    semantic_fallback: {},         // { no_api_key: N, error: N, empty_response: N, no_narration: N }
    semantic_llm_latency_count: 0,
    semantic_llm_latency_sum: 0,
    tts_generation_count: 0,
    tts_generation_sum: 0,
  };

  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('#') || !line.trim()) continue;

    // Match labeled metrics: metric_name{labels} value
    const match = line.match(/^(\w+)\{([^}]*)\}\s+([\d.e+-]+)/);
    if (match) {
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
        const pathMatch = labels.match(/path="([^"]+)"/);
        if (pathMatch) {
          summary.http_request_duration_p95_ms = num * 1000;
        }
      }

      // Semantic focus counters
      if (name === 'focus_cue_method_total') {
        const methodMatch = labels.match(/method="([^"]+)"/);
        if (methodMatch) {
          summary.focus_cue_method[methodMatch[1]] = num;
        }
      }
      if (name === 'semantic_fallback_total') {
        const reasonMatch = labels.match(/reason="([^"]+)"/);
        if (reasonMatch) {
          summary.semantic_fallback[reasonMatch[1]] = num;
        }
      }
      continue;
    }

    // Match unlabeled metrics: metric_name value
    const simpleMatch = line.match(/^(\w+)\s+([\d.e+-]+)/);
    if (simpleMatch) {
      const [, name, value] = simpleMatch;
      const num = parseFloat(value);

      if (name === 'semantic_focus_llm_latency_seconds_count') {
        summary.semantic_llm_latency_count = num;
      }
      if (name === 'semantic_focus_llm_latency_seconds_sum') {
        summary.semantic_llm_latency_sum = num;
      }
      if (name === 'tts_generation_duration_seconds_count') {
        summary.tts_generation_count = num;
      }
      if (name === 'tts_generation_duration_seconds_sum') {
        summary.tts_generation_sum = num;
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

  let business = null;
  if (dbConnected) {
    try {
      const now = Date.now();
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const [users, apiKeys, sessions, usageLast24h] = await Promise.all([
        User.countDocuments(),
        ApiKey.countDocuments({ revoked: false }),
        Session.countDocuments(),
        McpUsageLog.aggregate([
          { $match: { createdAt: { $gte: dayAgo } } },
          { $group: { _id: '$action', count: { $sum: 1 } } },
          { $project: { action: '$_id', count: 1, _id: 0 } },
        ]),
      ]);
      const usageByAction = Object.fromEntries(
        usageLast24h.map((r) => [r.action, r.count])
      );
      business = {
        users,
        apiKeys,
        sessions,
        usageLast24h: usageByAction,
      };
    } catch (err) {
      business = { error: err.message };
    }
  }

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
    business,
    mcp: mcpHealth
      ? {
          health: mcpHealth,
          metrics: mcpSummary,
        }
      : null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * GET /api/monitoring/history?days=7
 * Aggregates McpUsageLog and UsageLog by day and action.
 */
export async function getMonitoringHistory(days = 7) {
  const dbConnected = isDbConnected();
  if (!dbConnected) {
    return { daily: [], error: 'Database not connected' };
  }

  const daysNum = Math.min(Math.max(parseInt(String(days), 10) || 7, 1), 90);
  const now = Date.now();
  const startMs = now - daysNum * 24 * 60 * 60 * 1000;

  const mcpDaily = await McpUsageLog.aggregate([
    { $match: { createdAt: { $gte: startMs } } },
    {
      $group: {
        _id: {
          date: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $toDate: '$createdAt' },
            },
          },
          action: '$action',
        },
        count: { $sum: 1 },
      },
    },
    { $group: { _id: '$_id.date', actions: { $push: { k: '$_id.action', v: '$count' } } } },
    { $project: { date: '$_id', _id: 0, actions: { $arrayToObject: '$actions' } } },
    { $sort: { date: 1 } },
  ]);

  const apiDaily = await UsageLog.aggregate([
    { $match: { createdAt: { $gte: new Date(startMs) } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          endpoint: '$endpoint',
        },
        count: { $sum: 1 },
      },
    },
    { $group: { _id: '$_id.date', endpoints: { $push: { k: '$_id.endpoint', v: '$count' } } } },
    { $project: { date: '$_id', _id: 0, endpoints: { $arrayToObject: '$endpoints' } } },
    { $sort: { date: 1 } },
  ]);

  const byDate = new Map();
  for (const row of mcpDaily) {
    byDate.set(row.date, { ...byDate.get(row.date), ...row.actions });
  }
  for (const row of apiDaily) {
    const existing = byDate.get(row.date) || {};
    const apiPrefixed = Object.fromEntries(
      Object.entries(row.endpoints || {}).map(([k, v]) => [`api_${k}`, v])
    );
    byDate.set(row.date, { ...existing, ...apiPrefixed });
  }

  const daily = Array.from(byDate.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, actions]) => ({ date, ...actions }));

  return { daily };
}
