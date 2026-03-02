# Deploying preplai to DigitalOcean (preplai.com)

This guide covers deploying the full preplai stack to DigitalOcean with the domain **preplai.com**.

## Architecture Overview

| Service | Port | Purpose |
|---------|------|---------|
| **Website** | — | React dashboard (static build) |
| **API** | 5000 | Auth, keys, usage, settings, sessions |
| **MCP Server** | 5005 | Presentations, player, SSE streams |

All services share **MongoDB**. The recommended subdomain structure:

| Subdomain | Service | URL |
|-----------|---------|-----|
| `preplai.com` / `www.preplai.com` | Website | https://preplai.com |
| `api.preplai.com` | API | https://api.preplai.com |
| `player.preplai.com` | MCP Server | https://player.preplai.com |

---

## Option 1: DigitalOcean App Platform (Recommended for simplicity)

App Platform is the easiest path: managed infrastructure, automatic SSL, and GitHub-based deploys.

### Prerequisites

- DigitalOcean account
- GitHub repo connected to DigitalOcean
- Domain `preplai.com` (add it in DigitalOcean Networking → Domains)

### Step 1: Create a Database

1. In DigitalOcean, go to **Databases** → **Create Database**
2. Choose **MongoDB** (version 7+)
3. Select a plan (Basic $15/mo is fine for V1)
4. Choose a region (e.g. NYC3)
5. Create the database
6. Copy the **Connection String** (you’ll need it for all three apps)

### Step 2: Create the App (monorepo)

1. Go to **Apps** → **Create App** → **GitHub**
2. Select your preplai repo
3. Choose **Monorepo** and configure three components:

#### Component 1: Website (Static Site)

| Field | Value |
|-------|-------|
| **Name** | website |
| **Source Directory** | `apps/website` |
| **Type** | Static Site |
| **Build Command** | `cd ../.. && pnpm install && pnpm run build --filter=website` |
| **Output Directory** | `dist` (Vite outputs to `apps/website/dist` — set to `dist` if build runs from `apps/website`) |

**Environment variables (build-time):**

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://api.preplai.com/api` |

**Domains:** `preplai.com`, `www.preplai.com`

> **Note:** If the build command fails due to workspace resolution, use:
> `cd ../.. && pnpm install && cd apps/website && pnpm run build`
> and set Output Directory to `dist` (relative to `apps/website`).

#### Component 2: API (Web Service)

| Field | Value |
|-------|-------|
| **Name** | api |
| **Source Directory** | `/` (root) |
| **Type** | Web Service |
| **Build Command** | `pnpm install && pnpm run build --filter=@preplai/db 2>/dev/null || true` |
| **Run Command** | `node apps/api/src/index.js` |
| **HTTP Port** | 5000 |

**Environment variables:**

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | *(from Step 1)* |
| `PORT` | `5000` |
| `JWT_SECRET` | *(generate: `openssl rand -hex 32`)* |
| `ALLOWED_ORIGINS` | `https://preplai.com,https://www.preplai.com,https://player.preplai.com` |
| `PLAYER_BASE_URL` | `https://player.preplai.com` |
| `NODE_ENV` | `production` |

**Domains:** `api.preplai.com`

#### Component 3: MCP Server (Web Service)

| Field | Value |
|-------|-------|
| **Name** | mcp-server |
| **Source Directory** | `/` |
| **Type** | Web Service |
| **Build Command** | `pnpm install && pnpm run build --workspace=@preplai/mcp-server` |
| **Run Command** | `node packages/mcp-server/dist/server.js` |
| **HTTP Port** | 5005 |

**Environment variables:**

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | *(from Step 1)* |
| `PORT` | `5005` |
| `HOST` | `0.0.0.0` |
| `BASE_URL` | `https://player.preplai.com` |
| `ALLOWED_ORIGINS` | `https://preplai.com,https://www.preplai.com,https://api.preplai.com,https://player.preplai.com` |
| `NODE_ENV` | `production` |

**Domains:** `player.preplai.com`

**Important:**  
- If builds fail with workspace/cache issues, add `NODE_MODULES_CACHE=false` as a global env var.  
- App Platform may need custom configuration for long-lived SSE connections. If the player disconnects, increase timeouts in the component settings or use Option 2 (Droplet).

### Step 3: DNS

In your domain registrar (or DigitalOcean DNS):

| Type | Name | Value |
|------|------|-------|
| A | `@` | *(App Platform CNAME target or load balancer IP)* |
| CNAME | `www` | `preplai.com` or App Platform URL |
| CNAME | `api` | `api-preplai-xxxxx.ondigitalocean.app` |
| CNAME | `player` | `mcp-server-preplai-xxxxx.ondigitalocean.app` |

