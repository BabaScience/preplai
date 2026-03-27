# VisualScript Schema

**Summary:** VisualScript is the JSON that AI agents pass to `add_scene`. It defines how a scene is rendered as animated SVG on a 1920×1080 dark canvas. Positions use percentages (0–100). Entity types (Server, Database, BinaryTree, etc.) map to rich SVG illustrations. An 80px horizontal and 60px vertical safe zone is applied automatically.

**Definitions:**
- **VisualScript:** JSON object with `sceneId`, `frames` array, and `totalDuration`. Passed to `add_scene` as the `visual_script` parameter.
- **Entity:** A visual element (Server, Database, Label, Arrow, etc.) with `id`, `type`, `position`, and optional `label`, `metadata`, `highlight`.
- **Frame:** A view in a scene containing entities and narration.

---

## Compact Format

Agents should use **short keys** to reduce token usage. This is the format `add_scene` expects:

| Short key | Full key | Description |
|-----------|----------|-------------|
| `sid` | `sceneId` | Unique scene ID (use `session_id`) |
| `td` | `totalDuration` | Total duration in ms |
| `f` | `frames` | Array of frames |
| `e` | `entities` | Array of entities in a frame |
| `n` | `narrationSegment` | Subtitle text for a frame |
| `p` | `position` | `[x, y]` — percentages 0–100 |
| `l` | `label` | Display text |
| `m` | `metadata` | Type-specific metadata object |
| `src` | `sourceEntityId` | Source entity for connections |
| `tgt` | `targetEntityId` | Target entity for connections |
| `a` | `animation` | Entrance animation override |
| `hl` | `highlight` | `true` for cinematic focus pull |
| `sz` | `size` | Scale factor (omit to use defaults) |

**Omit by default:** `color` (palette auto-assigns), `id` (for non-connected entities), frame `id`/`startTime`/`endTime`/`description`, entity `size`.

---

## Structure

```json
{
  "sid": "<session_id>",
  "td": 10000,
  "f": [
    {
      "e": [
        { "id": "srv", "type": "Server", "p": [30, 45], "l": "API Server" },
        { "id": "db", "type": "Database", "p": [70, 45], "l": "PostgreSQL", "hl": true },
        { "id": "a1", "type": "Arrow", "p": [50, 45], "src": "srv", "tgt": "db", "l": "SQL Queries" }
      ],
      "n": "The API server sends SQL queries to the PostgreSQL database. Each query is routed through the connection pool."
    },
    {
      "e": [
        { "id": "srv", "type": "Server", "p": [25, 45], "l": "API Server" },
        { "id": "cache", "type": "Cache", "p": [50, 45], "l": "Redis", "hl": true },
        { "id": "db", "type": "Database", "p": [75, 45], "l": "PostgreSQL" },
        { "id": "a1", "type": "Arrow", "p": [37, 45], "src": "srv", "tgt": "cache", "l": "Check cache" },
        { "id": "a2", "type": "Arrow", "p": [62, 45], "src": "cache", "tgt": "db", "l": "Cache miss" }
      ],
      "n": "Adding Redis as a caching layer reduces database load by 90%. Frequently accessed data is served from memory in under 1ms."
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sid` | string | Scene ID — use the `session_id` from `create_session` |
| `td` | number | Total duration in ms |
| `f` | array | At least one frame |

**Note:** Theme and palette are set at the session level via `create_session` and the user's dashboard preferences. See [MCP Tools — Themes and Palettes](/docs/mcp-tools#themes-and-palettes).

---

## Frames

Each frame is a view with entities and narration. Frames play in sequence.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `e` | array | Yes | Visual entities |
| `n` | string | Yes | Narration subtitle (2–4 sentences, informative and detailed) |

**Frame pacing:** 3–5 seconds per frame. **Content density:** 5–7 entities per frame — avoid sparse slides with only 1–3 items.

---

## Cinematic Features

### Entity Persistence

Same entity `id` across frames = entity **stays in the DOM** (no rebuild). New IDs animate in, removed IDs slide out. This is the core feature for building narrative continuity — keep core entities (Server, Database, User) persistent across frames and add/remove detail entities around them.

### Depth of Field (Progressive Reveal)

