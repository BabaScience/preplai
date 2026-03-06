# Metadata Schemas for Entity Types

This document describes the expected `metadata` shapes for entity types that accept structured data.

> **For agents:** See [ILLUSTRATIONS_AGENT_GUIDE.md](./ILLUSTRATIONS_AGENT_GUIDE.md) for a quick reference on when to use each type and how to choose between similar ones.

## Headings (H1, H2, H3)

Section heading illustrations with typographic hierarchy. H1 = largest, H2 = medium, H3 = smallest.

```json
{
  "label": "Main Heading"
}
```

- `label`: Heading text (or use entity.label)
- No other metadata. Size controls scale; H1/H2/H3 control font size hierarchy.

## Text Card (Analogy, Annotation, Label, Comparison, Proof, Quote)

All these types inherit from the same text-card base. Same metadata for all:

```json
{
  "label": "Binary search is like a phone book. Divide and conquer on sorted array.",
  "width": 56,
  "maxLines": 3
}
```

- `label`: Text content (or use entity.label). Wraps to new lines by word; no shrinking
- `width`: Panel width in scale units (default 56). Drives font size and chars per line.
- `maxLines`: Max lines before truncation with "..." (default 3)
- Longer text → smaller font so all text stays visible. Font size is chosen as the largest (8–24px) that fits the full text within maxLines.

## Array

```json
{
  "values": ["a", "b", "c", "d", "e"],
  "disabledIndexes": [1, 3],
  "selectedIndexes": [0, 2]
}
```

Or with per-cell control:

```json
{
  "cells": [
    { "value": "a", "enabled": true },
    { "value": "b", "enabled": false },
    { "value": "c", "enabled": true },
    { "value": "d", "enabled": false },
    { "value": "e", "enabled": true }
  ]
}
```

- `values`: Array of strings or numbers — agent can display any values
- `cells`: Alternative — array of `{ value, enabled?, selected? }` for per-cell control
- `disabledIndexes`: 0-based indexes to show as disabled (dimmed, dashed border). Ignored when using `cells`
- `selectedIndexes`: 0-based indexes to highlight (thicker stroke, glow). Used for e.g. current comparison in binary search
- Max 8 cells displayed

## AST / ParseTree

```json
{
  "ast": {
    "type": "Program",
    "value": null,
    "children": [
      { "type": "FunctionDecl", "value": "main" },
      {
        "type": "BinaryExpr",
        "children": [
          { "type": "Literal", "value": "1" },
          { "type": "Literal", "value": "2" }
        ]
      }
    ]
  }
}
```

- `ast.type`: Node type string
- `ast.value`: Optional display value (string or number)
- `ast.children`: Optional array of child AST nodes

## CallStack

```json
{
  "frames": [
    { "name": "main()" },
    { "name": "processRequest()", "locals": "req, res" },
    { "name": "handleQuery()", "locals": "sql" }
  ]
}
```

- `frames`: Array of stack frames
- `frames[].name`: Function name
- `frames[].locals`: Optional local variables string

## Stack

Vertical stack of customizable layers. Use for: OSI model, tech stack, layered architecture, protocol stacks, any vertical hierarchy of labeled blocks. **Not** for call stacks (use CallStack) or cache levels (use CacheHierarchy).

```json
{
  "layers": [
    { "label": "Application", "sublabel": "HTTP, DNS" },
    { "label": "Transport", "sublabel": "TCP, UDP" },
    { "label": "Network", "sublabel": "IP" },
    { "label": "Link", "sublabel": "Ethernet" },
    { "label": "Physical", "sublabel": "Cables, signals" }
  ]
}
```

**Fields:**
- `layers`: **Required.** Array of layer definitions. Each layer: `{ label: string, sublabel?: string, color?: string }`
- `layers[].label`: Main label for the layer (e.g. "Application", "React")
- `layers[].sublabel`: Optional secondary text below the label (e.g. "HTTP, DNS", "v18")
- `layers[].color`: Optional hex color for this layer (e.g. `"#e040fb"`). Falls back to entity color if omitted.

