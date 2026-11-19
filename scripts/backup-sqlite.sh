#!/usr/bin/env bash
# ==============================================================================
# TimeDrift SQLite Atomic Online Backup & Storage Sync
# Task: OPS-3 (docs/ba/P4_URD.md §3.4.1)
# ==============================================================================
set -euo pipefail

# Configuration defaults
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
DB_PATH="${DB_PATH:-$PROJECT_ROOT/data/timedrift.db}"
STORAGE_PATH="${STORAGE_PATH:-$PROJECT_ROOT/storage}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"

# Fallback if DB is located in prisma/data/timedrift.db
if [ ! -f "$DB_PATH" ] && [ -f "$PROJECT_ROOT/prisma/data/timedrift.db" ]; then
  DB_PATH="$PROJECT_ROOT/prisma/data/timedrift.db"
fi

DB_BACKUP_DIR="$BACKUP_DIR/db"
STORAGE_BACKUP_DIR="$BACKUP_DIR/storage"

mkdir -p "$DB_BACKUP_DIR"
mkdir -p "$STORAGE_BACKUP_DIR"

echo "=== TimeDrift Backup Initiated: $TIMESTAMP ==="
echo "Database: $DB_PATH"
echo "Storage:  $STORAGE_PATH"
echo "Dest:     $BACKUP_DIR"

# 1. Online Atomic SQLite Backup using VACUUM INTO
if [ -f "$DB_PATH" ]; then
  RAW_BACKUP_FILE="$DB_BACKUP_DIR/timedrift-$TIMESTAMP.db"
  GZ_BACKUP_FILE="$RAW_BACKUP_FILE.gz"

  echo "Performing online atomic SQLite backup..."
  sqlite3 "$DB_PATH" "VACUUM INTO '$RAW_BACKUP_FILE';"

  # Verify snapshot integrity before compressing
  INTEGRITY=$(sqlite3 "$RAW_BACKUP_FILE" "PRAGMA integrity_check;")
  if [ "$INTEGRITY" != "ok" ]; then
    echo "ERROR: Backup integrity check failed: $INTEGRITY" >&2
    rm -f "$RAW_BACKUP_FILE"
    exit 1
  fi

  echo "Integrity check OK. Compressing database snapshot with gzip..."
  gzip -f "$RAW_BACKUP_FILE"
  echo "Database backup created: $GZ_BACKUP_FILE ($(du -h "$GZ_BACKUP_FILE" | awk '{print $1}'))"
else
  echo "WARNING: SQLite database not found at $DB_PATH. Skipping DB vacuum."
fi

# 2. Synchronize Storage (Audio tracks, scene bundles)
if [ -d "$STORAGE_PATH" ]; then
  echo "Synchronizing storage assets via rsync..."
  rsync -a --delete "$STORAGE_PATH/" "$STORAGE_BACKUP_DIR/"
  echo "Storage synchronized successfully."
else
  echo "WARNING: Storage directory not found at $STORAGE_PATH. Skipping storage sync."
fi

# 3. Retention Pruning Policy:
# - Retain all hourly backups for 24 hours (1 day)
# - Retain daily backups for 30 days
# - Delete backups older than 30 days
echo "Applying retention pruning policy..."

# Delete compressed db backups older than 30 days
find "$DB_BACKUP_DIR" -name "timedrift-*.db.gz" -mtime +30 -exec rm -f {} +

# For backups between 1 day (24h) and 30 days old:
# Retain only one snapshot per day (e.g. keeping the earliest of each day)
# Find files older than 1 day
if compgen -G "$DB_BACKUP_DIR/timedrift-*.db.gz" > /dev/null; then
  # Group files by day (YYYYMMDD) for files older than 1 day
  # We check mtime +1
  find "$DB_BACKUP_DIR" -name "timedrift-*.db.gz" -mtime +1 | sort | while read -r filepath; do
    filename="$(basename "$filepath")"
    # Extract date part: timedrift-YYYYMMDD_HHMMSS.db.gz
    day_prefix=$(echo "$filename" | sed -E 's/timedrift-([0-9]{8})_.*/\1/')
    # Keep the first backup of that day, remove subsequent ones
    first_of_day=$(find "$DB_BACKUP_DIR" -name "timedrift-${day_prefix}_*.db.gz" | sort | head -n 1)
    if [ "$filepath" != "$first_of_day" ]; then
      echo "Pruning non-daily intermediate backup: $filename"
      rm -f "$filepath"
    fi
  done
fi

echo "=== TimeDrift Backup Completed Successfully ==="
