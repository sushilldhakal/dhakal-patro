#!/usr/bin/env bash
# Remote deploy script — called by GitHub Actions over SSH on push to main.
# Pulls latest main, builds the React app, and publishes it to the nginx web root.
set -euo pipefail

APP_DIR="${APP_DIR:-/home/ubuntu/dhakal-patro}"
WEB_ROOT="${WEB_ROOT:-/var/www/vedicpatro}"

cd "${APP_DIR}"

echo "==> Pulling latest code"
git fetch origin main
git reset --hard origin/main

echo "==> Installing dependencies (npm ci)"
npm ci

echo "==> Building production bundle (API base = /api, same-origin)"
VITE_API_BASE_URL=/api npm run build

echo "==> Publishing dist/ → ${WEB_ROOT}"
sudo mkdir -p "${WEB_ROOT}"
sudo rsync -a --delete dist/ "${WEB_ROOT}/"

echo "==> Verifying published build"
test -f "${WEB_ROOT}/index.html" || { echo "index.html missing after publish" >&2; exit 1; }

if systemctl is-active --quiet nginx 2>/dev/null; then
  echo "==> Reloading nginx"
  sudo nginx -t
  sudo systemctl reload nginx
fi

echo "Deploy successful."