**Agent usage:**
- Use Stack for: OSI/TCP-IP layers, tech stack diagrams (React, Node, PostgreSQL), layered architecture, any vertical list of labeled blocks where each block can have a main label and optional sublabel.
- Use CallStack for: function call stacks, recursion frames, stack traces.
- Use CacheHierarchy for: L1/L2/L3/RAM memory hierarchy.
- Use MemoryLayout for: stack vs heap memory regions side by side.
- Example: "OSI model layers" → `layers: [{label: "Application", sublabel: "HTTP"}, {label: "Transport", sublabel: "TCP"}, ...]`
- Example: "Tech stack" → `layers: [{label: "React", sublabel: "Frontend"}, {label: "Node.js", sublabel: "Backend"}, {label: "PostgreSQL", sublabel: "Database"}]`

## StepList

Numbered step sequence with circles, connecting lines, and optional progress indicators. Use for: algorithm walkthroughs, tutorials, how-to guides, sequential processes.

```json
{
  "steps": ["Initialize variables", "Process input", "Validate result", "Return output"],
  "currentStep": 1,
  "checkmarks": true
}
```

**Fields:**
- `steps`: **Required.** Array of strings — one step per line. Max 5 steps displayed. Fallback: `entity.textContent` split on newlines.
- `currentStep`: **Optional.** 0-based index of the current/active step. `-1` = none highlighted. When set, the current step gets a thicker border.
- `checkmarks`: **Optional.** If `true` and `currentStep >= 0`, completed steps (index < currentStep) show a checkmark instead of the number, with solid fill.

**Standard entity fields:** `label` (optional title above steps), `color`, `size`, `position`.

**Agent usage:**
- Use StepList for: algorithm steps, tutorial sequences, how-to flows, numbered procedures.
- Pair with CodeBlock + Array/BinaryTree for algorithm walkthroughs.
- Example: `steps: ["Parse input", "Validate", "Transform", "Output"]`, `currentStep: 2`, `checkmarks: true` — steps 1–2 show ✓, step 3 highlighted.

## BTree

B-trees, B+ trees, multi-way trees. Use for: database indexes, file systems, disk-based structures.

```json
{
  "tree": {
    "value": "[10,20]",
    "children": [
      { "value": "[3,6]", "children": [{ "value": "1" }, { "value": "4" }] },
      { "value": "[15]", "children": [{ "value": "12" }] },
      { "value": "[25,30]", "children": [{ "value": "22" }, { "value": "27" }] }
    ]
  },
  "branchingFactor": 3
}
```

**Fields:**
- `tree`: Root node — `{ value, children? }`. `value` is the node label (e.g. key range `"[10,20]"` or single key)
- `tree.children`: Array of child nodes (same shape). Each child can have its own `children`
- `branchingFactor`: Optional (default 3). Affects layout spacing

**Agent usage:**
- Use BTree (not BinaryTree) when nodes have 3+ children — e.g. B-tree internal nodes with key ranges
- Use BinaryTree for BST, heap, or any left/right-only structure
- Node labels can be key ranges (`"[10,20]"`), single values (`"15"`), or any string

## ProcessState

```json
{
  "states": [
    { "name": "Ready", "type": "ready" },
    { "name": "Running", "type": "running" },
    { "name": "Blocked", "type": "blocked" }
  ],
  "transitions": [
    { "from": "Ready", "to": "Running" },
    { "from": "Running", "to": "Blocked" }
  ]
}
```

- `states`: Array of state definitions
- `states[].name`: State label
- `states[].type`: Optional "ready" | "running" | "blocked"
- `transitions`: Array of { from, to } state name pairs

## GanttChart

```json
{
  "tasks": [
    { "name": "P1", "start": 0, "end": 3 },
    { "name": "P2", "start": 1, "end": 5 }
  ],
  "maxTime": 10
}
```

- `tasks`: Array of task definitions
- `tasks[].name`: Task label
- `tasks[].start`: Start time (normalized or absolute)
- `tasks[].end`: End time
- `maxTime`: Optional max value for axis (default: max of all end times)

## Service, API, APIGateway

All three render as a **cogwheel (gear) icon** with text inside the central hub. Use for: microservices, APIs, API gateways, backend services.

**No metadata required.** Use standard entity fields: `id`, `type`, `position`, `label`, `color`, `size`.

**Fields:**
- `label`: Shown inside the hub (short) or below the gear (longer). For **API**, the hub always shows "API"; `label` can add context below (e.g. "REST API", "GraphQL").
- `type`: `"Service"` | `"API"` | `"APIGateway"`

