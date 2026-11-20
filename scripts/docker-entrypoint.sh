#!/bin/sh
set -e

mkdir -p /app/data /app/storage/audio /app/storage/scenes /app/storage/bundles

# 1. Initialize SQLite database from pre-seeded snapshot if not yet initialized
if [ ! -f /app/data/timedrift.db ] || [ ! -s /app/data/timedrift.db ]; then
  if [ -f /app/seed-snapshot/timedrift.db ]; then
    echo "[entrypoint] Initializing /app/data/timedrift.db from pre-seeded snapshot..."
    cp /app/seed-snapshot/timedrift.db /app/data/timedrift.db
  fi
fi

# 2. Populate seed scene bundles & seed audio into /app/storage if missing
if [ -d /app/seed-snapshot/storage ]; then
  for f in /app/seed-snapshot/storage/scenes/*.js; do
    [ -e "$f" ] || continue
    base="$(basename "$f")"
    if [ ! -f "/app/storage/scenes/$base" ]; then
      echo "[entrypoint] Copying seed scene bundle $base..."
      cp "$f" "/app/storage/scenes/$base"
    fi
  done
  for f in /app/seed-snapshot/storage/audio/*.ogg; do
    [ -e "$f" ] || continue
    base="$(basename "$f")"
    if [ ! -f "/app/storage/audio/$base" ]; then
      echo "[entrypoint] Copying seed audio $base..."
      cp "$f" "/app/storage/audio/$base"
    fi
  done
fi

echo "[entrypoint] Starting TimeDrift Next.js production server on port ${PORT:-3000}..."
exec node server.js
