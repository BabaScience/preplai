# Deploying preplai

preplai can run as a hosted service so presentation URLs are shareable across the internet.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `HOST` | `0.0.0.0` | Bind address |
| `BASE_URL` | `http://localhost:3001` | Public URL (used in player URLs returned by MCP tools) |
| `DB_PATH` | `./preplai.db` | SQLite database file path |
| `ALLOWED_ORIGINS` | `http://localhost:3001` | CORS allowed origins (comma-separate for multiple) |
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
EXPOSE 3001
ENV PORT=3001
ENV HOST=0.0.0.0
ENV BASE_URL=https://your-domain.com
ENV ALLOWED_ORIGINS=https://your-domain.com
ENV DB_PATH=/data/preplai.db
VOLUME /data
CMD ["node", "packages/mcp-server/dist/server.js"]
```

Build and run:

```bash
docker build -t preplai .
docker run -d \
  -p 3001:3001 \
  -v preplai-data:/data \
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
Environment=PORT=3001
Environment=HOST=0.0.0.0
Environment=BASE_URL=https://your-domain.com
Environment=ALLOWED_ORIGINS=https://your-domain.com
Environment=DB_PATH=/var/lib/preplai/preplai.db
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
   - `DB_PATH` = `/data/preplai.db` (use a persistent volume)
3. Expose port `3001`

## Reverse Proxy (nginx)

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3001;
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
        "PORT": "3001",
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

preplai uses SQLite via `better-sqlite3` in WAL mode. The database file is specified by `DB_PATH`. Ensure:

- The directory exists and is writable
- You back up the `.db` file regularly if data matters
- Sessions older than 7 days are automatically cleaned up on server startup and every 6 hours
