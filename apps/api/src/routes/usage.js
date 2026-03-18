import { Router } from 'express';
import { TIER_LIMITS } from '@preplai/shared';
import { ApiKey, UsageLog, Session, IllustrationDemand } from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { toObjectId } from '../utils/helpers.js';

function resolveBestTier(tiers) {
  if (tiers.includes('enterprise')) return 'enterprise';
  if (tiers.includes('pro')) return 'pro';
  return 'free';
}

const router = Router();

router.use(authenticate);

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// GET /api/usage/overview - combined overview for dashboard
router.get('/overview', async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId);
    const now = new Date();
    const monthStart = startOfMonth(now);

    const [totalKeys, monthRequests, totalRequests] = await Promise.all([
      ApiKey.countDocuments({ userId, revoked: false }),
      UsageLog.countDocuments({
        userId,
        createdAt: { $gte: monthStart },
      }),
      UsageLog.countDocuments({ userId }),
    ]);

    res.json({
      total_keys: totalKeys,
      month_requests: monthRequests,
      active_keys: totalKeys,
      total_scenes: totalRequests,
    });
  } catch (err) {
    req.log?.error({ err }, 'Usage overview failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/usage - combined usage for dashboard
router.get('/', async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId);
    const now = new Date();
    const monthStart = startOfMonth(now);
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const keys = await ApiKey.find({ userId, revoked: false }).select('_id tier').lean();
    const keyIds = keys.map((k) => k._id.toString());
    const tier = resolveBestTier(keys.map((k) => k.tier || 'free'));

    const [monthScenes, sessionCount, activeKeys, dailyAgg, recentLogs] = await Promise.all([
      UsageLog.countDocuments({ userId, endpoint: 'add_scene', createdAt: { $gte: monthStart } }),
      keyIds.length > 0
        ? Session.countDocuments({ apiKeyId: { $in: keyIds } })
        : 0,
      ApiKey.countDocuments({ userId, revoked: false }),
      UsageLog.aggregate([
        {
          $match: {
            userId,
            endpoint: 'add_scene',
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            requests: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { date: '$_id', requests: 1, _id: 0 } },
      ]),
      UsageLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('apiKeyId', 'keyPrefix')
        .lean(),
    ]);

    const limits = TIER_LIMITS[tier] || TIER_LIMITS.free;

    res.json({
      month_scenes: monthScenes,
      session_count: sessionCount,
      limits: {
        max_scenes_month: limits.maxScenesPerMonth === -1 ? 999999 : limits.maxScenesPerMonth,
        max_sessions: limits.maxSessions === -1 ? 999999 : limits.maxSessions,
        max_scenes_session: limits.maxScenesPerSession === -1 ? 999999 : limits.maxScenesPerSession,
      },
      active_keys: activeKeys,
      daily: dailyAgg.map((r) => ({ day: r.date, count: r.requests })),
      recent: recentLogs.map((r) => ({
        created_at: r.createdAt,
        endpoint: r.endpoint,
        key_display: r.apiKeyId?.keyPrefix || '—',
      })),
    });
  } catch (err) {
    req.log?.error({ err }, 'Usage list failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/usage/summary
router.get('/summary', async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId);
    const now = new Date();
    const monthStart = startOfMonth(now);

    const [totals, thisMonth] = await Promise.all([
      UsageLog.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            total_requests: { $sum: 1 },
            total_tokens: { $sum: '$tokensUsed' },
          },
        },
        { $project: { _id: 0 } },
      ]).then((r) => r[0] || { total_requests: 0, total_tokens: 0 }),
      UsageLog.aggregate([
        { $match: { userId, createdAt: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            total_requests: { $sum: 1 },
            total_tokens: { $sum: '$tokensUsed' },
          },
        },
        { $project: { _id: 0 } },
      ]).then((r) => r[0] || { total_requests: 0, total_tokens: 0 }),
    ]);

    res.json({
      allTime: totals,
      thisMonth,
    });
  } catch (err) {
    req.log?.error({ err }, 'Usage summary failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/usage/daily
router.get('/daily', async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId);
    const days = Math.min(parseInt(req.query.days) || 30, 90);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const daily = await UsageLog.aggregate([
      { $match: { userId, createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          requests: { $sum: 1 },
          tokens: { $sum: '$tokensUsed' },
        },
      },
      { $sort: { _id: 1 } },
      { $project: { date: '$_id', requests: 1, tokens: 1, _id: 0 } },
    ]);

    res.json({ daily });
  } catch (err) {
    req.log?.error({ err }, 'Usage daily failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/usage/logs
router.get('/logs', async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = parseInt(req.query.offset) || 0;

    const [logs, total] = await Promise.all([
      UsageLog.find({ userId })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .populate('apiKeyId', 'name keyPrefix')
        .lean(),
      UsageLog.countDocuments({ userId }),
    ]);

    res.json({
      logs: logs.map((l) => ({
        id: l._id.toString(),
        endpoint: l.endpoint,
        tokens_used: l.tokensUsed || 0,
        created_at: l.createdAt,
        api_key_name: l.apiKeyId?.name,
        key_prefix: l.apiKeyId?.keyPrefix,
      })),
      total,
    });
  } catch (err) {
    req.log?.error({ err }, 'Usage logs failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/usage/illustrations — illustration demand tracking
router.get('/illustrations', async (req, res) => {
  try {
    const [topRequested, topUsed, totalUnknown, totalKnown, genericFallbacks] = await Promise.all([
      // Top 20 missing/unknown types by request count
      IllustrationDemand.find({ source: 'unknown_type' })
        .sort({ requestCount: -1 })
        .limit(20)
        .lean(),
      // Top 20 known types by request count
      IllustrationDemand.find({ source: 'known_type' })
        .sort({ requestCount: -1 })
        .limit(20)
        .lean(),
      // Total count of unknown types
      IllustrationDemand.countDocuments({ source: 'unknown_type' }),
      // Total count of known types tracked
      IllustrationDemand.countDocuments({ source: 'known_type' }),
      // Top 20 generic fallbacks
      IllustrationDemand.find({ source: 'generic_fallback' })
        .sort({ requestCount: -1 })
        .limit(20)
        .lean(),
    ]);

    const format = (doc) => ({
      typeName: doc.typeName,
      requestCount: doc.requestCount,
      uniqueUsers: doc.uniqueUsers?.length ?? 0,
      source: doc.source,
      sampleLabels: doc.sampleLabels?.slice(0, 5) ?? [],
      firstSeen: doc.firstSeen,
      lastSeen: doc.lastSeen,
    });

    res.json({
      top_requested: topRequested.map(format),
      top_used: topUsed.map(format),
      generic_fallbacks: genericFallbacks.map(format),
      total_unknown_types: totalUnknown,
      total_known_types: totalKnown,
    });
  } catch (err) {
    req.log?.error({ err }, 'Illustration demand query failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
