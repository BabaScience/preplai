# 02 — MCP Server Architecture

**Package:** `@preplai/mcp-server`  
**Version:** V1  
**Transport:** Streamable HTTP (`fastify-mcp-server`)  
**Protocol:** MCP `2025-06-18`  
**SDK:** `@modelcontextprotocol/sdk` v1.18.0  
**Status:** V1 Scope — authoritative rewrite

---

## Table of Contents

1. [Package Overview](#1-package-overview)
2. [Transport: Streamable HTTP](#2-transport-streamable-http)
3. [Protocol Version 2025-06-18](#3-protocol-version-2025-06-18)
4. [Fastify Integration Pattern](#4-fastify-integration-pattern)
5. [Tool Definitions (All 5)](#5-tool-definitions-all-5)
   - 5.1 [create_session](#51-create_session)
   - 5.2 [add_scene](#52-add_scene)
   - 5.3 [update_scene](#53-update_scene)
   - 5.4 [add_narration](#54-add_narration)
   - 5.5 [get_session_url](#55-get_session_url)
6. [Session-Scoped State Management](#6-session-scoped-state-management)
7. [Zod Schema Validation](#7-zod-schema-validation)
8. [SSE Event Pipeline](#8-sse-event-pipeline)
9. [Session Lifecycle](#9-session-lifecycle)
10. [Error Handling Strategy](#10-error-handling-strategy)
11. [Security Model](#11-security-model)
12. [Testing Strategy](#12-testing-strategy)
13. [Full server/index.js Implementation](#13-full-serverindexjs-implementation)
14. [package.json](#14-packagejson)
15. [Configuration Reference](#15-configuration-reference)

---

## 1. Package Overview

### Purpose

`@preplai/mcp-server` is the **primary and only external interface** of the Presentation Rendering Engine (PRE) in V1. It exposes PRE's session and visual-script management capabilities as a set of structured tools that AI agents (Claude, GPT-4o, and any MCP-compatible client) can call natively over HTTP.

All agent interaction flows through this single package. No REST API is exposed directly to external consumers in V1. The server is a thin, opinionated layer that:

1. Accepts MCP tool calls via Streamable HTTP
2. Validates inputs with Zod
3. Persists session state in SQLite
4. Pushes real-time updates to the player via Server-Sent Events (SSE)

### Architecture Position

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AI Agent (Claude, GPT-4o)                      │
│                                                                     │
│  Emits: VisualScript JSON via MCP tool calls                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Streamable HTTP
                               │ POST /mcp  (tool calls)
                               │ GET  /mcp  (SSE stream for MCP)
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  @preplai/mcp-server  (this package)                    │
│                                                                     │
│  fastify-mcp-server plugin                                          │
│    └─ McpServer (SDK v1.18.0)                                       │
│         └─ 5 registered tools (Zod-validated)                      │
│                                                                     │
│  Session store: in-memory Map (V1) → SQLite persistence             │
│  SSE registry:  Map<sessionId, Set<FastifyReply>>                   │
└──────────────────┬──────────────────────────┬───────────────────────┘
                   │ SQLite writes            │ SSE push
                   ▼                          ▼
        ┌──────────────────┐    ┌──────────────────────────────────┐
        │  SQLite Database  │    │  PRE Player (browser, iframe)    │
        │  (better-sqlite3) │    │  EventSource /session/:id/events │
        └──────────────────┘    └──────────────────────────────────┘
```

### Design Principles

- **Agent-first language.** Every tool `description` field is written for an LLM's comprehension — imperative, concrete, no jargon.
- **5 tools, no more.** 1–10 tools is the sweet spot; 5 is optimal for token efficiency and agent comprehension. The agent has full control over a session with exactly 5 calls.
- **Fail with guidance.** All errors include a `suggestion` field. Agents can self-correct without human intervention.
- **Zod validates before any side-effect.** The handler never runs with invalid data.
- **SSE, not polling.** The player connects once via `EventSource`; the server pushes updates as they arrive.

---

## 2. Transport: Streamable HTTP

### Why Not stdio

`StdioServerTransport` is the correct transport for CLI tools invoked by Claude Desktop or an agent framework on the same machine. It is **wrong** for a web service because:

| Concern | stdio | Streamable HTTP |
|---------|-------|-----------------|
| Multi-client sessions | No (single process) | Yes |
| Browser-accessible | No | Yes |
| Concurrent requests | No (sequential stdin) | Yes (HTTP/2 multiplexed) |
| Deployable to VPS | Cumbersome | Native |
| MCP 2025-06-18 spec | Legacy | Compliant |

### The `/mcp` Endpoint

The `fastify-mcp-server` plugin mounts a single endpoint at `/mcp`:

| Method | Purpose |
|--------|---------|
| `POST /mcp` | JSON-RPC 2.0 tool calls, `initialize`, `tools/list` |
| `GET /mcp` | SSE stream for server-to-client MCP notifications (e.g., `notifications/message`) |

The plugin manages all transport lifecycle: `initialize` handshake, capability negotiation, session ID assignment via `Mcp-Session-Id` response header, and connection keep-alive.

### Mcp-Session-Id Header

Each MCP client session receives a unique `Mcp-Session-Id` header on the first `POST /mcp` response. The client must include this header on all subsequent requests to maintain session continuity. The `fastify-mcp-server` plugin handles this automatically when using the MCP SDK client.

```
Client → POST /mcp
         Body: { "method": "initialize", ... }
         
Server → 200 OK
         Mcp-Session-Id: 7f3a9b12-...
         Body: { "result": { "protocolVersion": "2025-06-18", ... } }

Client → POST /mcp
         Mcp-Session-Id: 7f3a9b12-...   ← subsequent requests include this
         Body: { "method": "tools/call", "params": { "name": "create_session", ... } }
```

> **Note:** The `Mcp-Session-Id` is the MCP transport session (connection lifecycle). It is distinct from the PRE `session_id` returned by the `create_session` tool (which identifies a presentation session in the database).

---

## 3. Protocol Version 2025-06-18

All MCP communications declare protocol version `2025-06-18` in the `initialize` handshake. The `fastify-mcp-server` plugin handles this automatically when using `@modelcontextprotocol/sdk` v1.18.0.

### initialize Exchange (Example)

```json
// Client sends:
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},
    "clientInfo": {
      "name": "claude-code",
      "version": "1.0.0"
    }
  }
}

// Server responds:
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2025-06-18",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "pre-visual-engine",
      "version": "1.0.0"
    }
  }
}
```

### tools/list Response

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      { "name": "create_session",  "description": "...", "inputSchema": { ... } },
      { "name": "add_scene",       "description": "...", "inputSchema": { ... } },
      { "name": "update_scene",    "description": "...", "inputSchema": { ... } },
      { "name": "add_narration",   "description": "...", "inputSchema": { ... } },
      { "name": "get_session_url", "description": "...", "inputSchema": { ... } }
    ]
  }
}
```

---

## 4. Fastify Integration Pattern

### Complete Server Setup

```js
// server/index.js
import Fastify          from 'fastify';
import { McpServer }    from '@modelcontextprotocol/sdk/server/mcp.js';
import FastifyMcpServer from 'fastify-mcp-server';
import fastifySSE       from '@fastify/sse';
import { z }            from 'zod';
import Database         from 'better-sqlite3';

// ── Database ─────────────────────────────────────────────────────────────────────
const db = new Database(process.env.DB_PATH ?? './pre.db');
db.pragma('journal_mode = WAL');
initSchema(db);

// ── In-memory session state (fast access layer over SQLite) ─────────────
/** @type {Map<string, object>} */
const sessionStore = new Map();

/** @type {Map<string, Set<import('fastify').FastifyReply>>} */
const sseSubscribers = new Map();

// ── Fastify app ───────────────────────────────────────────────────────────────────
const app = Fastify({ logger: true });
await app.register(fastifySSE);

// ── MCP server ───────────────────────────────────────────────────────────────────
const mcp = new McpServer({
  name:    'pre-visual-engine',
  version: '1.0.0',
});

// Register all 5 tools (see Section 5)
registerTools(mcp);

// ── Mount MCP on /mcp ─────────────────────────────────────────────────────────
// Plugin handles: POST (tool calls), GET (SSE stream), Mcp-Session-Id,
//                 initialize handshake, tools/list, capability negotiation
await app.register(FastifyMcpServer, {
  server:   mcp.server,
  endpoint: '/mcp',
});

// ── SSE endpoint for player ────────────────────────────────────────────────────────
// (separate from MCP transport; this is for the browser player)
app.get('/session/:id/events', (request, reply) => {
  const { id } = request.params;

  // Send initial connected event
  reply.sse({ event: 'connected', data: JSON.stringify({ sessionId: id }) });

  // Register subscriber
  if (!sseSubscribers.has(id)) sseSubscribers.set(id, new Set());
  sseSubscribers.get(id).add(reply);

  // Cleanup on disconnect
  request.raw.on('close', () => {
    sseSubscribers.get(id)?.delete(reply);
  });
});

// ── Player HTML route ────────────────────────────────────────────────────────────
app.get('/player/:sessionId', async (request, reply) => {
  const { sessionId } = request.params;
  const html = buildPlayerHtml(sessionId);
  reply.type('text/html').send(html);
});

// ── Start ───────────────────────────────────────────────────────────────────────
await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' });
```

### SSE Emit Helper

```js
/**
 * Push a JSON event to all SSE subscribers for a session.
 * @param {string}  sessionId
 * @param {object}  event
 */
function sseEmit(sessionId, event) {
  const subscribers = sseSubscribers.get(sessionId);
  if (!subscribers || subscribers.size === 0) return;

  const data = JSON.stringify(event);
  for (const reply of subscribers) {
    try {
      reply.raw.write(`data: ${data}\n\n`);
    } catch (err) {
      // Subscriber disconnected mid-write; remove it
      subscribers.delete(reply);
    }
  }
}
```

### SQLite Schema Initialization

```js
function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      aspect_ratio TEXT NOT NULL DEFAULT '16:9',
      created_at  INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visual_scripts (
      session_id  TEXT PRIMARY KEY,
      script_json TEXT NOT NULL,
      updated_at  INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS narrations (
      id          TEXT PRIMARY KEY,
      session_id  TEXT NOT NULL,
      text        TEXT NOT NULL,
      created_at  INTEGER NOT NULL,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );
  `);
}
```

---

## 5. Tool Definitions (All 5)

The MCP server exposes exactly 5 tools. All tools are registered with `McpServer.tool()` and Zod schemas. The SDK converts Zod schemas to JSON Schema automatically for the `tools/list` response.

### Shared Response Types

```typescript
// Returned in content[0].text as JSON string
interface ToolSuccess<T> {
  success: true;
  data: T;
}

interface ToolError {
  success: false;
  error: {
    code: string;          // Machine-readable: SESSION_NOT_FOUND, VALIDATION_ERROR, etc.
    message: string;       // Human-readable description
    suggestion: string;    // Actionable guidance for agent self-correction
  };
}

type ToolResult<T> = ToolSuccess<T> | ToolError;
```

---

### 5.1 `create_session`

**Description (shown to agent):**
> Creates a new presentation session in the PRE rendering engine. Returns a `session_id` for subsequent tool calls and a `player_url` that can be opened in a browser or embedded in an `<iframe>`. Call this first before adding any scenes.

#### Zod Input Schema

```js
const CreateSessionSchema = z.object({
  title: z.string()
    .min(1)
    .max(200)
    .describe('Human-readable title for this presentation session.'),
  aspect_ratio: z.enum(['16:9', '4:3'])
    .default('16:9')
    .describe('Slide aspect ratio. Default is 16:9.'),
});
```

#### Tool Registration

```js
mcp.tool(
  'create_session',
  'Creates a new presentation session. Returns session_id and player_url. Call this first.',
  CreateSessionSchema.shape,
  async ({ title, aspect_ratio = '16:9' }) => {
    const sessionId = crypto.randomUUID();
    const now = Date.now();

    // Persist to SQLite
    db.prepare(`
      INSERT INTO sessions (id, title, aspect_ratio, created_at)
      VALUES (?, ?, ?, ?)
    `).run(sessionId, title, aspect_ratio, now);

    // Cache in memory for fast access
    sessionStore.set(sessionId, {
      id:           sessionId,
      title,
      aspect_ratio,
      script:       null,
      created_at:   now,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success:    true,
          data: {
            session_id:  sessionId,
            player_url:  `${process.env.BASE_URL}/player/${sessionId}`,
            embed_url:   `${process.env.BASE_URL}/player/${sessionId}?embed=1`,
            title,
            aspect_ratio,
            created_at:  new Date(now).toISOString(),
          },
        }),
      }],
    };
  }
);
```

#### Success Response

```json
{
  "success": true,
  "data": {
    "session_id":   "b3f1c2d4-89ab-4cde-8012-3456789abcde",
    "player_url":   "https://pre.app/player/b3f1c2d4-89ab-4cde-8012-3456789abcde",
    "embed_url":    "https://pre.app/player/b3f1c2d4-89ab-4cde-8012-3456789abcde?embed=1",
    "title":        "Introduction to Binary Search",
    "aspect_ratio": "16:9",
    "created_at":   "2026-02-28T16:00:00.000Z"
  }
}
```

#### Error Cases

| Condition | `error.code` | `error.suggestion` |
|-----------|-------------|-------------------|
| `title` empty or missing | `VALIDATION_ERROR` | Provide a non-empty string for `title`. |
| `aspect_ratio` invalid | `VALIDATION_ERROR` | Use `"16:9"` or `"4:3"`. |
| Database write failure | `DB_ERROR` | Retry. If it persists, check database path and permissions. |

---

### 5.2 `add_scene`

**Description (shown to agent):**
> Adds a VisualScript to an existing session. A VisualScript is a JSON object containing an array of `frames`, where each frame holds an array of `entities` to render. The player receives the script instantly via SSE and begins rendering. Call `create_session` first.

#### Zod Input Schema

```js
// Defined in server/schemas/visual.js — see Section 7 for full schemas
const AddSceneSchema = z.object({
  session_id: z.string()
    .uuid()
    .describe('Session ID returned by create_session.'),
  visual_script: VisualScriptSchema
    .describe('A VisualScript JSON object. Must contain at least one frame.'),
});
```

#### Tool Registration

```js
mcp.tool(
  'add_scene',
  'Push a VisualScript JSON to a session. The player renders it immediately via SSE. Requires a valid session_id from create_session.',
  AddSceneSchema.shape,
  async ({ session_id, visual_script }) => {
    const session = getSession(session_id);
    if (!session) return notFound(session_id);

    // Persist
    const now = Date.now();
    db.prepare(`
      INSERT OR REPLACE INTO visual_scripts (session_id, script_json, updated_at)
      VALUES (?, ?, ?)
    `).run(session_id, JSON.stringify(visual_script), now);

    session.script = visual_script;

    // Push to player in real-time
    sseEmit(session_id, {
      type:   'script_update',
      script: visual_script,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: {
            session_id,
            frame_count: visual_script.frames.length,
            total_duration_ms: visual_script.totalDuration,
            updated_at: new Date(now).toISOString(),
          },
        }),
      }],
    };
  }
);
```

#### Success Response

```json
{
  "success": true,
  "data": {
    "session_id":        "b3f1c2d4-89ab-4cde-8012-3456789abcde",
    "frame_count":       4,
    "total_duration_ms": 16000,
    "updated_at":        "2026-02-28T16:01:00.000Z"
  }
}
```

#### Error Cases

| Condition | `error.code` | `error.suggestion` |
|-----------|-------------|-------------------|
| `session_id` not found | `SESSION_NOT_FOUND` | Call `create_session` first and use the returned `session_id`. |
| `visual_script.frames` empty | `VALIDATION_ERROR` | VisualScript must have at least one frame. Add entities to `frames[0].entities`. |
| Invalid entity `type` | `VALIDATION_ERROR` | Check the entity type against the supported registry (see doc 05). |
| `position.x` or `y` out of 0–100 | `VALIDATION_ERROR` | Entity positions are percentages. Use values 0–100. |

#### Minimal VisualScript Example

```json
{
  "sceneId": "b3f1c2d4-89ab-4cde-8012-3456789abcde",
  "totalDuration": 6000,
  "frames": [
    {
      "startTime": 0,
      "endTime": 6000,
      "entities": [
        {
          "id": "server-1",
          "type": "Server",
          "position": { "x": 30, "y": 50 },
          "label": "API Server",
          "color": "#00e5ff",
          "animation": { "delay": 0, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "db-1",
          "type": "Database",
          "position": { "x": 70, "y": 50 },
          "label": "Postgres",
          "color": "#b388ff",
          "animation": { "delay": 160, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "arrow-1",
          "type": "Arrow",
          "position": { "x": 50, "y": 50 },
          "sourceEntityId": "server-1",
          "targetEntityId": "db-1",
          "label": "SQL query",
          "color": "#ffffff",
          "animation": { "delay": 320 }
        }
      ],
      "narrationSegment": {
        "text": "The API server sends SQL queries to the Postgres database."
      }
    }
  ]
}
```

---

### 5.3 `update_scene`

**Description (shown to agent):**
> Replaces the VisualScript for an existing session with a new one. Use this to revise a presentation after the initial `add_scene` call. The player receives the update instantly via SSE and re-renders from frame 0.

#### Zod Input Schema

```js
const UpdateSceneSchema = z.object({
  session_id: z.string()
    .uuid()
    .describe('Session ID returned by create_session.'),
  visual_script: VisualScriptSchema
    .describe('The new VisualScript. Replaces the current script entirely.'),
});
```

#### Tool Registration

```js
mcp.tool(
  'update_scene',
  'Replace the VisualScript for a session with a revised version. Player re-renders immediately. Use this to fix a scene after add_scene.',
  UpdateSceneSchema.shape,
  async ({ session_id, visual_script }) => {
    const session = getSession(session_id);
    if (!session) return notFound(session_id);

    const now = Date.now();
    db.prepare(`
      INSERT OR REPLACE INTO visual_scripts (session_id, script_json, updated_at)
      VALUES (?, ?, ?)
    `).run(session_id, JSON.stringify(visual_script), now);

    session.script = visual_script;

    sseEmit(session_id, {
      type:   'script_update',
      script: visual_script,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: {
            session_id,
            frame_count:       visual_script.frames.length,
            total_duration_ms: visual_script.totalDuration,
            updated_at:        new Date(now).toISOString(),
          },
        }),
      }],
    };
  }
);
```

#### Success Response

```json
{
  "success": true,
  "data": {
    "session_id":        "b3f1c2d4-89ab-4cde-8012-3456789abcde",
    "frame_count":       6,
    "total_duration_ms": 24000,
    "updated_at":        "2026-02-28T16:05:00.000Z"
  }
}
```

---

### 5.4 `add_narration`

**Description (shown to agent):**
> Attaches a narration text string to a session. In V1, narration is stored and displayed as caption text in the player, synchronized with the VisualScript frame timing. Voice synthesis (TTS) is a V2 feature.

#### Zod Input Schema

```js
const AddNarrationSchema = z.object({
  session_id: z.string()
    .uuid()
    .describe('Session ID returned by create_session.'),
  text: z.string()
    .min(1)
    .max(5000)
    .describe('The narration text. Plain text; no Markdown. Shown as a caption in the player.'),
  frame_index: z.number()
    .int()
    .min(0)
    .optional()
    .describe('Zero-based frame index to attach this narration to. Defaults to 0.'),
});
```

#### Tool Registration

```js
mcp.tool(
  'add_narration',
  'Attach narration text to a session frame. Text is shown as a caption in the player, synchronized with frame timing. Call after add_scene.',
  AddNarrationSchema.shape,
  async ({ session_id, text, frame_index = 0 }) => {
    const session = getSession(session_id);
    if (!session) return notFound(session_id);

    const narrationId = crypto.randomUUID();
    const now = Date.now();

    db.prepare(`
      INSERT INTO narrations (id, session_id, text, created_at)
      VALUES (?, ?, ?, ?)
    `).run(narrationId, session_id, text, now);

    // Push narration update to player
    sseEmit(session_id, {
      type:        'narration_update',
      narrationId,
      text,
      frame_index,
    });

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          data: {
            narration_id: narrationId,
            session_id,
            frame_index,
            text_length:  text.length,
            created_at:   new Date(now).toISOString(),
          },
        }),
      }],
    };
  }
);
```

#### Success Response

```json
{
  "success": true,
  "data": {
    "narration_id": "f9e8d7c6-abcd-ef01-2345-6789abcdef01",
    "session_id":   "b3f1c2d4-89ab-4cde-8012-3456789abcde",
    "frame_index":  0,
    "text_length":  87,
    "created_at":   "2026-02-28T16:02:00.000Z"
  }
}
```

#### Error Cases

| Condition | `error.code` | `error.suggestion` |
|-----------|-------------|-------------------|
| `session_id` not found | `SESSION_NOT_FOUND` | Verify `session_id` from `create_session`. |
| `text` empty | `VALIDATION_ERROR` | Provide non-empty narration text. |
| `frame_index` out of range | `FRAME_NOT_FOUND` | `frame_index` must be 0 to `frame_count - 1`. Check the frame count returned by `add_scene`. |

---

### 5.5 `get_session_url`

**Description (shown to agent):**
> Returns the player URL and embed URL for an existing session. Use this to retrieve the URL at any point after `create_session`, or to share the presentation link after all scenes are added.

#### Zod Input Schema

```js
const GetSessionUrlSchema = z.object({
  session_id: z.string()
    .uuid()
    .describe('Session ID returned by create_session.'),
  include_stats: z.boolean()
    .default(false)
    .describe('If true, include frame count and session metadata in the response.'),
});
```

#### Tool Registration

```js
mcp.tool(
  'get_session_url',
  'Returns the player URL and embed URL for an existing session. Use this to get the shareable link after building your presentation.',
  GetSessionUrlSchema.shape,
  async ({ session_id, include_stats = false }) => {
    const session = getSession(session_id);
    if (!session) return notFound(session_id);

    const data = {
      session_id,
      player_url: `${process.env.BASE_URL}/player/${session_id}`,
      embed_url:  `${process.env.BASE_URL}/player/${session_id}?embed=1`,
    };

    if (include_stats) {
      const scriptRow = db.prepare(
        'SELECT script_json FROM visual_scripts WHERE session_id = ?'
      ).get(session_id);

      const script = scriptRow ? JSON.parse(scriptRow.script_json) : null;

      data.title            = session.title;
      data.aspect_ratio     = session.aspect_ratio;
      data.frame_count      = script?.frames?.length ?? 0;
      data.total_duration_ms = script?.totalDuration ?? 0;
      data.created_at       = new Date(session.created_at).toISOString();
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({ success: true, data }),
      }],
    };
  }
);
```

#### Success Response (with include_stats: true)

```json
{
  "success": true,
  "data": {
    "session_id":        "b3f1c2d4-89ab-4cde-8012-3456789abcde",
    "player_url":        "https://pre.app/player/b3f1c2d4-89ab-4cde-8012-3456789abcde",
    "embed_url":         "https://pre.app/player/b3f1c2d4-89ab-4cde-8012-3456789abcde?embed=1",
    "title":             "Introduction to Binary Search",
    "aspect_ratio":      "16:9",
    "frame_count":       4,
    "total_duration_ms": 16000,
    "created_at":        "2026-02-28T16:00:00.000Z"
  }
}
```

---

## 6. Session-Scoped State Management

### In-Memory Session Store (V1)

Sessions are stored in an in-memory `Map` for fast access. SQLite is the durable backing store. On startup, the server loads all sessions from SQLite into the memory store.

```js
/**
 * In-memory session store.
 * Key:   session UUID string
 * Value: { id, title, aspect_ratio, script, created_at }
 */
