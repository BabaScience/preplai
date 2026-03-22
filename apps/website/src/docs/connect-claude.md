# Connect Claude

Connect preplai to Claude in about 1 minute. After this, Claude can create animated presentations for you.

**Which method do I need?**

| Where you use Claude | Method | What you need |
|---------------------|--------|--------------|
| **Claude Desktop** (app on your computer) | API Token | Token from [Dashboard → Keys](https://preplai.com/dashboard/keys) |
| **Claude Web** (claude.ai in your browser) | OAuth | OAuth client from [Dashboard → Connectors](https://preplai.com/dashboard/connectors) |

---

## Claude Desktop (App)

Uses an **API token** — you create it once and paste it into a config file.

### 1. Create your API token

Go to [preplai.com/dashboard/keys](https://preplai.com/dashboard/keys) and create an access token. It looks like: `plai_a1b2c3d4e5f6...`

### 2. Find your config file

| Your computer | Open this file |
|---------------|----------------|
| **Mac** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |

If the file doesn't exist yet, create it.

### 3. Paste this config

Copy and paste the following into your config file:

```json
{
  "mcpServers": {
    "preplai": {
      "command": "npx",
      "args": ["-y", "@pyroprompts/mcp-stdio-to-streamable-http-adapter"],
      "env": {
        "URI": "https://player.preplai.com/mcp",
        "BEARER_TOKEN": "PASTE_YOUR_TOKEN_HERE"
      }
    }
  }
}
```

Replace `PASTE_YOUR_TOKEN_HERE` with your API token from Step 1.

> **Already have other MCP servers?** Add the `"preplai": { ... }` block inside your existing `"mcpServers"` object. Don't replace the whole file.

### 4. Restart Claude Desktop

Quit and reopen Claude Desktop. That's it — you're connected.

### 5. Try it

Open a new conversation and type:

> **"Using Preplai, create a presentation about how a load balancer distributes traffic"**

Claude will build the presentation and give you a link to watch it.

**Tip:** Including "Using Preplai" in your prompt tells Claude to use preplai for the visual. Without it, Claude might respond with plain text instead.

> **Other desktop MCP clients** (Cursor, Windsurf, etc.) use the same setup — create an API token and add the same config to your MCP client's settings.

---

## Claude Web (claude.ai)

Uses **OAuth** — you click "Connect" and authorize through your browser. No config files needed.

### 1. Create an OAuth client

Go to [preplai.com/dashboard/connectors](https://preplai.com/dashboard/connectors) and create an OAuth client:

1. Click **Create OAuth Client**
2. Add these **redirect URIs** (Claude needs them to complete the authorization):
   - `https://claude.ai/api/mcp/auth_callback`
   - `https://claude.com/api/mcp/auth_callback`
3. Save — you'll get a **Client ID** and **Client Secret**

### 2. Add the connector in Claude

1. Go to [claude.ai](https://claude.ai)
2. Open **Settings → Connectors → Add → Add custom connector**
3. Set the URL to: `https://player.preplai.com/mcp`
4. Open **Advanced settings** and paste your Client ID and Client Secret
5. Click **Add**, then **Connect** to authorize

### 3. Use it in chat

When starting a new conversation, click the **+** button and enable preplai. Then ask Claude to create a presentation — start your prompt with **"Using Preplai, ..."**

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Claude Desktop doesn't see preplai | Restart Claude Desktop after editing the config file |
| "Unauthorized" error | **Desktop:** Check that your API token is correct — get a new one from [Dashboard → Keys](https://preplai.com/dashboard/keys). **Web:** Re-authorize via Settings → Connectors |
| Config file doesn't exist | Create it at the path listed above. Make sure it's valid JSON |
| Already have other servers | Add preplai inside the existing `"mcpServers"` — don't overwrite the file |
| OAuth fails on claude.ai | Double-check your Client ID and Secret from [Dashboard → Connectors](https://preplai.com/dashboard/connectors) |
| "redirect_uri not registered" | Make sure you added both `https://claude.ai/api/mcp/auth_callback` and `https://claude.com/api/mcp/auth_callback` as redirect URIs in your OAuth client |
