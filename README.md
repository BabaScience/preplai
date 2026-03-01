# preplai

**Cinema-quality visual presentations as an agent-native MCP API**

Turn structured tool calls into live SVG + GSAP animations. An AI agent calls 8 MCP tools → preplai compiles visual scripts into animated scenes → a browser player renders them in real-time over SSE.

---

## Getting Started

### 1. Get your API key

```bash
curl -X POST https://api.preplai.com/api/keys \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com"}'
```

You'll receive a key like `plai_a1b2c3d4e5f6...` — store it securely, it's shown only once.

### 2. Connect to Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "preplai": {
      "command": "node",
      "args": ["/path/to/packages/mcp-server/dist/stdio-bridge.js"],
      "env": {
        "PREPLAI_API_KEY": "plai_your_key_here",
        "BASE_URL": "http://localhost:3001"
      }
    }
  }
}
```

Restart Claude Desktop → look for the 🔨 icon → 8 tools available.

### 3. Create your first presentation

Ask Claude: *"Create a presentation about how DNS resolution works"*

The player opens automatically at `http://localhost:3001/player/:sessionId`.

---

## API Authentication

All API endpoints require an `X-Preplai-API-Key` header:

```bash
curl -X POST https://api.preplai.com/api/create-session \
  -H "Content-Type: application/json" \
  -H "X-Preplai-API-Key: plai_your_key_here" \
  -d '{"title": "System Architecture"}'
```

Player URLs are accessible to anyone with the link (the session ID acts as a capability token).

---

## MCP Tools

| Tool | Description |
|---|---|
| `create_session` | Create a new presentation session. Returns `session_id` and `player_url`. |
| `add_scene` | Add a visual scene with SVG elements, transitions, and timing. |
| `update_scene` | Replace an existing scene's visual script. |
| `remove_scene` | Remove frames by index, last N, or clear all. |
| `add_narration` | Add narration text overlay to a specific frame. |
| `get_session_url` | Get the player URL (optionally with session stats). |
| `list_sessions` | List your presentation sessions. |
| `delete_session` | Delete a session and all its data. |

---

## Plans & Limits

| | Free | Pro | Enterprise |
|---|---|---|---|
| Sessions | 5 | 100 | Unlimited |
| Scenes/month | 50 | 2,000 | Unlimited |
| Scenes/session | 10 | 100 | Unlimited |
| Session expiry | 7 days | 90 days | 365 days |

Upgrade at [preplai.com/pricing](https://preplai.com/pricing).

---

## REST API

### Create session
```bash
curl -X POST http://localhost:3001/api/create-session \
  -H "Content-Type: application/json" \
  -H "X-Preplai-API-Key: plai_..." \
  -d '{"title": "Binary Search Explained"}'
```

### Add scene
```bash
curl -X POST http://localhost:3001/api/add-scene \
  -H "Content-Type: application/json" \
  -H "X-Preplai-API-Key: plai_..." \
  -d '{"session_id": "...", "visual_script": {...}}'
```

### Health check (no auth required)
```bash
curl http://localhost:3001/health
```

---

## Player Features

- 1920×1080 SVG canvas with percentage-based positioning
- GSAP 3.13 smooth transitions (fade, slide, scale, morph)
- Dark cinematic theme with radial vignette
- Keyboard navigation (← → arrows) with clickable frame dots
- SSE live updates with auto-reconnect and exponential backoff
- Narrator overlay with glass-morphism styling
- Mobile responsive with touch-friendly controls

---

## Entity Types

**Dedicated renderers**: Server, Database, User, Cloud, Concept, Label, CodeBlock

**Shaped renderers**: Cache (circle), LoadBalancer (hexagon), Decision (diamond), Metric (circle)

**Generic (rounded rect)**: Array, Pointer, BinaryTree, LinkedList, Group, Table, Badge, Equation, Graph2D, FlowDiagram, Timeline, StepList, Definition, Callout, Annotation, Process, Queue, Service, NeuralNetwork, FSM, CPU, Register, MemoryBlock, Packet, ProtocolStack

**Connections**: Arrow, DataFlow (animated dashes), BidirectArrow, DottedArrow

---

## Architecture

Monorepo with 5 packages:

| Package | Status | Purpose |
|---|---|---|
| `@preplai/mcp-server` | **Active (v1)** | Fastify server, SQLite, SSE, MCP tools, auth |
| `@preplai/shared` | Active | Types, schemas, constants |
| `@preplai/compiler` | Future | 5-stage compilation pipeline |
| `@preplai/illustrations` | Future | 88+ SVG component types |
| `@preplai/player` | Future | Scene controller, narrator, iframe bridge |

---

## Tech Stack

- **TypeScript** — strict mode, ESM
- **Fastify 5** — HTTP server
- **better-sqlite3** — WAL-mode persistence
- **@modelcontextprotocol/sdk** — MCP stdio transport
- **Zod** — runtime schema validation
- **GSAP 3.13** — animation engine (CDN, player-side)
- **Vitest + jsdom** — 490+ tests

---

## License

Proprietary — see [LICENSE](LICENSE).
