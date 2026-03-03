# 08 — Deployment & Infrastructure Architecture

> **Version:** V1
> **Last updated:** 2026-02-28
> **Scope:** Single-VPS deployment for PRE V1 (target: 100 active users)
> **Stack:** DigitalOcean Droplet · Docker Compose · Fastify · MongoDB · Nginx · Let's Encrypt · GitHub Actions
> **Node.js:** >=18 (required by `@modelcontextprotocol/sdk@^1.18.0`)

---

## Table of Contents

1. [Infrastructure Overview](#1-infrastructure-overview)
2. [VPS Specification](#2-vps-specification)
3. [Docker Compose Configuration](#3-docker-compose-configuration)
4. [Dockerfile](#4-dockerfile)
5. [Nginx Configuration](#5-nginx-configuration)
6. [SSL Setup](#6-ssl-setup)
7. [Environment Variables](#7-environment-variables)
8. [MongoDB Configuration](#8-mongodb-configuration)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Monitoring & Alerting](#10-monitoring--alerting)
11. [Backup & Recovery](#11-backup--recovery)
12. [Security Hardening](#12-security-hardening)
13. [Domain & DNS Setup](#13-domain--dns-setup)
14. [Scaling Path](#14-scaling-path)
15. [Cost Analysis](#15-cost-analysis)
16. [Deployment Checklist](#16-deployment-checklist)

---

## 1. Infrastructure Overview

PRE V1 deploys to a **single Virtual Private Server** running Docker Compose. There is no orchestration layer (no Kubernetes, no Swarm), no message queue (no Redis, no RabbitMQ), and no managed database service. Everything runs on one machine.

### Why a single VPS is sufficient for V1

| Metric | V1 Target | Single VPS Capacity |
|--------|-----------|---------------------|
| Registered users | 100 | Thousands |
| Concurrent sessions | ≤ 50 | ≤ 500 (Fastify + MongoDB) |
| Concurrent SSE connections | ≤ 50 | ≤ 500 (Node.js async I/O) |
| Request throughput | < 100 req/s | ~1,000 req/s (Nginx + Node) |
| Database size | < 1 GB | Hundreds of GB (local SSD) |
| Uptime SLA | Best-effort | ~99.9% with Docker restart policies |

Fastify is one of the fastest Node.js frameworks (~80k req/s on a single core in benchmarks). MongoDB supports hundreds of concurrent reads. Server-Sent Events (SSE) uses persistent HTTP connections — each live player session holds one `GET /session/:id/events` connection open. Node.js handles this efficiently with async I/O; 50 concurrent SSE connections is well within Node's event-loop capacity. Nginx handles SSL termination and static asset serving with negligible overhead.

### Service topology

```
Internet
   │
   ▼
[Nginx :443]  ← SSL termination, static assets, rate limiting, SSE proxy
   │
   ▼  (HTTP :3000 internal)
[Fastify App]  ← MCP API (/mcp), SSE events (/session/:id/events),
   │              Player HTML (/player/:id), Health (/api/health)
   ▼
[MongoDB]  ← shared by apps/api and mcp-server (users, api_keys, sessions, etc.)
```

All three "layers" run on one Droplet. Nginx and the Node.js app are Docker Compose services. MongoDB can run as a container in the same compose or as a managed service (e.g. MongoDB Atlas).

### How Fastify serves both API and player

PRE V1 does not need a separate static file server for the player. Fastify serves everything:

```javascript
// packages/mcp-server/src/index.js

import Fastify          from 'fastify';
import fastifyStatic    from '@fastify/static';
import fastifySSE       from '@fastify/sse';
import FastifyMcpServer from 'fastify-mcp-server';
import { McpServer }    from '@modelcontextprotocol/sdk/server/mcp.js';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app       = Fastify({ logger: true });

// ── Static player assets ──────────────────────────────────────────
// Fastify serves player.html, player.js, player.css from /public
app.register(fastifyStatic, {
  root:   join(__dirname, '../../player/src'),
  prefix: '/public/',
});

// ── SSE plugin ────────────────────────────────────────────────────
app.register(fastifySSE);

// ── MCP server ────────────────────────────────────────────────────
const mcp = new McpServer({ name: 'pre-visual-engine', version: '1.0.0' });
registerTools(mcp);

app.register(FastifyMcpServer, {
  server:   mcp.server,
  endpoint: '/mcp',
});

// ── Player route ──────────────────────────────────────────────────
app.get('/player/:id', async (request, reply) => {
  const { id } = request.params;
  // Inject session ID into the HTML shell
  const html = playerHtmlTemplate.replace('{{SESSION_ID}}', id);
  return reply.type('text/html').send(html);
});

// ── SSE events route ──────────────────────────────────────────────
app.get('/session/:id/events', (request, reply) => {
  const { id } = request.params;
  reply.sse({ event: 'connected', data: JSON.stringify({ sessionId: id }) });
  if (!sseSubscribers.has(id)) sseSubscribers.set(id, new Set());
  sseSubscribers.get(id).add(reply);
  request.raw.on('close', () => {
    sseSubscribers.get(id)?.delete(reply);
  });
});

await app.listen({ port: 3000, host: '0.0.0.0' });
```

This means Nginx proxies all routes — MCP API, SSE stream, and player HTML — to a single upstream. The `illustrations` volume (static SVG uploads) is **not needed** in PRE V1 because the illustration system is fully code-driven (programmatic SVG component registry). There are no SVG files served at runtime.

---

## 2. VPS Specification

### Recommended: DigitalOcean General Purpose Droplet

| Property | Value |
|----------|-------|
| Provider | DigitalOcean (or Hetzner CX31 as alternative) |
| Plan | General Purpose · 4 vCPU · 8 GB RAM |
| Storage | 25 GB NVMe SSD |
| Price | ~$48/month ($0.071/hr) |
| Region | NYC3 or AMS3 (closest to primary user base) |
| OS | Ubuntu 24.04 LTS |
| Backups | Enable DigitalOcean automated snapshots (+$9.60/mo) |

### Why 4 vCPU / 8 GB RAM

- Node.js is single-threaded per worker; 4 vCPUs allow headroom for Node, Nginx, OS, and future clustering without resource contention.
- 8 GB RAM prevents swap thrashing from MongoDB working set, Node heap, and Nginx worker processes.
- NVMe SSD gives MongoDB good I/O performance for the expected data volume.
- Holding 50 concurrent SSE connections is negligible from a memory standpoint (~20 KB per HTTP keep-alive in Node.js).

### Alternative: Hetzner CX31

| Property | Value |
|----------|-------|
| Provider | Hetzner Cloud |
| Plan | CX31 · 2 vCPU · 8 GB RAM |
| Price | ~€15.90/month |
| Region | Nuremberg or Helsinki |

Use Hetzner if cost is the priority and the user base is Europe-centric. The tradeoff is 2 fewer vCPUs; acceptable for V1's target load.

---

## 3. Docker Compose Configuration

### File: `docker-compose.yml`

```yaml
# docker-compose.yml
# PRE V1 — single-VPS deployment
# Services: app (Fastify) + nginx (reverse proxy + SSL)
# No separate illustration file storage — all rendering is code-driven

version: "3.9"

services:

  # ──────────────────────────────────────────────
  # MONGODB — shared by apps/api and mcp-server
  # ──────────────────────────────────────────────
  mongo:
    image: mongo:7
    container_name: pre_mongo
    restart: unless-stopped
    networks:
      - pre-network
    volumes:
      - mongo-data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  # ──────────────────────────────────────────────
  # APP SERVICE — Fastify Node.js (MCP + SSE + Player)
  # ──────────────────────────────────────────────
  app:
    image: ghcr.io/${GITHUB_REPOSITORY}/pre-app:${IMAGE_TAG:-latest}
    container_name: pre_app
    restart: unless-stopped
    networks:
      - pre-network
    depends_on:
      mongo:
        condition: service_healthy
    expose:
      - "3000"
    environment:
      NODE_ENV:          production
      PORT:              3000
      MONGODB_URI:       mongodb://mongo:27017/preplai
      API_KEY_SALT:      ${API_KEY_SALT}
      CORS_ORIGIN:       ${CORS_ORIGIN}
      LOG_LEVEL:         ${LOG_LEVEL:-info}
      RATE_LIMIT_MAX:    ${RATE_LIMIT_MAX:-100}
      RATE_LIMIT_WINDOW: ${RATE_LIMIT_WINDOW:-60000}
      APP_BASE_URL:      ${APP_BASE_URL}
      # SSE keep-alive interval in ms (prevents proxy timeouts)
      SSE_KEEPALIVE_MS:  ${SSE_KEEPALIVE_MS:-20000}
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 15s
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
    deploy:
      resources:
        limits:
          cpus: "2.0"
          memory: 4G
        reservations:
          cpus: "0.5"
          memory: 512M

  # ──────────────────────────────────────────────
  # NGINX SERVICE — reverse proxy + SSL + static files
  # ──────────────────────────────────────────────
  nginx:
    image: nginx:1.27-alpine
    container_name: pre_nginx
    restart: unless-stopped
    networks:
      - pre-network
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      # SSL certificates (managed by Certbot on host, bind-mounted)
      - ssl-certs:/etc/letsencrypt:ro
      - ./nginx/certbot/www:/var/www/certbot:ro
    depends_on:
      app:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "-qO-", "http://localhost:80/api/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "50m"
        max-file: "5"
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 256M

# ──────────────────────────────────────────────
# VOLUMES
# ──────────────────────────────────────────────
volumes:
  mongo-data:
    driver: local
  ssl-certs:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /etc/letsencrypt

# ──────────────────────────────────────────────
# NETWORKS
# ──────────────────────────────────────────────
networks:
  pre-network:
    driver: bridge
    name: pre-network
```

### Volume rationale

| Volume | Host path | Purpose |
|--------|-----------|---------|
| `mongo-data` | (Docker managed) | MongoDB data; survives container recreation |
| `ssl-certs` | `/etc/letsencrypt` | Let's Encrypt certs; managed by host Certbot, read-only in Nginx |

Note: The old architecture included an `illustrations` volume for user-uploaded SVG files. **This volume is not present in V1.** The `@preplai/illustrations` package is a programmatic component registry — all illustration rendering is pure JavaScript. No SVG files are written to or read from disk at runtime.

---

## 4. Dockerfile

Multi-stage build: a `build` stage installs all dependencies and compiles TypeScript (if used); a lean `production` stage copies only the compiled output and production node_modules.

**Node.js requirement: >=18.** The `@modelcontextprotocol/sdk@^1.18.0` package requires Node.js 18 or higher. Use Node 20 LTS for the best support window.

```dockerfile
# Dockerfile
# PRE V1 — multi-stage Node.js 20 Alpine build
# Node.js >=18 REQUIRED by @modelcontextprotocol/sdk@^1.18.0

# ──────────────────────────────────────────────
# STAGE 1: build
# Installs all deps, compiles TypeScript
# ──────────────────────────────────────────────
FROM node:20-alpine AS build

# Install build tools if needed for native addons
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files first — layer cache for deps
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies for tsc)
RUN npm ci --frozen-lockfile

# Copy source
COPY . .

# Type-check and compile (if using TypeScript)
RUN npm run type-check
RUN npm run build

# Prune devDependencies for production image
RUN npm prune --production

# ──────────────────────────────────────────────
# STAGE 2: production
# Minimal Alpine image with compiled app only
# ──────────────────────────────────────────────
FROM node:20-alpine AS production

# Security: create non-root user
RUN addgroup -g 1001 -S preapp && \
    adduser  -u 1001 -S preapp -G preapp

# Runtime deps only
RUN apk add --no-cache wget

WORKDIR /app

# Copy compiled output and production node_modules from build stage
COPY --from=build --chown=preapp:preapp /app/dist         ./dist
COPY --from=build --chown=preapp:preapp /app/node_modules ./node_modules
COPY --from=build --chown=preapp:preapp /app/package.json ./package.json


# Switch to non-root user
USER preapp

# Expose internal port (Nginx proxies to this)
EXPOSE 3000

# Health check — Nginx depends_on this passing
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start Fastify
CMD ["node", "dist/server.js"]
```

### Build notes

- `better-sqlite3` requires native compilation at install time; Alpine needs `python3 make g++ sqlite-dev` in the build stage only — they are not carried into the production image.
- The player static files (`player.html`, `player.js`, `player.css`) are compiled into `dist/` during the build stage and served by Fastify's `@fastify/static` plugin at runtime. Nginx does not need a separate static volume for player assets in V1.
- No illustration files are bundled or served — the `@preplai/illustrations` component registry is pure JavaScript imported by the player bundle.

---

## 5. Nginx Configuration

### Critical: SSE requires special Nginx configuration

Server-Sent Events are long-lived HTTP connections. Nginx's default behavior — buffering upstream responses and closing idle connections — will break SSE. The `/session/:id/events` location block requires:

1. `proxy_buffering off` — disable response buffering so `data:` lines are forwarded immediately
2. `proxy_read_timeout 3600s` — allow the connection to remain open for up to 1 hour
3. `proxy_set_header Connection ""` — clear the Connection header (do NOT send "upgrade" for SSE)
4. `chunked_transfer_encoding on` — enable chunked encoding for the event stream
5. `X-Accel-Buffering: no` — in the upstream response to additionally disable Nginx buffering

Without these settings, SSE events will be held in Nginx's buffer and delivered in batches (or never), breaking real-time rendering.

### File: `nginx/nginx.conf`

```nginx
# nginx/nginx.conf
# PRE V1 — reverse proxy, SSL termination, SSE support, rate limiting

user  nginx;
worker_processes  auto;          # matches CPU count
worker_rlimit_nofile  65535;

error_log  /var/log/nginx/error.log  warn;
pid        /var/run/nginx.pid;

events {
    worker_connections  4096;
    multi_accept        on;
    use                 epoll;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # ── Logging ────────────────────────────────
    log_format  main  '$remote_addr - $remote_user [$time_local] '
                      '"$request" $status $body_bytes_sent '
                      '"$http_referer" "$http_user_agent" '
                      'rt=$request_time uct=$upstream_connect_time '
                      'uht=$upstream_header_time urt=$upstream_response_time';

    access_log  /var/log/nginx/access.log  main  buffer=16k  flush=5s;

    # ── Performance ────────────────────────────
    sendfile            on;
    tcp_nopush          on;
    tcp_nodelay         on;
    keepalive_timeout   75s;
    keepalive_requests  1000;
    types_hash_max_size 4096;
    server_tokens       off;     # hide Nginx version

    # ── Gzip ───────────────────────────────────
    gzip              on;
    gzip_vary         on;
    gzip_proxied      any;
    gzip_comp_level   6;
    gzip_min_length   1024;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml
        font/woff2;

    # ── Rate Limiting ──────────────────────────
    # MCP API + player: 10 req/s per IP, burst 20
    limit_req_zone  $binary_remote_addr  zone=api_limit:10m   rate=10r/s;
    # Auth endpoints: 5 req/s per IP (brute-force protection)
    limit_req_zone  $binary_remote_addr  zone=auth_limit:10m  rate=5r/s;
    # SSE connections: separate zone — connections, not req/s
    limit_conn_zone $binary_remote_addr  zone=sse_conn:10m;

    limit_req_status  429;
    limit_conn_zone   $binary_remote_addr  zone=conn_limit:10m;
    limit_conn        conn_limit  100;

    # ── SSL Global Settings ────────────────────
    ssl_session_cache    shared:SSL:20m;
    ssl_session_timeout  1d;
    ssl_session_tickets  off;

    ssl_protocols        TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers
        ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:
        ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:
        ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:
        DHE-RSA-AES128-GCM-SHA256;

    ssl_stapling         on;
    ssl_stapling_verify  on;
    resolver             1.1.1.1 8.8.8.8  valid=300s;
    resolver_timeout     5s;

    # ── Upstream ───────────────────────────────
    upstream pre_app {
        server app:3000;
        keepalive 64;   # reuse connections; higher than V1 target (50 SSE + API)
    }

    # ── HTTP → HTTPS redirect ─────────────────
    server {
        listen       80;
        listen  [::]:80;
        server_name  _;

        # ACME challenge for Certbot renewal
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # ── Main HTTPS server ─────────────────────
    server {
        listen       443 ssl;
        listen  [::]:443 ssl;
        http2        on;
        server_name  pre.yourdomain.com;

        # SSL certificates (Let's Encrypt)
        ssl_certificate      /etc/letsencrypt/live/pre.yourdomain.com/fullchain.pem;
        ssl_certificate_key  /etc/letsencrypt/live/pre.yourdomain.com/privkey.pem;
        ssl_trusted_certificate /etc/letsencrypt/live/pre.yourdomain.com/chain.pem;

        # ── Security Headers ─────────────────
        add_header  Strict-Transport-Security  "max-age=31536000; includeSubDomains" always;
        # SAMEORIGIN (not DENY) — required for embedded player iframe
        add_header  X-Frame-Options            "SAMEORIGIN" always;
        add_header  X-Content-Type-Options     "nosniff" always;
        add_header  Referrer-Policy            "strict-origin-when-cross-origin" always;
        add_header  Permissions-Policy         "camera=(), microphone=(), geolocation=()" always;
        add_header  Content-Security-Policy
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; "  # GSAP CDN
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "font-src 'self'; "
            "frame-ancestors 'self' https:; "       # allow iframe embedding from HTTPS
            "connect-src 'self' https://pre.yourdomain.com; "  # SSE EventSource
            "media-src 'none'"
            always;

        # ── MCP endpoint (/mcp) ───────────────
        # Streamable HTTP transport for MCP protocol 2025-06-18
        location /mcp {
            limit_req  zone=api_limit  burst=20  nodelay;

            proxy_pass          http://pre_app;
            proxy_http_version  1.1;
            proxy_set_header    Host               $host;
            proxy_set_header    X-Real-IP          $remote_addr;
            proxy_set_header    X-Forwarded-For    $proxy_add_x_forwarded_for;
            proxy_set_header    X-Forwarded-Proto  $scheme;
            proxy_set_header    Connection         "";   # no upgrade for MCP
            proxy_read_timeout  60s;
            proxy_send_timeout  60s;
            client_max_body_size 4m;   # VisualScript JSON can be large
        }

        # ── SSE endpoint (/session/:id/events) ─────────────────────
        # CRITICAL: SSE requires special Nginx configuration.
        # proxy_buffering MUST be off. proxy_read_timeout MUST be long.
        location ~ ^/session/[^/]+/events$ {
            # Limit concurrent SSE connections per IP (not req/s)
            limit_conn  sse_conn  10;

            proxy_pass          http://pre_app;
            proxy_http_version  1.1;
            proxy_set_header    Host               $host;
            proxy_set_header    X-Real-IP          $remote_addr;
            proxy_set_header    X-Forwarded-For    $proxy_add_x_forwarded_for;
            proxy_set_header    X-Forwarded-Proto  $scheme;

            # SSE CRITICAL SETTINGS ─────────────────────────────────
            # Do NOT send Connection: upgrade — this is SSE, not WebSocket
            proxy_set_header    Connection         "";
            # Disable buffering — events must flow immediately
            proxy_buffering     off;
            # Keep connection open for live sessions (up to 1 hour)
            proxy_read_timeout  3600s;
            proxy_send_timeout  3600s;
            # Enable chunked transfer (required for SSE stream)
            chunked_transfer_encoding on;
            # ────────────────────────────────────────────────────────

            # Disable gzip for SSE (chunked + gzip conflicts)
            gzip off;

            # Access log for SSE connections (separate for analysis)
            access_log /var/log/nginx/sse_access.log main;
        }

        # ── Player route (/player/*) ──────────
        # Served by Fastify (dynamic HTML injection of session ID)
        location /player/ {
            limit_req  zone=api_limit  burst=30  nodelay;

            proxy_pass          http://pre_app;
            proxy_http_version  1.1;
            proxy_set_header    Host               $host;
            proxy_set_header    X-Real-IP          $remote_addr;
            proxy_set_header    X-Forwarded-For    $proxy_add_x_forwarded_for;
            proxy_set_header    X-Forwarded-Proto  $scheme;
            proxy_set_header    Connection         "";
            proxy_read_timeout  30s;
            proxy_buffering     on;   # player HTML is normal response (not SSE)
        }

        # ── Public static assets (/public/*) ──
        # Fastify serves player.js, player.css via @fastify/static
        location /public/ {
            proxy_pass          http://pre_app;
            proxy_http_version  1.1;
            proxy_set_header    Host               $host;
            proxy_set_header    X-Real-IP          $remote_addr;
            proxy_set_header    Connection         "";

            # Long-lived cache for versioned assets
            proxy_cache_valid   200  1d;
            expires             30d;
            add_header          Cache-Control "public, immutable";
            access_log          off;
        }

        # ── Auth endpoints (stricter rate limit) ─
        location ~ ^/api/v1/auth/ {
            limit_req  zone=auth_limit  burst=10  nodelay;

            proxy_pass          http://pre_app;
            proxy_http_version  1.1;
            proxy_set_header    Host               $host;
            proxy_set_header    X-Real-IP          $remote_addr;
            proxy_set_header    X-Forwarded-For    $proxy_add_x_forwarded_for;
            proxy_set_header    X-Forwarded-Proto  $scheme;
            proxy_set_header    Connection         "";
        }

        # ── General API routes (/api/*) ───────
        location /api/ {
            limit_req  zone=api_limit  burst=20  nodelay;

            proxy_pass          http://pre_app;
            proxy_http_version  1.1;
            proxy_set_header    Host               $host;
            proxy_set_header    X-Real-IP          $remote_addr;
            proxy_set_header    X-Forwarded-For    $proxy_add_x_forwarded_for;
            proxy_set_header    X-Forwarded-Proto  $scheme;
            proxy_set_header    Connection         "";
            proxy_read_timeout  30s;
            proxy_send_timeout  30s;
            client_max_body_size 4m;
        }

        # ── Health check (no rate limit, no auth) ─
        location = /api/health {
            proxy_pass         http://pre_app;
            proxy_http_version 1.1;
            proxy_set_header   Connection "";
            access_log         off;
        }

        # ── Favicon / robots ─────────────────
        location = /favicon.ico {
            proxy_pass          http://pre_app;
            proxy_http_version  1.1;
            expires             30d;
            access_log          off;
        }

        location = /robots.txt {
            proxy_pass          http://pre_app;
            proxy_http_version  1.1;
            access_log          off;
        }

        # ── Error pages ───────────────────────
        error_page  404              /api/health;  # fallback to health (not SPA)
        error_page  500 502 503 504  /api/health;
    }
}
```

### SSE configuration: why each setting matters

```
proxy_buffering off
  Without this, Nginx accumulates SSE events in memory before forwarding.
  Events may be delayed by seconds or held indefinitely. This is the
  single most critical setting for SSE to work correctly.

proxy_read_timeout 3600s
  Default: 60s. SSE connections are idle between events. Without a long
  timeout, Nginx closes the connection during quiet periods, causing the
  browser EventSource to reconnect (triggering a new player load cycle).

proxy_set_header Connection ""
  Clears any "Connection: upgrade" headers from the client. SSE is NOT
  a WebSocket upgrade. Sending an upgrade header causes Fastify to
  reject the connection.

chunked_transfer_encoding on
  SSE uses HTTP chunked encoding to stream data without a known Content-
  Length. This must be enabled for the stream to be forwarded correctly.

gzip off
  Nginx cannot gzip a streaming response and may produce corrupt output
  if gzip is attempted on an SSE stream. Must be disabled per-location.
```

---

## 6. SSL Setup

### Initial certificate issuance (run once on host, before first `docker compose up`)

```bash
# Install Certbot on host (Ubuntu 24.04)
sudo apt update
sudo apt install -y certbot

# Ensure DNS A record already points to this VPS IP (check with dig)
dig @1.1.1.1 pre.yourdomain.com A

# Issue certificate (standalone — port 80 must be free)
sudo certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@yourdomain.com \
  -d pre.yourdomain.com

# Verify
sudo ls /etc/letsencrypt/live/pre.yourdomain.com/
# fullchain.pem  privkey.pem  chain.pem  cert.pem
```

### Auto-renewal via systemd deploy hook

```bash
# Install auto-renewal deploy hook to reload Nginx after cert renewal
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
# Called automatically by Certbot after each successful renewal
docker exec pre_nginx nginx -s reload
echo "$(date): Nginx reloaded after cert renewal" >> /var/log/pre-certbot.log
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# Verify the systemd timer is active (installed automatically on Ubuntu)
sudo systemctl status certbot.timer

# Test renewal (dry run)
sudo certbot renew --dry-run
```

### Manual renewal (if systemd timer is not available)

```bash
# /etc/cron.d/certbot-renew
# Runs twice daily (standard Certbot recommendation)
0 0,12 * * * root certbot renew --quiet --post-hook "docker exec pre_nginx nginx -s reload"
```

---

## 7. Environment Variables

### File: `.env.example`

```bash
# .env.example
# PRE V1 — copy to .env and fill in all required values
# NEVER commit .env to version control

# ── Application ─────────────────────────────────────────────────────────────
# Node.js environment: production | development | test
NODE_ENV=production

# Fastify listen port (internal; Nginx proxies here)
PORT=3000

# Public base URL (used for CORS, API responses, player URL generation)
APP_BASE_URL=https://pre.yourdomain.com

# ── Database ────────────────────────────────────────────────────────────────
# MongoDB connection string (shared by apps/api and mcp-server)
# For Docker Compose: mongodb://mongo:27017/preplai
# For local dev: mongodb://localhost:27017/preplai
MONGODB_URI=mongodb://mongo:27017/preplai

# ── Authentication ──────────────────────────────────────────────────────────
# Salt for HMAC-SHA256 API key hashing — generate with: openssl rand -hex 32
# REQUIRED — no default
API_KEY_SALT=

# ── CORS ────────────────────────────────────────────────────────────────────
# Comma-separated allowed origins for Fastify CORS plugin
# In production: APP_BASE_URL only
# In development: add http://localhost:5173 or similar
CORS_ORIGIN=https://pre.yourdomain.com

# ── Logging ─────────────────────────────────────────────────────────────────
# Pino log level: trace | debug | info | warn | error | fatal
LOG_LEVEL=info

# ── Rate Limiting (Fastify plugin, applied in addition to Nginx) ─────────────
# Max requests per window per IP
RATE_LIMIT_MAX=100

# Window in milliseconds
RATE_LIMIT_WINDOW=60000

# ── SSE ─────────────────────────────────────────────────────────────────────
# Keep-alive interval for SSE connections (ms)
# Sends a comment (: keepalive\n\n) to prevent proxy timeout
# Should be less than Nginx proxy_read_timeout equivalent
SSE_KEEPALIVE_MS=20000

# ── MCP ──────────────────────────────────────────────────────────────────────
# MCP protocol version (informational — handled by fastify-mcp-server)
MCP_PROTOCOL_VERSION=2025-06-18

# ── Session ─────────────────────────────────────────────────────────────────
# Default session TTL in milliseconds (24 hours)
SESSION_TTL_MS=86400000

# ── Backup ──────────────────────────────────────────────────────────────────
# S3-compatible bucket for off-site SQLite backups
BACKUP_S3_BUCKET=pre-backups
BACKUP_S3_REGION=us-east-1
BACKUP_S3_ENDPOINT=https://s3.amazonaws.com  # or Backblaze B2 endpoint
BACKUP_S3_ACCESS_KEY=
BACKUP_S3_SECRET_KEY=

# ── Monitoring ───────────────────────────────────────────────────────────────
# Uptime monitor shared secret (sent in X-Health-Token header)
HEALTH_CHECK_SECRET=

# Sentry DSN (optional — error tracking)
SENTRY_DSN=

# ── GSAP Licensing ───────────────────────────────────────────────────────────
# GSAP 3.13 is free (Webflow acquisition, April 2025). No license key needed.
# The CDN URL is configured in player.html.
# RISK NOTE: Webflow "no competitors" clause — review before production launch
# if PRE's positioning overlaps with visual website building tools.
# GSAP_CDN_URL=https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js
```

---

## 8. MongoDB Configuration

### Connection

Both `apps/api` and `packages/mcp-server` connect to the same MongoDB instance via `MONGODB_URI`. The shared database (`preplai`) contains:

| Collection | Used by | Purpose |
|------------|---------|---------|
| `users` | apps/api | Dashboard users (email, password hash) |
| `api_keys` | apps/api, mcp-server | Unified API keys (dashboard + MCP validation) |
| `usage_logs` | apps/api | Dashboard usage tracking |
| `sessions` | mcp-server | MCP session metadata |
| `visual_scripts` | mcp-server | VisualScript JSON per session |
| `narrations` | mcp-server | Narration entries per session |
| `usage_log` | mcp-server | MCP usage tracking |

### Mongoose connection

```javascript
// packages/db/src/connection.ts
import mongoose from 'mongoose';

export async function connectDb(uri?: string) {
  const mongoUri = uri ?? process.env.MONGODB_URI ?? 'mongodb://localhost:27017/preplai';
  await mongoose.connect(mongoUri);
}

export async function closeDb() {
  await mongoose.disconnect();
}
```

**Schema design note:** The `visual_scripts` collection stores the current `VisualScript` JSON per session. The agent pushes a complete `VisualScript` via `add_scene`, which replaces the previous value. The single document approach keeps the read path simple (one lookup to hydrate a player).

### Backup strategy

#### Online backup (every 6 hours)

Use `mongodump` to create a consistent snapshot. Run against the running MongoDB container:

```bash
#!/bin/bash
# /opt/pre/scripts/backup-mongo.sh
set -euo pipefail

BACKUP_DIR="/opt/pre/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/pre_${TIMESTAMP}"
RETENTION_DAYS=7

mkdir -p "${BACKUP_DIR}"

# Dump from MongoDB container (creates /tmp/backup/preplai/)
docker exec pre_mongo mongodump --db preplai --out /tmp/backup
docker cp pre_mongo:/tmp/backup "${BACKUP_PATH}"
docker exec pre_mongo rm -rf /tmp/backup

echo "Backup OK: ${BACKUP_PATH} ($(du -sh "${BACKUP_PATH}" | cut -f1))"

# Delete backups older than RETENTION_DAYS
find "${BACKUP_DIR}" -name "pre_*" -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} +
echo "Pruned backups older than ${RETENTION_DAYS} days"
```

```bash
# Cron: every 6 hours
echo "0 */6 * * * deploy /opt/pre/scripts/backup-mongo.sh >> /var/log/pre-backup.log 2>&1" \
  | sudo tee /etc/cron.d/pre-mongo-backup
```

#### Off-site upload to S3-compatible storage

```bash
#!/bin/bash
# /opt/pre/scripts/backup-offsite.sh
# Run after backup-mongo.sh or as separate cron

source /opt/pre/.env.backup   # contains AWS_* or B2_* credentials
LATEST=$(ls -td /opt/pre/backups/pre_* 2>/dev/null | head -1)

if [ -n "${LATEST}" ]; then
  aws s3 cp "${LATEST}" "s3://${BACKUP_S3_BUCKET}/mongo/$(basename ${LATEST})/" --recursive \
    --endpoint-url "${BACKUP_S3_ENDPOINT}" \
    --storage-class STANDARD_IA
  echo "Off-site upload OK: s3://${BACKUP_S3_BUCKET}/mongo/$(basename ${LATEST})/"
fi
```

#### Recovery procedure

```bash
# 1. Stop the app container (Nginx stays up)
docker compose stop app

# 2a. Restore from local backup (BACKUP_PATH contains preplai/ subdir)
docker cp /opt/pre/backups/pre_YYYYMMDD_HHMMSS pre_mongo:/tmp/restore
docker exec pre_mongo mongorestore --db preplai --drop /tmp/restore/preplai

# 2b. OR restore from S3
aws s3 cp s3://pre-backups/mongo/pre_YYYYMMDD_HHMMSS/ /tmp/restore/ --recursive --endpoint-url "${BACKUP_S3_ENDPOINT}"
docker cp /tmp/restore pre_mongo:/tmp/restore
docker exec pre_mongo mongorestore --db preplai --drop /tmp/restore/preplai

# 3. Restart the app
docker compose start app

# 4. Tail logs to confirm clean startup
docker compose logs -f app --tail=50
```

---

## 9. CI/CD Pipeline

### File: `.github/workflows/ci.yml`

```yaml
# .github/workflows/ci.yml
# CI: runs on every push and pull request

name: CI

on:
  push:
    branches: ["main", "develop"]
  pull_request:
    branches: ["main"]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint-type-test:
    name: Lint · Type Check · Test
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - uses: actions/checkout@v4

      # Node.js >=18 required by @modelcontextprotocol/sdk@^1.18.0
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci --frozen-lockfile

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm test -- --reporter=verbose
        env:
          NODE_ENV: test
          MONGODB_URI: mongodb://localhost:27017/preplai-test
          API_KEY_SALT: test-salt-not-for-production

      - name: Upload coverage
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/
```

### File: `.github/workflows/deploy.yml`

```yaml
# .github/workflows/deploy.yml
# CD: builds Docker image and deploys on release tag (v*)

name: Deploy

on:
  push:
    tags:
      - "v*"

env:
  REGISTRY:   ghcr.io
  IMAGE_NAME: ${{ github.repository }}/pre-app

jobs:
  # ── Build & push Docker image to GHCR ─────────────────────────
  build-push:
    name: Build & Push Image
    runs-on: ubuntu-latest
    timeout-minutes: 20
    permissions:
      contents: read
      packages: write

    outputs:
      image_tag:    ${{ steps.meta.outputs.version }}
      image_digest: ${{ steps.push.outputs.digest }}

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix=sha-

      - name: Build and push
        id: push
        uses: docker/build-push-action@v5
        with:
          context: .
          push:    true
          tags:    ${{ steps.meta.outputs.tags }}
          labels:  ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to:   type=gha,mode=max
          platforms:  linux/amd64

  # ── Deploy to VPS ───────────────────────────────────────────────
  deploy:
    name: Deploy to VPS
    needs: build-push
    runs-on: ubuntu-latest
    timeout-minutes: 10
    environment:
      name: production
      url: https://pre.yourdomain.com

    steps:
      - uses: actions/checkout@v4

      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1
        with:
          host:     ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key:      ${{ secrets.VPS_SSH_KEY }}
          port:     22
          script: |
            set -euo pipefail
            cd /opt/pre

            echo "==> Pulling new image: ${{ needs.build-push.outputs.image_tag }}"
            export IMAGE_TAG=${{ needs.build-push.outputs.image_tag }}

            # Pull the new image before stopping anything
            docker pull ghcr.io/${{ github.repository }}/pre-app:${IMAGE_TAG}

            # Record current running container ID for rollback
            PREV_APP=$(docker compose ps -q app 2>/dev/null || echo "")

            echo "==> Starting new containers"
            IMAGE_TAG=${IMAGE_TAG} docker compose up -d --no-deps app

            echo "==> Waiting for health check..."
            for i in $(seq 1 12); do
              STATUS=$(docker inspect --format='{{.State.Health.Status}}' pre_app 2>/dev/null || echo "unknown")
              if [ "${STATUS}" = "healthy" ]; then
                echo "App is healthy after ${i} checks."
                break
              fi
              if [ $i -eq 12 ]; then
                echo "ERROR: Health check failed after 60s. Rolling back..."
                if [ -n "${PREV_APP}" ]; then
                  docker start "${PREV_APP}" || true
                fi
                IMAGE_TAG=${IMAGE_TAG} docker compose down app || true
                exit 1
              fi
              sleep 5
            done

            # Reload Nginx to pick up any config changes
            docker exec pre_nginx nginx -t && docker exec pre_nginx nginx -s reload

            echo "==> Deploy complete: ${{ needs.build-push.outputs.image_tag }}"

            # Clean up old images (keep last 72 hours)
            docker image prune -f --filter "until=72h"
```

### Required GitHub Secrets

| Secret | Value |
|--------|-------|
| `VPS_HOST` | VPS public IP or hostname |
| `VPS_USER` | SSH user (e.g. `deploy`) |
| `VPS_SSH_KEY` | Private SSH key (Ed25519 deploy key, no passphrase) |

---

## 10. Monitoring & Alerting

### Health endpoint

The Fastify app exposes `GET /api/health` with no authentication. It checks the MongoDB connection and reports SSE subscriber counts:

```javascript
// packages/mcp-server/src/routes/health.js
export async function healthRoutes(fastify) {
  fastify.get('/api/health', async (request, reply) => {
    // MongoDB connectivity check
    let dbOk = false;
    try {
      dbOk = mongoose.connection.readyState === 1; // connected
    } catch (err) {
      fastify.log.error({ err }, 'Health check: MongoDB error');
    }

    // Count active SSE connections across all sessions
    let totalSseConnections = 0;
    for (const subscribers of sseSubscribers.values()) {
      totalSseConnections += subscribers.size;
    }

    if (!dbOk) {
      return reply.status(503).send({
        status: 'error',
        db:     false,
        sse:    { connections: totalSseConnections },
      });
    }

    return reply.send({
      status:   'ok',
      uptime:   Math.floor(process.uptime()),
      mem_mb:   Math.round(process.memoryUsage().rss / 1024 / 1024),
      version:  process.env.npm_package_version,
      sessions: sessionStore.size,
      sse:      { connections: totalSseConnections },
      timestamp: new Date().toISOString(),
    });
  });
}
```

Configure an uptime monitor (UptimeRobot free tier, or BetterUptime) to poll `https://pre.yourdomain.com/api/health` every 60 seconds and alert on non-200 or response time > 2s.

### SSE connection monitoring

SSE connections are long-lived and should be tracked. The health endpoint reports `sse.connections`; set an alert if this exceeds 200 (unexpected; may indicate connection leak):

```bash
# Check SSE subscriber counts via health endpoint
curl -s https://pre.yourdomain.com/api/health | jq '.sse'
# Expected output: { "connections": 3 }

# Alert if connections exceed threshold
CONNS=$(curl -s https://pre.yourdomain.com/api/health | jq '.sse.connections')
if [ "$CONNS" -gt 200 ]; then
  echo "ALERT: SSE connection count $CONNS exceeds threshold 200"
fi
```

### SSE keep-alive

Long-lived SSE connections through Nginx can be silently closed by intermediate proxies after idle periods. The server sends periodic keep-alive comments to prevent this:

```javascript
// packages/mcp-server/src/session/sse.js

const KEEPALIVE_INTERVAL = parseInt(process.env.SSE_KEEPALIVE_MS ?? '20000');

// Set up keep-alive timer per SSE connection
function setupKeepAlive(reply, sessionId) {
  const timer = setInterval(() => {
    try {
      // Send SSE comment (starts with ':') — ignored by EventSource API
      // but resets proxy idle timeout
      reply.raw.write(': keepalive\n\n');
    } catch (err) {
      // Connection was closed externally — clean up
      clearInterval(timer);
      sseSubscribers.get(sessionId)?.delete(reply);
    }
  }, KEEPALIVE_INTERVAL);

  // Clean up timer when connection closes
  reply.raw.on('close', () => {
    clearInterval(timer);
  });

  return timer;
}
```

### Disk space monitoring

```bash
# /etc/cron.d/pre-disk-monitor
*/15 * * * * deploy /opt/pre/scripts/check-disk.sh >> /var/log/pre-disk.log 2>&1
```

```bash
#!/bin/bash
# /opt/pre/scripts/check-disk.sh
THRESHOLD=85  # percent

USAGE=$(df /opt/pre --output=pcent | tail -1 | tr -d '% ')
if [ "${USAGE}" -gt "${THRESHOLD}" ]; then
  echo "$(date) DISK ALERT: /opt/pre is ${USAGE}% full"
  # Add email/webhook alert here
fi

# Log MongoDB data size (if using local mongo)
DB_SIZE=$(du -sh /var/lib/docker/volumes/pre_mongo-data/_data 2>/dev/null | cut -f1 || echo "n/a")
echo "$(date): mongo=${DB_SIZE}"
```

### Log-based error tracking

Pino writes structured JSON logs to stdout, captured by Docker's json-file driver:

```bash
# Tail all logs in real-time
docker compose logs -f app --tail=100

# Count errors in the last hour
docker compose logs app --since=1h 2>/dev/null | \
  jq -c 'select(.level >= 50)' | wc -l

# View SSE connection events
docker compose logs app --since=1h 2>/dev/null | \
  jq -c 'select(.msg | contains("SSE"))'

# View MCP tool calls
docker compose logs app --since=1h 2>/dev/null | \
  jq -c 'select(.msg | contains("mcp")) | {time: .time, msg: .msg, tool: .tool}'

# View errors with context
docker compose logs app --since=1h 2>/dev/null | \
  jq -c 'select(.level >= 50) | {time: .time, err: .err.message, req: .req.url}'
```

### CPU / memory inspection

```bash
# Live resource usage for Docker containers
docker stats pre_app pre_nginx

# Node.js memory breakdown
docker exec pre_app node -e "
const m = process.memoryUsage();
console.log({
  rss:      Math.round(m.rss / 1024 / 1024) + ' MB',
  heapUsed: Math.round(m.heapUsed / 1024 / 1024) + ' MB',
  heapTotal: Math.round(m.heapTotal / 1024 / 1024) + ' MB',
  external: Math.round(m.external / 1024 / 1024) + ' MB',
});
"
```

---

## 11. Backup & Recovery

### Backup schedule summary

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| MongoDB local backup (mongodump) | Every 6 hours | 7 days | `/opt/pre/backups/` |
| Off-site S3 backup | Every 6 hours | 30 days | S3/B2 bucket |
| DigitalOcean snapshot | Weekly | 4 snapshots | DO managed |

Note: The old architecture included illustration file backups (`aws s3 sync uploads/illustrations`). **This backup is not needed in V1.** There are no user-uploaded illustration files — all rendering is code-driven via the `@preplai/illustrations` component registry.

### Full recovery from zero (worst case)

1. Provision new Droplet with Ubuntu 24.04.
2. Run server setup (see [Deployment Checklist](#16-deployment-checklist)).
3. Restore MongoDB: `aws s3 cp s3://pre-backups/mongo/LATEST/ /tmp/restore/ --recursive` then `mongorestore`
4. Update DNS A record to new IP.
5. Run `docker compose up -d`.
6. Verify health endpoint.

Estimated RTO (Recovery Time Objective): **< 20 minutes** (faster than old architecture — no illustration file restore step).
Estimated RPO (Recovery Point Objective): **< 6 hours**.

---

## 12. Security Hardening

### UFW Firewall

```bash
# Allow only SSH, HTTP, HTTPS — no other inbound ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP (redirect to HTTPS)'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable

# Verify
sudo ufw status verbose
```

### SSH hardening (`/etc/ssh/sshd_config`)

```
PermitRootLogin            no
PasswordAuthentication     no
PubkeyAuthentication       yes
AuthorizedKeysFile         .ssh/authorized_keys
X11Forwarding              no
AllowTcpForwarding         no
MaxAuthTries               3
LoginGraceTime             20
```

```bash
sudo systemctl reload sshd
```

### Deploy user (SSH-only, docker group, no sudo)

```bash
# Create a dedicated deploy user with minimal privileges
sudo useradd -m -s /bin/bash deploy
sudo mkdir -p /home/deploy/.ssh
sudo cp /root/.ssh/authorized_keys /home/deploy/.ssh/
sudo chown -R deploy:deploy /home/deploy/.ssh
sudo chmod 700 /home/deploy/.ssh
sudo chmod 600 /home/deploy/.ssh/authorized_keys

# Grant deploy user ownership of the app directory only
sudo chown -R deploy:deploy /opt/pre

# Allow deploy to run docker compose without sudo
sudo usermod -aG docker deploy
```

### Docker socket not exposed

The Docker socket (`/var/run/docker.sock`) is **not** mounted into any container. The Nginx container has no access to Docker internals. The app container runs as non-root user `preapp` (uid 1001).

### API key hashing

All API keys are stored as SHA-256 hashes in MongoDB. The plaintext key is shown to the user once at creation and never stored:

```javascript
// packages/mcp-server/src/lib/api-key.js
import crypto from 'crypto';

export function hashApiKey(rawKey) {
  return crypto
    .createHmac('sha256', process.env.API_KEY_SALT)
    .update(rawKey)
    .digest('hex');
}

export function generateApiKey() {
  const raw = `pre_${crypto.randomBytes(32).toString('hex')}`;
  return { raw, hashed: hashApiKey(raw) };
}

export function verifyApiKey(rawKey, storedHash) {
  const candidate = hashApiKey(rawKey);
  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(candidate, 'hex'),
    Buffer.from(storedHash, 'hex')
  );
}
```

### MCP session ID validation

The MCP server uses the `Mcp-Session-Id` header for session-scoped state. The session ID must be validated as a UUID v4 before being used as a Map key:

```javascript
// Validate before accessing sessionStore
import { validate as uuidValidate } from 'uuid';

function getSession(sessionId) {
  if (!uuidValidate(sessionId)) {
    throw new Error(`Invalid session ID format: ${sessionId}`);
  }
  const session = sessionStore.get(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  return session;
}
```

### Automatic security updates

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
# Enable: security updates only, auto-reboot at 03:00 if needed
```

### iframe Content Security Policy

The player is loaded inside an `<iframe>`. The Nginx CSP must permit:
- `frame-ancestors 'self' https:` — allows embedding from any HTTPS origin
- `connect-src 'self'` — SSE `EventSource` connects back to the same origin
- `script-src cdnjs.cloudflare.com` — GSAP loaded from CDN

If GSAP is vendored (bundled into the player JS), remove the CDN from `script-src` and use `'self'` only (stricter).

---

## 13. Domain & DNS Setup

### DNS records

| Record | Type | Name | Value | TTL |
|--------|------|------|-------|-----|
| Primary | A | `pre.yourdomain.com` | `<VPS_IP>` | 300 |
| WWW redirect (optional) | CNAME | `www.pre.yourdomain.com` | `pre.yourdomain.com` | 3600 |
| Email (SPF, if sending) | TXT | `yourdomain.com` | `v=spf1 include:resend.com ~all` | 3600 |

### Verify propagation

```bash
# Check from multiple resolvers
dig @1.1.1.1 pre.yourdomain.com A
dig @8.8.8.8 pre.yourdomain.com A

# Online checker
# https://dnschecker.org/#A/pre.yourdomain.com
```

DNS must propagate before running Certbot (ACME challenge requires domain → VPS IP resolution). This typically takes 5–30 minutes with a low TTL (300s).

---

## 14. Scaling Path

### V1 limits and triggers

| Signal | Threshold | Action |
|--------|-----------|--------|
| Concurrent SSE connections | > 200 sustained | Investigate keep-alive / connection leaks |
| Concurrent SSE connections | > 400 sustained | Upgrade to V2 (Redis pub/sub for SSE fan-out) |
| p99 API response time | > 50ms | Profile + optimize, then V2 |
| MongoDB write contention | Frequent slow queries | Add indexes or scale read replicas |
| Memory usage | > 7 GB sustained | Upgrade Droplet or start V2 planning |
| Sessions created/day | > 1,000 | Review session TTL + cleanup cron schedule |

### Quick wins before graduating to V2

1. **Upgrade Droplet** from 4 vCPU / 8 GB to 8 vCPU / 16 GB ($96/mo) — zero-downtime resize.
2. **Enable Node.js cluster mode** to use all 4 vCPUs — small change to `server.js`.
3. **Vendor GSAP** (bundle into `player.js`) to eliminate the CDN dependency for the player — reduces player cold-load latency.

### V2 architecture (post-V1 graduation)

- **Redis pub/sub**: Replace in-memory `sseSubscribers` Map with Redis Pub/Sub channels. This enables horizontal scaling where multiple app instances can push SSE events to the correct player client regardless of which instance holds the SSE connection.
- **Worker pool**: CPU-intensive tasks (if any are added post-V1) offloaded to worker containers via BullMQ.
- **PostgreSQL**: Consider for complex queries if MongoDB becomes a bottleneck.
- **Horizontal scaling**: Multiple app instances behind Nginx upstream or a cloud load balancer.

### SSE and horizontal scaling

The current V1 SSE architecture is intentionally single-process:

```javascript
// V1: in-memory Map — works on a single Node.js process
const sseSubscribers = new Map();  // sessionId → Set<Reply>

function sseEmit(sessionId, event) {
  const subscribers = sseSubscribers.get(sessionId);
  if (!subscribers) return;
  const data = JSON.stringify(event);
  for (const reply of subscribers) {
    reply.raw.write(`data: ${data}\n\n`);
  }
}
```

If multiple app instances run behind a load balancer, an MCP tool call hitting Instance A cannot push SSE events to a player connected to Instance B. The V2 migration path:

```javascript
// V2: Redis pub/sub — works across multiple app instances
import Redis from 'ioredis';
const pub = new Redis(process.env.REDIS_URL);
const sub = new Redis(process.env.REDIS_URL);

// Subscribe to per-session channels on startup
sub.psubscribe('session:*');

sub.on('pmessage', (pattern, channel, message) => {
  const sessionId = channel.replace('session:', '');
  const subscribers = sseSubscribers.get(sessionId);
  if (!subscribers) return;
  for (const reply of subscribers) {
    reply.raw.write(`data: ${message}\n\n`);
  }
});

function sseEmit(sessionId, event) {
  pub.publish(`session:${sessionId}`, JSON.stringify(event));
}
```

This change is isolated to `packages/mcp-server/src/session/sse.js` and requires no changes to the MCP tools, the Nginx config, or the player.

---

## 15. Cost Analysis

### Monthly costs (V1)

| Service | Cost | Notes |
|---------|------|-------|
| DigitalOcean Droplet (4 vCPU / 8 GB) | $48.00/mo | NYC3 region |
| DigitalOcean automated backups | $9.60/mo | 20% of Droplet price — optional |
| Domain name | ~$1.00/mo | ~$12/yr via Namecheap or Cloudflare |
| SSL certificate | $0.00 | Let's Encrypt — free |
| GitHub Actions | $0.00 | Free tier (2,000 min/mo) |
| S3/B2 backup storage | ~$0.30/mo | < 3 GB MongoDB dumps at B2 pricing ($0.006/GB) |
| GSAP 3.13 license | $0.00 | Free since Webflow acquisition (April 2025) |
| Email (Resend free tier) | $0.00 | 100 emails/day free |
| Uptime monitor (UptimeRobot) | $0.00 | Free tier (50 monitors) |
| **Total (minimum)** | **~$50/mo** | No automated backups |
| **Total (recommended)** | **~$60/mo** | With DO backups |

### Cost delta vs. old architecture

The old architecture included an `illustrations` volume for SVG files, potentially requiring additional block storage ($10/mo for 100 GB). The programmatic SVG component registry eliminates this cost entirely. V1's storage footprint is purely the SQLite database (expected < 1 GB for 100 users at 24-hour TTL).

At $50/month for 100 users, the infrastructure cost is **$0.50/user/month**. V1's storage footprint is the MongoDB database (expected < 1 GB for 100 users at 24-hour session TTL).

---

## 16. Deployment Checklist

Step-by-step first deploy from zero. Run as the `deploy` user unless noted with `(root)`.

### Phase 1: Server setup (one-time)

```bash
# ── (root) Initial system setup ───────────────────────────────────
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git sqlite3 awscli ufw fail2ban

# Install Docker (official script — installs Docker Engine + Compose v2)
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # replace $USER with deploy username
newgrp docker                   # apply group change

# Verify Docker and Node.js version inside Docker
docker --version
docker compose version
docker run --rm node:20-alpine node --version   # must be >= 18

# ── (root) Create app directories ─────────────────────────────────
sudo mkdir -p /opt/pre/{backups,scripts}
sudo chown -R deploy:deploy /opt/pre

# ── (root) Harden SSH ─────────────────────────────────────────────
# Edit /etc/ssh/sshd_config (see Section 12)
sudo systemctl reload sshd

# ── (root) Configure UFW ──────────────────────────────────────────
sudo ufw default deny incoming
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# ── (root) Install fail2ban for SSH brute-force protection ────────
sudo systemctl enable --now fail2ban
```

### Phase 2: Clone and configure

```bash
# ── Clone repository ────────────────────────────────────────────────
cd /opt/pre
git clone git@github.com:YOUR_ORG/pre.git app
cd app

# ── Create .env ─────────────────────────────────────────────────────
cp .env.example .env
# Edit .env — fill in API_KEY_SALT, APP_BASE_URL, BACKUP_S3_*
nano .env

# Generate secrets
openssl rand -hex 32   # → API_KEY_SALT

# ── Set file permissions ─────────────────────────────────────────────
chmod 600 .env
```

### Phase 3: SSL certificate (before starting Nginx)

```bash
# ── (root) Install Certbot ──────────────────────────────────────────
sudo apt install -y certbot

# Ensure DNS A record for pre.yourdomain.com already points to this IP
dig @1.1.1.1 pre.yourdomain.com A   # must return this VPS's IP

# Issue certificate (standalone — port 80 must be free)
sudo certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email admin@yourdomain.com \
  -d pre.yourdomain.com

# Verify
sudo ls -la /etc/letsencrypt/live/pre.yourdomain.com/

# Install auto-renewal deploy hook
sudo mkdir -p /etc/letsencrypt/renewal-hooks/deploy
sudo tee /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
docker exec pre_nginx nginx -s reload
echo "$(date): Nginx reloaded after cert renewal" >> /var/log/pre-certbot.log
EOF
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

### Phase 4: Nginx config

```bash
# ── Update nginx.conf domain name ───────────────────────────────────
cd /opt/pre/app
sed -i 's/pre.yourdomain.com/YOUR_ACTUAL_DOMAIN/g' nginx/nginx.conf

# Validate config (dry run — no container needed)
docker run --rm \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:1.27-alpine nginx -t
# Expected: nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Phase 5: Log in to GHCR and pull image

```bash
# Authenticate with GitHub Container Registry
echo $GITHUB_PAT | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Pull the latest release image
export IMAGE_TAG=v1.0.0
docker pull ghcr.io/YOUR_ORG/pre-app/pre-app:${IMAGE_TAG}
```

### Phase 6: Start services

```bash
cd /opt/pre/app

# Start all services
IMAGE_TAG=${IMAGE_TAG} docker compose up -d

# Watch startup logs
docker compose logs -f --tail=50

# Verify health — check SSE connection count is 0 at startup
curl -s https://YOUR_ACTUAL_DOMAIN/api/health | jq .
# Expected: {"status":"ok","uptime":...,"sessions":0,"sse":{"connections":0},...}

# Check container status
docker compose ps
```

### Phase 7: Post-deploy verification

```bash
# ── HTTPS redirect working ──────────────────────────────────────────
curl -I http://YOUR_ACTUAL_DOMAIN/
# Expected: 301 → https://

# ── SSL certificate valid ───────────────────────────────────────────
curl -sv https://YOUR_ACTUAL_DOMAIN/ 2>&1 | grep "SSL certificate"

# ── MCP endpoint reachable ──────────────────────────────────────────
curl -s -X POST https://YOUR_ACTUAL_DOMAIN/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"initialize","id":1,"params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' \
  | jq .result.protocolVersion
# Expected: "2025-06-18"

# ── SSE endpoint works ──────────────────────────────────────────────
# (Replace SESSION_ID with a valid session ID created via MCP)
curl -N -H "Accept: text/event-stream" \
  https://YOUR_ACTUAL_DOMAIN/session/TEST-SESSION-ID/events &
# Expected: event: connected
#           data: {"sessionId":"TEST-SESSION-ID"}

# ── Rate limiting active ─────────────────────────────────────────────
for i in {1..15}; do curl -s -o /dev/null -w "%{http_code}\n" https://YOUR_ACTUAL_DOMAIN/api/health; done
# After burst limit, expect 429

# ── Security headers ─────────────────────────────────────────────────
curl -sI https://YOUR_ACTUAL_DOMAIN/ | grep -i "strict-transport\|x-frame\|x-content"

# ── MongoDB connectivity ─────────────────────────────────────────────
docker exec pre_mongo mongosh --eval "db.adminCommand('ping')"
# Expected: { ok: 1 }

# ── Backup script works ──────────────────────────────────────────────
sudo bash /opt/pre/scripts/backup-mongo.sh
ls -lh /opt/pre/backups/
```

### Phase 8: Configure cron jobs

```bash
# ── (root) Install cron jobs ─────────────────────────────────────────

# MongoDB backup every 6 hours
echo "0 */6 * * * deploy /opt/pre/scripts/backup-mongo.sh >> /var/log/pre-backup.log 2>&1" \
  | sudo tee /etc/cron.d/pre-mongo-backup

# Disk space check every 15 minutes
echo "*/15 * * * * deploy /opt/pre/scripts/check-disk.sh >> /var/log/pre-disk.log 2>&1" \
  | sudo tee /etc/cron.d/pre-disk-monitor

sudo chmod 644 /etc/cron.d/pre-*
```

### Phase 9: Configure uptime monitor

1. Create account at [UptimeRobot](https://uptimerobot.com) (free tier).
2. Add HTTP(S) monitor: `https://pre.yourdomain.com/api/health`
3. Interval: 5 minutes.
4. Alert contacts: email + Slack webhook.
5. Keyword check: `"status":"ok"`.

### Deployment complete ✓

At this point:
- HTTPS is live with auto-renewing Let's Encrypt SSL.
- App and Nginx containers are running with health checks and auto-restart.
- Fastify serves MCP API (`/mcp`), SSE events (`/session/:id/events`), and player HTML (`/player/:id`) from a single process.
- SSE connections are proxied by Nginx with `proxy_buffering off` and 1-hour read timeout.
- MongoDB backups run every 6 hours via mongodump.
- GitHub Actions deploys on every `v*` tag push with health-check gating and rollback.
- Uptime monitoring is active.
- Node.js >=18 is confirmed (required by `@modelcontextprotocol/sdk@^1.18.0`).

---

## Appendix A — SSE Troubleshooting Guide

### Problem: Player shows "Waiting for content..." indefinitely after agent pushes VisualScript

**Cause:** SSE events are being buffered by Nginx and not forwarded.

**Diagnosis:**
```bash
# Check if proxy_buffering is off for the SSE location
grep -A5 'events$' nginx/nginx.conf | grep proxy_buffering
# Expected: proxy_buffering off;

# Test SSE directly (bypassing Nginx, on the VPS)
curl -N http://localhost:3000/session/SESSION_ID/events
# Should receive: data: {...} lines immediately

# Test SSE through Nginx
curl -N https://YOUR_DOMAIN/session/SESSION_ID/events
# If this hangs, Nginx buffering is the issue
```

**Fix:** Ensure the `/session/:id/events` location block in `nginx.conf` includes:
```nginx
proxy_buffering   off;
proxy_read_timeout 3600s;
```

---

### Problem: SSE connection drops every 60 seconds

**Cause:** Nginx default `proxy_read_timeout` is 60s. If no data is sent during a quiet period, Nginx closes the connection.

**Diagnosis:**
```bash
# Check current proxy_read_timeout for the SSE location
grep proxy_read_timeout nginx/nginx.conf
```

**Fix:** Set `proxy_read_timeout 3600s` in the SSE location block AND ensure the app is sending SSE keep-alive comments at `SSE_KEEPALIVE_MS` interval (default 20s, which is well under 60s). Both fixes together are required:
- App keep-alive prevents Nginx from seeing the connection as idle.
- `proxy_read_timeout 3600s` provides a safety net for longer quiet periods.

---

### Problem: MongoDB connection pool exhausted or slow queries

**Cause:** Too many concurrent operations or missing indexes.

**Diagnosis:**
```bash
docker compose logs app --since=1h | grep -i mongo | wc -l
docker exec pre_mongo mongosh --eval "db.currentOp()"
```

**Fix (V1):** Ensure indexes exist on frequently queried fields (e.g. `api_keys.keyHash`, `sessions.apiKeyId`). Check `packages/db` model definitions for index usage.

**Fix (V2):** Add read replicas or scale MongoDB if write/read contention increases.

---

### Problem: Docker health check shows `starting` indefinitely

**Cause:** Node.js startup is slow (native addon compilation, large node_modules scan) or the health endpoint is returning non-200.

**Diagnosis:**
```bash
# Check container events
docker events --filter container=pre_app --filter event=health_status

# Watch health check logs
docker inspect pre_app | jq '.State.Health.Log[-3:]'

# Test health endpoint directly inside container
docker exec pre_app wget -qO- http://localhost:3000/api/health
```

**Fix:** Increase `start_period` in the Dockerfile healthcheck from `15s` to `30s` if Node.js startup is legitimately slow. Check for missing environment variables that might prevent the app from starting.

---

*End of document — PRE V1 Deployment & Infrastructure Architecture*
*Document version: V2.0 · Last updated: 2026-02-28*
*Repository: [https://github.com/BabaScience/presentation-engine](https://github.com/BabaScience/presentation-engine)*
*Previous: [07 — Database Schema](./07-database-schema.md)*