/**
 * @preplai/db — User model (dashboard users)
 */
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    name: { type: String, default: null },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    emailVerified: { type: Boolean, default: true },
    playerTheme: { type: String, enum: ['cinema', 'minimal'], default: 'cinema' },
    playerPalette: {
      type: String,
      enum: ['default', 'ocean', 'sunset', 'forest', 'mono'],
      default: 'default',
    },
  },
  { timestamps: true }
);

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);
