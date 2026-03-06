# Illustrations Agent Guide

This guide helps AI agents choose and configure the right illustration types when generating educational content. Reference [METADATA_SCHEMAS.md](./METADATA_SCHEMAS.md) for exact metadata shapes.

---

## Quick Reference: When to Use What

| User intent / topic | Use this type | Notes |
|--------------------|---------------|-------|
| Cloud, SaaS, AWS/GCP | **Cloud** | Cumulus cloud icon |
| DNS, nameserver, domain→IP | **DNSResolver** | Server rack + globe + resolution flow |
| Key concept, glossary term | **Concept** | Bubble; label ≤12 chars inside, else below |
| Code snippet, algorithm | **CodeBlock** | `metadata.code` or `metadata.lines` |
| Loop, lifecycle, retry | **Cycle** | Rotating dashed circle |
| Electronic circuit | **Circuit** | `metadata.components` + `metadata.connections` |
| 2D plane, vectors, coordinates | **CoordinateSystem** | `metadata.points`, `metadata.vectors` |
| Function plot, ROC, scatter | **Graph2D** | `metadata.points`, `metadata.expression` |
| Big O, complexity curves | **BigO** | `metadata.curves`, `metadata.domain` |
| Categorical comparison | **BarChart** | `metadata.bars` with label/value |
| Classification metrics | **ConfusionMatrix** | `metadata.matrix`, row/col labels |
| Array, list indices | **Array** | `metadata.values` or `metadata.cells` |
| BST, heap, tree | **BinaryTree** | `metadata.tree` or `metadata.nodes` |
| Stack frames | **CallStack** | `metadata.frames` |
| Process states | **ProcessState** | `metadata.states`, `metadata.transitions` |

---

## Recently Added / Updated Illustrations

### Circuit
- **Purpose:** Electronic circuits (battery, resistor, capacitor, bulb, switch)
- **Metadata:** `components` (array of `{type, label?}`), `connections` (array of `{from, to}` indices)
- **Component types:** `battery`|`voltage`|`v`|`cell`, `resistor`|`r`, `capacitor`|`c`, `bulb`|`lamp`|`light`, `switch`|`s`

### BigO
- **Purpose:** Algorithm complexity growth chart — O(1), O(log n), O(n), O(n log n), O(n²), O(2^n)
- **Metadata:** `curves` (array of curve names to show), `domain` ([min, max] for n, default [0, 10])
- **Curves:** `"O(1)"`, `"O(log n)"`, `"O(n)"`, `"O(n log n)"`, `"O(n²)"`, `"O(2^n)"`. Pick a subset to focus comparisons.
- **Use for:** Big O notation, algorithm efficiency, DSA education; use Graph2D for custom functions/ROC/loss

### Graph2D
- **Purpose:** 2D Cartesian plotter — function curves, ROC curves, loss curves, scatter plots, parametric curves
- **Metadata:** `domain`, `range` (or `xRange`, `yRange`), `xLabel`, `yLabel`, `showGrid`, `curveType`, `points`, `expression`, `parametric`, `xExpression`, `yExpression`, `tRange`
- **Modes:**
  - **Explicit:** `expression: "x * x"` — y = f(x), JS expression in `x`
  - **Parametric:** `parametric: true`, `xExpression`, `yExpression`, `tRange` — x(t), y(t)
  - **ROC:** `curveType: "roc"`, `points` = [{x: FPR, y: TPR}, ...]
  - **Loss:** `curveType: "loss"`, `points` = [{x: epoch, y: loss}, ...]
  - **Scatter:** `curveType: "scatter"` or omit, `points` = [{x, y}, ...]
- **Clipping:** Curves stay inside the chart — values outside domain/range are clipped
- **Use for:** Function plots, ROC, training loss, scatter data; use CoordinateSystem for vectors/geometry

### CoordinateSystem
- **Purpose:** 2D coordinate plane with axes, grid, points, vectors
- **Metadata:** `xRange`, `yRange`, `gridSpacing`, `showGrid`, `xLabel`, `yLabel`, `points`, `vectors`
- **Use for:** Vectors, basis vectors, linear algebra, geometry (not function plots — use Graph2D)

### Cycle
- **Purpose:** Rotating dashed circle for loops, lifecycles, iterative processes
- **Metadata:** None required. Use `label` for text inside (e.g. "loop", "retry", "lifecycle")
- **Visual:** Animated 4s rotation

### CodeBlock
- **Purpose:** Code editor panel with line numbers and monospace text
- **Metadata:** `code` (string, split on `\n`) or `lines` (array of strings)
- **Entity.label:** Becomes title bar filename (truncates if long)

### Concept
- **Purpose:** Concept bubble for key ideas, abstract terms
- **Behavior:** Label ≤12 chars → inside circle; longer → below circle
- **Use for:** Short concepts; use Definition/Callout for longer text

### Cloud
- **Purpose:** Cloud computing, SaaS, distributed systems
- **Metadata:** None. Standard `label`, `color`, `position`

### DNSResolver
- **Purpose:** DNS lookups, nameservers, domain resolution
- **Metadata:** None. Visual shows globe + domain→IP flow
- **Use for:** Explaining DNS, resolver chains, caching

### ConfusionMatrix
- **Purpose:** Classification metrics (TP/FP/TN/FN)
- **Metadata:** `matrix`, `rowLabels`, `colLabels`
- **Auto-coloring:** 2×2 with headers → TP (green), TN (teal), FP (orange), FN (red)

---

## Choosing Between Similar Types

| If you need… | Use | Not |
|--------------|-----|-----|
| Vectors, coordinate geometry | CoordinateSystem | Graph2D |
| Function plot, scatter, ROC | Graph2D | CoordinateSystem |
| Big O, complexity curves | BigO | Graph2D |
| Categorical bars (Jan, Feb, Region) | BarChart | Graph2D |
| Frequency bins | Histogram | BarChart |
| Short concept (≤12 chars) | Concept | Definition |
| Long explanation | Definition, Callout, Analogy | Concept |
| Code snippet | CodeBlock | (text in card) |
| Loop/lifecycle indicator | Cycle | (generic shape) |

---

## Common Patterns

1. **Infrastructure diagram:** Group + Server, Database, Cloud, DNSResolver, Arrow/DataFlow
2. **Algorithm walkthrough:** CodeBlock + Array/BinaryTree + StepList
3. **Complexity / Big O:** BigO with `curves: ["O(n)", "O(n²)"]` or similar subset
4. **ML evaluation:** ConfusionMatrix + BarChart (precision/recall); Graph2D with `curveType: "roc"` for ROC curve, `curveType: "loss"` for training loss
5. **Physics/electronics:** Circuit + Concept (for terms)
6. **Math/linear algebra:** CoordinateSystem (vectors) or Graph2D (functions via `expression` or `parametric`)
