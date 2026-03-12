import { Router } from 'express';
import crypto from 'crypto';
import { ApiKey } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();
const KEY_PREFIX = 'plai_';

router.use(authenticate);

// GET /api/keys
router.get('/', async (req, res) => {
  try {
    const keys = await ApiKey.find({ userId: req.user.userId, revoked: false })
      .sort({ createdAt: -1 })
      .select('_id name keyPrefix createdAt lastUsedAt tier')
      .lean();

    res.json({
      keys: keys.map((k) => ({
        id: k._id.toString(),
        name: k.name,
        key_prefix: k.keyPrefix,
        key_display: k.keyPrefix ? `${k.keyPrefix}...` : '—',
        created_at: k.createdAt,
        last_used_at: k.lastUsedAt,
        tier: k.tier || 'free',
        status: 'active',
      })),
    });
  } catch (err) {
    req.log?.error({ err }, 'List keys failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/keys
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Key name is required' });
  }

  try {
    const count = await ApiKey.countDocuments({ userId: req.user.userId, revoked: false });
    if (count >= 10) {
      return res.status(400).json({ error: 'Maximum of 10 access tokens allowed' });
    }

    const rawKey = KEY_PREFIX + crypto.randomBytes(20).toString('hex');
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 12);

    const key = await ApiKey.create({
      userId: req.user.userId,
      name: name.trim(),
      keyHash,
      keyPrefix,
      ownerEmail: req.user.email,
      tier: 'free',
    });

    res.status(201).json({
      key: {
        id: key._id.toString(),
        name: name.trim(),
        key_prefix: keyPrefix,
        created_at: key.createdAt,
        rawKey,
      },
    });
  } catch (err) {
    req.log?.error({ err }, 'Create key failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/keys/:id
router.patch('/:id', async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Key name is required' });
  }

  try {
    const key = await ApiKey.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId, revoked: false },
      { $set: { name: name.trim() } },
      { new: true, select: '_id name' },
    );
    if (!key) {
      return res.status(404).json({ error: 'Access token not found' });
    }
    res.json({ message: 'Token renamed', name: key.name });
  } catch (err) {
    req.log?.error({ err }, 'Rename key failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/keys/:id
router.delete('/:id', async (req, res) => {
  try {
    const key = await ApiKey.findOne({
      _id: req.params.id,
      userId: req.user.userId,
    });
    if (!key) {
      return res.status(404).json({ error: 'Access token not found' });
    }

    key.revoked = true;
    await key.save();

    res.json({ message: 'Access token deleted' });
  } catch (err) {
    req.log?.error({ err }, 'Delete key failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
