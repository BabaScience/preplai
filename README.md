# preplai

**Cinema-quality visual presentations as an agent-native MCP API**

Turn structured tool calls into live SVG + GSAP animations. An AI agent calls 8 MCP tools → preplai compiles visual scripts into animated scenes → a browser player renders them in real-time over SSE. No slides, no static images — programmatic cinema.

---

## 60-Second Quick Start

```bash
# Install and run
npx @preplai/mcp-server

# Or install globally
npm install -g @preplai/mcp-server
preplai
```

Verify the server is running:

```bash
curl http://localhost:3001/health
```

Open `http://localhost:3001/health` in a browser — you should see `{"status":"ok"}`.

---

## Claude Desktop Integration

Add preplai to Claude Desktop so you can create presentations directly from conversations.

**Option 1 — direct node path (recommended):**

```json
{
  "mcpServers": {
    "preplai": {
      "command": "node",
      "args": ["/path/to/node_modules/@preplai/mcp-server/dist/stdio-bridge.js"]
    }
  }
}
```

Replace `/path/to/node_modules` with the actual path where `@preplai/mcp-server` is installed (e.g. after a global install: `$(npm root -g)/@preplai/mcp-server/dist/stdio-bridge.js`).

**Option 2 — npx:**

```json
{
  "mcpServers": {
    "preplai": {
      "command": "npx",
      "args": ["@preplai/mcp-server", "--stdio"]
    }
  }
}
```

Config file location:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Restart Claude Desktop. You should see the 🔨 icon with **8 tools** available.

---

## MCP Tools

| Tool | Description |
|---|---|
| `create_session` | Create a new presentation session. Returns `session_id` and `player_url`. |
| `add_scene` | Add a visual scene with SVG entities, transitions, and timing. |
| `update_scene` | Replace or update an existing scene's visual script. |
| `remove_scene` | Remove a scene from a session by index. |
| `add_narration` | Add a narration text overlay to a specific scene. |
| `get_session_url` | Get the player URL for a session (optionally with stats). |
| `list_sessions` | List all active sessions. |
| `delete_session` | Delete a session and its data. |

---

## REST API

The same operations are available as REST endpoints — no MCP SDK required.

```bash
# Create a session
curl -X POST http://localhost:3001/api/create-session \
  -H "Content-Type: application/json" \
  -d '{"title": "Binary Search Explained"}'

# Add a scene
curl -X POST http://localhost:3001/api/add-scene \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "<session_id>",
    "visual_script": {
      "title": "Scene 1",
      "entities": [
        { "id": "node1", "type": "server", "x": 30, "y": 50, "label": "API Server" }
      ]
    }
  }'

# Health check
curl http://localhost:3001/health
```

---

## Player Features

- **1920×1080 SVG canvas** — percentage-based positioning, scales to any viewport
- **GSAP 3.13** — smooth `fade`, `slide`, `scale`, and `morph` transitions
- **Dark cinematic theme** — deep backgrounds, high-contrast entities
- **Keyboard navigation** — arrow keys to step through scenes
- **SSE live updates** — scenes push instantly to open browsers via `EventSource`
- **Auto-reconnect** — player reconnects automatically if the server restarts
- **Narrator overlay** — typewriter-style text panels synced to scenes
- **iframe + postMessage bridge** — embed any session in any page

---

## Architecture

preplai is a monorepo with 5 packages. Only `mcp-server` ships in v1.

```
preplai/
├── packages/
│   ├── mcp-server/       # Fastify 5 server, SQLite, SSE, 8 MCP tools  ← ships in v1
│   ├── shared/           # Types, schemas, constants, type guards         (internal)
│   ├── compiler/         # 5-stage compilation pipeline                   (future)
│   ├── player/           # Scene controller, narrator, iframe bridge      (future)
│   └── illustrations/    # 88+ programmatic SVG component types           (future)
├── package.json          # npm workspaces root
├── tsconfig.base.json    # Shared TypeScript config
└── vitest.config.ts      # Test config (jsdom for DOM tests)
```

---

## Entity Types

Entities are the visual building blocks of each scene. Specify them by `type` in your visual script.

**Infrastructure**
`server` · `database` · `cloud` · `loadBalancer` · `firewall` · `cdn` · `container` · `vm`

**Data Structures**
`array` · `linkedList` · `binaryTree` · `hashTable` · `graph` · `stack` · `queue` · `heap`

**Algorithms**
`sortVisualization` · `bfsTraversal` · `dfsTraversal` · `pathfinding` · `dpTable`

**Architecture**
`microservice` · `pipeline` · `eventBus` · `messageQueue` · `apiGateway` · `cache`

**Networking**
`packet` · `dns` · `tcp` · `http` · `websocket` · `grpc`

**Diagrams**
`flowchart` · `sequenceDiagram` · `stateMachine` · `erDiagram` · `gantt`

Every entity is a pure function `(props) → SVG string` — fully parameterized with colors, labels, sizes, and state.

---

## Hosted Mode

Deploy preplai behind a public URL and serve presentations to remote viewers.

```bash
PORT=3001 \
BASE_URL=https://your-domain.com \
ALLOWED_ORIGINS=https://your-domain.com \
preplai
```

| Variable | Description |
|---|---|
| `PORT` | HTTP port (default: `3001`) |
| `BASE_URL` | Public URL returned in `player_url` responses |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) |

---

## Development

```bash
# Clone and install
git clone https://github.com/BabaScience/preplai.git
cd preplai
npm install

# Run all tests
npx vitest run

# Watch mode
npx vitest

# Single package
npx vitest run packages/mcp-server

# Type check
npx tsc --noEmit
```

**487+ tests** across 20 test files. Built with TDD from the ground up.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict, ESM) |
| HTTP server | Fastify 5 |
| Persistence | better-sqlite3 (WAL mode) |
| MCP transport | @modelcontextprotocol/sdk |
| Schema validation | Zod |
| Animation engine | GSAP 3.13 (CDN, player-side) |
| Test framework | Vitest + jsdom |

---

## License

MIT — see [LICENSE](LICENSE).
