# Full Data Flow: User Prompt → UI Pixels

**The complete journey of a CS explanation through the PRE system.**

This document traces what happens at every layer — from the moment a user types a prompt, to the SVG nodes rendered on screen — using a concrete example: **"Explain how insertion works in a Binary Search Tree."**

---

## The 7 Stages

```
 USER                 AGENT                MCP SERVER           SSE              PLAYER              REGISTRY            SVG CANVAS
  │                    │                      │                  │                  │                    │                   │
  │  "Explain BST      │                      │                  │                  │                    │                   │
  │   insertion"        │                      │                  │                  │                    │                   │
  │ ─────────────────► │                      │                  │                  │                    │                   │
  │                    │  1. Reasons about     │                  │                  │                    │                   │
  │                    │     how to teach BST  │                  │                  │                    │                   │
  │                    │     visually          │                  │                  │                    │                   │
  │                    │                      │                  │                  │                    │                   │
  │                    │  2. create_session()  │                  │                  │                    │                   │
  │                    │ ────────────────────► │                  │                  │                    │                   │
  │                    │                      │  session_id +    │                  │                    │                   │
  │                    │  ◄──────────────────  │  player_url      │                  │                    │                   │
  │                    │                      │                  │                  │                    │                   │
  │  (agent shows      │                      │                  │                  │                    │                   │
  │   player_url       │                      │                  │                  │                    │                   │
  │   to user)         │                      │                  │  EventSource     │                    │                   │
  │ ──── opens URL ──────────────────────────────────────────── │ ──────────────► │                    │                   │
  │                    │                      │                  │  connected ───► │                    │                   │
  │                    │                      │                  │                  │                    │                   │
  │                    │  3. add_scene()       │                  │                  │                    │                   │
  │                    │     { VisualScript }  │                  │                  │                    │                   │
  │                    │ ────────────────────► │                  │                  │                    │                   │
  │                    │                      │  4. Zod validate │                  │                    │                   │
  │                    │                      │  5. SQLite write │                  │                    │                   │
  │                    │                      │  6. SSE emit ──► │  script_update   │                    │                   │
  │                    │                      │                  │ ────────────────► │                    │                   │
  │                    │                      │                  │                  │  7. loadScript()   │                    │
  │                    │                      │                  │                  │ ──────────────────► │                   │
  │                    │                      │                  │                  │                    │  8. renderFrame() │
  │                    │                      │                  │                  │                    │ ────────────────► │
  │                    │                      │                  │                  │                    │                   │
  │                    │                      │                  │                  │                    │   SVG DOM nodes   │
  │  ◄──────────────────────────────────────────────────────────────────────────────────────────────────  appear in browser │
  │  User sees animated                                                                                                    │
  │  BST on screen                                                                                                         │
```

---

## Stage 1: User Prompt → Agent Reasoning

**Where:** The AI agent (Claude, GPT-4o, Gemini — any MCP-capable LLM)

The user types:
```
"Explain how insertion works in a Binary Search Tree"
```

The agent has PRE's MCP tools in its tool list (received during the MCP `initialize` handshake). It knows the available entity types from the tool descriptions. The agent now reasons:

> "I need to show a BST step by step. I'll use:
> - Frame 1: Empty tree, then insert root node (value 8)
> - Frame 2: Insert 3 — goes left because 3 < 8
> - Frame 3: Insert 10 — goes right because 10 > 8
> - Frame 4: Insert 6 — goes left (3 < 8), then right (6 > 3)
>
> I'll use `BinaryTree` entities to draw the tree at each state,
> `Pointer` to show the comparison path, `Label` for the rule,
> and `CodeBlock` to show the insertion algorithm."

The agent has NOT made any API call yet. This is pure reasoning.

---

## Stage 2: Agent → `create_session` MCP Tool Call

**Where:** Agent → MCP Server  
**Protocol:** Streamable HTTP `POST /mcp`  
**Wire format:** JSON-RPC 2.0

### What the agent sends

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "create_session",
    "arguments": {
      "title": "Binary Search Tree Insertion",
      "aspect_ratio": "16:9"
    }
  }
}
```

### What the MCP server does

1. `fastify-mcp-server` plugin receives the POST at `/mcp`
2. Routes to the `create_session` tool handler
3. Validates input via Zod (`CreateSessionSchema`)
4. Generates `session_id` via `crypto.randomUUID()`
5. Writes to SQLite: `INSERT INTO sessions (id, title, aspect_ratio, created_at) VALUES (...)`
6. Caches in `sessionStore` Map

### What comes back

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [{
      "type": "text",
      "text": "{\"success\":true,\"data\":{\"session_id\":\"b3f1c2d4-89ab-4cde-8012-3456789abcde\",\"player_url\":\"https://pre.app/player/b3f1c2d4-89ab-4cde-8012-3456789abcde\",\"embed_url\":\"https://pre.app/player/b3f1c2d4-89ab-4cde-8012-3456789abcde?embed=1\",\"title\":\"Binary Search Tree Insertion\",\"aspect_ratio\":\"16:9\",\"created_at\":\"2026-02-28T16:00:00.000Z\"}}"
    }]
  }
}
```

