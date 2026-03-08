# Illustrations Agent Guide

This guide helps AI agents choose and configure the right illustration types when generating educational content. Reference [METADATA_SCHEMAS.md](./METADATA_SCHEMAS.md) for exact metadata shapes.

**Size:** `size` is a uniform scale across all entity types. 2 = default, 1 = half, 3 = 1.5x, 4 = double — same visibility for Concept, BinaryTree, Server, Graph2D, etc. For readability, use sz 2.5–3 for text-heavy entities (CodeBlock, Definition, Callout, StepList, CallStack, HashTable) so content is visible on screen.

---

## Quick Reference: When to Use What

| User intent / topic | Use this type | Notes |
|--------------------|---------------|-------|
| Cloud, SaaS, AWS/GCP | **Cloud** | Cumulus cloud icon |
| Service, microservice, backend | **Service** | Cogwheel with label in hub |
| API, REST API, API endpoint | **API** | Cogwheel with "API" in hub (inherits Service) |
| API gateway, routing layer | **APIGateway** | Same cogwheel as Service; label in hub |
| DNS, nameserver, domain→IP | **DNSResolver** | Server rack + globe + resolution flow |
| Key concept, glossary term | **Concept** | Rectangle with dotted inner border; label ≤12 chars inside, else below |
| Code snippet, algorithm | **CodeBlock** | `metadata.code` or `metadata.lines` |
| Loop, lifecycle, retry | **Cycle** | Rotating dashed circle |
| Electronic circuit | **Circuit** | `metadata.components` + `metadata.connections` |
| 2D plane, vectors, coordinates | **CoordinateSystem** | `metadata.points`, `metadata.vectors` |
| Function plot, ROC, scatter | **Graph2D** | `metadata.points`, `metadata.expression` |
| Big O, complexity curves | **BigO** | `metadata.curves`, `metadata.domain` |
| Categorical comparison | **BarChart** | `metadata.bars` with label/value |
| Classification metrics | **ConfusionMatrix** | `metadata.matrix`, row/col labels |
| Array, list indices | **Array** | `metadata.values` or `metadata.cells`; use `pointerLabels` for low/mid/high in binary search (color-coded, optional `value`/`showValue`, `highlight` for active) |
| BST, heap, tree | **BinaryTree** | `metadata.tree` or `metadata.nodes` |
| Stack frames | **CallStack** | `metadata.frames` |
| Layered model, tech stack, OSI | **Stack** | `metadata.layers` |
| Numbered steps, algorithm walkthrough | **StepList** | `metadata.steps`, `currentStep`, `checkmarks` |
| Process states | **ProcessState** | `metadata.states`, `metadata.transitions` |
| Main heading, title | **H1** | metadata.label or entity.label; largest |
| Section heading | **H2** | metadata.label or entity.label; medium |
| Subsection heading | **H3** | metadata.label or entity.label; smallest |

---

## Recently Added / Updated Illustrations

### Service, API, APIGateway
- **Purpose:** Service-like entities — microservices, APIs, API gateways. All render as a **cogwheel (gear) icon** with text inside the central hub.
- **Visual:** Gear with 10 teeth, inner circle, optional label below. Clean, minimal.
- **Service:** `label` or `type` shown inside the hub. Use for: microservices, backend services, generic "service" components.
- **API:** Always shows "API" inside the hub. Use for: REST APIs, API endpoints, application programming interfaces. Inherits from Service.
- **APIGateway:** Same cogwheel as Service; `label` or `type` in hub. Use for: API gateways, routing layers, API management.
- **Metadata:** None required. Standard entity fields: `id`, `type`, `position`, `label`, `color`, `size`.
- **Example:** `{ "id": "api-1", "type": "API", "position": { "x": 40, "y": 50 }, "label": "REST API" }` — shows "API" in the gear; "REST API" below if `label` differs.
- **Choosing:** Use **API** when the entity is specifically an API/endpoint. Use **Service** for generic services or microservices. Use **APIGateway** for gateways/routing.

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
- **Purpose:** Concept shape for key ideas, abstract terms
- **Visual:** Rounded rectangle with gradient fill + inner dotted rectangle (like Annotation with dashed accent)
- **Behavior:** Label ≤12 chars → inside shape; longer → below
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

