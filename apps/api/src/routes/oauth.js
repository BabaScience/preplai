/**
 * OAuth 2.1 server for MCP / Claude Web connector
 * Implements: RFC 8414 (AS metadata), RFC 9728 (PRM), authorization code + PKCE,
 *             RFC 7009 (Token Revocation), RFC 7591 (Dynamic Client Registration)
 */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuthClient, OAuthAuthCode, OAuthRefreshToken, User, ApiKey } from '../db.js';
import { getApiBase, getWebsiteBase, getMcpResource, hashSecret } from '@preplai/shared/node';

const router = Router();

const DEFAULT_SECRET = 'preplai-dev-secret-change-in-prod';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEFAULT_SECRET) {
      throw new Error('JWT_SECRET must be set to a secure value in production');
    }
  }
  return secret || DEFAULT_SECRET;
}

const JWT_SECRET = getJwtSecret();

function generateAuthCode() {
  return crypto.randomBytes(32).toString('hex');
}

function generateRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Issue a new refresh token, store its hash, and return the raw token.
 */
async function issueRefreshToken(clientId, userId, scope) {
  const raw = generateRefreshToken();
  const hashed = hashSecret(raw);
  await OAuthRefreshToken.create({
    token: hashed,
    clientId,
    userId,
    scope: scope || '',
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
  });
  return raw;
}

/**
 * Generate a JWT access token.
 */
