/**
 * @preplai/db — Session model (MCP presentation sessions)
 */
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  aspectRatio: { type: String, default: '16:9' },
  apiKeyId: { type: String, default: null },
  createdAt: { type: Number, required: true },
});

export const Session = mongoose.models.Session ?? mongoose.model('Session', sessionSchema);