### Stack
- **Purpose:** Vertical stack of customizable layers — OSI model, tech stack, layered architecture, protocol stacks
- **Metadata:** `layers` — array of `{ label: string, sublabel?: string, color?: string }`
- **Use for:** OSI/TCP-IP layers, tech stack (React, Node, PostgreSQL), any vertical list of labeled blocks
- **Not for:** Call stacks (use CallStack), cache hierarchy (use CacheHierarchy), stack/heap memory (use MemoryLayout)
- **Example:** `layers: [{label: "Application", sublabel: "HTTP, DNS"}, {label: "Transport", sublabel: "TCP, UDP"}, ...]`

### StepList
- **Purpose:** Numbered step sequence — algorithm walkthroughs, tutorials, how-to guides, sequential processes
- **Metadata:** `steps` (array of strings), `currentStep` (0-based, -1 = none), `checkmarks` (show ✓ for completed steps)
- **Label length:** 1 word preferred, max 2 words per step. Long labels may overflow.
- **Visual:** Circles with numbers, connecting lines, optional title. When `currentStep` is set, that step is highlighted; when `checkmarks` is true, completed steps show ✓ instead of numbers.
- **Use for:** Algorithm steps, tutorial sequences, numbered procedures. Pairs well with CodeBlock + Array/BinaryTree.
- **Example:** `steps: ["Parse", "Validate", "Transform"], currentStep: 1, checkmarks: true` — step 1 shows ✓, step 2 highlighted.

---

## Choosing Between Similar Types

| If you need… | Use | Not |
|--------------|-----|-----|
| API, REST endpoint, API service | API | Service, Server |
| Generic service, microservice | Service | API, Server |
| API gateway, routing layer | APIGateway | API, Service |
| Physical server, rack, host | Server | Service, API |
| Vectors, coordinate geometry | CoordinateSystem | Graph2D |
| Function plot, scatter, ROC | Graph2D | CoordinateSystem |
| Big O, complexity curves | BigO | Graph2D |
| Categorical bars (Jan, Feb, Region) | BarChart | Graph2D |
| Frequency bins | Histogram | BarChart |
| Short concept (≤12 chars) | Concept | Definition |
| Long explanation | Definition, Callout, Analogy | Concept |
| Code snippet | CodeBlock | (text in card) |
| Loop/lifecycle indicator | Cycle | (generic shape) |
| Numbered steps, algorithm walkthrough | StepList | CallStack, Stack |
| OSI layers, tech stack | Stack | CallStack, CacheHierarchy |
| Call stack, recursion | CallStack | Stack |
| L1/L2/L3 cache hierarchy | CacheHierarchy | Stack |
| Binary search on sorted array | Array (with pointerLabels) | BinaryTree |
| BST search, tree structure | BinaryTree | Array |

---

## Common Patterns

1. **Infrastructure diagram:** Group + Server, Database, Cloud, Service, API, APIGateway, DNSResolver, Arrow/DataFlow
2. **Algorithm walkthrough:** CodeBlock + Array (with pointerLabels) + StepList. Use StepList.currentStep to show which step is active.
3. **Complexity / Big O:** BigO with `curves: ["O(n)", "O(n²)"]` or similar subset
4. **ML evaluation:** ConfusionMatrix + BarChart (precision/recall); Graph2D with `curveType: "roc"` for ROC curve, `curveType: "loss"` for training loss
5. **Physics/electronics:** Circuit + Concept (for terms)
6. **Math/linear algebra:** CoordinateSystem (vectors) or Graph2D (functions via `expression` or `parametric`)