App Platform will show the exact CNAME targets when you add custom domains to each component.

### Step 4: Deploy

Push to your main branch; App Platform will build and deploy all three components.

---

## Option 2: DigitalOcean Droplet + Docker Compose (Full control)

For more control, SSE tuning, and lower cost at scale, use a single Droplet with Docker Compose.

### Prerequisites

- DigitalOcean Droplet (Ubuntu 24.04, 4 vCPU / 8 GB RAM recommended)
- Domain `preplai.com` with A records pointing to the Droplet IP
- MongoDB: DigitalOcean Managed Database or MongoDB Atlas

### Step 1: Create Dockerfiles and Compose

Create these files in your repo:

**`Dockerfile.api`** (at repo root):

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
COPY apps/ apps/
COPY packages/ packages/
RUN corepack enable pnpm && pnpm install --frozen-lockfile
RUN pnpm run build --filter=@preplai/db
ENV NODE_ENV=production
EXPOSE 5000
CMD ["node", "apps/api/src/index.js"]
```

**`Dockerfile.mcp`** (at repo root):

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
COPY packages/ packages/
RUN corepack enable pnpm && pnpm install --frozen-lockfile
RUN pnpm run build --filter=@preplai/mcp-server
ENV NODE_ENV=production
ENV PORT=5005
ENV HOST=0.0.0.0
EXPOSE 5005
CMD ["node", "packages/mcp-server/dist/server.js"]
```

**`Dockerfile.website`** (at repo root):

```dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml* package-lock.json* ./
COPY apps/ apps/
COPY packages/ packages/
RUN corepack enable pnpm && pnpm install --frozen-lockfile
ARG VITE_API_URL=https://api.preplai.com/api
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm run build --filter=website

FROM nginx:alpine
COPY --from=build /app/apps/website/dist /usr/share/nginx/html
# SPA routing: create deploy/nginx-website.conf with:
#   server { listen 80; root /usr/share/nginx/html; index index.html; location / { try_files $uri $uri/ /index.html; } }
COPY deploy/nginx-website.conf /etc/nginx/conf.d/default.conf
```

**`docker-compose.yml`**:

```yaml
version: "3.9"

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    restart: unless-stopped
    environment:
      PORT: 5000
      MONGODB_URI: ${MONGODB_URI}
      JWT_SECRET: ${JWT_SECRET}
      ALLOWED_ORIGINS: https://preplai.com,https://www.preplai.com,https://player.preplai.com
      PLAYER_BASE_URL: https://player.preplai.com
      NODE_ENV: production
    networks:
      - preplai-net

  mcp:
    build:
      context: .
      dockerfile: Dockerfile.mcp
    restart: unless-stopped
    environment:
      PORT: 5005
      HOST: 0.0.0.0
      BASE_URL: https://player.preplai.com
      MONGODB_URI: ${MONGODB_URI}
      ALLOWED_ORIGINS: https://preplai.com,https://www.preplai.com,https://api.preplai.com,https://player.preplai.com
      NODE_ENV: production
    networks:
      - preplai-net

  website:
    build:
      context: .
      dockerfile: Dockerfile.website
      args:
        VITE_API_URL: https://api.preplai.com/api
    restart: unless-stopped
    networks:
      - preplai-net

  nginx:
    image: nginx:alpine
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - ./ssl:/etc/letsencrypt:ro
    depends_on:
      - api
      - mcp
      - website
    networks:
      - preplai-net

networks:
  preplai-net:
    driver: bridge
```

### Step 2: Create deploy files

Create `deploy/nginx-website.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Step 3: Nginx reverse proxy configuration

Create `nginx/conf.d/preplai.com.conf`:

```nginx
# HTTP → HTTPS
server {
    listen 80;
    server_name preplai.com www.preplai.com api.preplai.com player.preplai.com;
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    location / {
        return 301 https://$host$request_uri;
    }
}

