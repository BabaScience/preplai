/**
 * @preplai/mcp-server — Shared MCP Tool Registration
 *
 * Registers all MCP tools on an McpServer instance. Used by both:
 * - stdio-bridge (StdioServerTransport for Claude Desktop)
 * - server (Streamable HTTP via fastify-mcp-server)
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { SessionStore } from './session-store.js';
import type { SseRegistry } from './sse.js';
import {
  handleCreateSession,
  handleGetPreferences,
  handleAddScene,
  handleUpdateScene,
  handleAddNarration,
  handleGetSessionUrl,
  handleListSessions,
  handleDeleteSession,
  handleRemoveScene,
} from './tools.js';
import { withErrorBoundary, mcpForbidden, mcpUnauthorized } from './errors.js';

/** Verify the API key owns the session. Returns { ok, notFound } for MCP tool handlers. */
function verifySessionOwnership(
  store: SessionStore,
  sessionId: string,
  apiKeyId: string,
): { ok: boolean; notFound?: boolean } {
  const session = store.getSession(sessionId);
  if (!session) return { ok: false, notFound: true };
  if (session.api_key_id !== apiKeyId) return { ok: false };
  return { ok: true };
}

// ── Zod schemas for tool parameters ──────────────────────────────────

export const VisualEntitySchema = z.object({
  id: z.string(),
  type: z.string().describe('Entity type. See add_scene description for topic→type mapping. Dedicated: Server, Service, API, APIGateway, Database, User, Cloud, BinaryTree, BTree, LinkedList, HashTable, CallStack, Stack, AST, ProcessState, GanttChart, BarChart, BigO, MemoryLayout, ConfusionMatrix, CodeBlock, Concept, Label, Graph2D, CoordinateSystem, Circuit, Cycle, DNSResolver. Connections: Arrow, DataFlow.'),
  position: z.object({
    x: z.number().describe('X position as percentage 0-100 of the 1920px canvas'),
    y: z.number().describe('Y position as percentage 0-100 of the 1080px canvas'),
  }),
  size: z.number().optional().default(1).describe('Scale factor, default 1'),
  label: z.string().optional().describe('Text label displayed on the entity'),
  color: z.string().optional().describe('CSS color, e.g. "#4FC3F7" or "cyan"'),
  highlight: z.boolean().optional().describe('Whether to highlight/glow this entity'),
  animation: z.object({
    delay: z.number().optional().default(0).describe('Delay in ms before animation starts'),
    duration: z.number().optional().default(600).describe('Animation duration in ms'),
    easing: z.string().optional().default('power2.out'),
    entrance: z.string().optional().default('fadeInUp').describe('Entrance animation: fadeInUp, fadeIn, drawIn, scaleIn'),
  }).optional(),
  sourceEntityId: z.string().optional().describe('For Arrow/DataFlow: ID of the source entity'),
  targetEntityId: z.string().optional().describe('For Arrow/DataFlow: ID of the target entity'),
  textContent: z.string().optional().describe('For CodeBlock: the code text. For Label/Definition: longer text content'),
  codeLanguage: z.string().optional().describe('For CodeBlock: language (javascript, python, etc.)'),
  metadata: z.record(z.unknown()).optional().describe('Extra data for specific entity types'),
});

const EntityTransitionSchema = z.object({
  entityId: z.string().describe('ID of entity to animate'),
  from: z.record(z.unknown()).describe('Starting state (partial entity props)'),
  to: z.record(z.unknown()).describe('Ending state (partial entity props)'),
  duration: z.number().describe('Transition duration in ms'),
  easing: z.string().optional().default('power2.inOut'),
});

const IllustrationFrameSchema = z.object({
  id: z.string().describe('Unique frame ID, e.g. "frame-1", "title-slide"'),
  startTime: z.number().describe('Frame start time in ms from beginning'),
  endTime: z.number().describe('Frame end time in ms'),
  entities: z.array(VisualEntitySchema).describe('Array of visual entities in this frame'),
  transitions: z.array(EntityTransitionSchema).optional().describe('Animations between entity states'),
  narrationSegment: z.string().describe('Subtitle shown to user. 1–2 sentences, conversational. Match the user\'s level (technical vs beginner).'),
  description: z.string().optional().describe('Internal note for this frame (not shown to user).'),
});

