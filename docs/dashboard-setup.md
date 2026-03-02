# Dashboard Setup Guide

This guide covers running the preplai dashboard (website + API) for local development and production deployment.

## Overview

The dashboard consists of two apps:

| App | Purpose | Port (dev) |
|-----|---------|------------|
| **apps/website** | React SPA — landing page, login, signup, dashboard (Overview, API Keys, Usage, Settings) | 5173 |
| **apps/api** | Express API — auth, keys, usage, settings routes backed by MongoDB | 5000 |

Both share the same MongoDB database via `@preplai/db`. API keys created in the dashboard work with the MCP server.

## Local Development

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- pnpm (or npm)

### 1. Install and build

```bash
pnpm install
pnpm run build
```

### 2. Environment files

Copy `.env.example` to `.env` in each app:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/website/.env.example apps/website/.env
```

Edit `apps/api/.env`:

- `MONGODB_URI` — MongoDB connection string (required)
- `JWT_SECRET` — Secret for JWT signing (required in production; use a strong value)
- `PORT` — Default 5000
- `ALLOWED_ORIGINS` — Comma-separated origins; default includes `http://localhost:5173`

For local dev, `apps/website` does not need `VITE_API_URL` — Vite proxies `/api` to `http://localhost:5000`.

### 3. Start services

**Terminal 1 — API:**

```bash
pnpm run dev --filter preplai-api
# or: cd apps/api && pnpm run dev
```

**Terminal 2 — Website:**

```bash
pnpm run dev --filter website
# or: cd apps/website && pnpm run dev
```

**Terminal 3 (optional) — MCP server** (for full flow):

```bash
pnpm run dev --filter @preplai/mcp-server
```

### 4. Access

- Dashboard: http://localhost:5173
- API health: http://localhost:5000/health

Sign up at http://localhost:5173/#/signup, then create API keys in the dashboard. Use those keys with the MCP server.

## Production Deployment

### Environment variables

**apps/api:**

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Strong secret for JWT (e.g. `openssl rand -hex 32`) |
| `PORT` | No | Default 5000 |
| `ALLOWED_ORIGINS` | Yes | Comma-separated allowed origins (e.g. `https://preplai.com`) |
| `NODE_ENV` | No | Set to `production` |

**apps/website:**

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Full API base URL (e.g. `https://api.preplai.com/api`) |

### Build and serve

```bash
# Build API (no build step; runs with node)
# Build website
pnpm run build --filter website

# Serve API with Node
cd apps/api && node src/index.js

# Serve website static files with your hosting (Vercel, Netlify, nginx, etc.)
# Point the build output to apps/website/dist
```

### CORS

Ensure `ALLOWED_ORIGINS` in the API includes the exact origin of the deployed website (e.g. `https://preplai.com`).

### Database

- MongoDB must be reachable from the API deployment
- The MCP server and API share the same MongoDB; ensure `MONGODB_URI` points to the same database for keys and usage to sync

### Security checklist

- [ ] `JWT_SECRET` is a strong random value (not the default)
- [ ] `ALLOWED_ORIGINS` does not include `*`
- [ ] `MONGODB_URI` uses TLS and auth in production
- [ ] HTTPS for both API and website