Set `"hl": true` (highlight) on the entity you're narrating about. The engine uses **progressive reveal** — once an entity is focused by narration, it stays visible (secondary focus) even when focus moves to the next entity. Only not-yet-mentioned entities are dimmed (0.35 opacity, blur, 0.88× scale). The focused entity is enlarged (1.15×). This builds the scene incrementally so viewers never lose context about previously introduced elements. Each frame starts fresh.

### Camera

The viewBox auto-pans and zooms to frame your entities. Control it through positioning:
- **Cluster entities tightly** → camera zooms in (detail shot)
- **Spread entities wide** → camera zooms out (establishing shot)
- **Shift cluster between frames** → camera pans (reveal)

### Entrance Animations

Entities near edges fly in from that edge. Entities near existing entities grow from that point. Center entities fade up. Each entity type has a smart default — you can override with the `a` (animation) field:

Available entrances: `fadeInUp`, `fadeIn`, `scaleIn`, `drawIn`, `floatIn`, `slideInLeft`, `dropIn`

### Idle Animations

Automatic: servers pulse LEDs, databases shimmer, neural nets glow, concepts breathe. Entities feel alive without any configuration.

---

## Entity Types

### Headings and Text

| Type | Short | Description |
|------|-------|-------------|
| `H1` | — | Main heading |
| `H2` | — | Section heading |
| `H3` | — | Subsection heading |
| `Label` | — | Text with optional pill background |
| `Concept` | — | Auto-sized circle. Label inside if ≤12 chars, else below |
| `CodeBlock` | `CB` | Dark terminal with traffic-light dots. Use `textContent` for code, `codeLanguage` for syntax |
| `Definition` | — | Term + definition card |
| `Callout` | — | Highlighted info box |
| `Quote` | — | Blockquote |
| `Badge` | — | Small tag/badge |
| `Annotation` | — | Note annotation |

### Infrastructure

| Type | Short | Description |
|------|-------|-------------|
| `Server` | `SVC` | Rack server with LED indicators |
| `Database` | `DNS` | Cylinder |
| `Cache` | `CH` | Cylinder with lightning bolt — Redis, Memcached, CDN |
| `Cloud` | — | Cloud blob |
| `User` | — | Avatar icon |
| `Service` | — | Cogwheel (gear) — microservices, backend services. Use `metadata.kind` for subtypes: `API`, `Service`, `APIGateway` |
| `Queue` | — | Message queue |
| `LoadBalancer` | — | Load balancer |
| `Container` | — | Docker container |
| `Pod` | — | Kubernetes pod |
| `Lambda` | — | Serverless function |
| `Firewall` | — | Firewall/security |
| `Network` | — | Network diagram |
| `Volume` | — | Storage volume |
| `Monitor` | — | Monitoring/observability |
| `Pipeline` | `PS` | CI/CD or data pipeline |
| `DNSResolver` | — | DNS resolver |
| `Subnet` | — | Network subnet |
| `CDN` | — | Content delivery network |
| `StorageBucket` | — | Cloud storage (S3, GCS) |
| `APIGateway` | `GW` | API gateway / routing layer |
| `MessageBroker` | — | Message broker (Kafka, RabbitMQ) |
| `Device` | — | Physical device |
| `Process` | — | OS process |

### Data Structures

| Type | Short | Description |
|------|-------|-------------|
| `Array` | `ARR` | Indexed cells. `metadata.values`, `metadata.disabledIndexes`, `metadata.selectedIndexes` |
| `BinaryTree` | `BT` | Binary tree. `metadata.tree` (nested `{value, left?, right?}`) or `metadata.nodes` (level-order array) |
| `BTree` | `BTR` | Multi-way tree (B-tree, B+ tree). `metadata.tree` = `{value, children?}` |
| `HashTable` | — | Key-value pairs |
| `LinkedList` | — | Linked list nodes |
| `Stack` | `CST` | Stack (LIFO) |
| `Heap` | — | Heap / priority queue |
| `Set` | — | Set collection |
| `Dict` | — | Dictionary |
| `List` | — | Generic list |
| `Tuple` | — | Tuple |

### Algorithms and CS Theory