function issueAccessToken(userId, aud, scope) {
  const API_BASE = getApiBase();
  return jwt.sign(
    {
      sub: userId.toString(),
      aud,
      iss: API_BASE,
      scope: scope || 'mcp:preplai',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Parse client credentials from request body and/or Basic auth header.
 */
function parseClientCredentials(req) {
  const contentType = req.headers['content-type'] || '';
  let clientId, clientSecret;

  if (contentType.includes('application/json')) {
    clientId = req.body?.client_id;
    clientSecret = req.body?.client_secret;
  } else {
    clientId = req.body?.client_id;
    clientSecret = req.body?.client_secret;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [cid, csecret] = decoded.split(':');
    if (cid && !clientId) clientId = cid;
    if (csecret && !clientSecret) clientSecret = csecret;
  }

  return { clientId, clientSecret };
}

/**
 * Validate client credentials. Returns client doc or null.
 */
async function validateClient(clientId, clientSecret) {
  if (!clientId || !clientSecret) return null;
  const client = await OAuthClient.findOne({ clientId });
  if (!client) return null;
  const secretHash = hashSecret(clientSecret);
  if (secretHash !== client.clientSecretHash) return null;
  return client;
}

// Optional auth: cookie or Bearer (for authorize flow)
function optionalAuth(req, res, next) {
  const token =
    req.cookies?.preplai_session ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : null);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    next();
  }
}

// ── Well-known: OAuth Authorization Server Metadata (RFC 8414) ─────────

router.get('/.well-known/oauth-authorization-server', (req, res) => {
  const API_BASE = getApiBase();
  res.json({
    issuer: API_BASE,
    authorization_endpoint: `${API_BASE}/oauth/authorize`,
    token_endpoint: `${API_BASE}/oauth/token`,
    registration_endpoint: `${API_BASE}/oauth/register`,
    revocation_endpoint: `${API_BASE}/oauth/revoke`,
    jwks_uri: `${API_BASE}/oauth/jwks`,
    scopes_supported: ['mcp:preplai'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    revocation_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
    logo_uri: `${API_BASE}/favicon.svg`,
  });
});

// JWKS (minimal - we use symmetric secret; some clients expect this)
router.get('/oauth/jwks', (req, res) => {
  res.json({ keys: [] });
});

// ── Authorization endpoint ──────────────────────────────────────────────

router.get('/oauth/authorize', optionalAuth, async (req, res) => {
  const API_BASE = getApiBase();
  const WEBSITE_BASE = getWebsiteBase();
  const {
    client_id,
    redirect_uri,
    response_type,
    scope,
    state,
    code_challenge,
    code_challenge_method,
    resource,
  } = req.query;

  if (!client_id || !redirect_uri || response_type !== 'code') {
    return res.status(400).send(
      '<!DOCTYPE html><html><body><p>Invalid request: client_id, redirect_uri, and response_type=code are required.</p></body></html>'
    );
  }

  const client = await OAuthClient.findOne({ clientId: client_id });
  if (!client) {
    return res.status(400).send(
      '<!DOCTYPE html><html><body><p>Invalid client_id.</p></body></html>'
    );
  }

  if (!client.redirectUris.includes(redirect_uri)) {
    return res.status(400).send(
      '<!DOCTYPE html><html><body><p>redirect_uri not registered for this client.</p></body></html>'
    );
  }

  if (!code_challenge || code_challenge_method !== 'S256') {
    return res.status(400).send(
      '<!DOCTYPE html><html><body><p>PKCE required: code_challenge and code_challenge_method=S256.</p></body></html>'
    );
  }

  const approve = req.query.approve === 'true';

  if (!req.user) {
    const returnTo = `${API_BASE}/oauth/authorize?${new URLSearchParams(req.query).toString()}`;
    const loginUrl = `${WEBSITE_BASE}/login?return_to=${encodeURIComponent(returnTo)}`;
    return res.redirect(loginUrl);
  }

  if (approve) {
    const code = generateAuthCode();
    await OAuthAuthCode.create({
      code,
      clientId: client_id,
      redirectUri: redirect_uri,
      userId: req.user.userId,
      codeChallenge: code_challenge,
      codeChallengeMethod: code_challenge_method,
      scope: scope || '',
      resource: resource || null,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
    });

    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (state) redirectUrl.searchParams.set('state', state);
    return res.redirect(redirectUrl.toString());
  }

  const deny = req.query.deny === 'true';
  if (deny) {
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('error', 'access_denied');
    if (state) redirectUrl.searchParams.set('state', state);
    return res.redirect(redirectUrl.toString());
  }

  // Consent page — escape client name to prevent XSS
  const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
  const safeName = escapeHtml(client.name);

  const params = new URLSearchParams(req.query);
  params.set('approve', 'true');
  const approveUrl = `${API_BASE}/oauth/authorize?${params.toString()}`;
  params.delete('approve');
  params.set('deny', 'true');
  const denyUrl = `${API_BASE}/oauth/authorize?${params.toString()}`;

  res.send(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <title>Authorize preplai</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 400px; margin: 60px auto; padding: 20px; }
    h1 { font-size: 1.25rem; }
    .buttons { display: flex; gap: 12px; margin-top: 24px; }
    a { font-size: 1rem; padding: 10px 20px; text-decoration: none; border-radius: 4px; }
    .approve { background: #111; color: #fff; }
    .deny { background: #eee; color: #333; }
  </style>
</head>
<body>
  <h1>Authorize ${safeName}</h1>
  <p>${safeName} wants to access your preplai account.</p>
  <p>This will allow it to create and manage presentations on your behalf.</p>
  <div class="buttons">
    <a href="${approveUrl}" class="approve">Approve</a>
    <a href="${denyUrl}" class="deny">Deny</a>
  </div>
</body>
</html>
  `);
});

// ── Token endpoint ──────────────────────────────────────────────────────

router.post('/oauth/token', async (req, res) => {
  const contentType = req.headers['content-type'] || '';
  let grantType, code, redirectUri, codeVerifier, resource, refreshToken;

  if (contentType.includes('application/json')) {
    ({
      grant_type: grantType,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      resource,
      refresh_token: refreshToken,
    } = req.body || {});
  } else {
    grantType = req.body?.grant_type;
    code = req.body?.code;
    redirectUri = req.body?.redirect_uri;
    codeVerifier = req.body?.code_verifier;
    resource = req.body?.resource;
    refreshToken = req.body?.refresh_token;
  }

  // Default to authorization_code for backwards compat
  if (!grantType) grantType = 'authorization_code';

  const { clientId, clientSecret } = parseClientCredentials(req);
  const client = await validateClient(clientId, clientSecret);
  if (!client) {
    return res.status(401).json({ error: 'invalid_client', error_description: 'Invalid client credentials' });
  }

  // ── Grant type: authorization_code ──────────────────────────────────
  if (grantType === 'authorization_code') {
    if (!code || !redirectUri || !codeVerifier) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'code, redirect_uri, and code_verifier are required for authorization_code grant',
      });
    }

    const authCodeDoc = await OAuthAuthCode.findOne({ code });
    if (!authCodeDoc) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' });
    }

    if (authCodeDoc.clientId !== clientId || authCodeDoc.redirectUri !== redirectUri) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Code mismatch' });
    }

    if (new Date() > authCodeDoc.expiresAt) {
      await OAuthAuthCode.deleteOne({ code });
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Authorization code expired' });
    }

    // Validate code_verifier format per RFC 7636 (43-128 chars, unreserved characters)
    if (!codeVerifier || codeVerifier.length < 43 || codeVerifier.length > 128 || !/^[A-Za-z0-9\-._~]+$/.test(codeVerifier)) {
      return res.status(400).json({ error: 'invalid_request', error_description: 'code_verifier must be 43-128 chars (alphanumeric + -._~)' });
    }

    const expectedChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    if (expectedChallenge !== authCodeDoc.codeChallenge) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid code_verifier' });
    }

    const MCP_RESOURCE = getMcpResource();
    const aud = resource || MCP_RESOURCE;
    const scope = authCodeDoc.scope || 'mcp:preplai';
    const accessToken = issueAccessToken(authCodeDoc.userId, aud, scope);
    const newRefreshToken = await issueRefreshToken(clientId, authCodeDoc.userId, scope);

    await OAuthAuthCode.deleteOne({ code });

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: newRefreshToken,
    });
  }

  // ── Grant type: refresh_token ───────────────────────────────────────
  if (grantType === 'refresh_token') {
    if (!refreshToken) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'refresh_token is required for refresh_token grant',
      });
    }

    const tokenHash = hashSecret(refreshToken);
    const tokenDoc = await OAuthRefreshToken.findOne({ token: tokenHash });

    if (!tokenDoc || tokenDoc.revoked || new Date() > tokenDoc.expiresAt) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired refresh token' });
    }

    if (tokenDoc.clientId !== clientId) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'Refresh token was not issued to this client' });
    }

    // Rotate: revoke old token, issue new pair
    tokenDoc.revoked = true;
    await tokenDoc.save();

    const MCP_RESOURCE = getMcpResource();
    const aud = resource || MCP_RESOURCE;
    const scope = tokenDoc.scope || 'mcp:preplai';
    const accessToken = issueAccessToken(tokenDoc.userId, aud, scope);
    const newRefreshToken = await issueRefreshToken(clientId, tokenDoc.userId, scope);

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: newRefreshToken,
    });
  }

  return res.status(400).json({
    error: 'unsupported_grant_type',
    error_description: `Unsupported grant_type: ${grantType}. Supported: authorization_code, refresh_token`,
  });
});

// ── Token Revocation (RFC 7009) ──────────────────────────────────────────

router.post('/oauth/revoke', async (req, res) => {
  const { clientId, clientSecret } = parseClientCredentials(req);
  const client = await validateClient(clientId, clientSecret);
  if (!client) {
    // Per RFC 7009 §2.1: if client auth fails, return 401
    return res.status(401).json({ error: 'invalid_client', error_description: 'Invalid client credentials' });
  }

  const contentType = req.headers['content-type'] || '';
  let token, tokenTypeHint;
  if (contentType.includes('application/json')) {
    token = req.body?.token;
    tokenTypeHint = req.body?.token_type_hint;
  } else {
    token = req.body?.token;
    tokenTypeHint = req.body?.token_type_hint;
  }

  if (!token) {
    // Per RFC 7009: respond 200 even if token is missing (no-op)
    return res.status(200).end();
  }

  // Try to revoke as refresh token (the only revocable token type)
  const tokenHash = hashSecret(token);
  await OAuthRefreshToken.updateOne(
    { token: tokenHash, clientId, revoked: false },
    { $set: { revoked: true } }
  );

  // Per RFC 7009 §2.1: always return 200, never reveal whether token existed
  res.status(200).end();
});

// ── Dynamic Client Registration (RFC 7591) ────────────────────────────────

// Simple in-memory rate limiting for DCR (per IP)
const dcrRateLimit = new Map();
const DCR_MAX_PER_HOUR = 10;

router.post('/oauth/register', async (req, res) => {
  // Rate limit: 10 registrations per IP per hour
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';
  const now = Date.now();
  const windowStart = now - 60 * 60 * 1000;
  const history = (dcrRateLimit.get(ip) || []).filter((t) => t > windowStart);
  if (history.length >= DCR_MAX_PER_HOUR) {
    return res.status(429).json({
      error: 'too_many_requests',
      error_description: 'Rate limit exceeded for client registration. Try again later.',
    });
  }
  history.push(now);
  dcrRateLimit.set(ip, history);

  const { client_name, redirect_uris, grant_types, token_endpoint_auth_method, scope } = req.body || {};

  if (!client_name || typeof client_name !== 'string') {
    return res.status(400).json({
      error: 'invalid_client_metadata',
      error_description: 'client_name is required',
    });
  }

  if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
    return res.status(400).json({
      error: 'invalid_client_metadata',
      error_description: 'redirect_uris (non-empty array) is required',
    });
  }

  // Validate redirect URIs
  for (const uri of redirect_uris) {
    try {
      new URL(uri);
    } catch {
      return res.status(400).json({
        error: 'invalid_redirect_uri',
        error_description: `Invalid redirect URI: ${uri}`,
      });
    }
  }

  const clientId = 'plai_oauth_' + crypto.randomBytes(16).toString('hex');
  const clientSecretRaw = crypto.randomBytes(32).toString('hex');
  const clientSecretHash = hashSecret(clientSecretRaw);

  await OAuthClient.create({
    clientId,
    clientSecretHash,
    name: client_name,
    redirectUris: redirect_uris,
    userId: null, // DCR clients are unowned
  });

  res.status(201).json({
    client_id: clientId,
    client_secret: clientSecretRaw,
    client_name,
    redirect_uris,
    grant_types: grant_types || ['authorization_code', 'refresh_token'],
    token_endpoint_auth_method: token_endpoint_auth_method || 'client_secret_post',
    scope: scope || 'mcp:preplai',
    client_secret_expires_at: 0, // Does not expire
  });
});

export default router;
