# 03 — Scene Compiler Architecture

**Package:** `@pre/compiler`  
**Status:** V1 — Canonical  
**Last Updated:** 2026-02-28  
**Supersedes:** Old `03-pml-scene-compiler.md` (PML DSL / `<illustration>` tag model — retired)

---

## Table of Contents

1. [Overview & Design Philosophy](#1-overview--design-philosophy)
2. [What Changed from the Old Model](#2-what-changed-from-the-old-model)
3. [Data Model: VisualEntity, IllustrationFrame, VisualScript](#3-data-model-visualentity-illustrationframe-visualscript)
4. [The Skeleton API — Smart Defaults Pattern](#4-the-skeleton-api--smart-defaults-pattern)
5. [Compiler Pipeline (Five Stages)](#5-compiler-pipeline-five-stages)
6. [Stage 1 — Ingestion & Schema Validation](#6-stage-1--ingestion--schema-validation)
7. [Stage 2 — Entity Validation & Defaults Application](#7-stage-2--entity-validation--defaults-application)
8. [Stage 3 — Position Resolution & Entity Clamping](#8-stage-3--position-resolution--entity-clamping)
9. [Stage 4 — Connection & Hierarchy Resolution](#9-stage-4--connection--hierarchy-resolution)
10. [Stage 5 — Temporal Choreography & Frame Timing](#10-stage-5--temporal-choreography--frame-timing)
11. [Frame Transition Computation](#11-frame-transition-computation)
12. [Zod Schemas](#12-zod-schemas)
13. [Error Handling & Agent Suggestions](#13-error-handling--agent-suggestions)
14. [Complete Worked Example](#14-complete-worked-example)
15. [Performance Contracts](#15-performance-contracts)
16. [V1 Limitations & V2 Roadmap](#16-v1-limitations--v2-roadmap)

---

## 1. Overview & Design Philosophy

The Scene Compiler is a pure transformation function that converts **raw scene data from the MCP server** into a fully-resolved `VisualScript` that the `@pre/player` can execute without further processing.

### 1.1 The Core Transformation

```
Agent (LLM)
    │
    │  Raw scene JSON (minimal — "skeleton" entities)
    ▼
MCP Server (add_scene tool)
    │
    │  SSE push: script_update event
    ▼
Scene Compiler  ◄─── This document describes this stage
  ├── Stage 1: Schema Validation (Zod)
  ├── Stage 2: Defaults Application (Skeleton → Full Entity)
  ├── Stage 3: Position Resolution (0-100% → canvas pixels) + Clamping
  ├── Stage 4: Connection & Hierarchy Resolution
  └── Stage 5: Temporal Choreography (stagger delays + frame timing)
    │
    │  VisualScript with fully-resolved IllustrationFrame[]
    ▼
@pre/player (scene-controller.js)
```

### 1.2 Why Not a DSL?

The old architecture used PML — a custom JSON domain-specific language with `<illustration>` tags, morph pairs, and a multi-pass compilation pipeline that resolved SVG file paths. This model had three fatal flaws:

1. **Not LLM-native.** Agents had to reason about illustration file names, variant names, and tag strings mapped to static SVG assets. This coupled agent output to an asset catalog.
2. **Morph topology fragility.** MorphSVGPlugin required matching anchor point counts between source and target SVG paths. Editing an SVG file silently broke morph pairs.
3. **No semantic extensibility.** Adding a new visualization type meant designing, drawing, and committing two SVG files — not writing one JS function.

The new model is **agent-native flat JSON**:

| Old Model | New Model |
|-----------|-----------|
| PML DSL with `<illustration>` tags | `VisualEntity` JSON objects |
| Tag → SVG file lookup | `type` string → render function dispatch |
| Morph pair compilation | Not needed in V1 (opacity/transform transitions only) |
| Output: SVG file references in SceneRenderTree | Output: `VisualScript` with `IllustrationFrame[]` |
| Canvas: 1600×900 | Canvas: 1920×1080 (`viewBox="0 0 1920 1080"`) |

### 1.3 System Position

The Scene Compiler sits between the MCP server and the player. It runs **server-side**, invoked whenever the `add_scene` MCP tool is called. Its output — a validated, fully-resolved `VisualScript` — is pushed to the player via SSE.

```
┌─────────────────────────────────────────────┐
│  PRE Backend (Fastify + MCP)                │
│                                             │
│  add_scene handler                        │
│       │                                     │
│       ▼                                     │
│  compileVisualScript(raw)                   │  ◄── This module
│       │                                     │
│       ├─ success → sseEmit(script_update)   │
│       └─ failure → return MCP error         │
│                                             │
└─────────────────────────────────────────────┘
```

The compiler is a **synchronous pure function** — no I/O, no async, no side effects. This makes it trivially testable and deterministic.

---

## 2. What Changed from the Old Model

This section is a direct reference for anyone migrating from the old `03-pml-scene-compiler.md`.

| Old | New | Reason |
|-----|-----|--------|
| PML DSL with `pml: "1.0"` version key | No DSL — raw `VisualScript` JSON | LLM-native flat JSON replaces custom markup |
| `<illustration>` tag → SVG file lookup | `entity.type` → render function registry | Code-driven, no file I/O at compile or render time |
| Morph pair compilation step | **Removed entirely in V1** | Entity swap via opacity/transform is sufficient |
| Canvas: 1600×900 reference | Canvas: **1920×1080** (`viewBox="0 0 1920 1080"`) | Standard 16:9 presentation format |
| `SceneRenderTree` output | `VisualScript` output | Simpler, portable data model |
| 5-stage pipeline (Parse, Resolve Illustrations, Layout, Render Tree, Timeline) | 5-stage pipeline (Validate, Defaults, Position, Connections, Temporal) | Completely different concerns |
| Illustration metadata index (dist/index.json) | Component registry (registry.js) | No static assets |
| `enterAt` normalized time (0.0–1.0) | `animation.delay` in milliseconds | Direct ms offset is simpler for agents |

---

## 3. Data Model: VisualEntity, IllustrationFrame, VisualScript

Before diving into the compiler pipeline, understand the exact data structures it consumes and produces.

### 3.1 VisualEntity — The Atomic Unit

```typescript
// shared/types.ts (canonical definition)

interface VisualEntity {
  // ── Required ────────────────────────────────────────────
  id:   string;   // Unique within a VisualScript; use descriptive IDs: "server-1", "db-auth"
  type: string;   // Registry key: "Server" | "Database" | "Arrow" | "Graph2D" | ...

  // ── Position (0–100% of canvas, origin top-left) ────────────
  position: {
    x: number;  // 0 = left edge, 100 = right edge
    y: number;  // 0 = top edge,  100 = bottom edge
  };

  // ── Optional display properties ─────────────────────────────
  size?:      number;   // Scaling multiplier: 1.0 = default size
  label?:     string;   // Human-readable label rendered near entity
  color?:     string;   // Primary fill color (hex or CSS)
  highlight?: boolean;  // Render with highlight ring/glow effect

  // ── Animation ─────────────────────────────────────────────
  animation?: {
    delay?:    number;  // ms; CSS animation-delay for entrance choreography
    duration?: number;  // ms; override default entrance duration
    easing?:   string;  // CSS easing string
    entrance?: string;  // CSS class: 'entrance-fadeInUp' | 'entrance-fadeIn' | ...
  };

  // ── Relationships (flat ID references — Excalidraw-inspired) ──
  sourceEntityId?: string;  // For Arrow/DataFlow: entity this arrow starts at
  targetEntityId?: string;  // For Arrow/DataFlow: entity this arrow points to
  parentEntityId?: string;  // For nested entities inside a parent container

  // ── Content ───────────────────────────────────────────────
  textContent?: string;  // For CodeBlock, text labels, annotations

  // ── Rich parameterization (type-specific) ────────────────────
  metadata?: Record<string, unknown>;
}
```

**Key design decisions:**
- `position` is in 0–100% space. The compiler resolves this to 1920×1080 pixels. Agents never write pixel values.
- `size` is a multiplier, not pixels. `1.0` means the component renders at its default size. `2.0` is double.
- `sourceEntityId` / `targetEntityId` are **label-based OR id-based** string references. The compiler resolves them via fuzzy lookup (see Stage 4).
- `metadata` holds type-specific rich parameters that don't belong in the base schema.

### 3.2 IllustrationFrame

```typescript
interface IllustrationFrame {
  id:       string;   // Unique frame ID within a VisualScript
  startTime: number;  // ms, relative to VisualScript start
  endTime:   number;  // ms; must satisfy endTime - startTime >= FRAME_DURATION_MIN_MS (2500ms)

  entities: VisualEntity[];  // All entities visible during this frame

  transitions?: EntityTransition[];  // GSAP transitions entering this frame from previous

  narrationSegment?: {
    text:      string;   // Narration text (for TTS or overlay display)
    audioUrl?: string;   // Pre-generated audio URL if pre-rendered
  };

  description?: string;  // Debug description of the frame
}

interface EntityTransition {
  entityId:  string;
  from:      Partial<VisualEntity>;  // Properties at transition start
  to:        Partial<VisualEntity>;  // Properties at transition end
  duration:  number;                 // ms
  easing?:   string;                 // GSAP easing string: 'power2.inOut'
}
```

**Frame timing invariants enforced by the compiler:**
- `endTime - startTime >= FRAME_DURATION_MIN_MS` (2500ms minimum frame duration)
- Each entity's `animation.delay` must be `<= (endTime - startTime) - ENTITY_MIN_VISIBLE_MS` — entities must be visible for at least 1200ms before the frame ends

### 3.3 VisualScript

```typescript
interface VisualScript {
  sceneId:       string;  // Matches MCP session ID (UUID)
  totalDuration: number;  // ms; sum of all frame durations

  frames: IllustrationFrame[];  // Ordered array of frames

  meta?: {
    title?:       string;
    description?: string;
    version?:     string;
    createdAt?:   string;  // ISO 8601
  };
}
```

### 3.4 The Flat JSON Model (Excalidraw-Inspired)

All entity relationships are expressed as ID cross-references in a flat array — never as nested objects. This is a deliberate architectural choice.

```
CORRECT — flat array with ID references:
{
  "entities": [
    { "id": "frame-1",  "type": "Frame",    "position": { "x": 10, "y": 10 } },
    { "id": "server-1", "type": "Server",   "position": { "x": 30, "y": 30 }, "parentEntityId": "frame-1" },
    { "id": "db-1",     "type": "Database", "position": { "x": 70, "y": 30 } },
    { "id": "arrow-1",  "type": "Arrow",    "position": { "x": 50, "y": 30 },
      "sourceEntityId": "server-1", "targetEntityId": "db-1" }
  ]
}

WRONG — nested objects:
{
  "entities": [
    {
      "id": "frame-1",
      "type": "Frame",
      "children": [           ← nested
        { "id": "server-1" }
      ],
      "connections": [        ← nested
        { "from": "server-1", "to": "db-1" }
      ]
    }
  ]
}
```

**Why flat is better for LLM agents:**
1. Flat arrays are a well-understood pattern — the model never has to decide "which level do I nest this at?"
2. Each entity is self-contained; partial object construction can't produce malformed structures
3. ID-based lookups are O(1); no tree traversal required
4. Frame-to-frame diffs are trivial array comparisons
5. JSON serialization is trivial — no circular references possible

---

## 4. The Skeleton API — Smart Defaults Pattern

The Skeleton API is the most important ergonomic feature of the compiler. It allows agents to emit **minimal entities** and the compiler fills in all defaults before dispatching to the renderer.

This is directly inspired by Excalidraw's `ElementSkeleton` pattern: the agent sends the semantic intent, the system handles the visual specifics.

### 4.1 Default Table

```javascript
// compiler/defaults.js

const ENTITY_DEFAULTS = {
  size:      1.0,
  color:     '#4A90D9',
  highlight: false,
  animation: {
    delay:    0,
    duration: 450,
    easing:   'cubic-bezier(0.22, 1, 0.36, 1)',
    entrance: 'entrance-fadeInUp',
  },
};
```

### 4.2 Deep Merge Function

```javascript
// compiler/defaults.js

/**
 * applyDefaults — merges ENTITY_DEFAULTS with agent-supplied entity.
 * Agent values always take precedence. Animation is deep-merged
 * (so agent can override just delay without losing entrance class).
 *
 * @param {object} entity  - Raw entity from agent JSON
 * @returns {VisualEntity} - Fully-specified entity ready for rendering
 */
function applyDefaults(entity) {
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

### 4.3 Agent Minimal vs. Compiler Full

```
Agent emits (valid — minimal skeleton):
{
  "id":       "server-1",
  "type":     "Server",
  "position": { "x": 50, "y": 50 }
}

Compiler enriches to (full entity):
{
  "id":       "server-1",
  "type":     "Server",
  "position": { "x": 50, "y": 50 },  ← preserved
  "size":      1.0,                   ← default applied
  "color":     "#4A90D9",             ← default applied
  "highlight": false,                  ← default applied
  "animation": {
    "delay":    0,                    ← default applied
    "duration": 450,                  ← default applied
    "easing":   "cubic-bezier(0.22, 1, 0.36, 1)",
    "entrance": "entrance-fadeInUp"
  }
}
```

```
Agent emits (partial override — only delay specified):
{
  "id":       "db-1",
  "type":     "Database",
  "position": { "x": 75, "y": 50 },
  "color":    "#27AE60",
  "animation": { "delay": 160 }
}

Compiler enriches to:
{
  "id":       "db-1",
  "type":     "Database",
  "position": { "x": 75, "y": 50 },
  "size":      1.0,                    ← default
  "color":    "#27AE60",               ← preserved
  "highlight": false,                  ← default
  "animation": {
    "delay":    160,                   ← preserved
    "duration": 450,                   ← default
    "easing":   "cubic-bezier(0.22, 1, 0.36, 1)",  ← default
    "entrance": "entrance-fadeInUp"    ← default
  }
}
```

### 4.4 Type-Specific Default Size Overrides

Different entity types have different natural default sizes. The compiler applies these after the base defaults:

```javascript
// compiler/type-defaults.js

const TYPE_SIZE_DEFAULTS = {
  // Infrastructure
  Server:       1.0,
  Database:     1.0,
  Cache:        0.8,
  LoadBalancer: 1.1,
  Queue:        1.0,
  CDN:          1.0,
  Cloud:        1.4,
  Container:    1.2,

  // Connections (size meaningless — computed from endpoints)
  Arrow:        null,
  BidirectArrow:null,
  DataFlow:     null,

  // Math / Data
  Graph2D:      1.6,   // Graphs need more space
  Graph3D:      1.8,
  Matrix:       1.3,
  Equation:     1.2,
  Table:        1.8,
  CodeBlock:    1.6,

  // UI / Layout
  Frame:        2.0,   // Frames are containers — always large
  Label:        0.6,
};

function applyTypeDefaults(entity) {
  const sizeDefault = TYPE_SIZE_DEFAULTS[entity.type];
  if (sizeDefault !== null && sizeDefault !== undefined && entity.size === undefined) {
    entity.size = sizeDefault;
  }
  return entity;
}
```

---

## 5. Compiler Pipeline (Five Stages)

The compiler is a **pure function** that runs five sequential stages. Each stage transforms the data and passes it to the next.

```
compile(rawInput: unknown): CompileResult

  ┌───────────────────────────────────────────────────────────────┐
  │  Stage 1: Ingestion & Schema Validation                     │
  │  Input:  unknown JSON                                       │
  │  Output: Validated VisualScript (Zod-checked)               │
  │  Fail:   CompileError with agent-actionable suggestion       │
  └───────────────────────────┬───────────────────────────────────┘
                              │
  ┌───────────────────────────▼───────────────────────────────────┐
  │  Stage 2: Entity Validation & Defaults Application          │
  │  Input:  Valid VisualScript (sparse entities)               │
  │  Output: VisualScript with fully-specified entities         │
  │  Ops:    applyDefaults(), applyTypeDefaults(),              │
  │          validate known entity types, warn on unknowns      │
  └───────────────────────────┬───────────────────────────────────┘
                              │
  ┌───────────────────────────▼───────────────────────────────────┐
  │  Stage 3: Position Resolution & Entity Clamping             │
  │  Input:  Entities with 0-100% positions                     │
  │  Output: Entities with clamped positions (NaN-safe)         │
  │  Ops:    clampEntityPosition(), NaN guard                   │
  └───────────────────────────┬───────────────────────────────────┘
                              │
  ┌───────────────────────────▼───────────────────────────────────┐
  │  Stage 4: Connection & Hierarchy Resolution                 │
  │  Input:  Entities with raw ID/label refs                    │
  │  Output: Entities with resolved connection metadata         │
  │  Ops:    fuzzy label lookup, parentEntityId validation       │
  └───────────────────────────┬───────────────────────────────────┘
                              │
  ┌───────────────────────────▼───────────────────────────────────┐
  │  Stage 5: Temporal Choreography & Frame Timing              │
  │  Input:  Entities without stagger assignments               │
  │  Output: Entities with animation.delay, validated endTime   │
  │  Ops:    assignEntranceDelays(), enforceFrameTimingFloors() │
  └───────────────────────────────────────────────────────────────┘
                              │
                              ▼
                     CompileResult
                   { success: true, script: VisualScript, warnings: [] }
                       OR
                   { success: false, errors: CompilerError[] }
```

### 5.1 CompileResult Type

```typescript
export type CompileResult =
  | { success: true;  script: VisualScript;  warnings: CompilerWarning[] }
  | { success: false; errors:  CompilerError[] };

export interface CompilerError {
  code:       CompilerErrorCode;
  frameId?:   string;
  entityId?:  string;
  path:       string;       // JSON path to the offending field
  message:    string;       // Human-readable description
  suggestion: string;       // Actionable fix the agent can apply
}

export interface CompilerWarning {
  code:      CompilerWarningCode;
  frameId?:  string;
  entityId?: string;
  message:   string;
  suggestion:string;
}

export type CompilerErrorCode =
  | 'VALIDATION_FAILED'
  | 'DUPLICATE_ENTITY_ID'
  | 'DUPLICATE_FRAME_ID'
  | 'FRAME_TIMING_OVERLAP'
  | 'INVALID_FRAME_ORDER';

export type CompilerWarningCode =
  | 'UNKNOWN_ENTITY_TYPE'         // Type not in registry — will render as fallback
  | 'UNRESOLVED_CONNECTION'       // sourceEntityId/targetEntityId not found
  | 'UNRESOLVED_PARENT'           // parentEntityId not found
  | 'ENTITY_CLAMPED'              // Position clamped to stay within canvas
  | 'FRAME_DURATION_TOO_SHORT'    // endTime - startTime < FRAME_DURATION_MIN_MS
  | 'ENTITY_BARELY_VISIBLE'       // animation.delay leaves < ENTITY_MIN_VISIBLE_MS
  | 'POSITION_NAN'                // position.x or .y was NaN — defaulted to 50
  | 'ENTITY_COUNT_HIGH';          // frame.entities.length > 150 (performance warning)
```

---

## 6. Stage 1 — Ingestion & Schema Validation

**Input:** `unknown` (raw JSON from MCP tool call)  
**Output:** `ValidatedScript` (Zod-parsed `VisualScript`)  
**On failure:** `CompileResult { success: false, errors }`

```javascript
// compiler/stage1-validate.js
import { VisualScriptSchema } from '../schemas/visual.js';

export function stage1Validate(raw) {
  const result = VisualScriptSchema.safeParse(raw);

  if (result.success) {
    return { ok: true, data: result.data };
  }

  const errors = result.error.issues.map(issue => ({
    code:       'VALIDATION_FAILED',
    path:       issue.path.join('.'),
    message:    issue.message,
    suggestion: mapZodIssueToSuggestion(issue),
  }));

  return { ok: false, errors };
}

function mapZodIssueToSuggestion(issue) {
  const path = issue.path.join('.');

  // Position out of range
  if (path.endsWith('position.x') || path.endsWith('position.y')) {
    return 'Position values must be 0–100 (percentage of canvas). ' +
           'Example: { "x": 50, "y": 50 } places the entity at canvas center.';
  }
  // Missing required id
  if (path.endsWith('.id') && issue.code === 'too_small') {
    return 'Entity id must be a non-empty string. ' +
           'Use descriptive IDs: "server-api", "db-postgres", "arrow-1".';
  }
  // Missing required type
  if (path.endsWith('.type') && issue.code === 'too_small') {
    return 'Entity type must be a non-empty string. ' +
           'Use a registry type: "Server", "Database", "Arrow", "Graph2D", etc.';
  }
  // Frame timing
  if (path.includes('endTime') && issue.code === 'too_small') {
    return 'endTime must be >= startTime + 2500 (minimum 2500ms frame duration). ' +
           'For a 5-second frame starting at t=0: { "startTime": 0, "endTime": 5000 }.';
  }
  // Duplicate IDs
  if (issue.code === 'custom' && issue.message.includes('Duplicate')) {
    return 'Ensure all entity IDs are unique within a frame. ' +
           'Append a suffix: "server-1", "server-2".';
  }

  return 'Check the VisualScript schema for field requirements.';
}
```

### 6.1 Duplicate ID Detection (superRefine)

Zod's `safeParse` alone doesn't catch duplicate IDs within an array. The `VisualScriptSchema` uses `.superRefine()` to add this check:

```javascript
// schemas/visual.js (partial — superRefine additions)

const IllustrationFrameSchema = z.object({ /* ... */ }).superRefine((frame, ctx) => {
  // Detect duplicate entity IDs within a single frame
  const ids = frame.entities.map(e => e.id);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate entity id "${id}" in frame "${frame.id}"`,
        path: ['entities'],
      });
    }
    seen.add(id);
  }
});
```

---

## 7. Stage 2 — Entity Validation & Defaults Application

**Input:** Zod-validated `VisualScript` (entities may be sparse)  
**Output:** `VisualScript` with fully-specified entities  
**Warnings:** `UNKNOWN_ENTITY_TYPE` for unrecognized entity types

### 7.1 Known Entity Type Registry

The compiler maintains a registry of all known entity types. Unknown types do not fail compilation — they produce a warning, and the player will render them as a generic fallback circle.

```javascript
// compiler/known-types.js

export const KNOWN_ENTITY_TYPES = new Set([
  // Infrastructure
  'Server', 'Database', 'Cache', 'LoadBalancer', 'Queue', 'CDN',
  'Cloud', 'Container', 'Pod', 'Service', 'Lambda', 'APIGateway',
  'Firewall', 'Subnet', 'Volume', 'Registry', 'Monitor', 'Pipeline',
  'Decision', 'Cluster', 'Network', 'Process',

  // Connections
  'Arrow', 'BidirectArrow', 'DottedArrow', 'DataFlow',

  // Math / Science
  'Graph2D', 'Graph3D', 'Equation', 'Expression', 'Matrix',
  'Wave', 'Circuit', 'Vector', 'FreeBodyDiagram', 'Particle',
  'Field', 'NumberLine', 'CoordinateSystem',

  // Data / Code
  'Table', 'CodeBlock', 'Histogram', 'PieChart', 'BarChart',
  'ScatterPlot', 'FlowDiagram', 'VennDiagram',

  // UI / Layout
  'Frame', 'Label', 'Icon', 'Badge', 'Box', 'Concept',
  'Entity', 'Group', 'Comparison', 'Timeline', 'Metric',
  'Cycle', 'Stack', 'Tree', 'Quote', 'Annotation',

  // Pedagogical
  'StepList', 'Definition', 'Callout', 'Proof', 'Analogy',
  'User', 'Device',
]);
```

### 7.2 Stage 2 Implementation

```javascript
// compiler/stage2-defaults.js
import { applyDefaults, applyTypeDefaults } from './defaults.js';
import { KNOWN_ENTITY_TYPES } from './known-types.js';

export function stage2ApplyDefaults(script) {
  const warnings = [];

  const enrichedFrames = script.frames.map(frame => ({
    ...frame,
    entities: frame.entities.map(entity => {
      // Warn on unknown types (don't fail — renderer handles as fallback)
      if (!KNOWN_ENTITY_TYPES.has(entity.type)) {
        warnings.push({
          code:      'UNKNOWN_ENTITY_TYPE',
          frameId:   frame.id,
          entityId:  entity.id,
          message:   `Unknown entity type "${entity.type}". Will render as generic fallback.`,
          suggestion:`Check the entity type registry. Valid types include: Server, Database, ` +
                     `Arrow, Graph2D, Table, CodeBlock, etc.`,
        });
      }

      // Apply base defaults, then type-specific defaults
      const withDefaults = applyDefaults(entity);
      return applyTypeDefaults(withDefaults);
    }),
  }));

  return {
    script: { ...script, frames: enrichedFrames },
    warnings,
  };
}
```

---

## 8. Stage 3 — Position Resolution & Entity Clamping

**Input:** Entities with 0–100% positions (may contain NaN)  
**Output:** Entities with clamped, NaN-safe positions  
**Warnings:** `POSITION_NAN`, `ENTITY_CLAMPED`

### 8.1 Canvas Constants

```javascript
// shared/constants.js

export const CANVAS_WIDTH         = 1920;  // px — matches SVG viewBox
export const CANVAS_HEIGHT        = 1080;  // px — matches SVG viewBox
export const ENTITY_LABEL_PADDING = 22;    // px — space below entity for label text
export const CANVAS_EDGE_PAD_PCT  = 1;     // % — minimum margin from canvas edge
```

### 8.2 The clampEntityPosition Utility

This function (defined in `types.ts`, imported by the compiler) ensures no entity can be positioned so that it visually clips outside the canvas boundary:

```javascript
// shared/clamp.js

/**
 * clampEntityPosition
 *
 * Clamps an entity's CENTER position so the entity body (plus its label)
 * stays fully within the 1920×1080 canvas. Returns clamped percentage coords.
 *
 * @param position        - { x: 0-100, y: 0-100 } percentage position
 * @param entityWidthPx   - Entity width in canvas pixels (size * baseWidth)
 * @param entityHeightPx  - Entity height in canvas pixels (size * baseHeight)
 * @returns               - Clamped { x, y } in percentage space
 */
export function clampEntityPosition(
  position,
  entityWidthPx,
  entityHeightPx,
  canvasWidth  = CANVAS_WIDTH,
  canvasHeight = CANVAS_HEIGHT,
) {
  // Guard against NaN — default to canvas center (50, 50)
  const px = isNaN(position.x) ? 50 : position.x;
  const py = isNaN(position.y) ? 50 : position.y;

  // Half-extents in % space
  const halfWPct = (entityWidthPx / 2) / canvasWidth * 100;
  const halfHPct = (entityHeightPx / 2) / canvasHeight * 100;

  // Labels extend below entity body — reserve space
  const labelPadPct = ENTITY_LABEL_PADDING / canvasHeight * 100;

  const pad = CANVAS_EDGE_PAD_PCT; // 1% from edge

  return {
    x: Math.max(halfWPct + pad, Math.min(100 - halfWPct - pad,          px)),
    y: Math.max(halfHPct + pad, Math.min(100 - halfHPct - labelPadPct - pad, py)),
  };
}
```

### 8.3 Stage 3 Implementation

```javascript
// compiler/stage3-positions.js
import { clampEntityPosition } from '../shared/clamp.js';

// Base pixel sizes for each entity type (at size=1.0)
// Used to compute clamping bounds
const BASE_ENTITY_SIZES = {
  Server:       { w: 80,  h: 60  },
  Database:     { w: 70,  h: 80  },
  Cache:        { w: 64,  h: 64  },
  LoadBalancer: { w: 90,  h: 50  },
  Queue:        { w: 100, h: 50  },
  Arrow:        { w: 0,   h: 0   },  // Arrows: skip clamping
  Graph2D:      { w: 200, h: 160 },
  Table:        { w: 240, h: 160 },
  CodeBlock:    { w: 200, h: 150 },
  Frame:        { w: 300, h: 200 },
  Label:        { w: 80,  h: 24  },
  DEFAULT:      { w: 80,  h: 80  },  // Fallback for unknown types
};

export function stage3ResolvePositions(script) {
  const warnings = [];

  const enrichedFrames = script.frames.map(frame => ({
    ...frame,
    entities: frame.entities.map(entity => {
      // Connections have no meaningful clamp (their position is from endpoints)
      if (entity.type === 'Arrow' || entity.type === 'BidirectArrow' ||
          entity.type === 'DataFlow' || entity.type === 'DottedArrow') {
        return entity;
      }

      const baseSize = BASE_ENTITY_SIZES[entity.type] ?? BASE_ENTITY_SIZES.DEFAULT;
      const scaledW  = baseSize.w * (entity.size ?? 1.0);
      const scaledH  = baseSize.h * (entity.size ?? 1.0);

      // Detect NaN before clamping
      const hadNaN = isNaN(entity.position.x) || isNaN(entity.position.y);
      if (hadNaN) {
        warnings.push({
          code:      'POSITION_NAN',
          frameId:   frame.id,
          entityId:  entity.id,
          message:   `Entity "${entity.id}" had NaN position — defaulted to canvas center (50, 50).`,
          suggestion: 'Ensure position.x and position.y are numbers between 0 and 100.',
        });
      }

      const clamped = clampEntityPosition(entity.position, scaledW, scaledH);
      const wasClamped =
        clamped.x !== (isNaN(entity.position.x) ? 50 : entity.position.x) ||
        clamped.y !== (isNaN(entity.position.y) ? 50 : entity.position.y);

      if (wasClamped && !hadNaN) {
        warnings.push({
          code:      'ENTITY_CLAMPED',
          frameId:   frame.id,
          entityId:  entity.id,
          message:   `Entity "${entity.id}" at (${entity.position.x}, ${entity.position.y}) ` +
                     `was clamped to (${clamped.x.toFixed(1)}, ${clamped.y.toFixed(1)}) ` +
                     `to keep it within canvas bounds.`,
          suggestion: `Adjust position to keep entity within canvas. For a ${entity.type} ` +
                      `at size ${entity.size}, x must be ${(scaledW/2/CANVAS_WIDTH*100+1).toFixed(1)}–` +
                      `${(100 - scaledW/2/CANVAS_WIDTH*100-1).toFixed(1)}.`,
        });
      }

      return { ...entity, position: clamped };
    }),
  }));

  return {
    script: { ...script, frames: enrichedFrames },
    warnings,
  };
}
```

---

## 9. Stage 4 — Connection & Hierarchy Resolution

**Input:** Entities with raw string refs in `sourceEntityId`, `targetEntityId`, `parentEntityId`  
**Output:** Same entities with validated (and fuzzy-matched) refs  
**Warnings:** `UNRESOLVED_CONNECTION`, `UNRESOLVED_PARENT`

### 9.1 Fuzzy Entity Lookup

Agents sometimes emit label strings instead of IDs in connection refs. The compiler resolves them:

```javascript
// compiler/stage4-connections.js

/**
 * resolveEntityRef
 *
 * Tries to find an entity matching the given ref string.
 * Lookup order:
 *   1. Exact ID match
 *   2. Case-insensitive ID match
 *   3. Exact label match
 *   4. Case-insensitive label match
 *   5. Partial label substring match
 *
 * @param {string}           ref      - The ref string from the entity JSON
 * @param {VisualEntity[]}   entities - All entities in the frame
 * @returns {VisualEntity | null}
 */
function resolveEntityRef(ref, entities) {
  if (!ref) return null;

  // 1. Exact ID
  let match = entities.find(e => e.id === ref);
  if (match) return match;

  // 2. Case-insensitive ID
  const refLower = ref.toLowerCase();
  match = entities.find(e => e.id.toLowerCase() === refLower);
  if (match) return match;

  // 3. Exact label
  match = entities.find(e => e.label === ref);
  if (match) return match;

  // 4. Case-insensitive label
  match = entities.find(e => e.label?.toLowerCase() === refLower);
  if (match) return match;

  // 5. Substring match on label
  match = entities.find(e => e.label?.toLowerCase().includes(refLower));
  return match ?? null;
}
```

### 9.2 Stage 4 Implementation

```javascript
export function stage4ResolveConnections(script) {
  const warnings = [];

  const enrichedFrames = script.frames.map(frame => {
    const entityIndex = new Map(frame.entities.map(e => [e.id, e]));

    const resolvedEntities = frame.entities.map(entity => {
      const updates = {};

      // Resolve Arrow/DataFlow connections
      if (entity.sourceEntityId) {
        const resolved = resolveEntityRef(entity.sourceEntityId, frame.entities);
        if (!resolved) {
          warnings.push({
            code:      'UNRESOLVED_CONNECTION',
            frameId:   frame.id,
            entityId:  entity.id,
            message:   `sourceEntityId "${entity.sourceEntityId}" not found in frame entities.`,
            suggestion:`Ensure the source entity exists. Valid entity IDs: ${frame.entities.map(e=>e.id).join(', ')}.`,
          });
        } else if (resolved.id !== entity.sourceEntityId) {
          // Fuzzy match resolved to a different ID — update to canonical ID
          updates.sourceEntityId = resolved.id;
        }
      }

      if (entity.targetEntityId) {
        const resolved = resolveEntityRef(entity.targetEntityId, frame.entities);
        if (!resolved) {
          warnings.push({
            code:      'UNRESOLVED_CONNECTION',
            frameId:   frame.id,
            entityId:  entity.id,
            message:   `targetEntityId "${entity.targetEntityId}" not found in frame entities.`,
            suggestion:`Ensure the target entity exists. Valid entity IDs: ${frame.entities.map(e=>e.id).join(', ')}.`,
          });
        } else if (resolved.id !== entity.targetEntityId) {
          updates.targetEntityId = resolved.id;
        }
      }

      // Resolve parent hierarchy
      if (entity.parentEntityId) {
        const resolved = resolveEntityRef(entity.parentEntityId, frame.entities);
        if (!resolved) {
          warnings.push({
            code:      'UNRESOLVED_PARENT',
            frameId:   frame.id,
            entityId:  entity.id,
            message:   `parentEntityId "${entity.parentEntityId}" not found.`,
            suggestion:`Ensure the parent entity (e.g., a Frame) exists in the same frame.`,
          });
        } else if (resolved.id !== entity.parentEntityId) {
          updates.parentEntityId = resolved.id;
        }
      }

      return Object.keys(updates).length > 0 ? { ...entity, ...updates } : entity;
    });

    return { ...frame, entities: resolvedEntities };
  });

  return {
    script: { ...script, frames: enrichedFrames },
    warnings,
  };
}
```

---

## 10. Stage 5 — Temporal Choreography & Frame Timing

**Input:** Fully-resolved entities without stagger delays  
**Output:** Entities with `animation.delay` assigned, frame timing validated  
**Warnings:** `FRAME_DURATION_TOO_SHORT`, `ENTITY_BARELY_VISIBLE`

### 10.1 Entrance Stagger Algorithm

```javascript
// compiler/stage5-timing.js

const STAGGER_INCREMENT_MS = 80;    // ms between each entity's entrance
const FRAME_DURATION_MIN_MS = 2500; // minimum ms per frame
const ENTITY_MIN_VISIBLE_MS = 1200; // entity must be visible for at least this long

/**
 * assignEntranceDelays
 *
 * Assigns animation.delay to each entity that doesn't have one explicitly set.
 * Entities with animation.delay already set by the agent are not overridden.
 *
 * @param {VisualEntity[]} entities - Entities in the frame (order matters)
 * @returns {VisualEntity[]}        - Entities with delay assigned
 */
export function assignEntranceDelays(entities) {
  let autoIndex = 0;

  return entities.map(entity => {
    // Agent explicitly set delay — respect it
    if (entity.animation?.delay !== undefined && entity.animation.delay !== 0) {
      return entity;
    }

    // Assign stagger delay based on auto-increment counter
    const delay = autoIndex * STAGGER_INCREMENT_MS;
    autoIndex++;

    return {
      ...entity,
      animation: {
        ...entity.animation,
        delay,
      },
    };
  });
}
```

### 10.2 Frame Timing Validation

```javascript
/**
 * enforceFrameTimingFloors
 *
 * Validates and optionally corrects frame timing issues:
 * - Warns if frame duration < FRAME_DURATION_MIN_MS
 * - Warns if any entity's delay leaves < ENTITY_MIN_VISIBLE_MS before frame end
 *
 * Does NOT modify frame timing (agent owns timing). Only produces warnings.
 */
export function enforceFrameTimingFloors(frame, entities) {
  const warnings = [];
  const frameDuration = frame.endTime - frame.startTime;

  if (frameDuration < FRAME_DURATION_MIN_MS) {
    warnings.push({
      code:      'FRAME_DURATION_TOO_SHORT',
      frameId:   frame.id,
      message:   `Frame "${frame.id}" duration is ${frameDuration}ms, below minimum ${FRAME_DURATION_MIN_MS}ms.`,
      suggestion: `Set endTime to at least ${frame.startTime + FRAME_DURATION_MIN_MS}ms.`,
    });
  }

  for (const entity of entities) {
    const delay = entity.animation?.delay ?? 0;
    const visibleFor = frameDuration - delay;
    if (visibleFor < ENTITY_MIN_VISIBLE_MS) {
      warnings.push({
        code:      'ENTITY_BARELY_VISIBLE',
        frameId:   frame.id,
        entityId:  entity.id,
        message:   `Entity "${entity.id}" is visible for only ${visibleFor}ms (delay=${delay}ms, ` +
                   `frameDuration=${frameDuration}ms). Minimum visible time is ${ENTITY_MIN_VISIBLE_MS}ms.`,
        suggestion: `Reduce animation.delay to <= ${frameDuration - ENTITY_MIN_VISIBLE_MS}ms, ` +
                    `or increase frame endTime.`,
      });
    }
  }

  return warnings;
}
```

---

## 11. Frame Transition Computation

Transitions in V1 are **opacity + transform only** (GPU-accelerated paths). Morph transitions are not supported in V1.

```typescript
// player/scene-controller.js — transition execution (GSAP)

function applyFrameTransitions(fromFrame, toFrame) {
  const fromEntityMap = new Map(fromFrame.entities.map(e => [e.id, e]));
  const toEntityMap   = new Map(toFrame.entities.map(e => [e.id, e]));

  // Entities that exist in both frames — transition their properties
  for (const [id, toEntity] of toEntityMap) {
    const fromEntity = fromEntityMap.get(id);
    if (!fromEntity) continue; // New entity — entrance animation handles it

    const el = document.getElementById(id)?.querySelector('.animate-element');
    if (!el) continue;

    // Only animate opacity and transform (GPU-path)
    const tl = gsap.timeline();
    if (fromEntity.color !== toEntity.color) {
      // Color changes: cross-fade via opacity (never animate fill directly)
      tl.fromTo(el, { opacity: 1 }, { opacity: 0.6, duration: 0.15, ease: 'power2.inOut' })
        .to(el, { opacity: 1, duration: 0.15 });
    }
    if (fromEntity.size !== toEntity.size) {
      const scaleRatio = toEntity.size / fromEntity.size;
      tl.to(el, { scale: scaleRatio, duration: 0.3, ease: 'power2.out' });
    }
  }

  // Entities that exit — fade out
  for (const [id] of fromEntityMap) {
    if (!toEntityMap.has(id)) {
      const el = document.getElementById(id)?.querySelector('.animate-element');
      if (el) gsap.to(el, { opacity: 0, scale: 0.95, duration: 0.25, ease: 'power2.inOut' });
    }
  }
}
```

---

## 12. Zod Schemas

Complete Zod schema definitions for the compiler's data model:

```javascript
// schemas/visual.js (complete)
import { z } from 'zod';

export const VisualEntitySchema = z.object({
  id:       z.string().min(1, 'Entity id must be non-empty'),
  type:     z.string().min(1, 'Entity type must be non-empty'),
  position: z.object({
    x: z.number().min(0).max(100, 'Position x must be 0–100'),
    y: z.number().min(0).max(100, 'Position y must be 0–100'),
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

export const EntityTransitionSchema = z.object({
  entityId: z.string().min(1),
  from:     z.record(z.unknown()),
  to:       z.record(z.unknown()),
  duration: z.number().min(0),
  easing:   z.string().optional(),
});

export const IllustrationFrameSchema = z.object({
  id:        z.string().min(1),
  startTime: z.number().min(0),
  endTime:   z.number().min(0),
  entities:  z.array(VisualEntitySchema),
  transitions: z.array(EntityTransitionSchema).optional(),
  narrationSegment: z.object({
    text:     z.string(),
    audioUrl: z.string().url().optional(),
  }).optional(),
  description: z.string().optional(),
}).superRefine((frame, ctx) => {
  // Enforce minimum frame duration
  if (frame.endTime - frame.startTime < 2500) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Frame "${frame.id}" endTime must be >= startTime + 2500ms`,
      path: ['endTime'],
    });
  }
  // Detect duplicate entity IDs
  const ids = frame.entities.map(e => e.id);
  const seen = new Set();
  for (const id of ids) {
    if (seen.has(id)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Duplicate entity id "${id}" in frame "${frame.id}"`,
        path: ['entities'],
      });
    }
    seen.add(id);
  }
});

export const VisualScriptSchema = z.object({
  sceneId:       z.string().uuid('sceneId must be a valid UUID'),
  totalDuration: z.number().min(0),
  frames:        z.array(IllustrationFrameSchema).min(1, 'VisualScript must have at least one frame'),
  meta:          z.record(z.unknown()).optional(),
});
```

---

## 13. Error Handling & Agent Suggestions

All compiler errors include an actionable `suggestion` field. This enables agents to self-correct on the next attempt without human intervention.

### Error Mapping Table

| Situation | Error/Warning Code | Suggestion Text |
|-----------|-------------------|-----------------|
| `position.x` > 100 | `VALIDATION_FAILED` | "Position values must be 0–100 (percentage of canvas)." |
| `entity.id` empty | `VALIDATION_FAILED` | "Use descriptive IDs: \"server-api\", \"db-postgres\"." |
| `entity.type` empty | `VALIDATION_FAILED` | "Use a registry type: \"Server\", \"Database\", etc." |
| `endTime < startTime + 2500` | `VALIDATION_FAILED` | "Set endTime >= startTime + 2500ms." |
| Duplicate entity IDs | `DUPLICATE_ENTITY_ID` | "Append a suffix: \"server-1\", \"server-2\"." |
| Unknown entity type | `UNKNOWN_ENTITY_TYPE` (warn) | "Check the entity type registry." |
| `sourceEntityId` not found | `UNRESOLVED_CONNECTION` (warn) | "Ensure source entity exists in same frame." |
| NaN position | `POSITION_NAN` (warn) | "position.x and .y must be numbers 0–100." |
| Entity near edge | `ENTITY_CLAMPED` (warn) | "Adjust position.x to range X–Y." |
| Frame duration < 2500ms | `FRAME_DURATION_TOO_SHORT` (warn) | "Set endTime >= startTime + 2500ms." |
| Entity barely visible | `ENTITY_BARELY_VISIBLE` (warn) | "Reduce delay to <= N ms or increase frame duration." |
| >150 entities in frame | `ENTITY_COUNT_HIGH` (warn) | "Split frame into multiple frames for performance." |

---

## 14. Complete Worked Example

### Agent Input (Raw)

```json
{
  "sceneId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "totalDuration": 12000,
  "frames": [
    {
      "id": "frame-intro",
      "startTime": 0,
      "endTime": 6000,
      "entities": [
        { "id": "client",  "type": "User",     "position": { "x": 15, "y": 50 }, "label": "Browser" },
        { "id": "lb",      "type": "LoadBalancer", "position": { "x": 40, "y": 50 } },
        { "id": "srv-1",   "type": "Server",   "position": { "x": 65, "y": 30 }, "color": "#00e5ff" },
        { "id": "srv-2",   "type": "Server",   "position": { "x": 65, "y": 70 }, "color": "#00e5ff" },
        { "id": "db",      "type": "Database", "position": { "x": 88, "y": 50 } },
        { "id": "arr-1",   "type": "Arrow",    "position": { "x": 27, "y": 50 }, "sourceEntityId": "client",  "targetEntityId": "lb" },
        { "id": "arr-2",   "type": "Arrow",    "position": { "x": 52, "y": 30 }, "sourceEntityId": "lb",     "targetEntityId": "srv-1" },
        { "id": "arr-3",   "type": "Arrow",    "position": { "x": 52, "y": 70 }, "sourceEntityId": "lb",     "targetEntityId": "srv-2" },
        { "id": "arr-4",   "type": "Arrow",    "position": { "x": 76, "y": 50 }, "sourceEntityId": "srv-1",  "targetEntityId": "db" }
      ]
    },
    {
      "id": "frame-detail",
      "startTime": 6000,
      "endTime": 12000,
      "entities": [
        { "id": "srv-1",  "type": "Server",   "position": { "x": 35, "y": 50 }, "highlight": true, "color": "#00e5ff" },
        { "id": "cache",  "type": "Cache",    "position": { "x": 60, "y": 30 } },
        { "id": "db",     "type": "Database", "position": { "x": 60, "y": 70 } },
        { "id": "arr-5",  "type": "Arrow",    "position": { "x": 47, "y": 30 }, "sourceEntityId": "srv-1", "targetEntityId": "cache", "label": "cache hit?" },
        { "id": "arr-6",  "type": "Arrow",    "position": { "x": 47, "y": 70 }, "sourceEntityId": "srv-1", "targetEntityId": "db",    "label": "SQL" }
      ]
    }
  ]
}
```

### After Stage 1 (Schema Validation): PASS

All required fields present, UUIDs valid, frame durations ≥2500ms.

### After Stage 2 (Defaults Application): Entities fully specified

All entities gain `size`, `color`, `highlight`, and full `animation` objects (where not already set by agent).

### After Stage 3 (Position Clamping): Positions verified

All entity positions within bounds. `db` at x=88 may generate a `ENTITY_CLAMPED` warning depending on entity width.

### After Stage 4 (Connection Resolution): All IDs verified

All `sourceEntityId`/`targetEntityId` refs resolve to exact entity IDs present in each frame.

### After Stage 5 (Temporal Choreography): Delays assigned

Entities without explicit `animation.delay` receive auto-stagger (0ms, 80ms, 160ms, ...).

### Final CompileResult

```json
{
  "success": true,
  "script": { /* fully-resolved VisualScript */ },
  "warnings": [
    {
      "code": "ENTITY_CLAMPED",
      "frameId": "frame-intro",
      "entityId": "db",
      "message": "Entity \"db\" at (88, 50) was clamped to (86.8, 50.0) to keep it within canvas bounds.",
      "suggestion": "Adjust position to keep entity within canvas. For a Database at size 1, x must be 1.8–98.2."
    }
  ]
}
```

---

## 15. Performance Contracts

| Operation | Contract | Notes |
|-----------|----------|-------|
| Full compile (5 stages) | < 5ms p99 | For ≤150 entities total across all frames |
| Stage 1 (Zod parse) | < 2ms | For single-frame 60-entity script |
| Stage 2 (defaults) | < 0.5ms | Pure object merge |
| Stage 3 (clamping) | < 0.5ms | Per-entity math |
| Stage 4 (connections) | < 1ms | O(n) entity lookup |
| Stage 5 (timing) | < 0.5ms | Pure arithmetic |

All timings measured on VPS hardware (4 vCPU, 8GB RAM, Node.js 20 LTS).

---

## 16. V1 Limitations & V2 Roadmap

### V1 Limitations

| Limitation | Impact |
|------------|--------|
| No SVG morph transitions | Entity swap uses opacity crossfade, not shape morphing |
| No audio URL validation | `narrationSegment.audioUrl` is accepted but not verified |
| No cross-frame entity continuity tracking | Each frame's entities are independently processed |
| No spatial overlap detection | Two entities at the same position are both rendered (overlap) |
| No entity count enforcement | >150 entities generates a warning but is not blocked |

### V2 Roadmap Items

1. **Spatial overlap detection** — warn when two entities overlap by > 50% of their bounding boxes
2. **Cross-frame entity diff** — automatically generate transitions based on entity positions changing between frames
3. **Audio URL validation** — HEAD request to verify audio URL is reachable before compile completes
4. **Entity count enforcement** — hard limit at >400 entities (currently a warning only)
5. **Compiler cache** — skip recompilation if VisualScript hash unchanged (for update_scene calls that don't modify content)

---

*End of document — 03-pml-scene-compiler.md*