| Type | Short | Description |
|------|-------|-------------|
| `CallStack` | — | Stack frames visualization |
| `ProcessState` | — | State diagram |
| `BigO` | `BC` | Complexity growth chart. `metadata.curves` (e.g. `["O(1)", "O(n)", "O(n²)"]`) |
| `GanttChart` | `GC` | Task/scheduler bars |
| `MemoryLayout` | `ML` | Stack/heap memory layout |
| `FSM` | — | Finite state machine |
| `CPU` | — | CPU diagram |
| `SymbolTable` | — | Compiler symbol table |
| `TuringMachine` | — | Turing machine |
| `RecursionTree` | — | Recursion tree |
| `SortAnimation` | — | Sorting algorithm visualization |
| `Cycle` | `CYC` | Cycle/loop diagram |

### Charts and Visualization

| Type | Short | Description |
|------|-------|-------------|
| `BarChart` | — | Bar chart. `metadata.bars` = `[{label, value, color?}]` |
| `Graph2D` | `G2` | 2D plots (ROC, loss, scatter) |
| `CoordinateSystem` | `COORD` | Coordinate axes |
| `ConfusionMatrix` | — | TP/FP/TN/FN grid |
| `Histogram` | — | Histogram |
| `PieChart` | — | Pie chart |
| `ScatterPlot` | — | Scatter plot |
| `VennDiagram` | — | Venn diagram |

### Math and Physics

| Type | Description |
|------|-------------|
| `Equation` | Math equation |
| `Expression` | Math expression |
| `Matrix` | Matrix display |
| `Vector` | Vector visualization |
| `Wave` | Wave/signal |
| `FreeBodyDiagram` | Physics free body diagram |

### Software Architecture

| Type | Description |
|------|-------------|
| `APIEndpoint` | REST endpoint |
| `HTTPRequest` / `HTTPResponse` | HTTP messages |
| `WebSocket` | WebSocket connection |
| `GraphQLSchema` | GraphQL schema |
| `Webhook` | Webhook |
| `AuthFlow` | Authentication flow |
| `Token` / `Certificate` / `Secret` | Security primitives |
| `Schema` / `Migration` | Database schema/migration |
| `Event` / `Stream` | Event-driven architecture |
| `GitBranch` / `GitCommit` / `PullRequest` | Git concepts |
| `Build` / `Deployment` / `Rollback` | CI/CD concepts |
| `LogEntry` / `Alert` / `Trace` | Observability |
| `Dashboard` | Dashboard view |
| `Module` / `Interface` / `Dependency` | Software design |
| `ErrorState` | Error/failure state |
| `ConfigFile` | Configuration file |
| `CronJob` | Scheduled job |
| `Notification` / `Task` / `File` | General concepts |

### Pedagogical

| Type | Short | Description |
|------|-------|-------------|
| `StepList` | `SL` | Numbered step list |
| `Analogy` | — | Card with wrapping text. `metadata.label`, `metadata.width`, `metadata.maxLines` |
| `Timeline` | — | Timeline visualization |
| `Metric` | — | Key metric display |
| `Table` | — | Data table |
| `FlowDiagram` | — | Flow diagram |

### Connection Types

| Type | Description |
|------|-------------|
| `Arrow` | Solid arrow with glow. Use `src` and `tgt` to connect entities |
| `DataFlow` | Animated dashed arrow — shows data movement |
| `BidirectArrow` | Bidirectional arrow |
| `DottedArrow` | Dotted arrow — optional or conditional paths |

Use `metadata.curved: true` for curved arrows.

---

## Entity Schema (Full Format)

