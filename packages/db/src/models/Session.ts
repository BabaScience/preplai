/**
 * @preplai/db — Session model (MCP presentation sessions)
 */
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  aspectRatio: { type: String, default: '16:9' },
  apiKeyId: { type: String, default: null },
  category: { type: String, default: 'uncategorized' },
  entityDistribution: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Number, required: true },
});

sessionSchema.index({ category: 1 });

export const Session = mongoose.models.Session ?? mongoose.model('Session', sessionSchema);
