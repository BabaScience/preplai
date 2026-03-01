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

export const Narration = mongoose.models.Narration ?? mongoose.model('Narration', narrationSchema);
