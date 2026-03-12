/**
 * @preplai/db — OAuth Client model (for Claude Web connector, etc.)
 */
import mongoose from 'mongoose';

const oauthClientSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, unique: true },
    clientSecretHash: { type: String, required: true },
    name: { type: String, required: true },
    redirectUris: { type: [String], required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // null for DCR-registered clients
  },
  { timestamps: true }
);

oauthClientSchema.index({ userId: 1 });

export const OAuthClient =
  mongoose.models.OAuthClient ?? mongoose.model('OAuthClient', oauthClientSchema);
