/**
 * @preplai/db — Session rating model (thumbs up/down + optional comment per session)
 */
import mongoose from 'mongoose';

const sessionRatingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  sessionId: { type: String, required: true },
  rating: { type: String, enum: ['up', 'down'], required: true },
  comment: { type: String, default: null, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

sessionRatingSchema.index({ userId: 1, sessionId: 1 }, { unique: true });
sessionRatingSchema.index({ sessionId: 1 });
sessionRatingSchema.index({ createdAt: -1 });

export const SessionRating =
  mongoose.models.SessionRating ?? mongoose.model('SessionRating', sessionRatingSchema);