**Agent usage:**
- **Service:** Generic microservice, backend service, or "service" component. Hub shows `label` or `"Service"`. Use when the entity is a general service.
- **API:** Application Programming Interface, REST endpoint, API service. Hub always shows "API". Use when the entity is specifically an API.
- **APIGateway:** API gateway, routing layer, API management. Hub shows `label` or `"APIGateway"`. Use for gateways that route to multiple APIs.
- Example: `{ "id": "api-1", "type": "API", "position": { "x": 40, "y": 50 }, "label": "REST API" }` — gear with "API" inside, "REST API" below.
- Example: `{ "id": "svc-auth", "type": "Service", "position": { "x": 30, "y": 50 }, "label": "Auth Service" }` — gear with "Auth Service" in hub.

## Cache

Cache renders as a **database cylinder with a lightning bolt (flash) icon** inside. Use for Redis, Memcached, CDN, or any in-memory cache in architecture diagrams.

No metadata required. Use standard entity fields: `id`, `type: "Cache"`, `position`, `label` (e.g. "Redis"), `color`, `size`.

## CacheHierarchy

```json
{
  "levels": [
    { "name": "L1", "size": "32 KB" },
    { "name": "L2", "size": "256 KB" },
    { "name": "L3", "size": "8 MB" },
    { "name": "RAM", "size": "16 GB" }
  ]
}
```

- `levels`: Array of cache level definitions
- `levels[].name`: Level label
- `levels[].size`: Optional size string

## MemoryLayout

```json
{
  "stack": ["main", "foo()", "bar()"],
  "heap": ["obj1", "arr", "node"]
}
```

- `stack`: Array of stack frame labels
- `heap`: Array of heap object labels

## HashTable

```json
{
  "pairs": [
    ["key1", "value1"],
    ["key2", "value2"]
  ]
}
```

- `pairs`: Array of [key, value] tuples

## Circuit

