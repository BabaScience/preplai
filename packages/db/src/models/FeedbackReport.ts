/**
 * @preplai/db — Feedback report model (bug reports, feature requests, general feedback)
 */
import mongoose from 'mongoose';

const feedbackReportSchema = new mongoose.Schema({
  userId: { type: String, default: null },
  email: { type: String, default: null },
  type: {
    type: String,
    enum: ['bug', 'feature', 'other'],
    required: true,
  },
  description: { type: String, required: true },
  pageUrl: { type: String, default: null },
  sessionId: { type: String, default: null },
  presentationTitle: { type: String, default: null },
  browserInfo: { type: String, default: null },
  imageData: { type: String, default: null },
  source: { type: String, enum: ['dashboard', 'player'], default: 'dashboard' },
  status: {
    type: String,
    enum: ['new', 'in_progress', 'resolved', 'dismissed'],
    default: 'new',
  },
  createdAt: { type: Date, default: Date.now },
});

feedbackReportSchema.index({ status: 1, createdAt: -1 });
feedbackReportSchema.index({ userId: 1 });

export const FeedbackReport =
  mongoose.models.FeedbackReport ?? mongoose.model('FeedbackReport', feedbackReportSchema);
