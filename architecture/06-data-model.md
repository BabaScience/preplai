# 06 — Data Model

**Package:** `@preplai/shared`  
**Status:** V1 — Authoritative  
**Last Updated:** 2026-02-28  
**Supersedes:** Previous `06-data-model.md` (old SceneGraph / IllustrationMetadata model)

> This document is the single source of truth for all TypeScript interfaces, Zod validation schemas, SQLite table definitions, and data contracts used across the PRE system. Any type that crosses a package boundary must be defined here. No package may maintain competing shapes for cross-cutting concerns.

---

## Table of Contents

1. [Design Philosophy](#1-design-philosophy)
2. [VisualEntity — The Atomic Unit](#2-visualentity--the-atomic-unit)
3. [VisualEntityType Union (88+ Types)](#3-visualentitytype-union-88-types)
4. [IllustrationFrame](#4-illustrationframe)
5. [EntityTransition](#5-entitytransition)
6. [VisualScript](#6-visualscript)
7. [Flat JSON Pattern (Excalidraw-Inspired)](#7-flat-json-pattern-excalidraw-inspired)
8. [Metadata Field — Rich Parameterization](#8-metadata-field--rich-parameterization)
9. [Session Types](#9-session-types)
10. [Zod Validation Schemas](#10-zod-validation-schemas)
11. [SQLite Database Schema](#11-sqlite-database-schema)
12. [TypeScript Interface Reference](#12-typescript-interface-reference)
13. [Type Guards and Utilities](#13-type-guards-and-utilities)
14. [Constants](#14-constants)
15. [Complete JSON Example — Multi-Entity Scene](#15-complete-json-example--multi-entity-scene)
16. [Package Export Map](#16-package-export-map)

---

## 1. Design Philosophy

### VisualEntity Is the Boundary Contract

The agent (LLM) emits `VisualEntity` objects. The renderer consumes them. No other data structure crosses the agent–renderer boundary. All complexity lives inside `VisualEntity` or in the arrays that contain it.

### Flat, Not Nested (Excalidraw-Inspired)

All entities live in a flat array. Relationships between entities are expressed by ID string references (`sourceEntityId`, `targetEntityId`, `parentEntityId`) rather than by object nesting. This is the Excalidraw approach:

- **LLM-friendly:** flat arrays are easier for language models to generate correctly than nested trees
- **Diffable:** frame-to-frame changes are detectable as shallow array diffs
- **O(1) lookup:** any entity can be found by ID in a `Map` without tree traversal
- **Serializable:** no circular references, trivially JSON-safe

### Metadata for Rich Parameterization — No Schema Explosion

Type-specific parameters (e.g., a graph's axes, an equation's LaTeX string) live in `metadata: Record<string, any>`. This avoids schema explosion — adding a new entity type with specialized parameters does not require touching the base `VisualEntity` interface or the Zod schema.

### Agent-Friendly Errors

All error responses include a `suggestion` field — a concise actionable hint written for an LLM caller, describing exactly what to do next.

---

## 2. VisualEntity — The Atomic Unit

`VisualEntity` is the single atomic data unit of the entire illustration system. The agent emits arrays of `VisualEntity` objects inside `IllustrationFrame.entities`. The renderer dispatches each entity to its corresponding component render function via the component registry (`registry[entity.type](entity, parentEl)`).

### Full Interface

```typescript
/**
 * VisualEntity — The atomic rendering unit of the PRE illustration system.
 *
 * The agent emits these; the renderer consumes them.
 * No other data structure crosses the agent–renderer boundary.
 */
export interface VisualEntity {
  // ── Required ────────────────────────────────────────────────────────
  /**
   * Unique within a VisualScript. Use descriptive human-readable strings,
   * e.g. "api-server", "postgres-db", "arrow-srv-to-db".
   * These IDs are also used as SVG element IDs (must be valid HTML/SVG IDs).
   */
  id: string;

  /**
   * Registry key. Maps to a render function in the component registry.
   * Must be one of the values in VisualEntityType.
   * The renderer warns and skips unknown types rather than throwing.
   */
  type: VisualEntityType;

  /**
   * Canvas position as percentage of canvas dimensions.
   * Origin is top-left. (0,0) = top-left corner, (100,100) = bottom-right.
   * This maps to SVG coordinates: x_px = (x / 100) * 1920, y_px = (y / 100) * 1080.
   */
  position: {
    x: number;  // 0 = left edge, 100 = right edge
    y: number;  // 0 = top edge,  100 = bottom edge
  };

  // ── Display Properties ───────────────────────────────────────────────
  /**
   * Uniform scaling multiplier applied to the entity's default dimensions.
   * 1.0 = default size. 0.5 = half size. 2.0 = double size.
   * Uniform across all entity types — size 1 means the same visibility for everyone.
   * Renderer applies: effectiveWidth = defaultWidth * size
   */
  size?: number;

  /**
   * Human-readable label rendered below (or above) the entity body.
   * Supports plain text only — no markdown. Max 80 chars recommended.
   * Also used as the fuzzy match target when sourceEntityId / targetEntityId
   * reference an entity by human name rather than by ID.
   */
  label?: string;

  /**
   * Primary fill color. Accepts any valid CSS color string.
   * Hex preferred: '#4A90D9'. Named colors also valid: 'tomato'.
   * Falls back to ENTITY_DEFAULTS.color if omitted.
   */
  color?: string;

  /**
   * When true, the renderer applies a highlight glow ring around the entity.
   * Used to draw the viewer's attention to the current focus entity.
   */
  highlight?: boolean;

  // ── Animation ────────────────────────────────────────────────────────
  /**
   * Per-entity entrance animation configuration.
   * When omitted, ENTITY_DEFAULTS.animation is applied by the renderer.
   */
  animation?: {
    /**
     * Delay before the entrance animation starts, in milliseconds.
     * Used to stagger entity appearances. Default: 0 for the first entity,
     * increments by INTER_ENTITY_STAGGER_MIN_MS (80ms) for each subsequent entity.
     */
    delay?: number;

    /**
     * Duration of the entrance animation in milliseconds. Default: 450ms.
     */
    duration?: number;

    /**
     * CSS easing function string.
     * Example: 'cubic-bezier(0.22, 1, 0.36, 1)' (spring-like)
     */
    easing?: string;

    /**
     * CSS animation class to apply to the inner <g> element.
     * Available: 'entrance-fadeInUp' | 'entrance-fadeIn' | 'entrance-drawIn' | 'entrance-scaleIn'
     * Default: 'entrance-fadeInUp'
     */
    entrance?: string;
  };

  // ── Relationships (ID References) ────────────────────────────────────
  /**
   * For Arrow / DataFlow types: the entity ID (or label) this arrow originates from.
   * Resolved at render time via exact ID match, then case-insensitive label match,
   * then fuzzy label substring match.
   */
  sourceEntityId?: string;

  /**
   * For Arrow / DataFlow types: the entity ID (or label) this arrow points to.
   */
  targetEntityId?: string;

  /**
   * For entities that belong inside a container (e.g., a Process inside a Group,
   * or a Badge inside a Frame). The renderer uses this to manage z-order and
   * clipping but does NOT nest the DOM elements — the flat structure is preserved.
   */
  parentEntityId?: string;

  // ── Content ──────────────────────────────────────────────────────────
  /**
   * For CodeBlock, Definition, Quote, Annotation, and other text-heavy types.
   * Multi-line content is expressed as a single string with '\n' separators.
   * Max recommended: 2000 chars (longer content should be split across frames).
   */
  textContent?: string;

  /**
   * For CodeBlock: the programming language for syntax highlighting.
   * Examples: 'typescript', 'python', 'sql', 'bash', 'json'
   */
  codeLanguage?: string;

  // ── Rich Parameterization ────────────────────────────────────────────
  /**
   * Type-specific parameters that don't belong on the base interface.
   * See Section 8 for the full per-type metadata reference.
   *
   * The renderer accesses: const meta = entity.metadata ?? {};
   *
   * Examples:
   *   Graph2D: { data: number[][], xLabel: string, yLabel: string, chartType: 'line' | 'bar' }
   *   Equation: { latex: string, fontSize: number, displayMode: boolean }
   *   Table:    { headers: string[], rows: string[][] }
   *   Wave:     { frequency: number, amplitude: number, waveType: 'sine' | 'square' }
   */
  metadata?: Record<string, any>;
}
```

### Agent Minimum Viable Entity

The agent may emit just the required fields. The renderer's `applyDefaults()` function fills in everything else before dispatch:

```json
{ "id": "s1", "type": "Server", "position": { "x": 50, "y": 50 } }
```

---

## 3. VisualEntityType Union (88+ Types)

`VisualEntityType` is a union of string literals. Each value maps to a render function in the component registry. Categories are organizational — they have no runtime significance.

```typescript
export type VisualEntityType =
  // ── Infrastructure ────────────────────────────────────────────────
  | 'User'          // Human user icon
  | 'Server'        // Rack server with LED lines
  | 'Database'      // Cylindrical database symbol
  | 'Container'     // Docker container icon
  | 'Pod'           // Kubernetes pod
  | 'Cloud'         // Cloud silhouette
  | 'Network'       // Network switch/hub
  | 'Device'        // Generic device (phone, laptop, IoT)
  | 'Arrow'         // Directional connector (requires sourceEntityId + targetEntityId)
  | 'DataFlow'      // Animated dashed arrow for data streams
  | 'Process'       // Rounded rectangle for a running process
  | 'Queue'         // Message queue (FIFO lines)
  | 'Cache'         // In-memory cache (database cylinder with flash icon)
  | 'LoadBalancer'  // Load balancer trapezoid
  | 'Service'       // Generic microservice box
  // ── Extended Infrastructure ──────────────────────────────────────
  | 'Firewall'      // Shield/wall icon
  | 'APIGateway'    // API gateway door icon
  | 'Lambda'        // Serverless function (λ symbol)
  | 'Subnet'        // Network subnet rectangle
  | 'Volume'        // Storage volume (disk)
  | 'Registry'      // Container registry
  | 'Monitor'       // Monitoring/metrics dashboard
  | 'Pipeline'      // CI/CD pipeline stages
  | 'Decision'      // Diamond decision node (for flow diagrams)
  | 'Cluster'       // Kubernetes cluster boundary
  // ── User & Flow ──────────────────────────────────────────────────
  | 'BidirectArrow' // Arrow with heads at both ends
  | 'DottedArrow'   // Dashed/dotted connector for optional/async flows
  // ── Abstract & Universal ─────────────────────────────────────────
  | 'Concept'       // Generic concept bubble
  | 'Entity'        // Generic rectangular entity
  | 'Group'         // Visual grouping frame (labeled boundary box)
  | 'Label'         // Floating text label without shape
  | 'Comparison'    // Side-by-side comparison panel
  | 'Timeline'      // Horizontal/vertical timeline with milestones
  | 'Metric'        // KPI/metric card (large number + label)
  | 'Cycle'         // Circular lifecycle diagram
  | 'Stack'         // Vertical layer stack (OSI model, tech stack)
  | 'Tree'          // Hierarchical tree diagram
  | 'Badge'         // Pill/badge label (status indicators)
  | 'Quote'         // Pull quote with attribution
  // ── Math & Science ───────────────────────────────────────────────
  | 'Equation'      // Rendered LaTeX equation (requires metadata.latex)
  | 'Expression'    // Inline math expression
  | 'Matrix'        // Rendered matrix/vector (requires metadata.rows)
  | 'Graph2D'       // 2D chart: line, bar, scatter (requires metadata.data)
  | 'NumberLine'    // Number line with labeled points
  | 'CoordinateSystem' // 2D coordinate axes with optional function plot
  // ── Physics ──────────────────────────────────────────────────────
  | 'FreeBodyDiagram' // Object with force vectors
  | 'Circuit'       // Electronic circuit diagram
  | 'Wave'          // Waveform visualization (sine, square, sawtooth)
  | 'Vector'        // Mathematical vector (arrow with magnitude label)
  | 'Field'         // Field lines visualization (electric, magnetic)
  | 'Particle'      // Particle with charge/spin labels
  // ── General Purpose ──────────────────────────────────────────────
  | 'Table'         // Data table with headers/rows (requires metadata.headers + metadata.rows)
  | 'Histogram'     // Histogram (frequency distribution bars)
  | 'PieChart'      // Pie / donut chart
  | 'FlowDiagram'   // Generic flowchart
  | 'VennDiagram'   // Overlapping circles for set relationships
  | 'Annotation'    // Text callout with pointer line
  | 'BarChart'      // Horizontal or vertical bar chart
  | 'ScatterPlot'   // X-Y scatter plot
  // ── Pedagogical ──────────────────────────────────────────────────
  | 'StepList'      // Numbered step sequence
  | 'CodeBlock'     // Syntax-highlighted code block (requires textContent + codeLanguage)
  | 'Definition'    // Formatted definition (term + body)
  | 'Callout'       // Highlighted callout box (tip / warning / note)
  | 'Proof'         // Mathematical proof steps
  | 'Analogy'       // Side-by-side analogy panel
  // ── Data Structures ──────────────────────────────────────────────
  | 'Array'         // Indexed cell array with per-cell highlight/value
  | 'LinkedList'    // Chain of value→next nodes
  | 'BinaryTree'    // Node-edge tree with layout algorithm
  | 'HashTable'     // Bucket array with key→value entries
  | 'Heap'          // Binary heap with array-backed visualization
  | 'GraphDS'       // Node-edge graph (graph theory, not chart)
  | 'Trie'          // Prefix tree with character-per-edge
  // ── Algorithm Visualization ───────────────────────────────────────
  | 'ArrayCell'     // Single highlightable cell (used inside Array compositions)
  | 'Pointer'       // Named index/reference arrow
  | 'RecursionTree' // Call stack tree showing recursive calls
  // ── Automata & Theory ────────────────────────────────────────────
  | 'FSM'           // Finite state machine with states and labeled transitions
  | 'StateNode'     // Individual state circle (for composition)
  | 'Transition'    // Labeled arc between states
  // ── Computer Architecture ─────────────────────────────────────────
  | 'CPU'           // Processor block with ALU, registers, control unit
  | 'Register'      // Register file with named slots and bit values
  | 'MemoryBlock'   // Address-range memory with labeled sections
  | 'LogicGate'     // AND/OR/NOT/XOR/NAND gate symbol
  | 'Bus'           // Data/address bus connecting components
  // ── Operating Systems ────────────────────────────────────────────
  | 'ProcessBlock'  // OS process with PID, state, priority
  | 'MemoryMap'     // Virtual memory map with segments (stack/heap/text/data)
  | 'Thread'        // Thread with state indicator (running/waiting/blocked)
  // ── Networking ───────────────────────────────────────────────────
  | 'Packet'        // Network packet with header/payload sections
  | 'ProtocolStack' // Layered protocol stack (OSI/TCP-IP)
  // ── Machine Learning ─────────────────────────────────────────────
  | 'NeuralNetwork'     // Layer diagram with nodes and weighted edges
  | 'DecisionBoundary'  // 2D classification boundary visualization;
```

### Type Categories (Runtime: No Effect; Documentation Only)

| Category | Types | Count |
|----------|-------|-------|
| Infrastructure | User, Server, Database, Container, Pod, Cloud, Network, Device, Arrow, DataFlow, Process, Queue, Cache, LoadBalancer, Service | 15 |
| Extended Infrastructure | Firewall, APIGateway, Lambda, Subnet, Volume, Registry, Monitor, Pipeline, Decision, Cluster | 10 |
| Flow / Connection | BidirectArrow, DottedArrow | 2 |
| Abstract / Universal | Concept, Entity, Group, Label, Comparison, Timeline, Metric, Cycle, Stack, Tree, Badge, Quote | 12 |
| Math & Science | Equation, Expression, Matrix, Graph2D, NumberLine, CoordinateSystem | 6 |
| Physics | FreeBodyDiagram, Circuit, Wave, Vector, Field, Particle | 6 |
| General Purpose | Table, Histogram, PieChart, FlowDiagram, VennDiagram, Annotation, BarChart, ScatterPlot | 8 |
| Pedagogical | StepList, CodeBlock, Definition, Callout, Proof, Analogy | 6 |
| Data Structures | Array, LinkedList, BinaryTree, HashTable, Heap, GraphDS, Trie | 7 |
| Algorithm Visualization | ArrayCell, Pointer, RecursionTree | 3 |
| Automata & Theory | FSM, StateNode, Transition | 3 |
| Computer Architecture | CPU, Register, MemoryBlock, LogicGate, Bus | 5 |
| Operating Systems | ProcessBlock, MemoryMap, Thread | 3 |
| Networking | Packet, ProtocolStack | 2 |
| Machine Learning | NeuralNetwork, DecisionBoundary | 2 |
| **Total** | | **90** |

---

## 4. IllustrationFrame

A `IllustrationFrame` represents one atomic visual state of a scene — all the entities visible at a given time window, plus their entrance transitions and synchronized narration.

```typescript
/**
 * A single visual frame in a VisualScript.
 *
 * The renderer transitions from the previous frame to this frame at startTime.
 * All entities in this frame's entities[] array are rendered on the canvas.
 * Entities not in this frame's array do not appear (canvas is fully re-rendered
 * from scratch on each frame transition).
 */
export interface IllustrationFrame {
  /** Unique frame identifier within the VisualScript. */
  id: string;

  /**
   * Frame start time in milliseconds, relative to VisualScript start (t=0).
   * The renderer transitions to this frame when elapsed >= startTime.
   */
  startTime: number;

  /**
   * Frame end time in milliseconds.
   * The renderer auto-advances to the next frame when elapsed >= endTime.
   * (endTime - startTime) = frame duration.
   */
  endTime: number;

  /**
   * All VisualEntity objects visible during this frame.
   * Rendered in array order (earlier items have lower z-order by default).
   * Arrow types are extracted and rendered last so they can resolve
   * source/target positions from already-rendered entities.
   *
   * The canvas is fully cleared before each frame render.
   * Any entity not present in this array does not appear.
   */
  entities: VisualEntity[];

  /**
   * GSAP-driven property transitions applied when entering this frame
   * from the previous frame. These animate specific entities smoothly
   * rather than cutting.
   *
   * Empty array or omitted = instant cut (all entities appear with
   * only their CSS entrance animations).
   */
  transitions?: EntityTransition[];

  /**
   * The narration text spoken by the agent during this frame.
   * Synchronized with the frame's time window.
   * Used for TTS generation and subtitle rendering.
   */
  narrationSegment: string;

  /**
   * Human-readable description of what this frame shows.
   * Used for debugging, accessibility alt text, and agent self-correction.
   * Example: "API server sends SQL query to Postgres database"
   */
  description: string;
}
```

---

## 5. EntityTransition

An `EntityTransition` describes a GSAP-driven property tween applied when the renderer enters a new frame. Rather than instantly replacing entity states, the renderer can smoothly animate specific properties from `from` to `to`.

```typescript
/**
 * A GSAP tween applied during frame transition.
 *
 * The renderer resolves the target entity by ID, then runs:
 *   gsap.fromTo(`#${entityId}`, { ...from }, { ...to, duration: duration/1000, ease: easing })
 *
 * Only GPU-accelerated properties are permitted:
 *   - opacity
 *   - transform (via position changes → translate())
 *   - scale (via size changes)
 * Animating layout-reflow properties (x attribute, width, fill) is prohibited
 * per Performance Contract 5.
 */
export interface EntityTransition {
  /** The ID of the entity to transition. Must exist in the current frame's entities[]. */
  entityId: string;

  /**
   * Property values at the START of the transition.
   * Typically the entity's state in the previous frame.
   * Uses Partial<VisualEntity> — only include properties being transitioned.
   */
  from: Partial<VisualEntity>;

  /**
   * Property values at the END of the transition.
   * The entity's final state in this frame.
   */
  to: Partial<VisualEntity>;

  /** Transition duration in milliseconds. */
  duration: number;

  /**
   * GSAP easing string.
   * Common values: 'power2.out' | 'power2.inOut' | 'elastic.out(1, 0.3)' | 'none'
   * Default: 'power2.out'
   */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | string;
}
```

### Example — Moving an entity between frames

```json
{
  "entityId": "api-server",
  "from": { "position": { "x": 50, "y": 50 } },
  "to":   { "position": { "x": 25, "y": 50 } },
  "duration": 600,
  "easing": "power2.inOut"
}
```

---

## 6. VisualScript

A `VisualScript` is the complete frame-by-frame specification for one scene's visual content. This is the top-level object pushed to the player via the `add_scene` MCP tool.

```typescript
/**
 * The complete visual script for one scene.
 *
 * This is the object emitted by the agent and received by the player.
 * The player's scene controller iterates frames[] and calls the renderer
 * for each frame in sequence.
 *
 * sceneId ties the VisualScript to the session in the database.
 * frames[] is ordered by startTime.
 * entities is an optional global entity registry for ID lookups across frames.
 */
export interface VisualScript {
  /**
   * Matches the session ID in the MCP server.
   * Used by the player to verify it is rendering the correct session's script.
   */
  sceneId: string;

  /**
   * Ordered array of frames. Must contain at least one frame.
   * Frames should be ordered ascending by startTime.
   * The last frame's endTime equals totalDuration.
   */
  frames: IllustrationFrame[];

  /**
   * Total script duration in milliseconds.
   * Should equal frames[frames.length - 1].endTime.
   * The player uses this to compute progress indicators.
   */
  totalDuration: number;

  /**
   * Optional flat registry of all entities referenced in any frame.
   * Key: entity.id, Value: the VisualEntity.
   *
   * Purpose: Arrow entities in frame N may reference entities that only
   * appear in frame N-1. This global registry allows the renderer to
   * resolve cross-frame ID references when building the SSE-received
   * script before frame-by-frame playback begins.
   *
   * This is NOT required — entities[] inside each frame is the primary source.
   */
  entities?: Record<string, VisualEntity>;
}
```

### Invariants

| Invariant | Description |
|-----------|-------------|
| `frames.length >= 1` | At least one frame required |
| `frames[i].startTime < frames[i].endTime` | Each frame has positive duration |
| `frames[i].endTime <= frames[i+1].startTime` | Frames do not overlap |
| `frames[last].endTime === totalDuration` | Last frame ends at total duration |
| All `sourceEntityId` / `targetEntityId` references resolve within `entities[]` or `entities` registry | Arrow render pass validates this |

---

## 7. Flat JSON Pattern (Excalidraw-Inspired)

The data model uses a **deliberately flat structure**. All entities live in a single array, with relationships expressed as ID string references rather than nested objects.

### Flat (Correct)

```json
{
  "entities": [
    { "id": "box-1",  "type": "Group",    "position": { "x": 10, "y": 10 }, "label": "Backend" },
    { "id": "srv-1",  "type": "Server",   "position": { "x": 30, "y": 30 }, "parentEntityId": "box-1" },
    { "id": "db-1",   "type": "Database", "position": { "x": 70, "y": 30 } },
    { "id": "arr-1",  "type": "Arrow",    "position": { "x": 50, "y": 30 }, "sourceEntityId": "srv-1", "targetEntityId": "db-1", "label": "SQL" }
  ]
}
```

### Nested (Incorrect — Never Use This)

```json
{
  "entities": [
    {
      "id": "box-1",
      "type": "Group",
      "children": [          // ✗ nested structure
        { "id": "srv-1", "type": "Server" }
      ],
      "connections": [        // ✗ nested connections
        { "from": "srv-1", "to": "db-1" }
      ]
    }
  ]
}
```

### Why Flat Is Better for LLMs

1. **No ambiguity about nesting level.** The model never has to decide where to insert a new entity.
2. **Each entity is self-contained.** Partial construction of nested objects is a common LLM failure mode.
3. **Array append is simpler than tree insertion.**
4. **Reviewer tools (diff, patch) work on flat lists natively.**

### ID Reference Resolution

The renderer resolves entity references in this priority order:

1. **Exact ID match:** `entities.find(e => e.id === ref)`
2. **Exact label match (case-insensitive):** `entities.find(e => e.label?.toLowerCase() === ref.toLowerCase())`
3. **Fuzzy label contains (case-insensitive):** `entities.find(e => e.label?.toLowerCase().includes(ref.toLowerCase()))`
4. **Not found → warning + skip** (never throws)

```typescript
function resolveEntityRef(ref: string, allEntities: VisualEntity[]): VisualEntity | null {
  // 1. Exact ID
  let entity = allEntities.find(e => e.id === ref);
  if (entity) return entity;

  // 2. Exact label (case-insensitive)
  entity = allEntities.find(e => e.label?.toLowerCase() === ref.toLowerCase());
  if (entity) return entity;

  // 3. Fuzzy label
  entity = allEntities.find(e => e.label?.toLowerCase().includes(ref.toLowerCase()));
  return entity ?? null;
}
```

---

## 8. Metadata Field — Rich Parameterization

The `metadata` field on `VisualEntity` carries type-specific parameters that exceed the base interface. The renderer accesses it as `const meta = entity.metadata ?? {}`. The `metadata` field is always `Record<string, any>` — never a typed subtype — to prevent schema explosion.

### Full Metadata Reference by Type

| Entity Type | Required `metadata` Fields | Optional `metadata` Fields |
|-------------|---------------------------|---------------------------|
| `Graph2D` | `data: number[][]` | `xLabel: string`, `yLabel: string`, `chartType: 'line'\|'bar'\|'scatter'`, `xRange: [number,number]`, `yRange: [number,number]` |
| `Equation` | `latex: string` | `fontSize: number`, `displayMode: boolean` (true = block, false = inline) |
| `Expression` | `latex: string` | `fontSize: number` |
| `Matrix` | `rows: number[][]` | `rowLabels: string[]`, `colLabels: string[]`, `bracketStyle: '('\|'['\|'{'` |
| `NumberLine` | `min: number`, `max: number` | `points: {value: number, label: string}[]`, `highlightRange: [number,number]` |
| `CoordinateSystem` | — | `xRange: [number,number]`, `yRange: [number,number]`, `functions: {expr: string, color: string}[]`, `points: {x: number, y: number, label: string}[]` |
| `Wave` | — | `frequency: number`, `amplitude: number`, `phase: number`, `waveType: 'sine'\|'square'\|'sawtooth'\|'triangle'` |
| `Circuit` | `components: CircuitComponent[]`, `connections: CircuitConnection[]` | — |
| `FreeBodyDiagram` | — | `forces: {label: string, angle: number, magnitude: number, color: string}[]` |
| `Field` | — | `fieldType: 'electric'\|'magnetic'\|'gravitational'`, `charges: {x: number, y: number, charge: number}[]` |
| `Table` | `headers: string[]`, `rows: string[][]` | `highlightRows: number[]`, `columnWidths: number[]` |
| `Histogram` | `bins: {label: string, value: number}[]` | `xLabel: string`, `yLabel: string`, `color: string` |
| `BarChart` | `bars: {label: string, value: number, color?: string}[]` | `xLabel: string`, `yLabel: string`, `horizontal: boolean` |
| `ScatterPlot` | `points: {x: number, y: number, label?: string}[]` | `xLabel: string`, `yLabel: string`, `xRange: [number,number]`, `yRange: [number,number]` |
| `PieChart` | `slices: {label: string, value: number, color?: string}[]` | `donut: boolean`, `showPercentages: boolean` |
| `VennDiagram` | `sets: {label: string, color?: string}[]`, `overlaps: {sets: number[], label: string}[]` | — |
| `CodeBlock` | — | (uses `textContent` for code, `codeLanguage` for language) `highlightLines: number[]`, `showLineNumbers: boolean` |
| `Timeline` | `events: {label: string, time: string, description?: string}[]` | `orientation: 'horizontal'\|'vertical'` |
| `Stack` | `layers: {label: string, color?: string}[]` | `direction: 'top-down'\|'bottom-up'` |
| `Comparison` | `leftLabel: string`, `rightLabel: string`, `rows: {aspect: string, left: string, right: string}[]` | — |
| `Metric` | `value: string\|number` | `unit: string`, `trend: 'up'\|'down'\|'flat'`, `trendValue: string` |
| `Proof` | `steps: {label: string, content: string, justification?: string}[]` | — |
| `Callout` | — | `variant: 'tip'\|'warning'\|'note'\|'danger'` (uses `textContent` for body) |
| `Definition` | `term: string`, `body: string` | — |
| `StepList` | `steps: string[]` | `currentStep: number`, `checkmarks: boolean` |

### Accessing Metadata in Render Functions

```javascript
function renderGraph2D(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);
  const meta = entity.metadata ?? {};

  const data      = meta.data      ?? [];
  const chartType = meta.chartType ?? 'line';
  const xLabel    = meta.xLabel    ?? 'x';
  const yLabel    = meta.yLabel    ?? 'y';
  const xRange    = meta.xRange    ?? [0, data.length];
  const yRange    = meta.yRange    ?? [0, Math.max(...data.flat())];

  // ... render chart into innerG ...

  parentEl.appendChild(outerG);
  return outerG;
}
```

---

## 9. Session Types

These types govern the server-side session and scene lifecycle in the SQLite database.

```typescript
// ── Session States ────────────────────────────────────────────────────────────

/**
 * Lifecycle state of a presentation session.
 *
 * idle       → session created, no VisualScript received yet
 * building   → agent is actively pushing scenes / entities
 * ready      → VisualScript fully built; player can begin playback
 * playing    → player has connected and is rendering
 * completed  → all frames have played; session may be archived
 */
export type SessionState = 'idle' | 'building' | 'ready' | 'playing' | 'completed';

/**
 * Persistence status of the session row.
 *
 * active   → within TTL, all operations permitted
 * expired  → TTL elapsed; reads allowed, mutations rejected
 * archived → explicitly closed; immutable
 */
export type SessionStatus = 'active' | 'expired' | 'archived';

// ── Session Record ────────────────────────────────────────────────────────────

export interface Session {
  /** UUID v4, primary key. */
  id: string;

  /** Human-readable presentation title. */
  title: string;

  /** Optional subject domain hint for theme selection. */
  domain?: string;

  state: SessionState;
  status: SessionStatus;

  /** Ordered array of scene IDs for this session. */
  sceneIds: string[];

  createdAt: string;  // ISO-8601
  updatedAt: string;  // ISO-8601
  expiresAt: string;  // ISO-8601
}

// ── Scene Record ──────────────────────────────────────────────────────────────

export interface SceneRecord {
  /** UUID v4, primary key. */
  id: string;

  /** Foreign key → sessions.id */
  sessionId: string;

  /**
   * Zero-based ordering index within the session.
   * Maintained by the server; agents can request specific positions.
   */
  orderIndex: number;

  /**
   * The VisualScript JSON stored as TEXT in SQLite.
   * Serialized with JSON.stringify; parsed with JSON.parse on reads.
   */
  visualScriptJson: string;

  /** Narration text for this scene (may also be embedded in VisualScript frames). */
  narrationText?: string;

  /** Schema version for forward-compatibility of stored JSON. */
  schemaVersion: number;

  createdAt: string;  // ISO-8601
  updatedAt: string;  // ISO-8601
}
```

---

## 10. Zod Validation Schemas

These schemas are the single source of validation truth. They are defined in `server/schemas/visual.ts` and imported by both the MCP server tool handlers and the REST endpoint request handlers. This guarantees schema parity across the full pipeline.

```typescript
// server/schemas/visual.ts
import { z } from 'zod';

// ── VisualEntity Schema ───────────────────────────────────────────────────────

export const VisualEntitySchema = z.object({
  id: z.string().min(1).max(128),
  type: z.string().min(1),  // validated against registry at render time, not at schema time

  position: z.object({
    x: z.number().min(0).max(100),
    y: z.number().min(0).max(100),
  }),

  size:      z.number().positive().max(10).optional(),
  label:     z.string().max(200).optional(),
  color:     z.string().max(50).optional(),
  highlight: z.boolean().optional(),

  animation: z.object({
    delay:    z.number().min(0).max(60_000).optional(),
    duration: z.number().min(0).max(10_000).optional(),
    easing:   z.string().max(100).optional(),
    entrance: z.string().max(100).optional(),
  }).optional(),

  sourceEntityId: z.string().max(128).optional(),
  targetEntityId: z.string().max(128).optional(),
  parentEntityId: z.string().max(128).optional(),

  textContent:  z.string().max(10_000).optional(),
  codeLanguage: z.string().max(50).optional(),
  metadata:     z.record(z.unknown()).optional(),
});

export type VisualEntityInput = z.infer<typeof VisualEntitySchema>;


// ── EntityTransition Schema ───────────────────────────────────────────────────

export const EntityTransitionSchema = z.object({
  entityId: z.string().min(1).max(128),
  from:     z.record(z.unknown()),
  to:       z.record(z.unknown()),
  duration: z.number().min(0).max(10_000),
  easing:   z.string().max(100).optional(),
});


// ── IllustrationFrame Schema ──────────────────────────────────────────────────

export const IllustrationFrameSchema = z.object({
  id:        z.string().min(1).max(128),
  startTime: z.number().min(0),
  endTime:   z.number().min(0),

  entities:    z.array(VisualEntitySchema).min(0).max(150),
  transitions: z.array(EntityTransitionSchema).optional(),

  narrationSegment: z.string().max(5000),
  description:      z.string().max(500),
}).refine(
  (f) => f.endTime > f.startTime,
  { message: 'Frame endTime must be greater than startTime.' }
);


// ── VisualScript Schema ───────────────────────────────────────────────────────

export const VisualScriptSchema = z.object({
  sceneId:       z.string().uuid(),
  frames:        z.array(IllustrationFrameSchema).min(1).max(100),
  totalDuration: z.number().min(0).max(3_600_000),  // max 1 hour
  entities:      z.record(VisualEntitySchema).optional(),
}).refine(
  (s) => s.totalDuration >= (s.frames.at(-1)?.endTime ?? 0),
  { message: 'totalDuration must be >= last frame endTime.' }
);

export type VisualScriptInput = z.infer<typeof VisualScriptSchema>;


// ── VisualEntityPatch Schema (for update_scene MCP tool) ─────────────────────

export const VisualEntityPatchSchema = z.object({
  label:     z.string().max(200).optional(),
  color:     z.string().max(50).optional(),
  highlight: z.boolean().optional(),
  position:  z.object({ x: z.number(), y: z.number() }).optional(),
  size:      z.number().positive().max(10).optional(),
  metadata:  z.record(z.unknown()).optional(),
});

export type VisualEntityPatch = z.infer<typeof VisualEntityPatchSchema>;


// ── Session Schema ────────────────────────────────────────────────────────────

export const CreateSessionSchema = z.object({
  title:       z.string().min(1).max(200),
  domain:      z.string().max(100).optional(),
  ttlSeconds:  z.number().int().min(60).max(86_400).optional(),
});

export type CreateSessionInput = z.infer<typeof CreateSessionSchema>;


// ── API Key Schema ────────────────────────────────────────────────────────────

export const CreateApiKeySchema = z.object({
  tier:          z.enum(['developer', 'startup', 'scale']),
  expiresInDays: z.number().int().positive().optional(),
});

export type CreateApiKeyInput = z.infer<typeof CreateApiKeySchema>;
```

---

## 11. SQLite Database Schema

The server uses SQLite via `better-sqlite3`. All DDL is applied at startup via `runMigrations()` with WAL mode enabled.

### Pragmas

```sql
PRAGMA journal_mode = WAL;       -- Concurrent readers don't block writers
PRAGMA foreign_keys = ON;        -- Enforce ON DELETE CASCADE
PRAGMA synchronous = NORMAL;     -- Performance: safe with WAL
PRAGMA cache_size = -64000;      -- 64 MB page cache
```

### Full DDL

```sql
-- ════════════════════════════════════════════════════════════════════
-- api_keys
-- Stores SHA-256 hashes of issued API keys. Plaintext never stored.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS api_keys (
  id           INTEGER  PRIMARY KEY AUTOINCREMENT,
  key_hash     TEXT     NOT NULL UNIQUE,
    -- SHA-256(raw_key), hex-encoded. Raw key is returned once at creation.
  tier         TEXT     NOT NULL
                 CHECK(tier IN ('developer', 'startup', 'scale')),
    -- Rate limit tier. Maps to requests/minute in TIER_LIMITS constant.
  rate_limit   INTEGER  NOT NULL,
    -- Cached from TIER_LIMITS[tier] at creation time.
  created_at   INTEGER  NOT NULL DEFAULT (unixepoch()),
  expires_at   INTEGER  NULL
    -- NULL = never expires. Unix timestamp when key should be rejected.
);

CREATE INDEX IF NOT EXISTS idx_api_keys_hash
  ON api_keys(key_hash);

CREATE INDEX IF NOT EXISTS idx_api_keys_expires
  ON api_keys(expires_at) WHERE expires_at IS NOT NULL;


-- ════════════════════════════════════════════════════════════════════
-- sessions
-- One row per presentation session.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sessions (
  id           TEXT     PRIMARY KEY,
    -- UUID v4 generated by the server. Also the MCP session identifier.
  api_key_id   INTEGER  NOT NULL
                 REFERENCES api_keys(id) ON DELETE CASCADE,
  title        TEXT     NOT NULL,
  domain       TEXT     NULL,
    -- Optional domain hint: 'distributed systems', 'machine learning', etc.
  state        TEXT     NOT NULL DEFAULT 'idle'
                 CHECK(state IN ('idle', 'building', 'ready', 'playing', 'completed')),
  status       TEXT     NOT NULL DEFAULT 'active'
                 CHECK(status IN ('active', 'expired', 'archived')),
  created_at   INTEGER  NOT NULL DEFAULT (unixepoch()),
  updated_at   INTEGER  NOT NULL DEFAULT (unixepoch()),
  expires_at   INTEGER  NOT NULL
    -- Computed as created_at + ttlSeconds. Default TTL: 14400 seconds (4 hours).
);

CREATE INDEX IF NOT EXISTS idx_sessions_api_key
  ON sessions(api_key_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status_expires
  ON sessions(status, expires_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_sessions_state
  ON sessions(state);


-- ════════════════════════════════════════════════════════════════════
-- scenes
-- One row per scene within a session.
-- The visual_script_json column stores the full serialized VisualScript.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS scenes (
  id                  TEXT     PRIMARY KEY,
    -- UUID v4.
  session_id          TEXT     NOT NULL
                        REFERENCES sessions(id) ON DELETE CASCADE,
  order_index         INTEGER  NOT NULL DEFAULT 0,
    -- Zero-based. Maintained by the server. Agents may request specific positions.
  visual_script_json  TEXT     NOT NULL DEFAULT '{}',
    -- JSON.stringify(VisualScript). Parsed on reads.
    -- '{}' = empty scene placeholder before add_scene is called.
  narration_text      TEXT     NULL,
    -- Top-level narration for the scene. May duplicate frame-level narration.
  schema_version      INTEGER  NOT NULL DEFAULT 1,
    -- Incremented when the VisualScript JSON shape changes.
    -- Used for forward-compatibility migrations on reads.
  created_at          INTEGER  NOT NULL DEFAULT (unixepoch()),
  updated_at          INTEGER  NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_scenes_session_order
  ON scenes(session_id, order_index);

CREATE INDEX IF NOT EXISTS idx_scenes_session
  ON scenes(session_id);


-- ════════════════════════════════════════════════════════════════════
-- narrations
-- Optional pre-generated TTS audio metadata for scenes.
-- Populated by the narration pipeline, not by the MCP server directly.
-- ════════════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS narrations (
  id            INTEGER  PRIMARY KEY AUTOINCREMENT,
  scene_id      TEXT     NOT NULL
                  REFERENCES scenes(id) ON DELETE CASCADE,
  frame_index   INTEGER  NOT NULL DEFAULT -1,
    -- -1 = scene-level narration. >= 0 = per-frame narration.
  audio_url     TEXT     NULL,
    -- Public URL of the pre-generated TTS audio file.
  duration_ms   INTEGER  NULL,
    -- Duration of the audio clip in milliseconds.
  word_timestamps TEXT   NULL,
    -- JSON array of { word: string, start: number, end: number }.
  created_at    INTEGER  NOT NULL DEFAULT (unixepoch()),
  UNIQUE(scene_id, frame_index)
);

CREATE INDEX IF NOT EXISTS idx_narrations_scene
  ON narrations(scene_id);


-- ════════════════════════════════════════════════════════════════════
-- sse_subscribers (in-memory tracking, not actually stored)
-- NOTE: SSE subscriber state is held in process memory as a Map.
-- This table is documentation-only to describe the in-memory structure.
-- ════════════════════════════════════════════════════════════════════
-- In JavaScript (server/sse.ts):
--   const sseSubscribers = new Map<string, Set<FastifyReply>>();
--   // sessionId → Set of active SSE reply objects
```

### Migration Script

```typescript
// server/db/migrate.ts
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

export function runMigrations(db: Database.Database): void {
  // Apply WAL mode and safety pragmas first
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('synchronous = NORMAL');
  db.pragma('cache_size = -64000');

  // Run DDL — idempotent CREATE TABLE IF NOT EXISTS
  const schema = fs.readFileSync(
    path.join(__dirname, 'schema.sql'),
    'utf8'
  );
  db.exec(schema);
}
```

### Schema Notes

| Design Decision | Rationale |
|----------------|-----------|
| `visual_script_json TEXT` stores full VisualScript | Avoids 5+ join tables for entities/frames. Scene data is always read/written atomically. |
| `schema_version INTEGER` on scenes | Forward-compatibility: future migrations can transform old JSON shapes on read. |
| `api_key_id → sessions` CASCADE | Deleting an API key cascades to sessions, then to scenes and narrations. |
| WAL mode | Allows concurrent reads from player SSE connections without blocking writes from the MCP server. |
| Timestamps as Unix integers | `better-sqlite3`'s synchronous API makes integer timestamps simpler than ISO strings; `unixepoch()` is a native SQLite function. |

---

## 12. TypeScript Interface Reference

Complete consolidated interface definitions for `@preplai/shared/types.ts`.

```typescript
// ── Canvas Constants ──────────────────────────────────────────────────────────

/** SVG canvas width in pixels. 16:9 at 1920px. */
export const CANVAS_WIDTH  = 1920 as const;

/** SVG canvas height in pixels. 16:9 at 1920px. */
export const CANVAS_HEIGHT = 1080 as const;

/** viewBox string for the SVG root element. */
export const CANVAS_VIEW_BOX = '0 0 1920 1080' as const;

/** Aspect ratio (16:9). */
export const CANVAS_ASPECT_RATIO = CANVAS_WIDTH / CANVAS_HEIGHT; // 1.7̄7̄7̄

/** Canvas background color (cinematic dark). */
export const CANVAS_BG_COLOR = '#0f0f1a' as const;


// ── Timing Constants ─────────────────────────────────────────────────────────

/** Minimum frame duration in milliseconds. */
export const FRAME_DURATION_MIN_MS = 2_500 as const;

/** Default inter-entity entrance stagger in milliseconds. */
export const INTER_ENTITY_STAGGER_MS = 80 as const;

/** Minimum animation delay in milliseconds. */
export const ANIMATION_DELAY_MIN_MS = 150 as const;

/** Minimum entity visible time before frame advance in milliseconds. */
export const ENTITY_MIN_VISIBLE_MS = 1_200 as const;

/** Default entrance animation duration in milliseconds. */
export const DEFAULT_ENTRANCE_DURATION_MS = 450 as const;


// ── Limits ────────────────────────────────────────────────────────────────────

/** Maximum animated SVG elements per canvas at any time. */
export const MAX_ANIMATED_ELEMENTS = 500 as const;

/** Warn threshold — scene controller emits console.warn above this. */
export const ENTITY_COUNT_WARN_THRESHOLD = 150 as const;

/** Error threshold — scene controller emits console.error above this. */
export const ENTITY_COUNT_ERROR_THRESHOLD = 400 as const;

/** Maximum frames per VisualScript. */
export const MAX_FRAMES_PER_SCRIPT = 100 as const;

/** Maximum entities per frame. */
export const MAX_ENTITIES_PER_FRAME = 150 as const;

/** Default session TTL in seconds (4 hours). */
export const SESSION_TTL_DEFAULT_SECONDS = 14_400 as const;

/** Maximum session TTL in seconds (24 hours). */
export const SESSION_TTL_MAX_SECONDS = 86_400 as const;


// ── Entity Defaults ───────────────────────────────────────────────────────────

export const ENTITY_DEFAULTS = {
  size:      1.0,
  color:     '#4A90D9',
  highlight: false,
  animation: {
    delay:    0,
    duration: DEFAULT_ENTRANCE_DURATION_MS,
    easing:   'cubic-bezier(0.22, 1, 0.36, 1)',
    entrance: 'entrance-fadeInUp',
  },
} as const;


// ── Rate Limit Tiers ──────────────────────────────────────────────────────────

export const TIER_RATE_LIMITS: Record<'developer' | 'startup' | 'scale', number> = {
  developer: 100,   // requests/minute
  startup:   500,
  scale:     2_000,
} as const;


// ── Error Codes ───────────────────────────────────────────────────────────────

export type ApiErrorCode =
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_ARCHIVED'
  | 'SCENE_NOT_FOUND'
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN';

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  /** Actionable hint for LLM callers. Describes exactly what to do next. */
  suggestion: string;
  details?: Record<string, unknown>;
}

export type ApiResponse<T> =
  | { success: true;  data: T }
  | { success: false; error: ApiError };

export const ok   = <T>(data: T): ApiResponse<T>         => ({ success: true, data });
export const fail = (
  code: ApiErrorCode,
  message: string,
  suggestion: string,
  details?: Record<string, unknown>
): ApiResponse<never> => ({
  success: false,
  error: { code, message, suggestion, details },
});


// ── MCP Tool Result Envelope ──────────────────────────────────────────────────

/** Wrapper for all MCP tool return values. */
export type McpToolResult<T> =
  | { ok: true;  result: T }
  | { ok: false; error: Pick<ApiError, 'code' | 'message' | 'suggestion'> };
```

---

## 13. Type Guards and Utilities

```typescript
// ── Entity Guards ─────────────────────────────────────────────────────────────

export const isVisualEntity = (v: unknown): v is VisualEntity =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as VisualEntity).id   === 'string' &&
  typeof (v as VisualEntity).type === 'string' &&
  typeof (v as VisualEntity).position === 'object';

export const isArrowType = (type: VisualEntityType): boolean =>
  type === 'Arrow' || type === 'DataFlow' || type === 'BidirectArrow' || type === 'DottedArrow';

export const isConnectionType = (type: VisualEntityType): boolean =>
  isArrowType(type);

export const requiresMetadata = (type: VisualEntityType): boolean =>
  ['Graph2D', 'Equation', 'Matrix', 'Table', 'Circuit', 'FreeBodyDiagram',
   'Comparison', 'Proof', 'Timeline', 'Stack', 'PieChart',
   'Histogram', 'BarChart', 'ScatterPlot', 'VennDiagram', 'StepList',
   'Definition'].includes(type);


// ── VisualScript Guards ───────────────────────────────────────────────────────

export const isVisualScript = (v: unknown): v is VisualScript =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as VisualScript).sceneId === 'string' &&
  Array.isArray((v as VisualScript).frames) &&
  typeof (v as VisualScript).totalDuration === 'number';


// ── Utility Functions ─────────────────────────────────────────────────────────

/**
 * Apply defaults to a minimal entity emitted by an agent.
 * Merges ENTITY_DEFAULTS with any agent-supplied values.
 * Called by the renderer before dispatching to the component registry.
 */
export function applyEntityDefaults(entity: Partial<VisualEntity> & Pick<VisualEntity, 'id' | 'type' | 'position'>): VisualEntity {
  return {
    ...ENTITY_DEFAULTS,
    ...entity,
    animation: {
      ...ENTITY_DEFAULTS.animation,
      ...(entity.animation ?? {}),
    },
  } as VisualEntity;
}

/**
 * Build a lookup map from an entity array.
 * O(n) construction, O(1) lookup.
 */
export function buildEntityMap(entities: VisualEntity[]): Map<string, VisualEntity> {
  return new Map(entities.map(e => [e.id, e]));
}

/**
 * Assign staggered entrance delays to entities.
 * Modifies entities in place. Arrow types are skipped.
 */
export function assignEntranceDelays(
  entities: VisualEntity[],
  baseDelayMs = 0,
  staggerMs = INTER_ENTITY_STAGGER_MS
): void {
  let delay = baseDelayMs;
  for (const entity of entities) {
    if (isConnectionType(entity.type)) continue;
    entity.animation = entity.animation ?? {};
    entity.animation.delay = entity.animation.delay ?? delay;
    delay += staggerMs;
  }
}

/**
 * Validate that a VisualScript's internal references are consistent.
 * Returns an array of validation warnings (empty = valid).
 */
export function validateVisualScript(script: VisualScript): string[] {
  const warnings: string[] = [];

  for (const frame of script.frames) {
    if (frame.endTime <= frame.startTime) {
      warnings.push(`Frame "${frame.id}": endTime (${frame.endTime}) must be > startTime (${frame.startTime})`);
    }
    if (frame.entities.length > MAX_ENTITIES_PER_FRAME) {
      warnings.push(`Frame "${frame.id}": entity count (${frame.entities.length}) exceeds MAX_ENTITIES_PER_FRAME (${MAX_ENTITIES_PER_FRAME})`);
    }

    const entityIds = new Set(frame.entities.map(e => e.id));
    for (const entity of frame.entities) {
      if (isConnectionType(entity.type)) {
        if (entity.sourceEntityId && !entityIds.has(entity.sourceEntityId)) {
          warnings.push(`Frame "${frame.id}", entity "${entity.id}": sourceEntityId "${entity.sourceEntityId}" not found in frame`);
        }
        if (entity.targetEntityId && !entityIds.has(entity.targetEntityId)) {
          warnings.push(`Frame "${frame.id}", entity "${entity.id}": targetEntityId "${entity.targetEntityId}" not found in frame`);
        }
      }
    }
  }

  return warnings;
}
```

---

## 14. Constants

```typescript
// ── Performance SLOs ──────────────────────────────────────────────────────────

export const PERFORMANCE_CONTRACTS = {
  /** P95 latency for MCP tool calls (create_session, add_scene) in ms. */
  MCP_TOOL_P95_MS: 200,

  /** P95 latency for SSE event delivery after MCP tool call in ms. */
  SSE_DELIVERY_P95_MS: 50,

  /** P95 latency for GET /api/sessions/:id in ms. */
  SESSION_READ_P95_MS: 50,

  /** P95 latency for player HTML response in ms. */
  PLAYER_HTML_P95_MS: 100,

  /** Maximum VisualScript JSON size in bytes (stored in SQLite). */
  MAX_VISUAL_SCRIPT_BYTES: 512 * 1024,  // 512 KB

  /** Maximum total VisualScript duration in milliseconds. */
  MAX_SCRIPT_DURATION_MS: 3_600_000,    // 1 hour
} as const;


// ── CSS Entrance Animation Classes ───────────────────────────────────────────

/**
 * All valid entrance animation class names for entity.animation.entrance.
 * These classes are defined in player/player.css.
 */
export const ENTRANCE_ANIMATION_CLASSES = [
  'entrance-fadeInUp',   // Fade in from y+20 (default)
  'entrance-fadeIn',     // Simple opacity fade
  'entrance-drawIn',     // Scale in from 80% (good for icons)
  'entrance-scaleIn',    // Scale from center
] as const;

export type EntranceAnimationClass = typeof ENTRANCE_ANIMATION_CLASSES[number];


// ── MCP Tool Names ────────────────────────────────────────────────────────────

export type McpToolName =
  | 'create_session'
  | 'add_scene'
  | 'update_scene'
  | 'add_narration'
  | 'get_session_url';
```

---

## 15. Complete JSON Example — Multi-Entity Scene

The following is a complete, valid `VisualScript` demonstrating diverse entity types, cross-entity connections, metadata usage, and frame transitions.

```json
{
  "sceneId": "550e8400-e29b-41d4-a716-446655440000",
  "totalDuration": 16000,
  "frames": [
    {
      "id": "frame-1",
      "startTime": 0,
      "endTime": 6000,
      "narrationSegment": "A user sends an HTTPS request to the API gateway. The gateway validates the API key and routes the request to one of three backend services via the load balancer.",
      "description": "Request flow: User → API Gateway → Load Balancer → Backend Services",
      "entities": [
        {
          "id": "user-1",
          "type": "User",
          "position": { "x": 10, "y": 50 },
          "label": "Client",
          "color": "#7C5CBF",
          "animation": { "delay": 0, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "gateway-1",
          "type": "APIGateway",
          "position": { "x": 28, "y": 50 },
          "label": "API Gateway",
          "color": "#4A90D9",
          "animation": { "delay": 80, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "lb-1",
          "type": "LoadBalancer",
          "position": { "x": 50, "y": 50 },
          "label": "Load Balancer",
          "color": "#E67E22",
          "animation": { "delay": 160, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "svc-1",
          "type": "Service",
          "position": { "x": 72, "y": 30 },
          "label": "Service A",
          "color": "#27AE60",
          "animation": { "delay": 240, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "svc-2",
          "type": "Service",
          "position": { "x": 72, "y": 50 },
          "label": "Service B",
          "color": "#27AE60",
          "animation": { "delay": 320, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "svc-3",
          "type": "Service",
          "position": { "x": 72, "y": 70 },
          "label": "Service C",
          "color": "#27AE60",
          "animation": { "delay": 400, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "arr-user-gw",
          "type": "Arrow",
          "position": { "x": 19, "y": 50 },
          "sourceEntityId": "user-1",
          "targetEntityId": "gateway-1",
          "label": "HTTPS",
          "color": "#FFFFFF",
          "animation": { "delay": 480 }
        },
        {
          "id": "arr-gw-lb",
          "type": "Arrow",
          "position": { "x": 39, "y": 50 },
          "sourceEntityId": "gateway-1",
          "targetEntityId": "lb-1",
          "label": "route",
          "color": "#FFFFFF",
          "animation": { "delay": 560 }
        },
        {
          "id": "arr-lb-svc1",
          "type": "DataFlow",
          "position": { "x": 61, "y": 40 },
          "sourceEntityId": "lb-1",
          "targetEntityId": "svc-1",
          "animation": { "delay": 640 }
        },
        {
          "id": "arr-lb-svc2",
          "type": "DataFlow",
          "position": { "x": 61, "y": 50 },
          "sourceEntityId": "lb-1",
          "targetEntityId": "svc-2",
          "animation": { "delay": 720 }
        },
        {
          "id": "arr-lb-svc3",
          "type": "DataFlow",
          "position": { "x": 61, "y": 60 },
          "sourceEntityId": "lb-1",
          "targetEntityId": "svc-3",
          "animation": { "delay": 800 }
        }
      ]
    },
    {
      "id": "frame-2",
      "startTime": 6000,
      "endTime": 11000,
      "narrationSegment": "Each service writes to a shared Postgres database. The database stores all state and uses a Redis cache for read-heavy queries.",
      "description": "Data persistence layer: Services → Database and Cache",
      "transitions": [
        {
          "entityId": "svc-1",
          "from": { "position": { "x": 72, "y": 30 } },
          "to":   { "position": { "x": 25, "y": 30 } },
          "duration": 500,
          "easing": "power2.inOut"
        },
        {
          "entityId": "svc-2",
          "from": { "position": { "x": 72, "y": 50 } },
          "to":   { "position": { "x": 25, "y": 50 } },
          "duration": 500,
          "easing": "power2.inOut"
        },
        {
          "entityId": "svc-3",
          "from": { "position": { "x": 72, "y": 70 } },
          "to":   { "position": { "x": 25, "y": 70 } },
          "duration": 500,
          "easing": "power2.inOut"
        }
      ],
      "entities": [
        {
          "id": "svc-1",
          "type": "Service",
          "position": { "x": 25, "y": 30 },
          "label": "Service A",
          "color": "#27AE60"
        },
        {
          "id": "svc-2",
          "type": "Service",
          "position": { "x": 25, "y": 50 },
          "label": "Service B",
          "color": "#27AE60"
        },
        {
          "id": "svc-3",
          "type": "Service",
          "position": { "x": 25, "y": 70 },
          "label": "Service C",
          "color": "#27AE60"
        },
        {
          "id": "db-1",
          "type": "Database",
          "position": { "x": 60, "y": 40 },
          "label": "Postgres",
          "color": "#336791",
          "size": 1.2,
          "animation": { "delay": 0, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "cache-1",
          "type": "Cache",
          "position": { "x": 60, "y": 68 },
          "label": "Redis",
          "color": "#D82C20",
          "animation": { "delay": 80, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "arr-svc1-db",
          "type": "Arrow",
          "position": { "x": 42, "y": 35 },
          "sourceEntityId": "svc-1",
          "targetEntityId": "db-1",
          "label": "write",
          "animation": { "delay": 160 }
        },
        {
          "id": "arr-svc2-db",
          "type": "Arrow",
          "position": { "x": 42, "y": 47 },
          "sourceEntityId": "svc-2",
          "targetEntityId": "db-1",
          "animation": { "delay": 200 }
        },
        {
          "id": "arr-svc3-cache",
          "type": "Arrow",
          "position": { "x": 42, "y": 62 },
          "sourceEntityId": "svc-3",
          "targetEntityId": "cache-1",
          "label": "read",
          "animation": { "delay": 240 }
        },
        {
          "id": "metric-1",
          "type": "Metric",
          "position": { "x": 85, "y": 30 },
          "label": "Throughput",
          "animation": { "delay": 320, "entrance": "entrance-scaleIn" },
          "metadata": {
            "value": "12,400",
            "unit": "req/s",
            "trend": "up",
            "trendValue": "+18%"
          }
        }
      ]
    },
    {
      "id": "frame-3",
      "startTime": 11000,
      "endTime": 16000,
      "narrationSegment": "The system processes approximately 12,400 requests per second. Request latency follows a roughly normal distribution with a P95 of 45 milliseconds.",
      "description": "Performance analysis: Graph and equation",
      "entities": [
        {
          "id": "graph-latency",
          "type": "Graph2D",
          "position": { "x": 30, "y": 45 },
          "label": "Latency Distribution (P95 = 45ms)",
          "color": "#4A90D9",
          "size": 1.5,
          "animation": { "delay": 0, "entrance": "entrance-fadeIn" },
          "metadata": {
            "chartType": "bar",
            "data": [[5,12],[15,48],[25,180],[35,320],[45,450],[55,280],[65,120],[75,45],[85,12]],
            "xLabel": "Latency (ms)",
            "yLabel": "Request Count",
            "xRange": [0, 90],
            "yRange": [0, 500]
          }
        },
        {
          "id": "eq-p95",
          "type": "Equation",
          "position": { "x": 72, "y": 38 },
          "label": "P95 Definition",
          "animation": { "delay": 200, "entrance": "entrance-fadeInUp" },
          "metadata": {
            "latex": "P_{95} = \\mu + 1.645\\sigma",
            "fontSize": 32,
            "displayMode": true
          }
        },
        {
          "id": "callout-1",
          "type": "Callout",
          "position": { "x": 72, "y": 62 },
          "textContent": "At 12,400 req/s with P95 = 45ms, the system is well within the 200ms SLO.",
          "animation": { "delay": 400, "entrance": "entrance-fadeInUp" },
          "metadata": {
            "variant": "tip"
          }
        }
      ]
    }
  ]
}
```

---

## 16. Package Export Map

```typescript
// @preplai/shared/src/index.ts — complete re-export surface

// Core entity types
export type { VisualEntity, VisualEntityType } from './visual-entity';
export type { IllustrationFrame } from './illustration-frame';
export type { EntityTransition }  from './entity-transition';
export type { VisualScript }      from './visual-script';

// Session / scene types
export type { Session, SessionState, SessionStatus, SceneRecord } from './session';

// API types
export type { ApiError, ApiErrorCode, ApiResponse, McpToolResult } from './api';
export { ok, fail } from './api';

// Zod schemas (runtime validation)
export {
  VisualEntitySchema,
  IllustrationFrameSchema,
  EntityTransitionSchema,
  VisualScriptSchema,
  VisualEntityPatchSchema,
  CreateSessionSchema,
  CreateApiKeySchema,
} from './schemas/visual';

// Constants
export {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  CANVAS_VIEW_BOX,
  CANVAS_BG_COLOR,
  ENTITY_DEFAULTS,
  INTER_ENTITY_STAGGER_MS,
  FRAME_DURATION_MIN_MS,
  ANIMATION_DELAY_MIN_MS,
  MAX_ENTITIES_PER_FRAME,
  MAX_FRAMES_PER_SCRIPT,
  SESSION_TTL_DEFAULT_SECONDS,
  SESSION_TTL_MAX_SECONDS,
  TIER_RATE_LIMITS,
  PERFORMANCE_CONTRACTS,
  ENTRANCE_ANIMATION_CLASSES,
} from './constants';

// Type guards and utilities
export {
  isVisualEntity,
  isVisualScript,
  isArrowType,
  isConnectionType,
  requiresMetadata,
  applyEntityDefaults,
  buildEntityMap,
  assignEntranceDelays,
  validateVisualScript,
  resolveEntityRef,
} from './guards';
```

---

*End of document — 06-data-model.md*