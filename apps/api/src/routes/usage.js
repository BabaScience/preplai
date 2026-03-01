import { Router } from 'express';
import { getDb } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/usage/summary
router.get('/summary', (req, res) => {
  const db = getDb();
  const userId = req.user.userId;

  const totals = db.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      COALESCE(SUM(tokens_used), 0) as total_tokens
    FROM usage_logs WHERE user_id = ?
  `).get(userId);

  const thisMonth = db.prepare(`
    SELECT 
      COUNT(*) as total_requests,
      COALESCE(SUM(tokens_used), 0) as total_tokens
    FROM usage_logs 
    WHERE user_id = ? 
      AND strftime('%Y-%m', created_at) = strftime('%Y-%m', 'now')
  `).get(userId);

  res.json({
    allTime: totals,
    thisMonth
  });
});

// GET /api/usage/daily
router.get('/daily', (req, res) => {
  const db = getDb();
  const userId = req.user.userId;
  const days = Math.min(parseInt(req.query.days) || 30, 90);

  const rows = db.prepare(`
    SELECT 
      strftime('%Y-%m-%d', created_at) as date,
      COUNT(*) as requests,
      COALESCE(SUM(tokens_used), 0) as tokens
    FROM usage_logs
    WHERE user_id = ? AND created_at >= date('now', '-' || ? || ' days')
    GROUP BY date
    ORDER BY date ASC
  `).all(userId, days);

  res.json({ daily: rows });
});

// GET /api/usage/logs
router.get('/logs', (req, res) => {
  const db = getDb();
  const userId = req.user.userId;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = parseInt(req.query.offset) || 0;

  const logs = db.prepare(`
    SELECT ul.id, ul.endpoint, ul.tokens_used, ul.created_at,
           ak.name as api_key_name, ak.key_prefix
    FROM usage_logs ul
    LEFT JOIN api_keys ak ON ul.api_key_id = ak.id
    WHERE ul.user_id = ?
    ORDER BY ul.created_at DESC
    LIMIT ? OFFSET ?
  `).all(userId, limit, offset);

  const total = db.prepare('SELECT COUNT(*) as cnt FROM usage_logs WHERE user_id = ?').get(userId);

  res.json({ logs, total: total.cnt });
});

export default router;
