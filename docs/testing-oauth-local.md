# Testing OAuth Locally

This guide walks through testing the OAuth flow and MCP with OAuth tokens on your local machine.

## Prerequisites

- MongoDB running (`mongodb://localhost:27017/preplai`)
- All services running (see below)

## 1. Start All Services

In separate terminals:

```bash
# Terminal 1: API
pnpm --filter preplai-api run dev

# Terminal 2: MCP server
pnpm --filter @preplai/mcp-server run build && pnpm --filter @preplai/mcp-server run dev

# Terminal 3: Website
pnpm --filter website run dev
```

Or use `npm run dev` from the repo root if it starts everything.

## 2. Create a User Account

1. Open http://localhost:5173/signup
2. Create an account (email + password)

## 3. Create an OAuth Client for Local Testing

1. Log in at http://localhost:5173/login
2. Go to **Connectors** (http://localhost:5173/dashboard/connectors)
3. Click **Create OAuth Client**
4. **Name:** `Local Test`
5. **Redirect URIs:** `http://localhost:3456/callback` (required for the test script)
6. Click **Create Client**
7. **Copy and save** the Client ID and Client Secret — you'll need them for the script

## 4. Run the OAuth Test Script

The script opens a browser for you to authorize, captures the callback, exchanges the code for a token, and tests the MCP endpoint.

```bash
CLIENT_ID=plai_oauth_xxxx CLIENT_SECRET=your_secret pnpm test:oauth
```

Or create `.env.local` in the repo root (do not commit):

```
OAUTH_CLIENT_ID=plai_oauth_xxxx
OAUTH_CLIENT_SECRET=your_secret
```

Then:

```bash
pnpm test:oauth
```

**What happens:**

1. Script starts a local server on port 3456 to receive the OAuth callback
2. Opens your browser to the authorize URL
3. You log in (if needed) and click **Approve**
4. Browser redirects to `http://localhost:3456/callback?code=...&state=...`
5. Script exchanges the code for an access token
6. Script calls the MCP `create_session` tool with the Bearer token
7. Prints the result

## 5. Manual Testing (Alternative)

If you prefer to run the flow manually:

### Step 1: Get auth metadata

```bash
curl -s http://localhost:5000/.well-known/oauth-authorization-server | jq
```

### Step 2: Get protected resource metadata

```bash
curl -s http://localhost:5005/.well-known/oauth-protected-resource | jq
```

### Step 3: Verify 401 with WWW-Authenticate

```bash
curl -i -X POST http://localhost:5005/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

You should see `401` and a `WWW-Authenticate` header pointing to the resource metadata URL.

### Step 4: OAuth flow (browser)

1. Generate PKCE values (or use fixed ones for testing):

   ```bash
   # code_verifier (random 32 bytes, base64url)
   node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
   # code_challenge = base64url(sha256(code_verifier))
   node -e "const c=require('crypto'); const v=process.argv[1]||'test'; console.log(c.createHash('sha256').update(v).digest('base64url'))" "YOUR_VERIFIER"
   ```

2. Create OAuth client with redirect_uri = `http://localhost:5173/oauth/callback` (add this route if needed) or use a tool like Postman to capture the redirect.

3. Open in browser (replace placeholders):

   ```
   http://localhost:5000/oauth/authorize?client_id=CLIENT_ID&redirect_uri=http://localhost:3456/callback&response_type=code&scope=mcp:preplai&state=test123&code_challenge=CHALLENGE&code_challenge_method=S256&resource=http://localhost:5005
   ```

4. Log in, approve, then capture the `code` from the redirect URL.

5. Exchange code for token:

   ```bash
   curl -X POST http://localhost:5000/oauth/token \
     -H "Content-Type: application/json" \
     -d '{
       "grant_type": "authorization_code",
       "client_id": "YOUR_CLIENT_ID",
       "client_secret": "YOUR_CLIENT_SECRET",
       "code": "CODE_FROM_REDIRECT",
       "redirect_uri": "http://localhost:3456/callback",
       "code_verifier": "YOUR_CODE_VERIFIER",
       "resource": "http://localhost:5005"
     }'
   ```

6. Use the `access_token` with MCP:

   ```bash
   curl -X POST http://localhost:5005/mcp \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
   ```

## 6. Test with MCP Inspector + OAuth Token

1. Run the test script to get an access token (or complete the manual flow above)
2. Start MCP Inspector: `npx @modelcontextprotocol/inspector`
3. **Transport:** Streamable HTTP
4. **URL:** `http://localhost:5005/mcp`
5. **Authentication:** Bearer Token = your OAuth access token (the JWT, not the API key)
6. Connect and call tools

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **Redirect URI mismatch** | Ensure the OAuth client's redirect_uri exactly matches `http://localhost:3456/callback` (for the script) |
| **Cookie not sent** | Login and authorize must happen in the same browser session. The API sets a cookie on login. |
| **401 on MCP** | Ensure you're using the OAuth access token (JWT), not the API key. JWTs don't start with `plai_`. |
| **Token expired** | OAuth tokens expire in 1 hour. Run the flow again to get a new token. |
