#!/usr/bin/env bash
# deploy/deploy.sh
# Full deployment: pull, build, up. Run from repo root or /opt/preplai.
# Usage: ./deploy/deploy.sh
#   Or from CI: ssh user@host "cd /opt/preplai && ./deploy/deploy.sh"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

echo "==> preplai deploy ($(date -Iseconds))"

# ── Validate .env ───────────────────────────────────────────────────
if [ ! -f .env ]; then
  echo "ERROR: .env not found. Create from .env.example"
  exit 1
fi

if ! grep -q "MONGODB_URI=" .env || ! grep -q "JWT_SECRET=" .env; then
  echo "ERROR: .env must contain MONGODB_URI and JWT_SECRET"
  exit 1
fi

# ── Git pull (if in a git repo) ─────────────────────────────────────
if [ -d .git ]; then
  echo "==> Pulling latest..."
  git fetch origin
  git reset --hard origin/main 2>/dev/null || git reset --hard origin/master 2>/dev/null || true
fi

# ── Build & up ─────────────────────────────────────────────────────
echo "==> Building images..."
docker compose build --no-cache

echo "==> Starting services..."
docker compose up -d

# ── Wait for services ─────────────────────────────────────────────
echo "==> Waiting for services..."
sleep 8

# ── Reload nginx (pick up config changes) ────────────────────────────
if docker ps -q -f name=preplai-nginx 2>/dev/null | head -1; then
  docker exec preplai-nginx nginx -t 2>/dev/null && docker exec preplai-nginx nginx -s reload 2>/dev/null || true
fi

echo ""
echo "==> Deploy complete."
echo "    Website:  https://preplai.com"
echo "    API:      https://api.preplai.com/health"
echo "    Player:   https://player.preplai.com/health"
echo ""
