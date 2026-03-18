/**
 * @preplai/db — Illustration demand tracking
 *
 * Tracks entity type usage across presentations:
 * - known_type: popularity ranking of existing illustrations
 * - unknown_type: demand signal for illustrations we don't have yet
 * - generic_fallback: when Concept/Entity/Group are used as substitutes
 */
import mongoose from 'mongoose';

const illustrationDemandSchema = new mongoose.Schema({
  typeName: { type: String, required: true, unique: true },
  requestCount: { type: Number, default: 0 },
  uniqueUsers: { type: [String], default: [] },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  sampleLabels: { type: [String], default: [] },
  source: {
    type: String,
    enum: ['known_type', 'unknown_type', 'generic_fallback'],
    required: true,
  },
});

illustrationDemandSchema.index({ requestCount: -1 });
illustrationDemandSchema.index({ source: 1, requestCount: -1 });

export const IllustrationDemand =
  mongoose.models.IllustrationDemand ?? mongoose.model('IllustrationDemand', illustrationDemandSchema);
