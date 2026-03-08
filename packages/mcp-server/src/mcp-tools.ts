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
  handleGetIllustrations,
  handleAddScene,
  handleUpdateScene,
  handleAddNarration,
  handleGetSessionUrl,
  handleListSessions,
  handleDeleteSession,
  handleRemoveScene,
} from './tools.js';
import { withErrorBoundary, mcpForbidden, mcpUnauthorized } from './errors.js';
import { verifySessionOwnership } from './session-utils.js';

// ── Zod schemas for tool parameters ──────────────────────────────────

export const VisualEntitySchema = z.object({
  id: z.string(),
  type: z.string().describe('Entity type. See add_scene description for topic→type mapping. Dedicated: Server, Service (use metadata.kind: API|Service|APIGateway for second level), Database, Cache, User, Cloud, BinaryTree, BTree, LinkedList, HashTable, Array, CallStack, Stack, StepList, ProcessState, GanttChart, BarChart, BigO, MemoryLayout, ConfusionMatrix, CodeBlock, Concept, Label, H1, H2, H3, Graph2D, CoordinateSystem, Circuit, Cycle, DNSResolver, Analogy, Comparison, Proof. Connections: Arrow, DataFlow.'),
  position: z.object({
    x: z.number().describe('X position as percentage 0-100 of the 1920px canvas'),
    y: z.number().describe('Y position as percentage 0-100 of the 1080px canvas'),
  }),
  size: z.number().optional().describe('Internal: omit. Single tuned default used for all entities.'),
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
  narrationSegment: z.string().describe('Subtitle shown to user. 2–4 sentences, informative and detailed. Match GPT/Claude richness — avoid synthetic summaries. Include key context, specifics, and examples.'),
  description: z.string().optional().describe('Internal note for this frame (not shown to user).'),
});

const VisualScriptSchema = z.object({
  sceneId: z.string().describe('Unique scene ID, e.g. "scene-1"'),
  frames: z.array(IllustrationFrameSchema).min(1).describe('Array of frames (at least one)'),
  totalDuration: z.number().describe('Total duration in ms (should be >= last frame endTime)'),
  style: z.enum(['cinema', 'minimal']).optional().describe('Presentation style: "cinema" (default, rich gradients) or "minimal" (flat, algorithm-viz style)'),
});

// ── Rich tool descriptions ────────────────────────────────────────────