The agent now has `session_id` and `player_url`. It shares `player_url` with the user. The user opens it in a browser.

---

## Stage 2.5: Player Connects via SSE

**Where:** Browser → MCP Server  
**Trigger:** User opens `player_url` in browser (or host page embeds the `<iframe>`)

When the player HTML loads, it executes:

```js
// player/player.js
const SESSION_ID = 'b3f1c2d4-89ab-4cde-8012-3456789abcde';
const svgCanvas  = document.getElementById('canvas');
const controller = new SceneController(svgCanvas);

const es = new EventSource(`/session/${SESSION_ID}/events`);

es.addEventListener('connected', (e) => { /* ready */ });
es.addEventListener('script_update', (e) => {
  const { script } = JSON.parse(e.data);
  controller.loadScript(script);     // ← THIS IS WHERE RENDERING STARTS
});
```

At this point the browser shows an empty dark canvas (1920×1080 viewBox). The `EventSource` holds an open HTTP connection, waiting for SSE events.

---

## Stage 3: Agent → `add_scene` MCP Tool Call (The Big One)

**Where:** Agent → MCP Server  
**This is where the agent constructs the entire VisualScript.**

### What the agent sends

The VisualScript is the core data model. It contains `frames`, and each frame contains `entities`. Here's what the agent constructs for a 4-frame BST insertion explanation:

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "add_scene",
    "arguments": {
      "session_id": "b3f1c2d4-89ab-4cde-8012-3456789abcde",
      "visual_script": {

        "sceneId": "bst-insertion",
        "totalDuration": 16000,
        "frames": [

          // ═══════════════════════════════════════════
          // FRAME 0: "Insert 8 as root"
          // ═══════════════════════════════════════════
          {
            "id": "frame-0",
            "startTime": 0,
            "endTime": 4000,
            "entities": [

              // ── The BST visualization ──
              {
                "id": "bst-1",
                "type": "BinaryTree",
                "position": { "x": 50, "y": 45 },
                "size": { "width": 50, "height": 55 },
                "metadata": {
                  "nodes": [
                    { "value": "8", "id": "n8", "highlight": "insert" }
                  ],
                  "edges": [],
                  "layout": "reingold-tilford",
                  "nodeRadius": 24,
                  "levelSpacing": 70,
                  "siblingSpacing": 50
                },
                "animation": {
                  "type": "fadeIn",
                  "duration": 600,
                  "delay": 0,
                  "entrance": "entrance-fadeInUp"
                }
              },

              // ── Title label ──
              {
                "id": "title-1",
                "type": "Label",
                "position": { "x": 50, "y": 5 },
                "size": { "width": 40, "height": 5 },
                "label": "Binary Search Tree — Insertion",
                "color": "#ffffff",
                "animation": {
                  "type": "fadeIn",
                  "duration": 400,
                  "delay": 0,
                  "entrance": "entrance-fadeIn"
                }
              },

              // ── Step explanation ──
              {
                "id": "step-1",
                "type": "Callout",
                "position": { "x": 85, "y": 30 },
                "size": { "width": 22, "height": 12 },
                "label": "Step 1",
                "textContent": ["Tree is empty.", "8 becomes the root."],
                "metadata": {
                  "calloutType": "tip"
                },
                "animation": {
                  "type": "fadeIn",
                  "duration": 400,
                  "delay": 200,
                  "entrance": "entrance-fadeInUp"
                }
              },

              // ── The algorithm code ──
              {
                "id": "code-1",
                "type": "CodeBlock",
                "position": { "x": 15, "y": 75 },
                "size": { "width": 28, "height": 20 },
                "textContent": [
                  "function insert(node, val) {",
                  "  if (node === null)",
                  "    return new Node(val);  ← HERE",
                  "  if (val < node.val)",
                  "    node.left = insert(node.left, val);",
                  "  else",
                  "    node.right = insert(node.right, val);",
                  "  return node;",
                  "}"
                ],
                "codeLanguage": "javascript",
                "metadata": {
                  "highlightLines": [2, 3]
                },
                "animation": {
                  "type": "fadeIn",
                  "duration": 400,
                  "delay": 400,
                  "entrance": "entrance-fadeInUp"
                }
              }
            ]
          },

          // ═══════════════════════════════════════════
          // FRAME 1: "Insert 3 — goes left of 8"
          // ═══════════════════════════════════════════
          {
            "id": "frame-1",
            "startTime": 4000,
            "endTime": 8000,
            "entities": [

              {
                "id": "bst-1",
                "type": "BinaryTree",
                "position": { "x": 50, "y": 45 },
                "size": { "width": 50, "height": 55 },
                "metadata": {
                  "nodes": [
                    { "value": "8", "id": "n8", "highlight": "compare" },
                    { "value": "3", "id": "n3", "highlight": "insert" }
                  ],
                  "edges": [
                    { "from": "n8", "to": "n3", "side": "left" }
                  ],
                  "layout": "reingold-tilford",
                  "nodeRadius": 24,
                  "levelSpacing": 70,
                  "siblingSpacing": 50
                },
                "animation": {
                  "type": "fadeIn",
                  "duration": 600,
                  "delay": 0,
                  "entrance": "entrance-fadeInUp"
                }
              },

              // ── Comparison pointer ──
              {
                "id": "ptr-1",
                "type": "Pointer",
                "position": { "x": 50, "y": 32 },
                "size": { "width": 5, "height": 5 },
                "label": "3 < 8 → go left",
                "color": "#ff6b6b",
                "metadata": {
                  "direction": "down-left",
                  "style": "arrow"
                },
                "animation": {
                  "type": "fadeIn",
                  "duration": 300,
                  "delay": 300,
                  "entrance": "entrance-fadeInUp"
                }
              },

              {
                "id": "title-1",
                "type": "Label",
                "position": { "x": 50, "y": 5 },
                "size": { "width": 40, "height": 5 },
                "label": "Binary Search Tree — Insertion",
                "color": "#ffffff",
                "animation": { "type": "none", "duration": 0, "delay": 0 }
              },

              {
                "id": "step-1",
                "type": "Callout",
                "position": { "x": 85, "y": 30 },
                "size": { "width": 22, "height": 12 },
                "label": "Step 2",
                "textContent": ["Insert 3.", "3 < 8, so go LEFT.", "Left is null → place here."],
                "metadata": { "calloutType": "tip" },
                "animation": {
                  "type": "fadeIn",
                  "duration": 400,
                  "delay": 200,
                  "entrance": "entrance-fadeInUp"
                }
              },

              {
                "id": "code-1",
                "type": "CodeBlock",
                "position": { "x": 15, "y": 75 },
                "size": { "width": 28, "height": 20 },
                "textContent": [
                  "function insert(node, val) {",
                  "  if (node === null)",
                  "    return new Node(val);",
                  "  if (val < node.val)          ← HERE",
                  "    node.left = insert(node.left, val);",
                  "  else",
                  "    node.right = insert(node.right, val);",
                  "  return node;",
                  "}"
                ],
                "codeLanguage": "javascript",
                "metadata": { "highlightLines": [3, 4] },
                "animation": { "type": "none", "duration": 0, "delay": 0 }
              }
            ]
          },

          // ═══════════════════════════════════════════
          // FRAME 2: "Insert 10 — goes right of 8"
          // ═══════════════════════════════════════════
          {
            "id": "frame-2",
            "startTime": 8000,
            "endTime": 12000,
            "entities": [
              {
                "id": "bst-1",
                "type": "BinaryTree",
                "position": { "x": 50, "y": 45 },
                "size": { "width": 50, "height": 55 },
                "metadata": {
                  "nodes": [
                    { "value": "8", "id": "n8", "highlight": "compare" },
                    { "value": "3", "id": "n3", "highlight": "none" },
                    { "value": "10", "id": "n10", "highlight": "insert" }
                  ],
                  "edges": [
                    { "from": "n8", "to": "n3", "side": "left" },
                    { "from": "n8", "to": "n10", "side": "right" }
                  ],
                  "layout": "reingold-tilford",
                  "nodeRadius": 24,
                  "levelSpacing": 70,
                  "siblingSpacing": 50
                },
                "animation": {
                  "type": "fadeIn",
                  "duration": 600,
                  "delay": 0,
                  "entrance": "entrance-fadeInUp"
                }
              },

              {
                "id": "ptr-1",
                "type": "Pointer",
                "position": { "x": 50, "y": 32 },
                "size": { "width": 5, "height": 5 },
                "label": "10 > 8 → go right",
                "color": "#ff6b6b",
                "metadata": { "direction": "down-right", "style": "arrow" },
                "animation": {
                  "type": "fadeIn",
                  "duration": 300,
                  "delay": 300,
                  "entrance": "entrance-fadeInUp"
                }
              },

              {
                "id": "title-1",
                "type": "Label",
                "position": { "x": 50, "y": 5 },
                "size": { "width": 40, "height": 5 },
                "label": "Binary Search Tree — Insertion",
                "color": "#ffffff",
                "animation": { "type": "none", "duration": 0, "delay": 0 }
              },

              {
                "id": "step-1",
                "type": "Callout",
                "position": { "x": 85, "y": 30 },
                "size": { "width": 22, "height": 12 },
                "label": "Step 3",
                "textContent": ["Insert 10.", "10 > 8, so go RIGHT.", "Right is null → place here."],
                "metadata": { "calloutType": "tip" },
                "animation": {
                  "type": "fadeIn",
                  "duration": 400,
                  "delay": 200,
                  "entrance": "entrance-fadeInUp"
                }
              },

              {
                "id": "code-1",
                "type": "CodeBlock",
                "position": { "x": 15, "y": 75 },
                "size": { "width": 28, "height": 20 },
                "textContent": [
                  "function insert(node, val) {",
                  "  if (node === null)",
                  "    return new Node(val);",
                  "  if (val < node.val)",
                  "    node.left = insert(node.left, val);",
                  "  else                          ← HERE",
                  "    node.right = insert(node.right, val);",
                  "  return node;",
                  "}"
                ],
                "codeLanguage": "javascript",
                "metadata": { "highlightLines": [5, 6] },
                "animation": { "type": "none", "duration": 0, "delay": 0 }
              }
            ]
          },

          // ═══════════════════════════════════════════
          // FRAME 3: "Insert 6 — goes left of 8, then right of 3"
          // ═══════════════════════════════════════════
          {
            "id": "frame-3",
            "startTime": 12000,
            "endTime": 16000,
            "entities": [
              {
                "id": "bst-1",
                "type": "BinaryTree",
                "position": { "x": 50, "y": 45 },
                "size": { "width": 50, "height": 55 },
                "metadata": {
                  "nodes": [
                    { "value": "8", "id": "n8", "highlight": "visited" },
                    { "value": "3", "id": "n3", "highlight": "compare" },
                    { "value": "10", "id": "n10", "highlight": "none" },
                    { "value": "6", "id": "n6", "highlight": "insert" }
                  ],
                  "edges": [
                    { "from": "n8", "to": "n3", "side": "left" },
                    { "from": "n8", "to": "n10", "side": "right" },
                    { "from": "n3", "to": "n6", "side": "right" }
                  ],
                  "traversalPath": ["n8", "n3", "n6"],
                  "layout": "reingold-tilford",
                  "nodeRadius": 24,
                  "levelSpacing": 70,
                  "siblingSpacing": 50
                },
                "animation": {
                  "type": "fadeIn",
                  "duration": 600,
                  "delay": 0,
                  "entrance": "entrance-fadeInUp"
                }
              },

              {
                "id": "step-1",
                "type": "StepList",
                "position": { "x": 85, "y": 25 },
                "size": { "width": 22, "height": 25 },
                "metadata": {
                  "steps": [
                    { "text": "6 < 8 → go left", "status": "done" },
                    { "text": "6 > 3 → go right", "status": "done" },
                    { "text": "Right is null → place 6 here", "status": "active" }
                  ]
                },
                "animation": {
                  "type": "fadeIn",
                  "duration": 400,
                  "delay": 200,
                  "entrance": "entrance-fadeInUp"
                }
              },

              {
                "id": "title-1",
                "type": "Label",
                "position": { "x": 50, "y": 5 },
                "size": { "width": 40, "height": 5 },
                "label": "Binary Search Tree — Insertion",
                "color": "#ffffff",
                "animation": { "type": "none", "duration": 0, "delay": 0 }
              },

              {
                "id": "code-1",
                "type": "CodeBlock",
                "position": { "x": 15, "y": 75 },
                "size": { "width": 28, "height": 20 },
                "textContent": [
                  "function insert(node, val) {",
                  "  if (node === null)",
                  "    return new Node(val);      ← FINALLY",
                  "  if (val < node.val)",
                  "    node.left = insert(node.left, val);",
                  "  else",
                  "    node.right = insert(node.right, val);",
                  "  return node;",
                  "}"
                ],
                "codeLanguage": "javascript",
                "metadata": { "highlightLines": [1, 2] },
                "animation": { "type": "none", "duration": 0, "delay": 0 }
              }
            ]
          }
        ]
      }
    }
  }
}
```

This is the **complete** JSON-RPC payload the agent sends. Everything the user will see is encoded here.

---

## Stage 4: MCP Server — Validation

**Where:** `@pre/mcp-server` → `add_scene` tool handler

### Step-by-step processing

```
POST /mcp arrives
  │
  ▼
