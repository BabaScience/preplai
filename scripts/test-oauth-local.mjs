#!/usr/bin/env node
/**
 * Local OAuth flow test script
 *
 * Runs the full OAuth authorization code + PKCE flow against local API/MCP,
 * then tests the MCP endpoint with the obtained access token.
 *
 * Usage:
 *   CLIENT_ID=plai_oauth_xxx CLIENT_SECRET=yyy pnpm test:oauth
 *
 * Or: OAUTH_CLIENT_ID=xxx OAUTH_CLIENT_SECRET=yyy pnpm test:oauth
 *
 * Create an OAuth client at http://localhost:5173/dashboard/connectors
 * with redirect URI: http://localhost:3456/callback
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env.local if present
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '..', '.env.local');
if (existsSync(envPath)) {
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) {
      process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}
import { createHash, randomBytes } from 'crypto';
import { exec } from 'child_process';
import { platform } from 'os';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';
const MCP_BASE = process.env.MCP_BASE_URL || 'http://localhost:5005';
const CALLBACK_PORT = Number(process.env.OAUTH_CALLBACK_PORT || 3456);
const REDIRECT_URI = `http://localhost:${CALLBACK_PORT}/callback`;

const clientId = process.env.OAUTH_CLIENT_ID || process.env.CLIENT_ID;
const clientSecret = process.env.OAUTH_CLIENT_SECRET || process.env.CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error('Usage: CLIENT_ID=plai_oauth_xxx CLIENT_SECRET=yyy node scripts/test-oauth-local.mjs');
  console.error('');
  console.error('Create an OAuth client at http://localhost:5173/dashboard/connectors');
  console.error('Use redirect URI: http://localhost:' + CALLBACK_PORT + '/callback');
  process.exit(1);
}

// PKCE
const codeVerifier = randomBytes(32).toString('base64url');
const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');

function openBrowser(url) {
  const cmd = platform() === 'darwin' ? 'open' : platform() === 'win32' ? 'start' : 'xdg-open';
  exec(`${cmd} ${JSON.stringify(url)}`, (err) => {
    if (err) console.error('Could not open browser:', err.message);
  });
}

async function exchangeCodeForToken(code) {
  const res = await fetch(`${API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: codeVerifier,
      resource: MCP_BASE,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function testMcp(accessToken) {
  const res = await fetch(`${MCP_BASE}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-oauth-local', version: '1.0.0' },
      },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MCP initialize failed: ${res.status} ${text}`);
  }
  const init = await res.json();
  const sessionId = res.headers.get('mcp-session-id');

  // Call create_session
  const toolRes = await fetch(`${MCP_BASE}/mcp`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      'Mcp-Session-Id': sessionId || '',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'create_session',
        arguments: { title: 'OAuth Local Test' },
      },
    }),
  });
  if (!toolRes.ok) {
    const text = await toolRes.text();
    throw new Error(`MCP create_session failed: ${toolRes.status} ${text}`);
  }
  return await toolRes.json();
}

const authUrl = new URL(`${API_BASE}/oauth/authorize`);
authUrl.searchParams.set('client_id', clientId);
authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('scope', 'mcp:preplai');
authUrl.searchParams.set('state', 'local-test');
authUrl.searchParams.set('code_challenge', codeChallenge);
authUrl.searchParams.set('code_challenge_method', 'S256');
authUrl.searchParams.set('resource', MCP_BASE);

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${CALLBACK_PORT}`);
  if (url.pathname !== '/callback') {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');

  res.writeHead(200, { 'Content-Type': 'text/html' });
  if (error) {
    res.end(`<h1>OAuth Error</h1><p>${error}</p>`);
    server.close();
    process.exit(1);
  }

  if (!code) {
    res.end('<h1>No code received</h1>');
    server.close();
    process.exit(1);
  }

  res.end('<h1>Success!</h1><p>You can close this tab. Check the terminal.</p>');

  try {
    const tokenRes = await exchangeCodeForToken(code);
    const accessToken = tokenRes.access_token;
    console.log('\n✓ Got access token');

    const toolResult = await testMcp(accessToken);
    console.log('✓ MCP create_session succeeded:', JSON.stringify(toolResult, null, 2));
    console.log('\nOAuth local test passed!');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
});

server.listen(CALLBACK_PORT, () => {
  console.log('OAuth local test');
  console.log('1. Opening browser for authorization...');
  console.log('2. Log in and click Approve if prompted');
  console.log('3. Waiting for callback...\n');
  openBrowser(authUrl.toString());
});
