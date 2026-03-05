# Metadata Schemas for Entity Types

This document describes the expected `metadata` shapes for entity types that accept structured data.

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

```json
{
  "tree": {
    "value": "[10,20]",
    "children": [
      { "value": "[3,6]", "children": [{ "value": "1" }, { "value": "4" }] },
      { "value": "[15]", "children": [{ "value": "12" }] }
    ]
  },
  "branchingFactor": 3
}
```

- `tree`: Multi-child tree structure
- `tree.value`: Node label
- `tree.children`: Optional array of child nodes
- `branchingFactor`: Optional (default 3)

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

## BinaryTree

```json
{
  "tree": {
    "value": 5,
    "left": { "value": 3, "left": { "value": 1 }, "right": { "value": 4 } },
    "right": { "value": 8, "left": { "value": 6 }, "right": { "value": 9 } }
  }
}
```

- `tree`: Binary tree with value, left, right
