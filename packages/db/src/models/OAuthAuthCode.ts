/**
 * @preplai/db — OAuth Authorization Code (short-lived, for code exchange)
 */
import mongoose from 'mongoose';

const oauthAuthCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    clientId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    codeChallenge: { type: String, required: true },
    codeChallengeMethod: { type: String, required: true, default: 'S256' },
    scope: { type: String, default: '' },
    resource: { type: String, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

oauthAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OAuthAuthCode =
  mongoose.models.OAuthAuthCode ?? mongoose.model('OAuthAuthCode', oauthAuthCodeSchema);