fastify-mcp-server routes to add_scene handler
  │
  ▼
Zod validation runs:
  ├── session_id: z.string().uuid()               ✓ valid UUID
  ├── visual_script: VisualScriptSchema            
  │     ├── sceneId: z.string()                    ✓ "bst-insertion"
  │     ├── totalDuration: z.number()              ✓ 16000
  │     └── frames: z.array(FrameSchema)           
  │           ├── [0].id: z.string()               ✓ "frame-0"
  │           ├── [0].startTime: z.number()        ✓ 0
  │           ├── [0].endTime: z.number()          ✓ 4000
  │           └── [0].entities: z.array(EntitySchema)
  │                 ├── [0].id: z.string()         ✓ "bst-1"
  │                 ├── [0].type: VisualEntityType ✓ "BinaryTree"
  │                 ├── [0].position.x: 0–100      ✓ 50
  │                 ├── [0].position.y: 0–100      ✓ 45
  │                 ├── [0].size.width: number      ✓ 50
  │                 ├── [0].size.height: number     ✓ 55
  │                 └── [0].metadata: z.record()   ✓ { nodes: [...], ... }
  │
  ▼ Validation passes
  │
  ▼
SQLite write:
  INSERT OR REPLACE INTO visual_scripts
    (session_id, script_json, updated_at)
  VALUES ('b3f1c2d4-...', '{...full JSON...}', 1740751260000)
  │
  ▼
