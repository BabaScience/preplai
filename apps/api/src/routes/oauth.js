/**
 * OAuth 2.1 server for MCP / Claude Web connector
 * Implements: RFC 8414 (AS metadata), RFC 9728 (PRM), authorization code + PKCE
 */
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuthClient, OAuthAuthCode, User, ApiKey } from '../db.js';

const router = Router();

const DEFAULT_SECRET = 'preplai-dev-secret-change-in-prod';
const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET;
const API_BASE =
  process.env.API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://api.preplai.com' : 'http://localhost:5000');
const WEBSITE_BASE =
  process.env.WEBSITE_BASE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://preplai.com' : 'http://localhost:5173');
const MCP_RESOURCE =
  process.env.MCP_RESOURCE_URL ||
  (process.env.NODE_ENV === 'production' ? 'https://player.preplai.com' : 'http://localhost:5005');

// ── Helpers ─────────────────────────────────────────────────────────────

function hashSecret(secret) {
  return crypto.createHash('sha256').update(secret).digest('hex');
}

function generateAuthCode() {
  return crypto.randomBytes(32).toString('hex');
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
  res.json({
    issuer: API_BASE,
    authorization_endpoint: `${API_BASE}/oauth/authorize`,
    token_endpoint: `${API_BASE}/oauth/token`,
    jwks_uri: `${API_BASE}/oauth/jwks`,
    scopes_supported: ['mcp:preplai'],
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'client_secret_basic'],
  });
});

// JWKS (minimal - we use symmetric secret; some clients expect this)
router.get('/oauth/jwks', (req, res) => {
  res.json({ keys: [] });
});

// ── Authorization endpoint ──────────────────────────────────────────────

router.get('/oauth/authorize', optionalAuth, async (req, res) => {
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

  // Consent page
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
  <h1>Authorize ${client.name}</h1>
  <p>${client.name} wants to access your preplai account.</p>
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
  let clientId, clientSecret, code, redirectUri, codeVerifier, resource;

  if (contentType.includes('application/json')) {
    ({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri, code_verifier: codeVerifier, resource } = req.body || {});
  } else {
    clientId = req.body?.client_id;
    clientSecret = req.body?.client_secret;
    code = req.body?.code;
    redirectUri = req.body?.redirect_uri;
    codeVerifier = req.body?.code_verifier;
    resource = req.body?.resource;
  }

  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Basic ')) {
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [cid, csecret] = decoded.split(':');
    if (cid && !clientId) clientId = cid;
    if (csecret && !clientSecret) clientSecret = csecret;
  }

  if (!clientId || !clientSecret || !code || !redirectUri || !codeVerifier) {
    return res.status(400).json({
      error: 'invalid_request',
      error_description: 'client_id, client_secret, code, redirect_uri, and code_verifier are required',
    });
  }

  const client = await OAuthClient.findOne({ clientId });
  if (!client) {
    return res.status(401).json({ error: 'invalid_client', error_description: 'Unknown client' });
  }

  const secretHash = hashSecret(clientSecret);
  if (secretHash !== client.clientSecretHash) {
    return res.status(401).json({ error: 'invalid_client', error_description: 'Invalid client secret' });
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

  const expectedChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url');
  if (expectedChallenge !== authCodeDoc.codeChallenge) {
    return res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid code_verifier' });
  }

  const aud = resource || MCP_RESOURCE;
  const accessToken = jwt.sign(
    {
      sub: authCodeDoc.userId.toString(),
      aud,
      iss: API_BASE,
      scope: authCodeDoc.scope || 'mcp:preplai',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  await OAuthAuthCode.deleteOne({ code });

  res.json({
    access_token: accessToken,
    token_type: 'Bearer',
    expires_in: 3600,
  });
});

export default router;
