import { Router } from 'express';
import { BetaSurvey, Session, ApiKey } from '../db.js';
import { authenticate, authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/survey/status — check if user should see survey + whether already completed
router.get('/status', authenticate, async (req, res) => {
  try {
    const existing = await BetaSurvey.findOne({ userId: req.user.userId }).lean();
    if (existing) {
      return res.json({ completed: true, shouldShow: false });
    }

    // Count user's sessions via their API keys
    const keys = await ApiKey.find({ userId: req.user.userId }).lean();
    const keyIds = keys.map((k) => k._id.toString());
    const sessionCount = keyIds.length > 0
      ? await Session.countDocuments({ apiKeyId: { $in: keyIds } })
      : 0;

    res.json({
      completed: false,
      shouldShow: sessionCount >= 3,
      sessionCount,
    });
  } catch (err) {
    req.log?.error({ err }, 'Survey status check failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/survey — submit beta survey
router.post('/', authenticate, async (req, res) => {
  try {
    const existing = await BetaSurvey.findOne({ userId: req.user.userId });
    if (existing) {
      return res.status(409).json({ error: 'Survey already submitted' });
    }

    const { overallExperience, easeOfUse, visualQuality, wouldRecommend, openFeedback } = req.body;

    // Validate required fields
    for (const [field, val] of Object.entries({ overallExperience, easeOfUse, visualQuality })) {
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1 || n > 5) {
        return res.status(400).json({ error: `${field} must be an integer between 1 and 5` });
      }
    }
    if (!['yes', 'maybe', 'no'].includes(wouldRecommend)) {
      return res.status(400).json({ error: 'wouldRecommend must be "yes", "maybe", or "no"' });
    }
    if (openFeedback && openFeedback.length > 2000) {
      return res.status(400).json({ error: 'openFeedback must be 2000 characters or less' });
    }

    // Count sessions at time of survey
    const keys = await ApiKey.find({ userId: req.user.userId }).lean();
    const keyIds = keys.map((k) => k._id.toString());
    const sessionCount = keyIds.length > 0
      ? await Session.countDocuments({ apiKeyId: { $in: keyIds } })
      : 0;

    const survey = await BetaSurvey.create({
      userId: req.user.userId,
      answers: {
        overallExperience: Number(overallExperience),
        easeOfUse: Number(easeOfUse),
        visualQuality: Number(visualQuality),
        wouldRecommend,
        openFeedback: openFeedback?.trim() || null,
      },
      sessionCountAtSurvey: sessionCount,
    });

    res.json({ success: true, id: survey._id });
  } catch (err) {
    req.log?.error({ err }, 'Survey submission failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/survey — admin: list all survey responses with aggregates
router.get('/', authenticateAdmin, async (req, res) => {
  try {
    const surveys = await BetaSurvey.find().sort({ createdAt: -1 }).limit(200).lean();
    const total = await BetaSurvey.countDocuments();

    // Compute averages
    const agg = await BetaSurvey.aggregate([
      {
        $group: {
          _id: null,
          avgOverall: { $avg: '$answers.overallExperience' },
          avgEase: { $avg: '$answers.easeOfUse' },
          avgVisual: { $avg: '$answers.visualQuality' },
        },
      },
    ]);
    const averages = agg[0] || { avgOverall: 0, avgEase: 0, avgVisual: 0 };

    res.json({ surveys, total, averages });
  } catch (err) {
    req.log?.error({ err }, 'Admin survey list failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