In-memory update:
  sessionStore.get('b3f1c2d4-...').script = visual_script;
  │
  ▼
SSE emit ──────────────────────► (Stage 5)
```

The critical point: **the MCP server does not interpret the `metadata` object.** It validates the structural envelope (type, position, size, animation) but passes `metadata` through opaquely. The BinaryTree's `nodes` and `edges` arrays are just `z.record(z.any())` — the renderer is what gives them meaning.

---

## Stage 5: SSE Push — Server to Player

**Where:** MCP Server → Browser (EventSource)

The server pushes the script to all connected SSE clients for this session:

```js
// Inside add_scene handler
sseEmit(session_id, {
  type: 'script_update',
  script: visual_script,    // ← the full VisualScript JSON
});
```

### What goes over the wire (SSE format)

```
event: script_update
id: 1740751260000
data: {"script":{"sceneId":"bst-insertion","totalDuration":16000,"frames":[{"id":"frame-0",...}]}}

```

The browser's `EventSource` receives this as a `MessageEvent`:

```js
es.addEventListener('script_update', (e) => {
  const { script } = JSON.parse(e.data);
  // script is now the full VisualScript object
  controller.loadScript(script);
});
```

---

## Stage 6: Scene Controller — Frame Rendering

**Where:** `@pre/player` → `SceneController.loadScript()` → `renderFrame()`

```js
loadScript(script) {
  this.script = script;
  this.clear();                              // wipe canvas
  if (script.frames?.length > 0) {
    this.renderFrame(script.frames[0]);      // render frame-0
  }
}
```

### `renderFrame()` — The Two-Pass Dispatch

```js
renderFrame(frame) {
  this.clear();
  this.currentFrame = frame;

  const { entities } = frame;
  // frame-0 entities: [bst-1, title-1, step-1, code-1]

  // ═══ Pass 1: Non-connector entities ═══
  for (const entity of entities) {
    if (entity.type === 'Arrow' || entity.type === 'DataFlow') continue;

    // For entity "bst-1" (type: "BinaryTree"):
    //   registry['BinaryTree'] → renderBinaryTree(entity, this.svg)
    const el = renderEntity(entity, this.svg);
    if (el) this.entityMap.set(entity.id, el);
  }

  // ═══ Pass 2: Connectors (need positions from Pass 1) ═══
  for (const entity of entities) {
    if (entity.type !== 'Arrow' && entity.type !== 'DataFlow') continue;
    const el = renderEntity(entity, this.svg, entities);
    if (el) this.entityMap.set(entity.id, el);
  }
}
```

### `renderEntity()` — Registry Dispatch

```js
// registry.js