```json
{
  "id": "srv",
  "type": "Server",
  "p": [30, 45],
  "l": "API Server",
  "hl": true,
  "a": {
    "entrance": "fadeInUp",
    "delay": 0,
    "duration": 600
  },
  "m": {}
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | For connections | 1–128 chars. Required if referenced by arrows or persisted across frames |
| `type` | string | Yes | Entity type from the tables above |
| `p` | `[x, y]` | Yes | Position as percentages 0–100 |
| `l` | string | No | Display label (max 200 chars) |
| `hl` | boolean | No | Highlight — cinematic focus pull on this entity |
| `sz` | number | No | Scale factor (0.001–10). Omit to use smart defaults |
| `a` | object | No | Animation override. Entrance: `fadeInUp`, `fadeIn`, `scaleIn`, `drawIn`, `floatIn`, `slideInLeft`, `dropIn` |
| `m` | object | No | Type-specific metadata (see below) |
| `src` | string | Connections | Source entity ID |
| `tgt` | string | Connections | Target entity ID |
| `textContent` | string | No | Code or long text (max 10,000 chars). Used by CodeBlock |
| `codeLanguage` | string | No | Language for CodeBlock syntax highlighting |

---

## Metadata by Type

### Array
```json
{ "values": ["a", "b", "c", "d", "e"], "disabledIndexes": [1, 3], "selectedIndexes": [0, 2] }
```
Or use `cells`: `[{value, enabled?, selected?}]`. Max 8 cells.

### BinaryTree
```json
{ "tree": { "value": 5, "left": { "value": 3 }, "right": { "value": 8 } } }
```
Or level-order: `{ "nodes": [5, 3, 8, 1, 4, 6, 9] }`. Use `disabledIndexes` and `selectedIndexes` (0-based, level-order) to dim/highlight nodes.

### BTree
```json
{ "tree": { "value": "[10,20]", "children": [{ "value": "5" }, { "value": "15" }, { "value": "25" }] } }
```
Use when nodes have 3+ children. Optional: `branchingFactor`.

### BigO
```json
{ "curves": ["O(1)", "O(log n)", "O(n)", "O(n²)"], "domain": [0, 10] }
```
Use `[0, 8]` domain when including `O(2^n)`.

### BarChart
```json
{ "bars": [{ "label": "Jan", "value": 10 }, { "label": "Feb", "value": 25 }], "xLabel": "Month", "yLabel": "Sales", "horizontal": false }
```
Max 12 bars.

### Analogy
Use `l` (label) for text. Set `metadata.width` and `metadata.maxLines` to control layout. Overflow truncates with "…".

### Connections (Arrow, DataFlow, etc.)
```json
{ "curved": true }
```

### Service
```json
{ "kind": "API" }
```
Values: `API`, `Service`, `APIGateway`.

---

## Constraints

| Constraint | Limit |
|-----------|-------|
| Entities per frame | Max 150 |
| Frames per script | Max 100 |
| Total duration | Max 3,600,000 ms (1 hour) |
| Entity ID length | 1–128 chars |
| Label length | Max 200 chars |
| Text content | Max 10,000 chars |
| Size range | 0.001–10 |
| Position range | 0–100 |
| Animation delay | 0–60,000 ms |
| Animation duration | 0–10,000 ms |

---

## Design Guidelines

- **Colors:** Omit `color` — the palette auto-assigns based on entity type
- **Spacing:** Minimum 15% gap between entity positions
- **Highlight:** Use `"hl": true` on **one entity per frame**, matching the narration
- **Narration:** 2–4 sentences per frame. Be substantive — include context, specifics, examples. Avoid generic phrasing
- **Narrative arc:** (1) Establish the scene, (2) Focus on one part with highlight, (3) Expand with new entities, (4) Resolve with complete picture
- **Labels:** Up to ~80 chars; longer text auto-wraps

---

## Topic → Type Mapping

| Topic | Preferred Types |
|-------|-----------------|
| Trees (BST, AVL, heaps) | `BinaryTree`, `BTree` |
| Arrays, lists, indexed data | `Array` |
| Call stacks, recursion | `CallStack` |
| State machines | `ProcessState`, `FSM` |
| Scheduler / CPU | `GanttChart`, `CPU` |
| Memory layout | `MemoryLayout` |
| ML metrics | `ConfusionMatrix` |
| Key-value storage | `HashTable` |
| Analogies, "X is like Y" | `Analogy` |
| Architecture diagrams | `Server`, `Database`, `Cloud`, `Service`, `Arrow` |
| Microservices | `Service`, `Queue`, `LoadBalancer` |
| REST APIs | `Service` with `metadata.kind: "API"`, `APIEndpoint` |
| API gateways | `APIGateway` |
| Caching layers | `Cache` |
| Big O, algorithm complexity | `BigO` |
| Categorical comparisons | `BarChart` |
| Git workflows | `GitBranch`, `GitCommit`, `PullRequest` |
| CI/CD pipelines | `Pipeline`, `Build`, `Deployment` |
| Authentication flows | `AuthFlow`, `Token` |
| Math / equations | `Equation`, `Expression`, `Matrix` |
| Physics | `FreeBodyDiagram`, `Vector`, `Wave` |
| Step-by-step instructions | `StepList` |