const sessionStore = new Map();

/**
 * Load sessions from SQLite on startup.
 * Ensures the memory store is warm even after a server restart.
 */
function loadSessionsFromDb(db) {
  const sessions = db.prepare('SELECT * FROM sessions').all();
  for (const row of sessions) {
    const scriptRow = db.prepare(
      'SELECT script_json FROM visual_scripts WHERE session_id = ?'
    ).get(row.id);

    sessionStore.set(row.id, {
      id:           row.id,
      title:        row.title,
      aspect_ratio: row.aspect_ratio,
      script:       scriptRow ? JSON.parse(scriptRow.script_json) : null,
      created_at:   row.created_at,
    });
  }
}

/**
 * Retrieve a session from the store.
 * Returns null if not found (caller should return SESSION_NOT_FOUND error).
 */
function getSession(sessionId) {
  return sessionStore.get(sessionId) ?? null;
}
```

### SSE Subscriber Registry

```js
/**
 * SSE subscriber registry.
 * Key:   session UUID string
 * Value: Set of active FastifyReply objects (one per open player tab)
 */
const sseSubscribers = new Map();
```

Each time the player opens `/session/:id/events`, a new reply is added to the set. When the browser disconnects (tab close, navigation), the `request.raw.on('close')` handler removes it. Multiple browser tabs can subscribe to the same session simultaneously — all receive the same SSE events.

### V2 Scaling Note

The in-memory approach works for V1 (single VPS). For horizontal scaling (V2), replace the `Map` with a Redis pub/sub:

```
V1: sessionStore (in-memory Map) + sseSubscribers (in-memory Map)
V2: sessionStore (Redis hash)    + sseSubscribers (Redis pub/sub channels)
```

---

## 7. Zod Schema Validation

All tool inputs are validated with Zod before the handler runs. Validation failures return a structured `ToolError` without reaching handler code.

### VisualEntity Schema

```js
// server/schemas/visual.js

