#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="${REPO_DIR:-/opt/parabellum-os}"
BRANCH="${BRANCH:-master}"

echo "🚀 Parabellum OS deploy — $(date)"

cd "$REPO_DIR"

echo "→ pulling latest"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "→ installing dependencies"
npm ci

echo "→ generating Prisma client"
cd packages/db && npx prisma generate && cd "$REPO_DIR"

echo "→ pushing schema to DB"
cd packages/db && npx prisma db push --accept-data-loss && cd "$REPO_DIR"

echo "→ restarting services"
if command -v pm2 &>/dev/null; then
  pm2 restart ecosystem.config.cjs --update-env 2>/dev/null || pm2 start ecosystem.config.cjs
else
  echo "  (pm2 not found — restart services manually)"
fi

echo "✅ deploy complete — $(date)"
