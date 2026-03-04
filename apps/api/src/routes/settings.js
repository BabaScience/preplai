import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User, ApiKey, UsageLog } from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

function toObjectId(id) {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(toObjectId(req.user.userId))
      .select('_id email name createdAt')
      .lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        created_at: user.createdAt,
      },
    });
  } catch (err) {
    req.log?.error({ err }, 'Get settings failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/settings/profile
router.patch('/profile', async (req, res) => {
  const { name, email } = req.body;

  if (email) {
    const existing = await User.findOne({
      email,
      _id: { $ne: toObjectId(req.user.userId) },
    });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  try {
    const user = await User.findByIdAndUpdate(
      toObjectId(req.user.userId),
      { $set: updates },
      { new: true }
    )
      .select('_id email name createdAt')
      .lean();

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        created_at: user.createdAt,
      },
    });
  } catch (err) {
    req.log?.error({ err }, 'Update profile failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/settings/password
router.patch('/password', async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters' });
  }

  try {
    const user = await User.findById(toObjectId(req.user.userId));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    req.log?.error({ err }, 'Update password failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/settings/account
router.delete('/account', async (req, res) => {
  try {
    const userId = toObjectId(req.user.userId);

    await ApiKey.deleteMany({ userId });
    await UsageLog.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted' });
  } catch (err) {
    req.log?.error({ err }, 'Delete account failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
