# Metadata Schemas for Entity Types

This document describes the expected `metadata` shapes for entity types that accept structured data.

> **For agents:** See [ILLUSTRATIONS_AGENT_GUIDE.md](./ILLUSTRATIONS_AGENT_GUIDE.md) for a quick reference on when to use each type and how to choose between similar ones.

## Text Card (Analogy, Annotation, Label, Comparison, Proof, Quote, Stack)

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

```json
{
  "domain": [-5, 5],
  "range": [-5, 5],
  "xLabel": "x",
  "yLabel": "y",
  "showGrid": true,
  "curveType": "roc",
  "points": [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }],
  "expression": "x * x"
}
```

- `domain`: [min, max] for x-axis
- `range`: [min, max] for y-axis
- `xLabel`, `yLabel`: Axis labels
- `showGrid`: Boolean (default true)
- `curveType`: "roc" | "loss" | "scatter" for special curve rendering
- `points`: Array of { x, y } for scatter or curve data
- `expression`: Optional JS expression in x for explicit curve (e.g. "x * x")

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
