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
│   └── mcp-server/     @preplai/mcp-server — Fastify API + MCP bridge (v1)
├── apps/               ← deployable applications
│   └── website/        preplai.com — marketing site + user dashboard
├── architecture/       design docs (01–08 + FLOW)
└── docs/               setup guides, deployment, design system
```

## Quick Reference

| Component | What it does | Deploy independently? |
|-----------|-------------|----------------------|
| `packages/mcp-server` | Fastify HTTP server + Claude Desktop MCP bridge | Yes — `npm run start` or `npm run start:mcp` |
| `apps/website` | preplai.com landing page + API key dashboard | Yes — static files + Python CGI |
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
npm install

# Build all packages
npm run build

# Run tests
npm test

# Start MCP server (HTTP)
cd packages/mcp-server && npm start

# Start MCP server (Claude Desktop stdio)
cd packages/mcp-server && npm run start:mcp
```

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
        "PREPLAI_API_KEY": "plai_your_key_here",
        "BASE_URL": "https://api.preplai.com"
      }
    }
  }
}
```

See [Claude Desktop Setup Guide](./docs/claude-desktop-setup.md) for detailed instructions.

## API Key Format

- Prefix: `plai_` + 40 random hex characters
- Header: `X-Preplai-API-Key`
- Tiers: Free (5 sessions, 50 scenes/mo) → Pro ($19/mo) → Enterprise (custom)

## Tech Stack

- **Runtime**: Node.js 18+ (ES2022)
- **Server**: Fastify 5
- **Database**: SQLite (better-sqlite3)
- **MCP**: @modelcontextprotocol/sdk
- **Types**: TypeScript 5 (strict mode)
- **Tests**: Vitest
- **Website**: Vanilla HTML/CSS/JS + Python CGI

## License

UNLICENSED — Private. All rights reserved.
