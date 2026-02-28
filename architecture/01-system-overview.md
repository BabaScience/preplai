# 01 — System Overview Architecture
**Presentation Rendering Engine (PRE) · V1**
> *"The rendering engine for agents that explain things."*

---

## Table of Contents

1. [Mission Statement](#1-mission-statement)
2. [Architecture Overview](#2-architecture-overview)
3. [Package Dependency Graph](#3-package-dependency-graph)
4. [Request Lifecycle](#4-request-lifecycle)
5. [Design Principles](#5-design-principles)
6. [Performance Contracts](#6-performance-contracts)
7. [V1 Scope — In vs. Cut](#7-v1-scope--in-vs-cut)
8. [Technology Choices & Rationale](#8-technology-choices--rationale)
9. [Monorepo Structure](#9-monorepo-structure)
10. [3-Month Timeline](#10-3-month-timeline)
11. [Cross-References](#11-cross-references)

---

## 1. Mission Statement

> **"The agent understands. The engine shows. The user learns."**

The Presentation Rendering Engine (PRE) is a cinema-quality visual presentation system exposed as an **agent-native API**. It is not a slide builder, not a video exporter, and not a charting library. It is a *rendering stage* — a persistent, stateful visual environment that an AI agent directs frame-by-frame, entity-by-entity, in real time.

PRE decouples **intelligence** (what to explain) from **craft** (how to show it). The agent is the director. The engine is the stage. The user watches a cinematic learning experience unfold.

### What Makes PRE Different

Most tools treat the agent as a user. PRE treats the agent as a **first-class API client**. The agent emits structured JSON (`VisualScript`). The engine renders it procedurally — no static files, no pre-built slides, no asset libraries to browse. The agent declares *what entities exist* and *where they are*; the engine decides how to draw them beautifully.

This produces a fundamental architectural property: **the illustration system is code, not content**. Adding a new visual type costs one JavaScript function, not two SVG files. The agent can parameterize every entity at emission time, enabling presentations that are truly dynamic rather than template-substituted.

V1 targets a broad, unconstrained domain. A 88+ entity type programmatic SVG component library, CSS entrance choreography, GSAP 3.13 slide transitions, and a five-tool MCP server are all that is needed to launch the most visually compelling explanation engine ever exposed to an AI agent.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        AGENT (AI Director)                          │
│          Claude / GPT-4 / Gemini / any MCP-capable agent            │
│                                                                     │
│  Emits: VisualScript JSON ─────────────────────────────────────►   │
│         (add_scene MCP tool call)                                   │
└────────────────────────────┬────────────────────────────────────────┘
                             │  MCP Tool Calls
                             │  Protocol: Streamable HTTP (2025-06-18)
                             │  Endpoint: POST /mcp
                             │  Tools: create_session · add_scene
                             │         update_scene · add_narration · get_session_url
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      @pre/mcp-server                                │
│                                                                     │
│  ┌──────────────┐   ┌──────────────────┐   ┌─────────────────────┐ │
│  │  MCP Layer   │   │  fastify-mcp-    │   │  Session Store      │ │
│  │ (tool defs,  │──▶│  server plugin   │──▶│  (in-memory Map)    │ │
│  │  Zod schemas)│   │  POST /mcp       │   │  VisualScript state │ │
│  └──────────────┘   └──────────────────┘   └──────────┬──────────┘ │
│                                                        │            │
│  ┌──────────────────────────────────────────────────┐  │            │
│  │                   SQLite (WAL mode)              │◀─┘            │
│  │  sessions · visual_scripts · api_keys            │               │
│  └──────────────────────────────────────────────────┘               │
│                                                                     │
│  GET /session/:id/events  ──────────────────────────────────────►  │
│  (SSE endpoint — pushes script_update, seek, entity_patch, clear)  │
└────────────────────────────┬────────────────────────────────────────┘
                             │  SSE push: script_update event
                             │  EventSource auto-reconnects
                             │  Last-Event-ID resumption
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        @pre/player                                  │
│                  (iframe, Vanilla JS, no framework)                 │
│                                                                     │
│  ┌──────────────┐   ┌──────────────────┐   ┌─────────────────────┐ │
│  │  EventSource │   │  Scene           │   │  Component          │ │
│  │  SSE client  │──▶│  Controller      │──▶│  Registry dispatch  │ │
│  └──────────────┘   └──────────────────┘   └──────────┬──────────┘ │
│                                                        │            │
│  ┌─────────────────────────────────────────────────────▼──────────┐ │
│  │              SVG Canvas (viewBox="0 0 1920 1080")              │ │
│  │              Double-<g> pattern per entity                     │ │
│  │              CSS entrance choreography (compositor thread)     │ │
│  │              GSAP 3.13 slide transitions (rAF ticker)          │ │
│  └────────────────────────────────────────────────────────────────┘ │
└────────────────────────────┬────────────────────────────────────────┘
                             │  Uses render functions from:
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     @pre/illustrations                              │
│                                                                     │
│   88+ Programmatic SVG Components  ·  Component Registry           │
│   type string → render function (entity, parentEl) → SVGGElement   │
│   Server · Database · Arrow · Graph2D · Equation · Matrix · Wave   │
│   Circuit · Table · CodeBlock · Tree · Frame · Label · Badge · ... │
└─────────────────────────────────────────────────────────────────────┘
                             │
                             ▼
                    Browser / Embed / <iframe>
```

### Key Architectural Properties

- **Single VPS deployment** — all three packages ship from one server. Fastify serves both the MCP API and the static player assets from `/public`.
- **Session-per-render model** — `create_session` is the billing atom. One session = one presentation.
- **Agent emits JSON, engine draws** — the agent never writes SVG. It emits `VisualScript` JSON containing `VisualEntity` objects. The component registry maps each entity type to a render function. The result is an SVG constructed entirely in JavaScript at runtime.
- **Stateless agent, stateful engine** — the agent sends declarative `VisualScript` payloads; the engine maintains current session state in memory (Map) and SQLite.
- **Embeddable by design** — the player renders inside a standard `<iframe>` with no external dependencies at runtime. Zero JavaScript is required on the host page.
- **SSE for real-time push** — the player connects to `GET /session/:id/events` via `EventSource`. The server pushes `script_update`, `seek`, `entity_patch`, and `clear` events. Auto-reconnect and `Last-Event-ID` resumption are handled natively by the browser.

### The Three-Layer Data Pipeline

```
LAYER 1: SCHEMA (Agent API surface)
  VisualScript JSON  →  IllustrationFrame[]  →  VisualEntity[]
  Zod validation on ingress at MCP server
  Defined in: schemas/visual.js + shared/types.ts

         │  MCP tool call: add_scene
         ▼

LAYER 2: ENGINE (Component Registry)
  applyDefaults()        — skeleton → full entity
  registry[entity.type]  — entity → SVG DOM nodes (double-<g> pattern)
  renderArrow()          — resolves ID references after all entities placed
  assignEntranceDelays() — 80ms stagger calculation
  Defined in: player/registry.js + player/components/*.js

         │  DOM nodes appended to #entity-layer
         ▼

LAYER 3: RENDERER (Runtime Execution)
  scene-controller.js   — orchestrates frame transitions
  CSS @keyframes        — entrance animations (compositor thread, zero JS)
  GSAP 3.13 timelines   — slide-level transitions (rAF ticker)
  EventSource (SSE)     — receives VisualScript updates from server
  Defined in: player/scene-controller.js + player/player.css
```

**Key invariants:**
1. Layer 1 (Schema) has no knowledge of Layers 2 or 3.
2. Layer 2 (Engine) builds DOM nodes; it does not animate them.
3. Layer 3 (Renderer) consumes DOM nodes and drives animations; it has no knowledge of Layer 1.
4. Data flows strictly downward: Schema → Engine → Renderer.
5. SSE events re-enter at Layer 1 (carrying `VisualScript` JSON) and always pass through Zod validation before reaching the engine.

---

## 3. Package Dependency Graph

```
@pre/illustrations
    ║
    ║  zero external @pre deps
    ║  pure JavaScript — component registry + render functions
    ║  no SVG files, no framework, no animation runtime
    ║
    ▼
@pre/player
    ║
    ║  imports render functions from @pre/illustrations
    ║  depends on GSAP 3.13 (CDN or vendored, now fully free)
    ║  Vanilla JS only — zero framework dependencies
    ║  connects to @pre/mcp-server via SSE (EventSource)
    ║
    ▼
@pre/mcp-server
    ║
    ║  serves @pre/player static assets at /public
    ║  depends on Fastify 5, better-sqlite3, @modelcontextprotocol/sdk 1.18.0
    ║  fastify-mcp-server plugin for Streamable HTTP transport
    ║  owns all network I/O and persistence
    ║
    ▼
  VPS (single Node.js process, Node.js >=18)
```

```typescript
// Dependency matrix (canonical)
interface PackageDependencies {
  "@pre/illustrations": {
    external: [];                    // zero runtime deps
    internal: [];
    exports: "component registry (type → render function)";
  };
  "@pre/player": {
    external: ["gsap@3.13"];         // free since Webflow acquisition
    internal: ["@pre/illustrations"];
    transport: "SSE (EventSource)";
    framework: "none — vanilla JS createElementNS";
  };
  "@pre/mcp-server": {
    external: [
      "fastify@^5.0.0",
      "fastify-mcp-server@latest",
      "@modelcontextprotocol/sdk@^1.18.0",
      "better-sqlite3",
      "zod@^3.22.0",
    ];
    internal: ["@pre/player"];        // for static asset paths
    mcpProtocol: "2025-06-18";
    transport: "StreamableHTTP";
  };
}
```

### Why the dependency direction matters

`@pre/illustrations` has no dependencies because it is pure SVG-generating JavaScript. It can be loaded in any browser context, tested in Node.js without a DOM, and swapped out for a different rendering implementation without touching either the player or the server. This is the correct boundary.

`@pre/player` only depends on `@pre/illustrations` (for render functions) and GSAP (for animation). It has no knowledge of how the MCP server works or what transport protocol it uses. It just responds to SSE events.

`@pre/mcp-server` only depends on `@pre/player` for static asset path resolution (serving `player.html`, `player.js`, `player.css`). The server never imports animation or rendering code.

---

## 4. Request Lifecycle

The complete lifecycle from agent intent to pixel on screen:

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 1: Session Initialization                                    │
│                                                                     │
│  Agent ──[create_session({ title: "BFS Explained" })]──▶           │
│    fastify-mcp-server (validates Zod schema)                        │
│    └──▶ sessionStore.set(sessionId, { id, title, script: null })    │
│         └──▶ SQLite INSERT sessions                                 │
│         └──▶ returns { sessionId, playerUrl: "/player/SESSION_ID" } │
│                                                                     │
│  Agent receives: {                                                  │
│    sessionId: "550e8400-e29b-41d4-a716-446655440000",               │
│    playerUrl: "/player/550e8400-..."                                │
│  }                                                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 2: Player Load in Browser                                    │
│                                                                     │
│  Browser loads GET /player/SESSION_ID                               │
│    └──▶ Fastify serves player.html (static)                        │
│         └──▶ Player JS boots                                        │
│              └──▶ EventSource connects:                             │
│                   GET /session/SESSION_ID/events                    │
│              └──▶ SSE: { event: "connected", data: {sessionId} }   │
│              └──▶ SVG canvas initialized (viewBox="0 0 1920 1080") │
│              └──▶ Player displays "Waiting for content..." state   │
│                                                                     │
│  Browser is now live-connected. Any SSE push renders immediately.  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 3: VisualScript Authoring (the core loop)                    │
│                                                                     │
│  Agent ──[add_scene({ sessionId, scene: {...} })]──────────────────▶ │
│    Zod schema validation (VisualScriptSchema)                       │
│    └──▶ session.script = visualScript                               │
│         └──▶ SQLite UPSERT visual_scripts                           │
│         └──▶ sseEmit(sessionId, {                                   │
│               type: "script_update",                                │
│               script: visualScript                                  │
│             })                                                      │
│                                                                     │
│  Concurrently in browser:                                           │
│    EventSource fires "script_update" event                          │
│    └──▶ sceneController.loadScript(script)                          │
│         └──▶ seekToFrame(0)                                         │
│              └──▶ _renderFrame(frame)                               │
│                   ├──▶ entities.filter(non-Arrow) → registry[type]() │
│                   │    (double-<g> pattern, CSS entrance anim)      │
│                   └──▶ entities.filter(Arrow) → renderArrow()       │
│                        (resolves sourceEntityId/targetEntityId)     │
│              └──▶ GSAP canvas fade-in (0.3s, opacity 0.6 → 1.0)   │
│                                                                     │
│  Time from sseEmit() to first pixel: < 32ms (two animation frames) │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 4: Live Interaction (incremental updates)                    │
│                                                                     │
│  Agent ──[update_scene({ sessionId, sceneIndex: 2, patch: {...} })]▶│
│    sseEmit(sessionId, { type: "scene_update", sceneIndex, patch })  │
│    └──▶ Player: sceneController.updateScene(2, patch)              │
│         (seeking and canvas clearing happen via update_scene —      │
│          the agent sends a new scene state; internal ops are not    │
│          exposed as separate MCP tools in V1)                       │
│                                                                     │
│  Agent ──[add_narration({ sessionId, sceneIndex, text: "..." })]──▶│
│    sseEmit(sessionId, { type: "narration_update", sceneIndex })     │
│    └──▶ Player: displays narration text overlay                    │
│                                                                     │
│  Agent ──[get_session_url({ sessionId })]──▶                       │
│    └──▶ returns { playerUrl } for embedding in host page           │
└─────────────────────────────────────────────────────────────────────┘
```

### MCP Tool Signatures (V1 — Five Tools)

```typescript
// @pre/mcp-server · tools.ts

// Tool 1: Create a presentation session
interface CreateSessionInput {
  title:       string;        // Presentation title
  aspectRatio?: "16:9"|"4:3"; // Default: "16:9"
}
interface CreateSessionOutput {
  sessionId:  string;         // UUID v4
  playerUrl:  string;         // "/player/{sessionId}"
}

// Tool 2: Add a scene to the session
interface AddSceneInput {
  sessionId:    string;       // UUID v4
  scene:        Scene;        // Scene definition (see Section 6.3)
}
interface AddSceneOutput {
  ok:          true;
  sceneIndex:  number;        // Index of the newly added scene
}

// Tool 3: Update an existing scene
interface UpdateSceneInput {
  sessionId:   string;        // UUID v4
  sceneIndex:  number;        // 0-indexed scene to update
  patch:       Partial<Scene>;// Partial scene — merged with existing scene
}
interface UpdateSceneOutput {
  ok: true;
}

// Tool 4: Add narration text to a scene
interface AddNarrationInput {
  sessionId:   string;        // UUID v4
  sceneIndex:  number;        // 0-indexed scene to narrate
  text:        string;        // Narration text for this scene
}
interface AddNarrationOutput {
  ok: true;
}

// Tool 5: Get the shareable player URL for the session
interface GetSessionUrlInput {
  sessionId: string;          // UUID v4
}
interface GetSessionUrlOutput {
  playerUrl: string;          // Full URL to the embeddable player iframe
}
```

### VisualEntity — The Atomic Data Unit

```typescript
// shared/types.ts — canonical schema

interface VisualEntity {
  // Required
  id:   string;   // Unique within VisualScript; use descriptive strings: "server-1"
  type: string;   // Registry key: "Server"|"Database"|"Arrow"|"Graph2D"|...

  // Position (0–100% of canvas, origin top-left)
  position: {
    x: number;  // 0 = left edge, 100 = right edge
    y: number;  // 0 = top edge,  100 = bottom edge
  };

  // Optional display
  size?:      number;   // Scaling multiplier; 1.0 = default
  label?:     string;   // Human-readable label
  color?:     string;   // Primary fill color (hex or CSS string)
  highlight?: boolean;  // Render with highlight ring/glow

  // Animation (CSS-driven entrance)
  animation?: {
    delay?:    number;  // ms; animation-delay for entrance stagger
    duration?: number;  // ms; override default entrance duration
    easing?:   string;  // CSS easing function
    entrance?: string;  // CSS class: "entrance-fadeInUp"|"entrance-fadeIn"|...
  };

  // Relationships (flat ID references — Excalidraw-inspired)
  sourceEntityId?: string;  // Arrow start entity
  targetEntityId?: string;  // Arrow end entity
  parentEntityId?: string;  // Nested entity parent

  // Content
  textContent?: string;  // CodeBlock, annotations, free text

  // Type-specific parameterization (see Section 2.5 in architecture-recommendations)
  metadata?: Record<string, unknown>;
}
```

---

## 5. Design Principles

### The Three Laws of PRE

These laws are inviolable architectural constraints. Any feature proposal that violates a law must be rejected or re-scoped to comply.

#### Law 1 — Code Over Content

> The illustration system is a component registry, not an asset library. Every visual type is a JavaScript function. No SVG files are read from disk at runtime.

**Implication:** Adding a new entity type (e.g., `Heatmap`, `NeuralNetwork`, `StateMachine`) requires writing one render function and registering one entry in the registry. No design tools, no file commits, no topology constraints.

**Why it matters:** A static SVG bank of 60 files is a content problem — it requires ongoing design work to maintain. A component registry of 60 functions is a code problem — it scales with developer effort alone and can be parameterized infinitely at agent emission time.

#### Law 2 — Flat JSON, Never Nested Trees

> All scene data is a flat array of `VisualEntity` objects with ID cross-references. Nested objects are never permitted in the agent-facing schema.

**Implication:** The agent emits a flat `entities[]` array. Relationships between entities are expressed via `sourceEntityId`, `targetEntityId`, and `parentEntityId` string references. The renderer resolves these at runtime.

**Why it matters:** Language models generate flat arrays more reliably than deeply nested trees. Flat JSON is trivially diffable (frame-to-frame entity additions/removals are array diffs). There are no circular reference hazards, and any entity can be looked up by ID in O(1).

```javascript
// CORRECT — flat with ID references
{
  "entities": [
    { "id": "srv-1", "type": "Server",   "position": { "x": 30, "y": 50 } },
    { "id": "db-1",  "type": "Database", "position": { "x": 70, "y": 50 } },
    { "id": "arr-1", "type": "Arrow",    "position": { "x": 50, "y": 50 },
      "sourceEntityId": "srv-1", "targetEntityId": "db-1" }
  ]
}

// WRONG — nested structure
{
  "entities": [
    {
      "id": "srv-1",
      "children": [{ "id": "db-1" }],     // ✗ nesting
      "connections": [{ "to": "db-1" }]   // ✗ embedded relations
    }
  ]
}
```

#### Law 3 — GPU-Accelerated Properties Only

> Animations may only target `opacity`, `transform: translate()`, `transform: scale()`, and `transform: rotate()`. Properties that trigger layout reflow or paint are never animated.

**Implication:** The double-`<g>` pattern (outer group for position, inner group for animation) enforces this at the DOM level. CSS `@keyframes` for entrance animations run on the compositor thread. GSAP for slide-level transitions runs on the rAF ticker but only tweens opacity and transform.

**Why it matters:** Animating `x`/`y` SVG attributes, `width`/`height`, `fill`, or `stroke` triggers layout or paint on every frame. At 60fps with 60 animated entities, this causes systematic frame drops. The compositor-path approach makes the frame budget irrelevant to animation smoothness.

**Banned properties:**

| Property | Why Banned |
|----------|-----------|
| `x`, `y` (SVG attr) | Triggers layout reflow |
| `width`, `height` | Triggers layout reflow |
| `fill` (direct) | Forces paint pass |
| `stroke` (direct) | Forces paint pass |
| `cx`, `cy` | Triggers layout reflow |
| `r` (circle radius) | Triggers layout reflow |

---

### The Stage Paradigm

The engine is modeled on a **cinema projection system**, not a document editor:

| Cinema Concept | PRE Equivalent |
|---|---|
| Projector | Fastify + SSE push |
| Film reel | `VisualScript` JSON |
| Frame | `IllustrationFrame` (start/end time, entity list) |
| Props | SVG elements from `@pre/illustrations` registry |
| Scene direction | `VisualEntity` parameters emitted by agent |
| Camera choreography | CSS entrance `@keyframes` + GSAP timeline |
| Director | The AI agent |
| Audience | End user in browser via `<iframe>` |

The agent never sees the DOM. The agent never writes animation code. The agent declares *intent* (a flat JSON array of typed, positioned entities) and the engine handles all visual craft.

---

### The Double-`<g>` Pattern (Critical for Correctness)

Every render function in `@pre/illustrations` uses the double-`<g>` pattern. This is a hard requirement, not a style guideline. Violating it produces visual glitches that are difficult to diagnose.

**Why it is needed:** SVG 1.1 `transform` attributes and CSS `transform` properties apply in different coordinate systems. When both are present on the same element, browsers apply them in an implementation-defined multiplicative order — the results vary across Chrome, Firefox, and Safari. The double-`<g>` pattern assigns each system to its own element, eliminating the conflict.

```
Outer <g>  →  SVG transform="translate(x, y)"   ← position only, set once, NEVER animated
  Inner <g>  →  CSS animation class + will-change  ← all animations target this element
    Shape content (rect, circle, path, text, etc.)
```

```javascript
const SVG_NS = 'http://www.w3.org/2000/svg';

function buildEntityGroup(entity) {
  // OUTER <g>: positional transform — set once, never animated
  const outerG = document.createElementNS(SVG_NS, 'g');
  outerG.setAttribute('id', entity.id);
  outerG.setAttribute('data-type', entity.type);

  // Convert 0–100 percentage coordinates to 1920×1080 canvas pixels
  const cx = (entity.position.x / 100) * 1920;
  const cy = (entity.position.y / 100) * 1080;
  outerG.setAttribute('transform', `translate(${cx}, ${cy})`);

  // INNER <g>: animation target — CSS keyframes or GSAP operate here
  const innerG = document.createElementNS(SVG_NS, 'g');
  innerG.setAttribute('class', 'animate-element');

  // Critical CSS for compositor-path animation
  innerG.style.transformBox    = 'fill-box';
  innerG.style.transformOrigin = 'center center';
  innerG.style.willChange      = 'transform, opacity';

  if (entity.animation?.delay) {
    innerG.style.animationDelay = `${entity.animation.delay}ms`;
  }

  outerG.appendChild(innerG);
  return { outerG, innerG };
}
```

**Shape content always goes into `innerG`:**

```javascript
function renderServer(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  const size  = entity.size ?? 1.0;
  const color = entity.color ?? '#4A90D9';
  const w = 80 * size;
  const h = 60 * size;

  // Server body — appended to innerG, never outerG
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x',      String(-w / 2));
  rect.setAttribute('y',      String(-h / 2));
  rect.setAttribute('width',  String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx',     '6');
  rect.setAttribute('fill',   color);
  innerG.appendChild(rect);  // ← innerG, not outerG

  // Label
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('y',           String(h / 2 + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        '#ffffff');
    text.setAttribute('font-size',   '14');
    text.setAttribute('font-family', 'Inter, sans-serif');
    text.textContent = entity.label;
    innerG.appendChild(text);  // ← innerG
  }

  parentEl.appendChild(outerG);
  return outerG;
}
```

---

## 6. Performance Contracts

All contracts are measured at p99 on the target hardware: single VPS (4 vCPU, 8 GB RAM), Node.js 20+ LTS.

| Operation | Contract | Measurement Point | Notes |
|---|---|---|---|
| MCP tool call round-trip | < 100 ms | Agent SDK → response received | Includes Fastify routing + SQLite write |
| SSE event delivery | < 16 ms | `sseEmit()` → EventSource fires | One animation frame budget |
| Frame render (component dispatch) | < 32 ms | `seekToFrame()` → all entities in DOM | Two-frame budget; allows 30fps floor |
| Entity patch (live update) | < 8 ms | `entity_patch` event → DOM updated | Half-frame; smooth live annotations |
| Session hydration (cold load) | < 300 ms | Browser GET → first frame visible | Includes player boot + SSE connect |
| SQLite write (session/script) | < 5 ms | `INSERT`/`UPDATE` wall-clock | WAL mode, in-process driver |
| SSE concurrent connections | ≥ 50 | Simultaneous EventSource clients | Single-process Node.js target |

### Contract Enforcement

```javascript
// scene-controller.js — entity count guard
function _renderFrame(frame) {
  const entities = frame.entities ?? [];

  // Performance contract enforcement
  if (entities.length > 400) {
    console.error(`[PRE] Entity count ${entities.length} exceeds hard limit 400. Frame not rendered.`);
    return;
  }
  if (entities.length > 150) {
    console.warn(`[PRE] Entity count ${entities.length} exceeds recommended limit 150.`);
  }

  // Render...
}
```

### CSS Animation Performance Contract

```
REQUIREMENT: All entrance animations MUST use CSS @keyframes + animation-delay.

Rationale: CSS animations run on the compositor thread. They consume
zero JS main-thread budget. A scene controller busy rendering 60
entities into the DOM will not drop entrance animation frames.

Violation: Using GSAP gsap.to() in a loop for per-entity stagger
runs on the main thread and will stutter during heavy render passes.
```

```css
/* player.css — critical block; must be present on all animated inner <g> */
.animate-element {
  transform-box:    fill-box;    /* anchor transforms to element's own bounding box */
  transform-origin: center center;
  will-change:      transform, opacity;  /* pre-promote to compositor layer */
}

@keyframes fadeInUp {
  0%   { opacity: 0; transform: translateY(24px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0px)  scale(1.00); }
}

@keyframes fadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes drawIn {
  0%   { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1);   }
}

.entrance-fadeInUp {
  animation: fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  /* 'both' fill-mode = apply from-state before delay expires */
}

.entrance-fadeIn {
  animation: fadeIn 0.3s ease both;
}

.entrance-drawIn {
  animation: drawIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
```

---

## 7. V1 Scope — In vs. Cut

### In Scope (V1)

| Category | Item | Rationale |
|---|---|---|
| MCP Transport | Streamable HTTP (2025-06-18) | Only MCP protocol that works in production; SSE transport is deprecated |
| MCP Tools | 5 tools: `create_session`, `add_scene`, `update_scene`, `add_narration`, `get_session_url` | Minimum viable agent-facing surface |
| Rendering | SVG canvas, 1920×1080 viewBox, 88+ entity types | Full visual capability at launch |
| Animation | CSS @keyframes entrance, GSAP 3.13 slide transitions | GPU-accelerated, free runtime |
| Persistence | SQLite WAL, in-process (better-sqlite3) | No infrastructure cost, sufficient for V1 |
| Auth | API key (x-api-key header) | Minimum viable monetization gate |
| Deployment | Single VPS, Node.js process, PM2 | Simplest possible ops footprint |
| Player delivery | Static files served by Fastify `/public` | No CDN required for V1 |

### Cut from V1

| Item | Reason Cut | Future Version |
|---|---|---|
| WebSocket transport | MCP SDK doesn't expose it cleanly; SSE deprecated; StreamableHTTP is correct | Never needed |
| Asset upload (images, video) | Scope creep; PRE is code-only rendering | V2 or never |
| Multi-user collaboration | Requires distributed session store (Redis) | V3 |
| Auth provider integration (OAuth) | Premature; API key sufficient | V2 |
| Mobile-native player | Out of scope; iframe works on mobile | V2 |
| PDF export | Not agent-native; separate concern | V2 |
| Custom fonts (CORS-safe) | Font loading unreliable in iframe context | V2 |
| Agent-driven audio narration | TTS integration adds significant complexity | V2 |
| Analytics/usage dashboard | Premature for V1 | V2 |

---

## 8. Technology Choices & Rationale

| Technology | Version | Why Chosen |
|---|---|---|
| Node.js | ≥ 18 LTS | Stable, worker threads if needed, native fetch |
| TypeScript | 5.x (monorepo root) | Type safety for MCP schemas and Zod integration |
| Fastify | 5.x | Fastest Node.js HTTP framework; plugin system for MCP |
| MCP SDK | `@modelcontextprotocol/sdk@^1.18.0` | Official SDK with StreamableHTTP transport |
| MCP Protocol | `2025-06-18` | Latest stable; only version that supports StreamableHTTP |
| SQLite | better-sqlite3 | Synchronous in-process driver; WAL mode; zero infrastructure |
| Zod | 3.x | Schema validation at MCP ingress; TypeScript inference |
| GSAP | 3.13 (free) | Slide-level transitions; rAF ticker; fully free since Webflow acquisition |
| Vitest | 2.x | Fast unit tests in monorepo; workspace config |
| pnpm | 9.x | Strict workspace hoisting; symlinks for monorepo |

### Why Not React/Vue/Svelte for the Player?

The player renders SVG into a canvas. The component lifecycle is:
1. SSE event arrives with new `VisualScript`
2. All existing SVG is cleared
3. New SVG is generated via component registry functions
4. CSS entrance animations run automatically

This is a **one-way, imperative render pipeline** — not a reactive state tree. Introducing a VDOM framework adds:
- A reconciliation step that is unnecessary (we always re-render the full frame)
- A framework bundle (~50–100KB) that serves no architectural purpose
- A dependency that outlives its usefulness once the "reactive" benefit is absent

Vanilla JS `createElementNS` with a component registry produces smaller bundles, faster renders, and zero framework-specific edge cases.

### Why Streamable HTTP (Not WebSockets)?

MCP SDK 1.18.0 supports three transports:
1. **stdio** — local only (Claude Desktop), not suitable for remote VPS
2. **SSE** — deprecated in MCP protocol 2025-03-26
3. **StreamableHTTP** — the current production standard

Streamable HTTP over HTTPS plays nicely with standard proxies, firewalls, and TLS termination. It requires zero special infrastructure. It is what every production MCP deployment uses in 2025.

### Why SQLite over PostgreSQL?

V1 is a single-process, single-VPS deployment. PostgreSQL adds:
- A separate process to manage
- A connection pool to configure
- TCP round-trips for every query
- ~200MB RAM baseline

SQLite in WAL mode with `better-sqlite3` (synchronous, in-process) delivers < 5ms writes, zero infrastructure, and trivial backup (copy one file). At V1 scale (< 100 concurrent sessions), this is the correct choice. Migration to PostgreSQL if needed in V2 is a one-day task.

---

## 9. Monorepo Structure

```
pre/
├── package.json           # pnpm workspace root
├── tsconfig.base.json     # Shared TS compiler options
├── vitest.config.ts       # Monorepo-wide test runner config
│
├── packages/
│   ├── illustrations/     # @pre/illustrations
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── registry.js          # Component registry (type → function map)
│   │   │   ├── defaults.js          # applyDefaults() — fills entity skeleton
│   │   │   └── components/
│   │   │       ├── server.js
│   │   │       ├── database.js
│   │   │       ├── arrow.js
│   │   │       ├── graph2d.js
│   │   │       └── ... (88+ components)
│   │   └── test/
│   │       └── registry.test.ts
│   │
│   ├── player/            # @pre/player
│   │   ├── package.json
│   │   ├── public/
│   │   │   ├── player.html          # Entry point served by Fastify
│   │   │   ├── player.js            # Bundled or vanilla JS
│   │   │   └── player.css           # CSS animations + layout
│   │   ├── src/
│   │   │   ├── scene-controller.js  # Frame rendering + SSE event handling
│   │   │   └── player-boot.js       # EventSource init + canvas setup
│   │   └── test/
│   │       └── scene-controller.test.ts
│   │
│   └── mcp-server/        # @pre/mcp-server
│       ├── package.json
│       ├── src/
│       │   ├── server.ts            # Fastify app + route registration
│       │   ├── tools.ts             # MCP tool definitions (Zod schemas + handlers)
│       │   ├── session-store.ts     # In-memory Map + SQLite sync
│       │   ├── sse.ts               # SSE emission + client tracking
│       │   └── db/
│       │       ├── schema.sql       # SQLite schema (sessions, visual_scripts, api_keys)
│       │       └── migrate.ts       # Run-on-boot migration
│       └── test/
│           ├── tools.test.ts
│           └── sse.test.ts
│
├── architecture/          # This document and sibling specs
│   ├── 01-system-overview.md        ← you are here
│   ├── 02-mcp-server.md
│   ├── 03-pml-scene-compiler.md
│   ├── 04-player-renderer.md
│   ├── 05-illustration-system.md
│   ├── 06-data-model.md
│   ├── 07-api-spec.md
│   ├── 08-deployment.md
│   └── FLOW-user-prompt-to-ui.md
│
└── docs/
    └── claude-desktop-setup.md
```

---

## 10. 3-Month Timeline

```
WEEK 1–2: Foundation
  ☐ pnpm monorepo scaffold (packages/illustrations, packages/player, packages/mcp-server)
  ☐ tsconfig.base.json + per-package tsconfig.json
  ☐ vitest.config.ts (workspace mode)
  ☐ @pre/illustrations: registry.js + 10 core components
  ☐ @pre/mcp-server: Fastify boot + SQLite schema + 5 MCP tools (stub handlers)
  ☐ @pre/player: HTML canvas + SSE connect + scene-controller.js skeleton

WEEK 3–4: Core Pipeline
  ☐ End-to-end test: create_session → add_scene → player renders 5 entity types
  ☐ @pre/illustrations: 30 components (Server, Database, Arrow, Graph2D, Equation, Matrix, ...)
  ☐ @pre/player: GSAP slide transitions + CSS entrance animations
  ☐ MCP tool: update_scene + add_narration
  ☐ SQLite WAL setup + session hydration on player reload

WEEK 5–6: Complete Component Library
  ☐ @pre/illustrations: 88+ components
  ☐ Visual regression tests (screenshot diff of render functions)
  ☐ Performance profiling: frame render < 32ms at 60 entities
  ☐ API key auth middleware
  ☐ get_session_url tool

WEEK 7–8: Polish + VPS Deploy
  ☐ PM2 ecosystem config
  ☐ HTTPS via nginx reverse proxy + Certbot
  ☐ Docker image (optional — single binary alt to PM2)
  ☐ Claude Desktop config (architecture/claude-desktop-setup.md)
  ☐ End-to-end smoke test on VPS

WEEK 9–12: Hardening
  ☐ Load test: 50 concurrent SSE connections
  ☐ Error boundary in player (malformed VisualScript handling)
  ☐ Rate limiting (Fastify plugin)
  ☐ Session TTL + cleanup job
  ☐ Logging (pino + log rotation)
  ☐ README polish + API reference
```

---

## 11. Cross-References

| Document | What it covers |
|---|---|
| [02 — MCP Server Architecture](./02-mcp-server.md) | Fastify setup, MCP tools in detail, SSE implementation, SQLite schema |
| [03 — PML Scene Compiler](./03-pml-scene-compiler.md) | The agent-facing JSON schema (VisualScript, Scene, Entity) |
| [04 — Player & Renderer](./04-player-renderer.md) | scene-controller.js, GSAP integration, CSS animations, SSE client |
| [05 — Illustration System](./05-illustration-system.md) | All 88+ components, render function API, component registry |
| [06 — Data Model](./06-data-model.md) | SQLite schema, session lifecycle, API key management |
| [07 — API Spec](./07-api-spec.md) | Full HTTP API reference (MCP + REST endpoints) |
| [08 — Deployment](./08-deployment.md) | VPS setup, PM2, nginx, TLS, environment config |
| [FLOW — User Prompt to UI](./FLOW-user-prompt-to-ui.md) | Complete execution trace from agent intent to pixel |

---

*Document: `architecture/01-system-overview.md`*
*Part of: [Presentation Rendering Engine](../README.md)*
*Next: [02 — MCP Server Architecture](./02-mcp-server.md)*
