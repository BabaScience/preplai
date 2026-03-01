# Deploying preplai

preplai can run as a hosted service so presentation URLs are shareable across the internet.

## Local Development Ports

| Service | Port |
|---------|------|
| API (apps/api) | 5000 |
| Website (apps/website) | 5173 |
| MCP Server (packages/mcp-server) | 5005 |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5005` | HTTP port (MCP server; API uses 5000) |
| `HOST` | `0.0.0.0` | Bind address |
| `BASE_URL` | `http://localhost:5005` | Public URL (used in player URLs returned by MCP tools) |
| `MONGODB_URI` | `mongodb://localhost:27017/preplai` | MongoDB connection string (shared by apps/api and mcp-server) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:5005` | CORS allowed origins (comma-separate for multiple) |
| `LOG_LEVEL` | `info` | Fastify log level (`debug`, `info`, `warn`, `error`) |

## Local Development

```bash
npm install
npm run build --workspace=packages/mcp-server
node packages/mcp-server/dist/server.js
```

## Production Deployment

### Option 1: Docker

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/ packages/
RUN npm ci --production
RUN npm run build --workspace=packages/mcp-server
EXPOSE 5005
ENV PORT=5005
ENV HOST=0.0.0.0
ENV BASE_URL=https://your-domain.com
ENV ALLOWED_ORIGINS=https://your-domain.com
ENV MONGODB_URI=mongodb://mongo:27017/preplai
CMD ["node", "packages/mcp-server/dist/server.js"]
```

Build and run:

```bash
docker build -t preplai .
docker run -d \
  -p 5005:5005 \
  -e MONGODB_URI=mongodb://your-mongo-host:27017/preplai \
  -e BASE_URL=https://your-domain.com \
  -e ALLOWED_ORIGINS=https://your-domain.com \
  preplai
```

### Option 2: systemd Service

```ini
[Unit]
Description=preplai presentation server
After=network.target

[Service]
Type=simple
User=preplai
WorkingDirectory=/opt/preplai
ExecStart=/usr/bin/node packages/mcp-server/dist/server.js
Environment=PORT=5005
Environment=HOST=0.0.0.0
Environment=BASE_URL=https://your-domain.com
Environment=ALLOWED_ORIGINS=https://your-domain.com
Environment=MONGODB_URI=mongodb://localhost:27017/preplai
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### Option 3: Railway / Render / Fly.io

1. Set the start command to: `node packages/mcp-server/dist/server.js`
2. Set environment variables:
   - `BASE_URL` = your app's public URL
   - `ALLOWED_ORIGINS` = same as BASE_URL
   - `MONGODB_URI` = your MongoDB connection string (e.g. MongoDB Atlas URI or `mongodb://localhost:27017/preplai`)
3. Expose port `5005`

## Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:5005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE support — disable buffering
        proxy_buffering off;
        proxy_read_timeout 86400;
    }
}
```

The `proxy_buffering off` and long `proxy_read_timeout` are critical for SSE (Server-Sent Events) to work correctly.

## Claude Desktop with Hosted Mode

When running hosted, Claude Desktop's stdio bridge connects to your remote server. Point the bridge at the hosted URL:

```json
{
  "mcpServers": {
    "preplai": {
      "command": "node",
      "args": ["/path/to/packages/mcp-server/dist/stdio-bridge.js"],
      "env": {
        "PORT": "5005",
        "BASE_URL": "https://your-domain.com",
        "ALLOWED_ORIGINS": "https://your-domain.com"
      }
    }
  }
}
```

Presentations will then be accessible at `https://your-domain.com/player/:sessionId`.

## Health Check

```bash
curl https://your-domain.com/health
```

Returns:
```json
{
  "status": "ok",
  "version": "1.0.0",
  "sessions": 0,
  "uptime": 123.456
}
```

## Data Persistence

preplai uses MongoDB for persistence. The connection string is specified by `MONGODB_URI`. Both `apps/api` (dashboard users, API keys, usage) and `packages/mcp-server` (sessions, visual scripts, narrations) share the same database. Ensure:

- MongoDB is running and reachable at the URI
- You back up the database regularly if data matters (e.g. `mongodump`)
- Sessions older than 7 days are automatically cleaned up on server startup and every 6 hours
