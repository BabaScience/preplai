/**
 * @preplai/mcp-server — OAuth E2E Tests
 *
 * Full end-to-end tests for the OAuth flow:
 *   Signup → Create OAuth client → Authorize → Token exchange → MCP with Bearer token
 *   + Refresh tokens, token revocation, Dynamic Client Registration
 *
 * Requires both the API (Express) and MCP server (Fastify) sharing the same MongoDB.
 *
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDb, closeDb } from '@preplai/db';
import { buildServer, type ServerContext } from './server.js';

let mongod: MongoMemoryServer;
let mongoUri: string;
let apiApp: ReturnType<typeof createApp>;
let apiServer: { close: () => Promise<void> };
let apiBaseUrl: string;
let mcpCtx: ServerContext;
let mcpBaseUrl: string;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  mongoUri = mongod.getUri();

  process.env.MONGODB_URI = mongoUri;
  process.env.WEBSITE_BASE_URL = 'http://localhost:5173';
  process.env.JWT_SECRET = 'oauth-e2e-test-secret';
  process.env.NODE_ENV = 'test';

  await connectDb(mongoUri);

  // Import API after env is set so OAuth routes use correct JWT_SECRET
  const { createApp } = await import('../../../apps/api/src/index.js');
  apiApp = createApp();
  apiServer = await new Promise<{ close: () => Promise<void> }>((resolve, reject) => {
    const server = apiApp.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      const port = typeof addr === 'object' && addr ? addr.port : 0;
      apiBaseUrl = `http://127.0.0.1:${port}`;
      process.env.API_BASE_URL = apiBaseUrl;
      resolve({
        close: () =>
          new Promise((done) => {
            server.close(done);
          }),
      });
    });
    server.on('error', reject);
  });

  mcpCtx = await buildServer({
    mongoUri,
    logLevel: 'silent',
    baseUrl: 'http://127.0.0.1:0',
    rateLimitMax: 10000,
    rateLimitWindow: '1 minute',
  });

  const mcpAddr = await mcpCtx.app.listen({ port: 0, host: '127.0.0.1' });
  const mcpPort = Number(String(mcpAddr).match(/(\d+)$/)?.[1] ?? 0);
  mcpBaseUrl = `http://127.0.0.1:${mcpPort}`;
  process.env.MCP_RESOURCE_URL = mcpBaseUrl;
}, 30000);

afterAll(async () => {
  await mcpCtx.app.close();
  await apiServer.close();
  await closeDb();
  if (mongod) await mongod.stop();
});

async function apiFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const url = path.startsWith('http') ? path : `${apiBaseUrl}${path}`;
  return fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...opts.headers,
    },
  });
}

function parseMcpResponse(body: string): { success: boolean; data?: any; error?: any } {
  const outer = JSON.parse(body);
  return JSON.parse(outer.content[0].text);
}

/**
 * Helper: create a user, verify email, login, return JWT token + userId.
 */
async function createVerifiedUser(email: string, name: string) {
  const signupRes = await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'password123', name }),
  });
  const signupData = await signupRes.json();
  const userId = signupData.user.id;

  const verifyToken = jwt.sign(
    { userId, purpose: 'verify-email' },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
  await apiFetch('/api/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ token: verifyToken }),
  });

  const loginRes = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password: 'password123' }),
  });
  const loginData = await loginRes.json();
  return { jwtToken: loginData.token, userId };
}

/**
 * Helper: complete the full OAuth flow (client create → authorize → token exchange).
 * Returns access_token, refresh_token, clientId, clientSecret.
 */
