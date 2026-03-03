# Testing the Streamable HTTP MCP Transport

This guide covers how to test the MCP server's Streamable HTTP transport using MCP Inspector and curl.

## Prerequisites

- Server running: `npm run dev --workspace=@preplai/mcp-server` (or `node packages/mcp-server/dist/server.js`)
- An access token (create one in the dashboard at https://preplai.com/dashboard/keys)

---

## 1. Get an Access Token

Sign up at https://preplai.com, then create an access token in the dashboard at https://preplai.com/dashboard/keys. Save the token — you'll need it for authentication.

---

## 2. Test with MCP Inspector

1. **Start the Inspector:**
   ```bash
   npx @modelcontextprotocol/inspector
   ```

2. **Configure the connection:**
   - **Transport Type:** Streamable HTTP
   - **URL:** `http://localhost:5005/mcp`

3. **Authentication:**
   - Expand the **Authentication** section
   - **Header Name:** `Authorization` (default)
   - **Bearer Token:** Paste your access token (the raw token, e.g. `plai_abc123...`)

   The server accepts both `X-Preplai-API-Key` and `Authorization: Bearer <token>`.

4. **Connect** — Click the Connect button. You should see:
   - Connection status: Connected (green)
   - Server capabilities listed

5. **Call a tool:**
   - Select `create_session` from the tools list
   - Enter `{"title": "Test Presentation"}` as arguments
   - Execute — you should get a `session_id` and `player_url`

---

## 3. Test with curl

### Initialize (get session ID)

```bash
curl -X POST http://localhost:5005/mcp \
  -H "Content-Type: application/json" \
  -H "X-Preplai-API-Key: YOUR_API_KEY" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {"name": "test", "version": "1.0.0"}
    }
  }'
```

Save the `Mcp-Session-Id` from the response headers for subsequent requests.

### List tools

```bash
curl -X POST http://localhost:5005/mcp \
  -H "Content-Type: application/json" \
  -H "X-Preplai-API-Key: YOUR_API_KEY" \
  -H "Mcp-Session-Id: SESSION_ID_FROM_INIT" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'
```

### Call create_session

```bash
curl -X POST http://localhost:5005/mcp \
  -H "Content-Type: application/json" \
  -H "X-Preplai-API-Key: YOUR_API_KEY" \
  -H "Mcp-Session-Id: SESSION_ID_FROM_INIT" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "create_session",
      "arguments": {"title": "My Test Presentation"}
    }
  }'
```

---

## 4. Automated Tests

The test suite includes MCP endpoint coverage. Run:

```bash
npm test
```

The `server.test.ts` and `e2e.test.ts` files exercise the `/mcp` endpoint with `X-Preplai-API-Key` authentication.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **401 Unauthorized** | Ensure access token is valid. Create one at https://preplai.com/dashboard/keys. |
| **MCP Inspector doesn't connect** | Try `Authorization: Bearer <token>` — set Header Name to `Authorization` and paste the token in the Bearer Token field. |
| **Session not found** | Include `Mcp-Session-Id` header on all requests after `initialize`. |
| **CORS errors** | The server allows `Authorization` and `X-Preplai-API-Key` in CORS headers. |
