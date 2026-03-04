import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../db.js';

const router = Router();

const DEFAULT_SECRET = 'preplai-dev-secret-change-in-prod';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;

if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEFAULT_SECRET) {
    throw new Error(
      'JWT_SECRET must be set to a secure value in production. Generate with: openssl rand -hex 32'
    );
  }
}

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' });
  }

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name: name || null });

    const token = jwt.sign(
      { userId: user._id.toString(), email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('preplai_session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(201).json({
      token,
      user: { id: user._id.toString(), email, name: user.name || null }
    });
  } catch (err) {
    req.log?.error({ err }, 'Signup failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('preplai_session', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'lax' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.json({
      token,
      user: { id: user._id.toString(), email: user.email, name: user.name }
    });
  } catch (err) {
    req.log?.error({ err }, 'Login failed');
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/logout — clear session cookie
router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('preplai_session', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'lax' : 'lax',
    path: '/',
  });
  res.json({ ok: true });
});

export default router;