async function completeOAuthFlow(jwtToken: string, redirectUri = 'http://localhost:9999/callback') {
  const codeVerifier = randomBytes(32).toString('base64url');
  const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

  // Create OAuth client
  const clientRes = await apiFetch('/api/oauth/clients', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwtToken}` },
    body: JSON.stringify({ name: 'Test Client', redirectUris: [redirectUri] }),
  });
  const clientData = await clientRes.json();
  const { clientId, clientSecret } = clientData;

  // Authorize
  const authParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'mcp:preplai',
    state: 'test',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    resource: mcpBaseUrl,
    approve: 'true',
  });
  const authRes = await apiFetch(`/oauth/authorize?${authParams}`, {
    method: 'GET',
    redirect: 'manual',
    headers: { Authorization: `Bearer ${jwtToken}` },
  });
  const location = authRes.headers.get('Location')!;
  const code = new URL(location).searchParams.get('code')!;

  // Token exchange
  const tokenRes = await apiFetch('/oauth/token', {
    method: 'POST',
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
      resource: mcpBaseUrl,
    }),
  });
  const tokenData = await tokenRes.json();

  return {
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token,
    clientId,
    clientSecret,
    tokenData,
  };
}

// ── Original tests ────────────────────────────────────────────────────────

describe('E2E: OAuth flow and MCP with Bearer token', () => {
  it('should complete full OAuth flow: signup → create client → authorize → token → MCP create_session', async () => {
    const redirectUri = 'http://localhost:9999/callback';
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

    // 1. Signup (email verification required)
    const signupRes = await apiFetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'oauth-e2e@example.com',
        password: 'password123',
        name: 'OAuth E2E User',
      }),
    });
    expect(signupRes.status).toBe(201);
    const signupData = await signupRes.json();
    expect(signupData.emailVerificationRequired).toBe(true);
    const userId = signupData.user.id;

    // 2. Verify email and login
    const verifyToken = jwt.sign(
      { userId, purpose: 'verify-email' },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    const verifyRes = await apiFetch('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token: verifyToken }),
    });
    expect(verifyRes.status).toBe(200);

    const loginRes = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'oauth-e2e@example.com',
        password: 'password123',
      }),
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    const jwtToken = loginData.token;
    expect(jwtToken).toBeTruthy();

    // 3. Create OAuth client
    const clientRes = await apiFetch('/api/oauth/clients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwtToken}` },
      body: JSON.stringify({
        name: 'E2E Test Client',
        redirectUris: [redirectUri],
      }),
    });
    expect(clientRes.status).toBe(201);
    const clientData = await clientRes.json();
    const { clientId, clientSecret } = clientData;
    expect(clientId).toMatch(/^plai_oauth_/);
    expect(clientSecret).toBeTruthy();

    // 3. Authorize (with approve=true, pass JWT)
    const authParams = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'mcp:preplai',
      state: 'e2e-test',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      resource: mcpBaseUrl,
      approve: 'true',
    });
    const authRes = await apiFetch(`/oauth/authorize?${authParams}`, {
      method: 'GET',
      redirect: 'manual',
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    expect(authRes.status).toBe(302);
    const location = authRes.headers.get('Location');
    expect(location).toBeTruthy();
    const locationUrl = new URL(location!);
    const code = locationUrl.searchParams.get('code');
    expect(code).toBeTruthy();

    // 4. Exchange code for token (now returns refresh_token too)
    const tokenRes = await apiFetch('/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
        resource: mcpBaseUrl,
      }),
    });
    expect(tokenRes.status).toBe(200);
    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    expect(accessToken).toBeTruthy();
    expect(tokenData.token_type).toBe('Bearer');
    expect(tokenData.refresh_token).toBeTruthy();

    // 5. Call MCP /api/create-session with OAuth Bearer token
    const createRes = await mcpCtx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      payload: { title: 'OAuth E2E Presentation' },
    });
    expect(createRes.statusCode).toBe(200);
    const createResult = parseMcpResponse(createRes.body);
    expect(createResult.success).toBe(true);
    expect(createResult.data.session_id).toBeTruthy();
    expect(createResult.data.player_url).toContain(createResult.data.session_id);
  });
});

// ── Refresh token tests ────────────────────────────────────────────────────

