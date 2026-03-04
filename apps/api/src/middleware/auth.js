import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../db.js';
import { apiAuthFailuresTotal } from '../metrics.js';

const JWT_SECRET = process.env.JWT_SECRET || 'preplai-dev-secret-change-in-prod';

/**
 * Require admin role. Accepts Bearer token or preplai_session cookie.
 * Loads user from DB to verify role.
 */
export async function authenticateAdmin(req, res, next) {
  let token = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.slice(7).trim()
    : req.cookies?.preplai_session;

  if (!token) {
    apiAuthFailuresTotal.inc({ reason: 'missing_token' });
    return res.status(401).json({ error: 'Unauthorized', code: 'MISSING_AUTH' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(toObjectId(payload.userId)).select('role').lean();
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required', code: 'FORBIDDEN' });
    }
    req.user = { ...payload, role: user.role };
    next();
  } catch (err) {
    apiAuthFailuresTotal.inc({ reason: 'invalid_token' });
    return res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_AUTH' });
  }
}

function toObjectId(id) {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    apiAuthFailuresTotal.inc({ reason: 'missing_token' });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    apiAuthFailuresTotal.inc({ reason: 'invalid_token' });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