import { z } from 'zod';

export const VisualEntitySchema = z.object({
  id:       z.string().min(1),
  type:     z.string().min(1),
  position: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  }),
  size:      z.number().positive().optional(),
  label:     z.string().optional(),
  color:     z.string().optional(),
  highlight: z.boolean().optional(),
  animation: z.object({
    delay:    z.number().min(0).optional(),
    duration: z.number().min(0).optional(),
    easing:   z.string().optional(),
    entrance: z.string().optional(),
  }).optional(),
  sourceEntityId: z.string().optional(),
  targetEntityId: z.string().optional(),
  parentEntityId: z.string().optional(),
  textContent:    z.string().optional(),
  metadata:       z.record(z.unknown()).optional(),
});
```

### IllustrationFrame Schema

```js
export const IllustrationFrameSchema = z.object({
  startTime: z.number().min(0),
  endTime:   z.number().min(0),
  entities:  z.array(VisualEntitySchema),
  transitions: z.array(z.object({
    entityId: z.string(),
    from:     z.record(z.unknown()),
    to:       z.record(z.unknown()),
    duration: z.number().min(0),
    easing:   z.string().optional(),
  })).optional(),
  narrationSegment: z.object({
    text:     z.string(),
    audioUrl: z.string().url().optional(),
  }).optional(),
});
```

### VisualScript Schema

```js
export const VisualScriptSchema = z.object({
  sceneId:       z.string().uuid(),
  totalDuration: z.number().min(0),
  frames:        z.array(IllustrationFrameSchema).min(1),
  meta:          z.record(z.unknown()).optional(),
});
```

### Validation Error Response

When Zod validation fails, the handler returns this structure:

```js
function validationError(zodError) {
  const issues = zodError.issues
    .map(i => `${i.path.join('.')}: ${i.message}`)
    .join('; ');

  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: {
          code:       'VALIDATION_ERROR',
          message:    `Input validation failed: ${issues}`,
          suggestion: 'Fix the listed field errors and retry the tool call.',
        },
      }),
    }],
  };
}
```

### How `McpServer.tool()` Validates

When you call `mcp.tool(name, description, schemaShape, handler)`, the SDK:

1. Converts the Zod shape to JSON Schema for `tools/list`
2. Parses the incoming `arguments` with `z.object(schemaShape).safeParse(args)`
3. If validation fails, returns a `INVALID_PARAMS` JSON-RPC error automatically
4. If validation passes, calls your handler with the parsed, typed arguments

Your handler code **never runs with invalid data**. This is a hard guarantee from the SDK.

---

## 8. SSE Event Pipeline

SSE is used for two separate purposes in PRE:

1. **MCP transport SSE** (`GET /mcp`): Server-to-client MCP protocol messages. Managed by `fastify-mcp-server` plugin. Agents don't interact with this directly — the SDK handles it.
2. **Player SSE** (`GET /session/:id/events`): Real-time VisualScript pushes to the browser player. This is the PRE-specific SSE pipeline.

This section covers #2 only.

### Event Types

| Event Type | Direction | Payload | Triggered By |
|-----------|-----------|---------|-------------|
| `connected` | Server → Player | `{ sessionId }` | Player SSE connection opens |
| `script_update` | Server → Player | `{ type: 'script_update', script: VisualScript }` | `add_scene` or `update_scene` tool call |
| `narration_update` | Server → Player | `{ type: 'narration_update', narrationId, text, frame_index }` | `add_narration` tool call |

### SSE Wire Format

All player SSE events follow the standard SSE wire format:

```
data: {"type":"script_update","script":{...}}

