import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../db.js';
import { sendVerificationEmail } from '../services/email.js';

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
    const user = await User.create({
      email,
      passwordHash,
      name: name || null,
      emailVerified: false,
    });

    const verifyToken = jwt.sign(
      { userId: user._id.toString(), purpose: 'verify-email' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    sendVerificationEmail({ to: email, name: user.name, verifyToken }).catch((err) =>
      req.log?.warn({ err, email }, 'Verification email failed')
    );

    res.status(201).json({
      emailVerificationRequired: true,
      user: { id: user._id.toString(), email, name: user.name || null },
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

    if (!user.emailVerified) {
      return res.status(403).json({
        error: 'Please verify your email first',
        code: 'EMAIL_NOT_VERIFIED',
      });
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

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.purpose !== 'verify-email') {
      return res.status(400).json({ error: 'Invalid token' });
    }

    const user = await User.findByIdAndUpdate(
      payload.userId,
      { emailVerified: true },
      { new: true }
    );

    if (!user) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    res.json({ message: 'Email verified' });
  } catch (err) {
    req.log?.warn({ err }, 'Verify email failed');
    res.status(400).json({ error: 'Invalid or expired token' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ message: 'If that email exists, a verification link was sent' });
    }

    if (user.emailVerified) {
      return res.json({ message: 'Email is already verified' });
    }

    const verifyToken = jwt.sign(
      { userId: user._id.toString(), purpose: 'verify-email' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    sendVerificationEmail({ to: email, name: user.name, verifyToken }).catch((err) =>
      req.log?.warn({ err, email }, 'Resend verification email failed')
    );

    res.json({ message: 'If that email exists, a verification link was sent' });
  } catch (err) {
    req.log?.error({ err }, 'Resend verification failed');
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
