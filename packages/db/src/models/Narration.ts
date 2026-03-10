/**
 * @preplai/db — Narration model (MCP narrations)
 */
import mongoose from 'mongoose';

const narrationSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sessionId: { type: String, required: true },
  frameIndex: { type: Number, default: 0 },
  text: { type: String, required: true },
  createdAt: { type: Number, required: true },
});

// ── Indexes ──────────────────────────────────────────────────────────
// Simple index for session lookups (list all narrations in a session)
narrationSchema.index({ sessionId: 1 });
// Compound index for direct frame access (e.g., GET /narration/:sessionId/:frameIndex)
narrationSchema.index({ sessionId: 1, frameIndex: 1 });

export const Narration = mongoose.models.Narration ?? mongoose.model('Narration', narrationSchema);