# Website — preplai.com
server {
    listen 443 ssl http2;
    server_name preplai.com www.preplai.com;
    ssl_certificate /etc/letsencrypt/live/preplai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/preplai.com/privkey.pem;

    location / {
        proxy_pass http://website;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API — api.preplai.com
server {
    listen 443 ssl http2;
    server_name api.preplai.com;
    ssl_certificate /etc/letsencrypt/live/preplai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/preplai.com/privkey.pem;

    location / {
        proxy_pass http://api:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# MCP Server / Player — player.preplai.com
# CRITICAL: SSE requires proxy_buffering off and long timeouts
server {
    listen 443 ssl http2;
    server_name player.preplai.com;
    ssl_certificate /etc/letsencrypt/live/preplai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/preplai.com/privkey.pem;

    # SSE endpoint — disable buffering, long timeout (critical for player)
    location ~ ^/session/[^/]+/events$ {
        proxy_pass http://mcp:5005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        chunked_transfer_encoding on;
        gzip off;
    }

    # All other MCP/player routes
    location / {
        proxy_pass http://mcp:5005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 4: SSL with Let's Encrypt (run before first docker compose up)

```bash
sudo apt update && sudo apt install -y certbot
sudo certbot certonly --standalone -d preplai.com -d www.preplai.com -d api.preplai.com -d player.preplai.com \
  --non-interactive --agree-tos --email admin@preplai.com
```

### Step 5: Deploy

Ensure `.env` contains `MONGODB_URI` and `JWT_SECRET` (e.g. from `openssl rand -hex 32`).

```bash
# Create .env with MONGODB_URI, JWT_SECRET
docker compose build
docker compose up -d
```

---

## Option 3: Deployment Scripts + CI/CD

The repo includes scripts for automated setup and deployment.

### First-time setup (on a fresh Droplet)

```bash
# 1. Clone the repo
git clone https://github.com/BabaScience/preplai.git /opt/preplai
cd /opt/preplai

# 2. Server setup (Docker, deploy user, certbot hooks)
sudo ./deploy/setup-server.sh

# 3. SSL (ensure DNS A records point to this server first)
sudo ./deploy/setup-ssl.sh admin@preplai.com

# 4. Create .env (copy from deploy/.env.example)
cp deploy/.env.example .env
# Edit .env: set MONGODB_URI, JWT_SECRET

# 5. Deploy
./deploy/deploy.sh
```

### Full one-shot script (after clone)

```bash
cd /opt/preplai
sudo ./deploy/run-full-deploy.sh
```

### CI/CD (GitHub Actions)

- **CI** (`.github/workflows/ci.yml`): Lint, typecheck, test on every push/PR.
- **Deploy** (`.github/workflows/deploy.yml`): Deploys to VPS on push to `main`.

**Required GitHub secrets:**

| Secret | Value |
|--------|-------|
| `VPS_HOST` | Droplet IP or hostname |
| `VPS_USER` | SSH user (e.g. `deploy`) |
| `VPS_SSH_KEY` | Private SSH key (Ed25519, no passphrase) |

**Manual deploy trigger:** Workflow → Deploy → Run workflow.

### SSL auto-renewal

Certbot renewal hooks are installed by `setup-server.sh`:
- **Pre:** Stop nginx (so certbot can bind to port 80)
- **Post:** Start nginx
- **Deploy:** Reload nginx

Verify: `sudo certbot renew --dry-run`

---

## Environment Variables Summary (preplai.com)

| Service | Variable | Value |
|---------|----------|-------|
| **All** | `MONGODB_URI` | Your MongoDB connection string |
| **API** | `JWT_SECRET` | `openssl rand -hex 32` |
| **API** | `ALLOWED_ORIGINS` | `https://preplai.com,https://www.preplai.com,https://player.preplai.com` |
| **API** | `PLAYER_BASE_URL` | `https://player.preplai.com` |
| **MCP** | `BASE_URL` | `https://player.preplai.com` |
| **MCP** | `ALLOWED_ORIGINS` | `https://preplai.com,https://www.preplai.com,https://api.preplai.com,https://player.preplai.com` |
| **Website** (build) | `VITE_API_URL` | `https://api.preplai.com/api` |

---

## Claude Desktop with Hosted preplai.com

When using the hosted MCP server at `https://player.preplai.com`:

```json
{
  "mcpServers": {
    "preplai": {
      "command": "node",
      "args": ["/path/to/preplai/packages/mcp-server/dist/stdio-bridge.js"],
      "env": {
        "BASE_URL": "https://player.preplai.com",
        "ALLOWED_ORIGINS": "https://player.preplai.com"
      }
    }
  }
}
```

Presentations will be accessible at `https://player.preplai.com/player/:sessionId`.

---

## Health Checks

| URL | Service |
|-----|---------|
| https://preplai.com | Website |
| https://api.preplai.com/health | API |
| https://player.preplai.com/health | MCP Server |

---

## Cost Estimate (DigitalOcean)

| Option | Components | Est. Monthly |
|--------|------------|--------------|
| **App Platform** | 3 apps + MongoDB Basic | ~$30–50 |
| **Droplet** | 4 vCPU / 8 GB + Managed MongoDB | ~$55–65 |
| **Droplet (budget)** | 2 vCPU / 4 GB + MongoDB Atlas free tier | ~$24 |