export const ADD_SCENE_DESCRIPTION = `Add a visual scene to a presentation session. The scene is rendered as animated SVG on a 1920x1080 dark canvas. Call get_illustrations for the full type list, aliases, and topic hints.

REQUIRED — USE COMPACT FORMAT (reduces tokens significantly):
- Short keys: sid (sceneId), td (totalDuration), f (frames), e (entities), n (narrationSegment), p (position), l (label), m (metadata), src (sourceEntityId), tgt (targetEntityId), a (animation)
- Position: [50,50] NOT {x:50,y:50}
- Omit: color (palette used), frame id/startTime/endTime/description, entity id for non-connected entities
- Aliases: BT, BTR, ARR, CST, CB, G2, COORD, BC, DNS, SVC, GW, SL, PS, GC, CH, ML, CKT, CYC

Example (REQUIRED format — 5–7 entities per frame):
{"sid":"<session_id>","td":5000,"f":[{"e":[{"id":"h1","type":"H1","p":[50,6],"l":"API Architecture"},{"id":"srv","type":"Server","p":[25,45],"l":"API"},{"id":"db","type":"Database","p":[50,45],"l":"DB"},{"id":"cache","type":"Cache","p":[75,45],"l":"Redis"},{"id":"a1","type":"Arrow","p":[37,45],"src":"srv","tgt":"db","l":"Queries"},{"id":"a2","type":"Arrow","p":[62,45],"src":"srv","tgt":"cache","l":"Cache"},{"id":"l1","type":"Label","p":[50,75],"l":"Read-through pattern"}],"n":"The API server queries the database for data. Frequently accessed items are cached in Redis to reduce load."}]

CONTENT DENSITY (critical): Aim for 5–7 entities per frame. Avoid sparse slides with only 1–3 items — each frame should feel complete and informative.

CONTENT QUALITY: Match the richness and detail of GPT/Claude chat explanations — not stripped-down summaries. Avoid generic, templated, or synthetic phrasing. Use specific labels when possible (e.g. "PostgreSQL" not "DB", "SQL queries" not "Queries"). Each narration sentence should be substantive — include context, specifics, or examples.

NARRATION QUALITY: Good — "Binary search works by repeatedly halving the search space. We maintain two pointers, lo and hi; each comparison eliminates half the remaining elements, giving O(log n) time." Bad — "Binary search divides the array. It's efficient."

APPEND BEHAVIOR: Multiple add_scene calls APPEND frames. Use update_scene to REPLACE. Use session_id as sid. Positions 0-100 (percent).

DESIGN GUIDELINES:
- COLORS — Always omit entity.color. Player uses palette automatically.
- Title: type H1 (main heading), H2 (section), or H3 (subsection). Use metadata.label or l.
- Space entities evenly. Minimum 15% gap between entity positions.
- Use "highlight": true to emphasize the currently discussed entity.
- Entities use a single tuned default size for readability. Omit size — do not specify sz.
- Each entity type has a smart default entrance animation. You can override with the animation.entrance property.

FRAME PACING: 3–5 seconds per frame for readability. Build complexity gradually — simpler frames first, add entities in later frames. Aim for 5–7 entities per frame.

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
- Step-by-step tutorials, numbered procedures → StepList (metadata.steps, metadata.currentStep, metadata.checkmarks)
- Algorithm walkthrough (binary search, sorting, etc.) → Array (metadata.pointerLabels for low/mid/high) + StepList (metadata.currentStep) + optional CodeBlock
- Side-by-side comparisons → Comparison (label or textContent)
- Mathematical proofs → Proof (label or textContent)
- Architecture diagrams → Server, Database, Cloud, Arrow, LoadBalancer
- Microservices, backend services → Service (metadata.kind: "Service")
- REST APIs, API endpoints → Service (metadata.kind: "API"; gear rotates)
- API gateways, routing → Service (metadata.kind: "APIGateway")
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

PREFER dedicated types (rich visuals): Server, Service (metadata.kind for API/Service/APIGateway), Database, Cache, User, Cloud, Concept, CodeBlock, BinaryTree, BTree, LinkedList, HashTable, Array, CallStack, Stack, StepList, ProcessState, GanttChart, BarChart, BigO, CacheHierarchy, MemoryLayout, ConfusionMatrix, Graph2D, CoordinateSystem, Circuit, Cycle, DNSResolver, Timeline, Definition, Callout, Analogy, Comparison, Proof, H1, H2, H3.

AVOID generic fallbacks when possible: Entity, Group, Tree, FSM, NeuralNetwork — these render as plain rounded rects.

WHEN IN DOUBT: API/endpoint → Service with metadata.kind: "API". Microservice → Service with metadata.kind: "Service". API gateway → Service with metadata.kind: "APIGateway". Key-value → HashTable. Binary tree → BinaryTree. Multi-way tree → BTree. Code snippet → CodeBlock. Abstract idea → Concept. Loop/lifecycle → Cycle. Vectors/coordinates → CoordinateSystem. Function plot → Graph2D. Flow between components → Arrow or DataFlow. Indexed data → Array. Caching layer → Cache. Step-by-step procedure → StepList. "X is like Y" → Analogy.

DEDICATED (prefer these — rich custom renderers):
  Server (rack with LEDs), Service (cogwheel; metadata.kind: Service|API|APIGateway for hub text; API rotates), Database (cylinder), Cache (database cylinder with flash icon), User (avatar), Cloud (cumulus blob), Concept (auto-sized circle; label ≤12 chars inside, else below), Label (text with optional pill), H1/H2/H3 (section headings; metadata.label or l; H1 largest, H3 smallest), CodeBlock (dark terminal with traffic-light dots + line numbers), DNSResolver (server rack with globe + domain→IP flow), Cycle (rotating dashed circle for loops/lifecycles), Circuit (battery/resistor/capacitor/bulb/switch), CoordinateSystem (2D axes + points + vectors)

SHAPED renderers:
  LoadBalancer (hexagon), Decision (diamond), Metric (circle)

CS-specific with custom renderers:
  CallStack (stack frames), Stack (layered blocks — OSI, tech stack; metadata.layers), BTree (multi-child tree), ProcessState (state diagram), GanttChart (task bars), BarChart (axes + bars with value labels), BigO (complexity curves O(1)/O(n)/O(n²)/etc.), CacheHierarchy (L1/L2/L3 stack), MemoryLayout (stack/heap), ConfusionMatrix (TP/FP/TN/FN grid), CoordinateSystem (2D plane for vectors — use Graph2D for function plots)

METADATA (required for correct rendering):
- Arrow/DataFlow: metadata.curved = true (optional) — when true, render curved; default is straight
- CallStack: metadata.frames = [{name, locals?}]
- Stack: metadata.layers = [{label, sublabel?, color?}, ...]. Use for OSI model, tech stack, layered architecture. Not for call stacks (use CallStack) or cache hierarchy (use CacheHierarchy).
- BinaryTree: metadata.tree = {value, left?, right?} OR metadata.nodes = [level-order values]. metadata.disabledIndexes = [0-based indexes to dim], metadata.selectedIndexes = [0-based indexes to highlight]. Use for BST search, heap, tree structure. For binary search on a sorted array, use Array with pointerLabels instead.
- BTree: metadata.tree = {value, children?}, metadata.branchingFactor?. Use for multi-way trees (B-tree, B+ tree). Node labels can be key ranges like "[10,20]".
- GanttChart: metadata.tasks = [{name, start, end}], metadata.maxTime?
- ProcessState: metadata.states, metadata.transitions
- ConfusionMatrix: metadata.matrix (2D array), metadata.rowLabels?, metadata.colLabels?
- HashTable: metadata.pairs = [[key, value], ...]
- Array: metadata.values, metadata.disabledIndexes, metadata.selectedIndexes, metadata.pointerLabels = [{index, label, color?, value?, showValue?, showIndex?, highlight?}]. Pointers: low→green, mid→gold, high→red; showValue:true or value for "→ value"; highlight:true for active. Max 8 cells.
- Analogy: metadata.label (or entity.label), metadata.width?, metadata.maxLines?. Text wraps by line; overflow gets "...".
- StepList: metadata.steps = [string, ...] (step labels; 1–2 words each, e.g. "Parse", "Validate"), metadata.currentStep = number (0-based, -1 = none), metadata.checkmarks = true (show checkmarks for completed steps). Use entity.textContent as fallback for steps (split on newline).
- MemoryLayout: metadata.stack = [...], metadata.heap = [...]
- BarChart: metadata.bars = [{label, value, color?}, ...] (required), metadata.xLabel?, metadata.yLabel?, metadata.horizontal? (true = horizontal bars). Use for categorical comparisons. Max 12 bars.
- CodeBlock: metadata.code = string (split on \\n) OR metadata.lines = [string, ...]. entity.label = title bar filename. Use textContent as fallback.
- Circuit: metadata.components = [{type, label?}, ...] (types: battery|voltage|v|cell, resistor|r, capacitor|c, bulb|lamp|light, switch|s). metadata.connections = [{from, to}, ...] (indices into components).
- CoordinateSystem: metadata.xRange, metadata.yRange (default [-5,5]), metadata.gridSpacing?, metadata.showGrid?, metadata.xLabel?, metadata.yLabel?, metadata.points = [{x, y, label?, color?}], metadata.vectors = [{dx, dy, label?, color?}]. Use for vectors/geometry; use Graph2D for function plots.
- BigO: metadata.curves = ["O(1)", "O(log n)", "O(n)", "O(n log n)", "O(n²)", "O(2^n)"] (pick subset; default all except O(2^n)). metadata.domain = [min, max] for n (default [0, 10]). Use [0, 8] when including O(2^n). For algorithm complexity, Big O notation, DSA education.
- Cycle, Cloud, Concept, DNSResolver: no metadata. Use entity.label, entity.position.
- H1, H2, H3: metadata.label (or entity.label). Section headings; H1 largest, H3 smallest.

Graph2D: metadata.domain = [xMin, xMax], metadata.range = [yMin, yMax] (or xRange/yRange), metadata.xLabel?, metadata.yLabel?, metadata.showGrid? (default true). Modes: (1) expression = "x * x" for y=f(x); (2) parametric=true with xExpression, yExpression, tRange for x(t),y(t); (3) curveType="roc" with points=[{x:FPR,y:TPR},...]; (4) curveType="loss" with points=[{x:epoch,y:loss},...]; (5) curveType="scatter" or omit with points=[{x,y},...]. Curves are clipped to chart area.

GENERIC (use only if no dedicated type fits — render as rounded rectangles):
  Entity, Group, Tree, FSM, NeuralNetwork, Process, Queue, Service, CPU, Register, MemoryBlock, Packet, ProtocolStack, Semaphore, Mutex, TuringMachine, SortAnimation, GraphTraversal, and more.

Connection types (rendered as arrows with glow and animated flow):
  Arrow, DataFlow (fast animated dashes), BidirectArrow, DottedArrow, Transition, Bus

CURVED vs STRAIGHT: All connection types render STRAIGHT by default. Use metadata.curved = true to render curved.

Entrance animations: fadeInUp, fadeIn, scaleIn, drawIn, floatIn, slideInLeft, dropIn. Omit a (animation) to use defaults.`;

