#!/usr/bin/env bash
# deploy/run-full-deploy.sh
# First-time full deployment: setup server, SSL, clone, deploy.
# Run from your local machine or from the server.
#
# Usage (on a fresh Droplet, as root):
#   curl -sSL https://raw.githubusercontent.com/BabaScience/preplai/main/deploy/run-full-deploy.sh | sudo bash
#
# Or clone first, then:
#   sudo ./deploy/run-full-deploy.sh
#
# Prerequisites:
#   - Fresh Ubuntu 24.04 Droplet
#   - DNS A records: preplai.com, www, api, player -> Droplet IP
#   - MONGODB_URI and JWT_SECRET ready (will prompt or use env)

set -euo pipefail

DOMAIN="preplai.com"
APP_DIR="/opt/preplai"
REPO_URL="${REPO_URL:-https://github.com/BabaScience/preplai.git}"

echo "=============================================="
echo "  preplai full deployment (${DOMAIN})"
echo "=============================================="
echo ""

# ── Phase 1: Server setup ──────────────────────────────────────────
echo "==> Phase 1: Server setup"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd)"
if [ -z "${SCRIPT_DIR}" ] || [ ! -f "${SCRIPT_DIR}/setup-server.sh" ]; then
  SCRIPT_DIR="$(pwd)/deploy"
fi
if [ -f "${SCRIPT_DIR}/setup-server.sh" ]; then
  "${SCRIPT_DIR}/setup-server.sh"
else
  echo "    Run from repo root: ./deploy/run-full-deploy.sh"
  echo "    Or run deploy/setup-server.sh manually first."
  exit 1
fi

# ── Phase 2: SSL (requires DNS ready) ───────────────────────────────
echo ""
echo "==> Phase 2: SSL certificates"
read -p "    Is DNS pointing to this server? (y/n): " -r
if [[ $REPLY =~ ^[Yy] ]]; then
  "${SCRIPT_DIR}/setup-ssl.sh" || echo "    SSL setup failed - run manually: sudo ./deploy/setup-ssl.sh"
else
  echo "    Skipping SSL. Run later: sudo ./deploy/setup-ssl.sh"
fi

# ── Phase 3: Clone & env ────────────────────────────────────────────
echo ""
echo "==> Phase 3: Clone repo and configure"
if [ ! -d "${APP_DIR}/.git" ]; then
  sudo -u deploy git clone "${REPO_URL}" "${APP_DIR}" 2>/dev/null || git clone "${REPO_URL}" "${APP_DIR}"
fi

if [ ! -f "${APP_DIR}/.env" ]; then
  echo "    Create ${APP_DIR}/.env with:"
  echo "      MONGODB_URI=mongodb+srv://..."
  echo "      JWT_SECRET=\$(openssl rand -hex 32)"
  echo ""
  read -p "    Press Enter after creating .env..."
fi

# ── Phase 4: Deploy ─────────────────────────────────────────────────
echo ""
echo "==> Phase 4: Deploy"
cd "${APP_DIR}"
sudo -u deploy ./deploy/deploy.sh

echo ""
echo "=============================================="
echo "  Deployment complete."
echo "  https://preplai.com"
echo "=============================================="
