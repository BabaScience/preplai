# VisualScript: The Schema for AI-Generated Scenes

**Summary:** VisualScript is the JSON schema that AI agents pass to `add_scene` and `update_scene`. It defines how a scene is rendered on a 1920×1080 canvas — entities (Server, Database, BinaryTree, etc.), frames, timing, and narration. This post explains the structure and how agents use it.

**Key terms:** VisualScript, add_scene, entity types, frames, preplai

---

## What is VisualScript?

VisualScript is a JSON object with three main parts:

- **sceneId** — Unique identifier for the scene
- **frames** — Array of frames, each with entities, timing, and narration
- **totalDuration** — Total duration in milliseconds

Agents don't draw pixels. They emit VisualScript JSON. preplai compiles it into animated SVG.

---

## Entity types

Each frame contains **entities** — visual elements with a type, position, and optional label/color. preplai supports rich entity types:

| Type | Use case |
|------|----------|
| Server, Database, Cloud | Architecture diagrams |
| BinaryTree, BTree | Trees (BST, heaps) |
| CallStack | Recursion, stack traces |
| HashTable | Key-value storage |
| GanttChart | Scheduler, CPU timelines |
| Graph2D | ROC curves, loss plots |
| BigO | Algorithm complexity, Big O notation |
| BarChart | Categorical comparisons (sales, counts, rankings) |
| Label | Titles, subtitles |
| Arrow, DataFlow | Connections between entities |

Agents pick types that match the user's topic. "Explain binary search" → BinaryTree. "Show our architecture" → Server, Database, Arrow.

---

## Frame structure

Each frame has:

- **id** — Unique frame ID
- **startTime**, **endTime** — Timing in ms
- **entities** — Array of visual entities
- **narrationSegment** — Subtitle shown to the viewer
- **description** — Internal note (not shown)

Frames play in sequence. Typical pacing: 3–5 seconds per frame, 3–7 entities per frame.

---

## Example

```json
{
  "sceneId": "scene-1",
  "totalDuration": 5000,
  "frames": [{
    "id": "frame-1",
    "startTime": 0,
    "endTime": 5000,
    "narrationSegment": "The server sends queries to the database",
    "entities": [
      { "id": "title", "type": "Label", "position": { "x": 50, "y": 6 }, "label": "System Architecture", "size": 2 },
      { "id": "srv", "type": "Server", "position": { "x": 30, "y": 45 }, "label": "API Server" },
      { "id": "db", "type": "Database", "position": { "x": 70, "y": 45 }, "label": "PostgreSQL" }
    ]
  }]
}
```

For the full schema and design guidelines, see the [VisualScript Schema](/docs/visualscript) docs.
