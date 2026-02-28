# PRE — Presentation Rendering Engine

Cinema-quality visual presentations as an agent-native API. PRE turns structured tool calls into live SVG + GSAP animations served over SSE — no slides, no static images, just programmatic cinema.

## What It Does

An AI agent calls 5 MCP tools → PRE compiles visual scripts into animated SVG scenes → a browser-based player renders them live with GSAP transitions, narration overlays, and real-time updates via Server-Sent Events.

```
Agent (Claude, etc.)          PRE Server              Browser Player
       │                          │                          │
       ├── create_session ───────►│                          │
       │◄── session_id + url ─────┤                          │
       │                          │                          │
       ├── add_scene(script) ────►│── SSE push ─────────────►│
       │                          │                  SVG + GSAP render
       ├── add_narration ────────►│── SSE push ─────────────►│
       │                          │                  narrator overlay
       └── get_session_url ──────►│                          │
```

## Architecture

Monorepo with 5 packages, each with a single responsibility:

| Package | Purpose | Tests |
|---|---|---|
| `@pre/shared` | Types, schemas, constants, type guards | 101 |
| `@pre/illustrations` | 88+ SVG component types (programmatic, not static files) | 76 |
| `@pre/compiler` | 5-stage pipeline: validate → defaults → positions → connections → temporal | 66 |
| `@pre/player` | Scene controller, fuzzy lookup, narrator, iframe bridge | 89 |
| `@pre/mcp-server` | Fastify server, SQLite persistence, SSE, 5 MCP tool handlers | 128 |

**460 tests** across 20 test files. Built with TDD from the ground up.

## Quick Start

```bash
# Prerequisites: Node.js >= 18
node --version  # v18+ required

# Install
git clone https://github.com/BabaScience/pre.git
cd pre
npm install

# Run tests
npx vitest run

# Start the server
node packages/mcp-server/dist/server.js

# Open a presentation
# http://localhost:3001/player/:sessionId
```

## MCP Tools

PRE exposes 5 tools that any MCP-compatible agent can call:

| Tool | Description |
|---|---|
| `create_session` | Create a new presentation session. Returns `session_id` and `player_url`. |
| `add_scene` | Add a visual scene with SVG elements, transitions, and timing. |
| `update_scene` | Replace/update an existing scene's visual script. |
| `add_narration` | Add narration text to a specific frame. |
| `get_session_url` | Get the player URL (optionally with session stats). |

## Connect to Claude Desktop

PRE includes a stdio bridge for Claude Desktop. See the full guide: **[docs/claude-desktop-setup.md](docs/claude-desktop-setup.md)**

Quick version:

1. `npm install && npm run build`
2. Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "pre": {
      "command": "node",
      "args": ["/path/to/pre/packages/mcp-server/dist/stdio-bridge.js"]
    }
  }
}
```

3. Restart Claude Desktop → look for the 🔨 icon → 5 tools available.

## REST API

Same 5 operations are available as REST endpoints (no MCP SDK needed):

```bash
# Create session
curl -X POST http://localhost:3001/api/create-session \
  -H "Content-Type: application/json" \
  -d '{"title": "Binary Search Explained"}'

# Add scene
curl -X POST http://localhost:3001/api/add-scene \
  -H "Content-Type: application/json" \
  -d '{"session_id": "...", "visual_script": {...}}'

# Health check
curl http://localhost:3001/health
```

## SVG Illustration System

88+ programmatic SVG component types organized into families:

- **Infrastructure**: `server`, `database`, `cloud`, `loadBalancer`, `firewall`, `cdn`, ...
- **Data Structures**: `array`, `linkedList`, `binaryTree`, `hashTable`, `graph`, `stack`, `queue`, ...
- **Algorithms**: `sortVisualization`, `bfsTraversal`, `dfsTraversal`, `pathfinding`, ...
- **Architecture**: `microservice`, `pipeline`, `eventBus`, `messageQueue`, ...
- **Networking**: `packet`, `dns`, `tcp`, `http`, `websocket`, ...
- **Diagrams**: `flowchart`, `sequenceDiagram`, `stateMachine`, `erDiagram`, ...

Every illustration is a pure function `(props) → SVG string` — no static files, fully parameterized with colors, labels, sizes, and state.

## Compiler Pipeline

The 5-stage compiler transforms a high-level visual script into render-ready frames:

```
VisualScript
    │
    ├─ Stage 1: Validate    — Zod schema enforcement
    ├─ Stage 2: Defaults    — Fill colors, sizes, timing
    ├─ Stage 3: Positions   — Percentage-based layout (0-100%)
    ├─ Stage 4: Connections — Arrow routing between elements
    └─ Stage 5: Temporal    — GSAP timeline, transitions, easing
    │
    ▼
CompiledScript (render-ready)
```

## Player

The browser player features:

- **1920×1080 SVG canvas** with percentage-based positioning
- **GSAP 3.13** for smooth transitions (fade, slide, scale, morph)
- **Two-pass rendering**: elements first, arrows second (correct layering)
- **Double-`<g>` pattern**: outer `<g>` for position, inner `<g>` for animation
- **SSE EventSource**: live updates pushed from server
- **Narrator overlay**: typewriter-style text with CSS animations
- **iframe + postMessage bridge**: embed in any page

## Project Structure

```
pre/
├── packages/
│   ├── shared/           # Types, schemas, constants
│   ├── illustrations/    # SVG component registry
│   ├── compiler/         # 5-stage compilation pipeline
│   ├── player/           # Scene controller & narrator
│   └── mcp-server/       # Fastify server, SQLite, SSE, MCP tools
├── architecture/         # Architecture docs (01-08)
├── docs/                 # Guides (Claude Desktop setup, etc.)
├── package.json          # npm workspaces root
├── tsconfig.base.json    # Shared TypeScript config
└── vitest.config.ts      # Test config (jsdom for DOM tests)
```

## Development

```bash
# Run all tests
npx vitest run

# Run tests in watch mode
npx vitest

# Run tests for a specific package
npx vitest run packages/compiler

# Type check
npx tsc --noEmit
```

## Tech Stack

- **TypeScript** — strict mode, ESM modules
- **Fastify 5** — HTTP server
- **better-sqlite3** — WAL-mode persistence
- **@modelcontextprotocol/sdk** — MCP stdio transport
- **Zod** — runtime schema validation
- **GSAP 3.13** — animation engine (CDN, player-side)
- **Vitest + jsdom** — 460 tests

## License

MIT — see [LICENSE](LICENSE).
