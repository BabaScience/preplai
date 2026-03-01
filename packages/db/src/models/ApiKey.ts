/**
 * @preplai/db — Unified ApiKey model (shared by apps/api and packages/mcp-server)
 */
import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true },
    keyPrefix: { type: String, required: true },
    ownerEmail: { type: String, required: true },
    tier: { type: String, default: 'free' },
    revoked: { type: Boolean, default: false },
    lastUsedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

apiKeySchema.index({ userId: 1 });
apiKeySchema.index({ ownerEmail: 1 });

export const ApiKey = mongoose.models.ApiKey ?? mongoose.model('ApiKey', apiKeySchema);
