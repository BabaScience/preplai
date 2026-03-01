import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiKey, UsageLog } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

function toObjectId(id) {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

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
      active_sessions: totalKeys,
      total_scenes: totalRequests,
    });
  } catch (err) {
    console.error(err);
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

    const [monthData, activeKeys, dailyAgg, recentLogs] = await Promise.all([
      UsageLog.countDocuments({ userId, createdAt: { $gte: monthStart } }),
      ApiKey.countDocuments({ userId, revoked: false }),
      UsageLog.aggregate([
        { $match: { userId: userId, createdAt: { $gte: thirtyDaysAgo } } },
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

    res.json({
      month_scenes: monthData,
      limits: {
        max_scenes_month: 100,
        max_sessions: 10,
        max_scenes_session: 10,
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
    console.error(err);
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
    console.error(err);
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
    console.error(err);
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
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
