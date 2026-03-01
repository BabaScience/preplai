/**
 * @preplai/db — VisualScript model (MCP session scripts)
 */
import mongoose from 'mongoose';

const visualScriptSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  scriptJson: { type: String, required: true },
  updatedAt: { type: Number, required: true },
});

export const VisualScript = mongoose.models.VisualScript ?? mongoose.model('VisualScript', visualScriptSchema);