export const UPDATE_SCENE_DESCRIPTION = `Replace the visual script for a session with a new one. Use this to modify an existing scene. Use the same compact format as add_scene (short keys sid, td, f, e, p, n, src, tgt; position [x,y]; aliases BT, CST, CB, etc.; omit color) to reduce tokens. Follow the same entity selection, metadata requirements, and design guidelines.`;

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

PREREQUISITE — MANDATORY: NEVER call this tool until you have asked the user at least one clarifying question. Even vague requests ("make me a simple presentation", "the simplest example possible") require you to ask first — e.g. "What topic would you like this to cover?" or "What do you want to understand better?" Gather topic, purpose, depth, and style before proceeding. Do NOT call immediately when the user says "create a presentation" without context.

REQUIRED: Call get_preferences FIRST before create_session. Use the returned theme and palette to decide how to create the session. Pass style to override theme (e.g. "minimal" for algorithm viz) if desired; otherwise the user's preference is used.

THEMES: "cinema" (rich gradients) or "minimal" (flat, algorithm-viz). PALETTES: "default", "ocean", "sunset", "forest", "mono". The user's dashboard preference is used unless you pass style. Omit entity.color in add_scene — the player uses the palette automatically. Player URL: open in browser for user to watch.

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
    `REQUIRED FIRST STEP when creating a new presentation. Call this BEFORE create_session. Returns the user's theme and palette only (no entity colors — omit entity.color in add_scene; the player uses the palette automatically). Use the returned data to decide style for create_session (pass style to override theme if desired). On failure: UNAUTHORIZED → check API key; INTERNAL_ERROR → retry once.`,
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
    'get_illustrations',
    'Get the full list of available illustration types, aliases, short keys, topic hints, and metadata hints. Call this when starting a new presentation to discover all entity types and which to use for the user\'s topic. Returns entityTypes, aliases (e.g. BT→BinaryTree), shortKeys (e.g. sid→sceneId), topicHints (topic→types), metadataHints (type→metadata keys), positionFormat ([x,y]), and defaultSize.',
    {},
    async (_args, extra) => {
      const { trackUsage } = await import('./auth.js');
      const apiKey = getApiKey(extra);
      if (!apiKey) return mcpUnauthorized() as { content: Array<{ type: 'text'; text: string }> };

      const result = await withErrorBoundary(() => handleGetIllustrations())({});
      try {
        const data = JSON.parse(result.content[0].text);
        if (data.success) await trackUsage(apiKey.id, 'get_illustrations');
      } catch {}

      return { content: result.content };
    },
  );

  mcp.tool(
    'add_scene',
    ADD_SCENE_DESCRIPTION,
    {
      session_id: z.string().describe('Session ID from create_session'),
      visual_script: z.record(z.unknown()).describe('REQUIRED compact format: sid, td, f, e, p, n, l, src, tgt; position [x,y]; omit color. Use session_id as sid.'),
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
      visual_script: z.record(z.unknown()).describe('The replacement visual script. Same compact format as add_scene.'),
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
    'Add narration text to a specific frame in a session. The text appears as a subtitle overlay in the player. 2–4 sentences, informative and detailed. Match tone to the user\'s question (technical vs beginner-friendly).',
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
    'Get the player URL for a session. Returns preferences (theme, palette). Set include_stats to true for frame count and duration. Open the player_url in a browser to view the presentation.',
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
