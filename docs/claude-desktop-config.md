# Claude Desktop Config for preplai MCP

Use the preplai MCP server with Claude Desktop by adding it to your `claude_desktop_config.json`.

## Config File Location

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

## Setup

1. **Build and run the MCP server** (from the preplai repo root):

   ```bash
   npm install
   npm run build --workspace=@preplai/mcp-server
   npm run dev
   ```

   Or run the server directly: `node packages/mcp-server/dist/server.js`

2. **Ensure MongoDB is running** (required for session persistence):

   ```bash
   # Default: mongodb://localhost:27017/preplai
   ```

3. **Create an API key** (if you don't have one):

   ```bash
   curl -X POST http://localhost:5005/api/keys -H "Content-Type: application/json" -d '{"email":"you@example.com"}'
   ```

4. **Add the config** to your Claude Desktop config file.

---

## Option A: Streamable HTTP (Recommended)

Uses the main server over HTTP. **No port conflicts** — the server runs once; Claude Desktop connects to it. Best when you already run `npm run dev`.

```json
{
  "mcpServers": {
    "preplai": {
      "command": "npx",
      "args": ["-y", "@pyroprompts/mcp-stdio-to-streamable-http-adapter"],
      "env": {
        "URI": "http://localhost:5005/mcp",
        "BEARER_TOKEN": "your-preplai-api-key"
      }
    }
  }
}
```

Replace `your-preplai-api-key` with your API key from `POST /api/keys`.

---

## Option B: Stdio Bridge

Spawns a subprocess that runs both the HTTP server and MCP over stdio. Can conflict with port 5005 if `npm run dev` is also running.

```json
{
  "mcpServers": {
    "preplai": {
      "command": "node",
      "args": ["/path/to/preplai/packages/mcp-server/dist/stdio-bridge.js"],
      "env": {
        "PORT": "5005",
        "BASE_URL": "http://localhost:5005",
        "MONGODB_URI": "mongodb://localhost:27017/preplai",
        "PREPLAI_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace the path in `args` with the **absolute path** to your preplai repo's `stdio-bridge.js`. If you omit `PREPLAI_API_KEY`, a local dev key is generated automatically.

---

## Hosted Mode (Remote Server)

For a hosted preplai instance, use Streamable HTTP with the remote URL:

```json
{
  "mcpServers": {
    "preplai": {
      "command": "npx",
      "args": ["-y", "@pyroprompts/mcp-stdio-to-streamable-http-adapter"],
      "env": {
        "URI": "https://your-preplai-domain.com/mcp",
        "BEARER_TOKEN": "your-api-key"
      }
    }
  }
}
```

---

## Claude Web (claude.ai)

To connect Claude Web to preplai:

1. **Create an OAuth client** at [preplai.com/dashboard/connectors](https://preplai.com/dashboard/connectors)
2. In Claude Web: **Settings → Connectors → Add → Add custom connector**
3. **URL:** `https://player.preplai.com/mcp`
4. **Advanced settings:** Paste your **OAuth Client ID** and **OAuth Client Secret**
5. Click **Add**, then **Connect** to complete the OAuth flow
6. Enable the connector in chat via the **+** button

---

## Restart Claude Desktop

After editing the config, restart Claude Desktop for changes to take effect.