function renderEntity(entity, parentEl, allEntities) {
  const fn = registry[entity.type];
  //   registry['BinaryTree'] → renderBinaryTree
  //   registry['Label']      → renderLabel
  //   registry['Callout']    → renderCallout
  //   registry['CodeBlock']  → renderCodeBlock

  if (!fn) {
    console.warn(`Unknown entity type: ${entity.type}`);
    return null;
  }

  if (entity.type === 'Arrow' || entity.type === 'DataFlow') {
    return fn(entity, parentEl, allEntities);
  }
  return fn(entity, parentEl);
}
```

For Frame 0, four dispatch calls happen in sequence:

| Order | `entity.id` | `entity.type` | Registry maps to | Pass |
|---|---|---|---|---|
| 1 | `bst-1` | `BinaryTree` | `renderBinaryTree()` | 1 |
| 2 | `title-1` | `Label` | `renderLabel()` | 1 |
| 3 | `step-1` | `Callout` | `renderCallout()` | 1 |
| 4 | `code-1` | `CodeBlock` | `renderCodeBlock()` | 1 |

No Arrow/DataFlow entities in this frame, so Pass 2 is a no-op.

---

## Stage 7: Component Render Function — SVG DOM Construction

**Where:** `player/components/binarytree.js` → `renderBinaryTree()`

This is where the `metadata` gets interpreted and turned into actual SVG nodes. Here's what the `BinaryTree` renderer does with the data from Frame 1 (Insert 3):

### Input

```json
{
  "id": "bst-1",
  "type": "BinaryTree",
  "position": { "x": 50, "y": 45 },
  "size": { "width": 50, "height": 55 },
  "metadata": {
    "nodes": [
      { "value": "8", "id": "n8", "highlight": "compare" },
      { "value": "3", "id": "n3", "highlight": "insert" }
    ],
    "edges": [
      { "from": "n8", "to": "n3", "side": "left" }
    ],
    "layout": "reingold-tilford",
    "nodeRadius": 24,
    "levelSpacing": 70,
    "siblingSpacing": 50
  }
}
```

### What the render function does

```js
export function renderBinaryTree(entity, parentEl) {
  // 1. Build the double-<g> structure
  const { outerG, innerG } = buildEntityGroup(entity);
  // outerG gets: id="bst-1", transform="translate(960, 486)"
  //   (960 = 50/100 * 1920,  486 = 45/100 * 1080)
  // innerG gets: entrance animation class

  const { nodes, edges, layout, nodeRadius, levelSpacing, siblingSpacing }
    = entity.metadata;

  // 2. Compute tree layout (Reingold-Tilford algorithm)
  //    Input:  flat node list + edge list
  //    Output: x,y pixel position for each node
  const positions = computeTreeLayout(nodes, edges, {
    nodeRadius:      nodeRadius ?? 24,
    levelSpacing:    levelSpacing ?? 70,
    siblingSpacing:  siblingSpacing ?? 50,
  });
  // positions = {
  //   "n8": { x: 0,   y: 0   },  ← root at center-top
  //   "n3": { x: -50, y: 70  },  ← left child
  // }

  // 3. Draw edges FIRST (so they render behind nodes)
  for (const edge of edges) {
    const from = positions[edge.from];  // { x: 0, y: 0 }
    const to   = positions[edge.to];    // { x: -50, y: 70 }

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(from.x));
    line.setAttribute('y1', String(from.y + nodeRadius));
    line.setAttribute('x2', String(to.x));
    line.setAttribute('y2', String(to.y - nodeRadius));
    line.setAttribute('stroke', '#ffffff');
    line.setAttribute('stroke-width', '2');
    line.setAttribute('opacity', '0.6');
    innerG.appendChild(line);
  }

  // 4. Draw nodes
  for (const node of nodes) {
    const pos = positions[node.id];

    // Node circle
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r',  String(nodeRadius));

    // Highlight state determines color
    const colors = {
      'none':    { fill: '#00e5ff15', stroke: '#00e5ff' },
      'compare': { fill: '#ffab0030', stroke: '#ffab00' },
      'insert':  { fill: '#00e67630', stroke: '#00e676' },
      'visited': { fill: '#b388ff20', stroke: '#b388ff' },
    };
    const c = colors[node.highlight ?? 'none'];
    circle.setAttribute('fill',   c.fill);
    circle.setAttribute('stroke', c.stroke);
    circle.setAttribute('stroke-width', '2');
    innerG.appendChild(circle);

    // Value text inside circle
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(pos.x));
    text.setAttribute('y', String(pos.y + 5));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', '#ffffff');
    text.setAttribute('font-size', '16');
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', 'JetBrains Mono, monospace');
    text.textContent = node.value;
    innerG.appendChild(text);
  }

  // 5. Apply entrance animation
  applyEntranceAnimation(innerG, entity);

  // 6. Append to parent SVG
  parentEl.appendChild(outerG);
  return outerG;
}
```

---

## Stage 8: What Appears in the Browser (SVG DOM)

After all 4 entities in Frame 0 are rendered, the SVG canvas DOM looks like this:

```html
<svg id="canvas" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid meet">

  <!-- Shared definitions (arrowhead markers, etc.) -->
  <defs>
    <marker id="arrowhead" viewBox="0 0 10 10" refX="10" refY="5"
            markerWidth="8" markerHeight="8" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#ffffff"/>
    </marker>
  </defs>

  <!-- ═══ Entity: bst-1 (BinaryTree) ═══ -->
  <g id="bst-1" transform="translate(960, 486)">     ← outerG (position)
    <g class="entrance-fadeInUp" style="...">         ← innerG (animation)

      <!-- Node: 8 (root, highlighted as "insert") -->
      <circle cx="0" cy="0" r="24"
              fill="#00e67630" stroke="#00e676" stroke-width="2"/>
      <text x="0" y="5" text-anchor="middle"
            fill="#ffffff" font-size="16" font-weight="600"
            font-family="JetBrains Mono, monospace">8</text>

    </g>
  </g>

  <!-- ═══ Entity: title-1 (Label) ═══ -->
  <g id="title-1" transform="translate(960, 54)">
    <g class="entrance-fadeIn" style="...">
      <text x="0" y="0" text-anchor="middle"
            fill="#ffffff" font-size="22" font-weight="600"
            font-family="Inter, DM Sans, sans-serif">
        Binary Search Tree — Insertion
      </text>
      <line x1="-180" x2="180" y1="8" y2="8"
            stroke="#ffffff" stroke-width="1" opacity="0.3"/>
    </g>
  </g>

  <!-- ═══ Entity: step-1 (Callout) ═══ -->
  <g id="step-1" transform="translate(1632, 324)">
    <g class="entrance-fadeInUp" style="animation-delay: 200ms">
      <!-- Callout box with tip styling -->
      <rect x="-200" y="-65" width="400" height="130" rx="8"
            fill="#00e67615" stroke="#00e676" stroke-width="2"/>
      <!-- Emoji icon -->
      <text x="-170" y="-30" font-size="18">💡</text>
      <!-- "Step 1" bold header -->
      <text x="-145" y="-30" fill="#00e676" font-size="14"
            font-weight="700">Step 1</text>
      <!-- Body text lines -->
      <text x="-170" y="0" fill="#ffffff" font-size="13"
            font-family="Inter, sans-serif">Tree is empty.</text>
      <text x="-170" y="20" fill="#ffffff" font-size="13"
            font-family="Inter, sans-serif">8 becomes the root.</text>
    </g>
  </g>

  <!-- ═══ Entity: code-1 (CodeBlock) ═══ -->
  <g id="code-1" transform="translate(288, 810)">
    <g class="entrance-fadeInUp" style="animation-delay: 400ms">
      <!-- Dark background -->
      <rect x="-260" y="-108" width="520" height="216" rx="8"
            fill="#1e1e2e" stroke="#b388ff" stroke-width="1"/>
      <!-- Traffic-light dots -->
      <circle cx="-240" cy="-90" r="5" fill="#ff5f56"/>
      <circle cx="-225" cy="-90" r="5" fill="#ffbd2e"/>
      <circle cx="-210" cy="-90" r="5" fill="#27c93f"/>
      <!-- Code lines (monospace) -->
      <text x="-240" y="-65" fill="#cccccc" font-size="12"
            font-family="JetBrains Mono, monospace">function insert(node, val) {</text>
      <!-- Line 2 — HIGHLIGHTED -->
      <rect x="-250" y="-58" width="500" height="18" fill="#ffab0015"/>
      <text x="-225" y="-45" fill="#ffab00" font-size="12"
            font-family="JetBrains Mono, monospace">  if (node === null)</text>
      <!-- Line 3 — HIGHLIGHTED -->
      <rect x="-250" y="-40" width="500" height="18" fill="#ffab0015"/>
      <text x="-225" y="-27" fill="#ffab00" font-size="12"
            font-family="JetBrains Mono, monospace">    return new Node(val);  ← HERE</text>
      <!-- ... remaining lines in normal color ... -->
    </g>
  </g>

</svg>
```

---

## The CSS Entrance Choreography

The `animation-delay` values create a staggered entrance:

| Entity | Delay | What the user sees |
|---|---|---|
| `bst-1` (BinaryTree) | 0ms | Tree fades up first |
| `title-1` (Label) | 0ms | Title appears simultaneously |
| `step-1` (Callout) | 200ms | Step explanation slides in |
| `code-1` (CodeBlock) | 400ms | Code block appears last |

CSS classes applied to the `innerG`:

```css
.entrance-fadeInUp {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

These run on the **compositor thread** — no JavaScript, no layout recalculation, pure GPU-accelerated CSS transforms.

---

## Frame-to-Frame Transitions

When the player advances from Frame 0 to Frame 1 (via auto-timer or user click):

```
Frame 0                          Frame 1
┌───────────────────┐            ┌───────────────────┐
│  bst-1: 1 node    │            │  bst-1: 2 nodes   │
│  title-1          │            │  title-1           │
│  step-1: "Step 1" │            │  ptr-1: (NEW)      │
│  code-1: hl [2,3] │            │  step-1: "Step 2"  │
│                   │            │  code-1: hl [3,4]  │
└───────────────────┘            └───────────────────┘

Diff:
  PERSIST:  title-1 (same id, same data → no change)
  UPDATE:   bst-1   (same id, new metadata → re-render with 2 nodes)
  UPDATE:   step-1  (same id, new textContent → re-render)
  UPDATE:   code-1  (same id, new highlightLines → re-render)
  ENTER:    ptr-1   (new id → create with entrance animation)
```

The SceneController calls `clear()` and re-renders the full frame. In a future optimization, it could diff entities by ID and only re-render changed ones with GSAP transitions.

---

## Complete Data Shape Summary

```
┌──────────────────────────────────────────────────────────────────┐
│  USER PROMPT                                                      │
│  "Explain BST insertion"                                          │
│  (plain text string)                                              │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  AGENT REASONING                                                  │
│  (internal chain-of-thought — not transmitted)                    │
│  "I need BinaryTree, Label, Callout, CodeBlock across 4 frames"  │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  MCP TOOL CALL: create_session                                    │
│  { title: "Binary Search Tree Insertion" }                        │
│  Response: { session_id, player_url }                             │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  MCP TOOL CALL: add_scene                                         │
│  {                                                                │
│    session_id: "b3f1...",                                         │
│    visual_script: {                                               │
│      sceneId: "bst-insertion",                                    │
│      totalDuration: 16000,                                        │
│      frames: [                                                    │
│        {                                                          │
│          id: "frame-0",                                           │
│          startTime: 0,                                            │
│          endTime: 4000,                                           │
│          entities: [                                              │
│            {                                                      │
│              id: "bst-1",                                         │
│              type: "BinaryTree",        ← TYPE STRING             │
│              position: { x: 50, y: 45 },  ← PERCENTAGE           │
│              size: { width: 50, height: 55 },                     │
│              metadata: {                ← TYPE-SPECIFIC DATA      │
│                nodes: [{ value: "8", id: "n8", highlight: "insert" }],
│                edges: [],                                         │
│                layout: "reingold-tilford",                        │
│                nodeRadius: 24,                                    │
│                levelSpacing: 70,                                  │
│              },                                                   │
│              animation: { type: "fadeIn", duration: 600, delay: 0 }
│            },                                                     │
│            ... (Label, Callout, CodeBlock)                        │
│          ]                                                        │
│        },                                                         │
│        ... (frames 1, 2, 3)                                       │
│      ]                                                            │
│    }                                                              │
│  }                                                                │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  MCP SERVER: VALIDATION + PERSISTENCE                             │
│                                                                   │
│  Zod validates: type ∈ VisualEntityType enum    ✓                 │
│  Zod validates: position.x in 0-100              ✓                │
│  Zod validates: metadata is Record<string,any>   ✓ (passthrough)  │
│                                                                   │
│  SQLite: INSERT INTO visual_scripts VALUES(...)                   │
│  In-memory: sessionStore.get(id).script = ...                     │
│                                                                   │
│  ⚠ Server does NOT interpret metadata.                            │
│    It doesn't know what "nodes" or "edges" mean.                  │
│    That's the renderer's job.                                     │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  SSE PUSH                                                         │
│                                                                   │
│  event: script_update                                             │
│  data: { "script": { ...full VisualScript JSON... } }             │
│                                                                   │
│  Wire format: UTF-8 text over HTTP chunked transfer               │
│  Auto-reconnect: built into EventSource API                       │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  SCENE CONTROLLER                                                 │
│                                                                   │
│  loadScript(script)                                               │
│    → clear()                                                      │
│    → renderFrame(frames[0])                                       │
│        → Pass 1: non-connectors                                   │
│            entity "bst-1":  registry["BinaryTree"]                │
│            entity "title-1": registry["Label"]                    │
│            entity "step-1": registry["Callout"]                   │
│            entity "code-1": registry["CodeBlock"]                 │
│        → Pass 2: connectors (Arrow/DataFlow)                      │
│            (none in this frame)                                   │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  RENDER FUNCTION (e.g., renderBinaryTree)                         │
│                                                                   │
│  Input:  entity.metadata.nodes + entity.metadata.edges            │
│  Step 1: buildEntityGroup(entity) → { outerG, innerG }           │
│          outerG.transform = "translate(960, 486)"                 │
│  Step 2: computeTreeLayout(nodes, edges) → {n8:{x,y}, n3:{x,y}} │
│  Step 3: for each edge → createElementNS('line') → innerG        │
│  Step 4: for each node → createElementNS('circle') → innerG      │
│          → createElementNS('text') → innerG (value label)         │
│          → apply highlight color based on node.highlight          │
│  Step 5: applyEntranceAnimation(innerG, entity)                   │
│  Step 6: parentEl.appendChild(outerG)                             │
│                                                                   │
│  Output: SVGGElement added to DOM                                 │
└──────────────┬───────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│  SVG CANVAS (what the user sees)                                  │
│                                                                   │
│  <svg viewBox="0 0 1920 1080">                                    │
│    <defs>...</defs>                                               │
│    <g id="bst-1" transform="translate(960,486)">                  │
│      <g class="entrance-fadeInUp">                                │
│        <circle cx="0" cy="0" r="24" ... />    ← Node "8"         │
│        <text x="0" y="5">8</text>                                 │
│      </g>                                                         │
│    </g>                                                           │
│    <g id="title-1" transform="translate(960,54)">                 │
│      <g class="entrance-fadeIn">                                  │
│        <text>Binary Search Tree — Insertion</text>                │
│      </g>                                                         │
│    </g>                                                           │
│    <g id="step-1" transform="translate(1632,324)">                │
│      <g class="entrance-fadeInUp" style="animation-delay:200ms">  │
│        <rect ... />  <text>Step 1</text>  <text>...</text>        │
│      </g>                                                         │
│    </g>                                                           │
│    <g id="code-1" transform="translate(288,810)">                 │
│      <g class="entrance-fadeInUp" style="animation-delay:400ms">  │
│        <rect fill="#1e1e2e" ... />                                 │
│        <text>function insert(node, val) {</text>                  │
│        <rect fill="#ffab0015" ... />  ← highlight band            │
│        <text fill="#ffab00">  if (node === null)</text>            │
│        ...                                                        │
│      </g>                                                         │
│    </g>                                                           │
│  </svg>                                                           │
│                                                                   │
│  CSS entrance animations fire on the compositor thread.           │
│  User sees: tree fades up → title appears → step slides in →     │
│  code block appears last. Total choreography: ~1 second.          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Key Design Properties of This Flow

### 1. The agent never writes SVG
The agent emits semantic JSON: `{ type: "BinaryTree", metadata: { nodes: [...] } }`. It has no idea how a tree is drawn. It only declares the data structure. The renderer handles all visual craft — layout algorithms, colors, spacing, animation.

### 2. `metadata` is the power channel
The base `VisualEntity` fields (position, size, color, animation) are shared across all types. The `metadata` field is where each type gets its superpowers. `BinaryTree.metadata.nodes` means something completely different from `CodeBlock.metadata.highlightLines`. The MCP server passes it through; only the renderer interprets it.

### 3. The renderer owns the layout intelligence
A `BinaryTree` renderer runs Reingold-Tilford layout. The agent doesn't compute x,y coordinates for tree nodes. It just says "here are the nodes and edges" and the renderer figures out where to place them. This is what makes PRE different from "draw some circles with arrows."

### 4. Frame-based animation model
The agent controls time via frames. Each frame is a complete scene state. The player renders one frame at a time. Transitions between frames happen via clear-and-redraw (V1) or entity-diffing with GSAP tweens (V2).

### 5. SSE is the real-time bridge
The agent can call `add_scene` or `update_scene` at any time. The player receives the update instantly via SSE. This means the agent can build a presentation incrementally — frame by frame, or all at once.