```

Two newlines (`\n\n`) terminate each event. No `event:` field is used — the `type` field inside the JSON data identifies the event type.

### Player EventSource Handler

```js
// player/player.js (simplified)
const sse = new EventSource(`/session/${SESSION_ID}/events`);

sse.onmessage = (event) => {
  const payload = JSON.parse(event.data);

  switch (payload.type) {
    case 'script_update':
      sceneController.loadScript(payload.script);
      break;
    case 'narration_update':
      sceneController.updateNarration(payload.frame_index, payload.text);
      break;
  }
};

sse.onerror = () => {
  // EventSource auto-reconnects with exponential backoff
  // No explicit handling needed; the browser manages reconnection
};
```

### Reconnection Behavior

`EventSource` reconnects automatically on connection loss. The browser:
1. Waits a platform-defined delay (typically 3 seconds)
2. Re-sends `GET /session/:id/events` with `Last-Event-ID` header (if server set event IDs)
3. Server re-adds the reply to `sseSubscribers`

In V1, events are not given IDs, so `Last-Event-ID` is not supported. On reconnect, the player re-renders from the session's current stored script (loaded from SQLite via `add_scene`). This is acceptable for V1 since the stored script is always the latest.

---

## 9. Session Lifecycle

```
State:  CREATED  →  SCRIPTED  →  LIVE  →  EXPIRED
                                          (V2 feature)

