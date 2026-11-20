#!/usr/bin/env bash
# ==============================================================================
# TimeDrift Standby VPS 2 (tech42) Deployment Script
# Run this script once tech42 (117.55.236.40) is back online to offload Music Worker
# ==============================================================================
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TECH42_HOST="${TECH42_HOST:-root@117.55.236.40}"
TECH42_PORT="${TECH42_PORT:-22}"
VIECNHO_HOST="root@148.135.2.179"
REMOTE_DIR="/opt/timedrift"

echo "=== [1/3] Syncing worker/music to VPS 2 ($TECH42_HOST) ==="
ssh -p "$TECH42_PORT" "$TECH42_HOST" "mkdir -p $REMOTE_DIR"
rsync -az --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude '.git' \
  -e "ssh -p $TECH42_PORT" \
  "$PROJECT_DIR/worker" "$PROJECT_DIR/deploy" "$TECH42_HOST:$REMOTE_DIR/"

echo "=== [2/3] Starting Music Worker on VPS 2 ($TECH42_HOST) ==="
ssh -p "$TECH42_PORT" "$TECH42_HOST" "cd $REMOTE_DIR/deploy && docker compose -f docker-compose.tech42.yml up -d --build"

TECH42_IP="${TECH42_HOST#*@}"
echo "=== [3/3] Pointing viecnho MUSIC_WORKER_URL to http://$TECH42_IP:8100 ==="
ssh "$VIECNHO_HOST" "cd $REMOTE_DIR/deploy && MUSIC_WORKER_URL=http://$TECH42_IP:8100 docker compose -f docker-compose.viecnho.yml up -d"

echo "✅ Music Worker successfully migrated to tech42 ($TECH42_IP:8100)!"
