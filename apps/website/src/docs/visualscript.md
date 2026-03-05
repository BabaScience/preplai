# VisualScript Schema

**Summary:** VisualScript is the JSON schema that any AI agent passes to `add_scene` and `update_scene`. It defines how a scene is rendered on a 1920×1080 canvas. Positions use percentages (0–100). Entity types (Server, Database, BinaryTree, etc.) map to rich SVG visuals. An 80px horizontal and 60px vertical margin/safe zone is applied automatically.

**Definitions:**
- **VisualScript:** JSON object with `sceneId`, `frames` array, and `totalDuration`. Required by `add_scene` and `update_scene`.
- **Entity:** A visual element (Server, Database, Label, Arrow, etc.) with `id`, `type`, `position`, and optional `label`, `color`, `metadata`.
- **Frame:** Object with `id`, `startTime`, `endTime`, `entities`, `narrationSegment`, and optional `transitions`.

## Structure

```json
{
  "sceneId": "scene-1",
  "totalDuration": 5000,
  "style": "cinema",
  "frames": [
    {
      "id": "frame-1",
      "startTime": 0,
      "endTime": 5000,
      "description": "Internal note (not shown)",
      "narrationSegment": "Subtitle shown to user",
      "entities": [...],
      "transitions": [...]
    }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `sceneId` | string | Unique scene ID |
| `totalDuration` | number | Total duration in ms |
| `style` | string | `"cinema"` (default) or `"minimal"` — theme for this scene |
| `frames` | array | At least one frame |

**Note:** Theme and palette are set at the session level via `create_session` and the user's dashboard preferences. The `player_url` includes `?style=` and `?palette=` (e.g. `?style=cinema&palette=ocean`). See [MCP Tools — Themes and Palettes](/docs/mcp-tools#themes-and-palettes).

## Frame

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique frame ID |
| `startTime` | number | Start time in ms |
| `endTime` | number | End time in ms |
| `narrationSegment` | string | Subtitle (1–2 sentences) |
| `description` | string | Internal note (not shown) |
| `entities` | array | Visual entities |
| `transitions` | array | Animations between states |

**Frame pacing:** 3–5 seconds per frame for readability. 3–7 entities per frame.

## Entity Types

### Dedicated (prefer these — rich visuals)

- **Server** — Rack with LEDs
- **Database** — Cylinder
- **User** — Avatar
- **Cloud** — Blob
- **Concept** — Auto-sized circle
- **Label** — Text with optional pill
- **CodeBlock** — Dark terminal with traffic-light dots
- **BinaryTree**, **BTree** — Tree structures
- **CallStack** — Stack frames
- **HashTable** — Key-value pairs
- **Array** — Indexed cells with customizable values; use `metadata.values` and `metadata.disabledIndexes` to show/dim cells
- **GanttChart** — Task bars
- **ProcessState** — State diagram
- **MemoryLayout** — Stack/heap
- **ConfusionMatrix** — TP/FP/TN/FN grid
- **Graph2D** — 2D plots (ROC, loss, scatter)

### Connection Types

- **Arrow**, **DataFlow** — Arrows with glow
- **BidirectArrow**, **DottedArrow**, **Transition**, **Bus**

### Topic → Type Mapping

| Topic | Preferred Type |
|-------|----------------|
| Trees (BST, AVL, heaps) | BinaryTree, BTree |
| Call stacks, recursion | CallStack |
| State machines | ProcessState |
| Scheduler / CPU | GanttChart |
| Memory layout | MemoryLayout |
| ML metrics | ConfusionMatrix |
| Key-value storage | HashTable |
| Arrays, lists, indexed data | Array |
| Architecture diagrams | Server, Database, Cloud, Arrow |

## Entity Schema

```json
{
  "id": "srv",
  "type": "Server",
  "position": { "x": 30, "y": 45 },
  "size": 1,
  "label": "API Server",
  "color": "#4FC3F7",
  "highlight": false,
  "animation": {
    "delay": 0,
    "duration": 600,
    "easing": "power2.out",
    "entrance": "fadeInUp"
  }
}
```

For **Arrow**/**DataFlow**: add `sourceEntityId`, `targetEntityId`. Use `metadata.curved: true` for curved arrows.

For **Array**: use `metadata.values` (e.g. `["a", "b", "c", "d", "e"]`) to set cell contents; `metadata.disabledIndexes` (e.g. `[1, 3]`) to dim specific 0-based indexes; `metadata.selectedIndexes` (e.g. `[0, 2]`) to highlight cells (e.g. current comparison in binary search). Or `metadata.cells = [{value, enabled?, selected?}]`. Max 8 cells.

## Design Guidelines

- **Colors:** Pick 2–3 colors max per scene. Recommended: Cyan + Violet + Warm, or Blue + Green + White
- **Labels:** Up to ~80 chars; longer text auto-wraps
- **Title labels:** `type: "Label"`, `color: "#FFFFFF"`, `size: 2` or higher
- **Spacing:** Minimum 15% gap between entity positions
- **Highlight:** Use `"highlight": true` to emphasize the current entity

## Example

```json
{
  "sceneId": "scene-1",
  "totalDuration": 5000,
  "frames": [
    {
      "id": "frame-1",
      "startTime": 0,
      "endTime": 5000,
      "description": "Server to database",
      "narrationSegment": "The server sends queries to the database",
      "entities": [
        {
          "id": "title",
          "type": "Label",
          "position": { "x": 50, "y": 6 },
          "label": "System Architecture",
          "color": "#FFFFFF",
          "size": 2
        },
        {
          "id": "srv",
          "type": "Server",
          "position": { "x": 30, "y": 45 },
          "label": "API Server",
          "color": "#4FC3F7"
        },
        {
          "id": "db",
          "type": "Database",
          "position": { "x": 70, "y": 45 },
          "label": "PostgreSQL",
          "color": "#81C784"
        },
        {
          "id": "arrow1",
          "type": "Arrow",
          "position": { "x": 50, "y": 45 },
          "sourceEntityId": "srv",
          "targetEntityId": "db",
          "label": "SQL Queries",
          "color": "#FFD54F"
        }
      ]
    }
  ]
}
```
