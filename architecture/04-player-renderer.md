# 04 — Player & Renderer Architecture

**Package:** `@pre/player`
**Status:** V1 — Authoritative (supersedes all previous versions)
**Last Updated:** 2026-02-28
**Depends On:** `@pre/server` (SSE endpoint), `@pre/illustrations` (component registry)

> **What changed from the old doc:**
> HTTP polling → SSE `EventSource`. React components → vanilla JS `createElementNS`.
> `SceneGraph` / `EnvironmentAPI` → flat `sceneController` object.
> 1600×900 → `viewBox="0 0 1920 1080"`. `iframe` embed now primary integration.
> MorphSVGPlugin removed. Double-`<g>` pattern is now a first-class contract.
>
> See [architecture-recommendations.md §4](../architecture-recommendations.md#4-player-architecture-updates-doc-04) for the full change table.

---

## Table of Contents

1. [Player Overview](#1-player-overview)
2. [Design Philosophy](#2-design-philosophy)
3. [Three-Layer Architecture](#3-three-layer-architecture)
4. [What Changed from the Old Model](#4-what-changed-from-the-old-model)
5. [Static File Structure](#5-static-file-structure)
6. [SVG Canvas Setup](#6-svg-canvas-setup)
7. [The Double-`<g>` Pattern (Critical Contract)](#7-the-double-g-pattern-critical-contract)
8. [Vanilla JS DOM Rules](#8-vanilla-js-dom-rules)
9. [Component Registry](#9-component-registry)
10. [Skeleton API & applyDefaults](#10-skeleton-api--applydefaults)
11. [Scene Controller](#11-scene-controller)
12. [Entrance Animation System](#12-entrance-animation-system)
13. [GSAP Integration & rAF Ticker](#13-gsap-integration--raf-ticker)
14. [Frame Transitions](#14-frame-transitions)
15. [Exiting Entities](#15-exiting-entities)
16. [Connection Rendering (Arrows & DataFlow)](#16-connection-rendering-arrows--dataflow)
17. [Fuzzy Label Lookup](#17-fuzzy-label-lookup)
18. [Hierarchical Nesting](#18-hierarchical-nesting)
19. [SSE Connection & Event Handling](#19-sse-connection--event-handling)
20. [iframe Embed & postMessage Bridge](#20-iframe-embed--postmessage-bridge)
21. [Narrator Text Overlay](#21-narrator-text-overlay)
22. [Dark Cinematic Theme](#22-dark-cinematic-theme)
23. [Performance Contracts](#23-performance-contracts)
24. [Complete player.js Bootstrap](#24-complete-playerjs-bootstrap)
25. [Full Worked Example](#25-full-worked-example)
26. [Error Handling & Resilience](#26-error-handling--resilience)
27. [Browser Compatibility](#27-browser-compatibility)
28. [V1 Limitations & V2 Roadmap](#28-v1-limitations--v2-roadmap)

---

## 1. Player Overview

`@pre/player` is the browser-side runtime for PRE (Presentation Rendering Engine). It receives `VisualScript` JSON from an AI agent via Server-Sent Events and renders cinema-quality animated scenes inside a fixed 1920×1080 SVG canvas.

### 1.1 Responsibilities

The player is the **sole authoritative renderer**. Every pixel visible on screen is the result of scene commands executed inside the player.

| Responsibility | How It's Done |
|---|---|
| Receive scene updates | `EventSource` → `/session/:id/events` (SSE) |
| Parse `VisualScript` JSON | `sceneController.loadScript(script)` |
| Render entities to SVG | Component registry dispatch: `registry[entity.type](entity, parentEl)` |
| Position entities | Outer `<g>` SVG transform attribute (set once, never animated) |
| Animate entrances | CSS `@keyframes` + `animation-delay` (compositor thread) |
| Animate transitions | GSAP `.timeline()` (main thread, frame-level only) |
| Auto-advance frames | `gsap.ticker.add()` — never `setInterval` or raw `rAF` |
| Respond to host control | `postMessage` bridge when embedded as `<iframe>` |
| Display narrator text | HTML overlay `<div>` synced to `narrationSegment.text` |

### 1.2 Package Context

```
@pre/server           →  Fastify + MCP + SSE endpoint
  │
  │  SSE push: script_update, seek, entity_patch, clear
  ▼
@pre/player           ←  This document
  │
  ├── player.html     (SVG canvas, GSAP CDN script tag)
  ├── player.css      (cinematic theme, keyframes, layout)
  ├── player.js       (EventSource, sceneController init)
  ├── scene-controller.js
  ├── registry.js     (imports from @pre/illustrations)
  └── components/     (or imported from @pre/illustrations package)
```

---

## 2. Design Philosophy

### 2.1 Agent-Native, Cinema-Quality

PRE is designed as an agent-native API for cinematic visual presentations. The bar is not "a slide deck tool" — it is "a cinema-quality visual system that an LLM can drive in real time."

This means:

- **Zero framework dependency.** Vanilla JS with `createElementNS`. No React, Vue, or Svelte. No virtual DOM diff, no reconciliation, no GC pressure from VDOM allocations.
- **Compositor-first animation.** Entrance animations run on the GPU compositor thread via CSS `@keyframes`. The JavaScript main thread is never blocked by animation loops.
- **Flat, diffable data.** The agent emits flat `VisualEntity` arrays (Excalidraw-inspired). No nested trees. Each entity is self-contained and addressable by ID.
- **Minimal agent API surface.** The agent can emit `{ id, type, position }` and the renderer fills in all defaults. Token-efficient, error-resilient.

### 2.2 Why Vanilla JS (Not React/Vue/Svelte)

| Concern | Framework | Vanilla JS |
|---|---|---|
| Bundle size | 40–120 KB runtime | 0 KB framework overhead |
| Render timing | Virtual DOM diff (non-deterministic) | Direct DOM mutation, deterministic |
| GSAP interop | Requires escape hatches (`useRef`, `useEffect`) | GSAP operates directly on DOM nodes |
| Embed isolation | Framework conflicts if host uses same version | Self-contained, zero peer conflicts |
| GC pressure | VDOM allocations per render cycle | Minimal; DOM nodes are reused or cleared |
| SVG animation | Limited; SVG namespace requires workarounds | Full `createElementNS` + `setAttribute` control |

### 2.3 Animation Philosophy: Hybrid CSS + GSAP

Two tools for two distinct jobs:

| Job | Tool | Why |
|---|---|---|
| Per-entity entrance (staggered) | CSS `@keyframes` + `animation-delay` | Compositor thread — zero JS overhead |
| Frame transitions (canvas-level) | GSAP `.timeline()` | rAF ticker, precise coordination |
| Complex choreography (multi-entity beyond delay) | GSAP `.timeline()` | Full timeline control, callbacks, scrubbing |
| Path draw-on effects | GSAP `DrawSVGPlugin` (free in 3.13) | Circuit traces, graph line reveals |
| Shape morphing | **NOT USED IN V1** | Entity swap via opacity/transform is sufficient |

**Critical rule:** Never use `gsap.to()` in a loop for per-entity stagger. That runs on the main thread and will stutter during heavy render passes. Use `animation-delay` instead.

---

## 3. Three-Layer Architecture

Every component in the system belongs to exactly one of three layers. Data flows strictly downward.

```
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 1: SCHEMA (Agent API)                                    │
│                                                                 │
│  VisualEntity JSON + VisualScript + IllustrationFrame           │
│  Zod validation on MCP server (prevents malformed JSON         │
│  from reaching the renderer)                                    │
│  Defined in: schemas/visual.js + shared/types.ts               │
└──────────────────────────┬──────────────────────────────────────┘
                           │ add_scene MCP tool call
                           │ → SSE push: script_update event
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 2: ENGINE (Component Registry)                           │
│                                                                 │
│  applyDefaults()          — skeleton → full entity             │
│  assignEntranceDelays()   — 80ms stagger per entity            │
│  registry[entity.type]()  — entity → SVG DOM nodes            │
│  renderArrow()            — resolves ID cross-references       │
│  renderChildren()         — hierarchical nesting               │
│  Defined in: registry.js + @pre/illustrations                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │ DOM nodes appended to #entity-layer
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  LAYER 3: RENDERER (Runtime Execution)                          │
│                                                                 │
│  sceneController.js    — frame management, SSE handler         │
│  CSS @keyframes        — entrance animations (compositor)      │
│  GSAP timelines        — frame transitions (main thread)       │
│  EventSource (SSE)     — receives VisualScript from server     │
│  postMessage bridge    — host-controlled playback              │
│  Narrator overlay      — HTML div synced to narrationSegment   │
│  Defined in: player.js + scene-controller.js + player.css      │
└─────────────────────────────────────────────────────────────────┘
```

**Invariants:**
1. Layer 1 (Schema) has no knowledge of Layer 2 or 3. It defines data shapes only.
2. Layer 2 (Engine) has no knowledge of Layer 3. It builds DOM nodes; it does not animate them.
3. Layer 3 (Renderer) has no knowledge of Layer 1 schemas. It operates on DOM nodes and GSAP.
4. SSE events re-enter at Layer 1 (carrying `VisualScript` JSON), never bypassing schema validation.

---

## 4. What Changed from the Old Model

This table is the migration diff. Reference it when reviewing old code or updating integration docs.

| Dimension | Old (v0) | New (V1) | Reason |
|---|---|---|---|
| **Transport** | HTTP polling (500ms interval) | SSE `EventSource` → `/session/:id/events` | Real-time push, zero polling overhead |
| **Events** | Poll: `GET /commands?cursor=…` | Push: `script_update`, `seek`, `entity_patch`, `clear` | One-way push; HTTP/2 multiplexed |
| **Reconnect** | Custom retry logic | Browser `EventSource` auto-reconnects | Built-in, `Last-Event-ID` resumption |
| **Framework** | React components | Vanilla JS `createElementNS` | Zero dependency, direct GSAP integration |
| **Canvas size** | 1600×900 | `viewBox="0 0 1920 1080"` | 1920×1080 is the cinema standard |
| **Aspect ratio** | 16:9 (numeric) | `preserveAspectRatio="xMidYMid meet"` | Responsive scaling without JS |
| **State** | `SceneGraph` class (complex) | `sceneController` flat object | Reduced complexity; 90% less code |
| **Rendering** | `EnvironmentAPI` method calls | `registry[type](entity, parentEl)` dispatch | Extensible; adding types = one function |
| **Shape morph** | MorphSVGPlugin (required) | Not used in V1 | Opacity/transform swap is sufficient |
| **Entrance anim** | GSAP `stagger` (main thread) | CSS `animation-delay` (compositor) | Zero JS overhead; no frame drops |
| **Frame timer** | `setInterval` | `gsap.ticker.add()` | Batched rAF; no non-deterministic timing |
| **Embed** | Unspecified | `<iframe>` + `postMessage` | Universal; zero host-side JS required |
| **Position system** | CSS `transform` on single element | Double-`<g>` (outer: SVG attr, inner: CSS) | Prevents transform conflict (see §7) |
| **Background** | Unspecified | `#0a0c14` (near-black, slightly cool) | Cinematic dark theme |

---

## 5. Static File Structure

```
player/
├── player.html           ← Static HTML; SVG canvas; GSAP CDN
├── player.css            ← Cinematic theme; @keyframes; layout
├── player.js             ← Entry point: EventSource init; session ID
├── scene-controller.js   ← Frame management; GSAP ticker; patch handler
├── registry.js           ← Entity type → render function map
└── components/           ← Per-entity render functions (or @pre/illustrations)
    ├── server.js
    ├── database.js
    ├── arrow.js
    ├── graph2d.js
    ├── equation.js
    ├── matrix.js
    ├── wave.js
    ├── circuit.js
    ├── table.js
    ├── codeblock.js
    └── ... (50+ more)
```

Each `components/*.js` file exports a single named function: `renderServer`, `renderDatabase`, etc. The function signature is always:

```js
/**
 * @param {VisualEntity} entity   - fully-defaulted entity descriptor
 * @param {SVGElement}   parentEl - the SVG layer to append into
 * @returns {SVGGElement}          the outer <g> (for later GSAP targeting)
 */
function render*(entity, parentEl) { ... }
```

---

## 6. SVG Canvas Setup

### 6.1 player.html

The entire canvas is a single SVG element with a fixed `viewBox`. CSS scales it to fit any container without JavaScript.

```html
<!-- player/player.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRE Player</title>
  <link rel="stylesheet" href="player.css">
</head>
<body>

  <!-- Narrator text overlay (HTML, not SVG — better font rendering) -->
  <div id="narrator-overlay">
    <p id="narrator-text"></p>
  </div>

  <div id="canvas-wrapper">
    <!--
      viewBox="0 0 1920 1080"  — 16:9, 1920×1080 coordinate space
      preserveAspectRatio="xMidYMid meet"  — scales to fit, centered, no crop
      All entities are positioned in this coordinate space (0-100% → pixel)
    -->
    <svg
      id="canvas"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <!--
          Arrow marker — referenced by all connection lines via marker-end="url(#arrowhead)"
          Defined once in <defs>, shared by all arrows in the document
        -->
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.8)" />
        </marker>

        <!-- Highlight glow filter for entity.highlight === true -->
        <filter id="entity-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Background: near-black cinematic fill -->
      <rect id="bg" width="1920" height="1080" fill="#0a0c14" />

      <!-- Entity layer — all non-arrow entities rendered here -->
      <g id="entity-layer"></g>

      <!-- Connection layer — arrows and DataFlow lines rendered AFTER entities -->
      <g id="connection-layer"></g>

      <!-- Overlay layer — floating labels, tooltips, annotations -->
      <g id="overlay-layer"></g>
    </svg>
  </div>

  <!-- GSAP 3.13 — all plugins free, no license key needed -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
  <!-- DrawSVGPlugin for graph line draw-on effects -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/DrawSVGPlugin.min.js"></script>

  <!-- Player scripts (module order matters) -->
  <script type="module" src="registry.js"></script>
  <script type="module" src="scene-controller.js"></script>
  <script type="module" src="player.js"></script>
</body>
</html>
```

### 6.2 Layer Architecture

The SVG has three named layers, rendered in DOM order (later = on top):

```
SVG #canvas
├── <rect id="bg" />               — background fill (#0a0c14)
├── <g id="entity-layer" />        — Server, Database, Graph2D, etc.
├── <g id="connection-layer" />    — Arrow, DataFlow (rendered after entities)
└── <g id="overlay-layer" />       — Labels, badges, annotations
```

**Why three layers?** Arrows must be drawn after all entities are positioned, so their endpoints can resolve to real pixel coordinates. The connection layer appearing after the entity layer in DOM order also ensures arrow heads render above entity bodies (correct z-order for overlapping layouts).

### 6.3 Coordinate System

All entity positions are expressed in **percentage coordinates** (0–100) in `VisualEntity.position`. The renderer converts them to absolute 1920×1080 pixel positions:

```js
/// player/coordinate-system.js

const CANVAS_W = 1920;
const CANVAS_H = 1080;

/**
 * Convert a percentage-based position to absolute SVG canvas pixels.
 * @param {{ x: number, y: number }} pct  - position in 0–100% space
 * @returns {{ cx: number, cy: number }}   - absolute SVG coordinates
 */
function pctToCanvas(pct) {
  return {
    cx: (pct.x / 100) * CANVAS_W,
    cy: (pct.y / 100) * CANVAS_H,
  };
}
```

This conversion happens inside `buildEntityGroup()` (§7). The outer `<g>`'s `transform` attribute is set from the result. The agent never thinks in pixels — it always works in 0–100% space.

---

## 7. The Double-`<g>` Pattern (Critical Contract)

This is the most important implementation rule in the entire player. Every render function MUST follow it. Violating it causes visual glitches and breaks GSAP animation.

### 7.1 Why Two `<g>` Elements?

SVG elements have two transform systems:

1. **SVG `transform` attribute** (SVG 1.1) — `<g transform="translate(x, y)">`. Applied by the SVG rendering engine.
2. **CSS `transform` property** (CSS Transforms Level 1) — `style.transform = 'translateX(10px)'`. Applied by the CSS animation engine.

If both systems target the **same element**, browsers apply them multiplicatively in an implementation-defined order. The result is unpredictable positioning, broken GSAP interpolation, and visual glitches during animation.

**The fix: isolate each system on its own element.**

```
OUTER <g>  →  SVG transform attribute  →  position (set once, NEVER animated)
INNER <g>  →  CSS transform property   →  entrance animation + GSAP tweens
```

### 7.2 Full Implementation

```js
/// player/components/entity-group.js

const SVG_NS = 'http://www.w3.org/2000/svg';

const CANVAS_W = 1920;
const CANVAS_H = 1080;

/**
 * Build the standard outer+inner <g> pair for any entity.
 *
 * Outer <g>: sets SVG transform="translate(cx, cy)" — NEVER animated.
 * Inner <g>: CSS animation class + will-change — receives @keyframes and GSAP.
 *
 * @param {VisualEntity} entity  - fully-defaulted entity
 * @returns {{ outerG: SVGGElement, innerG: SVGGElement }}
 */
function buildEntityGroup(entity) {
  // ── OUTER <g>: position only ──────────────────────────────────────
  const outerG = document.createElementNS(SVG_NS, 'g');
  outerG.setAttribute('id',        entity.id);
  outerG.setAttribute('data-type', entity.type);

  // Convert 0–100% position to 1920×1080 canvas pixels
  const cx = (entity.position.x / 100) * CANVAS_W;
  const cy = (entity.position.y / 100) * CANVAS_H;
  outerG.setAttribute('transform', `translate(${cx}, ${cy})`);

  // Optional: highlight glow (uses filter defined in <defs>)
  if (entity.highlight) {
    outerG.setAttribute('filter', 'url(#entity-glow)');
  }

  // ── INNER <g>: animation target ──────────────────────────────────
  const innerG = document.createElementNS(SVG_NS, 'g');
  innerG.setAttribute('class', 'animate-element');

  // Critical CSS: required on EVERY animated SVG inner <g>
  // (also set via .animate-element class in player.css — belt & suspenders)
  innerG.style.transformBox    = 'fill-box';
  innerG.style.transformOrigin = 'center center';
  innerG.style.willChange      = 'transform, opacity';

  outerG.appendChild(innerG);
  return { outerG, innerG };
}
```

### 7.3 Why These Three CSS Properties

```
transform-box: fill-box
  Without this, transform-origin is measured from the SVG viewport origin,
  not the element's own bounding box. A scale() or rotate() will pivot
  from the wrong point — usually the top-left corner of the canvas.
  With fill-box, the pivot is the element's own center.

transform-origin: center center
  Centers the pivot point within the fill-box. Combined with fill-box,
  this means scale(0) collapses to the element's visual center, and
  rotate(45deg) spins around its own axis.

will-change: transform, opacity
  Tells the browser compositor to promote this element to its own GPU
  layer BEFORE animation starts. Without this, the first frame of an
  animation causes a synchronous layer promotion — visible as a flash
  of incorrect content on the first frame (first-frame jank).
```

### 7.4 Shape Content Goes Into `innerG` — Never `outerG`

```js
/// player/components/server.js

import { buildEntityGroup } from './entity-group.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

export function renderServer(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  const size  = entity.size  ?? 1.0;
  const color = entity.color ?? '#4A90D9';
  const w = 80 * size;
  const h = 60 * size;

  // All shape geometry goes into innerG (the animation target)
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x',      String(-w / 2));
  body.setAttribute('y',      String(-h / 2));
  body.setAttribute('width',  String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx',     '6');
  body.setAttribute('fill',   color);
  body.setAttribute('stroke', 'rgba(255,255,255,0.15)');
  body.setAttribute('stroke-width', '1');
  innerG.appendChild(body);

  // Server rack lines
  for (let i = 0; i < 3; i++) {
    const rack = document.createElementNS(SVG_NS, 'line');
    rack.setAttribute('x1', String(-w / 2 + 10));
    rack.setAttribute('x2', String(w / 2 - 10));
    const ly = -h / 2 + 10 + i * 14;
    rack.setAttribute('y1', String(ly));
    rack.setAttribute('y2', String(ly));
    rack.setAttribute('stroke',       'rgba(255,255,255,0.35)');
    rack.setAttribute('stroke-width', '1.5');
    innerG.appendChild(rack);
  }

  // Status dot
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx',   String(w / 2 - 10));
  dot.setAttribute('cy',   String(-h / 2 + 10));
  dot.setAttribute('r',    '4');
  dot.setAttribute('fill', '#6AB187');
  innerG.appendChild(dot);

  // Label below entity
  if (entity.label) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('y',           String(h / 2 + 18));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill',        'rgba(240,234,214,0.9)');
    label.setAttribute('font-size',   '14');
    label.setAttribute('font-family', 'DM Sans, system-ui, sans-serif');
    label.setAttribute('font-weight', '500');
    label.textContent = entity.label;
    innerG.appendChild(label);
  }

  // Apply entrance animation
  applyEntranceAnimation(innerG, entity);

  parentEl.appendChild(outerG);
  return outerG;
}
```

### 7.5 The Double-`<g>` Invariant: Visual Summary

```
<svg viewBox="0 0 1920 1080">
  <g id="entity-layer">

    <!-- Entity: server-1 at position 25%, 50% -->
    <g id="server-1"
       data-type="Server"
       transform="translate(480, 540)">   ← OUTER: position, set once, never animated
                                            Converts 25% → 480px, 50% → 540px

      <g class="animate-element"
         style="transform-box:fill-box;
                transform-origin:center center;
                will-change:transform,opacity;
                animation-delay:0ms">    ← INNER: CSS animation + GSAP target
        <!-- shape geometry -->
        <rect x="-40" y="-30" width="80" height="60" rx="6" fill="#4A90D9"/>
        <text y="48" text-anchor="middle">API Server</text>
      </g>
    </g>

  </g>
</svg>
```

---

## 8. Vanilla JS DOM Rules

The player uses no framework. All DOM creation follows three strict rules.

### Rule 1: Always Use `createElementNS` for SVG Elements

```js
/// player/dom-rules.js — CORRECT vs WRONG patterns

const SVG_NS = 'http://www.w3.org/2000/svg';

// ✓ CORRECT — creates a proper SVGRectElement
const rect = document.createElementNS(SVG_NS, 'rect');

// ✗ WRONG — creates HTMLUnknownElement; renders as nothing in SVG context
const badRect = document.createElement('rect');
```

**Why:** SVG and HTML share tag names (`a`, `title`, `style`). Without the SVG namespace URI, `createElement` creates HTML elements that silently fail to render in SVG context. There is no error thrown — the element simply does not appear.

### Rule 2: Always Use `setAttribute` for SVG Presentation Attributes

```js
// ✓ CORRECT
rect.setAttribute('x',      '10');
rect.setAttribute('y',      '20');
rect.setAttribute('width',  '100');
rect.setAttribute('height', '50');
rect.setAttribute('fill',   '#4A90D9');
rect.setAttribute('rx',     '8');

// ✗ WRONG — property assignment does not work for SVG presentation attributes
rect.x      = 10;   // reads as SVGAnimatedLength; writes are ignored
rect.width  = 100;  // same issue
rect.fill   = '#4A90D9';  // SVGRectElement has no .fill property
```

**Exception:** The `id` attribute can be set via either `setAttribute('id', …)` or `.id = …` — both work because `id` is a reflected IDL attribute.

### Rule 3: CSS Properties Use `el.style.propertyName` (camelCase)

```js
// ✓ CORRECT — CSS properties are set via .style (camelCase)
innerG.style.transformBox    = 'fill-box';
innerG.style.transformOrigin = 'center center';
innerG.style.willChange      = 'transform, opacity';
innerG.style.animationDelay  = '160ms';

// ✗ WRONG — kebab-case not valid as JS property names
innerG.style['transform-box'] = 'fill-box';   // works but not idiomatic
```

### Namespace Reference

```js
/// player/constants.js

export const SVG_NS  = 'http://www.w3.org/2000/svg';
export const HTML_NS = 'http://www.w3.org/1999/xhtml';

export const CANVAS_W = 1920;
export const CANVAS_H = 1080;

export const ENTITY_LAYER     = '#entity-layer';
export const CONNECTION_LAYER = '#connection-layer';
export const OVERLAY_LAYER    = '#overlay-layer';
```

---

## 9. Component Registry

The registry is the extensibility point of the entire illustration system. It maps entity type strings to render functions. Adding a new entity type requires adding exactly one entry — no other files change.

### 9.1 Registry Definition

```js
/// player/registry.js

import { renderServer }       from './components/server.js';
import { renderDatabase }     from './components/database.js';
import { renderArrow }        from './components/arrow.js';
import { renderDataFlow }     from './components/dataflow.js';
import { renderGraph2D }      from './components/graph2d.js';
import { renderEquation }     from './components/equation.js';
import { renderMatrix }       from './components/matrix.js';
import { renderWave }         from './components/wave.js';
import { renderCircuit }      from './components/circuit.js';
import { renderTable }        from './components/table.js';
import { renderCodeBlock }    from './components/codeblock.js';
import { renderFrame }        from './components/frame.js';
import { renderLabel }        from './components/label.js';
import { renderUser }         from './components/user.js';
import { renderContainer }    from './components/container.js';
import { renderCloud }        from './components/cloud.js';
import { renderQueue }        from './components/queue.js';
import { renderCache }        from './components/cache.js';
import { renderLoadBalancer } from './components/load-balancer.js';
import { renderPipeline }     from './components/pipeline.js';
import { renderConcept }      from './components/concept.js';
import { renderMetric }       from './components/metric.js';
import { renderBarChart }     from './components/bar-chart.js';
import { renderScatterPlot }  from './components/scatter-plot.js';
// ... import all others ...

/**
 * Registry: entity type string → render function
 *
 * All render functions share the signature:
 *   (entity: VisualEntity, parentEl: SVGElement) => SVGGElement
 */
export const registry = {
  // ── Infrastructure ──────────────────────────────────────────────
  Server:       renderServer,
  Database:     renderDatabase,
  User:         renderUser,
  Container:    renderContainer,
  Cloud:        renderCloud,
  Queue:        renderQueue,
  Cache:        renderCache,
  LoadBalancer: renderLoadBalancer,
  Pipeline:     renderPipeline,

  // ── Connections (handled separately via renderArrow) ─────────────
  Arrow:        renderArrow,
  DataFlow:     renderDataFlow,

  // ── Math & Science ───────────────────────────────────────────────
  Graph2D:      renderGraph2D,
  Equation:     renderEquation,
  Matrix:       renderMatrix,
  Wave:         renderWave,
  Circuit:      renderCircuit,

  // ── Data & Code ──────────────────────────────────────────────────
  Table:        renderTable,
  CodeBlock:    renderCodeBlock,

  // ── Layout & Labels ──────────────────────────────────────────────
  Frame:        renderFrame,
  Label:        renderLabel,
  Concept:      renderConcept,
  Metric:       renderMetric,

  // ── Charts ───────────────────────────────────────────────────────
  BarChart:     renderBarChart,
  ScatterPlot:  renderScatterPlot,

  // ... 40+ more ...
};

/**
 * Dispatch function: called by scene controller for every entity in a frame.
 * Applies skeleton defaults, then calls the registered render function.
 */
export function renderEntity(entity, parentEl) {
  const full = applyDefaults(entity);
  const fn   = registry[full.type];

  if (!fn) {
    console.warn(`[registry] Unknown entity type: "${full.type}" (id: ${full.id})`);
    renderFallback(full, parentEl);
    return null;
  }

  return fn(full, parentEl);
}

/** Fallback: render unknown types as a labeled circle */
function renderFallback(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);
  const r = 36;

  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx',   '0');
  circle.setAttribute('cy',   '0');
  circle.setAttribute('r',    String(r));
  circle.setAttribute('fill',   `${entity.color ?? '#4A90D9'}20`);
  circle.setAttribute('stroke', entity.color ?? '#4A90D9');
  circle.setAttribute('stroke-width', '2');
  innerG.appendChild(circle);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('y', '5');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',      'rgba(240,234,214,0.9)');
    text.setAttribute('font-size', '12');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
}
```

### 9.2 Render Function Contract

Every render function MUST satisfy this contract:

| Requirement | Mandatory | Notes |
|---|---|---|
| Call `buildEntityGroup(entity)` | Yes | Guarantees double-`<g>` pattern |
| Append all shape geometry to `innerG` | Yes | Never to `outerG` |
| Call `applyEntranceAnimation(innerG, entity)` | Yes | Sets CSS class + delay |
| Call `parentEl.appendChild(outerG)` | Yes | Attaches to DOM |
| Return `outerG` | Yes | Enables later GSAP targeting by ID |
| Respond to `entity.size` (scaling multiplier) | Yes | `1.0` = default |
| Respond to `entity.color` | Yes | Fall back to `ENTITY_DEFAULTS.color` |
| Respond to `entity.label` | Yes (if type supports it) | Render below/inside entity |
| Respond to `entity.highlight` | Recommended | Apply glow filter or ring |
| Respond to `entity.metadata` | Type-specific | See §10 |

---

## 10. Skeleton API & applyDefaults

Inspired by Excalidraw's `ElementSkeleton` pattern. The agent can emit minimal entities; the renderer fills in all defaults. This reduces token count in agent outputs and makes the API forgiving.

### 10.1 Default Values

```js
/// player/defaults.js

/**
 * ENTITY_DEFAULTS: applied to every entity before rendering.
 * Agent emissions that omit any of these fields receive these values.
 */
export const ENTITY_DEFAULTS = {
  size:      1.0,
  color:     '#4A90D9',   // default blue; easily overridden per entity
  highlight: false,
  animation: {
    delay:    0,          // ms; set by assignEntranceDelays() before render
    duration: 450,        // ms; CSS animation-duration
    easing:   'cubic-bezier(0.22, 1, 0.36, 1)',  // snappy spring ease
    entrance: 'entrance-fadeInUp',
  },
};

/**
 * Merge entity with defaults. Entity fields take precedence.
 * Animation is merged shallowly (entity.animation overrides individual keys).
 *
 * @param {Partial<VisualEntity>} entity
 * @returns {VisualEntity}
 */
export function applyDefaults(entity) {
  return {
    ...ENTITY_DEFAULTS,
    ...entity,
    animation: {
      ...ENTITY_DEFAULTS.animation,
      ...(entity.animation ?? {}),
    },
  };
}
```

### 10.2 Minimal Agent Emission (Valid)

These are all valid entity specifications. The renderer accepts all of them:

```json
// Minimal: only required fields
{ "id": "s1", "type": "Server", "position": { "x": 50, "y": 50 } }

// With label
{ "id": "s1", "type": "Server", "position": { "x": 25, "y": 50 }, "label": "API" }

// With color
{ "id": "s1", "type": "Server", "position": { "x": 25, "y": 50 }, "color": "#E74C3C" }

// With animation override (only the delay — rest gets defaults)
{ "id": "s1", "type": "Server", "position": { "x": 25, "y": 50 },
  "animation": { "delay": 320 } }
```

After `applyDefaults()`, all three produce a complete entity with `size=1.0`, `color='#4A90D9'` (unless overridden), `animation.duration=450`, etc.

### 10.3 MetadataComponentProps

Type-specific parameterization uses the `metadata` field. This prevents schema explosion — the core `VisualEntity` interface stays small while rich types get their parameters via `metadata`.

```js
// Render function accessing metadata:
function renderGraph2D(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);
  const meta = entity.metadata ?? {};

  const data      = meta.data      ?? [];
  const chartType = meta.chartType ?? 'line';
  const xLabel    = meta.xLabel    ?? '';
  const yLabel    = meta.yLabel    ?? '';
  const xRange    = meta.xRange    ?? [0, 10];
  const yRange    = meta.yRange    ?? [0, 10];

  // ... render axes, data points, labels into innerG ...

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

| Entity Type | `metadata` Fields |
|---|---|
| `Graph2D` | `{ data: number[][], xLabel, yLabel, chartType: 'line'\|'bar'\|'scatter', xRange, yRange }` |
| `Equation` | `{ latex: string, fontSize: number, displayMode: boolean }` |
| `Matrix` | `{ rows: number[][], rowLabels: string[], colLabels: string[] }` |
| `Wave` | `{ frequency: number, amplitude: number, phase: number, waveType: 'sine'\|'square'\|'sawtooth' }` |
| `Circuit` | `{ components: CircuitComponent[], connections: CircuitConnection[] }` |
| `Table` | `{ headers: string[], rows: string[][], highlightRows: number[] }` |
| `CodeBlock` | `{ code: string, language: string, highlightLines: number[] }` |

---

## 11. Scene Controller

The scene controller is the central coordinator. It holds the current `VisualScript`, manages frame state, dispatches render calls, and handles SSE events.

### 11.1 Full Implementation

```js
/// player/scene-controller.js

import { renderEntity }          from './registry.js';
import { renderArrow }           from './components/arrow.js';
import { assignEntranceDelays }  from './defaults.js';
import { resolveEntityRef }      from './fuzzy-lookup.js';
import { renderChildren }        from './nesting.js';

const SVG_NS        = 'http://www.w3.org/2000/svg';
const entityLayer    = document.getElementById('entity-layer');
const connectionLayer = document.getElementById('connection-layer');

export const sceneController = {
  /** @type {VisualScript|null} */
  currentScript: null,
  currentFrameIdx: 0,
  renderedEntityIds: new Set(),

  /**
   * Load a new VisualScript. Clears the canvas and seeks to frame 0.
   * Called by the SSE 'script_update' handler.
   */
  loadScript(script) {
    this.currentScript = script;
    this.renderedEntityIds.clear();
    startFrameTimer();  // reset GSAP ticker timer
    this.seekToFrame(0);
  },

  /**
   * Jump to a specific frame by index.
   * Called by: loadScript (frame 0), GSAP ticker (auto-advance), SSE 'seek'.
   */
  seekToFrame(frameIndex) {
    const script = this.currentScript;
    if (!script) return;

    const frame = script.frames[frameIndex];
    if (!frame) return;

    this.currentFrameIdx = frameIndex;
    this._renderFrame(frame);
  },

  /**
   * Core render function. Clears both layers, renders all entities in frame,
   * then renders arrows (which require resolved positions).
   */
  _renderFrame(frame) {
    const entities   = frame.entities ?? [];
    const entityCount = entities.length;

    // Performance contract: warn if over budget
    if (entityCount > 150) {
      console.warn(`[scene-controller] Frame has ${entityCount} entities (>150 limit). Performance may degrade.`);
    }
    if (entityCount > 400) {
      console.error(`[scene-controller] Frame has ${entityCount} entities. Exceeds hard limit of 400. Refusing to render.`);
      return;
    }

    // Collect exiting entities for fade-out (entities in current frame not in new frame)
    const existingIds = new Set(this.renderedEntityIds);
    const incomingIds = new Set(entities.map(e => e.id));
    const exitingIds  = [...existingIds].filter(id => !incomingIds.has(id));

    // Play exit animation on departing entities BEFORE clearing
    this._playExitAnimations(exitingIds, () => {
      this._clearAndRender(frame, entities);
    });
  },

  /**
   * Animate exiting entities (scale down + fade), then invoke callback.
   */
  _playExitAnimations(exitingIds, onComplete) {
    if (exitingIds.length === 0) {
      onComplete();
      return;
    }

    const exitTargets = exitingIds
      .map(id => document.getElementById(id))
      .filter(Boolean);

    if (exitTargets.length === 0) {
      onComplete();
      return;
    }

    gsap.to(exitTargets, {
      scale:    0.85,
      opacity:  0,
      duration: 0.25,
      ease:     'power2.in',
      stagger:  0.02,
      onComplete,
    });
  },

  /**
   * Clear canvas layers and render the new frame's entities.
   */
  _clearAndRender(frame, entities) {
    entityLayer.innerHTML     = '';
    connectionLayer.innerHTML = '';
    this.renderedEntityIds.clear();

    // Separate arrows from non-arrow entities
    // Arrows must render AFTER all other entities to resolve positions
    const arrows    = entities.filter(e => e.type === 'Arrow' || e.type === 'DataFlow');
    const nonArrows = entities.filter(e => e.type !== 'Arrow' && e.type !== 'DataFlow');

    // Assign CSS animation-delay stagger (80ms between entities)
    assignEntranceDelays(nonArrows);

    // Render non-arrow entities first (populates positions for arrow resolution)
    for (const entity of nonArrows) {
      // Skip child entities at top level — they're rendered by their parent
      if (entity.parentEntityId) continue;

      const el = renderEntity(entity, entityLayer);
      if (el) this.renderedEntityIds.add(entity.id);
    }

    // Render arrows last (after all entity positions are resolved)
    for (const arrow of arrows) {
      renderArrow(arrow, entities, connectionLayer);
    }

    // Frame entrance: GSAP canvas-level transition
    this._animateFrameEntrance(frame);

    // Update narrator overlay
    if (frame.narrationSegment) {
      updateNarrator(frame.narrationSegment.text ?? '');
    }
  },

  /**
   * GSAP canvas-level frame transition.
   * CSS animation-delay handles per-entity stagger — this handles the overall
   * frame enter (subtle opacity bump for cinema quality).
   */
  _animateFrameEntrance(frame) {
    const tl = gsap.timeline();

    // If this frame has EntityTransition specs, apply them
    if (frame.transitions && frame.transitions.length > 0) {
      for (const transition of frame.transitions) {
        const el = document.getElementById(transition.entityId);
        if (!el) continue;

        const to = {};
        if (transition.to.position) {
          to.x = (transition.to.position.x / 100) * 1920 - (transition.from.position?.x ?? 50) / 100 * 1920;
          to.y = (transition.to.position.y / 100) * 1080 - (transition.from.position?.y ?? 50) / 100 * 1080;
        }
        // Only animate GPU-safe properties
        if (transition.to.highlight !== undefined) {
          to.opacity = transition.to.highlight ? 1 : 0.4;
        }

        tl.to(el, {
          ...to,
          duration: (transition.duration ?? 400) / 1000,
          ease:     transition.easing ?? 'power2.inOut',
        }, 0);
      }
    } else {
      // Default: subtle canvas fade-in for cinematic feel
      tl.fromTo('#canvas',
        { opacity: 0.7 },
        { opacity: 1, duration: 0.3, ease: 'power2.out' }
      );
    }
  },

  /**
   * Live entity patch — update a single entity's properties without re-render.
   * Called by SSE 'entity_patch' handler.
   */
  patchEntity(entityId, patch) {
    const outerEl = document.getElementById(entityId);
    if (!outerEl) {
      console.warn(`[scene-controller] patchEntity: entity "${entityId}" not found in DOM`);
      return;
    }

    // Color patch: update fill on all colored child elements
    if (patch.color) {
      outerEl.querySelectorAll('[fill]:not([fill="none"])').forEach(node => {
        const currentFill = node.getAttribute('fill');
        if (currentFill && !currentFill.startsWith('rgba(0,0,0')) {
          node.setAttribute('fill', patch.color);
        }
      });
    }

    // Highlight toggle
    if (patch.highlight !== undefined) {
      if (patch.highlight) {
        outerEl.setAttribute('filter', 'url(#entity-glow)');
      } else {
        outerEl.removeAttribute('filter');
      }
    }

    // Position patch: GSAP animates the outer <g> transform attribute
    if (patch.position) {
      const cx = (patch.position.x / 100) * 1920;
      const cy = (patch.position.y / 100) * 1080;
      gsap.to(outerEl, {
        attr: { transform: `translate(${cx}, ${cy})` },
        duration: 0.5,
        ease:     'power2.inOut',
      });
    }

    // Label patch: update text content
    if (patch.label !== undefined) {
      const textEl = outerEl.querySelector('text');
      if (textEl) textEl.textContent = patch.label;
    }
  },

  /**
   * Clear the canvas — remove all entities. Called by SSE 'clear' handler.
   */
  clear() {
    // Animate out existing entities
    const allEntities = [...this.renderedEntityIds]
      .map(id => document.getElementById(id))
      .filter(Boolean);

    if (allEntities.length > 0) {
      gsap.to(allEntities, {
        scale:   0.9,
        opacity: 0,
        duration: 0.3,
        ease:    'power2.in',
        stagger: 0.01,
        onComplete: () => {
          entityLayer.innerHTML     = '';
          connectionLayer.innerHTML = '';
        },
      });
    } else {
      entityLayer.innerHTML     = '';
      connectionLayer.innerHTML = '';
    }

    this.currentScript    = null;
    this.currentFrameIdx  = 0;
    this.renderedEntityIds.clear();
    updateNarrator('');
  },
};
```

### 11.2 fetchScenes → buildTimeline → play Pattern

For non-SSE usage (e.g., batch pre-rendered presentations), the scene controller exposes a manual load flow:

```js
/// player/scene-controller.js — batch play pattern

/**
 * Full play sequence for pre-loaded scripts.
 * 1. Fetch VisualScript from API
 * 2. Build GSAP timeline for auto-advance
 * 3. Play from frame 0
 */
async function fetchAndPlay(sessionId) {
  // Step 1: Fetch
  const res    = await fetch(`/session/${sessionId}/script`);
  const script = await res.json();

  // Step 2: Validate (basic)
  if (!script.frames || script.frames.length === 0) {
    console.error('[player] Empty script — nothing to play');
    return;
  }

  // Step 3: Load and start
  sceneController.loadScript(script);
  // GSAP ticker handles auto-advance (see §13)
}
```

---

## 12. Entrance Animation System

Entrance animations are driven entirely by CSS `@keyframes` + `animation-delay`. They run on the GPU compositor thread — completely outside the JS main thread.

### 12.1 CSS Keyframes (Defined in player.css)

```css
/* player/player.css — entrance animation keyframes */

/* ── Base class for all animated SVG inner <g> elements ─────────── */
.animate-element {
  transform-box:    fill-box;       /* pivot from element's own bounding box */
  transform-origin: center center;  /* pivot from center */
  will-change:      transform, opacity; /* promote to GPU layer early */
}

/* ── Keyframe definitions ────────────────────────────────────────── */

/* Primary entrance: fade in + slight upward rise */
@keyframes fadeInUp {
  0% {
    opacity:   0;
    transform: translateY(24px) scale(0.96);
  }
  100% {
    opacity:   1;
    transform: translateY(0px) scale(1.00);
  }
}

/* Simple fade: for connections and overlay elements */
@keyframes fadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

/* Draw-in: for complex diagram components */
@keyframes drawIn {
  0%   { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1.0); }
}

/* Pop-in: for badges, metrics, emphasis elements */
@keyframes popIn {
  0%   { opacity: 0; transform: scale(0.5);  }
  70%  { opacity: 1; transform: scale(1.05); }
  100% { opacity: 1; transform: scale(1.0);  }
}

/* Slide from left: for timeline and flow elements */
@keyframes slideInLeft {
  0%   { opacity: 0; transform: translateX(-40px); }
  100% { opacity: 1; transform: translateX(0px);   }
}

/* ── CSS animation classes ───────────────────────────────────────── */

/* Default entrance — used for ~80% of entities */
.entrance-fadeInUp {
  animation: fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
  /* 'both' = apply from-state before animation starts (handles delay gap) */
}

.entrance-fadeIn {
  animation: fadeIn 0.3s ease both;
}

.entrance-drawIn {
  animation: drawIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.entrance-popIn {
  animation: popIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.entrance-slideInLeft {
  animation: slideInLeft 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ── Exit animation (applied by scene controller on frame transition) */
.entity-exit-scale {
  animation: entityExitScale 0.25s ease-in both;
}

@keyframes entityExitScale {
  0%   { opacity: 1; transform: scale(1.0);  }
  100% { opacity: 0; transform: scale(0.85); }
}
```

### 12.2 Applying Entrance Animations in JS

```js
/// player/animations.js

/**
 * Apply entrance animation class and delay to an entity's inner <g>.
 * Must be called after all geometry is appended to innerG, before
 * appending outerG to parentEl.
 *
 * @param {SVGGElement} innerG
 * @param {VisualEntity} entity  - fully-defaulted entity
 */
export function applyEntranceAnimation(innerG, entity) {
  const animClass = entity.animation?.entrance ?? 'entrance-fadeInUp';
  innerG.classList.add(animClass);

  if (entity.animation?.delay) {
    innerG.style.animationDelay = `${entity.animation.delay}ms`;
  }

  if (entity.animation?.duration) {
    innerG.style.animationDuration = `${entity.animation.duration}ms`;
  }
}
```

### 12.3 Stagger Calculation

```js
/// player/defaults.js — stagger assignment

const BASE_DELAY  = 0;    // First entity enters immediately
const STAGGER_MS  = 80;   // 80ms between each subsequent entity

/**
 * Assign CSS animation-delay values to entities sequentially.
 * Arrows are excluded — they appear simultaneously with their source entity.
 *
 * Called ONCE per frame render, before dispatching to the registry.
 *
 * @param {VisualEntity[]} entities  - non-arrow entities only
 */
export function assignEntranceDelays(entities) {
  let delay = BASE_DELAY;

  for (const entity of entities) {
    // Skip: already has an explicit delay from agent
    if (entity.animation?.delay !== undefined) {
      delay = Math.max(delay, entity.animation.delay + STAGGER_MS);
      continue;
    }

    entity.animation          = entity.animation ?? {};
    entity.animation.delay    = delay;
    delay += STAGGER_MS;
  }
}
```

**Effect:** A frame with 10 entities produces delays of 0ms, 80ms, 160ms, 240ms, 320ms, 400ms, 480ms, 560ms, 640ms, 720ms. The last entity's entrance animation completes at ~720ms + 450ms = ~1170ms (satisfying `ENTITY_MIN_VISIBLE_MS = 1200ms`).

### 12.4 Why CSS, Not GSAP Stagger

```
GSAP stagger approach (WRONG for per-entity entrances):
  gsap.fromTo('.animate-element',
    { opacity: 0, y: 24 },
    { opacity: 1, y: 0, stagger: 0.08 }
  );
  → Runs on main thread
  → If scene controller is busy rendering 60 entities to DOM,
    the stagger loop ALSO runs on main thread
  → Frame drops visible as "stuttered" entrances

CSS animation-delay approach (CORRECT):
  Each innerG gets:  animation-delay: 160ms  (set once, synchronous)
  → Runs on GPU compositor thread
  → Completely independent of JS main thread
  → Even if JS is blocked for 200ms, animations play smoothly
```

---

## 13. GSAP Integration & rAF Ticker

GSAP 3.13 is loaded from CDN and available as a global `gsap` object.

### 13.1 GSAP Initialization

```js
/// player/player.js — GSAP setup

// GSAP 3.13: all plugins are free, no license key needed
// Register DrawSVGPlugin for graph line draw-on effects
gsap.registerPlugin(DrawSVGPlugin);

// Global GSAP defaults
gsap.defaults({
  ease:     'power2.out',
  duration: 0.4,
});

// Prevent GSAP from lagSmoothing (can cause first-frame stutter)
gsap.ticker.lagSmoothing(0);
```

### 13.2 Frame Auto-Advance via GSAP Ticker

All time-based logic — specifically, automatically advancing to the next frame when the current frame's `endTime` expires — MUST use `gsap.ticker.add()`. Never use `setInterval`, `setTimeout`, or raw `requestAnimationFrame` for this purpose.

```js
/// player/scene-controller.js — GSAP ticker integration

/**
 * frameStartTime: absolute GSAP time (seconds) at which the current frame began.
 * Set to null when no script is active.
 */
let frameStartTime = null;

/**
 * Start the frame timer. Called when a new frame is rendered.
 * Sets frameStartTime to the current GSAP ticker time.
 */
export function startFrameTimer() {
  frameStartTime = gsap.ticker.time;
}

/**
 * GSAP ticker callback — called every animation frame (synchronized with rAF).
 *
 * @param {number} time       GSAP time in seconds (monotonic, not wall clock)
 * @param {number} deltaTime  ms since last tick
 * @param {number} frame      absolute frame counter
 */
gsap.ticker.add((time, deltaTime, frame) => {
  if (frameStartTime === null) return;

  const script       = sceneController.currentScript;
  if (!script) return;

  const currentFrame = script.frames[sceneController.currentFrameIdx];
  if (!currentFrame) return;

  // Elapsed time within the current frame (milliseconds)
  const elapsed = (time - frameStartTime) * 1000;

  // Frame duration floor: never auto-advance in less than 2500ms
  const FRAME_DURATION_MIN_MS = 2500;
  const frameDuration = Math.max(
    FRAME_DURATION_MIN_MS,
    currentFrame.endTime - currentFrame.startTime
  );

  if (elapsed >= frameDuration) {
    const nextIdx = sceneController.currentFrameIdx + 1;

    if (nextIdx < script.frames.length) {
      // Advance to next frame
      sceneController.seekToFrame(nextIdx);
      frameStartTime = time;
    } else {
      // End of script: stop the timer
      frameStartTime = null;
      // Emit 'script-complete' for host postMessage
      window.parent?.postMessage(
        { type: 'player:script-complete', payload: { sceneId: script.sceneId } },
        'https://pre.app'
      );
    }
  }
});
```

### 13.3 GSAP for Canvas-Level Transitions Only

GSAP is used for **canvas-level** operations. It is NOT used for per-entity entrance stagger (that's CSS). Specific GSAP use cases:

| Use Case | GSAP API | Notes |
|---|---|---|
| Canvas fade on frame enter | `gsap.fromTo('#canvas', ...)` | Subtle opacity bump (0.7 → 1.0) |
| Entity exit (scale + fade) | `gsap.to([...els], { scale, opacity })` | Batched via array; one tween |
| Position patch (live update) | `gsap.to(outerEl, { attr: { transform } })` | Animates SVG transform attr |
| DrawSVG graph reveal | `gsap.to('#graph-path', { drawSVG: '100%' })` | Circuit traces, graph lines |
| Complex choreography | `gsap.timeline()` | Multi-step coordinated sequences |
| Frame timer | `gsap.ticker.add()` | Never `setInterval` |

### 13.4 DrawSVGPlugin Usage

For graph lines, circuit traces, and any path draw-on effect:

```js
/// player/components/graph2d.js — DrawSVG example

export function renderGraph2D(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);
  const meta = entity.metadata ?? {};

  // ... render axes and labels into innerG ...

  // Create the graph line path
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('id',           `${entity.id}-graph-line`);
  path.setAttribute('d',            buildPathFromData(meta.data ?? [], entity.size));
  path.setAttribute('stroke',       entity.color ?? '#4A90D9');
  path.setAttribute('stroke-width', '2.5');
  path.setAttribute('fill',         'none');
  innerG.appendChild(path);

  // Set up DrawSVG: path starts invisible (0%)
  gsap.set(path, { drawSVG: '0%' });

  // Register draw-on to fire after entrance delay
  const animDelay = (entity.animation?.delay ?? 0) + 200; // after fade-in completes
  gsap.to(path, {
    drawSVG:  '100%',
    duration: 1.2,
    ease:     'power2.inOut',
    delay:    animDelay / 1000,
  });

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

**Requirement:** `DrawSVGPlugin` must be registered before use: `gsap.registerPlugin(DrawSVGPlugin)`.

### 13.5 GPU-Accelerated Properties Only

**ONLY animate these properties** — they stay on the compositor path (no layout reflow, no paint):

| Property | GSAP Syntax | CSS Syntax |
|---|---|---|
| `opacity` | `gsap.to(el, { opacity: 0 })` | `opacity: 0` |
| translate X | `gsap.to(el, { x: 20 })` | `transform: translateX(20px)` |
| translate Y | `gsap.to(el, { y: -10 })` | `transform: translateY(-10px)` |
| scale | `gsap.to(el, { scale: 0.9 })` | `transform: scale(0.9)` |
| rotation | `gsap.to(el, { rotation: 45 })` | `transform: rotate(45deg)` |
| SVG transform attr | `gsap.to(el, { attr: { transform: … } })` | N/A (attribute, not CSS) |

**NEVER animate these** — they force layout recalculation or paint passes:

| Property | Why Forbidden |
|---|---|
| `x` attribute (SVG) | Triggers geometry recalculation |
| `y` attribute (SVG) | Triggers geometry recalculation |
| `width`, `height` attributes | Triggers layout reflow |
| `fill` directly | Forces paint pass |
| `stroke` directly | Forces paint pass |
| `cx`, `cy` (circle center) | Triggers geometry recalculation |

**To animate color:** Cross-fade between two overlapping elements — one with the old color, one with the new — using `opacity` on each. Or use CSS custom properties if the full pipeline supports them.

---

## 14. Frame Transitions

Frame transitions are GSAP-driven canvas-level animations that play when the `sceneController` advances from one `IllustrationFrame` to the next.

### 14.1 Default Transition (No `transitions` Spec)

When a frame has no `transitions` array (or it's empty), the scene controller applies the default cinematic transition: a subtle canvas opacity punch.

```js
/// Default frame entrance in scene-controller.js
_animateFrameEntrance(frame) {
  if (!frame.transitions || frame.transitions.length === 0) {
    gsap.fromTo('#canvas',
      { opacity: 0.65 },
      { opacity: 1.0, duration: 0.35, ease: 'power2.out' }
    );
    return;
  }
  // ... handle explicit transitions below
}
```

### 14.2 EntityTransition Spec

When the agent specifies entity-level transitions, the scene controller builds a GSAP timeline:

```js
/// EntityTransition handling in scene-controller.js

_applyEntityTransitions(transitions) {
  const tl = gsap.timeline();

  for (const t of transitions) {
    const el = document.getElementById(t.entityId);
    if (!el) continue;

    // Only animate GPU-safe properties
    const toProps = {};

    if (t.to.position) {
      const cx = (t.to.position.x / 100) * 1920;
      const cy = (t.to.position.y / 100) * 1080;
      // Position change: animate the SVG transform attribute
      toProps.attr = { transform: `translate(${cx}, ${cy})` };
    }

    if ('highlight' in (t.to ?? {})) {
      // Highlight: fade opacity of inner <g>
      const innerG = el.querySelector('.animate-element');
      if (innerG) {
        tl.to(innerG, {
          opacity:  t.to.highlight ? 1.0 : 0.35,
          duration: (t.duration ?? 400) / 1000,
          ease:     t.easing ?? 'power2.inOut',
        }, 0);
      }
    }

    if (Object.keys(toProps).length > 0) {
      tl.to(el, {
        ...toProps,
        duration: (t.duration ?? 400) / 1000,
        ease:     t.easing ?? 'power2.inOut',
      }, 0);
    }
  }

  return tl;
}
```

### 14.3 Frame Transition Flow

```
Frame N rendering complete
        │
        │  GSAP ticker detects elapsed >= frameDuration
        ▼
sceneController.seekToFrame(N+1)
        │
        ├─ [1] Collect exitingIds (in frame N but not frame N+1)
        │
        ├─ [2] _playExitAnimations(exitingIds)
        │       gsap.to([...exitEls], { scale: 0.85, opacity: 0, duration: 0.25 })
        │
        ├─ [3] onComplete callback:
        │       entityLayer.innerHTML = ''
        │       connectionLayer.innerHTML = ''
        │
        ├─ [4] assignEntranceDelays(nonArrows)   ← 80ms stagger
        │
        ├─ [5] registry[type](entity, entityLayer)  × N entities
        │       (CSS animation-delay set on each innerG)
        │
        ├─ [6] renderArrow(arrow, entities, connectionLayer)  × M arrows
        │
        ├─ [7] _animateFrameEntrance(frame)
        │       gsap.fromTo('#canvas', { opacity: 0.65 }, { opacity: 1 })
        │
        └─ [8] updateNarrator(frame.narrationSegment?.text)
```

---

## 15. Exiting Entities

When transitioning between frames, entities present in frame N but absent from frame N+1 are "exiting entities." They are animated out before the canvas is cleared.

### 15.1 Exit Animation CSS

```css
/* player/player.css — exit animation */

@keyframes entityExit {
  0%   { opacity: 1.0; transform: scale(1.00); }
  100% { opacity: 0.0; transform: scale(0.85); }
}

.entity-exit {
  animation: entityExit 0.25s ease-in both;
  pointer-events: none;  /* prevent interaction during exit */
}
```

### 15.2 Exit via GSAP (Preferred for Coordinated Timing)

The scene controller uses GSAP rather than the CSS class for exits, so it can wait for the animation to complete (via `onComplete`) before clearing the layer:

```js
/// player/scene-controller.js — exit sequence

_playExitAnimations(exitingIds, onComplete) {
  if (exitingIds.length === 0) {
    onComplete();
    return;
  }

  const exitTargets = exitingIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  gsap.to(exitTargets, {
    scale:    0.85,
    opacity:  0,
    duration: 0.25,
    ease:     'power2.in',
    stagger:  0.02,       // slight stagger for cinematic feel
    onComplete,
  });
}
```

**Note:** `scale` here operates on the inner `<g>` (the `animate-element`). GSAP targets the CSS `transform` property via its built-in CSS plugin — no need to use SVG transform attribute for exit animations.

---

## 16. Connection Rendering (Arrows & DataFlow)

Arrows present a special case: they connect two entities by position, but those positions are only known after all non-arrow entities are placed in the DOM. The renderer handles this via a deferred render pass.

### 16.1 Arrow Render Function

```js
/// player/components/arrow.js

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Render an Arrow or DataFlow connection between two entities.
 * Called AFTER all other entities are placed (ensures positions are resolvable).
 *
 * @param {VisualEntity}   entity     - the arrow entity
 * @param {VisualEntity[]} allEntities - all entities in the current frame
 * @param {SVGElement}     parentEl   - the connection layer (<g id="connection-layer">)
 * @returns {SVGElement|null}
 */
export function renderArrow(entity, allEntities, parentEl) {
  const source = resolveEntityRef(entity.sourceEntityId, allEntities);
  const target = resolveEntityRef(entity.targetEntityId, allEntities);

  if (!source || !target) {
    console.warn(
      `[renderArrow] Could not resolve endpoints for arrow "${entity.id}".` +
      ` sourceEntityId="${entity.sourceEntityId}", targetEntityId="${entity.targetEntityId}"`
    );
    return null;
  }

  const x1 = (source.position.x / 100) * 1920;
  const y1 = (source.position.y / 100) * 1080;
  const x2 = (target.position.x / 100) * 1920;
  const y2 = (target.position.y / 100) * 1080;

  const dx   = x2 - x1;
  const dy   = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return null;

  const color = entity.color ?? 'rgba(255,255,255,0.6)';
  const strokeWidth = entity.size ? String(1.5 * entity.size) : '1.5';

  let lineEl;

  if (entity.type === 'DataFlow') {
    // DataFlow: animated dashed line
    lineEl = document.createElementNS(SVG_NS, 'line');
    lineEl.setAttribute('x1',             String(x1));
    lineEl.setAttribute('y1',             String(y1));
    lineEl.setAttribute('x2',             String(x2));
    lineEl.setAttribute('y2',             String(y2));
    lineEl.setAttribute('stroke',         color);
    lineEl.setAttribute('stroke-width',   strokeWidth);
    lineEl.setAttribute('stroke-dasharray', '8,4');
    lineEl.setAttribute('marker-end',     'url(#arrowhead)');
    lineEl.setAttribute('opacity',        '0.7');
    lineEl.classList.add('entrance-fadeIn');
    if (entity.animation?.delay) {
      lineEl.style.animationDelay = `${entity.animation.delay}ms`;
    }
  } else {
    // Arrow: solid line
    lineEl = document.createElementNS(SVG_NS, 'line');
    lineEl.setAttribute('x1',           String(x1));
    lineEl.setAttribute('y1',           String(y1));
    lineEl.setAttribute('x2',           String(x2));
    lineEl.setAttribute('y2',           String(y2));
    lineEl.setAttribute('stroke',       color);
    lineEl.setAttribute('stroke-width', strokeWidth);
    lineEl.setAttribute('marker-end',   'url(#arrowhead)');
    lineEl.classList.add('entrance-fadeIn');
    if (entity.animation?.delay) {
      lineEl.style.animationDelay = `${entity.animation.delay}ms`;
    }
  }

  // Optional mid-line label
  if (entity.label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2 - 10;
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x',           String(midX));
    labelEl.setAttribute('y',           String(midY));
    labelEl.setAttribute('text-anchor', 'middle');
    labelEl.setAttribute('fill',        'rgba(240,234,214,0.75)');
    labelEl.setAttribute('font-size',   '12');
    labelEl.setAttribute('font-family', 'DM Sans, system-ui, sans-serif');
    labelEl.textContent = entity.label;

    const group = document.createElementNS(SVG_NS, 'g');
    group.setAttribute('id', entity.id);
    group.appendChild(lineEl);
    group.appendChild(labelEl);
    parentEl.appendChild(group);
    return group;
  }

  lineEl.setAttribute('id', entity.id);
  parentEl.appendChild(lineEl);
  return lineEl;
}
```

### 16.2 Why Arrows Have No Double-`<g>`

Arrows are a special case. Their "position" is not a center point — it is defined by `x1/y1/x2/y2` attributes on the `<line>` element. There is no translate needed. Arrows do not receive the double-`<g>` treatment because there is no position transform to separate from animation.

Arrows use a single `<g>` (for grouping with their label) with a simple CSS fade-in entrance.

---

## 17. Fuzzy Label Lookup

When the agent emits connection arrows, it references source/target entities by their ID or label. The renderer must handle both, with fuzzy matching as fallback. This is ported from `FrameRenderer.tsx` (the existing React renderer).

### 17.1 resolveEntityRef

```js
/// player/fuzzy-lookup.js

/**
 * Resolve an entity reference (ID or label, possibly fuzzy) from a flat entity array.
 *
 * Three-tier lookup:
 *   1. Exact ID match          — O(n) scan, first check
 *   2. Exact label match       — case-insensitive
 *   3. Fuzzy: label contains ref or ref contains label
 *
 * Ported from FrameRenderer.tsx fuzzyLookup() with ID-first priority.
 *
 * @param {string}          ref         - the ID or label string to resolve
 * @param {VisualEntity[]}  allEntities - flat entity array from current frame
 * @returns {VisualEntity|null}
 */
export function resolveEntityRef(ref, allEntities) {
  if (!ref || !allEntities || allEntities.length === 0) return null;

  // Tier 1: Exact ID match
  let entity = allEntities.find(e => e.id === ref);
  if (entity) return entity;

  // Tier 2: Exact label match (case-insensitive)
  const refLower = ref.toLowerCase();
  entity = allEntities.find(e => e.label?.toLowerCase() === refLower);
  if (entity) return entity;

  // Tier 3: Fuzzy substring match
  // ref includes label, OR label includes ref
  entity = allEntities.find(e => {
    const lbl = e.label?.toLowerCase();
    if (!lbl) return false;
    return lbl.includes(refLower) || refLower.includes(lbl);
  });

  return entity ?? null;
}
```

### 17.2 Why Fuzzy Lookup?

LLMs are imprecise. An agent may emit:

```json
{ "sourceEntityId": "api-server", "targetEntityId": "Postgres" }
```

...when the actual entity IDs are `"server-1"` and `"db-1"` with labels `"API Server"` and `"Postgres DB"`. Without fuzzy lookup, both arrows would silently fail (no error thrown, arrow simply not rendered). Fuzzy lookup means:

- `"api-server"` → matches label `"API Server"` (substring: `"server"` in `"api server"`)
- `"Postgres"` → matches label `"Postgres DB"` (substring: `"postgres"` in `"postgres db"`)

Both arrows render correctly despite the imprecise agent emission.

---

## 18. Hierarchical Nesting

Entities with `parentEntityId` are rendered as children relative to their parent's bounding box, not the canvas origin. This enables group structures like a cloud containing servers, or a cluster containing pods.

### 18.1 Building the Children Map

```js
/// player/nesting.js

/**
 * Build a parent→children mapping from a flat entity array.
 * Uses entity ID as the map key (not label — IDs are stable).
 *
 * @param {VisualEntity[]} entities
 * @returns {Map<string, VisualEntity[]>}
 */
export function buildChildrenMap(entities) {
  const map = new Map();
  for (const entity of entities) {
    if (entity.parentEntityId) {
      const list = map.get(entity.parentEntityId) ?? [];
      list.push(entity);
      map.set(entity.parentEntityId, list);
    }
  }
  return map;
}
```

### 18.2 Rendering Children Relative to Parent Bounds

```js
/// player/nesting.js

/**
 * Render child entities inside a parent entity's coordinate space.
 *
 * Child positions (0–100%) are interpreted as percentages of the
 * parent's bounding box, not the full canvas. A child at {x:50, y:50}
 * renders at the center of its parent.
 *
 * @param {VisualEntity[]} children
 * @param {number}         parentCx      parent center X (canvas pixels)
 * @param {number}         parentCy      parent center Y (canvas pixels)
 * @param {number}         parentW       parent bounding width (pixels)
 * @param {number}         parentH       parent bounding height (pixels)
 * @param {SVGElement}     parentLayer   the entity layer to append into
 * @param {Map}            childrenMap   nested children (grandchildren)
 */
export function renderChildren(
  children, parentCx, parentCy, parentW, parentH, parentLayer, childrenMap
) {
  for (const child of children) {
    // Convert child's percentage position to canvas pixels,
    // relative to parent center (0% = parent left edge, 50% = parent center, 100% = right)
    const childCx = parentCx + ((child.position.x - 50) / 100) * parentW * 0.85;
    const childCy = parentCy + ((child.position.y - 50) / 100) * parentH * 0.85;

    // Temporarily override the child's position to absolute canvas coords
    const originalPosition = child.position;
    child.position = {
      x: (childCx / 1920) * 100,
      y: (childCy / 1080) * 100,
    };

    // Scale the child down to fit inside the parent
    const parentDiag   = Math.sqrt(parentW * parentW + parentH * parentH);
    const scaleMultiplier = Math.min(1.0, parentDiag / 400);
    const originalSize = child.size;
    child.size = (child.size ?? 1.0) * Math.max(0.4, scaleMultiplier);

    // Render child using registry
    const childEl = renderEntity(child, parentLayer);

    // Render grandchildren if any
    const grandChildren = childrenMap.get(child.id);
    if (grandChildren && grandChildren.length > 0) {
      renderChildren(
        grandChildren,
        childCx, childCy,
        child.size * 80, child.size * 60,  // approximate parent bounds
        parentLayer,
        childrenMap
      );
    }

    // Restore original values (non-destructive rendering)
    child.position = originalPosition;
    child.size     = originalSize;
  }
}
```

### 18.3 Nesting Flow in Scene Controller

```js
/// player/scene-controller.js — nesting integration

_clearAndRender(frame, entities) {
  // ... (layer clearing) ...

  // Build parent → children map once per frame
  const childrenMap = buildChildrenMap(entities);

  for (const entity of nonArrows) {
    if (entity.parentEntityId) continue;  // skip — rendered by parent

    const el = renderEntity(entity, entityLayer);
    if (!el) continue;

    this.renderedEntityIds.add(entity.id);

    // Render children relative to this entity's position
    const children = childrenMap.get(entity.id);
    if (children && children.length > 0) {
      const cx = (entity.position.x / 100) * 1920;
      const cy = (entity.position.y / 100) * 1080;
      const w  = (entity.size ?? 1.0) * 120;  // approximate width
      const h  = (entity.size ?? 1.0) * 80;   // approximate height
      renderChildren(children, cx, cy, w, h, entityLayer, childrenMap);
    }
  }

  // ... (arrow rendering) ...
}
```

---

## 19. SSE Connection & Event Handling

SSE (Server-Sent Events) replaces HTTP polling. The browser's built-in `EventSource` API handles connection management, reconnection, and `Last-Event-ID` resumption automatically.

### 19.1 SSE Connection Setup

```js
/// player/player.js

// Resolve session ID from:
// 1. data-session-id attribute on <body>
// 2. URL search parameter ?session=...
// 3. URL path segment /player/SESSION_ID
const SESSION_ID =
  document.body.dataset.sessionId ??
  new URLSearchParams(location.search).get('session') ??
  location.pathname.split('/').pop();

if (!SESSION_ID) {
  console.error('[player] No session ID found. Cannot connect to SSE.');
}

// Connect to SSE endpoint
const evtSource = new EventSource(`/session/${SESSION_ID}/events`);

// ── Event: full VisualScript delivered ───────────────────────────
evtSource.addEventListener('script_update', (e) => {
  const { script } = JSON.parse(e.data);
  sceneController.loadScript(script);
});

// ── Event: seek to specific frame ────────────────────────────────
evtSource.addEventListener('seek', (e) => {
  const { frameIndex } = JSON.parse(e.data);
  sceneController.seekToFrame(frameIndex);
});

// ── Event: live patch to a single entity ─────────────────────────
evtSource.addEventListener('entity_patch', (e) => {
  const { entityId, patch } = JSON.parse(e.data);
  sceneController.patchEntity(entityId, patch);
});

// ── Event: clear the canvas ──────────────────────────────────────
evtSource.addEventListener('clear', () => {
  sceneController.clear();
});

// ── Connection management ─────────────────────────────────────────
evtSource.addEventListener('open', () => {
  console.info('[SSE] Connected to session:', SESSION_ID);
});

evtSource.addEventListener('error', (err) => {
  // EventSource auto-reconnects after a back-off period.
  // This handler is informational only — no manual retry needed.
  console.warn('[SSE] Connection error — EventSource will auto-reconnect:', err);
  updateConnectionStatus('reconnecting');
});
```

### 19.2 Server-Side SSE Endpoint (Fastify)

For reference: the server side that the player connects to (defined in `@pre/server`).

```js
/// server/index.js

import fastifySSE from '@fastify/sse';
app.register(fastifySSE);

// In-memory SSE subscriber registry: sessionId → Set of reply objects
const sseSubscribers = new Map();

app.get('/session/:id/events', (request, reply) => {
  const { id } = request.params;

  // Send initial connected event
  reply.sse({ event: 'connected', data: JSON.stringify({ sessionId: id }) });

  // Register this subscriber
  if (!sseSubscribers.has(id)) sseSubscribers.set(id, new Set());
  sseSubscribers.get(id).add(reply);

  // Clean up on disconnect
  request.raw.on('close', () => {
    sseSubscribers.get(id)?.delete(reply);
  });
});

/**
 * Emit an event to all subscribers of a session.
 * Called by MCP tool handlers when the agent pushes a VisualScript.
 */
function sseEmit(sessionId, event) {
  const subscribers = sseSubscribers.get(sessionId);
  if (!subscribers || subscribers.size === 0) return;
  const data = JSON.stringify(event);
  for (const reply of subscribers) {
    reply.raw.write(`data: ${data}\n\n`);
  }
}
```

### 19.3 SSE Event Types

| Event Name | Payload | Player Action |
|---|---|---|
| `script_update` | `{ script: VisualScript }` | `sceneController.loadScript(script)` |
| `seek` | `{ frameIndex: number }` | `sceneController.seekToFrame(frameIndex)` |
| `entity_patch` | `{ entityId: string, patch: VisualEntityPatch }` | `sceneController.patchEntity(entityId, patch)` |
| `clear` | `{}` | `sceneController.clear()` |
| `connected` | `{ sessionId: string }` | Log; update connection status indicator |

### 19.4 EventSource Auto-Reconnect Behavior

The browser `EventSource` API automatically:
- Reconnects after network interruption (with exponential back-off)
- Sends `Last-Event-ID` header on reconnect if the server includes `id:` lines in SSE frames
- Stops reconnecting only if the server returns HTTP 204 or if `evtSource.close()` is called explicitly

This means the player requires **zero custom retry logic** for SSE.

---

## 20. iframe Embed & postMessage Bridge

The `<iframe>` is the primary integration method for embedding PRE in a host page. It requires zero JavaScript on the host side.

### 20.1 Basic iframe Embed (No Host JS)

```html
<!-- Host page — no JavaScript required -->
<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden;">
  <iframe
    src="https://pre.app/player/SESSION_ID"
    data-pre-player
    style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;"
    allow="autoplay"
    loading="eager"
  ></iframe>
</div>
```

The `padding-bottom: 56.25%` wrapper enforces 16:9 aspect ratio responsively. The iframe's SVG canvas scales via `preserveAspectRatio="xMidYMid meet"` — no JavaScript needed for responsive scaling.

### 20.2 Host → Player: postMessage Commands

For host pages that need to control playback (custom UI, keyboard shortcuts, presentation remotes):

```js
/// Host page JavaScript

const iframe = document.querySelector('[data-pre-player]');

// Seek to a specific frame
function seekToFrame(frameIndex) {
  iframe.contentWindow.postMessage(
    { type: 'seek', frameIndex },
    'https://pre.app'   // Always specify targetOrigin — never use '*'
  );
}

// Pause GSAP timeline (freezes all animations)
function pausePlayer() {
  iframe.contentWindow.postMessage(
    { type: 'pause' },
    'https://pre.app'
  );
}

// Resume GSAP timeline
function resumePlayer() {
  iframe.contentWindow.postMessage(
    { type: 'resume' },
    'https://pre.app'
  );
}
```

### 20.3 Player → Host: postMessage Events

The player emits events to its parent host page:

```js
/// Host page: listening for player events

window.addEventListener('message', (e) => {
  if (e.origin !== 'https://pre.app') return;

  switch (e.data.type) {
    case 'player:ready':
      console.log('Player ready, sessionId:', e.data.payload.sessionId);
      break;
    case 'player:script-complete':
      console.log('Script finished, sceneId:', e.data.payload.sceneId);
      break;
    case 'player:frame-change':
      console.log('Frame changed to index:', e.data.payload.frameIndex);
      break;
    case 'player:error':
      console.error('Player error:', e.data.payload.message);
      break;
  }
});
```

### 20.4 Player-Side postMessage Listener

```js
/// player/player.js — postMessage bridge

const ALLOWED_ORIGIN = 'https://pre.app';

window.addEventListener('message', (e) => {
  // Security: only accept messages from known origin
  if (e.origin !== ALLOWED_ORIGIN) return;

  const { type, ...payload } = e.data ?? {};

  switch (type) {
    case 'seek':
      if (typeof payload.frameIndex === 'number') {
        sceneController.seekToFrame(payload.frameIndex);
      }
      break;

    case 'pause':
      gsap.globalTimeline.pause();
      break;

    case 'resume':
      gsap.globalTimeline.resume();
      break;

    case 'load-script':
      // Host can push a VisualScript directly (bypasses SSE)
      if (payload.script) {
        sceneController.loadScript(payload.script);
      }
      break;

    default:
      console.warn('[postMessage] Unknown message type:', type);
  }
});

// Emit ready signal to parent after initialization
function emitPlayerReady() {
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: 'player:ready', payload: { sessionId: SESSION_ID } },
      ALLOWED_ORIGIN
    );
  }
}
```

### 20.5 Emitting Player Events

```js
/// player/player.js — outbound event helpers

function emit(type, payload = {}) {
  if (window.parent !== window) {
    window.parent.postMessage({ type, payload }, ALLOWED_ORIGIN);
  }
}

// Examples (called from scene-controller.js):
emit('player:frame-change', { frameIndex: sceneController.currentFrameIdx });
emit('player:script-complete', { sceneId: sceneController.currentScript?.sceneId });
emit('player:error', { message: 'SSE connection failed', code: 'SSE_ERROR' });
```

---

## 21. Narrator Text Overlay

The narrator overlay is an HTML `<div>` positioned over the SVG canvas. It displays the `narrationSegment.text` for the current frame, providing context for audio narration or subtitle-style text.

### 21.1 HTML Structure

```html
<!-- In player.html, ABOVE #canvas-wrapper for z-index stacking -->
<div id="narrator-overlay">
  <p id="narrator-text"></p>
</div>
```

### 21.2 CSS

```css
/* player/player.css */

#narrator-overlay {
  position: absolute;
  bottom:   5%;
  left:     50%;
  transform: translateX(-50%);
  width:    70%;
  max-width: 900px;
  pointer-events: none;   /* click-through to SVG */
  z-index: 10;
  text-align: center;
}

#narrator-text {
  display:          inline-block;
  padding:          10px 20px;
  background:       rgba(10, 12, 20, 0.75);  /* #0a0c14 at 75% opacity */
  backdrop-filter:  blur(8px);
  border:           1px solid rgba(240, 234, 214, 0.1);
  border-radius:    8px;
  color:            rgba(240, 234, 214, 0.9);
  font-family:      'DM Sans', system-ui, sans-serif;
  font-size:        16px;
  font-weight:      400;
  line-height:      1.6;
  letter-spacing:   0.01em;
  transition:       opacity 0.3s ease;
}

#narrator-text:empty {
  display: none;
}
```

### 21.3 Update Function

```js
/// player/narrator.js

const narratorTextEl = document.getElementById('narrator-text');

/**
 * Update narrator text overlay for the current frame.
 * Fades out old text, swaps content, fades in new text.
 *
 * @param {string} text - narration text for the current frame
 */
export function updateNarrator(text) {
  if (!narratorTextEl) return;

  if (!text) {
    // Fade out on empty
    gsap.to(narratorTextEl, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => { narratorTextEl.textContent = ''; },
    });
    return;
  }

  // Cross-fade: fade out → swap → fade in
  gsap.to(narratorTextEl, {
    opacity: 0,
    duration: 0.15,
    onComplete: () => {
      narratorTextEl.textContent = text;
      gsap.to(narratorTextEl, { opacity: 1, duration: 0.3 });
    },
  });
}
```

---

## 22. Dark Cinematic Theme

### 22.1 CSS Custom Properties

```css
/* player/player.css — cinematic theme */

:root {
  /* ── Background ────────────────────────────────── */
  --color-bg:          #0a0c14;   /* near-black, slightly cool — canvas background */
  --color-bg-elevated: #12141f;   /* cards, panels */
  --color-bg-overlay:  #1a1c28;   /* tooltips, narrator */
  --color-surface:     #20222e;   /* interactive surfaces */
  --color-border:      #2a2c3a;   /* subtle dividers */

  /* ── Accent ─────────────────────────────────────── */
  --color-gold:        #c9a84c;   /* primary accent — titles, key values */
  --color-gold-bright: #e8c96a;   /* hover, highlight state */
  --color-gold-dim:    #7a6430;   /* muted accent */

  /* ── Text ───────────────────────────────────────── */
  --color-text-primary:   #f0ead6;  /* off-white, warm — primary content */
  --color-text-secondary: #9e9882;  /* supporting text */
  --color-text-muted:     #5c5849;  /* placeholders, disabled */

  /* ── Data Colors ─────────────────────────────────── */
  --color-blue:   #4a90d9;  /* servers, data, links */
  --color-green:  #6ab187;  /* databases, success */
  --color-purple: #8b6bbf;  /* concepts, annotations */
  --color-orange: #e8903a;  /* queues, warnings */
  --color-red:    #c0655a;  /* errors, alerts */
  --color-teal:   #4ab8b8;  /* network, flow */

  /* ── Typography ─────────────────────────────────── */
  --font-serif:  'Literata', Georgia, serif;
  --font-sans:   'DM Sans', system-ui, sans-serif;
  --font-mono:   'JetBrains Mono', 'Fira Code', monospace;

  --font-size-xs:   0.75rem;   /* 12px */
  --font-size-sm:   0.875rem;  /* 14px */
  --font-size-base: 1rem;      /* 16px */
  --font-size-lg:   1.25rem;   /* 20px */
  --font-size-xl:   1.5rem;    /* 24px */
  --font-size-2xl:  2rem;      /* 32px */
  --font-size-3xl:  2.75rem;   /* 44px */
  --font-size-4xl:  3.5rem;    /* 56px */

  /* ── Canvas dimensions ──────────────────────────── */
  --canvas-w: 1920;
  --canvas-h: 1080;
  --canvas-aspect: 16 / 9;
}
```

### 22.2 Base Layout CSS

```css
/* player/player.css */

* {
  box-sizing: border-box;
  margin:  0;
  padding: 0;
}

html, body {
  width:      100%;
  height:     100%;
  background: var(--color-bg);
  overflow:   hidden;
}

body {
  display:         flex;
  align-items:     center;
  justify-content: center;
}

/* Canvas wrapper: fills available space, maintains 16:9 aspect ratio */
#canvas-wrapper {
  position:   relative;
  width:       100vw;
  max-height:  100vh;
  aspect-ratio: 16 / 9;
  overflow:    hidden;
}

/* SVG canvas: fills wrapper, preserveAspectRatio handles the rest */
#canvas {
  width:   100%;
  height:  100%;
  display: block;
}

/* ── Animated element base ──────────────────────────────────────── */
.animate-element {
  transform-box:    fill-box;
  transform-origin: center center;
  will-change:      transform, opacity;
}

/* ── Entity highlight state ──────────────────────────────────────── */
.entity-highlighted > .animate-element {
  filter: drop-shadow(0 0 12px rgba(201, 168, 76, 0.6));
}

.entity-dim > .animate-element {
  opacity: 0.3;
  transition: opacity 0.3s ease;
}
```

### 22.3 Entity Color Defaults by Type

Components use these defaults when no explicit `color` is provided:

| Entity Category | Default Color | CSS Variable |
|---|---|---|
| Server, Cloud | `#4A90D9` | `--color-blue` |
| Database | `#6AB187` | `--color-green` |
| Queue, Warning | `#E8903A` | `--color-orange` |
| Concept, Annotation | `#8B6BBF` | `--color-purple` |
| Network, DataFlow | `#4AB8B8` | `--color-teal` |
| Error, Alert | `#C0655A` | `--color-red` |
| Text, Label | `#F0EAD6` | `--color-text-primary` |

---

## 23. Performance Contracts

These are non-negotiable constraints. Any implementation that violates these contracts must be redesigned.

### 23.1 Contract Table

| Contract | Requirement | Enforcement |
|---|---|---|
| Animated element count | < 500 animated `<g>` elements per canvas | `console.warn` at 150, `console.error` and refuse at 400 |
| Entrance animations | MUST use CSS `@keyframes` + `animation-delay` | Code review; GSAP stagger in loop is forbidden |
| Double-`<g>` pattern | Every entity MUST use outer (SVG transform attr) + inner (CSS) | DevTools inspection; see §7.5 |
| GSAP rAF ticker | All time-based logic MUST use `gsap.ticker.add()` | Code review; `setInterval` and `setTimeout` forbidden for animation |
| GPU-only properties | Only `opacity` and `transform` (translate/scale/rotate) animated | ESLint custom rule; see §13.5 |
| Critical CSS | Every inner `<g>` MUST have `transform-box:fill-box; transform-origin:center center; will-change:transform,opacity` | Enforced in `buildEntityGroup()` |
| Frame duration floor | Minimum 2500ms per frame | `FRAME_DURATION_MIN_MS` constant in ticker |
| Entity visible floor | Minimum 1200ms per entity | Stagger math: `assignEntranceDelays` enforces |

### 23.2 Performance Budget

| Operation | Budget | Measurement |
|---|---|---|
| SSE event → first entity DOM node | < 50ms | `mark('sse:recv')` → `mark('dom:first-entity')` |
| Frame render (60 entities) | < 16ms (one rAF) | `mark('frame:render-start')` → `mark('frame:render-end')` |
| Arrow resolution (10 arrows, 60 entities) | < 2ms | fuzzy lookup: O(3n) worst case |
| `patchEntity` (position change) | < 5ms | GSAP `.to()` setup is synchronous |
| Canvas clear (innerHTML = '') | < 8ms | DOM layer clear |
| `applyDefaults` (60 entities) | < 1ms | Object spread is O(n) |
| GSAP ticker overhead per frame | < 1ms | `mark('ticker:start')` → `mark('ticker:end')` |

### 23.3 Performance Monitor (Dev Mode)

```js
/// player/dev/perf-monitor.js

const DEV_MODE = location.search.includes('dev=true');

export function measureFrameRender(renderFn) {
  if (!DEV_MODE) return renderFn();

  performance.mark('frame:render-start');
  renderFn();
  performance.mark('frame:render-end');
  performance.measure('frame:render', 'frame:render-start', 'frame:render-end');

  const entries = performance.getEntriesByName('frame:render');
  const last    = entries[entries.length - 1];

  if (last.duration > 16) {
    console.warn(
      `[PerfBudget] Frame render: ${last.duration.toFixed(1)}ms (>16ms budget)`,
      '— may cause dropped frame'
    );
  }
}
```

---

## 24. Complete player.js Bootstrap

This is the entry point that ties all modules together.

```js
/// player/player.js

// ── Step 1: GSAP initialization ───────────────────────────────────
gsap.registerPlugin(DrawSVGPlugin);

gsap.defaults({
  ease:     'power2.out',
  duration: 0.4,
});

gsap.ticker.lagSmoothing(0);  // Prevent GSAP from smoothing over long pauses

// ── Step 2: Resolve session ID ────────────────────────────────────
const SESSION_ID =
  document.body.dataset.sessionId ??
  new URLSearchParams(location.search).get('session') ??
  location.pathname.split('/').pop();

if (!SESSION_ID) {
  console.error('[player] Cannot initialize: no session ID found.');
}

// ── Step 3: Wait for fonts before rendering ───────────────────────
// Prevents FOUT (flash of unstyled text) on first render.
// document.fonts.ready resolves when all @font-face fonts are loaded.
document.fonts.ready.then(() => {
  // ── Step 4: Connect SSE ─────────────────────────────────────────
  const evtSource = new EventSource(`/session/${SESSION_ID}/events`);

  evtSource.addEventListener('script_update', (e) => {
    const { script } = JSON.parse(e.data);
    sceneController.loadScript(script);
  });

  evtSource.addEventListener('seek', (e) => {
    const { frameIndex } = JSON.parse(e.data);
    sceneController.seekToFrame(frameIndex);
  });

  evtSource.addEventListener('entity_patch', (e) => {
    const { entityId, patch } = JSON.parse(e.data);
    sceneController.patchEntity(entityId, patch);
  });

  evtSource.addEventListener('clear', () => {
    sceneController.clear();
  });

  evtSource.addEventListener('open', () => {
    updateConnectionStatus('connected');
  });

  evtSource.addEventListener('error', () => {
    updateConnectionStatus('reconnecting');
  });

  // ── Step 5: postMessage bridge ──────────────────────────────────
  window.addEventListener('message', (e) => {
    if (e.origin !== 'https://pre.app') return;
    const { type, ...payload } = e.data ?? {};

    switch (type) {
      case 'seek':
        sceneController.seekToFrame(payload.frameIndex);
        break;
      case 'pause':
        gsap.globalTimeline.pause();
        break;
      case 'resume':
        gsap.globalTimeline.resume();
        break;
      case 'load-script':
        if (payload.script) sceneController.loadScript(payload.script);
        break;
    }
  });

  // ── Step 6: Emit ready signal to host ───────────────────────────
  if (window.parent !== window) {
    window.parent.postMessage(
      { type: 'player:ready', payload: { sessionId: SESSION_ID } },
      'https://pre.app'
    );
  }

  console.info(`[player] Initialized. Session: ${SESSION_ID}`);
});

// ── Connection status indicator (dev mode only) ───────────────────
function updateConnectionStatus(status) {
  const indicator = document.getElementById('connection-status');
  if (indicator) {
    indicator.dataset.status = status;
  }
}
```

---

## 25. Full Worked Example

This example traces a 2-frame VisualScript through the complete rendering pipeline, showing exactly what the player does at each step.

### 25.1 Input VisualScript

```json
{
  "sceneId": "demo-architecture-001",
  "totalDuration": 9000,
  "frames": [
    {
      "startTime": 0,
      "endTime": 4500,
      "entities": [
        {
          "id": "server-1",
          "type": "Server",
          "position": { "x": 25, "y": 50 },
          "label": "API Server",
          "color": "#4A90D9"
        },
        {
          "id": "db-1",
          "type": "Database",
          "position": { "x": 75, "y": 50 },
          "label": "Postgres",
          "color": "#6AB187"
        },
        {
          "id": "arrow-1",
          "type": "Arrow",
          "position": { "x": 50, "y": 50 },
          "sourceEntityId": "server-1",
          "targetEntityId": "db-1",
          "label": "SQL query",
          "color": "rgba(255,255,255,0.5)"
        }
      ],
      "narrationSegment": {
        "text": "The API server sends SQL queries to the Postgres database."
      }
    },
    {
      "startTime": 4500,
      "endTime": 9000,
      "entities": [
        {
          "id": "server-1",
          "type": "Server",
          "position": { "x": 20, "y": 50 },
          "label": "API Server",
          "color": "#4A90D9"
        },
        {
          "id": "cache-1",
          "type": "Cache",
          "position": { "x": 50, "y": 30 },
          "label": "Redis",
          "color": "#E8903A"
        },
        {
          "id": "db-1",
          "type": "Database",
          "position": { "x": 80, "y": 50 },
          "label": "Postgres",
          "color": "#6AB187"
        },
        {
          "id": "arrow-cache",
          "type": "Arrow",
          "position": { "x": 35, "y": 40 },
          "sourceEntityId": "server-1",
          "targetEntityId": "cache-1",
          "label": "cache read"
        },
        {
          "id": "arrow-db",
          "type": "Arrow",
          "position": { "x": 65, "y": 40 },
          "sourceEntityId": "cache-1",
          "targetEntityId": "db-1",
          "label": "cache miss"
        }
      ],
      "narrationSegment": {
        "text": "Redis intercepts reads. Cache misses fall through to Postgres."
      }
    }
  ]
}
```

### 25.2 Rendering Trace

**Step 1: SSE delivers `script_update`**
```
EventSource receives event 'script_update'
  → JSON.parse(e.data) → { script: VisualScript }
  → sceneController.loadScript(script)
  → frameStartTime = gsap.ticker.time
  → seekToFrame(0)
```

**Step 2: Frame 0 rendering**
```
_renderFrame(frame[0])
  entities = [ server-1, db-1, arrow-1 ]
  exitingIds = []  (no previous entities)
  _clearAndRender called immediately

  assignEntranceDelays([ server-1, db-1 ])
    server-1.animation.delay = 0ms
    db-1.animation.delay     = 80ms
    (arrow-1 is excluded from stagger — arrows appear with source entity)

  renderEntity(server-1, entityLayer)
    → applyDefaults(server-1)        → { size:1.0, color:'#4A90D9', ... }
    → registry['Server'](entity)     → renderServer(entity, entityLayer)
    → buildEntityGroup(entity)
        outerG id="server-1" transform="translate(480, 540)"
          innerG class="animate-element entrance-fadeInUp"
                 style="animation-delay:0ms"
        SVG shape geometry in innerG
      parentEl.appendChild(outerG)
      return outerG

  renderEntity(db-1, entityLayer)
    → similar flow → transform="translate(1440, 540)"
    → innerG style="animation-delay:80ms"

  renderArrow(arrow-1, [server-1, db-1], connectionLayer)
    → resolveEntityRef("server-1") → entity server-1
    → resolveEntityRef("db-1")     → entity db-1
    → x1=480, y1=540, x2=1440, y2=540
    → <line x1="480" y1="540" x2="1440" y2="540" marker-end="url(#arrowhead)">
    → connectionLayer.appendChild(line)

  _animateFrameEntrance(frame[0])
    → gsap.fromTo('#canvas', { opacity:0.7 }, { opacity:1, duration:0.35 })

  updateNarrator("The API server sends SQL queries to the Postgres database.")
```

**Step 3: CSS animations play (compositor thread)**
```
t=0ms:    server-1 innerG fades in + rises (animation-delay:0ms)
t=80ms:   db-1 innerG fades in + rises     (animation-delay:80ms)
t=80ms:   arrow-1 fades in                 (no delay on arrows)
```

**Step 4: GSAP ticker detects frame completion**
```
t=4500ms: gsap.ticker fires
  elapsed = (gsap.ticker.time - frameStartTime) * 1000 = 4500ms
  frameDuration = max(2500, 4500-0) = 4500ms
  elapsed >= frameDuration → advance to frame 1

  seekToFrame(1) called
  exitingIds = [ "arrow-1" ]  (present in frame 0 but not frame 1)

  _playExitAnimations(["arrow-1"])
    gsap.to([arrowEl], { scale:0.85, opacity:0, duration:0.25 })
      → onComplete: _clearAndRender(frame[1], entities)
```

**Step 5: Frame 1 rendering**
```
  entityLayer.innerHTML = ''       (server-1, db-1 cleared)
  connectionLayer.innerHTML = ''   (arrow-1 cleared after exit animation)

  assignEntranceDelays([ server-1, cache-1, db-1 ])
    server-1.animation.delay = 0ms   (server-1 is "carried over" — already familiar)
    cache-1.animation.delay  = 80ms  (new entity)
    db-1.animation.delay     = 160ms (repositioned)

  renderEntity(server-1) → translate(384, 540)   (20% → 384px)
  renderEntity(cache-1)  → translate(960, 324)   (50%, 30% → 960, 324)
  renderEntity(db-1)     → translate(1536, 540)  (80% → 1536px)
  renderArrow(arrow-cache) → x1=384, y1=540 → x2=960, y2=324
  renderArrow(arrow-db)    → x1=960, y1=324 → x2=1536, y2=540

  updateNarrator("Redis intercepts reads. Cache misses fall through to Postgres.")
```

### 25.3 Final DOM Structure (Frame 1)

```html
<svg id="canvas" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet">
  <defs>...</defs>
  <rect id="bg" width="1920" height="1080" fill="#0a0c14"/>

  <g id="entity-layer">
    <!-- server-1 at 20% x, 50% y → (384, 540) -->
    <g id="server-1" data-type="Server" transform="translate(384, 540)">
      <g class="animate-element entrance-fadeInUp"
         style="transform-box:fill-box; transform-origin:center center;
                will-change:transform,opacity; animation-delay:0ms">
        <rect x="-40" y="-30" width="80" height="60" rx="6" fill="#4A90D9"/>
        <!-- ... rack lines, status dot ... -->
        <text y="48" text-anchor="middle" fill="rgba(240,234,214,0.9)">API Server</text>
      </g>
    </g>

    <!-- cache-1 at 50% x, 30% y → (960, 324) -->
    <g id="cache-1" data-type="Cache" transform="translate(960, 324)">
      <g class="animate-element entrance-fadeInUp"
         style="animation-delay:80ms">
        <!-- ... Redis shape ... -->
        <text y="48" text-anchor="middle">Redis</text>
      </g>
    </g>

    <!-- db-1 at 80% x, 50% y → (1536, 540) -->
    <g id="db-1" data-type="Database" transform="translate(1536, 540)">
      <g class="animate-element entrance-fadeInUp"
         style="animation-delay:160ms">
        <!-- ... Postgres shape ... -->
      </g>
    </g>
  </g>

  <g id="connection-layer">
    <line id="arrow-cache" x1="384" y1="540" x2="960" y2="324"
          stroke="rgba(255,255,255,0.6)" stroke-width="1.5"
          marker-end="url(#arrowhead)" class="entrance-fadeIn"/>
    <!-- label text at midpoint -->
    <line id="arrow-db" x1="960" y1="324" x2="1536" y2="540"
          stroke="rgba(255,255,255,0.6)" stroke-width="1.5"
          marker-end="url(#arrowhead)" class="entrance-fadeIn"/>
  </g>

  <g id="overlay-layer"></g>
</svg>
```

---

## 26. Error Handling & Resilience

### 26.1 SSE Errors

`EventSource` handles reconnection automatically. The player's SSE `error` handler is informational:

```js
evtSource.addEventListener('error', (err) => {
  console.warn('[SSE] Connection interrupted — EventSource will auto-reconnect:', err);
  updateConnectionStatus('reconnecting');
  // No manual retry needed — EventSource reconnects with exponential back-off
});
```

### 26.2 Unknown Entity Types

Handled by the registry's `renderFallback()` — an unknown type is rendered as a labeled circle:

```js
if (!fn) {
  console.warn(`[registry] Unknown entity type: "${entity.type}". Rendering fallback.`);
  renderFallback(entity, parentEl);
  return null;
}
```

### 26.3 Missing Arrow Endpoints

```js
if (!source || !target) {
  console.warn(
    `[renderArrow] Could not resolve endpoints for arrow "${entity.id}".` +
    ` source="${entity.sourceEntityId}", target="${entity.targetEntityId}"`
  );
  return null;  // Arrow silently skipped — does not crash frame render
}
```

### 26.4 NaN Position Guards

Adapted from `FrameRenderer.tsx`'s NaN defense:

```js
function pctToCanvas(pct) {
  const x = isNaN(pct.x) ? 50 : pct.x;
  const y = isNaN(pct.y) ? 50 : pct.y;
  return {
    cx: Math.max(0, Math.min(1920, (x / 100) * 1920)),
    cy: Math.max(0, Math.min(1080, (y / 100) * 1080)),
  };
}
```

This ensures a malformed position does not cause an entity to render outside the canvas or produce `translate(NaN, NaN)` which would make it invisible.

### 26.5 `patchEntity` for Non-Existent Entity

```js
patchEntity(entityId, patch) {
  const el = document.getElementById(entityId);
  if (!el) {
    console.warn(`[scene-controller] patchEntity: "${entityId}" not in DOM. Ignoring.`);
    return;  // Graceful no-op
  }
  // ... apply patch
}
```

---

## 27. Browser Compatibility

### 27.1 Target Browsers (V1)

| Browser | Minimum Version | Notes |
|---|---|---|
| Chrome / Edge | 110+ | Primary target |
| Firefox | 115+ | Full support |
| Safari | 16.4+ | `EventSource`, `document.fonts.ready`, `ResizeObserver` all available |
| Mobile Chrome | 110+ | Touch events pass through (no mobile-specific layout) |
| Mobile Safari | 16.4+ | Same constraints as desktop Safari |

IE 11 and legacy Edge are explicitly unsupported.

### 27.2 Required Web APIs

| API | Used For | Available in Target Browsers? |
|---|---|---|
| `EventSource` | SSE connection | Yes (all targets) |
| `document.createElementNS` | SVG element creation | Yes (universal) |
| `document.fonts.ready` | Font load gate | Yes (Safari 16.4+) |
| `ResizeObserver` | Canvas resize | Yes (all targets) |
| `CSS @keyframes` | Entrance animations | Yes (universal) |
| `will-change` | GPU layer promotion | Yes (all targets) |
| `transform-box: fill-box` | SVG transform origin | Yes (Chrome 64+, Firefox 55+, Safari 11.1+) |
| `postMessage` | iframe bridge | Yes (universal) |
| `performance.mark/measure` | Performance profiling | Yes (all targets) |

### 27.3 GSAP 3.13 Compatibility

GSAP 3.13 requires no polyfills on the target browser matrix. Key notes:

- **No license key** needed for any plugin (GSAP 3.13 made all plugins free in April 2025).
- **Licensing risk**: GSAP is owned by Webflow. The license includes a "no competitors" clause. Assess whether PRE competes with Webflow before committing to GSAP in production.
- **Fallback option**: Anime.js v4 (MIT license, April 2025) with built-in morphing and draw-on. API migration is non-trivial but achievable.
- `DrawSVGPlugin` must be explicitly registered: `gsap.registerPlugin(DrawSVGPlugin)`.

---

## 28. V1 Limitations & V2 Roadmap

### 28.1 V1 Known Limitations

| Limitation | Details | Impact |
|---|---|---|
| No shape morphing | `MorphSVGPlugin` not used; entity transitions are opacity-based | Cannot morph circle → rect; entity swaps are discrete |
| No GSAP ScrollTrigger | No scroll-driven animations (not applicable to presentation context) | N/A for V1 use cases |
| Session store in-memory | `sseSubscribers` Map is single-process | Cannot scale horizontally without Redis |
| Font FOUT window | `document.fonts.ready` blocks first render; 3s timeout | Slow connections may see blank canvas briefly |
| No offline support | No ServiceWorker caching for player assets | Requires network for all sessions |
| Entity position system | `parentEntityId` nesting is approximate (scale estimation) | Deeply nested hierarchies may not render accurately |
| `innerHTML = ''` on clear | Clearing via `innerHTML` is not animated for remaining entities | All entities disappear simultaneously unless exit animation completes first |

### 28.2 V2 Roadmap

| Feature | Description | Priority |
|---|---|---|
| **DrawSVG graph reveal** | `DrawSVGPlugin` for line-chart draw-on per entity type | High |
| **Audio sync** | Play `narrationSegment.audioUrl` aligned to frame timing | High |
| **Entity persistence** | Cross-frame entity continuity with smooth position transitions | High |
| **MotionPathPlugin** | Animate entities along SVG `<path>` for process flow diagrams | Medium |
| **SplitTextPlugin** | Character-by-character text reveal for key terms | Medium |
| **Web Component** | `<pre-player session-id="...">` for inline embed (no iframe boundary) | Medium |
| **Horizontal scaling** | Redis-backed `sseSubscribers` for multi-process deployment | Medium |
| **ServiceWorker** | Cache player assets for offline / low-latency reload | Low |
| **3D canvas** | Three.js layer for 3D entity types (`ThreeDVisualization` from types.ts) | Low (V3) |
| **GSAP → Anime.js** | Evaluate Anime.js v4 as GSAP replacement if Webflow clause is a risk | V2 decision point |

### 28.3 V2 Architecture Changes Anticipated

**Entity persistence across frames** is the most significant V2 change. In V1, the canvas is cleared and re-rendered on every frame transition. In V2, entities with matching IDs between frames will persist in the DOM — only their properties change, animated by GSAP:

```
V1 behavior (current):
  Frame N → clear all → render frame N+1 entities fresh

V2 behavior (planned):
  Frame N → compute diff vs frame N+1
    Added entities:   renderEntity()
    Removed entities: exit animation + removeChild()
    Moved entities:   gsap.to(outerG, { attr: { transform: ... } })
    Changed props:    patchEntity(id, diff)
```

This requires the scene controller to maintain a `Map<entityId, SVGGElement>` of live DOM nodes across frames — a significant architecture change, but it enables smooth cross-frame entity motion (an entity visually "moves" from its position in frame N to frame N+1).

---

*End of 04 — Player & Renderer Architecture*

*See also:*
- *[03-pml-scene-compiler.md](./03-pml-scene-compiler.md) — VisualScript compilation, Zod validation, compiler pipeline*
- *[05-illustration-system.md](./05-illustration-system.md) — Component registry, render function library (88+ types)*
- *[06-data-model.md](./06-data-model.md) — VisualEntity, IllustrationFrame, VisualScript schemas*
- *[architecture-recommendations.md](../architecture-recommendations.md) — Master spec (sections 4, 5, 9)*
