/**
 * OAuth client management — mounted at /api for frontend
 */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuthClient } from '../db.js';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'preplai-dev-secret-change-in-prod';
const CLIENT_ID_PREFIX = 'plai_oauth_';

function hashSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function generateClientId() {
  return CLIENT_ID_PREFIX + crypto.randomBytes(16).toString('hex');
}

function generateClientSecret() {
  return crypto.randomBytes(32).toString('hex');
}

router.post('/oauth/clients', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const { name, redirectUris } = req.body || {};
  if (!name || !Array.isArray(redirectUris) || redirectUris.length === 0) {
    return res.status(400).json({
      error: 'name and redirectUris (array) are required',
    });
  }

  const clientId = generateClientId();
  const clientSecret = generateClientSecret();
  const clientSecretHash = hashSecret(clientSecret);

  await OAuthClient.create({
    clientId,
    clientSecretHash,
    name,
    redirectUris,
    userId: payload.userId,
  });

  res.status(201).json({
    clientId,
    clientSecret,
    name,
    redirectUris,
    message: 'Store the client secret securely — it cannot be retrieved again.',
  });
});

router.get('/oauth/clients', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const clients = await OAuthClient.find({ userId: payload.userId })
    .select('clientId name redirectUris createdAt')
    .lean();
  res.json({ clients });
});

export default router;
