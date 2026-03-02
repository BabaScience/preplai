# @preplai/mcp-server — Production Docker image
# Build from monorepo root: docker build -f packages/mcp-server/Dockerfile .
FROM node:20-slim

WORKDIR /app

# Copy workspace config and lockfile
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# Copy all packages (mcp-server and its workspace deps)
COPY packages/ packages/

# Install and build
RUN npm ci 2>/dev/null || npm install
RUN npm run build --workspace=@preplai/mcp-server 2>/dev/null || (cd packages/mcp-server && npm run build)

ENV NODE_ENV=production
ENV PORT=5005
ENV HOST=0.0.0.0

EXPOSE 5005

CMD ["node", "packages/mcp-server/dist/server.js"]
