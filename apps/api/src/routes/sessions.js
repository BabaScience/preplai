import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiKey, Session, VisualScript, Narration } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

function toObjectId(id) {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

const PLAYER_BASE_URL = process.env.PLAYER_BASE_URL || 'http://localhost:5005';

// GET /api/sessions — list sessions for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);

    const keys = await ApiKey.find({ userId, revoked: false }).select('_id').lean();
    const keyIds = keys.map((k) => k._id.toString());

    if (keyIds.length === 0) {
      return res.json({ sessions: [], total: 0 });
    }

    const sessionDocs = await Session.find({ apiKeyId: { $in: keyIds } })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const visualScripts = await VisualScript.find({
      sessionId: { $in: sessionDocs.map((s) => s.id) },
    }).lean();

    const scriptBySession = new Map();
    for (const vs of visualScripts) {
      let frameCount = 0;
      try {
        const script = JSON.parse(vs.scriptJson || '{}');
        frameCount = script.frames?.length ?? 0;
      } catch {}
      scriptBySession.set(vs.sessionId, frameCount);
    }

    const sessions = sessionDocs.map((s) => ({
      id: s.id,
      title: s.title,
      player_url: `${PLAYER_BASE_URL}/player/${s.id}`,
      frame_count: scriptBySession.get(s.id) ?? 0,
      created_at: new Date(s.createdAt).toISOString(),
    }));

    res.json({ sessions, total: sessions.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/sessions/:id — delete a session
router.delete('/:id', async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId);
    const sessionId = req.params.id;

    const keys = await ApiKey.find({ userId, revoked: false }).select('_id').lean();
    const keyIds = keys.map((k) => k._id.toString());

    const session = await Session.findOne({ id: sessionId }).lean();
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (!keyIds.includes(session.apiKeyId)) {
      return res.status(403).json({ error: 'You do not own this session' });
    }

    await Promise.all([
      Narration.deleteMany({ sessionId }),
      VisualScript.deleteOne({ sessionId }),
      Session.deleteOne({ id: sessionId }),
    ]);

    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
