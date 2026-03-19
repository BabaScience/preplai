import { Router } from 'express';
import express from 'express';
import { FeedbackReport, ContactSubmission } from '../db.js';
import { authenticate, authenticateAdmin } from '../middleware/auth.js';

const router = Router();

// Increase body limit for image uploads on feedback route
router.use('/feedback', express.json({ limit: '6mb' }));

// POST /api/support/feedback — submit feedback (authenticated users)
router.post('/feedback', authenticate, async (req, res) => {
  try {
    const { type, description, pageUrl, sessionId, browserInfo, imageData } = req.body;
    if (!type || !description) return res.status(400).json({ error: 'type and description required' });

    // Validate image size (max 5MB base64)
    if (imageData && imageData.length > 7_000_000) {
      return res.status(400).json({ error: 'Image too large (max 5MB)' });
    }

    const report = await FeedbackReport.create({
      userId: req.user.userId,
      email: req.user.email,
      type,
      description,
      pageUrl,
      sessionId,
      browserInfo,
      imageData: imageData || null,
      source: 'dashboard',
    });
    res.json({ success: true, id: report._id });
  } catch (err) {
    req.log?.error({ err }, 'Feedback submission failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/support/contact — submit contact form (public, no auth required)
router.post('/contact', async (req, res) => {
  try {
    const { name, email, company, useCase, message } = req.body;
    if (!name || !email || !message) return res.status(400).json({ error: 'name, email, and message required' });

    const submission = await ContactSubmission.create({ name, email, company, useCase, message });
    res.json({ success: true, id: submission._id });
  } catch (err) {
    req.log?.error({ err }, 'Contact submission failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/support/feedback — list all feedback (admin only)
router.get('/feedback', authenticateAdmin, async (req, res) => {
  try {
    const status = req.query.status;
    const filter = status ? { status } : {};
    const reports = await FeedbackReport.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    const total = await FeedbackReport.countDocuments(filter);
    res.json({ reports, total });
  } catch (err) {
    req.log?.error({ err }, 'Feedback list failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/support/feedback/:id/status — update status (admin only)
router.patch('/feedback/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'in_progress', 'resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await FeedbackReport.updateOne({ _id: req.params.id }, { $set: { status } });
    res.json({ success: true });
  } catch (err) {
    req.log?.error({ err }, 'Feedback status update failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/support/contacts — list all contact submissions (admin only)
router.get('/contacts', authenticateAdmin, async (req, res) => {
  try {
    const status = req.query.status;
    const filter = status ? { status } : {};
    const submissions = await ContactSubmission.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    const total = await ContactSubmission.countDocuments(filter);
    res.json({ submissions, total });
  } catch (err) {
    req.log?.error({ err }, 'Contact list failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/support/contacts/:id/status — update status (admin only)
router.patch('/contacts/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['new', 'responded', 'closed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    await ContactSubmission.updateOne({ _id: req.params.id }, { $set: { status } });
    res.json({ success: true });
  } catch (err) {
    req.log?.error({ err }, 'Contact status update failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
