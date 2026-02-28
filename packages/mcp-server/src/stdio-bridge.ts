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
import type { SessionStore } from './session-store.js';
import type { SseRegistry } from './sse.js';
import {
  handleCreateSession,
  handleAddScene,
  handleUpdateScene,
  handleAddNarration,
  handleGetSessionUrl,
} from './tools.js';
import { withErrorBoundary } from './errors.js';

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
    'Create a new presentation session. Returns a session_id and player URL.',
    {
      title: z.string().describe('Title of the presentation'),
      aspect_ratio: z.string().optional().describe('Aspect ratio, e.g. "16:9" or "4:3"'),
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
    'Add a visual scene (frame) to a session. The visual_script contains frames with SVG elements, transitions, and timing.',
    {
      session_id: z.string().describe('Session ID from create_session'),
      visual_script: z.any().describe('VisualScript object with frames array'),
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
    'Replace the visual script for a session. Use this to modify an existing scene.',
    {
      session_id: z.string().describe('Session ID'),
      visual_script: z.any().describe('Updated VisualScript object'),
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
    'Add narration text to a specific frame in a session.',
    {
      session_id: z.string().describe('Session ID'),
      text: z.string().describe('Narration text'),
      frame_index: z.number().optional().describe('Frame index (default 0)'),
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
    'Get the player URL for a session. Optionally include session stats.',
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