Transitions:
  CREATED  → SCRIPTED:  add_scene tool call succeeds
  SCRIPTED → SCRIPTED:  update_scene replaces script
  SCRIPTED → LIVE:      player opens /player/:id in browser
  LIVE     → LIVE:      add_scene / update_scene / add_narration live-updates
  LIVE     → EXPIRED:   TTL passes (V2) or explicit delete (V2)
```

### Session Startup Hydration

When the player loads `/player/:id`:

1. Player JS boots and connects to `GET /session/:id/events`
2. Server sends `connected` SSE event
3. If the session has a stored script, server sends an immediate `script_update` event
4. Player renders the current script state

This ensures the player is never blank even if the agent called `add_scene` before the browser was open.

```js
// In the SSE route handler:
app.get('/session/:id/events', (request, reply) => {
  const { id } = request.params;

  reply.sse({ event: 'connected', data: JSON.stringify({ sessionId: id }) });

  // Hydrate: send current script if session already has one
  const session = getSession(id);
  if (session?.script) {
    reply.sse({
      data: JSON.stringify({ type: 'script_update', script: session.script })
    });
  }

  // Register subscriber for future updates
  if (!sseSubscribers.has(id)) sseSubscribers.set(id, new Set());
  sseSubscribers.get(id).add(reply);

  request.raw.on('close', () => {
    sseSubscribers.get(id)?.delete(reply);
  });
});
```

---

## 10. Error Handling Strategy

### Error Response Structure

All tool errors return a structured JSON payload in `content[0].text`:

```js
function toolError(code, message, suggestion) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({
        success: false,
        error: { code, message, suggestion },
      }),
    }],
  };
}

