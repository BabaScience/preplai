# Connecting PRE to Claude Desktop via MCP

## Prerequisites

- **Node.js** >= 18 installed
- **Claude Desktop** installed ([download](https://claude.ai/download))
- The PRE codebase on your machine

---

## Step 1 — Install Dependencies

```bash
cd presentation-engine
npm install
```

This installs all workspace packages including `@modelcontextprotocol/sdk`, `fastify`, `better-sqlite3`, and `zod`.

---

## Step 2 — Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in each package's `dist/` folder. The file you need is:

```
packages/mcp-server/dist/stdio-bridge.js
```

---

## Step 3 — Verify the Build

Quick sanity check — make sure the bridge file exists:

```bash
ls packages/mcp-server/dist/stdio-bridge.js
```

You can also test the HTTP server boots correctly:

```bash
node packages/mcp-server/dist/stdio-bridge.js
```

You should see on stderr:
```
[PRE] HTTP server running at http://localhost:3001
[PRE] Player: http://localhost:3001/player/:sessionId
[PRE] MCP stdio bridge connected — ready for Claude Desktop
```

Press `Ctrl+C` to stop it.

---

## Step 4 — Find Your Claude Desktop Config File

The config file location depends on your OS:

| OS      | Path                                                              |
|---------|-------------------------------------------------------------------|
| macOS   | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json`                     |
| Linux   | `~/.config/Claude/claude_desktop_config.json`                     |

If the file doesn't exist yet, create it.

---

## Step 5 — Edit `claude_desktop_config.json`

Open the config file and add the `pre` server entry. Replace `/absolute/path/to` with the actual path to your `presentation-engine` folder:

```json
{
  "mcpServers": {
    "pre": {
      "command": "node",
      "args": [
        "/absolute/path/to/presentation-engine/packages/mcp-server/dist/stdio-bridge.js"
      ],
      "env": {
        "PORT": "3001",
        "BASE_URL": "http://localhost:3001"
      }
    }
  }
}
```

### Examples by OS

**macOS / Linux:**
```json
{
  "mcpServers": {
    "pre": {
      "command": "node",
      "args": [
        "/Users/yourname/projects/presentation-engine/packages/mcp-server/dist/stdio-bridge.js"
      ],
      "env": {
        "PORT": "3001",
        "BASE_URL": "http://localhost:3001"
      }
    }
  }
}
```

**Windows:**
```json
{
  "mcpServers": {
    "pre": {
      "command": "node",
      "args": [
        "C:\\Users\\yourname\\projects\\presentation-engine\\packages\\mcp-server\\dist\\stdio-bridge.js"
      ],
      "env": {
        "PORT": "3001",
        "BASE_URL": "http://localhost:3001"
      }
    }
  }
}
```

> **Already have other MCP servers?** Just add the `"pre"` key alongside them inside the existing `"mcpServers"` object.

---

## Step 6 — Restart Claude Desktop

Completely quit Claude Desktop (not just close the window) and reopen it.

- **macOS**: `Cmd+Q` then relaunch
- **Windows**: Right-click tray icon → Quit, then relaunch

---

## Step 7 — Verify the Connection

In Claude Desktop, you should see a **hammer icon** (🔨) in the input area. Click it to see the 5 PRE tools:

| Tool               | Description                                        |
|--------------------|----------------------------------------------------|
| `create_session`   | Create a new presentation session                  |
| `add_scene`        | Add a visual scene with SVG elements & transitions |
| `update_scene`     | Replace/update an existing scene                   |
| `add_narration`    | Add narration text to a frame                      |
| `get_session_url`  | Get the player URL for a session                   |

If you don't see them, check Claude Desktop's logs:
- **macOS**: `~/Library/Logs/Claude/mcp*.log`
- **Windows**: `%APPDATA%\Claude\logs\mcp*.log`

---

## Step 8 — Test It

Ask Claude to create a presentation. Example prompt:

> "Create a presentation about how binary search works. Use the create_session tool, then add a scene showing an array with a pointer."

Claude will:
1. Call `create_session` → get a `session_id` and `player_url`
2. Call `add_scene` with a visual script containing SVG elements
3. Give you the player URL

Open the player URL in your browser (e.g., `http://localhost:3001/player/abc123`) to see the live presentation.

---

## How It Works

```
┌──────────────────┐     stdio (JSON-RPC)     ┌─────────────────────┐
│  Claude Desktop   │◄────────────────────────►│  stdio-bridge.js     │
│                   │                          │                      │
│  Sends tool calls │                          │  ┌── MCP Server ──┐  │
│  via stdin/stdout │                          │  │ 5 tool handlers│  │
└──────────────────┘                          │  └────────────────┘  │
                                               │                      │
                                               │  ┌── HTTP Server ──┐ │
                                               │  │ Fastify :3001   │ │
                                               │  │ /player/:id     │ │
                                               │  │ /session/:id/   │ │
                                               │  │   events (SSE)  │ │
                                               │  └─────────────────┘ │
                                               └─────────────────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────────┐
                                               │   Browser (Player)   │
                                               │   SVG + GSAP + SSE   │
                                               └─────────────────────┘
```

The `stdio-bridge.js` runs **both**:
- An **MCP stdio server** that Claude Desktop communicates with (over stdin/stdout)
- A **Fastify HTTP server** on port 3001 that serves the player UI and SSE events

When Claude calls a tool (e.g., `add_scene`), the handler updates the session store and pushes the scene via SSE to any open player tab in your browser — live.

---

## Troubleshooting

### "Server disconnected" in Claude Desktop
- Make sure `node` is in your PATH. Run `which node` (macOS/Linux) or `where node` (Windows) to verify.
- Check that the path in `args` is an absolute path and the file exists.
- Check MCP logs (see Step 7).

### Player page is blank
- Make sure the HTTP server is running (it starts automatically with the bridge).
- Check that you're using the correct `session_id` in the URL.
- Open browser DevTools console for errors.

### Port 3001 already in use
Change the port in the config:
```json
"env": {
  "PORT": "3002",
  "BASE_URL": "http://localhost:3002"
}
```

### Using nvm or a Node version manager
Point directly to the Node binary:
```json
{
  "mcpServers": {
    "pre": {
      "command": "/Users/yourname/.nvm/versions/node/v22.0.0/bin/node",
      "args": [
        "/Users/yourname/projects/presentation-engine/packages/mcp-server/dist/stdio-bridge.js"
      ]
    }
  }
}
```
