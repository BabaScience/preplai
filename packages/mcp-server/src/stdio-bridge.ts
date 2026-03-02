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
 *           "BASE_URL": "http://localhost:5005"
 *         }
 *       }
 *     }
 *   }
 *
 * For Streamable HTTP (remote clients, Cursor, etc.), run the main server instead:
 *   node dist/server.js
 *   MCP endpoint: POST/GET /mcp (requires X-Preplai-API-Key header)
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

  // 2. Auth: use provided API key or generate one for local development
  let localApiKeyId: string | null = null;
  let localApiKeyTier = 'free';
  const envKey = process.env.PREPLAI_API_KEY;

  if (envKey) {
    const { validateApiKey } = await import('./auth.js');
    const validated = await validateApiKey(envKey);
    if (validated) {
      localApiKeyId = validated.id;
      localApiKeyTier = validated.tier;
      console.error(`[preplai] Authenticated as ${validated.owner_email} (${validated.tier})`);
    } else {
      console.error('[preplai] WARNING: PREPLAI_API_KEY is invalid. Generating a local dev key.');
    }
  }

  if (!localApiKeyId) {
    const { createApiKey } = await import('./auth.js');
    const newKey = await createApiKey('local@localhost', 'free');
    localApiKeyId = newKey.id;
    console.error(`[preplai] Generated local API key: ${newKey.key}`);
    console.error('[preplai] Set PREPLAI_API_KEY env var to use your own key.');
  }

  const apiKey = { id: localApiKeyId!, tier: localApiKeyTier };

  // 3. Create MCP server with stdio transport
  const mcp = new McpServer({
    name: 'preplai',
    version: '0.1.0',
  });

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
