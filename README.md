# preplai

> Cinema-quality visual presentations as an agent-native API.

preplai is a SaaS presentation engine that AI agents use to create live, animated, voice-synced visual experiences. Not slides. Cinema.

## Monorepo Layout

```
preplai/
├── packages/           ← npm workspaces (TypeScript)
│   ├── shared/         @preplai/shared — types, schemas, utilities
│   ├── illustrations/  @preplai/illustrations — SVG illustration library
│   ├── compiler/       @preplai/compiler — PML scene compiler
│   ├── player/         @preplai/player — cinema viewer/renderer
│   ├── db/             @preplai/db — MongoDB models
│   └── mcp-server/     @preplai/mcp-server — Fastify API + MCP bridge (v1)
├── apps/               ← deployable applications
│   ├── api/            preplai-api — REST API (auth, sessions, usage)
│   └── website/        preplai.com — marketing site + user dashboard
├── architecture/       design docs (01–08 + FLOW)
└── docs/               setup guides, deployment, design system
```

## Quick Reference

| Component | What it does | Deploy independently? |
|-----------|-------------|----------------------|
| `packages/mcp-server` | Fastify HTTP server + Claude Desktop MCP bridge | Yes — `pnpm run start` or `pnpm run start:mcp` |
| `apps/api` | REST API (auth, sessions, usage, OAuth) | Yes — Node.js / Express |
| `apps/website` | preplai.com landing page + access token dashboard | Yes — Vite + React |
| `packages/shared` | Shared types and schemas | Library — consumed by other packages |
| `packages/compiler` | PML → render tree compilation | Library — consumed by mcp-server |
| `packages/illustrations` | SVG illustration matching | Library — consumed by player |
| `packages/player` | Cinema-quality presentation renderer | Library — consumed by mcp-server |

## Getting Started

```bash
# Clone
git clone git@github.com:BabaScience/preplai.git
cd preplai

# Install all dependencies (workspaces)
pnpm install

# Build all packages
pnpm run build

# Run tests
pnpm test

# Start MCP server (HTTP)
cd packages/mcp-server && pnpm start

# Start MCP server (Claude Desktop stdio)
cd packages/mcp-server && pnpm run start:mcp
```

## Local Development Ports

When running services locally, each uses a distinct port:

| Service | Port | Command |
|---------|------|---------|
| API (apps/api) | 5000 | `npm run dev --workspace=preplai-api` |
| Website (apps/website) | 5173 | `npm run dev --workspace=website` |
| MCP Server (packages/mcp-server) | 5005 | `npm run dev --workspace=@preplai/mcp-server` |

The website calls the API at `http://localhost:5000`. Set `VITE_API_URL=http://localhost:5000/api/` in `apps/website/.env` if needed.

## Architecture

See [`architecture/`](./architecture/) for detailed design documents:

1. [System Overview](./architecture/01-system-overview.md)
2. [MCP Server](./architecture/02-mcp-server.md)
3. [PML Scene Compiler](./architecture/03-pml-scene-compiler.md)
4. [Player Renderer](./architecture/04-player-renderer.md)
5. [Illustration System](./architecture/05-illustration-system.md)
6. [Data Model](./architecture/06-data-model.md)
7. [API Specification](./architecture/07-api-spec.md)
8. [Deployment](./architecture/08-deployment.md)
9. [Flow: User Prompt → UI](./architecture/FLOW-user-prompt-to-ui.md)

## Claude Desktop Setup

```json
{
  "mcpServers": {
    "preplai": {
      "command": "npx",
      "args": ["-y", "@preplai/mcp-server"],
      "env": {
        "PREPLAI_API_KEY": "your-access-token",
        "BASE_URL": "https://api.preplai.com"
      }
    }
  }
}
```

See [Claude Desktop Config Guide](./docs/claude-desktop-config.md) for detailed instructions. Create an access token at https://preplai.com/dashboard/keys.

## Access Token Format

- Prefix: `plai_` + 40 random hex characters (for desktop clients)
- Header: `X-Preplai-API-Key` or `Authorization: Bearer <token>`
- Web clients (Claude Web): use OAuth. Desktop clients: create tokens at https://preplai.com/dashboard/keys
- Tiers: Free (5 sessions, 50 scenes/mo) → Pro ($19/mo) → Enterprise (custom)

## Tech Stack

- **Runtime**: Node.js 18+ (ES2022)
- **Server**: Fastify 5
- **Database**: SQLite (better-sqlite3)
- **MCP**: @modelcontextprotocol/sdk
- **Types**: TypeScript 5 (strict mode)
- **Tests**: Vitest
- **Website**: Vite + React

## License

UNLICENSED — Private. All rights reserved.
