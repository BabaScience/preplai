/**
 * @preplai/db — OAuth Refresh Token (opaque, revocable)
 *
 * Stores SHA-256 hashes of refresh tokens. Raw tokens are never persisted.
 * Supports rotation: when a refresh token is used, the old one is revoked
 * and a new one is issued.
 */
import mongoose from 'mongoose';

const oauthRefreshTokenSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true }, // SHA-256 hash
    clientId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    scope: { type: String, default: '' },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

oauthRefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
oauthRefreshTokenSchema.index({ clientId: 1, userId: 1 });

export const OAuthRefreshToken =
  mongoose.models.OAuthRefreshToken ?? mongoose.model('OAuthRefreshToken', oauthRefreshTokenSchema);