Electronic circuit diagrams with battery, resistor, capacitor, bulb, switch. Use for: physics (Ohm's law, RC circuits), electronics education, electrical engineering concepts.

```json
{
  "components": [
    { "type": "battery", "label": "V" },
    { "type": "resistor", "label": "R" },
    { "type": "capacitor", "label": "C" },
    { "type": "bulb", "label": "L" }
  ],
  "connections": [
    { "from": 0, "to": 1 },
    { "from": 1, "to": 2 },
    { "from": 2, "to": 3 },
    { "from": 3, "to": 0 }
  ]
}
```

**Fields:**
- `components`: Array of `{ type: string, label?: string }`. Types: `battery`|`voltage`|`v`|`cell`, `resistor`|`r`, `capacitor`|`c`, `bulb`|`lamp`|`light`, `switch`|`s`. Order determines layout (left to right).
- `connections`: Array of `{ from: number, to: number }` — indices into `components`. Draws wires between component positions.

**Agent usage:**
- Use Circuit for: series/parallel circuits, RC time constant, voltage dividers, basic electronics.
- Example: "Simple series circuit with battery and resistor" → `components: [{type: "battery", label: "9V"}, {type: "resistor", label: "R1"}]`, `connections: [{from: 0, to: 1}, {from: 1, to: 0}]`.

## CodeBlock

Code editor visual: dark panel with traffic-light dots, line numbers, and monospace code. Use for: syntax examples, algorithm snippets, debugging walkthroughs.

```json
{
  "code": "function fib(n) {\n  if (n <= 1) return n;\n  return fib(n-1) + fib(n-2);\n}",
  "lines": ["function fib(n) {", "  if (n <= 1) return n;", "  return fib(n-1) + fib(n-2);", "}"]
}
```

**Fields:**
- `code`: Raw string — split on `\n` to get lines. Use when you have a single code string.
- `lines`: Array of strings — one per line. Overrides `code` if both present. Use for explicit line control or when code is pre-split.

**Agent usage:**
- Use CodeBlock for: showing code snippets, explaining algorithms step-by-step, syntax highlighting context.
- `entity.label` becomes the title bar filename (e.g. "fib.js"). Keep short; long names truncate.
- Long lines truncate with "..."; max ~80 chars per line. Keep snippets concise.

## Concept

Concept bubble: gradient circle with radial glow and centered label. Use for: key ideas, abstract concepts, glossary terms, mental models.

**No metadata required.** Use standard entity fields: `id`, `type: "Concept"`, `position`, `label`, `color`.

**Agent usage:**
- Labels ≤12 chars render **inside** the circle; longer labels render **below** the circle.
- Use Concept for: single-word or short-phrase concepts (e.g. "Recursion", "Cache", "API").
- For longer explanations, use Definition, Callout, or Analogy instead.

## CoordinateSystem

2D coordinate plane with axes, optional grid, points, and vectors. Use for: linear algebra, vector math, function plotting, geometry.

```json
{
  "xRange": [-5, 5],
  "yRange": [-5, 5],
  "gridSpacing": 1,
  "showGrid": true,
  "xLabel": "x",
  "yLabel": "y",
  "points": [{ "x": 2, "y": 3, "label": "P", "color": "#4ECDC4" }],
  "vectors": [{ "dx": 3, "dy": 1, "label": "v", "color": "#ff2d7b" }]
}
```

**Fields:**
- `xRange`, `yRange`: `[min, max]` for each axis (default `[-5, 5]`).
- `gridSpacing`: Distance between grid lines (default 1). Set 0 to disable grid.
- `showGrid`: Boolean (default true).
- `xLabel`, `yLabel`: Axis labels.
- `points`: Array of `{ x, y, label?, color? }` — plotted as dots. Vectors are from origin.
- `vectors`: Array of `{ dx, dy, label?, color? }` — arrows from (0,0) to (dx,dy).

**Agent usage:**
- Use CoordinateSystem (not Graph2D) when: showing vectors, basis vectors, coordinate geometry, linear transformations.
- Use Graph2D when: plotting functions, ROC curves, scatter data, expressions.
- Example: "Vector (3, 2) in the plane" → `vectors: [{dx: 3, dy: 2, label: "v"}]`.

## ConfusionMatrix

```json
{
  "matrix": [[45, 5], [8, 42]],
  "rowLabels": ["Actual -", "Actual +"],
  "colLabels": ["Pred -", "Pred +"]
}
```

- `matrix`: 2D array of numbers
- `rowLabels`: Optional row header labels
- `colLabels`: Optional column header labels

**Agent usage:**
- For 2×2 matrices with headers, cells are auto-colored: TP (green), TN (teal), FP (orange), FN (red).
- Use ConfusionMatrix for: classification metrics, precision/recall context, ML model evaluation.

## Cycle

Rotating dashed circle with centered label. Use for: lifecycle diagrams, process loops, infinite loops, iterative processes, feedback loops.

**No metadata required.** Use standard entity fields: `id`, `type: "Cycle"`, `position`, `label`, `color`.

**Agent usage:**
- Cycle has a built-in rotation animation (4s per revolution). Use for "loop", "repeat", "lifecycle", "iterative".
- Example labels: "while", "loop", "retry", "lifecycle", "PDCA".

## Cloud

Classic cumulus cloud shape (overlapping ellipses). Use for: cloud computing, SaaS, cloud storage, distributed systems.

**No metadata required.** Use standard entity fields: `id`, `type: "Cloud"`, `position`, `label`, `color`.

**Agent usage:**
- Use Cloud for: AWS/GCP/Azure diagrams, cloud-native architecture, "the cloud" as a concept.
- Often paired with Server, Database, Lambda in infrastructure diagrams.

## DNSResolver

Server rack with globe icon and domain→IP flow. Use for: DNS lookups, nameservers, domain resolution, service discovery.

**No metadata required.** Use standard entity fields: `id`, `type: "DNSResolver"`, `position`, `label`, `color`.

**Agent usage:**
- Use DNSResolver for: explaining DNS, resolver chains, caching nameservers, domain registration flow.
- Visual includes globe + arrow + IP dots to convey "domain name → IP address" resolution.

## Graph2D

2D Cartesian plotter with axes, grid, and multiple curve modes. Use for: function plots, ROC curves, training loss, scatter data, parametric curves. **Curves are clipped to the chart area** — values outside domain/range are not drawn beyond the component bounds.

**When to use:** Function plots (y = f(x)), ROC curves, loss curves, scatter plots, parametric curves (x(t), y(t)).  
**When to use CoordinateSystem instead:** Vectors, basis vectors, linear algebra, coordinate geometry.

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `domain` | `[number, number]` | `[-5, 5]` | X-axis data range (min, max). Also accepts `xRange`. |
| `range` | `[number, number]` | `[-5, 5]` | Y-axis data range (min, max). Also accepts `yRange`. |
| `xLabel` | `string` | `""` (or auto for roc/loss) | Label for x-axis (e.g. `"x"`, `"FPR"`, `"Epoch"`). |
| `yLabel` | `string` | `""` (or auto for roc/loss) | Label for y-axis (e.g. `"y"`, `"TPR"`, `"Loss"`). |
| `showGrid` | `boolean` | `true` | Show grid lines in chart area. |
| `curveType` | `"roc"` \| `"loss"` \| `"scatter"` | `"scatter"` | Rendering mode for `points` (see below). |
| `points` | `Array<{x, y}>` | `[]` | Data points. Meaning depends on `curveType`. |
| `expression` | `string` | — | JS expression in `x` for explicit curve y = f(x). |
| `parametric` | `boolean` | `false` | If true, draw parametric curve x(t), y(t). |
| `xExpression` | `string` | `"Math.cos(t)"` | Parametric x(t) expression (when `parametric`). |
| `yExpression` | `string` | `"Math.sin(t)"` | Parametric y(t) expression (when `parametric`). |
| `tRange` | `[number, number]` | `[0, 2π]` | Parameter range for parametric curve. |

### Modes

**1. Explicit function (y = f(x))**  
Set `expression` with a JS expression in `x`. Examples: `"x * x"`, `"Math.sin(x)"`, `"2 * x + 1"`.

```json
{
  "domain": [-5, 5],
  "range": [-5, 5],
  "xLabel": "x",
  "yLabel": "y",
  "expression": "x * x"
}
```

**2. Parametric curve (x(t), y(t))**  
Set `parametric: true`. Use `xExpression` and `yExpression` with variable `t`. Optionally set `tRange`.

```json
{
  "domain": [-2, 2],
  "range": [-2, 2],
  "parametric": true,
  "xExpression": "Math.cos(t)",
  "yExpression": "Math.sin(t)",
  "tRange": [0, 6.283]
}
```

**3. ROC curve**  
Set `curveType: "roc"`. `points` = array of `{x: FPR, y: TPR}`. Domain/range default to [0, 1].

```json
{
  "curveType": "roc",
  "xLabel": "FPR",
  "yLabel": "TPR",
  "points": [{ "x": 0, "y": 0 }, { "x": 0.1, "y": 0.3 }, { "x": 0.5, "y": 0.8 }, { "x": 1, "y": 1 }]
}
```

**4. Loss curve**  
Set `curveType: "loss"`. `points` = array of `{x: epoch, y: loss}`. Domain defaults to [0, 10], range to [0, 2].

```json
{
  "curveType": "loss",
  "xLabel": "Epoch",
  "yLabel": "Loss",
  "points": [{ "x": 0, "y": 1.8 }, { "x": 2, "y": 1.2 }, { "x": 6, "y": 0.5 }, { "x": 10, "y": 0.25 }]
}
```

**5. Scatter plot**  
Set `curveType: "scatter"` or omit. `points` = array of `{x, y}` rendered as dots.

```json
{
  "domain": [-5, 5],
  "range": [-5, 5],
  "points": [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }, { "x": 2, "y": 4 }]
}
```

### Agent usage

- **Function plot:** Use `expression` with domain/range that fits the curve. Set `domain` and `range` to the visible window — curves are clipped, so e.g. `y = x*x` with domain [-5,5] will show only the portion inside [-5,5]×[-5,5].
- **ROC curve:** `curveType: "roc"`, `points` as (FPR, TPR) pairs, domain/range [0,1].
- **Training loss:** `curveType: "loss"`, `points` as (epoch, loss) pairs.
- **Parametric (circle, ellipse, etc.):** `parametric: true`, `xExpression`, `yExpression`, `tRange`.
- **Scatter:** `points` array, optionally with `expression` to overlay a fitted curve.

## BigO

Complexity growth chart showing algorithm time/space complexity curves. Use for: explaining Big O notation, comparing algorithm efficiency (O(1) vs O(n) vs O(n²)), complexity analysis, DSA education.

```json
{
  "curves": ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)"],
  "domain": [0, 10]
}
```

**Fields:**

- `curves`: **Optional.** Array of curve names to display. Default: `["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)"]`. Valid values: `"O(1)"`, `"O(log n)"`, `"O(n)"`, `"O(n log n)"`, `"O(n²)"`, `"O(2^n)"`. Agent can pick a subset to focus on specific comparisons (e.g. `["O(n)", "O(n²)"]` for linear vs quadratic).
- `domain`: **Optional.** `[min, max]` for the x-axis (input size n). Default `[0, 10]`. Y-axis (operations) auto-scales to fit all curves. Use `[0, 8]` when including `O(2^n)` to avoid overflow.

**Standard entity fields:**

- `label`: Optional chart title (e.g. "Algorithm Complexity").
- `size`: Scale factor (default 2). Affects chart dimensions.
- `color`: Accent color for chart border/background (default gold).

**Agent usage:**

- Use BigO for: explaining Big O notation, comparing sorting algorithms (O(n log n) vs O(n²)), showing why exponential algorithms scale poorly, DSA/algorithm complexity lessons.
- Use Graph2D instead for: custom functions, ROC curves, loss curves, scatter data, or arbitrary expressions.
- Example: "Compare linear vs quadratic complexity" → `curves: ["O(n)", "O(n²)"]`, `domain: [0, 10]`.
- Example: "Show why O(2^n) is bad" → `curves: ["O(n)", "O(n²)", "O(2^n)"]`, `domain: [0, 8]`.

## BarChart

Bar chart with axes, value labels, and optional per-bar colors. Use for comparing discrete categories (sales by month, counts by type, etc.). Agent should prefer BarChart over Graph2D when data is categorical (labels) vs continuous (x-y pairs).

```json
{
  "bars": [
    { "label": "Jan", "value": 10 },
    { "label": "Feb", "value": 25 },
    { "label": "Mar", "value": 15 },
    { "label": "Apr", "value": 30 },
    { "label": "May", "value": 22 }
  ],
  "xLabel": "Month",
  "yLabel": "Value",
  "horizontal": false
}
```

**Fields:**

- `bars`: **Required.** Array of `{ label: string, value: number, color?: string }` — one object per bar. Agent can omit `color` to use the entity's default color; set `color` (hex, e.g. `"#4ECDC4"`) for per-bar styling. Max 12 bars displayed.
- `xLabel`: Axis label for categories (default `"x"`). For vertical bars, this is the horizontal axis; for horizontal bars, the value axis.
- `yLabel`: Axis label for values (default `"y"`). For vertical bars, this is the vertical axis; for horizontal bars, the category axis.
- `horizontal`: Boolean — if `true`, bars extend horizontally (labels on left, values on right). Default `false` (vertical bars).

**Agent usage:**

- Use BarChart for: monthly/quarterly comparisons, category counts, rankings, discrete distributions.
- Use Graph2D instead for: continuous functions, scatter plots, ROC/loss curves.
- Use Histogram for: frequency distributions (bins).
- Example: `"Compare Q1 revenue by region"` → `bars: [{label: "North", value: 120}, {label: "South", value: 85}, ...]`, `xLabel: "Region"`, `yLabel: "Revenue ($K)"`.

## BinaryTree

Binary search trees, BSTs, heaps, and any left/right tree structure. Use for: binary search visualization, tree traversal, heap operations, recursion.

**Two formats (like Array's values vs cells):**

**Nested tree:**
```json
{
  "tree": {
    "value": 5,
    "left": { "value": 3, "left": { "value": 1 }, "right": { "value": 4 } },
    "right": { "value": 8, "left": { "value": 6 }, "right": { "value": 9 } }
  },
  "disabledIndexes": [1, 3],
  "selectedIndexes": [0, 2]
}
```

**Flat nodes (level-order, like Array):**
```json
{
  "nodes": [5, 3, 8, 1, 4, 6, 9],
  "disabledIndexes": [1, 3],
  "selectedIndexes": [0, 2]
}
```

**Fields:**
- `tree`: Nested format — `{ value, left?, right? }`. Per-node: `enabled`, `selected`, `highlight`
- `nodes`: Flat level-order array. Index i has left at 2i+1, right at 2i+2. Each element: `value` or `{ value, enabled?, selected?, highlight? }`
- `disabledIndexes`: 0-based indexes (level-order) to dim — dashed outline, muted fill. Use for "eliminated" half in binary search
- `selectedIndexes`: 0-based indexes (level-order) to highlight — glow, thicker stroke. Use for current comparison node
- Per-node `highlight`: `'none'` | `'compare'` | `'insert'` | `'visited'` | `'active'`

**Agent usage:**
- Binary search: show `selectedIndexes: [mid]` for current comparison; `disabledIndexes` for eliminated range
- Tree traversal: use `highlight` per node for visited/active path
- Prefer `nodes` for step-by-step animations (easier to update by index); use `tree` for static or complex structures
