# 07 — API Specification

**Version:** 1.0  
**Status:** Authoritative  
**Last Updated:** 2026-02-28  
**Stack:** Fastify 5 (Node.js ≥18), SQLite (`better-sqlite3`), MCP SDK 1.18.0  
**Protocol:** MCP 2025-06-18, Streamable HTTP transport

> This document covers both the MCP endpoint (agent-facing) and the REST endpoints (player-facing and internal). Agents interact exclusively through MCP tools. Browser players interact through the REST player endpoints and SSE stream.

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Server Configuration & Entry Point](#2-server-configuration--entry-point)
3. [Authentication](#3-authentication)
4. [MCP Endpoint — POST/GET/DELETE /mcp](#4-mcp-endpoint--postgetdelete-mcp)
5. [MCP Tools (5 Tools)](#5-mcp-tools-5-tools)
6. [REST Endpoints — Internal (Agent/Server)](#6-rest-endpoints--internal-agentserver)
7. [REST Endpoints — Player](#7-rest-endpoints--player)
8. [SSE Event Stream — GET /api/sessions/:id/sse](#8-sse-event-stream--get-apisessionsidsse)
9. [SQLite Schema Reference](#9-sqlite-schema-reference)
10. [Fastify Plugin Architecture](#10-fastify-plugin-architecture)
11. [Request Validation](#11-request-validation)
12. [Error Handling](#12-error-handling)
13. [Rate Limiting Policy](#13-rate-limiting-policy)
14. [CORS Configuration](#14-cors-configuration)
15. [Session Lifecycle & TTL](#15-session-lifecycle--ttl)
16. [Logging & Observability](#16-logging--observability)
17. [Testing Strategy](#17-testing-strategy)

---

## 1. API Overview

The PRE server is a single **Fastify HTTP process** that serves three distinct consumers:

| Consumer | Transport | Auth | Description |
|----------|-----------|------|-------------|
| **LLM Agent** | MCP Streamable HTTP (`/mcp`) | `X-API-Key` header | Creates sessions, pushes VisualScript JSON, controls playback |
| **Browser Player** | REST + SSE | Session token (URL-embedded) | Renders the visual presentation in an iframe |
| **Host Page** | Static assets (`/player/*`) | None | Loads compiled JS/CSS for the player |

### Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────┐
│  LLM Agent (Claude, GPT-4, etc.)                                   │
│                                                                     │
│  MCP Tool Calls:                                                   │
│    create_session → add_scene → add_narration → get_session_url     │
└──────────────────────────┬─────────────────────────────────────────┘
                           │ POST /mcp (JSON-RPC 2.0)
                           │ MCP Protocol 2025-06-18
                           │ Streamable HTTP transport
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│  PRE Server (Fastify 5 + fastify-mcp-server)                       │
│                                                                     │
│  POST/GET/DELETE /mcp  ──► McpServer (5 tools)                     │
│                                  │                                 │
│  SQLite (better-sqlite3)  ◄───── │ ──► sseEmit(sessionId, event)   │
│                                  │          │                      │
│  GET /api/sessions/:id    ◄──────┘          │                      │
│  GET /api/sessions/:id/scenes               │ SSE push             │
│  GET /api/sessions/:id/sse  ◄───────────────┘                      │
│                                                                     │
│  GET /s/:sessionId      (serves player HTML)                       │
│  GET /player/*          (serves JS/CSS bundle)                     │
└──────────────────────────┬─────────────────────────────────────────┘
                           │ iframe embed
                           ▼
┌────────────────────────────────────────────────────────────────────┐
│  Browser Player (vanilla JS, SVG, GSAP)                            │
│  EventSource → scene controller → component registry → SVG DOM    │
└────────────────────────────────────────────────────────────────────┘
```

### Key Design Choices

| Choice | Rationale |
|--------|-----------|
| `StdioServerTransport` NOT used | stdio is for CLI tools only; web service requires HTTP transport |
| Streamable HTTP via `fastify-mcp-server` | Plugin handles MCP session lifecycle, keepalive, reconnect |
| SSE for player updates (not WebSocket) | One-way push, HTTP/2-compatible, `EventSource` auto-reconnect |
| 5 MCP tools (not 50) | Token efficiency; agents comprehend smaller tool surfaces better |
| SQLite + WAL mode | Zero-dependency persistence; WAL allows concurrent reads without blocking writes |
| `VisualScript` as atomic push unit | One tool call replaces the entire scene; simpler than per-element mutation API |

---

## 2. Server Configuration & Entry Point

### Entry Point

```typescript
// src/index.ts
import { buildServer } from './server';

const app = await buildServer();
await app.listen({
  port: Number(process.env.PORT ?? 3001),
  host: '0.0.0.0',
});
app.log.info(`PRE server listening on port ${process.env.PORT ?? 3001}`);
```

### Server Factory

```typescript
// src/server.ts
import Fastify            from 'fastify';
import { McpServer }      from '@modelcontextprotocol/sdk/server/mcp.js';
import FastifyMcpServer   from 'fastify-mcp-server';
import fastifySSE         from '@fastify/sse';
import fastifyCors        from '@fastify/cors';
import fastifyHelmet      from '@fastify/helmet';
import fastifyRateLimit   from '@fastify/rate-limit';
import fastifyStatic      from '@fastify/static';
import path               from 'path';
import { registerMcpTools }    from './tools';
import { registerApiRoutes }   from './routes/api';
import { registerPlayerRoutes } from './routes/player';
import { runMigrations }        from './db/migrate';
import { openDatabase }         from './db';
import { buildCorsOptions }     from './plugins/cors';
import { authPlugin }           from './plugins/auth';

export async function buildServer(opts: { dbPath?: string } = {}) {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
    },
    genReqId: () => crypto.randomUUID(),
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'reqId',
    trustProxy: true,
  });

  // ── Database ──────────────────────────────────────────────────────────────────
  const db = openDatabase(opts.dbPath ?? process.env.DATABASE_PATH ?? './data/v1.db');
  runMigrations(db);
  app.decorate('db', db);
  app.decorateRequest('apiKey', null);

  // ── Plugins ───────────────────────────────────────────────────────────────────
  await app.register(fastifyHelmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc:  ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
        styleSrc:   ["'self'", "'unsafe-inline'"],
        imgSrc:     ["'self'", 'data:'],
        connectSrc: ["'self'"],
      },
    },
  });
  await app.register(fastifyCors, buildCorsOptions());
  await app.register(fastifyRateLimit, {
    global: false,
    keyGenerator: (req) => (req.headers['x-api-key'] as string) ?? req.ip,
    errorResponseBuilder: (_req, ctx) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Retry after ${ctx.after}.`,
        suggestion: 'Back off and retry after the window resets. Consider batching operations.',
      },
    }),
  });
  await app.register(fastifySSE);
  await app.register(fastifyStatic, {
    root:    path.join(__dirname, '../../player/dist'),
    prefix:  '/player/',
    decorateReply: false,
  });

  // ── MCP Server ────────────────────────────────────────────────────────────────────
  const mcp = new McpServer({
    name:    'pre-visual-engine',
    version: '1.0.0',
  });
  registerMcpTools(mcp, app);

  await app.register(FastifyMcpServer, {
    server:   mcp.server,
    endpoint: '/mcp',
  });

  // ── Routes ────────────────────────────────────────────────────────────────────
  await app.register(registerApiRoutes,    { prefix: '/api' });
  await app.register(registerPlayerRoutes);

  // ── Error Handlers ───────────────────────────────────────────────────────────────
  registerErrorHandlers(app);

  return app;
}
```

### Environment Variables

```bash
# Required
PORT=3001
DATABASE_PATH=./data/v1.db
ADMIN_SECRET=<strong-random-secret>   # Guards API key issuance
BASE_URL=https://your-host.com        # Used for player URL generation

# Optional (with defaults)
NODE_ENV=production
LOG_LEVEL=info
SESSION_TTL_SECONDS=14400             # Default 4 hours
CLEANUP_INTERVAL_MS=3600000          # Cron every 1 hour
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com
MAX_SESSIONS_PER_KEY=100
```

### Dependency Versions (Hard Requirements)

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.18.0",
    "fastify":                   "^5.0.0",
    "fastify-mcp-server":        "latest",
    "@fastify/cors":             "^9.0.0",
    "@fastify/helmet":           "^11.0.0",
    "@fastify/rate-limit":       "^9.0.0",
    "@fastify/sse":              "^2.0.0",
    "@fastify/static":           "^7.0.0",
    "better-sqlite3":            "^9.0.0",
    "zod":                       "^3.22.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

---

## 3. Authentication

### 3a. API Key — MCP and Internal Endpoints

All MCP tool calls and `/api/*` endpoints (except `GET /api/health`) require an API key in the `X-API-Key` header. Authentication is implemented as a Fastify `onRequest` hook scoped to internal routes.

```
X-API-Key: v1_a3f8c2e1d9b4...
```

The raw API key is **never stored**. Only its SHA-256 hex hash is stored in the `api_keys` table. The plaintext key is returned once at creation and must be saved immediately by the caller.

```typescript
// src/plugins/auth.ts
import fp               from 'fastify-plugin';
import { createHash }   from 'crypto';

export const authPlugin = fp(async (app) => {
  app.addHook('onRequest', async (req, reply) => {
    const raw = req.headers['x-api-key'];

    if (!raw || typeof raw !== 'string') {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'X-API-Key header is required.',
          suggestion: 'Include your API key in the X-API-Key request header.',
        },
      });
    }

    const hash = hashApiKey(raw);
    const row = app.db
      .prepare(
        `SELECT id, tier, rate_limit, expires_at
         FROM api_keys
         WHERE key_hash = ?
           AND (expires_at IS NULL OR expires_at > unixepoch())`
      )
      .get(hash) as ApiKeyRow | undefined;

    if (!row) {
      return reply.code(401).send({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'API key not found or expired.',
          suggestion: 'Verify the key value and check its expiry. Request a new key from POST /admin/keys.',
        },
      });
    }

    req.apiKey = row;
  });
});

export function hashApiKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

interface ApiKeyRow {
  id:          number;
  tier:        'developer' | 'startup' | 'scale';
  rate_limit:  number;
  expires_at:  number | null;
}
```

### 3b. Player Endpoints — No Authentication

Player endpoints (`GET /s/:sessionId`, `GET /api/sessions/:id`, SSE) do not require authentication. Sessions are public by their UUID — security is provided by the URL being unguessable.

### 3c. API Key Issuance

Keys are issued via `POST /admin/keys`, protected by the `ADMIN_SECRET` environment variable.

```typescript
// POST /admin/keys
// Authorization: Bearer <ADMIN_SECRET>
```

**Request body:**
```json
{
  "tier": "developer",
  "expiresInDays": 90
}
```

**Response (key shown once — save immediately):**
```json
{
  "success": true,
  "data": {
    "key": "v1_a3f8c2e1d9b4f5e2c8a1b7d3e6f0c9d2",
    "tier": "developer",
    "rateLimit": 100,
    "expiresAt": 1780000000
  }
}
```

**curl:**
```bash
curl -X POST https://host/admin/keys \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"tier":"startup","expiresInDays":365}'
```

---

## 4. MCP Endpoint — POST/GET/DELETE /mcp

The MCP endpoint implements the **MCP 2025-06-18** protocol over **Streamable HTTP transport** via the `fastify-mcp-server` plugin. The plugin handles all transport lifecycle automatically.

### Protocol Version

```
MCP-Protocol-Version: 2025-06-18
```

This is declared in the `initialize` handshake. The `fastify-mcp-server` plugin handles this automatically when using `@modelcontextprotocol/sdk` 1.18.0.

### Endpoint Behavior

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/mcp` | Send a JSON-RPC 2.0 request or notification |
| `GET`  | `/mcp` | Open a streaming SSE channel for server → client messages |
| `DELETE` | `/mcp` | Terminate the MCP session (clean shutdown) |

### Session Management

The `fastify-mcp-server` plugin manages MCP session state via the `Mcp-Session-Id` header:

- First request: server assigns a session ID, returns it in response header
- Subsequent requests: client includes `Mcp-Session-Id` header to resume session
- Session scope: tool state, in-flight requests, server-side subscriptions

### Initialize Handshake

The client (LLM agent / MCP host) must send an `initialize` request before any tool calls:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-06-18",
    "capabilities": {},
    "clientInfo": {
      "name": "claude-desktop",
      "version": "1.0.0"
    }
  }
}
```

**Server response:**
```json
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

### Complete JSON-RPC Tool Call Example

The following shows a full `create_session` tool call in JSON-RPC 2.0 format with all required headers:

**Request:**
```
POST /mcp HTTP/1.1
Host: pre.app
Content-Type: application/json
X-API-Key: v1_a3f8c2e1d9b4f5e2
Accept: application/json, text/event-stream
Mcp-Session-Id: ses_7f3e8a2b-1c4d-5e6f-7a8b-9c0d1e2f3a4b  (omit on first request)

{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "create_session",
    "arguments": {
      "title": "Distributed Systems Fundamentals",
      "domain": "computer-science"
    }
  }
}
```

**Response:**
```
HTTP/1.1 200 OK
Content-Type: application/json
Mcp-Session-Id: ses_7f3e8a2b-1c4d-5e6f-7a8b-9c0d1e2f3a4b

{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\"sessionId\":\"550e8400-e29b-41d4-a716-446655440000\",\"playerUrl\":\"/s/550e8400-e29b-41d4-a716-446655440000\",\"sseUrl\":\"/api/sessions/550e8400-e29b-41d4-a716-446655440000/sse\",\"expiresAt\":\"2026-03-01T20:16:00.000Z\"}"
      }
    ]
  }
}
```

### curl — Tool Call

```bash
curl -X POST https://host/mcp \
  -H "X-API-Key: v1_abc123" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "create_session",
      "arguments": {
        "title": "Q1 2026 Earnings Review"
      }
    }
  }'
```

---

## 5. MCP Tools (5 Tools)

The MCP server exposes exactly **5 tools**. This number is intentional: 1–10 tools is the effective range for LLM comprehension; 5 is optimal for token efficiency. Each tool has a Zod-validated input schema and returns a structured result.

### Tool Registration Pattern

```typescript
// src/tools/index.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  VisualScriptSchema,
  VisualEntityPatchSchema,
  CreateSessionSchema,
} from '../schemas/visual';
import { sseEmit } from '../sse';
import * as db from '../db/queries';

export function registerMcpTools(mcp: McpServer, app: FastifyInstance): void {
  registerCreateSession(mcp, app);
  registerAddScene(mcp, app);
  registerUpdateScene(mcp, app);
  registerAddNarration(mcp, app);
  registerGetSessionUrl(mcp, app);
}
```

---

### Tool 1: `create_session`

**Purpose:** Create a new presentation session. Returns the session ID and the player URL to share.

**Input Schema:**
```typescript
z.object({
  title:      z.string().min(1).max(200).describe('Human-readable presentation title'),
  domain:     z.string().max(100).optional().describe('Subject domain: "distributed systems", "machine learning", "finance", etc.'),
  ttlSeconds: z.number().int().min(60).max(86400).optional().describe('Session TTL in seconds. Default: 14400 (4 hours). Max: 86400 (24 hours).'),
})
```

**Result:**
```typescript
{
  sessionId:  string;  // UUID v4
  playerUrl:  string;  // /s/:sessionId — share this with end users
  sseUrl:     string;  // /api/sessions/:id/sse — SSE stream for player
  expiresAt:  string;  // ISO-8601 expiry timestamp
}
```

**Implementation:**
```typescript
mcp.registerTool('create_session', {
  description: 'Create a new visual presentation session. Returns sessionId and a playerUrl to share with viewers.',
  inputSchema: CreateSessionSchema,
  handler: async ({ title, domain, ttlSeconds }) => {
    const sessionId = crypto.randomUUID();
    const ttl       = ttlSeconds ?? Number(process.env.SESSION_TTL_SECONDS ?? 14400);
    const now       = Math.floor(Date.now() / 1000);
    const expiresAt = now + ttl;

    app.db
      .prepare(`INSERT INTO sessions (id, api_key_id, title, domain, state, status, created_at, updated_at, expires_at)
                VALUES (?, ?, ?, ?, 'idle', 'active', ?, ?, ?)`)
      .run(sessionId, /* apiKeyId from MCP session context */, title, domain ?? null, now, now, expiresAt);

    return {
      sessionId,
      playerUrl:  `${process.env.BASE_URL}/s/${sessionId}`,
      sseUrl:     `${process.env.BASE_URL}/api/sessions/${sessionId}/sse`,
      expiresAt:  new Date(expiresAt * 1000).toISOString(),
    };
  },
});
```

**curl:**
```bash
curl -X POST https://host/mcp \
  -H "X-API-Key: v1_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":1,"method":"tools/call",
    "params":{"name":"create_session","arguments":{"title":"Intro to TCP/IP","domain":"networking"}}
  }'
```

**Error cases:**

| Condition | Error Code | HTTP |
|-----------|-----------|------|
| Missing API key | `MISSING_API_KEY` | 401 |
| Invalid/expired API key | `INVALID_API_KEY` | 401 |
| title empty or > 200 chars | `VALIDATION_ERROR` | 400 |
| ttlSeconds out of range | `VALIDATION_ERROR` | 400 |
| Rate limit exceeded | `RATE_LIMIT_EXCEEDED` | 429 |

---

### Tool 2: `add_scene`

**Purpose:** Push a complete `VisualScript` to a session. The player receives it via SSE and begins rendering immediately. This is the primary content-delivery tool. Calling `add_scene` again on the same session implicitly clears the current canvas and renders the new script. Supports 88+ entity types.

**Input Schema:**
```typescript
z.object({
  sessionId:    z.string().uuid().describe('Session ID returned by create_session'),
  visualScript: VisualScriptSchema.describe('The complete VisualScript JSON to render'),
})
```

**Result:**
```typescript
{
  ok:         boolean;
  frameCount: number;   // Number of frames in the pushed script
  entityCount: number;  // Total entities across all frames (88+ entity types supported)
}
```

**Implementation:**
```typescript
mcp.registerTool('add_scene', {
  description: 'Push a VisualScript JSON to a session. The player renders it immediately via SSE push. Calling this again replaces the previous script (implicit canvas clear).',
  inputSchema: z.object({
    sessionId:    z.string().uuid(),
    visualScript: VisualScriptSchema,
  }),
  handler: async ({ sessionId, visualScript }) => {
    const session = app.db
      .prepare(`SELECT id FROM sessions WHERE id = ? AND status = 'active'`)
      .get(sessionId);

    if (!session) {
      throw new Error(`SESSION_NOT_FOUND: Session ${sessionId} not found or expired. Call create_session to create a new one.`);
    }

    const now = Math.floor(Date.now() / 1000);
    const json = JSON.stringify(visualScript);

    // Upsert: create scene record if this is the first script push,
    // otherwise update the existing record for this session.
    const existing = app.db
      .prepare(`SELECT id FROM scenes WHERE session_id = ? LIMIT 1`)
      .get(sessionId);

    if (existing) {
      app.db
        .prepare(`UPDATE scenes SET visual_script_json = ?, updated_at = ? WHERE session_id = ?`)
        .run(json, now, sessionId);
    } else {
      app.db
        .prepare(`INSERT INTO scenes (id, session_id, order_index, visual_script_json, created_at, updated_at) VALUES (?, ?, 0, ?, ?, ?)`)
        .run(crypto.randomUUID(), sessionId, json, now, now);
    }

    app.db
      .prepare(`UPDATE sessions SET state = 'ready', updated_at = ? WHERE id = ?`)
      .run(now, sessionId);

    // Push to all connected SSE clients
    sseEmit(sessionId, {
      type:   'script_update',
      script: visualScript,
    });

    const entityCount = visualScript.frames.reduce((sum, f) => sum + f.entities.length, 0);

    return {
      ok:          true,
      frameCount:  visualScript.frames.length,
      entityCount,
    };
  },
});
```

**curl:**
```bash
curl -X POST https://host/mcp \
  -H "X-API-Key: v1_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":2,"method":"tools/call",
    "params":{
      "name":"add_scene",
      "arguments":{
        "sessionId":"550e8400-e29b-41d4-a716-446655440000",
        "visualScript":{
          "sceneId":"550e8400-e29b-41d4-a716-446655440000",
          "totalDuration":8000,
          "frames":[{
            "id":"f1","startTime":0,"endTime":8000,
            "narrationSegment":"The server handles incoming requests.",
            "description":"Single server entity",
            "entities":[{
              "id":"srv-1","type":"Server",
              "position":{"x":50,"y":50},"label":"API Server"
            }]
          }]
        }
      }
    }
  }'
```

**Error cases:**

| Condition | Error Code | Suggestion |
|-----------|-----------|------------|
| sessionId not found | `SESSION_NOT_FOUND` | Call `create_session` first |
| Session expired | `SESSION_EXPIRED` | Create a new session |
| VisualScript fails Zod validation | `VALIDATION_ERROR` | Check error `details` for field-level issues |
| frames array empty | `VALIDATION_ERROR` | Provide at least one frame |
| frame endTime ≤ startTime | `VALIDATION_ERROR` | endTime must exceed startTime |

---

### Tool 3: `update_scene`

**Purpose:** Replace the `VisualScript` for a session with a revised version. The player re-renders immediately from frame 0. Use this to fix or expand a scene after the initial `add_scene` call. Frame seeking is accomplished by calling `update_scene` with updated frame data targeting the desired frame.

**Input Schema:**
```typescript
z.object({
  sessionId:    z.string().uuid().describe('Session ID returned by create_session'),
  visualScript: VisualScriptSchema.describe('The revised VisualScript JSON — replaces the current script in full'),
})
```

**Result:**
```typescript
{
  ok:          boolean;
  frameCount:  number;   // Number of frames in the updated script
  entityCount: number;   // Total entities across all frames
}
```

**Implementation:**
```typescript
mcp.registerTool('update_scene', {
  description: 'Replace the VisualScript for a session with a revised version. Player re-renders immediately. Use to fix or expand a scene after add_scene.',
  inputSchema: z.object({
    sessionId:    z.string().uuid(),
    visualScript: VisualScriptSchema,
  }),
  handler: async ({ sessionId, visualScript }) => {
    const session = app.db
      .prepare(`SELECT id FROM sessions WHERE id = ? AND status = 'active'`)
      .get(sessionId);

    if (!session) {
      throw new Error(`SESSION_NOT_FOUND: Session ${sessionId} not found or expired. Call create_session to create a new one.`);
    }

    const now = Math.floor(Date.now() / 1000);
    const json = JSON.stringify(visualScript);

    app.db
      .prepare(`UPDATE scenes SET visual_script_json = ?, updated_at = ? WHERE session_id = ?`)
      .run(json, now, sessionId);

    app.db
      .prepare(`UPDATE sessions SET state = 'ready', updated_at = ? WHERE id = ?`)
      .run(now, sessionId);

    sseEmit(sessionId, {
      type:   'script_update',
      script: visualScript,
    });

    const entityCount = visualScript.frames.reduce((sum, f) => sum + f.entities.length, 0);

    return {
      ok:          true,
      frameCount:  visualScript.frames.length,
      entityCount,
    };
  },
});
```

**curl:**
```bash
curl -X POST https://host/mcp \
  -H "X-API-Key: v1_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":3,"method":"tools/call",
    "params":{
      "name":"update_scene",
      "arguments":{
        "sessionId":"550e8400-...",
        "visualScript":{
          "sceneId":"550e8400-e29b-41d4-a716-446655440000",
          "totalDuration":12000,
          "frames":[{
            "id":"f1","startTime":0,"endTime":6000,
            "description":"Revised frame 1",
            "entities":[{"id":"srv-1","type":"Server","position":{"x":50,"y":50},"label":"API Server"}]
          },{
            "id":"f2","startTime":6000,"endTime":12000,
            "description":"New frame 2",
            "entities":[{"id":"db-1","type":"Database","position":{"x":50,"y":70},"label":"Primary DB"}]
          }]
        }
      }
    }
  }'
```

**Error cases:**

| Condition | Error Code | Suggestion |
|-----------|-----------|------------|
| sessionId not found | `SESSION_NOT_FOUND` | Call `create_session` first |
| Session expired | `SESSION_EXPIRED` | Create a new session |
| No existing scene to update | `SCENE_NOT_FOUND` | Call `add_scene` before `update_scene` |
| VisualScript fails Zod validation | `VALIDATION_ERROR` | Check error `details` for field-level issues |
| frames array empty | `VALIDATION_ERROR` | Provide at least one frame |

---

### Tool 4: `add_narration`

**Purpose:** Adds narration text to a specific frame. The player displays it as a caption overlay.

**Input Schema:**
```typescript
z.object({
  session_id:  z.string().uuid().describe('Session ID returned by create_session'),
  frame_index: z.number().int().min(0).describe('Zero-based index of the frame to attach narration to'),
  text:        z.string().min(1).describe('Narration text to display as a caption overlay on the frame'),
})
```

**Result:**
```typescript
{
  ok:          boolean;
  narrationId: string;   // UUID of the created narration record
  frame_index: number;   // Confirmed frame index
}
```

**Triggers SSE event:** `narration_update`

**Implementation:**
```typescript
mcp.registerTool('add_narration', {
  description: 'Adds narration text to a specific frame. The player displays it as a caption overlay.',
  inputSchema: z.object({
    session_id:  z.string().uuid(),
    frame_index: z.number().int().min(0),
    text:        z.string().min(1),
  }),
  handler: async ({ session_id, frame_index, text }) => {
    const session = app.db
      .prepare(`SELECT id FROM sessions WHERE id = ? AND status = 'active'`)
      .get(session_id);

    if (!session) {
      throw new Error(`SESSION_NOT_FOUND: Session ${session_id} not found or expired.`);
    }

    const narrationId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    app.db
      .prepare(`INSERT INTO narrations (id, session_id, frame_index, text, created_at) VALUES (?, ?, ?, ?, ?)`)
      .run(narrationId, session_id, frame_index, text, now);

    sseEmit(session_id, {
      type:        'narration_update',
      narrationId,
      text,
      frame_index,
    });

    return { ok: true, narrationId, frame_index };
  },
});
```

**curl:**
```bash
curl -X POST https://host/mcp \
  -H "X-API-Key: v1_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":4,"method":"tools/call",
    "params":{
      "name":"add_narration",
      "arguments":{
        "session_id":"550e8400-...",
        "frame_index":2,
        "text":"The load balancer distributes requests across three backend nodes."
      }
    }
  }'
```

**Error cases:**

| Condition | Error Code | Suggestion |
|-----------|-----------|------------|
| session_id not found | `SESSION_NOT_FOUND` | Call `create_session` first |
| Session expired | `SESSION_EXPIRED` | Create a new session |
| frame_index out of range | `FRAME_NOT_FOUND` | `frame_index` must be 0 to `frame_count - 1`; check the frame count returned by `add_scene` |
| text empty | `VALIDATION_ERROR` | Provide a non-empty narration string |

---

### Tool 5: `get_session_url`

**Purpose:** Returns the player URL and embed URL for an existing session. Use this if you need to retrieve the URL after session creation.

**Input Schema:**
```typescript
z.object({
  session_id: z.string().uuid().describe('Session ID returned by create_session'),
})
```

**Result:**
```typescript
{
  player_url: string;   // /s/:sessionId — share with viewers
  embed_url:  string;   // iframe-embeddable URL
  title:      string;   // Presentation title
  created_at: string;   // ISO-8601 creation timestamp
}
```

**Implementation:**
```typescript
mcp.registerTool('get_session_url', {
  description: 'Returns the player URL and embed URL for an existing session. Use this if you need to retrieve the URL after session creation.',
  inputSchema: z.object({
    session_id: z.string().uuid(),
  }),
  handler: async ({ session_id }) => {
    const session = app.db
      .prepare(`SELECT id, title, created_at FROM sessions WHERE id = ? AND status = 'active'`)
      .get(session_id) as { id: string; title: string; created_at: number } | undefined;

    if (!session) {
      throw new Error(`SESSION_NOT_FOUND: Session ${session_id} not found or expired. Call create_session to create a new one.`);
    }

    const base = process.env.BASE_URL;
    return {
      player_url: `${base}/s/${session_id}`,
      embed_url:  `${base}/s/${session_id}`,
      title:      session.title,
      created_at: new Date(session.created_at * 1000).toISOString(),
    };
  },
});
```

**curl:**
```bash
curl -X POST https://host/mcp \
  -H "X-API-Key: v1_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0","id":5,"method":"tools/call",
    "params":{"name":"get_session_url","arguments":{"session_id":"550e8400-..."}}
  }'
```

**Error cases:**

| Condition | Error Code | Suggestion |
|-----------|-----------|------------|
| session_id not found | `SESSION_NOT_FOUND` | Call `create_session` first |
| Session expired | `SESSION_EXPIRED` | Create a new session |

### Tool Summary Table

| # | Tool Name | Purpose | SSE Event Emitted |
|---|-----------|---------|------------------|
| 1 | `create_session` | Create session | None |
| 2 | `add_scene` | Push full VisualScript (88+ entity types) | `script_update` |
| 3 | `update_scene` | Replace VisualScript with revised version | `script_update` |
| 4 | `add_narration` | Add caption text to a frame | `narration_update` |
| 5 | `get_session_url` | Retrieve player URL for a session | None |

---

## 6. REST Endpoints — Internal (Agent/Server)

These endpoints are prefixed `/api/` and require `X-API-Key` authentication. They are the underlying CRUD operations used by the MCP tools and available for direct HTTP access.

### GET /api/sessions/:id — Get Session

**Purpose:** Retrieve full session metadata. Used by the player to confirm session validity.

**Headers:**
```
X-API-Key: <key>
```

**Response (200):**
```typescript
{
  success: true,
  data: {
    id:         string;     // UUID v4
    title:      string;
    domain:     string | null;
    state:      'idle' | 'building' | 'ready' | 'playing' | 'completed';
    status:     'active' | 'expired' | 'archived';
    sceneCount: number;
    createdAt:  string;     // ISO-8601
    updatedAt:  string;     // ISO-8601
    expiresAt:  string;     // ISO-8601
  }
}
```

**Error Responses:**

| Code | HTTP | Description |
|------|------|-------------|
| `MISSING_API_KEY` | 401 | No X-API-Key header |
| `INVALID_API_KEY` | 401 | Key not found or expired |
| `SESSION_NOT_FOUND` | 404 | Session doesn't exist or belongs to another key |

**curl:**
```bash
curl https://host/api/sessions/550e8400-e29b-41d4-a716-446655440000 \
  -H "X-API-Key: v1_abc123"
```

---

### GET /api/sessions/:id/scenes — List Scenes

**Purpose:** Return all scenes for a session, ordered by `order_index`. The player uses this endpoint to load the full scene list on startup.

**Headers:**
```
X-API-Key: <key>    (optional — also accessible without auth for player use)
```

**Response (200):**
```typescript
{
  success: true,
  data: {
    sessionId: string;
    scenes: {
      id:            string;
      orderIndex:    number;
      schemaVersion: number;
      narrationText: string | null;
      createdAt:     string;
      updatedAt:     string;
      // Note: visualScriptJson is NOT included here to keep response small.
      // Use GET /api/sessions/:id/scenes/:sceneId for full script data.
    }[];
  }
}
```

**curl:**
```bash
curl https://host/api/sessions/550e8400-.../scenes \
  -H "X-API-Key: v1_abc123"
```

---

### DELETE /api/sessions/:id — Archive Session

**Purpose:** Soft-archive a session. Marks it as `archived`; does not delete rows (TTL cron handles physical cleanup).

**Headers:**
```
X-API-Key: <key>
```

**Response (200):**
```typescript
{
  success: true,
  data: {
    id:       string;
    archived: true;
  }
}
```

**curl:**
```bash
curl -X DELETE https://host/api/sessions/550e8400-... \
  -H "X-API-Key: v1_abc123"
```

---

### GET /api/health — Health Check

**Purpose:** Liveness and readiness probe. No authentication required. Returns DB connectivity.

**Response (200):**
```typescript
{
  success: true,
  data: {
    status:  'ok' | 'degraded';
    uptime:  number;      // seconds
    db:      'ok' | 'error';
    version: string;      // from package.json
  }
}
```

**curl:**
```bash
curl https://host/api/health
```

---

## 7. REST Endpoints — Player

These endpoints require no authentication. They serve the public player experience to browsers.

### GET /s/:sessionId — Serve Player HTML

**Purpose:** Returns the static HTML shell for the player. The page embeds the session ID and bootstraps the player JavaScript, which connects to the SSE stream.

**Path Params:**
- `sessionId`: UUID v4 of an active session

**Response (200):** HTML page  
**Response (404):** HTML not-found page (session not found or expired)

**Handler:**
```typescript
app.get('/s/:sessionId', async (req, reply) => {
  const { sessionId } = req.params as { sessionId: string };

  const session = app.db
    .prepare(`SELECT id, title FROM sessions WHERE id = ? AND status = 'active' AND expires_at > unixepoch()`)
    .get(sessionId) as { id: string; title: string } | undefined;

  if (!session) {
    return reply.code(404)
      .header('Content-Type', 'text/html; charset=utf-8')
      .send(renderNotFoundHtml());
  }

  return reply
    .header('Content-Type', 'text/html; charset=utf-8')
    .header('Cache-Control', 'no-cache')
    .send(renderPlayerHtml(session.title, sessionId));
});

function renderPlayerHtml(title: string, sessionId: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/player/player.css" />
</head>
<body>
  <div id="canvas-wrapper" data-session-id="${sessionId}">
    <svg
      id="canvas"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7"
                refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#ffffff" />
        </marker>
      </defs>
      <rect id="bg" width="1920" height="1080" fill="#0f0f1a" />
      <g id="entity-layer"></g>
      <g id="connection-layer"></g>
      <g id="overlay-layer"></g>
    </svg>
  </div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
  <script src="/player/player.js"></script>
</body>
</html>`;
}
```

**iframe embed (host page):**
```html
<iframe
  src="https://pre.app/s/SESSION_ID"
  style="border: none; width: 100%; aspect-ratio: 16/9;"
  allow="autoplay"
  loading="lazy"
></iframe>
```

**curl:**
```bash
curl https://host/s/550e8400-e29b-41d4-a716-446655440000
```

---

### GET /player/* — Static JS/CSS Assets

Served by `@fastify/static` from `player/dist/`. Content-hashed filenames; long cache TTL.

```
/player/player.js      # Compiled player bundle (scene controller, component registry)
/player/player.css     # CSS animations, SVG layout styles
```

**Cache headers:**
```typescript
{
  cacheControl: true,
  maxAge: '7d',
  immutable: true,  // filenames are content-hashed at build time
}
```

---

## 8. SSE Event Stream — GET /api/sessions/:id/sse

The SSE endpoint is the real-time channel through which the MCP server pushes events to connected browser players.

### Connection

**No authentication required.** Sessions are public by their UUID.

```
GET /api/sessions/:id/sse HTTP/1.1
Accept: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

**Initial response:**
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
X-Accel-Buffering: no

event: connected
data: {"sessionId":"550e8400-e29b-41d4-a716-446655440000","timestamp":"2026-02-28T16:16:00.000Z"}

```

### Server-Side Implementation

```typescript
// src/sse.ts

/** sessionId → Set of active SSE reply objects */
export const sseSubscribers = new Map<string, Set<FastifyReply>>();

/**
 * Emit a typed SSE event to all subscribers of a session.
 */
export function sseEmit(sessionId: string, event: SseEvent): void {
  const subscribers = sseSubscribers.get(sessionId);
  if (!subscribers || subscribers.size === 0) return;

  const data = JSON.stringify(event);
  for (const reply of subscribers) {
    try {
      reply.raw.write(`event: ${event.type}\ndata: ${data}\n\n`);
    } catch {
      // Client disconnected; remove from set
      subscribers.delete(reply);
    }
  }
}

// Route handler
app.get('/api/sessions/:id/sse', async (req, reply) => {
  const { id } = req.params as { id: string };

  // Validate session exists
  const session = app.db
    .prepare(`SELECT id FROM sessions WHERE id = ? AND status = 'active' AND expires_at > unixepoch()`)
    .get(id);

  if (!session) {
    return reply.code(404).send({
      success: false,
      error: {
        code: 'SESSION_NOT_FOUND',
        message: `Session ${id} not found or expired.`,
        suggestion: 'The session link may have expired. Ask the agent to create a new session.',
      },
    });
  }

  // Register subscriber
  if (!sseSubscribers.has(id)) sseSubscribers.set(id, new Set());
  sseSubscribers.get(id)!.add(reply);

  // Set SSE headers
  reply.raw.setHeader('Content-Type', 'text/event-stream');
  reply.raw.setHeader('Cache-Control', 'no-cache');
  reply.raw.setHeader('Connection', 'keep-alive');
  reply.raw.setHeader('X-Accel-Buffering', 'no');  // Disable nginx buffering

  // Send initial connection event
  reply.raw.write(`event: connected\ndata: ${JSON.stringify({ sessionId: id, timestamp: new Date().toISOString() })}\n\n`);

  // Load and send current script immediately if one exists
  const scene = app.db
    .prepare(`SELECT visual_script_json FROM scenes WHERE session_id = ? LIMIT 1`)
    .get(id) as { visual_script_json: string } | undefined;

  if (scene && scene.visual_script_json !== '{}') {
    const script = JSON.parse(scene.visual_script_json);
    reply.raw.write(`event: script_update\ndata: ${JSON.stringify({ type: 'script_update', script })}\n\n`);
  }

  // Heartbeat every 30 seconds to prevent proxy timeouts
  const heartbeat = setInterval(() => {
    try {
      reply.raw.write(': heartbeat\n\n');
    } catch {
      clearInterval(heartbeat);
    }
  }, 30_000);

  // Cleanup on disconnect
  req.raw.on('close', () => {
    clearInterval(heartbeat);
    sseSubscribers.get(id)?.delete(reply);
  });
});
```

### SSE Event Types

All events use the following envelope format. The `event:` field identifies the event type; `data:` contains the JSON payload.

```
event: <event_type>
data: <json_payload>

```

#### `connected` — Initial Connection

Sent immediately when the `EventSource` connects. Contains the session ID for client-side verification.

```
event: connected
data: {"type":"connected","sessionId":"550e8400-...","timestamp":"2026-02-28T16:16:00.000Z"}
```

**Player handling:**
```javascript
evtSource.addEventListener('connected', (e) => {
  const { sessionId } = JSON.parse(e.data);
  console.log('[SSE] Connected to session:', sessionId);
});
```

---

#### `script_update` — VisualScript Push

Sent when the agent calls `add_scene` or `update_scene`. The player discards its current state and renders the new script from frame 0.

```
event: script_update
data: {"type":"script_update","script":{"sceneId":"550e8400-...","totalDuration":8000,"frames":[...]}}
```

**Player handling:**
```javascript
evtSource.addEventListener('script_update', (e) => {
  const { script } = JSON.parse(e.data);
  sceneController.loadScript(script);
});
```

---

#### `narration_update` — Frame Caption Update

Sent when the agent calls `add_narration`. The player displays the narration text as a caption overlay on the specified frame.

```
event: narration_update
data: {"type":"narration_update","narrationId":"a1b2c3d4-...","text":"The load balancer distributes traffic across three nodes.","frame_index":2}
```

**Player handling:**
```javascript
evtSource.addEventListener('narration_update', (e) => {
  const { narrationId, text, frame_index } = JSON.parse(e.data);
  sceneController.setNarration(frame_index, text);
});
```

---

### SSE Event Reference Table

| Event Type | Emitted By | Player Action |
|------------|-----------|---------------|
| `connected` | Server on connect | Log session ID, confirm connection |
| `script_update` | `add_scene` or `update_scene` tool | Discard current state, render new script from frame 0 |
| `narration_update` | `add_narration` tool | Display caption text overlay on specified frame |

### Client-Side Connection (Player JavaScript)

```javascript
// player.js — EventSource setup
const sessionId = document.getElementById('canvas-wrapper').dataset.sessionId;
const evtSource = new EventSource(`/api/sessions/${sessionId}/sse`);

evtSource.addEventListener('connected',        handleConnected);
evtSource.addEventListener('script_update',    handleScriptUpdate);
evtSource.addEventListener('narration_update', handleNarrationUpdate);

evtSource.onerror = (err) => {
  console.error('[SSE] Connection error — EventSource will auto-reconnect:', err);
  // Browser EventSource auto-reconnects with exponential backoff.
  // No manual reconnect logic required.
};
```

### curl — Connect to SSE Stream

```bash
curl -N https://host/api/sessions/550e8400-e29b-41d4-a716-446655440000/sse \
  -H "Accept: text/event-stream"
```

---

## 9. SQLite Schema Reference

See `06-data-model.md §11` for the full DDL. Summary of tables:

| Table | Purpose |
|-------|---------|
| `api_keys` | Stores SHA-256 hashes of issued API keys and their tier/rate-limit |
| `sessions` | One row per presentation session; includes state machine and TTL |
| `scenes` | One row per scene; stores full `VisualScript` JSON as text |
| `narrations` | Optional pre-generated TTS audio metadata per frame |

### Schema Relationship Diagram

```
api_keys (id)
    │
    └─── sessions (api_key_id → api_keys.id CASCADE)
             │
             └─── scenes (session_id → sessions.id CASCADE)
                      │
                      └─── narrations (scene_id → scenes.id CASCADE)
```

---

## 10. Fastify Plugin Architecture

Routes are organized into scoped Fastify plugins. Authentication and rate-limit hooks apply only within the `/api` scope.

### File Structure

```
src/
├── index.ts                 # starts the server
├── server.ts                # buildServer() factory
├── sse.ts                   # SSE subscriber map + sseEmit()
├── db/
│   ├── index.ts             # better-sqlite3 singleton + openDatabase()
│   ├── migrate.ts           # runMigrations() — WAL mode + schema.sql
│   └── schema.sql           # full DDL (all CREATE TABLE statements)
├── plugins/
│   ├── auth.ts              # authPlugin — X-API-Key onRequest hook
│   └── cors.ts              # buildCorsOptions() — two-policy setup
├── routes/
│   ├── api.ts               # /api/* routes (auth-scoped plugin)
│   ├── player.ts            # /s/:sessionId, /player/* routes (no auth)
│   └── admin.ts             # /admin/keys (ADMIN_SECRET protected)
├── tools/
│   └── index.ts             # registerMcpTools() — all 5 tool definitions
└── schemas/
    └── visual.ts            # Zod schemas (VisualEntitySchema, etc.)
```

### Scoped Plugin Registration

```typescript
// src/routes/api.ts
export async function registerApiRoutes(app: FastifyInstance): Promise<void> {
  // Auth hook applies to everything inside this plugin scope
  await app.register(authPlugin);

  // Rate limit per API key tier
  app.addHook('onRequest', async (req) => {
    if (req.apiKey) {
      req.rateLimit = { max: req.apiKey.rate_limit, timeWindow: '1 minute' };
    }
  });

  // Routes
  app.get('/health',              healthHandler);
  app.get('/sessions/:id',         getSessionHandler);
  app.get('/sessions/:id/scenes',  listScenesHandler);
  app.delete('/sessions/:id',      archiveSessionHandler);
  // SSE endpoint is inside API scope but auth is not required
  // (player connects without key — session UUID is the credential)
  app.get('/sessions/:id/sse',     sseHandler);
}
```

---

## 11. Request Validation

All request bodies are validated with Zod before handler code runs. Zod errors are caught in the global error handler and transformed into agent-actionable responses with `suggestion` fields.

### Zod Parse Helper

```typescript
// src/lib/validate.ts
import { ZodSchema, ZodError } from 'zod';
import { FastifyReply }        from 'fastify';

export function parseBody<T>(
  schema: ZodSchema<T>,
  body: unknown,
  reply: FastifyReply
): T | null {
  const result = schema.safeParse(body);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const fields     = result.error.issues.map(i => i.path.join('.') || '(root)');

    reply.code(400).send({
      success: false,
      error: {
        code:    'VALIDATION_ERROR',
        message: `${firstIssue.path.join('.') || 'body'}: ${firstIssue.message}`,
        suggestion: `Fix these fields: ${fields.join(', ')}. ` +
          `Refer to the API schema and ensure all required fields are present and correctly typed.`,
        details: { issues: result.error.issues },
      },
    });
    return null;
  }

  return result.data;
}
```

---

## 12. Error Handling

### Response Envelope

All error responses use this shape:

```typescript
{
  success: false,
  error: {
    code:       string;  // Machine-readable constant (see table below)
    message:    string;  // Human-readable description
    suggestion: string;  // Actionable hint for LLM callers
    details?:   Record<string, unknown>;  // Optional structured context
  }
}
```

### Global Error Handler

```typescript
// Registered in buildServer() after plugins
app.setErrorHandler((error, req, reply) => {
  req.log.error({ err: error, reqId: req.id }, 'Unhandled error');

  if (error.validation) {
    return reply.code(400).send({
      success: false,
      error: {
        code:       'VALIDATION_ERROR',
        message:    error.message,
        suggestion: 'Check the request body against the endpoint schema.',
      },
    });
  }

  if (error.statusCode === 429) {
    return reply.code(429).send(error);
  }

  return reply.code(500).send({
    success: false,
    error: {
      code:       'INTERNAL_ERROR',
      message:    'An unexpected error occurred.',
      suggestion: 'Retry the request. If the problem persists, check server logs via GET /api/health.',
    },
  });
});

app.setNotFoundHandler((req, reply) => {
  reply.code(404).send({
    success: false,
    error: {
      code:       'NOT_FOUND',
      message:    `Route ${req.method} ${req.url} not found.`,
      suggestion: 'Check the endpoint path and HTTP method against the API specification.',
    },
  });
});
```

### Error Code Reference

| Code | HTTP Status | When | Suggestion |
|------|-------------|------|-----------|
| `MISSING_API_KEY` | 401 | No `X-API-Key` header | Include your API key in the X-API-Key header |
| `INVALID_API_KEY` | 401 | Key not found, revoked, or expired | Verify key value and expiry; request a new key from `POST /admin/keys` |
| `FORBIDDEN` | 403 | Admin secret mismatch | Provide correct `ADMIN_SECRET` in `Authorization: Bearer` header |
| `SESSION_NOT_FOUND` | 404 | Session doesn't exist or belongs to another API key | Call `create_session` to create a new session |
| `SESSION_EXPIRED` | 410 | Session TTL has elapsed | Create a new session with `create_session` |
| `SESSION_ARCHIVED` | 410 | Session was explicitly archived | Create a new session with `create_session` |
| `SCENE_NOT_FOUND` | 404 | Scene ID not in this session | Use `GET /api/sessions/:id/scenes` to list valid scene IDs |
| `VALIDATION_ERROR` | 400 | Request body fails Zod schema | Fix the reported fields; check `details.issues` for specifics |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests in time window | Back off and retry after the window resets |
| `NOT_FOUND` | 404 | Route path does not exist | Check endpoint path and method |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Retry the request; check `GET /api/health` |

### Typed Error Factories

```typescript
// src/lib/errors.ts
export const errors = {
  sessionNotFound: (id: string) => ({
    code: 'SESSION_NOT_FOUND' as const,
    message: `Session ${id} not found.`,
    suggestion: 'Call create_session to create a new session.',
  }),

  sessionExpired: (id: string) => ({
    code: 'SESSION_EXPIRED' as const,
    message: `Session ${id} has expired.`,
    suggestion: 'Create a new session with the create_session MCP tool.',
  }),

  validationError: (field: string, issue: string) => ({
    code: 'VALIDATION_ERROR' as const,
    message: `${field}: ${issue}`,
    suggestion: `Fix the "${field}" field in your request. Check the schema.`,
  }),
};
```

---

## 13. Rate Limiting Policy

Rate limits are enforced per API key, per 60-second rolling window. The limit value is stored in the `api_keys.rate_limit` column and applied dynamically per request.

### Tier Limits

| Tier | Requests / Minute | Intended Use |
|------|--------------------|--------------|
| `developer` | 100 | Local development, testing |
| `startup` | 500 | Small production deployments |
| `scale` | 2,000 | High-volume agent workloads |

### Rate Limit Headers

When a rate limit applies, `@fastify/rate-limit` injects these response headers:

```
X-RateLimit-Limit:     100
X-RateLimit-Remaining: 47
X-RateLimit-Reset:     1709139360
Retry-After:           13
```

### Rate Limit Error Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 13s.",
    "suggestion": "Back off and retry after the window resets. Consider batching VisualScript pushes rather than calling add_scene in a tight loop."
  }
}
```

### MCP Tool Rate Limiting

MCP tool calls traverse the same auth and rate-limit hooks as REST endpoints. The `fastify-mcp-server` plugin does not bypass rate limiting. Each tool call counts as one request.

---

## 14. CORS Configuration

Two distinct CORS policies apply to different route scopes.

### Policy 1 — API and MCP Endpoints (`/api/*`, `/mcp`, `/admin/*`)

Restricted to origins listed in `CORS_ALLOWED_ORIGINS`. MCP calls from the same host are loopback and bypass CORS entirely. This policy exists primarily for browser-based admin tooling.

```typescript
// src/plugins/cors.ts
export function buildCorsOptions() {
  const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  return {
    origin: (origin: string | undefined, cb: (err: Error | null, allow: boolean) => void) => {
      // Loopback (server-to-server) has no origin header
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    methods:        ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-API-Key', 'Authorization', 'Mcp-Session-Id'],
    exposedHeaders: ['X-Request-Id', 'X-RateLimit-Limit', 'X-RateLimit-Remaining', 'Mcp-Session-Id'],
    credentials:    false,
  };
}
```

### Policy 2 — Player and Static Assets (`/s/*`, `/player/*`, `/api/sessions/:id/sse`)

Player iframes are embedded by third-party host pages. These endpoints must allow any origin.

```typescript
// Applied inside the player route plugin scope
await app.register(fastifyCors, {
  origin:         '*',
  methods:        ['GET', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Cache-Control'],
});
```

### SSE-Specific CORS

The SSE endpoint (`/api/sessions/:id/sse`) requires `Access-Control-Allow-Origin: *` because the browser's `EventSource` API always sends a cross-origin request when the player iframe's origin differs from the server origin. The wildcard policy on player routes handles this automatically.

---

## 15. Session Lifecycle & TTL

### State Machine

```
idle
  │
  │ add_scene called
  ▼
building
  │
  │ VisualScript fully pushed
  ▼
ready
  │
  │ Player connects to SSE
  ▼
playing
  │
  │ All frames played / agent calls update_scene with new content
  ▼
completed
```

**Persistence status** is a separate dimension from session state:

```
active  →  expired   (TTL elapsed, cron marks it)
active  →  archived  (explicit DELETE /api/sessions/:id)
```

### TTL Defaults

| Parameter | Default | Max | Env Variable |
|-----------|---------|-----|-------------|
| Session TTL | 4 hours (14,400s) | 24 hours (86,400s) | `SESSION_TTL_SECONDS` |
| Hard purge delay | 30 days after expiry | — | Hardcoded |

### Expiry Cron

```typescript
// src/jobs/cleanup.ts
export function startCleanupJob(db: Database.Database): NodeJS.Timeout {
  const interval = Number(process.env.CLEANUP_INTERVAL_MS ?? 3_600_000);

  return setInterval(() => {
    const now = Math.floor(Date.now() / 1000);

    // Mark sessions whose TTL has passed
    const expired = db
      .prepare(`UPDATE sessions SET status = 'expired', updated_at = ?
                WHERE status = 'active' AND expires_at <= ?`)
      .run(now, now);

    // Hard-delete sessions expired/archived more than 30 days ago
    const purged = db
      .prepare(`DELETE FROM sessions
                WHERE status IN ('expired', 'archived')
                  AND updated_at < ?`)
      .run(now - 30 * 86_400);

    if (expired.changes > 0 || purged.changes > 0) {
      console.info({ expired: expired.changes, purged: purged.changes }, 'Session cleanup complete');
    }
  }, interval);
}
```

`ON DELETE CASCADE` on the `scenes` table ensures scene rows are purged when sessions are deleted.

---

## 16. Logging & Observability

### Pino Logger

Fastify uses the built-in Pino logger. Each request is assigned a UUID via `genReqId` and propagated through `req.log`.

```typescript
// Fastify logger config (in buildServer)
logger: {
  level: process.env.LOG_LEVEL ?? 'info',
  serializers: {
    req(req) {
      return {
        method:      req.method,
        url:         req.url,
        reqId:       req.id,
        apiKeyTier:  req.apiKey?.tier ?? null,
        ip:          req.ip,
      };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
}
```

### Request ID Propagation

```typescript
// Echo request ID in every response
app.addHook('onSend', (_req, reply, _payload, done) => {
  reply.header('X-Request-Id', _req.id);
  done();
});
```

### Log Levels by Event

| Event | Level |
|-------|-------|
| Server start / stop | `info` |
| Successful MCP tool call | `info` |
| Successful REST call | `info` |
| SSE client connect / disconnect | `debug` |
| Validation errors (client faults) | `warn` |
| Auth failures | `warn` |
| Rate limit hits | `warn` |
| Session cleanup summary | `info` |
| Unhandled errors | `error` |
| DB prepare/run failures | `error` |

### Key Structured Log Fields

| Field | Type | Description |
|-------|------|-------------|
| `reqId` | string | UUID per request |
| `apiKeyTier` | string | `developer` \| `startup` \| `scale` \| null |
| `latency` | number | ms from request start to response send |
| `statusCode` | number | HTTP response status |
| `sessionId` | string | Present on session-scoped operations |
| `toolName` | string | Present on MCP tool calls |

---

## 17. Testing Strategy

### Test Runner & Framework

- **Test runner:** Vitest (Jest-compatible, ESM native)
- **HTTP injection:** Fastify's `app.inject()` — no real network, no port needed
- **Database:** SQLite `:memory:` — fresh in-memory DB per test file
- **SSE testing:** Direct `sseEmit()` calls with a mock subscriber

### Test Server Factory

```typescript
// tests/helpers/server.ts
import { buildServer }    from '../../src/server';
import { runMigrations }  from '../../src/db/migrate';
import Database           from 'better-sqlite3';
import { hashApiKey }     from '../../src/plugins/auth';

export async function buildTestServer() {
  const db  = new Database(':memory:');
  runMigrations(db);

  // Seed a test API key
  const rawKey = 'v1_test_key_developer_abc123';
  const hash   = hashApiKey(rawKey);
  db.prepare(
    `INSERT INTO api_keys (key_hash, tier, rate_limit) VALUES (?, 'developer', 100)`
  ).run(hash);

  // Build server with injected in-memory DB
  const app = await buildServer({ db });

  return { app, db, apiKey: rawKey };
}
```

### Integration Test Pattern

```typescript
// tests/integration/mcp-tools.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildTestServer } from '../helpers/server';

describe('MCP Tool: create_session', () => {
  let app: FastifyInstance;
  let apiKey: string;

  beforeAll(async () => {
    ({ app, apiKey } = await buildTestServer());
  });

  afterAll(async () => app.close());

  it('creates session and returns sessionId + playerUrl', async () => {
    const res = await app.inject({
      method: 'POST',
      url:    '/mcp',
      headers: {
        'X-API-Key':    apiKey,
        'Content-Type': 'application/json',
        'Accept':       'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 1,
        method:  'tools/call',
        params:  {
          name:      'create_session',
          arguments: { title: 'Test Presentation' },
        },
      }),
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.result.content[0].type).toBe('text');
    const data = JSON.parse(body.result.content[0].text);
    expect(data.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(data.playerUrl).toContain('/s/');
    expect(data.sseUrl).toContain('/sse');
  });

  it('returns MISSING_API_KEY when header is absent', async () => {
    const res = await app.inject({
      method: 'POST', url: '/mcp',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'create_session', arguments: { title: 'x' } } }),
    });
    expect(res.statusCode).toBe(401);
    expect(res.json().error.code).toBe('MISSING_API_KEY');
  });
});

describe('MCP Tool: add_scene', () => {
  let app: FastifyInstance;
  let apiKey: string;
  let sessionId: string;

  beforeAll(async () => {
    ({ app, apiKey } = await buildTestServer());
    // Create a session first
    const res = await app.inject({
      method: 'POST', url: '/mcp',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'create_session', arguments: { title: 'Test' } } }),
    });
    sessionId = JSON.parse(res.json().result.content[0].text).sessionId;
  });

  afterAll(async () => app.close());

  it('pushes a valid VisualScript and returns frameCount', async () => {
    const res = await app.inject({
      method: 'POST', url: '/mcp',
      headers: { 'X-API-Key': apiKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0', id: 2, method: 'tools/call',
        params: {
          name: 'add_scene',
          arguments: {
            sessionId,
            visualScript: {
              sceneId:       sessionId,
              totalDuration: 4000,
              frames: [{
                id: 'f1', startTime: 0, endTime: 4000,
                narrationSegment: 'Test narration.',
                description: 'Test frame',
                entities: [{
                  id: 'srv-1', type: 'Server',
                  position: { x: 50, y: 50 }, label: 'API Server',
                }],
              }],
            },
          },
        },
      }),
    });

    expect(res.statusCode).toBe(200);
    const data = JSON.parse(res.json().result.content[0].text);
    expect(data.ok).toBe(true);
    expect(data.frameCount).toBe(1);
    expect(data.entityCount).toBe(1);
  });
});
```

### Coverage Targets

| Layer | Target |
|-------|--------|
| MCP tool handlers (all 5: `create_session`, `add_scene`, `update_scene`, `add_narration`, `get_session_url`) | 100% |
| Auth middleware | 100% |
| Global error handler | 100% |
| SSE endpoint | ≥ 85% |
| REST endpoints | ≥ 90% |
| Player HTML endpoint | ≥ 80% |
| Session lifecycle (state transitions) | ≥ 85% |

### What to Test Per MCP Tool

For each of the 5 MCP tools, tests must cover:

1. **Happy path** — valid auth + valid body → correct result shape
2. **Missing auth** — no `X-API-Key` → 401 `MISSING_API_KEY`
3. **Invalid auth** — bad key → 401 `INVALID_API_KEY`
4. **Validation failure** — malformed `arguments` → 400 `VALIDATION_ERROR` with non-empty `suggestion`
5. **Not found** — `sessionId` that doesn't exist → error with `SESSION_NOT_FOUND` suggestion
6. **SSE delivery** — after tool call, `sseSubscribers` map receives the correct event (unit test)

### What to Test Per Player Endpoint

For `GET /s/:sessionId`:

1. Active session → HTML page with correct `data-session-id` attribute
2. Expired session → 404 HTML
3. Archived session → 404 HTML
4. Unknown `sessionId` → 404 HTML

For `GET /api/sessions/:id/sse`:

1. Active session → 200 with `Content-Type: text/event-stream`
2. Initial `connected` event sent immediately
3. Initial `script_update` event sent if scene has a script
4. Expired session → 404 JSON error

---

*End of document — 07-api-spec.md*
