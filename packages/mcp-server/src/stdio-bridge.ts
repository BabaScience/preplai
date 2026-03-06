/**
 * @preplai/mcp-server — stdio Bridge for Claude Desktop
 *
 * This file creates an MCP server using the stdio transport, which is
 * what Claude Desktop expects when configured as a subprocess. It registers
 * the same tools as the Streamable HTTP server, but communicates over stdin/stdout.
 *
 * Usage:
 *   node dist/stdio-bridge.js
 *
 * Claude Desktop config (claude_desktop_config.json):
 *   {
 *     "mcpServers": {
 *       "preplai": {
 *         "command": "node",
 *         "args": ["/absolute/path/to/packages/mcp-server/dist/stdio-bridge.js"],
 *         "env": {
 *           "PORT": "5005",
 *           "BASE_URL": "http://localhost:5005",
 *           "PREPLAI_API_KEY": "your-access-token"
 *         }
 *       }
 *     }
 *   }
 *
 * Create an access token at https://preplai.com/dashboard/keys
 *
 * For Streamable HTTP (remote clients, Cursor, etc.), run the main server instead:
 *   node dist/server.js
 *   MCP endpoint: POST/GET /mcp (requires Authorization: Bearer <token>)
 *
 * This bridge does TWO things:
 * 1. Boots the Fastify HTTP server (for the player UI + SSE)
 * 2. Exposes the MCP tools via stdio for Claude Desktop
 */
import { exec } from 'node:child_process';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { buildServer, getDefaultConfig } from './server.js';
import { registerMcpTools } from './mcp-tools.js';

// ── Boot ──────────────────────────────────────────────────────────────

async function main() {
  const cfg = getDefaultConfig();

  // 1. Boot the HTTP server (player, SSE, REST)
  const ctx = await buildServer({
    logLevel: 'warn', // quieter — stdio needs clean stdout
  });
  await ctx.app.listen({ port: cfg.port, host: cfg.host });
  // Log to stderr (stdout is reserved for MCP JSON-RPC)
  console.error(`[preplai] HTTP server running at ${cfg.baseUrl}`);
  console.error(`[preplai] Player: ${cfg.baseUrl}/player/:sessionId`);

  // 2. Auth: require access token (create one at https://preplai.com/dashboard/keys)
  const envKey = process.env.PREPLAI_API_KEY;
  if (!envKey) {
    console.error('[preplai] PREPLAI_API_KEY is required. Create an access token at https://preplai.com/dashboard/keys');
    process.exit(1);
  }

  const { validateApiKey } = await import('./auth.js');
  const { validateOAuthToken } = await import('./oauth-token.js');
  const validated = envKey.startsWith('plai_')
    ? await validateApiKey(envKey)
    : await validateOAuthToken(envKey);

  if (!validated) {
    console.error('[preplai] Invalid PREPLAI_API_KEY. Create a new access token at https://preplai.com/dashboard/keys');
    process.exit(1);
  }

  console.error(`[preplai] Authenticated as ${validated.owner_email} (${validated.tier})`);
  const apiKey = { id: validated.id, tier: validated.tier };

  // 3. Create MCP server with stdio transport
  const mcpInstructions = `When creating a new presentation: (1) get_preferences FIRST, (2) create_session, (3) add_scene (repeat), (4) get_session_url. For add_scene you MUST use COMPACT format: short keys (sid, td, f, e, p, n, l, src, tgt), position as [x,y], aliases (BT, ARR, CST, CB, etc.), omit color. Example: {"sid":"<session_id>","td":5000,"f":[{"e":[{"id":"x","type":"Label","p":[50,6],"l":"Title","sz":2}],"n":"Narration"}]}`;
  const mcp = new McpServer(
    { name: 'preplai', version: '0.1.0' },
    { instructions: mcpInstructions },
  );

  registerMcpTools(mcp, {
    store: ctx.store,
    sse: ctx.sse,
    baseUrl: cfg.baseUrl,
    getApiKey: () => apiKey,
    openPlayerInBrowser: (url) => {
      const cmd = process.platform === 'darwin' ? 'open'
        : process.platform === 'win32' ? 'start'
        : 'xdg-open';
      exec(cmd + ' ' + JSON.stringify(url), (err) => {
        if (err) console.error('[preplai] Could not auto-open browser:', err.message);
      });
      console.error('[preplai] Auto-opened player:', url);
    },
  });

  // 4. Connect via stdio
  const transport = new StdioServerTransport();
  await mcp.connect(transport);
  console.error('[preplai] MCP stdio bridge connected — ready for Claude Desktop');
}

main().catch((err) => {
  console.error('[preplai] Fatal error:', err);
  process.exit(1);
});
