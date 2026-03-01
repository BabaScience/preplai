import { Router } from 'express';
import crypto from 'crypto';
import { getDb } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// GET /api/keys
router.get('/', (req, res) => {
  const db = getDb();
  const keys = db.prepare(
    'SELECT id, name, key_prefix, created_at, last_used_at FROM api_keys WHERE user_id = ? ORDER BY created_at DESC'
  ).all(req.user.userId);
  res.json({ keys });
});

// POST /api/keys
router.post('/', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Key name is required' });
  }

  const db = getDb();

  // Limit: 10 keys per user
  const count = db.prepare('SELECT COUNT(*) as cnt FROM api_keys WHERE user_id = ?').get(req.user.userId);
  if (count.cnt >= 10) {
    return res.status(400).json({ error: 'Maximum of 10 API keys allowed' });
  }

  const rawKey = 'pk_' + crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const keyPrefix = rawKey.substring(0, 10);

  const result = db.prepare(
    'INSERT INTO api_keys (user_id, name, key_hash, key_prefix) VALUES (?, ?, ?, ?)'
  ).run(req.user.userId, name.trim(), keyHash, keyPrefix);

  res.status(201).json({
    key: {
      id: result.lastInsertRowid,
      name: name.trim(),
      key_prefix: keyPrefix,
      created_at: new Date().toISOString(),
      rawKey // returned only once
    }
  });
});

// DELETE /api/keys/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const key = db.prepare('SELECT id FROM api_keys WHERE id = ? AND user_id = ?').get(req.params.id, req.user.userId);
  if (!key) {
    return res.status(404).json({ error: 'API key not found' });
  }

  db.prepare('DELETE FROM api_keys WHERE id = ?').run(req.params.id);
  res.json({ message: 'API key deleted' });
});

export default router;
