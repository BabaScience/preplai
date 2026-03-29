import { Router } from 'express';
import { SessionRating, Session } from '../db.js';
import { authenticate, authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// PUT /api/ratings/:sessionId — upsert a session rating (thumbs up/down + optional comment)
router.put('/:sessionId', authenticate, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { rating, comment } = req.body;

    if (!['up', 'down'].includes(rating)) {
      return res.status(400).json({ error: 'rating must be "up" or "down"' });
    }
    if (comment && comment.length > 1000) {
      return res.status(400).json({ error: 'comment must be 1000 characters or less' });
    }

    const result = await SessionRating.findOneAndUpdate(
      { userId: req.user.userId, sessionId },
      {
        userId: req.user.userId,
        sessionId,
        rating,
        comment: comment?.trim() || null,
        updatedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, rating: result });
  } catch (err) {
    req.log?.error({ err }, 'Session rating failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ratings/:sessionId — get current user's rating for a session
router.get('/:sessionId', authenticate, async (req, res) => {
  try {
    const rating = await SessionRating.findOne({
      userId: req.user.userId,
      sessionId: req.params.sessionId,
    }).lean();
    res.json({ rating: rating || null });
  } catch (err) {
    req.log?.error({ err }, 'Get session rating failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/ratings/:sessionId — remove user's rating for a session
router.delete('/:sessionId', authenticate, async (req, res) => {
  try {
    await SessionRating.deleteOne({
      userId: req.user.userId,
      sessionId: req.params.sessionId,
    });
    res.json({ success: true });
  } catch (err) {
    req.log?.error({ err }, 'Delete session rating failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/ratings — admin: list all ratings with aggregates
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const ratings = await SessionRating.find().sort({ createdAt: -1 }).limit(200).lean();
    const total = await SessionRating.countDocuments();
    const upCount = await SessionRating.countDocuments({ rating: 'up' });
    const downCount = await SessionRating.countDocuments({ rating: 'down' });
    res.json({ ratings, total, upCount, downCount });
  } catch (err) {
    req.log?.error({ err }, 'Admin ratings list failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