function notFound(sessionId) {
  return toolError(
    'SESSION_NOT_FOUND',
    `Session "${sessionId}" does not exist.`,
    'Use create_session to create a new session, then use the returned session_id.'
  );
}
```

### Error Code Registry

| Code | When Used | Agent Recovery |
|------|-----------|----------------|
| `SESSION_NOT_FOUND` | `session_id` not in store | Call `create_session` first |
| `VALIDATION_ERROR` | Zod schema fails | Fix specific field per `message` |
| `FRAME_NOT_FOUND` | `frame_index` ≥ frame count | Use valid `frame_index` (0 to frame_count−1) |
| `DB_ERROR` | SQLite write fails | Retry; check disk space |
| `INTERNAL_ERROR` | Unexpected exception | Log and report; server may need restart |

### Unhandled Exceptions

All tool handlers are wrapped in try/catch:

```js
mcp.tool('add_scene', '...', AddSceneSchema.shape, async (args) => {
  try {
    // ... handler code
  } catch (err) {
    app.log.error({ err }, 'add_scene tool error');
    return toolError(
      'INTERNAL_ERROR',
      'An unexpected error occurred while processing add_scene.',
      'Retry the call. If the error persists, check server logs.'
    );
  }
});
```

---

## 11. Security Model

### API Key Authentication

V1 uses a simple static API key for authentication. The key is passed in the `x-api-key` header on all MCP requests.

```js
// Fastify preHandler hook
app.addHook('preHandler', (request, reply, done) => {
  // Only enforce on /mcp routes
  if (!request.url.startsWith('/mcp')) return done();

  const key = request.headers['x-api-key'];
  if (!key) {
    reply.code(401).send({ error: 'Missing x-api-key header' });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  const valid = timingSafeEqual(
    Buffer.from(key),
    Buffer.from(process.env.API_KEY)
  );
  if (!valid) {
    reply.code(403).send({ error: 'Invalid API key' });
    return;
  }

  done();
});
```

### Player Route Security

The player (`/player/:sessionId`) and SSE (`/session/:id/events`) endpoints are public in V1 — anyone with the session URL can view the presentation. This is intentional: sessions are designed to be shareable.

Session IDs are UUIDs (128 bits of entropy). Brute-forcing a valid session ID is computationally infeasible.

### HTTPS Enforcement

TLS termination happens at the nginx reverse proxy layer, not inside Fastify. See architecture/08-deployment.md for nginx configuration.

---

## 12. Testing Strategy

### Unit Tests (`vitest`)

```typescript
// packages/mcp-server/test/tools.test.ts

import { describe, it, expect, beforeEach } from 'vitest';
import { buildApp } from '../src/server.js';

describe('create_session tool', () => {
  it('returns session_id and player_url', async () => {
    const app = await buildApp({ dbPath: ':memory:' });
    const response = await app.inject({
      method: 'POST',
      url:    '/mcp',
      headers: { 'x-api-key': 'test-key', 'content-type': 'application/json' },
      payload: {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'create_session',
          arguments: { title: 'Test Session' },
        },
      },
    });

    const body = JSON.parse(response.body);
    const result = JSON.parse(body.result.content[0].text);

    expect(result.success).toBe(true);
    expect(result.data.session_id).toMatch(/^[0-9a-f-]{36}$/);
    expect(result.data.player_url).toContain(result.data.session_id);
  });
});

