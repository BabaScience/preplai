/**
 * @preplai/db — VisualScriptHeader model
 *
 * Per-session metadata for the per-frame VisualScript storage.
 * Stores shared script properties (totalDuration, style, frameCount)
 * while individual frames live in VisualScriptFrame documents.
 */
import mongoose from 'mongoose';

const visualScriptHeaderSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  totalDuration: { type: Number, required: true },
  style: { type: String, default: null },
  frameCount: { type: Number, required: true },
  /** JSON string of all non-frame script properties (sceneId, language, etc.) */
  metadataJson: { type: String, default: null },
  updatedAt: { type: Number, required: true },
});

export const VisualScriptHeader =
  mongoose.models.VisualScriptHeader ??
  mongoose.model('VisualScriptHeader', visualScriptHeaderSchema);
