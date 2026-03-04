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
  },
  { timestamps: true }
);

export const User = mongoose.models.User ?? mongoose.model('User', userSchema);
