# Connect Claude

Connect preplai to Claude in about 1 minute. After this, Claude can create animated presentations for you.

---

## Claude Desktop (App)

### 1. Find your config file

| Your computer | Open this file |
|---------------|----------------|
| **Mac** | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| **Windows** | `%APPDATA%\Claude\claude_desktop_config.json` |

If the file doesn't exist yet, create it.

### 2. Paste this config

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

Replace `PASTE_YOUR_TOKEN_HERE` with your access token from the [dashboard](https://preplai.com/dashboard/keys).

> **Already have other MCP servers?** Add the `"preplai": { ... }` block inside your existing `"mcpServers"` object. Don't replace the whole file.

### 3. Restart Claude Desktop

Quit and reopen Claude Desktop. That's it — you're connected.

### 4. Try it

Open a new conversation and type:

> **"Create a presentation about how a load balancer distributes traffic"**

Claude will build the presentation and give you a link to watch it.

---

## Claude Web (claude.ai)

### 1. Create an OAuth client

Go to [preplai.com/dashboard/connectors](https://preplai.com/dashboard/connectors) and create an OAuth client. You'll get a **Client ID** and **Client Secret**.

### 2. Add the connector in Claude

1. Go to [claude.ai](https://claude.ai)
2. Open **Settings → Connectors → Add → Add custom connector**
3. Set the URL to: `https://player.preplai.com/mcp`
4. Open **Advanced settings** and paste your Client ID and Client Secret
5. Click **Add**, then **Connect** to authorize

### 3. Use it in chat

When starting a new conversation, click the **+** button and enable preplai. Then just ask Claude to create a presentation.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Claude doesn't see preplai | Restart Claude Desktop after editing the config file |
| "Unauthorized" error | Check that your token is correct — get a new one from the [dashboard](https://preplai.com/dashboard/keys) |
| Config file doesn't exist | Create it at the path listed above. Make sure it's valid JSON |
| Already have other servers | Add preplai inside the existing `"mcpServers"` — don't overwrite the file |
