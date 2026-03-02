#!/usr/bin/env bash
# deploy/setup-ssl.sh
# Obtain Let's Encrypt SSL certificates for preplai.com.
# Run as root. Requires port 80 free (stop nginx first if already running).
#
# Usage: sudo ./deploy/setup-ssl.sh [email]
#   email: Contact for Let's Encrypt (default: admin@preplai.com)

set -euo pipefail

DOMAINS="preplai.com www.preplai.com api.preplai.com player.preplai.com"
EMAIL="${1:-admin@preplai.com}"

echo "==> Obtaining SSL certificates for ${DOMAINS}"
echo "    Contact email: ${EMAIL}"
echo ""

# Ensure port 80 is free (certbot standalone mode)
if ss -tlnp | grep -q ':80 '; then
  echo "ERROR: Port 80 is in use. Stop nginx/docker first:"
  echo "  docker compose down"
  echo "  # or: systemctl stop nginx"
  exit 1
fi

certbot certonly \
  --standalone \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}" \
  -d preplai.com \
  -d www.preplai.com \
  -d api.preplai.com \
  -d player.preplai.com

echo ""
echo "==> Certificates installed at:"
echo "    /etc/letsencrypt/live/preplai.com/"
echo ""
echo "==> Symlink for Docker (if using ./ssl bind mount):"
echo "    mkdir -p /opt/preplai/ssl"
echo "    sudo ln -sf /etc/letsencrypt /opt/preplai/ssl"
echo ""
echo "    Or in docker-compose, use: - /etc/letsencrypt:/etc/letsencrypt:ro"
echo ""
