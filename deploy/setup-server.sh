#!/usr/bin/env bash
# deploy/setup-server.sh
# One-time server setup for preplai on a fresh Ubuntu 24.04 Droplet.
# Run as root or with sudo. Domain: preplai.com
#
# Usage: sudo ./deploy/setup-server.sh

set -euo pipefail

DOMAIN="preplai.com"
APP_DIR="/opt/preplai"
DEPLOY_USER="${DEPLOY_USER:-deploy}"

echo "==> preplai server setup (domain: ${DOMAIN})"

# ── Install Docker ─────────────────────────────────────────────────
if ! command -v docker &>/dev/null; then
  echo "==> Installing Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
else
  echo "==> Docker already installed"
fi

# ── Create deploy user ─────────────────────────────────────────────
if ! id "${DEPLOY_USER}" &>/dev/null; then
  echo "==> Creating deploy user: ${DEPLOY_USER}"
  useradd -m -s /bin/bash "${DEPLOY_USER}"
  usermod -aG docker "${DEPLOY_USER}"
  mkdir -p "/home/${DEPLOY_USER}/.ssh"
  if [ -f /root/.ssh/authorized_keys ]; then
    cp /root/.ssh/authorized_keys "/home/${DEPLOY_USER}/.ssh/"
    chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "/home/${DEPLOY_USER}/.ssh"
    chmod 700 "/home/${DEPLOY_USER}/.ssh"
    chmod 600 "/home/${DEPLOY_USER}/.ssh/authorized_keys"
  fi
else
  usermod -aG docker "${DEPLOY_USER}" 2>/dev/null || true
fi

# ── App directory ───────────────────────────────────────────────────
echo "==> Creating app directory: ${APP_DIR}"
mkdir -p "${APP_DIR}"/{backups,scripts}
chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${APP_DIR}"

# ── Firewall (optional, uncomment if using ufw) ─────────────────────
# ufw allow 22/tcp
# ufw allow 80/tcp
# ufw allow 443/tcp
# ufw --force enable

# ── Install Certbot (for SSL) ────────────────────────────────────────
if ! command -v certbot &>/dev/null; then
  echo "==> Installing Certbot..."
  apt-get update
  apt-get install -y certbot
else
  echo "==> Certbot already installed"
fi

# ── SSL renewal hooks ───────────────────────────────────────────────
# Certbot with standalone: port 80 must be free during renewal.
# Pre: stop nginx. Post: start nginx. Deploy: reload nginx.
echo "==> Installing Certbot renewal hooks"
mkdir -p /etc/letsencrypt/renewal-hooks/{pre,post,deploy}

# Pre: stop nginx so certbot standalone can bind to port 80
cat > /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh << 'HOOK'
#!/bin/bash
docker stop preplai-nginx 2>/dev/null || true
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/pre/stop-nginx.sh

# Post: start nginx after renewal
cat > /etc/letsencrypt/renewal-hooks/post/start-nginx.sh << 'HOOK'
#!/bin/bash
docker start preplai-nginx 2>/dev/null || true
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/post/start-nginx.sh

# Deploy: reload nginx (backup, in case post didn't run)
cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'HOOK'
#!/bin/bash
docker start preplai-nginx 2>/dev/null || true
docker exec preplai-nginx nginx -s reload 2>/dev/null || true
echo "$(date): Cert renewed, nginx reloaded" >> /var/log/preplai-certbot.log 2>/dev/null || true
HOOK
chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

echo ""
echo "==> Server setup complete."
echo ""
echo "Next steps:"
echo "  1. Ensure DNS A records point to this server:"
echo "     - preplai.com, www.preplai.com, api.preplai.com, player.preplai.com"
echo "  2. Run SSL setup: sudo ./deploy/setup-ssl.sh"
echo "  3. Clone repo to ${APP_DIR} and add .env"
echo "  4. Run first deploy: sudo -u ${DEPLOY_USER} ./deploy/deploy.sh"
echo ""