const VisualScriptSchema = z.object({
  sceneId: z.string().describe('Unique scene ID, e.g. "scene-1"'),
  frames: z.array(IllustrationFrameSchema).min(1).describe('Array of frames (at least one)'),
  totalDuration: z.number().describe('Total duration in ms (should be >= last frame endTime)'),
  style: z.enum(['cinema', 'minimal']).optional().describe('Presentation style: "cinema" (default, rich gradients) or "minimal" (flat, algorithm-viz style)'),
});

// ── Rich tool descriptions ────────────────────────────────────────────

export const ADD_SCENE_DESCRIPTION = `Add a visual scene to a presentation session. The scene is rendered as animated SVG on a 1920x1080 dark canvas with vignette background, drop shadows, and rich gradients.

APPEND BEHAVIOR: Calling add_scene multiple times APPENDS new frames to the existing presentation. Frame timings are automatically offset so new frames play after existing ones. Use update_scene instead if you want to REPLACE the entire script.

IMPORTANT: The visual_script must follow the exact schema below. Positions use percentages (0-100). An 80px horizontal and 60px vertical margin/safe zone is applied automatically.

TOKEN OPTIMIZATION (use to reduce output tokens):
- Short keys: f→frames, td→totalDuration, e→entities, n→narrationSegment, p→position, m→metadata, l→label, src→sourceEntityId, tgt→targetEntityId, sz→size, etc. Full list in @preplai/illustrations COMPACT_REFERENCE.md.
- Position shorthand: [50, 50] instead of {x: 50, y: 50}.
- Entity type aliases: BT→BinaryTree, CST→CallStack, CB→CodeBlock, G2→Graph2D, COORD→CoordinateSystem, BC→BarChart, etc.
- Omit entity.color — player uses theme palette. Omit frame id/startTime/endTime/description for defaults. Omit entity id for non-connected entities (auto-assigned).

DESIGN GUIDELINES:
- Labels can be up to ~80 chars. Longer labels auto-wrap to multiple lines. Use narrationSegment for full paragraphs.
- COLORS — Omit entity.color to use theme palette (recommended). Or use preferences.colors from create_session/get_session_url: Server/Service → colors.server, Database/HashTable → colors.database, Cloud → colors.cloud, User → colors.user, Concept → colors.concept, Label → colors.label, CodeBlock → colors.codeblock, others → colors.generic. Do NOT invent custom palettes.
- If no preferences after get_preferences: use a COHESIVE palette, 2-3 colors max. Fallbacks: Cyan (#4FC3F7) + Violet (#b388ff) + Warm (#FFD54F), or Blue (#64B5F6) + Green (#81C784) + White (#FFFFFF).
- Title labels: type "Label", color "#FFFFFF", size 2 or higher. They render with large bold text (42-48px).
- Subtitle labels: type "Label", size ~1.5, renders at 28-32px.
- Space entities evenly. Minimum 15% gap between entity positions.
- Use "highlight": true to emphasize the currently discussed entity.
- Entities are large and visually rich (drop shadows, gradient fills). Size 1 = ~110px, size 2 = ~220px.
- Each entity type has a smart default entrance animation. You can override with the animation.entrance property.

FRAME PACING: 3–5 seconds per frame for readability. Build complexity gradually — simpler frames first, add entities in later frames. Avoid overcrowding (3–7 entities per frame).

ENTITY SELECTION (choose types that match the user's topic for best visuals):

Topic → Preferred type:
- Trees (BST, AVL, heaps) → BinaryTree or BTree (use metadata.tree)
- Call stacks, recursion → CallStack (metadata.frames)
- State machines, process lifecycle → ProcessState (metadata.states, metadata.transitions)
- Scheduler / CPU timelines → GanttChart (metadata.tasks)
- Memory layout (stack/heap) → MemoryLayout (metadata.stack, metadata.heap)
- ML metrics (TP/FP/TN/FN) → ConfusionMatrix (metadata.matrix)
- Key-value storage → HashTable (metadata.pairs) or Dict
- Arrays, lists, indexed data → Array (metadata.values, metadata.disabledIndexes)
- Analogies, "X is like Y" → Analogy (metadata.label, metadata.description)
- Architecture diagrams → Server, Database, Cloud, Arrow, LoadBalancer
- Microservices, backend services → Service (cogwheel with label in hub)
- REST APIs, API endpoints → API (cogwheel with "API" in hub; inherits Service)
- API gateways, routing → APIGateway (cogwheel with label in hub)
- Caching layers (Redis, Memcached, CDN) → Cache (database cylinder with flash icon)
- Categorical comparisons (sales by month, counts by type, rankings) → BarChart (metadata.bars)
- Code snippets, algorithms → CodeBlock (metadata.code or metadata.lines; entity.label = filename)
- Loops, lifecycles, retry logic → Cycle (rotating dashed circle; entity.label only)
- Electronic circuits (Ohm's law, RC) → Circuit (metadata.components, metadata.connections)
- Vectors, coordinate geometry, linear algebra → CoordinateSystem (metadata.points, metadata.vectors)
- Function plots, ROC curves, scatter → Graph2D (metadata.points, metadata.expression)
- Big O, algorithm complexity, DSA → BigO (metadata.curves, metadata.domain)
- DNS, nameservers, domain resolution → DNSResolver (server rack with globe + domain→IP flow)
- Layered model, OSI, tech stack → Stack (metadata.layers)

PREFER dedicated types (rich visuals): Server, Service, API, APIGateway, Database, Cache, User, Cloud, Concept, CodeBlock, BinaryTree, BTree, LinkedList, HashTable, Array, CallStack, Stack, AST, ProcessState, GanttChart, BarChart, BigO, CacheHierarchy, MemoryLayout, ConfusionMatrix, Graph2D, CoordinateSystem, Circuit, Cycle, DNSResolver, Timeline, StepList, Definition, Callout, Analogy.

AVOID generic fallbacks when possible: Entity, Group, Tree, FSM, NeuralNetwork — these render as plain rounded rects.

WHEN IN DOUBT: API/endpoint → API. Microservice → Service. API gateway → APIGateway. Key-value → HashTable. Binary tree → BinaryTree. Multi-way tree → BTree. Code snippet → CodeBlock. Abstract idea → Concept. Loop/lifecycle → Cycle. Vectors/coordinates → CoordinateSystem. Function plot → Graph2D. Flow between components → Arrow or DataFlow.

DEDICATED (prefer these — rich custom renderers):
  Server (rack with LEDs), Service (cogwheel with label in hub; microservices), API (cogwheel with "API" in hub; REST endpoints), APIGateway (cogwheel with label in hub; routing), Database (cylinder), Cache (database cylinder with flash icon), User (avatar), Cloud (cumulus blob), Concept (auto-sized circle; label ≤12 chars inside, else below), Label (text with optional pill), CodeBlock (dark terminal with traffic-light dots + line numbers), DNSResolver (server rack with globe + domain→IP flow), Cycle (rotating dashed circle for loops/lifecycles), Circuit (battery/resistor/capacitor/bulb/switch), CoordinateSystem (2D axes + points + vectors)

SHAPED renderers:
  LoadBalancer (hexagon), Decision (diamond), Metric (circle)

CS-specific with custom renderers:
  AST (parse tree), CallStack (stack frames), Stack (layered blocks — OSI, tech stack; metadata.layers), BTree (multi-child tree), ProcessState (state diagram), GanttChart (task bars), BarChart (axes + bars with value labels), BigO (complexity curves O(1)/O(n)/O(n²)/etc.), CacheHierarchy (L1/L2/L3 stack), MemoryLayout (stack/heap), ConfusionMatrix (TP/FP/TN/FN grid), CoordinateSystem (2D plane for vectors — use Graph2D for function plots)

METADATA (required for correct rendering):
- Arrow/DataFlow: metadata.curved = true (optional) — when true, render curved; default is straight
- CallStack: metadata.frames = [{name, locals?}]
- Stack: metadata.layers = [{label, sublabel?, color?}, ...]. Use for OSI model, tech stack, layered architecture. Not for call stacks (use CallStack) or cache hierarchy (use CacheHierarchy).
- BinaryTree: metadata.tree = {value, left?, right?} OR metadata.nodes = [level-order values]. metadata.disabledIndexes = [0-based indexes to dim], metadata.selectedIndexes = [0-based indexes to highlight]. Use for BST, heap, binary search.
- BTree: metadata.tree = {value, children?}, metadata.branchingFactor?. Use for multi-way trees (B-tree, B+ tree). Node labels can be key ranges like "[10,20]".
- GanttChart: metadata.tasks = [{name, start, end}], metadata.maxTime?
- ProcessState: metadata.states, metadata.transitions
- ConfusionMatrix: metadata.matrix (2D array), metadata.rowLabels?, metadata.colLabels?
- HashTable: metadata.pairs = [[key, value], ...]
- Array: metadata.values = [string|number, ...] (agent can display any values), metadata.disabledIndexes = [0-based indexes to dim], metadata.selectedIndexes = [0-based indexes to highlight], or metadata.cells = [{value, enabled?, selected?}]. Max 8 cells.
- Analogy: metadata.label (or entity.label), metadata.width?, metadata.maxLines?. Text wraps by line; overflow gets "...".
- MemoryLayout: metadata.stack = [...], metadata.heap = [...]
- AST/ParseTree: metadata.ast = {type, value?, children?}
- BarChart: metadata.bars = [{label, value, color?}, ...] (required), metadata.xLabel?, metadata.yLabel?, metadata.horizontal? (true = horizontal bars). Use for categorical comparisons. Max 12 bars.
- CodeBlock: metadata.code = string (split on \\n) OR metadata.lines = [string, ...]. entity.label = title bar filename. Use textContent as fallback.
- Circuit: metadata.components = [{type, label?}, ...] (types: battery|voltage|v|cell, resistor|r, capacitor|c, bulb|lamp|light, switch|s). metadata.connections = [{from, to}, ...] (indices into components).
- CoordinateSystem: metadata.xRange, metadata.yRange (default [-5,5]), metadata.gridSpacing?, metadata.showGrid?, metadata.xLabel?, metadata.yLabel?, metadata.points = [{x, y, label?, color?}], metadata.vectors = [{dx, dy, label?, color?}]. Use for vectors/geometry; use Graph2D for function plots.
- BigO: metadata.curves = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2^n)"] (pick subset; default all except O(2^n)). metadata.domain = [min, max] for n (default [0, 10]). Use [0, 8] when including O(2^n). For algorithm complexity, Big O notation, DSA education.
- Cycle, Cloud, Concept, DNSResolver: no metadata. Use entity.label, entity.color, entity.position.

Graph2D: metadata.domain = [xMin, xMax], metadata.range = [yMin, yMax] (or xRange/yRange), metadata.xLabel?, metadata.yLabel?, metadata.showGrid? (default true). Modes: (1) expression = "x * x" for y=f(x); (2) parametric=true with xExpression, yExpression, tRange for x(t),y(t); (3) curveType="roc" with points=[{x:FPR,y:TPR},...]; (4) curveType="loss" with points=[{x:epoch,y:loss},...]; (5) curveType="scatter" or omit with points=[{x,y},...]. Curves are clipped to chart area.

GENERIC (use only if no dedicated type fits — render as rounded rectangles):
  Entity, Group, Tree, FSM, NeuralNetwork, Process, Queue, Service, CPU, Register, MemoryBlock, Packet, ProtocolStack, Semaphore, Mutex, TuringMachine, SortAnimation, GraphTraversal, and more.

Connection types (rendered as arrows with glow and animated flow):
  Arrow, DataFlow (fast animated dashes), BidirectArrow, DottedArrow, Transition, Bus

CURVED vs STRAIGHT: All connection types render STRAIGHT by default. Use metadata.curved = true to render curved.

Entrance animations available: fadeInUp (default for Server/Database), fadeIn (default for Label), scaleIn (default for User), drawIn (default for Concept), floatIn (default for Cloud), slideInLeft (default for CodeBlock), dropIn.

Example visual_script for a simple scene with a title and two entities:
{
  "sceneId": "scene-1",
  "totalDuration": 5000,
  "frames": [
    {
      "id": "frame-1",
      "startTime": 0,
      "endTime": 5000,
      "description": "Shows a server connecting to a database",
      "narrationSegment": "The server sends queries to the database",
      "entities": [
        {
          "id": "title",
          "type": "Label",
          "position": {"x": 50, "y": 6},
          "label": "System Architecture",
          "color": "#FFFFFF",
          "size": 2
        },
        {
          "id": "srv",
          "type": "Server",
          "position": {"x": 30, "y": 45},
          "label": "API Server",
          "color": "#4FC3F7"
        },
        {
          "id": "db",
          "type": "Database",
          "position": {"x": 70, "y": 45},
          "label": "PostgreSQL",
          "color": "#81C784"
        },
        {
          "id": "arrow1",
          "type": "Arrow",
          "position": {"x": 50, "y": 45},
          "sourceEntityId": "srv",
          "targetEntityId": "db",
          "label": "SQL Queries",
          "color": "#FFD54F"
        }
      ]
    }
  ]
}`;

