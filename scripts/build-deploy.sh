#!/usr/bin/env bash
# Build the React app and publish it to the nginx web root on the server.
# Run this from the frontend repo on the Oracle box after pulling changes.
#
#   bash scripts/build-deploy.sh
#
# Override the destination with WEB_ROOT=/some/path bash scripts/build-deploy.sh
set -euo pipefail

WEB_ROOT="${WEB_ROOT:-/var/www/vedicpatro}"
cd "$(dirname "$0")/.."

echo "==> Installing dependencies (npm ci)"
npm ci

echo "==> Building production bundle (API base = /api, same-origin)"
VITE_API_BASE_URL=/api npm run build

echo "==> Publishing dist/ → ${WEB_ROOT}"
sudo mkdir -p "${WEB_ROOT}"
sudo rsync -a --delete dist/ "${WEB_ROOT}/"

echo "==> Done. The new build is live (nginx serves it statically)."
echo "    If you changed nginx config, run: sudo systemctl reload nginx"