describe('add_scene tool', () => {
  it('pushes script_update SSE event', async () => {
    // ... test implementation
  });

  it('returns SESSION_NOT_FOUND for invalid session_id', async () => {
    // ... test implementation
  });
});
```

### Integration Test: End-to-End SSE Push

```typescript
// packages/mcp-server/test/sse.test.ts

import EventSource from 'eventsource';

it('player receives script_update after add_scene', async () => {
  const app = await buildApp({ dbPath: ':memory:' });
  await app.listen({ port: 0 });
  const port = app.server.address().port;

  // 1. Create session
  const session = await mcpToolCall(app, 'create_session', { title: 'E2E Test' });

  // 2. Open SSE connection
  const received = [];
  const sse = new EventSource(`http://localhost:${port}/session/${session.session_id}/events`);
  sse.onmessage = (e) => received.push(JSON.parse(e.data));

  // 3. Add scene
  await mcpToolCall(app, 'add_scene', {
    session_id: session.session_id,
    visual_script: MINIMAL_SCRIPT,
  });

  // 4. Assert SSE event received
  await waitFor(() => received.length > 0);
  expect(received[0].type).toBe('script_update');
  expect(received[0].script.frames.length).toBe(1);

  sse.close();
  await app.close();
});
```

---

## 13. Full server/index.js Implementation

The complete reference implementation of `packages/mcp-server/src/server.js`:

```js
import Fastify          from 'fastify';
import { McpServer }    from '@modelcontextprotocol/sdk/server/mcp.js';
import FastifyMcpServer from 'fastify-mcp-server';
import fastifySSE       from '@fastify/sse';
import { z }            from 'zod';
import Database         from 'better-sqlite3';
import { randomUUID }   from 'crypto';
import { timingSafeEqual } from 'crypto';

import {
  VisualScriptSchema,
  VisualEntitySchema,
  IllustrationFrameSchema,
} from './schemas/visual.js';

// ── Database setup ─────────────────────────────────────────────────────────────────