export const UPDATE_SCENE_DESCRIPTION = `Replace the visual script for a session with a new one. Use this to modify an existing scene. Same format as add_scene — include sceneId, frames array, totalDuration. Follow the same entity selection, metadata requirements, and design guidelines.`;

// ── Dependencies for tool handlers ────────────────────────────────────

export interface McpToolDeps {
  store: SessionStore;
  sse: SseRegistry;
  baseUrl: string;
  /** Resolves API key for the current request. For stdio: fixed local key. For HTTP: from extra.authInfo (MCP transport) or AsyncLocalStorage. */
  getApiKey: (extra?: unknown) => { id: string; tier: string } | null;
  /** Optional: auto-open player URL in browser (stdio bridge only) */
  openPlayerInBrowser?: (url: string) => void;
}

// ── Tool registration ────────────────────────────────────────────────

export function registerMcpTools(mcp: McpServer, deps: McpToolDeps): void {
  const { store, sse, baseUrl, getApiKey, openPlayerInBrowser } = deps;
  const sceneDeps = { store, sse };
  const createDeps = { store, baseUrl };

  mcp.tool(
    'create_session',
    `Create a new presentation session. Returns a session_id and a player_url.

REQUIRED: Call get_preferences FIRST before create_session. Use the returned theme and palette to decide how to create the session. Pass style to override theme (e.g. "minimal" for algorithm viz) if desired; otherwise the user's preference is used.

THEMES: "cinema" (rich gradients) or "minimal" (flat, algorithm-viz). PALETTES: "default", "ocean", "sunset", "forest", "mono". The user's dashboard preference is used unless you pass style. The response also includes preferences.colors — use these for entity.color in add_scene. Player URL: open in browser for user to watch.

CALLBACK: When running locally, the player URL is auto-opened. For remote clients, share the player_url.`,
    {
      title: z.string().describe('Clear, descriptive title matching the user\'s topic (e.g. "Binary Search Tree Insertion", "System Architecture Overview")'),
      aspect_ratio: z.string().optional().describe('Aspect ratio, default "16:9". Options: "16:9", "4:3"'),
      style: z.enum(['cinema', 'minimal']).optional().describe('Override theme: "cinema" (rich gradients) or "minimal" (flat). Omit to use the user\'s dashboard preference.'),
    },
    async (args, extra) => {
      const { trackUsage, checkSessionLimit } = await import('./auth.js');
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const limitCheck = await checkSessionLimit(apiKey.id, apiKey.tier);
      if (!limitCheck.allowed) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: { code: 'LIMIT_EXCEEDED', message: limitCheck.reason, suggestion: 'Delete old sessions or upgrade.' } }) }] };
      }

      const result = await withErrorBoundary(
        (a: any) => handleCreateSession({ ...a, _apiKeyId: apiKey.id }, createDeps),
      )(args);

      try {
        const data = JSON.parse(result.content[0].text);
        if (data.success) await trackUsage(apiKey.id, 'create_session', data.data.session_id);
      } catch {}

      if (openPlayerInBrowser) {
        try {
          const data = JSON.parse(result.content[0].text);
          if (data.success && data.data.player_url) {
            openPlayerInBrowser(data.data.player_url);
          }
        } catch {}
      }

      return { content: result.content };
    },
  );

  mcp.tool(
    'get_preferences',
    `REQUIRED FIRST STEP when creating a new presentation. Call this BEFORE create_session. Returns the user's theme, palette, and entity colors. Use the returned data to: (1) decide style for create_session (pass style to override theme if desired), (2) set entity.color in add_scene using colors.server, colors.database, colors.cloud, colors.user, colors.concept, colors.label, colors.codeblock, colors.generic. On failure: UNAUTHORIZED → check API key; INTERNAL_ERROR → retry once, then use default colors.`,
    {},
    async (_args, extra) => {
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const result = await withErrorBoundary(
        () => handleGetPreferences({}, { apiKeyId: apiKey.id }),
      )({});
      return { content: result.content };
    },
  );

  mcp.tool(
    'add_scene',
    ADD_SCENE_DESCRIPTION,
    {
      session_id: z.string().describe('Session ID from create_session'),
      visual_script: VisualScriptSchema.describe('The visual script defining the scene. Must include sceneId, frames array, and totalDuration.'),
    },
    async (args, extra) => {
      const { trackUsage, checkSceneLimit } = await import('./auth.js');
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const ownership = verifySessionOwnership(store, args.session_id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        return mcpForbidden() as { content: Array<{ type: 'text'; text: string }> };
      }
      if (!ownership.ok && ownership.notFound) {
        const result = await withErrorBoundary((a: any) => handleAddScene(a, sceneDeps))(args);
        return { content: result.content };
      }

      const sceneCheck = await checkSceneLimit(apiKey.id, apiKey.tier);
      if (!sceneCheck.allowed) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: { code: 'LIMIT_EXCEEDED', message: sceneCheck.reason, suggestion: 'Upgrade your plan or delete scenes.' } }) }] };
      }

      const result = await withErrorBoundary(
        (a: any) => handleAddScene(a, sceneDeps),
      )(args);

      await trackUsage(apiKey.id, 'add_scene', args.session_id);
      return { content: result.content };
    },
  );

  mcp.tool(
    'update_scene',
    UPDATE_SCENE_DESCRIPTION,
    {
      session_id: z.string().describe('Session ID'),
      visual_script: VisualScriptSchema.describe('The replacement visual script. Same format as add_scene.'),
    },
    async (args, extra) => {
      const { trackUsage, checkSceneLimit } = await import('./auth.js');
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const ownership = verifySessionOwnership(store, args.session_id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        return mcpForbidden() as { content: Array<{ type: 'text'; text: string }> };
      }
      if (!ownership.ok && ownership.notFound) {
        const result = await withErrorBoundary((a: any) => handleUpdateScene(a, sceneDeps))(args);
        return { content: result.content };
      }

      const sceneCheck = await checkSceneLimit(apiKey.id, apiKey.tier);
      if (!sceneCheck.allowed) {
        return { content: [{ type: 'text', text: JSON.stringify({ success: false, error: { code: 'LIMIT_EXCEEDED', message: sceneCheck.reason, suggestion: 'Upgrade your plan or delete scenes.' } }) }] };
      }

      const result = await withErrorBoundary(
        (a: any) => handleUpdateScene(a, sceneDeps),
      )(args);

      await trackUsage(apiKey.id, 'update_scene', args.session_id);
      return { content: result.content };
    },
  );

  mcp.tool(
    'add_narration',
    'Add narration text to a specific frame in a session. The text appears as a subtitle overlay in the player. Keep narration concise (1–2 sentences per frame). Match tone to the user\'s question (technical vs beginner-friendly).',
    {
      session_id: z.string().describe('Session ID'),
      text: z.string().describe('Narration text to display'),
      frame_index: z.number().optional().describe('Frame index (0-based, default 0)'),
    },
    async (args, extra) => {
      const { trackUsage } = await import('./auth.js');
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const ownership = verifySessionOwnership(store, args.session_id, apiKey.id);
      if (!ownership.ok && !ownership.notFound) {
        return mcpForbidden() as { content: Array<{ type: 'text'; text: string }> };
      }
      if (!ownership.ok && ownership.notFound) {
        const result = await withErrorBoundary((a: any) => handleAddNarration(a, sceneDeps))(args);
        return { content: result.content };
      }

      const result = await withErrorBoundary(
        (a: any) => handleAddNarration(a, sceneDeps),
      )(args);

      await trackUsage(apiKey.id, 'add_narration', args.session_id);
      return { content: result.content };
    },
  );

  mcp.tool(
    'get_session_url',
    'Get the player URL for a session. Always returns preferences (theme, palette, colors) — use preferences.colors for entity.color in add_scene. Set include_stats to true for frame count and duration. Open the player_url in a browser to view the presentation.',
    {
      session_id: z.string().describe('Session ID'),
      include_stats: z.boolean().optional().describe('Include frame count, duration, etc.'),
    },
    async (args, extra) => {
      const apiKey = getApiKey(extra);
      if (apiKey) {
        const ownership = verifySessionOwnership(store, args.session_id, apiKey.id);
        if (!ownership.ok && !ownership.notFound) {
          return mcpForbidden() as { content: Array<{ type: 'text'; text: string }> };
        }
      }

      const result = await withErrorBoundary(
        (a: any) => handleGetSessionUrl(a, { store, baseUrl, apiKeyId: apiKey?.id }),
      )(args);
      return { content: result.content };
    },
  );

  mcp.tool(
    'list_sessions',
    'List all presentation sessions. Returns session IDs, titles, player URLs, and frame counts. Most recent first.',
    {
      limit: z.number().optional().describe('Max sessions to return (default 20, max 100)'),
    },
    async (args, extra) => {
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const result = await withErrorBoundary(
        (a: any) => handleListSessions(a, { store, baseUrl, apiKeyId: apiKey.id }),
      )(args);
      return { content: result.content };
    },
  );

  mcp.tool(
    'delete_session',
    'Delete a presentation session and all its data (visual script, narrations). This cannot be undone.',
    {
      session_id: z.string().describe('Session ID to delete'),
    },
    async (args, extra) => {
      const apiKey = getApiKey(extra);
      if (apiKey) {
        const ownership = verifySessionOwnership(store, args.session_id, apiKey.id);
        if (!ownership.ok && !ownership.notFound) {
          return mcpForbidden() as { content: Array<{ type: 'text'; text: string }> };
        }
      }

      const result = await withErrorBoundary(
        (a: any) => handleDeleteSession(a, { store }),
      )(args);
      return { content: result.content };
    },
  );

  mcp.tool(
    'remove_scene',
    'Remove frames from a presentation session. Specify frame_indices to remove specific frames (0-based), last_n to remove the last N frames, or neither to clear all frames.',
    {
      session_id: z.string().describe('Session ID'),
      frame_indices: z.array(z.number()).optional().describe('Specific frame indices to remove (0-based)'),
      last_n: z.number().optional().describe('Remove the last N frames'),
    },
    async (args, extra) => {
      const apiKey = getApiKey(extra);
      if (apiKey) {
        const ownership = verifySessionOwnership(store, args.session_id, apiKey.id);
        if (!ownership.ok && !ownership.notFound) {
          return mcpForbidden() as { content: Array<{ type: 'text'; text: string }> };
        }
      }

      const result = await withErrorBoundary(
        (a: any) => handleRemoveScene(a, sceneDeps),
      )(args);
      return { content: result.content };
    },
  );
}
