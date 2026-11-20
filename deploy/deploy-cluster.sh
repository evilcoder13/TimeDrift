#!/usr/bin/env bash
# ==============================================================================
# TimeDrift Multi-VPS Cluster Deployment Script
# - VPS 1 (viecnho: 148.135.2.179): Host Nginx + Let's Encrypt SSL + timedrift-web
# - VPS 3 (tech42vn: 42.96.15.41:26266 / TS: 100.100.91.61): timedrift-llm + timedrift-music
# - VPS 2 (tech42: 117.55.236.40 - Standby): Optional separate timedrift-music node
# ==============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VIECNHO_HOST="root@148.135.2.179"
TECH42VN_HOST="root@42.96.15.41"
TECH42VN_PORT="26266"
REMOTE_DIR="/opt/timedrift"

echo "=== [1/4] Syncing TimeDrift repository to VPS 3 (tech42vn) ==="
ssh -p "$TECH42VN_PORT" "$TECH42VN_HOST" "mkdir -p $REMOTE_DIR"
rsync -az --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'storage' \
  --exclude 'data' \
  -e "ssh -p $TECH42VN_PORT" \
  "$PROJECT_DIR/" "$TECH42VN_HOST:$REMOTE_DIR/"

echo "=== [2/4] Building & Starting AI Workers (LLM + Music Lite) on VPS 3 (tech42vn) ==="
ssh -p "$TECH42VN_PORT" "$TECH42VN_HOST" "cd $REMOTE_DIR/deploy && docker compose -f docker-compose.tech42vn.yml up -d --build"

echo "=== [3/4] Syncing TimeDrift repository to VPS 1 (viecnho) ==="
ssh "$VIECNHO_HOST" "mkdir -p $REMOTE_DIR"
rsync -az --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  --exclude 'storage' \
  --exclude 'data' \
  "$PROJECT_DIR/" "$VIECNHO_HOST:$REMOTE_DIR/"

echo "=== [4/4] Building & Starting Web App + Nginx SSL on VPS 1 (viecnho) ==="
ssh "$VIECNHO_HOST" "cd $REMOTE_DIR/deploy && docker compose -f docker-compose.viecnho.yml up -d --build"

echo "✅ Cluster deployment complete!"
