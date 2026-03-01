/**
 * @pre/mcp-server — stdio Bridge for Claude Desktop
 *
 * This file creates an MCP server using the stdio transport, which is
 * what Claude Desktop expects. It registers the same 5 tool handlers
 * that the REST API exposes, but communicates over stdin/stdout.
 *
 * Usage:
 *   node dist/stdio-bridge.js
 *
 * Claude Desktop config (claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "pre": {
 *         "command": "node",
 *         "args": ["/absolute/path/to/packages/mcp-server/dist/stdio-bridge.js"],
 *         "env": {
 *           "PORT": "3001",
 *           "BASE_URL": "http://localhost:3001"
 *         }
 *       }
 *     }
 *   }
 *
 * This bridge does TWO things:
 * 1. Boots the Fastify HTTP server (for the player UI + SSE)
 * 2. Exposes the 5 MCP tools via stdio for Claude Desktop
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { buildServer, getDefaultConfig } from './server.js';
import {
  handleCreateSession,
  handleAddScene,
  handleUpdateScene,
  handleAddNarration,
  handleGetSessionUrl,
} from './tools.js';
import { withErrorBoundary } from './errors.js';

// ── Zod schemas for tool parameters ──────────────────────────────────

const VisualEntitySchema = z.object({
  id: z.string(),
  type: z.string().describe('Entity type. Common types: Server, Database, User, Cloud, Arrow, DataFlow, Concept, Label, CodeBlock, Array, Pointer, BinaryTree, LinkedList, Group, Table, Metric, Badge, Equation, Graph2D, FlowDiagram, Timeline, StepList, Definition, Callout, Annotation'),
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
  narrationSegment: z.string().describe('Narration text for this frame (shown as subtitle overlay)'),
  description: z.string().describe('Brief description of what this frame shows'),
});

const VisualScriptSchema = z.object({
  sceneId: z.string().describe('Unique scene ID, e.g. "scene-1"'),
  frames: z.array(IllustrationFrameSchema).min(1).describe('Array of frames (at least one)'),
  totalDuration: z.number().describe('Total duration in ms (should be >= last frame endTime)'),
});

// ── Rich tool descriptions with examples ─────────────────────────────

const ADD_SCENE_DESCRIPTION = `Add a visual scene to a presentation session. The scene is rendered as animated SVG on a 1920x1080 dark canvas (vignette background).

IMPORTANT: The visual_script must follow the exact schema below. Positions use percentages (0-100).

DESIGN GUIDELINES:
- Keep labels SHORT (under 28 chars). Long labels get truncated. Use narrationSegment for detailed text.
- Use a COHESIVE color palette: pick 2-3 colors max per scene. Recommended combos:
  - Cyan (#4FC3F7) + Violet (#b388ff) + Warm (#FFD54F) — great for CS/tech
  - Blue (#64B5F6) + Green (#81C784) + White (#FFFFFF) — clean and professional
  - Teal (#4DD0E1) + Pink (#F48FB1) + Amber (#FFB74D) — vibrant and modern
- Title labels should use type "Label" with color "#FFFFFF" and size 2.
- Space entities evenly. Minimum 15% gap between entity positions.
- Use "highlight": true to emphasize the currently discussed entity.

Entity types with DEDICATED renderers (look best):
  Server, Database, User, Cloud, Concept, Label, CodeBlock

Entity types with SHAPED renderers:
  Cache (circle), LoadBalancer (hexagon), Decision (diamond), Metric (circle)

All other entity types render as rounded rectangles with a type badge:
  Array, Pointer, BinaryTree, LinkedList, Group, Table, Badge, Equation, Graph2D, FlowDiagram, Timeline, StepList, Definition, Callout, Annotation, Process, Queue, Service, NeuralNetwork, FSM, CPU, Register, MemoryBlock, Packet, ProtocolStack, and more.

Connection types (rendered as bezier curve arrows):
  Arrow, DataFlow (animated dashes), BidirectArrow, DottedArrow

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
          "position": {"x": 50, "y": 8},
          "label": "System Architecture",
          "color": "#FFFFFF",
          "size": 2,
          "animation": {"entrance": "fadeIn", "duration": 800}
        },
        {
          "id": "srv",
          "type": "Server",
          "position": {"x": 30, "y": 45},
          "label": "API Server",
          "color": "#4FC3F7",
          "animation": {"entrance": "fadeInUp", "delay": 200}
        },
        {
          "id": "db",
          "type": "Database",
          "position": {"x": 70, "y": 45},
          "label": "PostgreSQL",
          "color": "#81C784",
          "animation": {"entrance": "fadeInUp", "delay": 400}
        },
        {
          "id": "arrow1",
          "type": "Arrow",
          "position": {"x": 50, "y": 45},
          "sourceEntityId": "srv",
          "targetEntityId": "db",
          "label": "SQL Queries",
          "color": "#FFD54F",
          "animation": {"entrance": "drawIn", "delay": 800}
        }
      ]
    }
  ]
}`;

const UPDATE_SCENE_DESCRIPTION = `Replace the visual script for a session with a new one. Use this to modify an existing scene. The visual_script format is the same as add_scene — it must include sceneId, frames array, and totalDuration.`;

// ── Boot ──────────────────────────────────────────────────────────────

async function main() {
  const cfg = getDefaultConfig();

  // 1. Boot the HTTP server (player, SSE, REST)
  const ctx = await buildServer({
    logLevel: 'warn', // quieter — stdio needs clean stdout
  });
  await ctx.app.listen({ port: cfg.port, host: cfg.host });
  // Log to stderr (stdout is reserved for MCP JSON-RPC)
  console.error(`[PRE] HTTP server running at ${cfg.baseUrl}`);
  console.error(`[PRE] Player: ${cfg.baseUrl}/player/:sessionId`);

  // 2. Create MCP server with stdio transport
  const mcp = new McpServer({
    name: 'Presentation Rendering Engine',
    version: '0.1.0',
  });

  const store = ctx.store;
  const sse = ctx.sse;
  const baseUrl = cfg.baseUrl;

  // ── Tool: create_session ──────────────────────────────────────────
  mcp.tool(
    'create_session',
    'Create a new presentation session. Returns a session_id and a player_url you can open in a browser to see the live presentation.',
    {
      title: z.string().describe('Title of the presentation'),
      aspect_ratio: z.string().optional().describe('Aspect ratio, default "16:9". Options: "16:9", "4:3"'),
    },
    async (args) => {
      const result = await withErrorBoundary(
        (a: any) => handleCreateSession(a, { store, baseUrl }),
      )(args);
      return { content: result.content };
    },
  );

  // ── Tool: add_scene ───────────────────────────────────────────────
  mcp.tool(
    'add_scene',
    ADD_SCENE_DESCRIPTION,
    {
      session_id: z.string().describe('Session ID from create_session'),
      visual_script: VisualScriptSchema.describe('The visual script defining the scene. Must include sceneId, frames array, and totalDuration.'),
    },
    async (args) => {
      const result = await withErrorBoundary(
        (a: any) => handleAddScene(a, { store, sse }),
      )(args);
      return { content: result.content };
    },
  );

  // ── Tool: update_scene ────────────────────────────────────────────
  mcp.tool(
    'update_scene',
    UPDATE_SCENE_DESCRIPTION,
    {
      session_id: z.string().describe('Session ID'),
      visual_script: VisualScriptSchema.describe('The replacement visual script. Same format as add_scene.'),
    },
    async (args) => {
      const result = await withErrorBoundary(
        (a: any) => handleUpdateScene(a, { store, sse }),
      )(args);
      return { content: result.content };
    },
  );

  // ── Tool: add_narration ───────────────────────────────────────────
  mcp.tool(
    'add_narration',
    'Add narration text to a specific frame in a session. The text appears as a subtitle overlay in the player.',
    {
      session_id: z.string().describe('Session ID'),
      text: z.string().describe('Narration text to display'),
      frame_index: z.number().optional().describe('Frame index (0-based, default 0)'),
    },
    async (args) => {
      const result = await withErrorBoundary(
        (a: any) => handleAddNarration(a, { store, sse }),
      )(args);
      return { content: result.content };
    },
  );

  // ── Tool: get_session_url ─────────────────────────────────────────
  mcp.tool(
    'get_session_url',
    'Get the player URL for a session. Open this URL in a browser to view the presentation. Set include_stats to true to also get frame count and duration.',
    {
      session_id: z.string().describe('Session ID'),
      include_stats: z.boolean().optional().describe('Include frame count, duration, etc.'),
    },
    async (args) => {
      const result = await withErrorBoundary(
        (a: any) => handleGetSessionUrl(a, { store, baseUrl }),
      )(args);
      return { content: result.content };
    },
  );

  // 3. Connect via stdio
  const transport = new StdioServerTransport();
  await mcp.connect(transport);
  console.error('[PRE] MCP stdio bridge connected — ready for Claude Desktop');
}

main().catch((err) => {
  console.error('[PRE] Fatal error:', err);
  process.exit(1);
});
