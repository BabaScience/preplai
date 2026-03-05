# Claude Desktop Setup

**Summary:** This document explains how to connect preplai to Claude Desktop (desktop app) and Claude Web (claude.ai). preplai works with any AI agent — Claude is one popular integration. For ChatGPT, see [ChatGPT Desktop & Web](/docs/chatgpt). For other MCP clients, see the [MCP Tools Reference](/docs/mcp-tools).

**Key terms:** MCP, claude_desktop_config.json, hosted mode, OAuth, BEARER_TOKEN

## Config File Location

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |

## Claude Desktop (Hosted Mode)

1. **Create an access token** (if you don't have one):

   Sign up at [preplai.com](https://preplai.com), then create an access token in the dashboard at [preplai.com/dashboard/keys](https://preplai.com/dashboard/keys).

2. **Add the config** to your Claude Desktop config file:

```json
{
  "mcpServers": {
    "preplai": {
      "command": "npx",
      "args": ["-y", "@pyroprompts/mcp-stdio-to-streamable-http-adapter"],
      "env": {
        "URI": "https://player.preplai.com/mcp",
        "BEARER_TOKEN": "your-access-token"
      }
    }
  }
}
```

Replace `your-access-token` with your access token from the dashboard.

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