export function buildApp({ dbPath = process.env.DB_PATH ?? './pre.db' } = {}) {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initSchema(db);

  const sessionStore = new Map();
  const sseSubscribers = new Map();
  loadSessionsFromDb(db, sessionStore);

  const app = Fastify({ logger: process.env.NODE_ENV !== 'test' });

  // ── Plugins ──────────────────────────────────────────────────────────────────────
  app.register(fastifySSE);

  // ── Auth hook ────────────────────────────────────────────────────────────────────
  app.addHook('preHandler', (request, reply, done) => {
    if (!request.url.startsWith('/mcp')) return done();
    const key = request.headers['x-api-key'];
    if (!key || !timingSafeEqual(Buffer.from(key), Buffer.from(process.env.API_KEY ?? 'dev'))) {
      reply.code(key ? 403 : 401).send({ error: key ? 'Invalid API key' : 'Missing x-api-key header' });
      return;
    }
    done();
  });

  // ── MCP server ───────────────────────────────────────────────────────────────────
  const mcp = new McpServer({ name: 'pre-visual-engine', version: '1.0.0' });
  registerTools(mcp, { db, sessionStore, sseSubscribers });
  app.register(FastifyMcpServer, { server: mcp.server, endpoint: '/mcp' });

  // ── Player SSE ───────────────────────────────────────────────────────────────────
  app.get('/session/:id/events', (request, reply) => {
    const { id } = request.params;
    reply.sse({ data: JSON.stringify({ type: 'connected', sessionId: id }) });

    const session = sessionStore.get(id);
    if (session?.script) {
      reply.sse({ data: JSON.stringify({ type: 'script_update', script: session.script }) });
    }

    if (!sseSubscribers.has(id)) sseSubscribers.set(id, new Set());
    sseSubscribers.get(id).add(reply);
    request.raw.on('close', () => sseSubscribers.get(id)?.delete(reply));
  });

  // ── Player HTML ───────────────────────────────────────────────────────────────────
  app.get('/player/:sessionId', async (request, reply) => {
    reply.type('text/html').send(buildPlayerHtml(request.params.sessionId));
  });

  return app;
}

// ── Helpers ────────────────────────────────────────────────────────────────────────

function sseEmit(sseSubscribers, sessionId, event) {
  const subscribers = sseSubscribers.get(sessionId);
  if (!subscribers || !subscribers.size) return;
  const data = JSON.stringify(event);
  for (const reply of subscribers) {
    try { reply.raw.write(`data: ${data}\n\n`); }
    catch { subscribers.delete(reply); }
  }
}

function toolError(code, message, suggestion) {
  return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: { code, message, suggestion } }) }] };
}

function notFound(sessionId) {
  return toolError('SESSION_NOT_FOUND', `Session "${sessionId}" not found.`, 'Call create_session first.');
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, title TEXT NOT NULL, aspect_ratio TEXT NOT NULL DEFAULT '16:9', created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS visual_scripts (session_id TEXT PRIMARY KEY, script_json TEXT NOT NULL, updated_at INTEGER NOT NULL, FOREIGN KEY (session_id) REFERENCES sessions(id));
    CREATE TABLE IF NOT EXISTS narrations (id TEXT PRIMARY KEY, session_id TEXT NOT NULL, text TEXT NOT NULL, created_at INTEGER NOT NULL, FOREIGN KEY (session_id) REFERENCES sessions(id));
  `);
}

function loadSessionsFromDb(db, sessionStore) {
  for (const row of db.prepare('SELECT * FROM sessions').all()) {
    const scriptRow = db.prepare('SELECT script_json FROM visual_scripts WHERE session_id = ?').get(row.id);
    sessionStore.set(row.id, { ...row, script: scriptRow ? JSON.parse(scriptRow.script_json) : null });
  }
}

function registerTools(mcp, { db, sessionStore, sseSubscribers }) {
  // ... (all 5 tool registrations as described in Section 5)
}

// Entry point
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const app = buildApp();
  await app.listen({ port: Number(process.env.PORT ?? 3001), host: '0.0.0.0' });
}
```

---

## 14. package.json

```json
{
  "name": "@preplai/mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "src/server.js",
  "scripts": {
    "start":       "node src/server.js",
    "dev":         "node --watch src/server.js",
    "test":        "vitest run",
    "test:watch":  "vitest",
    "build":       "tsc --project tsconfig.json"
  },
  "dependencies": {
    "@fastify/sse":                    "^2.3.0",
    "@modelcontextprotocol/sdk":        "^1.18.0",
    "better-sqlite3":                  "^9.4.3",
    "fastify":                         "^5.0.0",
    "fastify-mcp-server":              "latest",
    "zod":                             "^3.22.0"
  },
  "devDependencies": {
    "@types/better-sqlite3":  "^7.6.12",
    "@types/node":            "^22.0.0",
    "eventsource":            "^2.0.2",
    "typescript":             "^5.0.0",
    "vitest":                 "^2.0.0"
  }
}
```

---

## 15. Configuration Reference

| Environment Variable | Required | Default | Description |
|---------------------|----------|---------|-------------|
| `PORT` | No | `3001` | Fastify listen port |
| `DB_PATH` | No | `./pre.db` | SQLite database file path |
| `BASE_URL` | Yes | — | Public base URL for player links (e.g., `https://pre.app`) |
| `API_KEY` | Yes | `dev` (test only) | Static API key for `x-api-key` authentication |
| `NODE_ENV` | No | — | Set to `test` to disable Fastify logger in tests |

### Example `.env`

```bash
PORT=3001
DB_PATH=/data/pre.db
BASE_URL=https://pre.your-domain.com
API_KEY=your-secret-api-key-here
```

---

*Document: `architecture/02-mcp-server.md`*
*Part of: [Presentation Rendering Engine](../README.md)*
*Previous: [01 — System Overview](./01-system-overview.md) | Next: [03 — PML Scene Compiler](./03-pml-scene-compiler.md)*

*Revision history: V1 — Authoritative rewrite. Replaces ad-hoc notes. Aligns with SDK v1.18.0 and Streamable HTTP transport. Covers the complete 5-tool design. Supersedes the stdio-based V1.0 document. V2 planned additions: Redis session store for horizontal scaling, TTS narration pipeline, agent-driven seek/patch tools, session TTL/expiry.*