describe('E2E: Refresh tokens', () => {
  it('should exchange refresh token for new access + refresh tokens', async () => {
    const { jwtToken } = await createVerifiedUser('refresh-test@example.com', 'Refresh User');
    const { refreshToken, clientId, clientSecret } = await completeOAuthFlow(jwtToken);

    expect(refreshToken).toBeTruthy();

    // Use refresh token to get new tokens
    const refreshRes = await apiFetch('/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        resource: mcpBaseUrl,
      }),
    });
    expect(refreshRes.status).toBe(200);
    const refreshData = await refreshRes.json();
    expect(refreshData.access_token).toBeTruthy();
    expect(refreshData.refresh_token).toBeTruthy();
    expect(refreshData.token_type).toBe('Bearer');
    expect(refreshData.expires_in).toBe(3600);

    // New access token should work with MCP
    const createRes = await mcpCtx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshData.access_token}`,
      },
      payload: { title: 'Refreshed Token Presentation' },
    });
    expect(createRes.statusCode).toBe(200);
    const createResult = parseMcpResponse(createRes.body);
    expect(createResult.success).toBe(true);
  });

  it('should rotate refresh tokens (old token becomes invalid)', async () => {
    const { jwtToken } = await createVerifiedUser('rotate-test@example.com', 'Rotate User');
    const { refreshToken, clientId, clientSecret } = await completeOAuthFlow(jwtToken);

    // First refresh: should succeed
    const refreshRes1 = await apiFetch('/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        resource: mcpBaseUrl,
      }),
    });
    expect(refreshRes1.status).toBe(200);
    const refreshData1 = await refreshRes1.json();
    expect(refreshData1.refresh_token).toBeTruthy();
    // New refresh token should be different from the original
    expect(refreshData1.refresh_token).not.toBe(refreshToken);

    // Second refresh with OLD token: should fail (rotated)
    const refreshRes2 = await apiFetch('/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        resource: mcpBaseUrl,
      }),
    });
    expect(refreshRes2.status).toBe(400);
    const errData = await refreshRes2.json();
    expect(errData.error).toBe('invalid_grant');
  });

  it('should reject refresh token with wrong client credentials', async () => {
    const { jwtToken } = await createVerifiedUser('wrong-client@example.com', 'Wrong Client');
    const { refreshToken, clientId } = await completeOAuthFlow(jwtToken);

    const refreshRes = await apiFetch('/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: 'wrong-secret',
        refresh_token: refreshToken,
        resource: mcpBaseUrl,
      }),
    });
    expect(refreshRes.status).toBe(401);
    const errData = await refreshRes.json();
    expect(errData.error).toBe('invalid_client');
  });
});

// ── Token revocation tests ────────────────────────────────────────────────

describe('E2E: Token revocation (RFC 7009)', () => {
  it('should revoke a refresh token so it cannot be reused', async () => {
    const { jwtToken } = await createVerifiedUser('revoke-test@example.com', 'Revoke User');
    const { refreshToken, clientId, clientSecret } = await completeOAuthFlow(jwtToken);

    // Revoke the refresh token
    const revokeRes = await apiFetch('/oauth/revoke', {
      method: 'POST',
      body: JSON.stringify({
        token: refreshToken,
        token_type_hint: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    expect(revokeRes.status).toBe(200);

    // Try to use revoked refresh token
    const refreshRes = await apiFetch('/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        resource: mcpBaseUrl,
      }),
    });
    expect(refreshRes.status).toBe(400);
    const errData = await refreshRes.json();
    expect(errData.error).toBe('invalid_grant');
  });

  it('should return 200 even for non-existent tokens (per RFC 7009)', async () => {
    const { jwtToken } = await createVerifiedUser('revoke-noop@example.com', 'Revoke Noop');
    const { clientId, clientSecret } = await completeOAuthFlow(jwtToken);

    const revokeRes = await apiFetch('/oauth/revoke', {
      method: 'POST',
      body: JSON.stringify({
        token: 'nonexistent-token-12345',
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    expect(revokeRes.status).toBe(200);
  });

  it('should reject revocation with invalid client credentials', async () => {
    const revokeRes = await apiFetch('/oauth/revoke', {
      method: 'POST',
      body: JSON.stringify({
        token: 'some-token',
        client_id: 'fake_client',
        client_secret: 'fake_secret',
      }),
    });
    expect(revokeRes.status).toBe(401);
  });
});

// ── Dynamic Client Registration tests ─────────────────────────────────────

describe('E2E: Dynamic Client Registration (RFC 7591)', () => {
  it('should register a new client via DCR and complete full OAuth flow', async () => {
    // 1. Register client dynamically (no auth required)
    const dcrRes = await apiFetch('/oauth/register', {
      method: 'POST',
      body: JSON.stringify({
        client_name: 'DCR Test Client',
        redirect_uris: ['http://localhost:8888/callback'],
      }),
    });
    expect(dcrRes.status).toBe(201);
    const dcrData = await dcrRes.json();
    expect(dcrData.client_id).toMatch(/^plai_oauth_/);
    expect(dcrData.client_secret).toBeTruthy();
    expect(dcrData.client_name).toBe('DCR Test Client');
    expect(dcrData.redirect_uris).toEqual(['http://localhost:8888/callback']);
    expect(dcrData.client_secret_expires_at).toBe(0);

    // 2. Create a user to authorize with
    const { jwtToken } = await createVerifiedUser('dcr-flow@example.com', 'DCR Flow User');

    // 3. Authorize with DCR-registered client
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

    const authParams = new URLSearchParams({
      client_id: dcrData.client_id,
      redirect_uri: 'http://localhost:8888/callback',
      response_type: 'code',
      scope: 'mcp:preplai',
      state: 'dcr-test',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      resource: mcpBaseUrl,
      approve: 'true',
    });
    const authRes = await apiFetch(`/oauth/authorize?${authParams}`, {
      method: 'GET',
      redirect: 'manual',
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    expect(authRes.status).toBe(302);
    const location = authRes.headers.get('Location')!;
    const code = new URL(location).searchParams.get('code')!;

    // 4. Exchange code for tokens
    const tokenRes = await apiFetch('/oauth/token', {
      method: 'POST',
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: dcrData.client_id,
        client_secret: dcrData.client_secret,
        code,
        redirect_uri: 'http://localhost:8888/callback',
        code_verifier: codeVerifier,
        resource: mcpBaseUrl,
      }),
    });
    expect(tokenRes.status).toBe(200);
    const tokenData = await tokenRes.json();
    expect(tokenData.access_token).toBeTruthy();
    expect(tokenData.refresh_token).toBeTruthy();

    // 5. Use access token with MCP
    const createRes = await mcpCtx.app.inject({
      method: 'POST',
      url: '/api/create-session',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenData.access_token}`,
      },
      payload: { title: 'DCR Presentation' },
    });
    expect(createRes.statusCode).toBe(200);
    const createResult = parseMcpResponse(createRes.body);
    expect(createResult.success).toBe(true);
  });

  it('should reject DCR with missing redirect_uris', async () => {
    const res = await apiFetch('/oauth/register', {
      method: 'POST',
      body: JSON.stringify({ client_name: 'No Redirects' }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_client_metadata');
  });

  it('should reject DCR with missing client_name', async () => {
    const res = await apiFetch('/oauth/register', {
      method: 'POST',
      body: JSON.stringify({ redirect_uris: ['http://localhost:9999/cb'] }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_client_metadata');
  });

  it('should reject DCR with invalid redirect URI', async () => {
    const res = await apiFetch('/oauth/register', {
      method: 'POST',
      body: JSON.stringify({
        client_name: 'Bad URI',
        redirect_uris: ['not-a-valid-url'],
      }),
    });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe('invalid_redirect_uri');
  });
});

// ── Updated metadata tests ────────────────────────────────────────────────

describe('E2E: OAuth metadata and 401', () => {
  it('should serve OAuth authorization server metadata with new endpoints', async () => {
    const res = await apiFetch('/.well-known/oauth-authorization-server');
    expect(res.status).toBe(200);
    const meta = await res.json();
    expect(meta.issuer).toBe(apiBaseUrl);
    expect(meta.authorization_endpoint).toContain('/oauth/authorize');
    expect(meta.token_endpoint).toContain('/oauth/token');
    expect(meta.registration_endpoint).toContain('/oauth/register');
    expect(meta.revocation_endpoint).toContain('/oauth/revoke');
    expect(meta.code_challenge_methods_supported).toContain('S256');
    expect(meta.grant_types_supported).toContain('authorization_code');
    expect(meta.grant_types_supported).toContain('refresh_token');
  });

  it('should serve protected resource metadata on MCP', async () => {
    const res = await mcpCtx.app.inject({
      method: 'GET',
      url: '/.well-known/oauth-protected-resource',
    });
    expect(res.statusCode).toBe(200);
    const meta = JSON.parse(res.body);
    expect(meta.resource).toBeTruthy();
    expect(meta.authorization_servers).toBeDefined();
    expect(Array.isArray(meta.authorization_servers)).toBe(true);
  });

  it('should return 401 with WWW-Authenticate when MCP request has no auth', async () => {
    const res = await mcpCtx.app.inject({
      method: 'POST',
      url: '/mcp',
      headers: { 'Content-Type': 'application/json' },
      payload: {
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'test', version: '1.0.0' },
        },
      },
    });
    expect(res.statusCode).toBe(401);
    expect(res.headers['www-authenticate']).toBeTruthy();
    expect(res.headers['www-authenticate']).toContain('resource_metadata');
  });
});
