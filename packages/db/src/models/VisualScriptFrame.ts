/**
 * @preplai/db — VisualScriptFrame model
 *
 * Stores individual presentation frames as separate documents
 * for O(1) appends and per-frame updates (e.g. after TTS generation).
 */
import mongoose from 'mongoose';

const visualScriptFrameSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  frameIndex: { type: Number, required: true },
  frameJson: { type: String, required: true },
  updatedAt: { type: Number, required: true },
});

// Compound unique index for direct frame access and upsert semantics
visualScriptFrameSchema.index({ sessionId: 1, frameIndex: 1 }, { unique: true });

export const VisualScriptFrame =
  mongoose.models.VisualScriptFrame ??
  mongoose.model('VisualScriptFrame', visualScriptFrameSchema);
