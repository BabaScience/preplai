/**
 * @preplai/db — UsageLog model (dashboard usage_logs)
 */
import mongoose from 'mongoose';

const usageLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    apiKeyId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiKey', default: null },
    endpoint: { type: String, required: true },
    tokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
);

usageLogSchema.index({ userId: 1 });
usageLogSchema.index({ apiKeyId: 1 });

export const UsageLog = mongoose.models.UsageLog ?? mongoose.model('UsageLog', usageLogSchema);
