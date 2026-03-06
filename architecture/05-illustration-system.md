# 05 — Illustration System

**Package:** `@preplai/player`  
**Status:** V1 — Programmatic SVG Component Library  
**Last updated:** 2026-02-28  
**Supersedes:** Old `05-illustration-system.md` (static morph-ready SVG file bank)

---

## Table of Contents

1. [Overview and Philosophy](#1-overview-and-philosophy)
2. [Architecture: Three-Layer Pipeline](#2-architecture-three-layer-pipeline)
3. [VisualEntity — The Agent-Facing Interface](#3-visualentity--the-agent-facing-interface)
4. [Component Registry Pattern](#4-component-registry-pattern)
5. [The Double-`<g>` Pattern (Critical)](#5-the-double-g-pattern-critical)
6. [SVGComponentProps Interface](#6-svgcomponentprops-interface)
7. [MetadataComponentProps — Rich Parameterization](#7-metadatacomponentprops--rich-parameterization)
8. [Entity Type Catalog (88+ Types)](#8-entity-type-catalog-88-types)
9. [Full Vanilla JS Component Implementations](#9-full-vanilla-js-component-implementations)
   - 9.1 [Server](#91-server)
   - 9.2 [Database](#92-database)
   - 9.3 [Arrow](#93-arrow)
   - 9.4 [Graph2D](#94-graph2d)
   - 9.5 [Additional Infrastructure Components](#95-additional-infrastructure-components)
   - 9.6 [Universal Components](#96-universal-components)
   - 9.7 [Math / Science Components](#97-math--science-components)
   - 9.8 [Physics Components](#98-physics-components)
   - 9.9 [General Purpose Components](#99-general-purpose-components)
   - 9.10 [Pedagogical Components](#910-pedagogical-components)
10. [Arrow and Connection Resolution](#10-arrow-and-connection-resolution)
11. [Entrance Animation CSS](#11-entrance-animation-css)
12. [GSAP Integration for Transitions](#12-gsap-integration-for-transitions)
13. [Scene Controller Integration](#13-scene-controller-integration)
14. [File Structure](#14-file-structure)
15. [Performance Contracts](#15-performance-contracts)
16. [Extensibility: Registering New Types at Runtime](#16-extensibility-registering-new-types-at-runtime)
17. [Entity Defaults Reference](#17-entity-defaults-reference)
18. [KaTeX Integration for Math Types](#18-katex-integration-for-math-types)
19. [What Was Removed from the Old System](#19-what-was-removed-from-the-old-system)

---

## 1. Overview and Philosophy

### 1.1 The Old Model (Removed)

The previous `05-illustration-system.md` described:

- A bank of **50 static SVG files**, each paired with a morph-target SVG for `MorphSVGPlugin`
- Strict anchor-point count constraints between source and target files
- File naming conventions (`server-idle.svg` / `server-active.svg`)
- A compile step that validated morph topology before runtime
- Agent → file-name string mapping (finite vocabulary, no parameterization)

**All of this is gone.** None of these patterns exist in V1.

### 1.2 The New Model: Programmatic Component Registry

The V1 illustration system is a **programmatic SVG component library** written in vanilla JavaScript. There are no SVG files read from disk at runtime. Instead:

- The **agent** (LLM) emits structured JSON (`VisualEntity` objects)
- A **component registry** maps each entity type string to a render function
- Each **render function** calls `document.createElementNS()` to build SVG DOM nodes on demand
- The **scene controller** dispatches to the registry and appends results to the canvas SVG

```
Agent (LLM)
    │
    ▼  emits VisualScript JSON (IllustrationFrame[])
Scene Controller  (scene-controller.js)
    │
    ▼  iterates frame.entities[]
Component Registry  (registry.js)
    │   registry['Server'](entity, parentSVG)    → SVGGElement
    │   registry['Database'](entity, parentSVG)  → SVGGElement
    │   registry['Arrow'](entity, parentSVG)     → SVGLineElement
    │   registry['Graph2D'](entity, parentSVG)   → SVGGElement
    │   ... 88+ types
    ▼
SVG Canvas  (viewBox="0 0 1920 1080")
    │
    ▼  CSS @keyframes entrance animations + GSAP property tweens
Browser (compositor thread)
```

### 1.3 Why This Design

| Old Problem | New Solution |
|-------------|--------------|
| Agent limited to finite SVG file names | Agent picks from 88+ semantic type strings |
| New illustration = design + draw + commit 2 SVG files | New type = one JS function, registered at runtime |
| Morph topology fragile (anchor count must match) | No morph pairs; transitions are GSAP property tweens |
| Static SVG files can't be parameterized | `metadata` object enables rich per-entity configuration |
| MorphSVGPlugin required (GSAP premium) | Not needed in V1; plain opacity + transform animations |
| 120+ SVG files to maintain | Zero SVG files; all shapes are code |

### 1.4 Canvas Specification

```
viewBox  = "0 0 1920 1080"   (16:9, HD resolution)
preserveAspectRatio = "xMidYMid meet"
Coordinate system: origin (0,0) at top-left
Agent API: positions expressed as percentages (0–100)
Renderer converts: x_px = (entity.position.x / 100) * 1920
                   y_px = (entity.position.y / 100) * 1080
```

All entity positions and sizes from the agent are **percentage-based** relative to canvas dimensions. The renderer converts to pixel coordinates before drawing.

---

## 2. Architecture: Three-Layer Pipeline

The illustration system maps cleanly onto three abstraction layers:

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1: SCHEMA  (Agent API / Zod validation)                      │
│                                                                     │
│  VisualEntity JSON  →  Zod validation  →  IllustrationFrame[]       │
│                                                                     │
│  Agent speaks this language. Type-safe. MCP tool validates input.   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2: ENGINE  (Component Registry / Render Functions)           │
│                                                                     │
│  Map<VisualEntityType, RenderFunction>                              │
│  buildEntityGroup(entity) → { outerG, innerG }                     │
│  88+ render functions, each creating SVG DOM nodes                 │
│                                                                     │
│  This is registry.js + components/*.js                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 3: RENDERER  (Scene Controller / CSS / GSAP / SSE)          │
│                                                                     │
│  scene-controller.js receives SSE events                           │
│  Orchestrates frame transitions                                    │
│  Applies CSS entrance animations                                   │
│  Drives GSAP tweens for inter-frame entity transitions             │
│  Manages SVG defs (arrowhead markers, clip paths, gradients)      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. VisualEntity — The Agent-Facing Interface

The `VisualEntity` is the atomic unit the LLM agent emits. It is defined in `types.ts` and validated via Zod schema on the MCP server before reaching the renderer.

### 3.1 Base Schema

```ts
// From types.ts
interface VisualEntity {
  id:        string;                        // Unique within script. Used for GSAP targeting, Arrow connections
  type:      VisualEntityType;              // One of 88+ type strings (see Section 8)
  position:  { x: number; y: number };     // Percentage coordinates 0–100 on 1920×1080 canvas
  size:      { width: number; height: number }; // Percentage of canvas width/height
  label?:    string;                        // Human-readable label rendered below or inside entity
  color?:    string;                        // Hex color string. Default per entity type
  highlight?: boolean;                      // When true: accent ring + brightness boost
  animation?: {
    type:     'fadeIn' | 'slideIn' | 'scaleIn' | 'pulse' | 'flow' | 'dashFlow' | 'none';
    duration: number;                       // ms
    delay:    number;                       // ms — drives entrance choreography
    entrance?: 'entrance-fadeInUp' | 'entrance-fadeIn' | 'entrance-drawIn'; // CSS class
  };
  // Arrow/DataFlow specific
  sourceEntityId?: string;                  // ID or label of source entity
  targetEntityId?: string;                  // ID or label of target entity
  // Nesting
  parentEntityId?: string;                  // ID of parent Group/Subnet/Container
  // Rich text
  textContent?: string[];                   // Multi-line text lines
  codeLanguage?: string;                    // For CodeBlock
  metadata?: Record<string, any>;           // Type-specific params (see Section 7)
}
```

### 3.2 What an Agent Emits

A typical agent output for a microservices architecture diagram:

```json
{
  "sceneId": "scene-001",
  "frames": [
    {
      "id": "frame-001",
      "startTime": 0,
      "endTime": 4000,
      "entities": [
        {
          "id": "client-1",
          "type": "User",
          "position": { "x": 10, "y": 50 },
          "size": { "width": 8, "height": 8 },
          "color": "#ff2d7b",
          "label": "Browser",
          "animation": { "delay": 0, "duration": 450, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "gateway-1",
          "type": "APIGateway",
          "position": { "x": 30, "y": 50 },
          "size": { "width": 10, "height": 8 },
          "color": "#00e5ff",
          "label": "API Gateway",
          "animation": { "delay": 150, "duration": 450, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "server-1",
          "type": "Server",
          "position": { "x": 55, "y": 30 },
          "size": { "width": 9, "height": 9 },
          "color": "#00e5ff",
          "label": "Auth Service",
          "animation": { "delay": 300, "duration": 450, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "db-1",
          "type": "Database",
          "position": { "x": 75, "y": 50 },
          "size": { "width": 8, "height": 8 },
          "color": "#b388ff",
          "label": "Users DB",
          "animation": { "delay": 450, "duration": 450, "entrance": "entrance-fadeInUp" }
        },
        {
          "id": "arrow-1",
          "type": "Arrow",
          "sourceEntityId": "client-1",
          "targetEntityId": "gateway-1",
          "color": "#ffffff",
          "label": "HTTPS",
          "animation": { "delay": 600, "duration": 300, "entrance": "entrance-fadeIn" }
        }
      ],
      "narrationSegment": "A browser client sends a request to the API Gateway",
      "description": "Initial architecture overview"
    }
  ],
  "totalDuration": 4000
}
```

### 3.3 Position Coordinate Convention

```
Canvas:  1920 × 1080 pixels (0 0 1920 1080 viewBox)

Agent emits:              Renderer converts to:
position.x = 30    →     cx = (30 / 100) * 1920 = 576 px
position.y = 50    →     cy = (50 / 100) * 1080 = 540 px

size.width = 10    →     w  = (10 / 100) * 1920 = 192 px  (used as max size hint)
size.height = 8    →     h  = (8  / 100) * 1080 =  86 px

Each render function receives entity.size and applies it as a
scale multiplier to the base component geometry.
```

---

## 4. Component Registry Pattern

### 4.1 Registry Definition

The registry is a plain JavaScript object — a `Map<string, RenderFunction>`. It is defined in `player/registry.js` and populated at module load time by importing each component module.

```js
// player/registry.js

import { renderServer }       from './components/server.js';
import { renderDatabase }     from './components/database.js';
import { renderContainer }    from './components/container.js';
import { renderPod }          from './components/pod.js';
import { renderCloud }        from './components/cloud.js';
import { renderNetwork }      from './components/network.js';
import { renderDevice }       from './components/device.js';
import { renderUser }         from './components/user.js';
import { renderArrow }        from './components/arrow.js';
import { renderDataFlow }     from './components/dataflow.js';
import { renderProcess }      from './components/process.js';
import { renderQueue }        from './components/queue.js';
import { renderCache }        from './components/cache.js';
import { renderLoadBalancer } from './components/loadbalancer.js';
import { renderService }      from './components/service.js';
import { renderFirewall }     from './components/firewall.js';
import { renderAPIGateway }   from './components/apigateway.js';
import { renderLambda }       from './components/lambda.js';
import { renderSubnet }       from './components/subnet.js';
import { renderVolume }       from './components/volume.js';
import { renderRegistry }     from './components/registry.js';
import { renderMonitor }      from './components/monitor.js';
import { renderPipeline }     from './components/pipeline.js';
import { renderDecision }     from './components/decision.js';
import { renderCluster }      from './components/cluster.js';
import { renderConcept }      from './components/concept.js';
import { renderEntity }       from './components/entity.js';
import { renderGroup }        from './components/group.js';
import { renderLabel }        from './components/label.js';
import { renderComparison }   from './components/comparison.js';
import { renderTimeline }     from './components/timeline.js';
import { renderMetric }       from './components/metric.js';
import { renderCycle }        from './components/cycle.js';
import { renderStack }        from './components/stack.js';
import { renderTree }         from './components/tree.js';
import { renderBadge }        from './components/badge.js';
import { renderQuote }        from './components/quote.js';
import { renderEquation }     from './components/equation.js';
import { renderExpression }   from './components/expression.js';
import { renderMatrix }       from './components/matrix.js';
import { renderGraph2D }      from './components/graph2d.js';
import { renderNumberLine }   from './components/numberline.js';
import { renderCoordinateSystem } from './components/coordinatesystem.js';
import { renderFreeBodyDiagram }  from './components/freebodydiagram.js';
import { renderCircuit }      from './components/circuit.js';
import { renderWave }         from './components/wave.js';
import { renderVector }       from './components/vector.js';
import { renderField }        from './components/field.js';
import { renderParticle }     from './components/particle.js';
import { renderTable }        from './components/table.js';
import { renderHistogram }    from './components/histogram.js';
import { renderPieChart }     from './components/piechart.js';
import { renderFlowDiagram }  from './components/flowdiagram.js';
import { renderVennDiagram }  from './components/venndiagram.js';
import { renderAnnotation }   from './components/annotation.js';
import { renderStepList }     from './components/steplist.js';
import { renderCodeBlock }    from './components/codeblock.js';
import { renderDefinition }   from './components/definition.js';
import { renderCallout }      from './components/callout.js';
import { renderBarChart }     from './components/barchart.js';
import { renderScatterPlot }  from './components/scatterplot.js';
import { renderProof }        from './components/proof.js';
import { renderAnalogy }      from './components/analogy.js';

// ── Data Structures
import { renderArray }           from './components/array.js';
import { renderLinkedList }      from './components/linkedlist.js';
import { renderBinaryTree }      from './components/binarytree.js';
import { renderHashTable }       from './components/hashtable.js';
import { renderHeap }            from './components/heap.js';
import { renderGraphDS }         from './components/graphds.js';
import { renderTrie }            from './components/trie.js';

// ── Algorithm Visualization
import { renderArrayCell }       from './components/arraycell.js';
import { renderPointer }         from './components/pointer.js';
import { renderRecursionTree }   from './components/recursiontree.js';

// ── Automata & Theory
import { renderFSM }             from './components/fsm.js';
import { renderStateNode }       from './components/statenode.js';
import { renderTransition }      from './components/transition.js';

// ── Computer Architecture
import { renderCPU }             from './components/cpu.js';
import { renderRegister }        from './components/register.js';
import { renderMemoryBlock }     from './components/memoryblock.js';
import { renderLogicGate }       from './components/logicgate.js';
import { renderBus }             from './components/bus.js';

// ── Operating Systems
import { renderProcessBlock }    from './components/processblock.js';
import { renderMemoryMap }       from './components/memorymap.js';
import { renderThread }          from './components/thread.js';

// ── Networking
import { renderPacket }          from './components/packet.js';
import { renderProtocolStack }   from './components/protocolstack.js';

// ── Machine Learning
import { renderNeuralNetwork }   from './components/neuralnetwork.js';
import { renderDecisionBoundary } from './components/decisionboundary.js';

/**
 * The global component registry.
 * Maps VisualEntityType string → render function.
 *
 * Render function signature:
 *   (entity: VisualEntity, parentEl: SVGElement) → SVGElement
 *
 * Arrow/DataFlow use an extended signature:
 *   (entity: VisualEntity, allEntities: VisualEntity[], parentEl: SVGElement) → SVGElement
 */
export const registry = {
  // ── Infrastructure
  User:          renderUser,
  Server:        renderServer,
  Database:      renderDatabase,
  Container:     renderContainer,
  Pod:           renderPod,
  Cloud:         renderCloud,
  Network:       renderNetwork,
  Device:        renderDevice,
  Arrow:         renderArrow,          // special: needs allEntities
  DataFlow:      renderDataFlow,       // special: needs allEntities
  Process:       renderProcess,
  Queue:         renderQueue,
  Cache:         renderCache,
  LoadBalancer:  renderLoadBalancer,
  Service:       renderService,
  Firewall:      renderFirewall,
  APIGateway:    renderAPIGateway,
  Lambda:        renderLambda,
  Subnet:        renderSubnet,
  Volume:        renderVolume,
  Registry:      renderRegistry,
  Monitor:       renderMonitor,
  Pipeline:      renderPipeline,
  Decision:      renderDecision,
  Cluster:       renderCluster,
  // ── Universal
  Concept:       renderConcept,
  Entity:        renderEntity,
  Group:         renderGroup,
  Label:         renderLabel,
  Comparison:    renderComparison,
  Timeline:      renderTimeline,
  Metric:        renderMetric,
  Cycle:         renderCycle,
  Stack:         renderStack,
  Tree:          renderTree,
  Badge:         renderBadge,
  Quote:         renderQuote,
  // ── Math & Science
  Equation:      renderEquation,
  Expression:    renderExpression,
  Matrix:        renderMatrix,
  Graph2D:       renderGraph2D,
  NumberLine:    renderNumberLine,
  CoordinateSystem: renderCoordinateSystem,
  // ── Physics
  FreeBodyDiagram: renderFreeBodyDiagram,
  Circuit:       renderCircuit,
  Wave:          renderWave,
  Vector:        renderVector,
  Field:         renderField,
  Particle:      renderParticle,
  // ── General Purpose
  Table:         renderTable,
  Histogram:     renderHistogram,
  PieChart:      renderPieChart,
  FlowDiagram:   renderFlowDiagram,
  VennDiagram:   renderVennDiagram,
  Annotation:    renderAnnotation,
  // ── Pedagogical
  StepList:      renderStepList,
  CodeBlock:     renderCodeBlock,
  Definition:    renderDefinition,
  Callout:       renderCallout,
  BarChart:      renderBarChart,
  ScatterPlot:   renderScatterPlot,
  Proof:         renderProof,
  Analogy:       renderAnalogy,
  // ── Data Structures
  Array:              renderArray,
  LinkedList:         renderLinkedList,
  BinaryTree:         renderBinaryTree,
  HashTable:          renderHashTable,
  Heap:               renderHeap,
  GraphDS:            renderGraphDS,
  Trie:               renderTrie,
  // ── Algorithm Visualization
  ArrayCell:          renderArrayCell,
  Pointer:            renderPointer,
  RecursionTree:      renderRecursionTree,
  // ── Automata & Theory
  FSM:                renderFSM,
  StateNode:          renderStateNode,
  Transition:         renderTransition,   // special: needs sourceEntityId/targetEntityId
  // ── Computer Architecture
  CPU:                renderCPU,
  Register:           renderRegister,
  MemoryBlock:        renderMemoryBlock,
  LogicGate:          renderLogicGate,
  Bus:                renderBus,          // special: needs sourceEntityId/targetEntityId
  // ── Operating Systems
  ProcessBlock:       renderProcessBlock,
  MemoryMap:          renderMemoryMap,
  Thread:             renderThread,
  // ── Networking
  Packet:             renderPacket,
  ProtocolStack:      renderProtocolStack,
  // ── Machine Learning
  NeuralNetwork:      renderNeuralNetwork,
  DecisionBoundary:   renderDecisionBoundary,
};
```

### 4.2 Dispatch Function

The dispatcher is called by the scene controller for each entity in each frame. Arrow and DataFlow entities are deferred to a second pass (see Section 10).

```js
// player/registry.js (continued)

/**
 * Render a single entity and append it to parentEl.
 *
 * @param {object}     entity    - VisualEntity descriptor
 * @param {SVGElement} parentEl  - SVG root or group to append into
 * @param {object[]}   [allEntities] - Full entities array (required for Arrow/DataFlow)
 * @returns {SVGElement|null}    - The created element, or null if type unknown
 */
export function renderEntity(entity, parentEl, allEntities = []) {
  const fn = registry[entity.type];

  if (!fn) {
    console.warn(`[PRE registry] Unknown entity type: "${entity.type}". Skipping.`);
    return null;
  }

  // Arrow and DataFlow need position resolution across all entities
  if (entity.type === 'Arrow' || entity.type === 'DataFlow') {
    return fn(entity, allEntities, parentEl);
  }

  return fn(entity, parentEl);
}
```

### 4.3 Two-Pass Rendering

The scene controller renders all entities in two passes. This guarantees that when Arrow entities resolve their source/target positions, all referenced entities already exist in the DOM:

```js
// player/scene-controller.js (excerpt)

function renderFrame(frame) {
  const { entities } = frame;

  // Pass 1: Render all non-connector entities
  for (const entity of entities) {
    if (entity.type === 'Arrow' || entity.type === 'DataFlow') continue;
    renderEntity(entity, svgCanvas);
  }

  // Pass 2: Render connectors (position resolution requires Pass 1 data)
  for (const entity of entities) {
    if (entity.type !== 'Arrow' && entity.type !== 'DataFlow') continue;
    renderEntity(entity, svgCanvas, entities);
  }
}
```

---

## 5. The Double-`<g>` Pattern (Critical)

### 5.1 Why It Is Required

SVG elements have two independent transform systems:

1. **SVG `transform` attribute** — handled by the SVG rendering engine; used for positioning (`translate(x, y)`)
2. **CSS `transform` property** — handled by the CSS engine; used for animations (keyframes, GSAP)

When both systems operate on the **same element**, browsers apply them multiplicatively in implementation-defined order. This causes the element to snap to `(0, 0)` when a CSS animation plays — the CSS transform overwrites the SVG attribute transform.

**The fix:** Use two nested `<g>` elements, one for each system.

### 5.2 Pattern Implementation

```js
// player/utils.js

export const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Build the standard double-<g> structure for any positioned entity.
 *
 * Returns:
 *   outerG — carries translate(cx, cy). Never animated. Never receives CSS transforms.
 *   innerG — carries CSS animation class. All shape children go here.
 *
 * @param {object} entity - VisualEntity descriptor
 * @returns {{ outerG: SVGGElement, innerG: SVGGElement }}
 */
export function buildEntityGroup(entity) {
  // ── OUTER <g>: position only ───────────────────────────────────────
  const outerG = document.createElementNS(SVG_NS, 'g');

  // Identity attributes — used by GSAP and scene controller for targeting
  outerG.setAttribute('id',        entity.id);
  outerG.setAttribute('data-type', entity.type);

  // Convert percentage coordinates (0–100) → canvas pixels (1920×1080)
  const cx = (entity.position.x / 100) * 1920;
  const cy = (entity.position.y / 100) * 1080;
  outerG.setAttribute('transform', `translate(${cx}, ${cy})`);

  // ── INNER <g>: animation target ────────────────────────────────────
  const innerG = document.createElementNS(SVG_NS, 'g');
  innerG.setAttribute('class', 'animate-element');

  // These three CSS properties are MANDATORY for compositor-path animation.
  // transformBox:    scopes transform-origin to the element's own bounding box
  // transformOrigin: scale/rotate from the element's visual center
  // willChange:      hints GPU to promote element to its own compositing layer
  innerG.style.transformBox    = 'fill-box';
  innerG.style.transformOrigin = 'center center';
  innerG.style.willChange      = 'transform, opacity';

  outerG.appendChild(innerG);
  return { outerG, innerG };
}
```

### 5.3 Visual Diagram

```
<svg viewBox="0 0 1920 1080">
  │
  └── <g id="server-1" data-type="Server" transform="translate(576, 540)">
        │  ← OUTER: positional only. setAttribute. NEVER animated by CSS or GSAP.
        │
        └── <g class="animate-element entrance-fadeInUp"
               style="transform-box: fill-box;
                      transform-origin: center center;
                      will-change: transform, opacity;
                      animation-delay: 300ms">
              │  ← INNER: animation target. CSS keyframes operate here.
              │            GSAP tweens target this element.
              │
              ├── <rect x="-40" y="-30" width="80" height="60" .../>
              ├── <line x1="-32" y1="-14" x2="32" y2="-14" .../>
              ├── <line x1="-32" y1="0"   x2="32" y2="0"   .../>
              ├── <line x1="-32" y1="14"  x2="32" y2="14"  .../>
              └── <text y="46" text-anchor="middle" ...>Auth Service</text>
```

### 5.4 What Goes Where

| Content | Goes into | Why |
|---------|-----------|-----|
| `transform="translate(x, y)"` | `outerG` attribute | SVG attribute — positions element on canvas |
| Entity ID, `data-type` | `outerG` attributes | Identity for GSAP targeting |
| CSS animation classes | `innerG` class list | CSS engine operates on `innerG` only |
| `animation-delay` | `innerG.style` | CSS property for choreography |
| `will-change`, `transform-box`, `transform-origin` | `innerG.style` | CSS properties |
| All shape children (`<rect>`, `<circle>`, `<text>`, etc.) | `innerG` children | Shapes inside animation wrapper |
| GSAP `to()` / `from()` targets | `innerG` reference | GSAP animates CSS transforms on `innerG` |

### 5.5 The Rule in One Sentence

> Shape content goes into `innerG`. Position goes into `outerG`. Never mix them.

---

## 6. SVGComponentProps Interface

Every standard (non-metadata) render function maps directly from this props interface, which mirrors the base fields of `VisualEntity`:

```ts
// Conceptual interface — not imported as a type at runtime (vanilla JS)

interface SVGComponentProps {
  // From VisualEntity
  id:           string;
  type:         string;
  position:     { x: number; y: number };  // percentage 0–100
  size?:        { width: number; height: number }; // percentage, used as scale factor
  color?:       string;   // hex color. Default varies by type
  label?:       string;   // rendered as SVG <text> below the component
  highlight?:   boolean;  // accent ring + brightness boost
  animation?: {
    delay?:     number;   // ms, for animationDelay CSS property
    duration?:  number;   // ms, passed to entrance animation
    entrance?:  string;   // CSS class name
  };
}
```

Render functions extract these fields directly:

```js
function renderServer(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  // Extract props with defaults
  const size  = (entity.size?.width ?? 9) / 100 * 1920; // convert to px scale
  const s     = Math.min(size * 0.5, 60);                // clamp to usable range
  const color = entity.color ?? '#00e5ff';

  // ... build shapes into innerG ...

  // Apply entrance animation
  applyEntranceAnimation(innerG, entity);

  parentEl.appendChild(outerG);
  return outerG;
}
```

### 6.1 Size Normalization

The agent emits `size.width` and `size.height` as percentages of the 1920×1080 canvas. Render functions convert this to a meaningful component scale:

```js
// Convert agent size to component scale factor
// entity.size.width = 9  →  9% of 1920px = 172.8px available space
// Component base unit s = half of that (radius/half-width convention)

function getSizeParam(entity, defaultPct = 9) {
  const pct = entity.size?.width ?? defaultPct;
  const px  = (pct / 100) * 1920;
  return Math.min(px * 0.45, 80); // clamp: never larger than 80px base unit
}
```

This yields a `s` value typically in the `25–80px` range, which all SVG shape coordinates scale relative to.

---

## 7. MetadataComponentProps — Rich Parameterization

Some entity types need parameters beyond the base `VisualEntity` fields. Rather than polluting the core schema with type-specific fields, these live in the `metadata: Record<string, any>` field.

### 7.1 Interface Extension

```js
// Extended signature for metadata-aware render functions
// function renderGraph2D(entity, parentEl)
// where entity.metadata contains type-specific params

// Conceptual interface:
interface MetadataComponentProps extends SVGComponentProps {
  metadata?: Record<string, any>;
  // Render functions also read entity.size directly for width/height:
  // width  = (entity.size?.width  ?? defaultW_pct) / 100 * 1920
  // height = (entity.size?.height ?? defaultH_pct) / 100 * 1080
}
```

### 7.2 Metadata Field Reference

| Entity Type | `metadata` Fields | Description |
|-------------|-------------------|-------------|
| `Graph2D` | `data: number[][]`, `xLabel: string`, `yLabel: string`, `chartType: 'line'\|'bar'\|'scatter'`, `xRange: [min,max]`, `yRange: [min,max]`, `expression: string`, `domain: [min,max]`, `range: [min,max]`, `parametric: boolean`, `xExpression: string`, `yExpression: string`, `tRange: [min,max]` | 2D function plotter — explicit, parametric, or point-series |
| `Equation` | `latex: string`, `fontSize: number`, `displayMode: boolean` | KaTeX-rendered display equation. Falls back to monospace text |
| `Expression` | `latex: string`, `displayMode: boolean` | Inline expression, smaller box than Equation |
| `Matrix` | `rows: number[][]`, `rowLabels: string[]`, `colLabels: string[]`, `latex: string` | Matrix with optional KaTeX rendering |
| `Wave` | `frequency: number`, `amplitude: number`, `phase: number`, `waveType: 'sine'\|'square'\|'sawtooth'` | Parametric wave form plotted as SVG path |
| `Circuit` | `components: Array<{type: string, label: string}>`, `connections: Array<{from: number, to: number}>` | Simplified circuit diagram (battery, resistor, capacitor) |
| `Table` | `headers: string[]`, `rows: string[][]`, `highlightRows: number[]` | Data table with header row, optional row highlighting |
| `CodeBlock` | `code: string`, `language: string`, `highlightLines: number[]`, `lines: string[]` | Code editor visual with syntax-colored header bar |
| `Graph2D` | See above — most complex metadata type | |
| `NumberLine` | `min: number`, `max: number`, `ticks: number[]`, `highlights: Array<{from,to,color}>` | Number line with tick marks and region highlights |
| `CoordinateSystem` | `xRange: [min,max]`, `yRange: [min,max]`, `gridSpacing: number`, `points: Array<{x,y,label,color}>`, `vectors: Array<{dx,dy,label,color}>` | 2D coordinate plane with optional points and vectors |
| `FreeBodyDiagram` | `forces: Array<{label, magnitude, angle, color}>` | Body with force vectors at specified angles |
| `Field` | `gridSize: number`, `fieldAngle: Function` | Vector field grid with arrows |
| `Particle` | `trajectory: Array<{x,y}>` | Particle with optional trajectory path |
| `Histogram` | `bins: Array<{label, value, color}>` | Histogram with labeled bars |
| `PieChart` | `segments: Array<{label, value, color}>` | Pie chart with segment labels |
| `VennDiagram` | `sets: Array<{label, color}>`, `intersection: string` | 2–3 set Venn diagram |
| `FlowDiagram` | `steps: Array<{label, type: 'default'\|'decision'}>` | Vertical flow with connected boxes/diamonds |
| `AnnotationEntity` | `targetX: number`, `targetY: number` | Callout bubble pointing at local coordinates |
| `StepList` | `steps: string[]` | Numbered step list |
| `Definition` | `term: string`, `definition: string` | Term + definition card with accent bar |
| `Callout` | `calloutType: 'tip'\|'warning'\|'note'\|'important'` | Callout box with icon and accent color |
| `Proof` | `steps: Array<{type: 'given'\|'step'\|'therefore', text: string}>` | Formal proof with QED box |
| `Analogy` | `left: {label, description}`, `right: {label, description}` | Side-by-side "is like" comparison panels |
| `BarChart` | `bars: Array<{label, value, color}>` | Bar chart with axes and value labels |
| `ScatterPlot` | `points: Array<{x, y, label}>` | Scatter plot with labeled data points |
| `Array` | `cells: Array<{value: string, state: 'default'\|'compare'\|'swap'\|'sorted'\|'active'}>`, `showIndices: boolean` | Cell array with per-cell state |
| `LinkedList` | `nodes: Array<{value: string, id: string, highlight: string}>`, `pointers: Array<{from: string, to: string}>`, `variant: 'singly'\|'doubly'` | Linked list chain |
| `BinaryTree` | `nodes: Array<{value: string, id: string, highlight: 'none'\|'compare'\|'insert'\|'visited'\|'active'}>`, `edges: Array<{from: string, to: string, side: 'left'\|'right'}>`, `layout: 'reingold-tilford'`, `nodeRadius: number`, `levelSpacing: number`, `siblingSpacing: number`, `traversalPath: string[]` | Binary tree with auto-layout |
| `HashTable` | `buckets: Array<{index: number, entries: Array<{key: string, value: string, highlight: boolean}>}>`, `hashFunction: string`, `highlightBucket: number` | Hash table with collision chains |
| `Heap` | `nodes: Array<{value: string, highlight: 'none'\|'compare'\|'swap'\|'active'}>`, `variant: 'min'\|'max'`, `showArray: boolean` | Heap with optional array view |
| `GraphDS` | `nodes: Array<{id: string, label: string, x: number, y: number, state: 'unvisited'\|'queued'\|'visiting'\|'visited'}>`, `edges: Array<{from: string, to: string, weight?: number, directed: boolean, highlight: boolean}>`, `layout: 'manual'\|'force-directed'\|'circular'` | Graph data structure |
| `Trie` | `nodes: Array<{id: string, char: string, isTerminal: boolean, highlight: boolean}>`, `edges: Array<{from: string, to: string}>`, `searchPath: string[]` | Prefix trie |
| `ArrayCell` | `value: string`, `index: number`, `state: 'default'\|'active'\|'compare'\|'swap'\|'done'` | Single array cell |
| `Pointer` | `direction: 'up'\|'down'\|'left'\|'right'\|'down-left'\|'down-right'`, `style: 'arrow'\|'bracket'\|'line'`, `targetEntityId: string` | Named pointer arrow |
| `RecursionTree` | `calls: Array<{id: string, label: string, args: string, returnValue?: string, state: 'pending'\|'executing'\|'returned'}>`, `edges: Array<{from: string, to: string}>`, `maxDepth: number` | Recursion call tree |
| `FSM` | `states: Array<{id: string, label: string, isStart: boolean, isAccept: boolean, highlight: 'none'\|'active'\|'reject'}>`, `transitions: Array<{from: string, to: string, label: string, highlight: boolean}>`, `layout: 'horizontal'\|'circular'` | Finite state machine |
| `StateNode` | `stateType: 'normal'\|'start'\|'accept'\|'reject'`, `isActive: boolean` | Individual state node |
| `Transition` | `label: string`, `curve: 'straight'\|'arc'\|'self-loop'`, `direction: 'forward'\|'backward'` | State transition arrow (needs sourceEntityId/targetEntityId) |
| `CPU` | `blocks: Array<{id: string, label: string, type: 'alu'\|'control'\|'registers'\|'cache'}>`, `buses: Array<{from: string, to: string, label: string}>`, `activeBlock: string` | CPU block diagram |
| `Register` | `registers: Array<{name: string, value: string, bits: number, highlight: boolean}>`, `format: 'hex'\|'binary'\|'decimal'` | Register file |
| `MemoryBlock` | `regions: Array<{label: string, startAddr: string, endAddr: string, color: string, cells?: Array<{addr: string, value: string, highlight: boolean}>}>` | Memory address space |
| `LogicGate` | `gateType: 'AND'\|'OR'\|'NOT'\|'XOR'\|'NAND'\|'NOR'`, `inputs: Array<{label: string, value: boolean}>`, `output: {label: string, value: boolean}` | Logic gate symbol |
| `Bus` | `bitWidth: number`, `direction: 'left'\|'right'\|'up'\|'down'`, `label: string`, `isActive: boolean` | Data bus (needs sourceEntityId/targetEntityId) |
| `ProcessBlock` | `pid: number`, `state: 'running'\|'ready'\|'waiting'\|'terminated'`, `priority: number`, `resources: Array<{name: string, usage: number}>` | OS process |
| `MemoryMap` | `segments: Array<{name: string, startAddr: string, endAddr: string, color: string, growDirection?: 'up'\|'down'}>`, `pointerPosition: string` | Virtual memory map |
| `Thread` | `threadId: number`, `state: 'running'\|'waiting'\|'blocked'\|'terminated'`, `parentProcessId: string`, `stackPointer: string` | Thread |
| `Packet` | `headers: Array<{name: string, value: string, bytes: number}>`, `payload: string`, `protocol: string`, `highlightSection: string` | Network packet |
| `ProtocolStack` | `layers: Array<{name: string, protocol: string, color: string, highlight: boolean}>`, `encapsulation: boolean`, `direction: 'send'\|'receive'` | Protocol layer stack |
| `NeuralNetwork` | `layers: Array<{name: string, neurons: number, activation?: string}>`, `weights: 'show'\|'hide'`, `highlightNeuron: {layer: number, index: number}`, `highlightConnection: {fromLayer: number, fromIndex: number, toLayer: number, toIndex: number}` | Neural network diagram |
| `DecisionBoundary` | `points: Array<{x: number, y: number, class: string, color: string}>`, `boundary: {type: 'linear'\|'polynomial'\|'circular', params: object}`, `axes: {xLabel: string, yLabel: string}` | Classification boundary plot |

### 7.3 Accessing Metadata in a Render Function

Always use nullish coalescing to provide defaults:

```js
function renderGraph2D(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  // Size: convert from percentage to pixels
  const totalW = (entity.size?.width  ?? 18) / 100 * 1920;
  const totalH = (entity.size?.height ?? 28) / 100 * 1080;

  // Metadata with defaults
  const meta      = entity.metadata ?? {};
  const chartType = meta.chartType  ?? 'line';
  const xLabel    = meta.xLabel     ?? 'x';
  const yLabel    = meta.yLabel     ?? 'y';
  const domain    = meta.domain     ?? [-5, 5];
  const range     = meta.range      ?? [-5, 5];
  const data      = meta.data       ?? [];
  const color     = entity.color    ?? '#00e5ff';

  // ... build chart into innerG ...

  parentEl.appendChild(outerG);
  return outerG;
}
```

---

## 8. Entity Type Catalog (88+ Types)

All 88 entity types currently in the system, organized by category. Each row shows the type string (as emitted by the agent), default color, and description.

### 8.1 Infrastructure (25 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `User` | `#ff2d7b` | Human figure — head circle + body arc |
| `Server` | `#00e5ff` | Rack server — rect with horizontal stripe lines and LED dots |
| `Database` | `#b388ff` | Cylinder — top ellipse + body rect + bottom ellipse |
| `Container` | `#00e676` | Container box — dashed border with two inner process rects |
| `Pod` | `#00e676` | Kubernetes pod — rect with inner rect and status dots |
| `Cloud` | `#00bcd4` | Cloud shape — overlapping ellipses |
| `Network` | `#00e5ff` | Network mesh — central node + radiating spokes |
| `Device` | `#ffab00` | Laptop/device — screen rect + base rect |
| `Arrow` | `#ffffff` | Connection arrow — `<line>` + `marker-end` arrowhead (special: needs source/target IDs) |
| `DataFlow` | `#b388ff` | Animated dashed flow arrow — `stroke-dasharray` + SMIL animate |
| `Process` | `#00bcd4` | Process box — rounded rect + play-triangle icon |
| `Queue` | `#ffab00` | Message queue — three stacked rects + exit arrow |
| `Cache` | `#00e676` | Cache — database cylinder with lightning bolt (flash) icon inside |
| `LoadBalancer` | `#00e5ff` | Load balancer — hexagon + Y-fork lines |
| `Service` | `#4ECDC4` | Microservice — cogwheel (gear) with label in hub |
| `API` | `#4ECDC4` | REST API — cogwheel with "API" in hub (inherits Service) |
| `Firewall` | `#ff4444` | Firewall — shield outline + lock icon |
| `APIGateway` | `#4ECDC4` | API Gateway — cogwheel with label in hub (same as Service) |
| `Lambda` | `#ffab00` | Lambda/serverless — rounded rect + λ character |
| `Subnet` | `#4488ff` | Subnet — large dashed rect + CIDR badge |
| `Volume` | `#b388ff` | Storage volume — cylinder with rings |
| `Registry` | `#00e676` | Container registry — rect with 2×3 cell grid |
| `Monitor` | `#00e676` | Monitoring screen — rect + EKG pulse line + stand |
| `Pipeline` | `#00bcd4` | CI/CD pipeline — four chevron segments in sequence |
| `Decision` | `#ffab00` | Decision diamond — rhombus + `?` label |
| `Cluster` | `#4488ff` | Node cluster — three overlapping circles |

### 8.2 Universal / Topic-Agnostic (12 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `Concept` | `#00e5ff` | Concept bubble — circle + dashed inner ring + centered label |
| `Entity` | `#00e5ff` | Generic entity — rounded rect + monospace label |
| `Group` | `#00bcd4` | Container group — large dashed rect, label above |
| `Label` | `#ffab00` | Floating text label — monospace text + underline |
| `Comparison` | `#ffab00` | A vs B — two side-by-side panels + "vs" text |
| `Timeline` | `#00e676` | Timeline node — horizontal line + diamond marker + label |
| `Metric` | `#ff2d7b` | Metric badge — circle + large monospace value |
| `Cycle` | `#00bcd4` | Cycle indicator — rotating dashed circle + center label |
| `Stack` | `#b388ff` | Stack — three stacked rects with decreasing opacity |
| `Tree` | `#00e676` | Tree — root node + two child nodes + connecting lines |
| `Badge` | `#ff6b6b` | Pill badge — rounded rect + monospace label |
| `Quote` | `#b388ff` | Quote card — rect + left accent bar + opening quote mark |

### 8.3 Math & Science (6 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `Equation` | `#00e5ff` | Display equation — dashed border box; renders KaTeX if available, else monospace |
| `Expression` | `#00e5ff` | Inline expression — smaller box, inline math mode |
| `Matrix` | `#b388ff` | Matrix — box with bracket notation; renders KaTeX if available |
| `Graph2D` | `#00e5ff` | 2D plotter — axes, grid, explicit/parametric/implicit/point-series curves |
| `NumberLine` | `#00e5ff` | Number line — horizontal axis with tick marks and optional highlights |
| `CoordinateSystem` | `#00e5ff` | 2D plane — axes, grid, optional points and vectors |

### 8.4 Physics (6 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `FreeBodyDiagram` | `#ffab00` | FBD — central body circle + labeled force vectors at arbitrary angles |
| `Circuit` | `#ffab00` | Simple circuit — outer loop wire + battery + resistor symbols |
| `Wave` | `#00bcd4` | Wave form — parametric sine/square/sawtooth as SVG path |
| `Vector` | `#ff6b9d` | Vector arrow — line + polygon arrowhead at specified angle/magnitude |
| `Field` | `#b388ff` | Vector field — grid of mini-arrows showing field direction |
| `Particle` | `#ff6b9d` | Particle — circle + outer ring + optional trajectory dashed path |

### 8.5 General Purpose (6 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `Table` | `#00e5ff` | Data table — header row + data rows + vertical column divisions |
| `Histogram` | `#00e676` | Histogram — labeled bars on axes with staggered entrance animation |
| `PieChart` | `#00e5ff` | Pie chart — SVG arc segments + external labels |
| `FlowDiagram` | `#00bcd4` | Vertical flow — rect/diamond boxes connected by arrows |
| `VennDiagram` | `#00e5ff` | Venn — 2 or 3 overlapping circles with set labels |
| `Annotation` | `#ffab00` | Annotation callout — box + dashed leader line + target dot |

### 8.6 Pedagogical (8 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `StepList` | `#00e5ff` | Numbered step list — circles + text rows + connecting lines |
| `CodeBlock` | `#b388ff` | Code block — dark rect + traffic-light dots + monospace text lines |
| `Definition` | `#00e676` | Definition card — left accent bar + bold term + body text |
| `Callout` | `#ffab00` | Callout box — emoji icon + bold type label + body text (tip/warning/note/important) |
| `BarChart` | `#00e5ff` | Bar chart — axes + bars with value labels |
| `ScatterPlot` | `#00e5ff` | Scatter plot — axes + dot grid + optional point labels |
| `Proof` | `#b388ff` | Mathematical proof — given/step/therefore rows + QED box |
| `Analogy` | `#00e5ff` | Analogy card — two side panels + "is like" connector |

### 8.7 Data Structures (7 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `Array` | `#00e5ff` | Indexed cell array — row of rectangular cells with index labels above, value inside, per-cell highlight state (default/compare/swap/sorted) |
| `LinkedList` | `#00e676` | Linked list — chain of node boxes (value + next pointer), arrow connectors between nodes, supports singly/doubly linked |
| `BinaryTree` | `#b388ff` | Binary tree — circle nodes with value labels, edge lines, automatic layout via Reingold-Tilford algorithm, per-node highlight state |
| `HashTable` | `#ffab00` | Hash table — vertical bucket array on left, key→value entries with hash arrows, collision chain visualization |
| `Heap` | `#00bcd4` | Binary heap — tree visualization with array representation below, parent-child relationship lines, highlight for bubble-up/down operations |
| `GraphDS` | `#00e5ff` | Graph (data structure) — circle nodes with labels, directed/undirected edges with optional weights, per-node visit state coloring for BFS/DFS |
| `Trie` | `#00e676` | Prefix trie — tree of single-character nodes, edge labels, highlighted path for search operations, terminal node markers |

### 8.8 Algorithm Visualization (3 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `ArrayCell` | `#00e5ff` | Single array cell — standalone highlightable cell with index, value, and state (default/active/compare/swap/done). Used for composition within larger array scenes |
| `Pointer` | `#ff6b6b` | Named pointer/index arrow — downward arrow with label (e.g., "i", "left", "pivot"), points to a position on the canvas. Used to show algorithm cursors |
| `RecursionTree` | `#b388ff` | Recursion call tree — tree of function call nodes showing arguments and return values, with stack depth indication and currently-executing highlight |

### 8.9 Automata & Theory (3 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `FSM` | `#00e5ff` | Finite state machine — circle states with labels, curved/straight transition arrows with input labels, double-circle for accept states, arrow for start state |
| `StateNode` | `#00e5ff` | Individual state circle — standalone state for composition. Supports: initial (arrow), accept (double circle), active (filled), reject (red) styles |
| `Transition` | `#ffffff` | State transition arrow — curved or straight arrow between states with label (input/output). Supports self-loops. Special: needs source/target entity IDs |

### 8.10 Computer Architecture (5 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `CPU` | `#00e5ff` | CPU block diagram — outer rect with labeled sub-blocks: ALU (diamond), Control Unit (rect), Register File (grid), connected by internal buses |
| `Register` | `#ffab00` | Register file — grid of named register slots (R0–R15, PC, SP, etc.) with bit-width display and current value. Highlight for active register |
| `MemoryBlock` | `#b388ff` | Memory address space — vertical stack of addressable cells with hex addresses on left, values on right, region labels (stack/heap/text/data) |
| `LogicGate` | `#00e676` | Logic gate — standard IEEE symbols: AND, OR, NOT, XOR, NAND, NOR. Input lines on left, output on right. Gate type via metadata |
| `Bus` | `#00e5ff` | Data/address bus — thick directional line with bit-width label, connecting architecture components. Arrow direction shows data flow |

### 8.11 Operating Systems (3 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `ProcessBlock` | `#00bcd4` | OS process — rounded rect with PID badge, state indicator (running/ready/waiting/terminated), priority level, resource allocation bars |
| `MemoryMap` | `#b388ff` | Virtual memory map — vertical segmented bar showing text, data, BSS, heap (grows up), stack (grows down) with address labels |
| `Thread` | `#00e676` | Thread — smaller rect nested inside process, with thread ID, state dot (green=running, yellow=waiting, red=blocked), stack pointer reference |

### 8.12 Networking (2 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `Packet` | `#00e5ff` | Network packet — horizontal rect divided into header sections (src/dst IP, ports, flags) and payload area, with byte-offset markers |
| `ProtocolStack` | `#ffab00` | Protocol layer stack — vertical stack of labeled layers (Application, Transport, Network, Link, Physical) with encapsulation arrows between layers |

### 8.13 Machine Learning (2 types)

| Type | Default Color | Description |
|------|---------------|-------------|
| `NeuralNetwork` | `#b388ff` | Neural network layer diagram — columns of circle neurons per layer (input, hidden×N, output), weighted edge lines between layers, activation labels |
| `DecisionBoundary` | `#00e5ff` | 2D classification plot — coordinate plane with colored point clusters and decision boundary line/curve separating classes |

**Total: 89 entity types** across 13 categories.

---

## 9. Full Vanilla JS Component Implementations

All components use the standard patterns:
- `buildEntityGroup(entity)` for the double-`<g>` structure
- `document.createElementNS(SVG_NS, tag)` for all SVG elements
- `setAttribute(name, value)` for SVG attributes (never direct property assignment)
- `el.style.property = value` for CSS properties (camelCase)
- `applyEntranceAnimation(innerG, entity)` at the end of each function

### 9.1 Server

```js
// player/components/server.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

/**
 * Renders a rack server visual:
 * - Rectangle body with rack-stripe horizontal lines
 * - Two LED status dots in top-left
 * - Optional label below
 *
 * @param {object}     entity   - VisualEntity
 * @param {SVGElement} parentEl - SVG parent element
 * @returns {SVGGElement}
 */
export function renderServer(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  const pct   = entity.size?.width ?? 9;
  const px    = (pct / 100) * 1920;
  const size  = Math.min(px * 0.45, 70);  // base unit: ~half the available width
  const color = entity.color ?? '#00e5ff';

  const w = size * 1.4;
  const h = size;

  // ── Server body
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x',      String(-w / 2));
  body.setAttribute('y',      String(-h / 2));
  body.setAttribute('width',  String(w));
  body.setAttribute('height', String(h * 0.8));
  body.setAttribute('rx',     '4');
  body.setAttribute('fill',   `${color}15`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', '2');
  innerG.appendChild(body);

  // ── Rack stripe lines (3 divisions)
  const lineOffsets = [-size / 6, 0, size / 6];
  for (const oy of lineOffsets) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1',           String(-w / 2));
    line.setAttribute('x2',           String(w / 2));
    line.setAttribute('y1',           String(oy));
    line.setAttribute('y2',           String(oy));
    line.setAttribute('stroke',       color);
    line.setAttribute('stroke-width', '1');
    line.setAttribute('opacity',      '0.5');
    innerG.appendChild(line);
  }

  // ── LED status dots (top-left of each rack section)
  const dotPositions = [
    { cx: -w / 3, cy: -size / 3 },
    { cx: -w / 6, cy: -size / 3 },
  ];
  for (const { cx, cy } of dotPositions) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx',      String(cx));
    dot.setAttribute('cy',      String(cy));
    dot.setAttribute('r',       '3');
    dot.setAttribute('fill',    color);
    dot.setAttribute('opacity', '0.8');
    innerG.appendChild(dot);
  }

  // ── Label
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x',           '0');
    text.setAttribute('y',           String(h / 2 + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        color);
    text.setAttribute('font-size',   '14');
    text.setAttribute('font-weight', '500');
    text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

### 9.2 Database

```js
// player/components/database.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

/**
 * Renders a database cylinder:
 * - Top ellipse (cap)
 * - Vertical rect body
 * - Bottom ellipse (base)
 * - Vertical side lines
 * - Optional label below
 *
 * @param {object}     entity   - VisualEntity
 * @param {SVGElement} parentEl - SVG parent element
 * @returns {SVGGElement}
 */
export function renderDatabase(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  const pct   = entity.size?.width ?? 8;
  const px    = (pct / 100) * 1920;
  const size  = Math.min(px * 0.45, 60);
  const color = entity.color ?? '#b388ff';

  const rx = size / 2;   // ellipse x-radius (= cylinder radius)
  const ry = size / 6;   // ellipse y-radius (flat perspective)
  const bodyH = size * 0.55;
  const topY  = -size / 3;
  const botY  =  topY + bodyH;

  // ── Top ellipse (cap)
  const topEllipse = document.createElementNS(SVG_NS, 'ellipse');
  topEllipse.setAttribute('cx', '0');
  topEllipse.setAttribute('cy', String(topY));
  topEllipse.setAttribute('rx', String(rx));
  topEllipse.setAttribute('ry', String(ry));
  topEllipse.setAttribute('fill',         `${color}15`);
  topEllipse.setAttribute('stroke',       color);
  topEllipse.setAttribute('stroke-width', '2');
  innerG.appendChild(topEllipse);

  // ── Body fill rect (hides top ellipse seam)
  const bodyFill = document.createElementNS(SVG_NS, 'rect');
  bodyFill.setAttribute('x',      String(-rx));
  bodyFill.setAttribute('y',      String(topY));
  bodyFill.setAttribute('width',  String(rx * 2));
  bodyFill.setAttribute('height', String(bodyH));
  bodyFill.setAttribute('fill',   `${color}15`);
  bodyFill.setAttribute('stroke', 'none');
  innerG.appendChild(bodyFill);

  // ── Bottom ellipse (base)
  const botEllipse = document.createElementNS(SVG_NS, 'ellipse');
  botEllipse.setAttribute('cx', '0');
  botEllipse.setAttribute('cy', String(botY));
  botEllipse.setAttribute('rx', String(rx));
  botEllipse.setAttribute('ry', String(ry));
  botEllipse.setAttribute('fill',         `${color}15`);
  botEllipse.setAttribute('stroke',       color);
  botEllipse.setAttribute('stroke-width', '2');
  innerG.appendChild(botEllipse);

  // ── Vertical side lines
  for (const xSign of [-1, 1]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1',           String(xSign * rx));
    line.setAttribute('y1',           String(topY));
    line.setAttribute('x2',           String(xSign * rx));
    line.setAttribute('y2',           String(botY));
    line.setAttribute('stroke',       color);
    line.setAttribute('stroke-width', '2');
    innerG.appendChild(line);
  }

  // ── Horizontal data stripe lines (suggests stored rows)
  const stripeOffsets = [0.25, 0.55];
  for (const t of stripeOffsets) {
    const sy = topY + bodyH * t;
    const sw = rx * Math.sqrt(1 - Math.pow((sy - topY - bodyH / 2) / (bodyH / 2), 2)) * 1.8;
    const stripe = document.createElementNS(SVG_NS, 'line');
    stripe.setAttribute('x1',           String(-sw));
    stripe.setAttribute('y1',           String(sy));
    stripe.setAttribute('x2',           String(sw));
    stripe.setAttribute('y2',           String(sy));
    stripe.setAttribute('stroke',       color);
    stripe.setAttribute('stroke-width', '1');
    stripe.setAttribute('opacity',      '0.3');
    innerG.appendChild(stripe);
  }

  // ── Label
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x',           '0');
    text.setAttribute('y',           String(botY + ry + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        color);
    text.setAttribute('font-size',   '14');
    text.setAttribute('font-weight', '500');
    text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

### 9.3 Arrow

Arrow is the most complex component because it uses a different rendering approach: no double-`<g>`, because the element's position is defined entirely by `x1/y1/x2/y2` SVG attributes (not by `transform`), and it requires position resolution across all entities in the frame.

```js
// player/components/arrow.js

import { SVG_NS } from '../utils.js';

/**
 * Resolves an entity reference string (ID or label) to a VisualEntity.
 * Three-tier lookup: exact ID → exact label (case-insensitive) → substring label.
 *
 * @param {string}   ref         - Entity ID or label string from agent
 * @param {object[]} allEntities - All entities in the current frame
 * @returns {object|null}
 */
export function resolveEntityRef(ref, allEntities) {
  if (!ref) return null;

  // Tier 1: Exact ID match
  let found = allEntities.find(e => e.id === ref);
  if (found) return found;

  // Tier 2: Exact label match (case-insensitive)
  found = allEntities.find(
    e => e.label?.toLowerCase() === ref.toLowerCase()
  );
  if (found) return found;

  // Tier 3: Substring match (label includes ref or ref includes label)
  found = allEntities.find(
    e => e.label?.toLowerCase().includes(ref.toLowerCase())
  );
  return found ?? null;
}

/**
 * Renders a connection arrow between two entities.
 *
 * Special contract:
 *   - Called in Pass 2 (after all other entities are in DOM)
 *   - Does NOT use the double-<g> pattern — position is defined by x1/y1/x2/y2
 *   - Requires a global <defs> arrowhead marker (injected by scene-controller.js)
 *   - sourceEntityId / targetEntityId are resolved via fuzzy lookup
 *
 * @param {object}     entity      - VisualEntity (type = 'Arrow')
 * @param {object[]}   allEntities - All entities in current frame
 * @param {SVGElement} parentEl    - SVG root element
 * @returns {SVGElement|null}
 */
export function renderArrow(entity, allEntities, parentEl) {
  const source = resolveEntityRef(entity.sourceEntityId, allEntities);
  const target = resolveEntityRef(entity.targetEntityId, allEntities);

  if (!source || !target) {
    console.warn(
      `[Arrow] Could not resolve source="${entity.sourceEntityId}" ` +
      `or target="${entity.targetEntityId}" for arrow id="${entity.id}"`
    );
    return null;
  }

  // Convert percentage positions to canvas pixel coordinates
  const x1 = (source.position.x / 100) * 1920;
  const y1 = (source.position.y / 100) * 1080;
  const x2 = (target.position.x / 100) * 1920;
  const y2 = (target.position.y / 100) * 1080;

  const color = entity.color ?? '#ffffff';

  // ── Unique arrowhead marker ID (prevents collision across multiple arrows)
  const markerId = `arrowhead-${entity.id}`;
  ensureArrowheadMarker(markerId, color, parentEl.ownerSVGElement ?? parentEl);

  // ── Wrapper group for animation (only opacity, no position transform needed)
  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id',        entity.id);
  g.setAttribute('data-type', 'Arrow');
  g.style.willChange = 'opacity';

  // ── Line
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1',           String(x1));
  line.setAttribute('y1',           String(y1));
  line.setAttribute('x2',           String(x2));
  line.setAttribute('y2',           String(y2));
  line.setAttribute('stroke',       color);
  line.setAttribute('stroke-width', '2.5');
  line.setAttribute('opacity',      '0.85');
  line.setAttribute('marker-end',   `url(#${markerId})`);
  g.appendChild(line);

  // ── Optional midpoint label
  if (entity.label) {
    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x',           String(midX));
    text.setAttribute('y',           String(midY - 10));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        color);
    text.setAttribute('font-size',   '12');
    text.setAttribute('font-weight', '500');
    text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    text.textContent = entity.label;
    g.appendChild(text);
  }

  // ── Entrance animation (fade in only)
  if (entity.animation?.delay != null) {
    g.style.animation      = 'fadeIn 0.3s ease both';
    g.style.animationDelay = `${entity.animation.delay}ms`;
    g.style.opacity        = '0'; // start hidden until animation fires
  }

  parentEl.appendChild(g);
  return g;
}

/**
 * Inject an arrowhead <marker> into <defs> if it doesn't already exist.
 * Creates a per-color, per-entity marker so multiple arrow colors can coexist.
 *
 * @param {string}     markerId  - Unique marker ID
 * @param {string}     color     - Fill color for the arrowhead polygon
 * @param {SVGElement} svgEl     - The <svg> element containing <defs>
 */
function ensureArrowheadMarker(markerId, color, svgEl) {
  if (svgEl.querySelector(`#${markerId}`)) return;

  let defs = svgEl.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs');
    svgEl.insertBefore(defs, svgEl.firstChild);
  }

  const marker = document.createElementNS(SVG_NS, 'marker');
  marker.setAttribute('id',          markerId);
  marker.setAttribute('markerWidth',  '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX',         '9');
  marker.setAttribute('refY',         '3');
  marker.setAttribute('orient',       'auto');

  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', '0 0, 10 3, 0 6');
  polygon.setAttribute('fill',   color);

  marker.appendChild(polygon);
  defs.appendChild(marker);
}

/**
 * DataFlow: animated dashed arrow variant.
 * Uses SMIL stroke-dashoffset animation for the "flowing data" effect.
 *
 * @param {object}     entity      - VisualEntity (type = 'DataFlow')
 * @param {object[]}   allEntities - All entities in current frame
 * @param {SVGElement} parentEl    - SVG root element
 * @returns {SVGElement|null}
 */
export function renderDataFlow(entity, allEntities, parentEl) {
  const source = resolveEntityRef(entity.sourceEntityId, allEntities);
  const target = resolveEntityRef(entity.targetEntityId, allEntities);

  if (!source || !target) {
    console.warn(`[DataFlow] Could not resolve source/target for id="${entity.id}"`);
    return null;
  }

  const x1    = (source.position.x / 100) * 1920;
  const y1    = (source.position.y / 100) * 1080;
  const x2    = (target.position.x / 100) * 1920;
  const y2    = (target.position.y / 100) * 1080;
  const color = entity.color ?? '#b388ff';

  const g = document.createElementNS(SVG_NS, 'g');
  g.setAttribute('id',        entity.id);
  g.setAttribute('data-type', 'DataFlow');

  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1',                 String(x1));
  line.setAttribute('y1',                 String(y1));
  line.setAttribute('x2',                 String(x2));
  line.setAttribute('y2',                 String(y2));
  line.setAttribute('stroke',             color);
  line.setAttribute('stroke-width',       '4');
  line.setAttribute('stroke-dasharray',   '8,4');
  line.setAttribute('stroke-dashoffset',  '0');
  line.setAttribute('opacity',            '0.6');

  // SMIL dash animation — zero JS cost at runtime
  const anim = document.createElementNS(SVG_NS, 'animate');
  anim.setAttribute('attributeName', 'stroke-dashoffset');
  anim.setAttribute('from',          '12');
  anim.setAttribute('to',            '0');
  anim.setAttribute('dur',           '0.8s');
  anim.setAttribute('repeatCount',   'indefinite');
  line.appendChild(anim);
  g.appendChild(line);

  parentEl.appendChild(g);
  return g;
}
```

### 9.4 Graph2D

Graph2D is the most feature-rich component, supporting explicit functions, parametric curves, implicit curves (via marching squares), and point-series scatter data.

```js
// player/components/graph2d.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

/**
 * Renders a 2D function graph supporting:
 *   - Explicit:   y = f(x)  via metadata.expression (e.g. "Math.sin(x)")
 *   - Parametric: x(t), y(t) via metadata.parametric + xExpression + yExpression
 *   - Implicit:   F(x,y)=0 via metadata.implicit + implicitExpression (marching squares)
 *   - Points:     scatter data via metadata.points [ {x,y} ]
 *
 * @param {object}     entity   - VisualEntity with metadata (see Section 7.2)
 * @param {SVGElement} parentEl - SVG parent element
 * @returns {SVGGElement}
 */
export function renderGraph2D(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  // ── Size (convert percentage → pixels)
  const totalW = Math.max((entity.size?.width  ?? 18) / 100 * 1920, 120);
  const totalH = Math.max((entity.size?.height ?? 28) / 100 * 1080,  90);

  const meta     = entity.metadata ?? {};
  const color    = entity.color ?? '#00e5ff';
  const domain   = meta.domain   ?? meta.xRange ?? [-5, 5];
  const range    = meta.range    ?? meta.yRange ?? [-5, 5];
  const showGrid = meta.showGrid !== false;
  const xLabel   = meta.xLabel   ?? '';
  const yLabel   = meta.yLabel   ?? '';
  const pad      = 30;

  const chartW = totalW - pad * 2;
  const chartH = totalH - pad * 2;

  // Mapping helpers
  const mapX = v => -totalW / 2 + pad + ((v - domain[0]) / (domain[1] - domain[0])) * chartW;
  const mapY = v =>  totalH / 2 - pad - ((v - range[0])  / (range[1]  - range[0]))  * chartH;

  // ── Background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x',      String(-totalW / 2));
  bg.setAttribute('y',      String(-totalH / 2));
  bg.setAttribute('width',  String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx',     '8');
  bg.setAttribute('fill',   '#0b0d1460');
  bg.setAttribute('stroke', color);
  bg.setAttribute('stroke-width', '1');
  innerG.appendChild(bg);

  // ── Grid lines
  if (showGrid) {
    for (let v = Math.ceil(domain[0]); v <= Math.floor(domain[1]); v++) {
      const gx = mapX(v);
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1',           String(gx));
      gl.setAttribute('y1',           String(-totalH / 2 + pad));
      gl.setAttribute('x2',           String(gx));
      gl.setAttribute('y2',           String(totalH / 2 - pad));
      gl.setAttribute('stroke',       '#ffffff08');
      gl.setAttribute('stroke-width', '1');
      innerG.appendChild(gl);

      if (v !== 0) {
        const lt = document.createElementNS(SVG_NS, 'text');
        lt.setAttribute('x',           String(gx));
        lt.setAttribute('y',           String(mapY(0) + 14));
        lt.setAttribute('text-anchor', 'middle');
        lt.setAttribute('fill',        '#ffffff40');
        lt.setAttribute('font-size',   '9');
        lt.setAttribute('font-family', 'Geist Mono, monospace');
        lt.textContent = String(v);
        innerG.appendChild(lt);
      }
    }
    for (let v = Math.ceil(range[0]); v <= Math.floor(range[1]); v++) {
      const gy = mapY(v);
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1',           String(-totalW / 2 + pad));
      gl.setAttribute('y1',           String(gy));
      gl.setAttribute('x2',           String(totalW / 2 - pad));
      gl.setAttribute('y2',           String(gy));
      gl.setAttribute('stroke',       '#ffffff08');
      gl.setAttribute('stroke-width', '1');
      innerG.appendChild(gl);

      if (v !== 0) {
        const lt = document.createElementNS(SVG_NS, 'text');
        lt.setAttribute('x',           String(mapX(0) - 10));
        lt.setAttribute('y',           String(gy + 3));
        lt.setAttribute('text-anchor', 'end');
        lt.setAttribute('fill',        '#ffffff40');
        lt.setAttribute('font-size',   '9');
        lt.setAttribute('font-family', 'Geist Mono, monospace');
        lt.textContent = String(v);
        innerG.appendChild(lt);
      }
    }
  }

  // ── Axes
  const xAxis = document.createElementNS(SVG_NS, 'line');
  xAxis.setAttribute('x1', String(-totalW / 2 + pad));
  xAxis.setAttribute('y1', String(mapY(0)));
  xAxis.setAttribute('x2', String(totalW / 2 - pad));
  xAxis.setAttribute('y2', String(mapY(0)));
  xAxis.setAttribute('stroke', '#ffffff30');
  xAxis.setAttribute('stroke-width', '1.5');
  innerG.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(mapX(0)));
  yAxis.setAttribute('y1', String(-totalH / 2 + pad));
  yAxis.setAttribute('x2', String(mapX(0)));
  yAxis.setAttribute('y2', String(totalH / 2 - pad));
  yAxis.setAttribute('stroke', '#ffffff30');
  yAxis.setAttribute('stroke-width', '1.5');
  innerG.appendChild(yAxis);

  // ── Axis labels
  if (xLabel) {
    const xl = document.createElementNS(SVG_NS, 'text');
    xl.setAttribute('x',           String(totalW / 2 - pad));
    xl.setAttribute('y',           String(mapY(0) - 6));
    xl.setAttribute('text-anchor', 'end');
    xl.setAttribute('fill',        `${color}80`);
    xl.setAttribute('font-size',   '11');
    xl.textContent = xLabel;
    innerG.appendChild(xl);
  }
  if (yLabel) {
    const yl = document.createElementNS(SVG_NS, 'text');
    yl.setAttribute('x',           String(mapX(0) + 6));
    yl.setAttribute('y',           String(-totalH / 2 + pad + 4));
    yl.setAttribute('fill',        `${color}80`);
    yl.setAttribute('font-size',   '11');
    yl.textContent = yLabel;
    innerG.appendChild(yl);
  }

  // ── Curve rendering
  let curvePath = '';
  const curveColor = meta.parametric ? '#e040fb'
                   : meta.implicit   ? '#ff9100'
                   : color;

  if (meta.parametric) {
    // Parametric: x(t), y(t)
    const xExpr  = meta.xExpression ?? 'Math.cos(t)';
    const yExpr  = meta.yExpression ?? 'Math.sin(t)';
    const tRange = meta.tRange      ?? [0, 2 * Math.PI];
    const steps  = 200;
    const dt     = (tRange[1] - tRange[0]) / steps;
    const parts  = [];

    for (let i = 0; i <= steps; i++) {
      const t = tRange[0] + i * dt;
      try {
        /* eslint-disable no-new-func */
        const xv = new Function('t', 'Math', `return (${xExpr})`)(t, Math);
        const yv = new Function('t', 'Math', `return (${yExpr})`)(t, Math);
        /* eslint-enable no-new-func */
        if (!isFinite(xv) || !isFinite(yv)) continue;
        parts.push(`${parts.length === 0 ? 'M' : 'L'}${mapX(xv).toFixed(1)},${mapY(yv).toFixed(1)}`);
      } catch { /* skip discontinuities */ }
    }
    curvePath = parts.join(' ');

  } else if (meta.expression && (!meta.points || meta.points.length === 0)) {
    // Explicit: y = f(x)
    const steps = 80;
    const dx    = (domain[1] - domain[0]) / steps;
    const parts = [];

    for (let i = 0; i <= steps; i++) {
      const xv = domain[0] + i * dx;
      try {
        /* eslint-disable no-new-func */
        const yv = new Function('x', `return (${meta.expression})`)(xv);
        /* eslint-enable no-new-func */
        if (!isFinite(yv)) continue;
        parts.push(`${parts.length === 0 ? 'M' : 'L'}${mapX(xv).toFixed(1)},${mapY(yv).toFixed(1)}`);
      } catch { /* skip */ }
    }
    curvePath = parts.join(' ');
  }

  if (curvePath) {
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d',            curvePath);
    path.setAttribute('fill',         'none');
    path.setAttribute('stroke',       curveColor);
    path.setAttribute('stroke-width', '2.5');
    innerG.appendChild(path);
  }

  // ── Scatter points
  const points = meta.points ?? [];
  for (const p of points) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx',           String(mapX(p.x)));
    dot.setAttribute('cy',           String(mapY(p.y)));
    dot.setAttribute('r',            '4');
    dot.setAttribute('fill',         color);
    dot.setAttribute('stroke',       '#0b0d14');
    dot.setAttribute('stroke-width', '1.5');
    innerG.appendChild(dot);
  }

  // ── Title label
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x',           '0');
    title.setAttribute('y',           String(-totalH / 2 + 18));
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill',        color);
    title.setAttribute('font-size',   '12');
    title.setAttribute('font-weight', '600');
    title.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

### 9.5 Additional Infrastructure Components

The remaining infrastructure components follow the same double-`<g>` pattern. Full implementations live in their respective `player/components/*.js` files. Below is a representative selection showing shape variety:

```js
// player/components/user.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

export function renderUser(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s     = Math.min((entity.size?.width ?? 8) / 100 * 1920 * 0.4, 50);
  const color = entity.color ?? '#ff2d7b';

  // Head
  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx',           '0');
  head.setAttribute('cy',           String(-s / 3));
  head.setAttribute('r',            String(s / 4));
  head.setAttribute('fill',         `${color}30`);
  head.setAttribute('stroke',       color);
  head.setAttribute('stroke-width', '2');
  innerG.appendChild(head);

  // Body arc (shoulders)
  const body = document.createElementNS(SVG_NS, 'path');
  body.setAttribute('d',            `M ${-s / 2.5} ${s / 6} Q 0 ${-s / 6} ${s / 2.5} ${s / 6}`);
  body.setAttribute('fill',         `${color}30`);
  body.setAttribute('stroke',       color);
  body.setAttribute('stroke-width', '2');
  innerG.appendChild(body);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x',           '0');
    text.setAttribute('y',           String(s / 2 + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        color);
    text.setAttribute('font-size',   '12');
    text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

```js
// player/components/cloud.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

export function renderCloud(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s     = Math.min((entity.size?.width ?? 10) / 100 * 1920 * 0.4, 70);
  const color = entity.color ?? '#00bcd4';

  // Three overlapping ellipses to form cloud shape
  const ellipses = [
    { cx: -s / 4, cy: 0,     rx: s / 3,   ry: s / 4 },
    { cx:  s / 6, cy: 0,     rx: s / 2.5, ry: s / 3.5 },
    { cx:  0,     cy: -s / 6, rx: s / 3.5, ry: s / 3 },
  ];

  for (const e of ellipses) {
    const el = document.createElementNS(SVG_NS, 'ellipse');
    el.setAttribute('cx',           String(e.cx));
    el.setAttribute('cy',           String(e.cy));
    el.setAttribute('rx',           String(e.rx));
    el.setAttribute('ry',           String(e.ry));
    el.setAttribute('fill',         `${color}20`);
    el.setAttribute('stroke',       color);
    el.setAttribute('stroke-width', '2');
    innerG.appendChild(el);
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x',           '0');
    text.setAttribute('y',           String(s / 2 + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        color);
    text.setAttribute('font-size',   '13');
    text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

```js
// player/components/loadbalancer.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

export function renderLoadBalancer(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s     = Math.min((entity.size?.width ?? 9) / 100 * 1920 * 0.4, 60);
  const color = entity.color ?? '#00e5ff';

  // Hexagon
  const hexPoints = [0, 1, 2, 3, 4, 5].map(i => {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    return `${(Math.cos(angle) * s).toFixed(1)},${(Math.sin(angle) * s).toFixed(1)}`;
  }).join(' ');

  const hex = document.createElementNS(SVG_NS, 'polygon');
  hex.setAttribute('points',       hexPoints);
  hex.setAttribute('fill',         `${color}15`);
  hex.setAttribute('stroke',       color);
  hex.setAttribute('stroke-width', '2');
  innerG.appendChild(hex);

  // Y-fork distribution lines
  const forkY = s * 0.3;
  const forkXL = -s * 0.4;
  const forkXR =  s * 0.4;

  for (const [x2, y2] of [[forkXL, forkY], [forkXR, forkY]]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1',           '0');
    line.setAttribute('y1',           String(-s * 0.25));
    line.setAttribute('x2',           String(x2));
    line.setAttribute('y2',           String(y2));
    line.setAttribute('stroke',       color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('opacity',      '0.7');
    innerG.appendChild(line);
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x',           '0');
    text.setAttribute('y',           String(s + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        color);
    text.setAttribute('font-size',   '13');
    text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

### 9.6 Universal Components

```js
// player/components/concept.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

export function renderConcept(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s     = Math.min((entity.size?.width ?? 9) / 100 * 1920 * 0.4, 65);
  const color = entity.color ?? '#00e5ff';

  // Outer solid circle
  const outerCircle = document.createElementNS(SVG_NS, 'circle');
  outerCircle.setAttribute('cx',           '0');
  outerCircle.setAttribute('cy',           '0');
  outerCircle.setAttribute('r',            String(s / 2));
  outerCircle.setAttribute('fill',         `${color}15`);
  outerCircle.setAttribute('stroke',       color);
  outerCircle.setAttribute('stroke-width', '2.5');
  innerG.appendChild(outerCircle);

  // Inner dashed ring
  const innerRing = document.createElementNS(SVG_NS, 'circle');
  innerRing.setAttribute('cx',               '0');
  innerRing.setAttribute('cy',               '0');
  innerRing.setAttribute('r',                String(s / 2 - 8));
  innerRing.setAttribute('fill',             'none');
  innerRing.setAttribute('stroke',           `${color}40`);
  innerRing.setAttribute('stroke-width',     '1');
  innerRing.setAttribute('stroke-dasharray', '4,4');
  innerG.appendChild(innerRing);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x',           '0');
    text.setAttribute('y',           '5');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        color);
    text.setAttribute('font-size',   String(Math.min(13, s / 5)));
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', 'Geist Mono, monospace');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

```js
// player/components/metric.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

export function renderMetric(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s     = Math.min((entity.size?.width ?? 7) / 100 * 1920 * 0.4, 50);
  const color = entity.color ?? '#ff2d7b';

  const bg = document.createElementNS(SVG_NS, 'circle');
  bg.setAttribute('cx',           '0');
  bg.setAttribute('cy',           '0');
  bg.setAttribute('r',            String(s / 2));
  bg.setAttribute('fill',         `${color}20`);
  bg.setAttribute('stroke',       color);
  bg.setAttribute('stroke-width', '2');
  innerG.appendChild(bg);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x',           '0');
    text.setAttribute('y',           '6');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        color);
    text.setAttribute('font-size',   String(Math.min(s / 3, 18)));
    text.setAttribute('font-weight', '700');
    text.setAttribute('font-family', 'Geist Mono, monospace');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

### 9.7 Math / Science Components

```js
// player/components/equation.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

/**
 * Renders a display equation.
 * Attempts KaTeX rendering via window.__katex (if loaded).
 * Falls back to monospace text if KaTeX is unavailable.
 *
 * @param {object}     entity   - VisualEntity. metadata.latex = LaTeX string
 * @param {SVGElement} parentEl
 * @returns {SVGGElement}
 */
export function renderEquation(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  const totalW = Math.max((entity.size?.width  ?? 18) / 100 * 1920, 200);
  const totalH = Math.max((entity.size?.height ?? 8)  / 100 * 1080,  60);
  const color  = entity.color ?? '#00e5ff';
  const meta   = entity.metadata ?? {};
  const latex  = meta.latex ?? entity.label ?? 'E = mc^2';

  // Background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x',               String(-totalW / 2));
  bg.setAttribute('y',               String(-totalH / 2));
  bg.setAttribute('width',           String(totalW));
  bg.setAttribute('height',          String(totalH));
  bg.setAttribute('rx',              '8');
  bg.setAttribute('fill',            '#0b0d1480');
  bg.setAttribute('stroke',          color);
  bg.setAttribute('stroke-width',    '1.5');
  bg.setAttribute('stroke-dasharray', '6 3');
  innerG.appendChild(bg);

  // KaTeX path: inject rendered HTML via <foreignObject>
  const katex = window.__katex;
  if (katex) {
    try {
      const html = katex.renderToString(latex, {
        throwOnError: false,
        displayMode:  meta.displayMode !== false,
      });

      const fo = document.createElementNS(SVG_NS, 'foreignObject');
      fo.setAttribute('x',      String(-totalW / 2 + 8));
      fo.setAttribute('y',      String(-totalH / 2 + 4));
      fo.setAttribute('width',  String(totalW - 16));
      fo.setAttribute('height', String(totalH - 8));

      // foreignObject needs an HTML-namespace div
      const div = document.createElement('div');
      div.style.cssText = [
        `color: ${color}`,
        'font-size: 18px',
        'display: flex',
        'align-items: center',
        'justify-content: center',
        'height: 100%',
        'overflow: hidden',
      ].join(';');
      div.innerHTML = html;
      fo.appendChild(div);
      innerG.appendChild(fo);
    } catch (err) {
      console.warn('[Equation] KaTeX render failed, using fallback:', err);
      appendFallbackText(innerG, latex, color);
    }
  } else {
    appendFallbackText(innerG, latex, color);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}

function appendFallbackText(innerG, latex, color) {
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x',           '0');
  text.setAttribute('y',           '6');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill',        color);
  text.setAttribute('font-size',   '16');
  text.setAttribute('font-family', 'Geist Mono, monospace');
  text.textContent = latex;
  innerG.appendChild(text);
}
```

### 9.8 Physics Components

```js
// player/components/wave.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

export function renderWave(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  const totalW = Math.max((entity.size?.width  ?? 20) / 100 * 1920, 120);
  const totalH = Math.max((entity.size?.height ?? 12) / 100 * 1080,  70);
  const color  = entity.color ?? '#00bcd4';
  const meta   = entity.metadata ?? {};
  const amp    = meta.amplitude ?? totalH * 0.35;
  const freq   = meta.frequency ?? 2;

  // Background box
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x',      String(-totalW / 2));
  bg.setAttribute('y',      String(-totalH / 2));
  bg.setAttribute('width',  String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx',     '6');
  bg.setAttribute('fill',   '#0b0d1430');
  bg.setAttribute('stroke', `${color}20`);
  bg.setAttribute('stroke-width', '1');
  innerG.appendChild(bg);

  // Center baseline
  const baseline = document.createElementNS(SVG_NS, 'line');
  baseline.setAttribute('x1',               String(-totalW / 2));
  baseline.setAttribute('y1',               '0');
  baseline.setAttribute('x2',               String(totalW / 2));
  baseline.setAttribute('y2',               '0');
  baseline.setAttribute('stroke',           '#ffffff15');
  baseline.setAttribute('stroke-width',     '1');
  baseline.setAttribute('stroke-dasharray', '4 3');
  innerG.appendChild(baseline);

  // Wave path
  const steps = 80;
  const dx    = totalW / steps;
  const parts = [];
  for (let i = 0; i <= steps; i++) {
    const px = -totalW / 2 + i * dx;
    const py = -amp * Math.sin((i / steps) * freq * 2 * Math.PI);
    parts.push(`${i === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`);
  }

  const wavePath = document.createElementNS(SVG_NS, 'path');
  wavePath.setAttribute('d',            parts.join(' '));
  wavePath.setAttribute('fill',         'none');
  wavePath.setAttribute('stroke',       color);
  wavePath.setAttribute('stroke-width', '2.5');
  innerG.appendChild(wavePath);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x',           '0');
    text.setAttribute('y',           String(totalH / 2 + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        color);
    text.setAttribute('font-size',   '12');
    text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

### 9.9 General Purpose Components

```js
// player/components/table.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

export function renderTable(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  const totalW = Math.max((entity.size?.width  ?? 20) / 100 * 1920, 150);
  const totalH = Math.max((entity.size?.height ?? 16) / 100 * 1080, 100);
  const color  = entity.color ?? '#00e5ff';
  const meta   = entity.metadata ?? {};
  const headers = meta.headers ?? ['Column A', 'Column B'];
  const rows    = meta.rows    ?? [['value 1', 'value 2']];
  const highlightRows = meta.highlightRows ?? [];
  const rowH   = 24;
  const colW   = (totalW - 16) / headers.length;

  // Background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x',      String(-totalW / 2));
  bg.setAttribute('y',      String(-totalH / 2));
  bg.setAttribute('width',  String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx',     '8');
  bg.setAttribute('fill',   '#0b0d1460');
  bg.setAttribute('stroke', color);
  bg.setAttribute('stroke-width', '1.5');
  innerG.appendChild(bg);

  // Title
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x',           '0');
    title.setAttribute('y',           String(-totalH / 2 + 16));
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill',        color);
    title.setAttribute('font-size',   '11');
    title.setAttribute('font-weight', '600');
    title.setAttribute('font-family', 'Geist Mono, monospace');
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  const tableStartY = -totalH / 2 + (entity.label ? 28 : 10);

  // Header row
  for (let i = 0; i < headers.length; i++) {
    const hx = -totalW / 2 + 8 + i * colW + colW / 2;
    const ht = document.createElementNS(SVG_NS, 'text');
    ht.setAttribute('x',           String(hx));
    ht.setAttribute('y',           String(tableStartY + 14));
    ht.setAttribute('text-anchor', 'middle');
    ht.setAttribute('fill',        color);
    ht.setAttribute('font-size',   '10');
    ht.setAttribute('font-weight', '600');
    ht.setAttribute('font-family', 'Geist Mono, monospace');
    ht.textContent = headers[i];
    innerG.appendChild(ht);
  }

  // Header underline
  const hLine = document.createElementNS(SVG_NS, 'line');
  hLine.setAttribute('x1',           String(-totalW / 2 + 8));
  hLine.setAttribute('y1',           String(tableStartY + rowH - 2));
  hLine.setAttribute('x2',           String(totalW / 2 - 8));
  hLine.setAttribute('y2',           String(tableStartY + rowH - 2));
  hLine.setAttribute('stroke',       `${color}30`);
  hLine.setAttribute('stroke-width', '1');
  innerG.appendChild(hLine);

  // Data rows
  const maxRows = Math.floor((totalH - tableStartY - totalH / 2 - rowH - 10) / rowH);
  for (let ri = 0; ri < Math.min(rows.length, maxRows); ri++) {
    const ry = tableStartY + (ri + 1) * rowH + 14;
    const isHighlighted = highlightRows.includes(ri);

    if (isHighlighted) {
      const hilite = document.createElementNS(SVG_NS, 'rect');
      hilite.setAttribute('x',      String(-totalW / 2 + 8));
      hilite.setAttribute('y',      String(tableStartY + (ri + 1) * rowH));
      hilite.setAttribute('width',  String(totalW - 16));
      hilite.setAttribute('height', String(rowH));
      hilite.setAttribute('fill',   `${color}15`);
      innerG.appendChild(hilite);
    }

    for (let ci = 0; ci < rows[ri].length; ci++) {
      const cx = -totalW / 2 + 8 + ci * colW + colW / 2;
      const ct = document.createElementNS(SVG_NS, 'text');
      ct.setAttribute('x',           String(cx));
      ct.setAttribute('y',           String(ry));
      ct.setAttribute('text-anchor', 'middle');
      ct.setAttribute('fill',        '#ffffff90');
      ct.setAttribute('font-size',   '10');
      ct.setAttribute('font-family', 'Geist Mono, monospace');
      ct.textContent = String(rows[ri][ci]);
      innerG.appendChild(ct);
    }
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

### 9.10 Pedagogical Components

```js
// player/components/codeblock.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

export function renderCodeBlock(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  const totalW = Math.max((entity.size?.width  ?? 22) / 100 * 1920, 180);
  const totalH = Math.max((entity.size?.height ?? 18) / 100 * 1080, 100);
  const color  = entity.color ?? '#b388ff';
  const meta   = entity.metadata ?? {};
  const lang   = meta.language ?? entity.codeLanguage ?? '';
  const lines  = meta.lines
    ?? (meta.code ? meta.code.split('\n') : null)
    ?? (entity.textContent ?? ['// code']);
  const lineH   = 16;
  const padTop  = 30;

  // Dark background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x',      String(-totalW / 2));
  bg.setAttribute('y',      String(-totalH / 2));
  bg.setAttribute('width',  String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx',     '8');
  bg.setAttribute('fill',   '#1a1a2e');
  bg.setAttribute('stroke', `${color}30`);
  bg.setAttribute('stroke-width', '1.5');
  innerG.appendChild(bg);

  // Title bar background
  const titleBar = document.createElementNS(SVG_NS, 'rect');
  titleBar.setAttribute('x',      String(-totalW / 2));
  titleBar.setAttribute('y',      String(-totalH / 2));
  titleBar.setAttribute('width',  String(totalW));
  titleBar.setAttribute('height', '22');
  titleBar.setAttribute('rx',     '8');
  titleBar.setAttribute('fill',   `${color}15`);
  innerG.appendChild(titleBar);

  // Title bar bottom fill (flatten bottom corners)
  const titleBarBottom = document.createElementNS(SVG_NS, 'rect');
  titleBarBottom.setAttribute('x',      String(-totalW / 2));
  titleBarBottom.setAttribute('y',      String(-totalH / 2 + 14));
  titleBarBottom.setAttribute('width',  String(totalW));
  titleBarBottom.setAttribute('height', '8');
  titleBarBottom.setAttribute('fill',   `${color}15`);
  innerG.appendChild(titleBarBottom);

  // Traffic-light dots
  const dotColors = ['#ff5f57', '#febc2e', '#28c840'];
  for (let i = 0; i < 3; i++) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx',   String(-totalW / 2 + 14 + i * 12));
    dot.setAttribute('cy',   String(-totalH / 2 + 11));
    dot.setAttribute('r',    '4');
    dot.setAttribute('fill', dotColors[i]);
    innerG.appendChild(dot);
  }

  // Language label (top-right of title bar)
  if (lang) {
    const langText = document.createElementNS(SVG_NS, 'text');
    langText.setAttribute('x',           String(totalW / 2 - 10));
    langText.setAttribute('y',           String(-totalH / 2 + 14));
    langText.setAttribute('text-anchor', 'end');
    langText.setAttribute('fill',        `${color}60`);
    langText.setAttribute('font-size',   '9');
    langText.setAttribute('font-family', 'Geist Mono, monospace');
    langText.textContent = lang;
    innerG.appendChild(langText);
  }

  // Code lines
  const maxLines = Math.floor((totalH - padTop - 8) / lineH);
  const startY   = -totalH / 2 + padTop + 8;
  for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
    const lt = document.createElementNS(SVG_NS, 'text');
    lt.setAttribute('x',           String(-totalW / 2 + 16));
    lt.setAttribute('y',           String(startY + i * lineH));
    lt.setAttribute('text-anchor', 'start');
    lt.setAttribute('fill',        '#e0e0e0');
    lt.setAttribute('font-size',   '11');
    lt.setAttribute('font-family', 'Geist Mono, monospace');
    lt.setAttribute('opacity',     '0.9');
    lt.textContent = lines[i];
    innerG.appendChild(lt);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

```js
// player/components/steplist.js

import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from '../utils.js';

export function renderStepList(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);

  const totalW = Math.max((entity.size?.width  ?? 18) / 100 * 1920, 140);
  const totalH = Math.max((entity.size?.height ?? 20) / 100 * 1080, 100);
  const color  = entity.color ?? '#00e5ff';
  const meta   = entity.metadata ?? {};
  const steps  = meta.steps ?? (entity.label ? [entity.label] : ['Step 1']);
  const stepH  = Math.min(36, (totalH - 20) / Math.max(steps.length, 1));
  const startY = -((steps.length - 1) * stepH) / 2;
  const circR  = 11;

  // Background
  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x',      String(-totalW / 2));
  bg.setAttribute('y',      String(-totalH / 2));
  bg.setAttribute('width',  String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx',     '10');
  bg.setAttribute('fill',   '#0b0d1430');
  bg.setAttribute('stroke', `${color}25`);
  bg.setAttribute('stroke-width', '1');
  innerG.appendChild(bg);

  const lineX = -totalW / 2 + 30;

  for (let i = 0; i < steps.length; i++) {
    const sy = startY + i * stepH;

    // Connector line between circles (skip first item)
    if (i > 0) {
      const connLine = document.createElementNS(SVG_NS, 'line');
      connLine.setAttribute('x1',           String(lineX));
      connLine.setAttribute('y1',           String(sy - stepH + circR));
      connLine.setAttribute('x2',           String(lineX));
      connLine.setAttribute('y2',           String(sy - circR));
      connLine.setAttribute('stroke',       `${color}40`);
      connLine.setAttribute('stroke-width', '2');
      innerG.appendChild(connLine);
    }

    // Numbered circle
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx',           String(lineX));
    circle.setAttribute('cy',           String(sy));
    circle.setAttribute('r',            String(circR));
    circle.setAttribute('fill',         `${color}20`);
    circle.setAttribute('stroke',       color);
    circle.setAttribute('stroke-width', '1.5');
    innerG.appendChild(circle);

    const num = document.createElementNS(SVG_NS, 'text');
    num.setAttribute('x',           String(lineX));
    num.setAttribute('y',           String(sy + 4));
    num.setAttribute('text-anchor', 'middle');
    num.setAttribute('fill',        color);
    num.setAttribute('font-size',   '10');
    num.setAttribute('font-weight', '700');
    num.setAttribute('font-family', 'Geist Mono, monospace');
    num.textContent = String(i + 1);
    innerG.appendChild(num);

    // Step text
    const stepText = document.createElementNS(SVG_NS, 'text');
    stepText.setAttribute('x',           String(lineX + 20));
    stepText.setAttribute('y',           String(sy + 4));
    stepText.setAttribute('text-anchor', 'start');
    stepText.setAttribute('fill',        '#e0e0e0');
    stepText.setAttribute('font-size',   '11');
    stepText.setAttribute('font-weight', '500');
    stepText.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    stepText.textContent = steps[i];
    innerG.appendChild(stepText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
```

---

## 10. Arrow and Connection Resolution

### 10.1 The Connection Problem

The agent emits Arrow entities with `sourceEntityId` and `targetEntityId` referencing other entities by their `id` field. However, the agent may also reference entities by label when the exact ID is not known. The renderer must handle both cases, plus graceful degradation for near-matches.

### 10.2 Fuzzy Lookup Chain

```js
// player/utils.js

/**
 * Resolve an entity reference string to a VisualEntity.
 * Three-tier lookup:
 *   1. Exact ID match
 *   2. Exact label match (case-insensitive)
 *   3. Substring match (label includes ref)
 *
 * Returns null if no match found (arrow will not be rendered).
 *
 * @param {string}   ref         - Value from sourceEntityId / targetEntityId
 * @param {object[]} allEntities - All entities in the current frame
 * @returns {object|null}
 */
export function resolveEntityRef(ref, allEntities) {
  if (!ref || !allEntities?.length) return null;

  // Tier 1: Exact ID
  let found = allEntities.find(e => e.id === ref);
  if (found) return found;

  // Tier 2: Exact label (case-insensitive)
  found = allEntities.find(
    e => e.label?.toLowerCase() === ref.toLowerCase()
  );
  if (found) return found;

  // Tier 3: Substring (e.g. ref="API" matches label="API Gateway")
  found = allEntities.find(
    e => e.label?.toLowerCase().includes(ref.toLowerCase())
  );
  return found ?? null;
}
```

### 10.3 Why Arrows Run in Pass 2

```
Pass 1 (all non-Arrow entities rendered):
  "client-1"   → renderUser()   → DOM node at position (10%, 50%)
  "gateway-1"  → renderAPIGateway() → DOM node at position (30%, 50%)
  "server-1"   → renderServer() → DOM node at position (55%, 30%)

Pass 2 (Arrow entities):
  Arrow "client-1" → "gateway-1":
    resolveEntityRef("client-1", entities) → { position: {x:10, y:50} }
    resolveEntityRef("gateway-1", entities) → { position: {x:30, y:50} }
    x1 = (10/100)*1920 = 192px
    y1 = (50/100)*1080 = 540px
    x2 = (30/100)*1920 = 576px
    y2 = (50/100)*1080 = 540px
    → <line x1="192" y1="540" x2="576" y2="540" marker-end="url(#arrowhead-...)">
```

### 10.4 Global Arrowhead Defs

A default arrowhead marker is injected once by the scene controller on initialization. Per-arrow markers (for different colors) are created on demand by `ensureArrowheadMarker()`:

```js
// player/scene-controller.js (initialization)

function initSVGDefs(svgEl) {
  const defs = document.createElementNS(SVG_NS, 'defs');

  // Default white arrowhead
  const marker = document.createElementNS(SVG_NS, 'marker');
  marker.setAttribute('id',          'arrowhead');
  marker.setAttribute('markerWidth',  '10');
  marker.setAttribute('markerHeight', '10');
  marker.setAttribute('refX',         '9');
  marker.setAttribute('refY',         '3');
  marker.setAttribute('orient',       'auto');

  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', '0 0, 10 3, 0 6');
  polygon.setAttribute('fill',   '#ffffff');

  marker.appendChild(polygon);
  defs.appendChild(marker);
  svgEl.insertBefore(defs, svgEl.firstChild);
}
```

---

## 11. Entrance Animation CSS

### 11.1 CSS Keyframes

All entrance animations are CSS keyframes, injected once into `<head>` by `player.css`. They operate entirely on the compositor thread — no JavaScript involved at animation time.

```css
/* player/player.css */

/* ─── Base class (applied to all innerG elements) ─── */
.animate-element {
  transform-box:    fill-box;          /* scope transform-origin to element bounding box */
  transform-origin: center center;     /* scale/rotate from visual center */
  will-change:      transform, opacity; /* GPU compositing layer hint */
}

/* ─── @keyframes definitions ─── */

@keyframes fadeInUp {
  from {
    opacity:   0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity:   1;
    transform: translateY(0)    scale(1);
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

@keyframes drawIn {
  from { opacity: 0; transform: scale(0.8); }
  to   { opacity: 1; transform: scale(1);   }
}

@keyframes scaleIn {
  from { opacity: 0; transform: scale(0); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes slideInLeft {
  from { opacity: 0; transform: translateX(-30px); }
  to   { opacity: 1; transform: translateX(0);     }
}

@keyframes slideInUp {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0);    }
}

/* ─── Entrance animation classes ─── */

.entrance-fadeInUp {
  animation: fadeInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-fadeIn {
  animation: fadeIn 0.3s ease both;
}

.entrance-drawIn {
  animation: drawIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.entrance-scaleIn {
  animation: scaleIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.entrance-slideInLeft {
  animation: slideInLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-slideInUp {
  animation: slideInUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ─── Graph/chart animations ─── */

/* Used by Graph2D, Wave to animate the path drawing */
.graph-line-draw {
  stroke-dashoffset: 1000;
  stroke-dasharray:  1000;
  animation: drawLine 1.2s ease forwards;
}

@keyframes drawLine {
  to { stroke-dashoffset: 0; }
}

/* Bar/histogram grow-up animation */
.histogram-bar-grow {
  transform-origin: bottom;
  transform-box:    fill-box;
  animation: barGrow 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes barGrow {
  from { transform: scaleY(0); }
  to   { transform: scaleY(1); }
}
```

### 11.2 Applying Entrance Animation in JS

The `applyEntranceAnimation` helper is called at the end of every render function:

```js
// player/utils.js

/**
 * Apply CSS entrance animation class and animation-delay to an innerG element.
 * This is the final step in every render function.
 *
 * @param {SVGGElement} innerG  - The inner animation-target <g>
 * @param {object}      entity  - VisualEntity (reads animation.entrance and animation.delay)
 */
export function applyEntranceAnimation(innerG, entity) {
  const animClass = entity.animation?.entrance ?? 'entrance-fadeInUp';
  innerG.classList.add(animClass);

  const delay = entity.animation?.delay ?? 0;
  if (delay > 0) {
    innerG.style.animationDelay = `${delay}ms`;
  }
}
```

### 11.3 Temporal Choreography via Delay

The agent controls appearance order by setting `animation.delay` on each entity. Because CSS `animation-delay` is a pure browser-side property, there is zero JavaScript overhead for choreography:

```json
[
  { "id": "e1", "animation": { "delay": 0,   "entrance": "entrance-fadeInUp" }},
  { "id": "e2", "animation": { "delay": 150, "entrance": "entrance-fadeInUp" }},
  { "id": "e3", "animation": { "delay": 300, "entrance": "entrance-fadeInUp" }},
  { "id": "e4", "animation": { "delay": 450, "entrance": "entrance-fadeIn"   }},
  { "id": "arrow-1", "animation": { "delay": 600, "entrance": "entrance-fadeIn" }}
]
```

This cascade produces a staggered entrance with each entity appearing 150ms after the last — entirely driven by CSS, using no `setTimeout` or `setInterval`.

---

## 12. GSAP Integration for Transitions

### 12.1 Role of GSAP in V1

GSAP is used exclusively for **inter-frame property tweens** — animating entities from their state in frame N to their state in frame N+1. It is **not** used for entrance animations (those are CSS keyframes).

**GSAP is never used to animate:**
- `fill` color attributes
- `stroke` attributes
- `cx`, `cy`, `width`, `height`, `rx` attributes
- Any SVG presentation attribute

**GSAP only animates GPU-accelerated CSS properties:**
- `opacity`
- CSS `transform` (via `gsap.to(el, { x, y, scale, rotation })`)

### 12.2 Transition Contract

When the scene controller advances from frame N to frame N+1, GSAP handles entity continuity:

```js
// player/scene-controller.js (frame transition)

import { gsap } from 'gsap';

/**
 * Animate entity changes between frames.
 * Called by transitionToFrame() after diffing entity states.
 *
 * Only animates opacity and transform — never fill/stroke/geometry.
 *
 * @param {object} transition - EntityTransition from types.ts
 *   { entityId, from: Partial<VisualEntity>, to: Partial<VisualEntity>, duration, easing }
 */
function animateEntityTransition(transition) {
  const el = document.getElementById(transition.entityId);
  if (!el) return;

  const innerG = el.firstElementChild; // The animation-target <g>
  if (!innerG) return;

  const duration = (transition.duration ?? 450) / 1000; // convert ms → seconds
  const ease     = transition.easing ?? 'power2.inOut';

  const tweenProps = { duration, ease };

  // Position change: update outer <g> transform attribute (not CSS)
  if (transition.to.position) {
    const newX = (transition.to.position.x / 100) * 1920;
    const newY = (transition.to.position.y / 100) * 1080;
    gsap.to(el, {
      duration,
      ease,
      attr: { transform: `translate(${newX}, ${newY})` },
    });
  }

  // Opacity change: animate on innerG
  if (transition.to.highlight !== undefined) {
    tweenProps.opacity = transition.to.highlight ? 1.0 : 0.6;
    gsap.to(innerG, tweenProps);
  }

  // Scale change: animate on innerG
  if (transition.to.size) {
    const scaleRatio = transition.to.size.width / (transition.from?.size?.width ?? transition.to.size.width);
    gsap.to(innerG, { duration, ease, scale: scaleRatio });
  }
}
```

### 12.3 Exit Animation

When an entity is present in frame N but not in frame N+1, GSAP fades it out before the DOM node is removed:

```js
function exitEntity(entityId, duration = 300) {
  const el = document.getElementById(entityId);
  if (!el) return Promise.resolve();

  const innerG = el.firstElementChild;
  return new Promise(resolve => {
    gsap.to(innerG, {
      opacity:  0,
      scale:    0.9,
      duration: duration / 1000,
      ease:     'power2.in',
      onComplete: () => {
        el.remove();
        resolve();
      },
    });
  });
}
```

### 12.4 GSAP Ticker Rule

GSAP must be initialized to use its own `requestAnimationFrame` ticker, not `setInterval`. This is the default behavior when GSAP is imported normally. Do not call `gsap.ticker.add()` for anything other than GSAP-managed animations:

```js
// player/player.js — initialization

import { gsap } from 'gsap';

// GSAP uses rAF by default — no configuration needed.
// NEVER use gsap.ticker.add() for non-GSAP code.
// NEVER use setInterval/setTimeout for animation loops.
console.log(`[PRE] GSAP ${gsap.version} initialized`);
```

### 12.5 GSAP Licensing Note

GSAP 3.13 is owned by Webflow and includes a "no competitors" clause in the commercial license. For V1 (internal tooling), the free-tier license is sufficient. Flag this for review before any commercial release that competes with Webflow's product suite.

---

## 13. Scene Controller Integration

### 13.1 SceneController API

The scene controller is the top-level orchestrator. It:

1. Receives `VisualScript` JSON from the SSE channel
2. Maintains a sorted array of `IllustrationFrame[]`
3. Renders each frame on cue, using the component registry
4. Handles frame transitions via GSAP
5. Manages SVG canvas cleanup between scenes

```js
// player/scene-controller.js

import { registry, renderEntity } from './registry.js';
import { initSVGDefs }            from './utils.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

class SceneController {
  constructor(svgEl) {
    this.svg         = svgEl;         // <svg> canvas element
    this.script      = null;          // VisualScript
    this.currentFrame = null;
    this.entityMap   = new Map();     // entityId → DOM element

    initSVGDefs(svgEl);               // Inject <defs> arrowhead markers
  }

  /**
   * Load and render a VisualScript.
   * Replaces any current content.
   */
  loadScript(script) {
    this.script = script;
    this.clear();
    if (script.frames?.length > 0) {
      this.renderFrame(script.frames[0]);
    }
  }

  /**
   * Seek to a specific frame by index.
   * Handles entity diffing and GSAP transitions.
   */
  seekToFrame(frameIndex) {
    const frame = this.script?.frames[frameIndex];
    if (!frame) return;
    this.renderFrame(frame);
  }

  /**
   * Render a single frame:
   *   Pass 1 — all non-Arrow entities
   *   Pass 2 — Arrow and DataFlow entities
   */
  renderFrame(frame) {
    this.clear();
    this.currentFrame = frame;

    const { entities } = frame;

    // Pass 1: all entity types except connectors
    for (const entity of entities) {
      if (entity.type === 'Arrow' || entity.type === 'DataFlow') continue;
      const el = renderEntity(entity, this.svg);
      if (el) this.entityMap.set(entity.id, el);
    }

    // Pass 2: connectors (require Pass 1 positions to be resolved)
    for (const entity of entities) {
      if (entity.type !== 'Arrow' && entity.type !== 'DataFlow') continue;
      const el = renderEntity(entity, this.svg, entities);
      if (el) this.entityMap.set(entity.id, el);
    }
  }

  /**
   * Patch a single entity's properties at runtime.
   * Used for real-time highlighting during narration.
   */
  patchEntity(entityId, patch) {
    const el = this.entityMap.get(entityId);
    if (!el) return;

    if (patch.highlight !== undefined) {
      const innerG = el.firstElementChild;
      if (innerG) {
        gsap.to(innerG, {
          opacity:  patch.highlight ? 1.0 : 0.5,
          scale:    patch.highlight ? 1.05 : 1.0,
          duration: 0.25,
          ease:     'power2.out',
        });
      }
    }

    if (patch.position) {
      const cx = (patch.position.x / 100) * 1920;
      const cy = (patch.position.y / 100) * 1080;
      gsap.to(el, {
        attr:     { transform: `translate(${cx}, ${cy})` },
        duration: 0.4,
        ease:     'power2.inOut',
      });
    }
  }

  /**
   * Remove all rendered entities from the canvas.
   */
  clear() {
    // Remove all child elements except <defs>
    const children = Array.from(this.svg.children);
    for (const child of children) {
      if (child.tagName !== 'defs') child.remove();
    }
    this.entityMap.clear();
    this.currentFrame = null;
  }
}

export { SceneController };
```

### 13.2 SSE Integration

The scene controller is driven by SSE events from the MCP server:

```js
// player/player.js

import { SceneController } from './scene-controller.js';

const SESSION_ID = new URLSearchParams(location.search).get('session')
  ?? document.querySelector('[data-session-id]')?.dataset.sessionId;

const svgCanvas = document.getElementById('canvas');
const controller = new SceneController(svgCanvas);

// Connect to SSE stream
const es = new EventSource(`/session/${SESSION_ID}/events`);

es.addEventListener('script_update', e => {
  const { script } = JSON.parse(e.data);
  controller.loadScript(script);
});

es.addEventListener('seek', e => {
  const { frameIndex } = JSON.parse(e.data);
  controller.seekToFrame(frameIndex);
});

es.addEventListener('entity_patch', e => {
  const { entityId, patch } = JSON.parse(e.data);
  controller.patchEntity(entityId, patch);
});

es.addEventListener('clear', () => {
  controller.clear();
});

es.onerror = err => {
  console.warn('[PRE SSE] Connection error — browser will auto-reconnect', err);
};
```

---

## 14. File Structure

```
player/
├── player.html              # Host page. Contains <svg id="canvas" viewBox="0 0 1920 1080">
├── player.css               # Global styles: .animate-element, @keyframes, entrance classes
├── player.js                # Entry point: SSE connection, SceneController instantiation
│
├── scene-controller.js      # Frame rendering orchestrator, entity diffing, GSAP transitions
├── registry.js              # Component registry (Map<type, renderFn>) + renderEntity() dispatcher
│
├── utils.js                 # Shared helpers:
│   │                        #   buildEntityGroup(), applyEntranceAnimation(),
│   │                        #   resolveEntityRef(), initSVGDefs(), getSizeParam()
│   └──
│
└── components/
    │
    ├── ── Infrastructure
    ├── server.js            # renderServer()
    ├── database.js          # renderDatabase()
    ├── container.js         # renderContainer()
    ├── pod.js               # renderPod()
    ├── cloud.js             # renderCloud()
    ├── network.js           # renderNetwork()
    ├── device.js            # renderDevice()
    ├── user.js              # renderUser()
    ├── arrow.js             # renderArrow(), renderDataFlow(), resolveEntityRef(), ensureArrowheadMarker()
    ├── process.js           # renderProcess()
    ├── queue.js             # renderQueue()
    ├── cache.js             # renderCache()
    ├── loadbalancer.js      # renderLoadBalancer()
    ├── service.js           # renderService()
    ├── firewall.js          # renderFirewall()
    ├── apigateway.js        # renderAPIGateway()
    ├── lambda.js            # renderLambda()
    ├── subnet.js            # renderSubnet()
    ├── volume.js            # renderVolume()
    ├── registry-shape.js    # renderRegistry()    (named registry-shape to avoid name clash)
    ├── monitor.js           # renderMonitor()
    ├── pipeline.js          # renderPipeline()
    ├── decision.js          # renderDecision()
    ├── cluster.js           # renderCluster()
    │
    ├── ── Universal
    ├── concept.js           # renderConcept()
    ├── entity.js            # renderEntity()      (generic entity box)
    ├── group.js             # renderGroup()
    ├── label.js             # renderLabel()
    ├── comparison.js        # renderComparison()
    ├── timeline.js          # renderTimeline()
    ├── metric.js            # renderMetric()
    ├── cycle.js             # renderCycle()
    ├── stack.js             # renderStack()
    ├── tree.js              # renderTree()
    ├── badge.js             # renderBadge()
    ├── quote.js             # renderQuote()
    │
    ├── ── Math & Science
    ├── equation.js          # renderEquation()    (KaTeX, fallback monospace)
    ├── expression.js        # renderExpression()  (inline KaTeX)
    ├── matrix.js            # renderMatrix()      (KaTeX matrix)
    ├── graph2d.js           # renderGraph2D()     (explicit / parametric / implicit / points)
    ├── numberline.js        # renderNumberLine()
    ├── coordinatesystem.js  # renderCoordinateSystem()
    │
    ├── ── Physics
    ├── freebodydiagram.js   # renderFreeBodyDiagram()
    ├── circuit.js           # renderCircuit()
    ├── wave.js              # renderWave()
    ├── vector.js            # renderVector()
    ├── field.js             # renderField()
    ├── particle.js          # renderParticle()
    │
    ├── ── General Purpose
    ├── table.js             # renderTable()
    ├── histogram.js         # renderHistogram()
    ├── piechart.js          # renderPieChart()
    ├── flowdiagram.js       # renderFlowDiagram()
    ├── venndiagram.js       # renderVennDiagram()
    ├── annotation.js        # renderAnnotation()
    │
    └── ── Pedagogical
        ├── steplist.js      # renderStepList()
        ├── codeblock.js     # renderCodeBlock()
        ├── definition.js    # renderDefinition()
        ├── callout.js       # renderCallout()
        ├── barchart.js      # renderBarChart()
        ├── scatterplot.js   # renderScatterPlot()
        ├── proof.js         # renderProof()
        ├── analogy.js       # renderAnalogy()
        │
        ├── ── Data Structures
        ├── array.js             # renderArray()
        ├── linkedlist.js        # renderLinkedList()
        ├── binarytree.js        # renderBinaryTree()
        ├── hashtable.js         # renderHashTable()
        ├── heap.js              # renderHeap()
        ├── graphds.js           # renderGraphDS()
        ├── trie.js              # renderTrie()
        │
        ├── ── Algorithm Visualization
        ├── arraycell.js         # renderArrayCell()
        ├── pointer.js           # renderPointer()
        ├── recursiontree.js     # renderRecursionTree()
        │
        ├── ── Automata & Theory
        ├── fsm.js               # renderFSM()
        ├── statenode.js         # renderStateNode()
        ├── transition.js        # renderTransition()  (special: needs sourceEntityId/targetEntityId)
        │
        ├── ── Computer Architecture
        ├── cpu.js               # renderCPU()
        ├── register.js          # renderRegister()
        ├── memoryblock.js       # renderMemoryBlock()
        ├── logicgate.js         # renderLogicGate()
        ├── bus.js               # renderBus()         (special: needs sourceEntityId/targetEntityId)
        │
        ├── ── Operating Systems
        ├── processblock.js      # renderProcessBlock()
        ├── memorymap.js         # renderMemoryMap()
        ├── thread.js            # renderThread()
        │
        ├── ── Networking
        ├── packet.js            # renderPacket()
        ├── protocolstack.js     # renderProtocolStack()
        │
        └── ── Machine Learning
            ├── neuralnetwork.js     # renderNeuralNetwork()
            └── decisionboundary.js  # renderDecisionBoundary()
```

### 14.1 player.html Skeleton

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRE Player</title>
  <!-- KaTeX (optional — loaded if math entities are needed) -->
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css">
  <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js"
          onload="window.__katex = katex"></script>
  <!-- GSAP -->
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13/dist/gsap.min.js"></script>
  <!-- PRE Player styles -->
  <link rel="stylesheet" href="./player.css">
</head>
<body>
  <div id="player-container">
    <svg
      id="canvas"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <!-- Content injected by scene-controller.js -->
    </svg>
  </div>
  <script type="module" src="./player.js"></script>
</body>
</html>
```

---

## 15. Performance Contracts

These are hard limits. Exceeding them degrades presentation quality or causes frame drops on the target hardware (commodity VPS serving via nginx reverse proxy, client is a modern laptop browser).

### 15.1 Element Count

| Metric | Limit | Rationale |
|--------|-------|-----------|
| Animated elements per frame | **≤ 500** | Browser compositing budget; each `will-change` element is an independent layer |
| Simultaneous CSS animations | **≤ 200** | Compositor thread scheduling |
| Entities per `IllustrationFrame` | **≤ 100** | Agent-side guidance; renderer supports more |
| `<path>` elements with complex `d` | **≤ 50** | SVG path rasterization cost |

### 15.2 Animatable Properties

GSAP and CSS animations must only target GPU-accelerated properties. Animating non-GPU properties forces a layout/paint cycle on the main thread, causing jank.

| ✅ GPU-Accelerated (safe to animate) | ❌ Non-GPU (never animate) |
|--------------------------------------|---------------------------|
| `opacity` | `fill` |
| CSS `transform` (translate, scale, rotate) | `stroke` |
| `filter` (blur, brightness — modern browsers) | `stroke-width` |
| | `cx`, `cy` (SVG geometry) |
| | `width`, `height` |
| | `rx`, `ry` |
| | `font-size` |

### 15.3 Double-`<g>` Isolation

The outer `<g>` must never receive CSS `transform` or `animation`. Violation causes rendering artifacts:

```js
// ✅ Correct
outerG.setAttribute('transform', 'translate(576, 540)');  // SVG attribute only
innerG.style.animationDelay = '300ms';                    // CSS only on innerG

// ❌ WRONG — will cause snap to (0,0) on animation
outerG.style.transform = 'translate(576px, 540px)';       // Never set CSS transform on outerG
```

### 15.4 GSAP Constraints

```js
// ✅ Correct — GSAP animates CSS properties only
gsap.to(innerG, { opacity: 0, scale: 0.9, duration: 0.3 });
gsap.to(outerG, { attr: { transform: 'translate(600, 540)' }, duration: 0.4 }); // attr plugin for SVG attrs

// ❌ WRONG — animating SVG geometry attributes directly (forced repaint)
gsap.to(rect, { attr: { width: 100, height: 80, fill: '#ff0000' }, duration: 0.3 });
```

### 15.5 Memory and Cleanup

- Call `controller.clear()` between scenes — do not accumulate DOM nodes
- Arrow component `ensureArrowheadMarker()` is idempotent — safe to call repeatedly
- GSAP timelines must be killed on scene change: `tl.kill()` before `controller.clear()`
- `will-change: transform, opacity` is applied only to `innerG` elements — do not apply to SVG root or large container groups

### 15.6 Animation Timing Budget

| Phase | Budget |
|-------|--------|
| Frame render (DOM creation) | < 16ms (one rAF frame) |
| Entrance animation total duration | 400–600ms typical, ≤ 1200ms max |
| Inter-frame GSAP transition | 300–500ms |
| SSE event → first pixel change | < 50ms |

---

## 16. Extensibility: Registering New Types at Runtime

The registry is a plain mutable object. New entity types can be added at any point before the scene controller renders a frame referencing them:

```js
// Runtime registration — add a custom "Blockchain" entity type
import { registry } from './registry.js';
import { SVG_NS, buildEntityGroup, applyEntranceAnimation } from './utils.js';

function renderBlockchain(entity, parentEl) {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s     = 50;
  const color = entity.color ?? '#f6851b'; // MetaMask orange

  // Chain link visual: three connected hexagons
  for (let i = 0; i < 3; i++) {
    const ox   = (i - 1) * s * 0.7;
    const hex  = document.createElementNS(SVG_NS, 'polygon');
    const pts  = [0, 1, 2, 3, 4, 5].map(n => {
      const a = (Math.PI / 3) * n;
      return `${(ox + Math.cos(a) * s * 0.35).toFixed(1)},${(Math.sin(a) * s * 0.35).toFixed(1)}`;
    }).join(' ');
    hex.setAttribute('points',       pts);
    hex.setAttribute('fill',         `${color}${i === 1 ? '25' : '12'}`);
    hex.setAttribute('stroke',       color);
    hex.setAttribute('stroke-width', '1.5');
    innerG.appendChild(hex);
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x',           '0');
    text.setAttribute('y',           String(s * 0.5 + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill',        color);
    text.setAttribute('font-size',   '13');
    text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}

// Register the new type
registry['Blockchain'] = renderBlockchain;

// From this point on, the agent can emit:
// { "type": "Blockchain", "position": { "x": 50, "y": 50 }, "label": "Ledger" }
// and it will render correctly.
```

**Rules for custom render functions:**

1. Always call `buildEntityGroup(entity)` first — this creates the double-`<g>` structure
2. Append all shapes to `innerG`, never to `outerG`
3. Always call `applyEntranceAnimation(innerG, entity)` at the end
4. Always call `parentEl.appendChild(outerG)` at the end
5. Always return `outerG`
6. Use `entity.color ?? '#your-default'` — respect agent-specified colors

---

## 17. Entity Defaults Reference

The scene controller applies these defaults to any entity field not specified by the agent:

```js
// player/utils.js

export const ENTITY_DEFAULTS = {
  color:     '#4A90D9',
  highlight: false,
  animation: {
    delay:    0,
    duration: 450,
    easing:   'cubic-bezier(0.22, 1, 0.36, 1)',
    entrance: 'entrance-fadeInUp',
  },
};

/**
 * Merge entity fields with defaults.
 * Agent-provided values always win.
 */
export function withDefaults(entity) {
  return {
    ...entity,
    color:     entity.color     ?? ENTITY_DEFAULTS.color,
    highlight: entity.highlight ?? ENTITY_DEFAULTS.highlight,
    animation: {
      ...ENTITY_DEFAULTS.animation,
      ...entity.animation,
    },
  };
}
```

### 17.1 Default Colors by Category

| Category | Default Color | Hex |
|----------|---------------|-----|
| Infrastructure | Cyan | `#00e5ff` |
| User | Hot pink | `#ff2d7b` |
| Cloud | Teal | `#00bcd4` |
| Database | Lavender | `#b388ff` |
| Container / Pod | Green | `#00e676` |
| Queue / Device / Lambda | Amber | `#ffab00` |
| Firewall | Red | `#ff4444` |
| Subnet / Cluster | Blue | `#4488ff` |
| Universal | Cyan | `#00e5ff` |
| Metric | Hot pink | `#ff2d7b` |
| Physics — Vector | Pink | `#ff6b9d` |
| Physics — Field | Lavender | `#b388ff` |
| Math | Cyan | `#00e5ff` |
| Pedagogical — CodeBlock | Lavender | `#b388ff` |
| Pedagogical — Proof | Lavender | `#b388ff` |
| Pedagogical — Callout | Amber | `#ffab00` |
| General fallback | Steel blue | `#4A90D9` |
| Data Structures — Array / GraphDS / ArrayCell | Cyan | `#00e5ff` |
| Data Structures — LinkedList / Trie / Thread | Green | `#00e676` |
| Data Structures — BinaryTree / RecursionTree | Lavender | `#b388ff` |
| Data Structures — HashTable / Register / ProtocolStack | Amber | `#ffab00` |
| Data Structures — Heap / ProcessBlock | Teal | `#00bcd4` |
| Algorithm Visualization — Pointer | Red-orange | `#ff6b6b` |
| Automata — FSM / StateNode | Cyan | `#00e5ff` |
| Automata — Transition | White | `#ffffff` |
| Computer Architecture — CPU / Bus / LogicGate | Cyan / Green | `#00e5ff` / `#00e676` |
| Computer Architecture — MemoryBlock / MemoryMap | Lavender | `#b388ff` |
| Machine Learning — NeuralNetwork | Lavender | `#b388ff` |
| Machine Learning — DecisionBoundary | Cyan | `#00e5ff` |

---

## 18. KaTeX Integration for Math Types

### 18.1 Loading Strategy

KaTeX is loaded asynchronously. Math entity render functions check for `window.__katex` before attempting LaTeX rendering and fall back to monospace text if it is unavailable:

```html
<!-- player.html — KaTeX via CDN -->
<link rel="stylesheet"
      href="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.css">
<script defer
        src="https://cdn.jsdelivr.net/npm/katex@0.16/dist/katex.min.js"
        onload="window.__katex = katex">
</script>
```

### 18.2 Render Pattern

```js
// Inside renderEquation(), renderExpression(), renderMatrix()

const katex = window.__katex;

if (katex) {
  try {
    const html = katex.renderToString(latexString, {
      throwOnError: false,
      displayMode:  isDisplayMode,  // true for block equations, false for inline
    });

    const fo = document.createElementNS(SVG_NS, 'foreignObject');
    fo.setAttribute('x',      String(x));
    fo.setAttribute('y',      String(y));
    fo.setAttribute('width',  String(w));
    fo.setAttribute('height', String(h));

    const div = document.createElement('div');
    div.style.cssText = `color: ${color}; font-size: 18px; display: flex;
                         align-items: center; justify-content: center;
                         height: 100%; overflow: hidden;`;
    div.innerHTML = html;

    fo.appendChild(div);
    innerG.appendChild(fo);

  } catch (err) {
    // Fall back to monospace text
    appendFallbackText(innerG, latexString, color);
  }
} else {
  // KaTeX not yet loaded — monospace fallback
  appendFallbackText(innerG, latexString, color);
}
```

### 18.3 Supported Math Entity Types

| Type | `metadata.latex` Example | Notes |
|------|--------------------------|-------|
| `Equation` | `"\\int_0^{\\infty} e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}"` | Display mode, dashed border box |
| `Expression` | `"f(x) = x^2 + 2x + 1"` | Inline mode, smaller container |
| `Matrix` | `"\\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix}"` | Display mode, square container |

### 18.4 Fallback Behavior

When KaTeX is unavailable (CDN not loaded, offline environment), all three types render the raw `latex` string in Geist Mono monospace font inside the entity box. This is always readable and parseable by a human, ensuring the presentation degrades gracefully.

---

## 19. What Was Removed from the Old System

The following patterns from the previous `05-illustration-system.md` are **entirely removed** from V1. Do not reference them in code, comments, or documentation.

| Removed Pattern | Reason |
|----------------|--------|
| 50 static SVG files (`server-idle.svg`, `database-active.svg`, etc.) | Replaced by programmatic render functions |
| Morph pair file naming convention (`*-source.svg` / `*-target.svg`) | No morphing in V1 |
| Anchor point count constraints | MorphSVGPlugin not used |
| Path topology validation rules | No path morphing |
| SVG file serving from `/assets/illustrations/` | No SVG files exist |
| `MorphSVGPlugin` import | Not needed; transitions via opacity/transform |
| `morphSVG.to(target, { shape: '#target-path' })` calls | Replaced by GSAP property tweens |
| `<use href="#illustration-server">` pattern | Replaced by `createElementNS` calls |
| Illustration ID → file path mapping table | Replaced by entity type → render function registry |
| Compile-time anchor count validation step | No morph pairs to validate |

**Key statement:** In V1, there are no SVG files involved in the illustration system. All visual output is generated at runtime from `VisualEntity` JSON data, using vanilla JavaScript `document.createElementNS()` calls. The component registry is the only "catalog" — it maps a type string to a function, and that function builds DOM nodes on demand.

---

*Architecture document — Presentation Rendering Engine (PRE) v1  
`@preplai/player` package — Illustration System  
Supersedes old `05-illustration-system.md` (static SVG file bank)*
