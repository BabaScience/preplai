/**
 * @preplai/mcp-server — OAuth E2E Tests
 *
 * Full end-to-end tests for the OAuth flow:
 *   Signup → Create OAuth client → Authorize → Token exchange → MCP with Bearer token
 *
 * Requires both the API (Express) and MCP server (Fastify) sharing the same MongoDB.
 *
 * @vitest-environment node
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash, randomBytes } from 'crypto';
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

describe('E2E: OAuth flow and MCP with Bearer token', () => {
  it('should complete full OAuth flow: signup → create client → authorize → token → MCP create_session', async () => {
    const redirectUri = 'http://localhost:9999/callback';
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

    // 1. Signup
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
    const jwt = signupData.token;
    expect(jwt).toBeTruthy();

    // 2. Create OAuth client
    const clientRes = await apiFetch('/api/oauth/clients', {
      method: 'POST',
      headers: { Authorization: `Bearer ${jwt}` },
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
      headers: { Authorization: `Bearer ${jwt}` },
    });
    expect(authRes.status).toBe(302);
    const location = authRes.headers.get('Location');
    expect(location).toBeTruthy();
    const locationUrl = new URL(location!);
    const code = locationUrl.searchParams.get('code');
    expect(code).toBeTruthy();

    // 4. Exchange code for token
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

describe('E2E: OAuth metadata and 401', () => {
  it('should serve OAuth authorization server metadata', async () => {
    const res = await apiFetch('/.well-known/oauth-authorization-server');
    expect(res.status).toBe(200);
    const meta = await res.json();
    expect(meta.issuer).toBe(apiBaseUrl);
    expect(meta.authorization_endpoint).toContain('/oauth/authorize');
    expect(meta.token_endpoint).toContain('/oauth/token');
    expect(meta.code_challenge_methods_supported).toContain('S256');
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
