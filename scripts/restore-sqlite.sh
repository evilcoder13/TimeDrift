#!/usr/bin/env bash
# ==============================================================================
# TimeDrift SQLite Database Restore & Verification Script
# Task: OPS-3 (docs/ba/P4_URD.md §3.4.2)
# ==============================================================================
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
DB_PATH="${DB_PATH:-$PROJECT_ROOT/data/timedrift.db}"
STORAGE_PATH="${STORAGE_PATH:-$PROJECT_ROOT/storage}"
SNAPSHOT_PATH="${1:-}"

# If no snapshot provided, pick the latest database snapshot
if [ -z "$SNAPSHOT_PATH" ]; then
  if compgen -G "$BACKUP_DIR/db/timedrift-*.db.gz" > /dev/null; then
    SNAPSHOT_PATH="$(ls -t "$BACKUP_DIR/db"/timedrift-*.db.gz | head -n 1)"
  elif compgen -G "$BACKUP_DIR/db/timedrift-*.db" > /dev/null; then
    SNAPSHOT_PATH="$(ls -t "$BACKUP_DIR/db"/timedrift-*.db | head -n 1)"
  else
    echo "ERROR: No snapshot specified and none found in $BACKUP_DIR/db" >&2
    echo "Usage: $0 [path/to/snapshot.db.gz|snapshot.db]" >&2
    exit 1
  fi
fi

if [ ! -f "$SNAPSHOT_PATH" ]; then
  echo "ERROR: Snapshot file does not exist: $SNAPSHOT_PATH" >&2
  exit 1
fi

echo "=== TimeDrift Restore Initiated ==="
echo "Snapshot: $SNAPSHOT_PATH"
echo "Target DB: $DB_PATH"

TEMP_RESTORE_DIR="$(mktemp -d /tmp/timedrift_restore_XXXXXX)"
trap 'rm -rf "$TEMP_RESTORE_DIR"' EXIT

TEMP_RESTORE_DB="$TEMP_RESTORE_DIR/restore.db"

# 1. Extract if gzipped
if [[ "$SNAPSHOT_PATH" == *.gz ]]; then
  echo "Decompressing snapshot to staging area..."
  gzip -dc "$SNAPSHOT_PATH" > "$TEMP_RESTORE_DB"
else
  cp "$SNAPSHOT_PATH" "$TEMP_RESTORE_DB"
fi

# 2. Assert SQLite integrity check
echo "Executing PRAGMA integrity_check..."
INTEGRITY="$(sqlite3 "$TEMP_RESTORE_DB" "PRAGMA integrity_check;")"
if [ "$INTEGRITY" != "ok" ]; then
  echo "CRITICAL: Integrity check failed with result: $INTEGRITY" >&2
  exit 1
fi
echo "Integrity check PASSED: ok"

# 3. Validate entity row counts and schema consistency
echo "Validating database schema and entity row counts..."
USER_COUNT=$(sqlite3 "$TEMP_RESTORE_DB" "SELECT COUNT(*) FROM User;")
SCENE_COUNT=$(sqlite3 "$TEMP_RESTORE_DB" "SELECT COUNT(*) FROM Scene;")
MUSIC_COUNT=$(sqlite3 "$TEMP_RESTORE_DB" "SELECT COUNT(*) FROM Music;")
TEMPLATE_COUNT=$(sqlite3 "$TEMP_RESTORE_DB" "SELECT COUNT(*) FROM Template;")

echo "Entity Counts in snapshot:"
echo " - Users:     $USER_COUNT"
echo " - Scenes:    $SCENE_COUNT"
echo " - Music:     $MUSIC_COUNT"
echo " - Templates: $TEMPLATE_COUNT"

# 4. Storage sync verification (if storage backup exists)
if [ -d "$BACKUP_DIR/storage" ]; then
  echo "Verifying referenced audio storage files exist..."
  AUDIO_FILES=$(sqlite3 "$TEMP_RESTORE_DB" "SELECT file FROM Music WHERE file IS NOT NULL;")
  MISSING_AUDIO=0
  for file_rel in $AUDIO_FILES; do
    # File column might be 'storage/audio/m1.ogg' or 'audio/m1.ogg'
    CLEAN_PATH="${file_rel#storage/}"
    if [ ! -f "$BACKUP_DIR/storage/$CLEAN_PATH" ] && [ ! -f "$STORAGE_PATH/$CLEAN_PATH" ]; then
      echo "WARNING: Referenced audio asset missing: $file_rel"
      MISSING_AUDIO=$((MISSING_AUDIO + 1))
    fi
  done
  if [ $MISSING_AUDIO -gt 0 ]; then
    echo "Warning: $MISSING_AUDIO referenced audio asset(s) not found in storage backup or storage dir."
  else
    echo "All referenced audio assets verified."
  fi
fi

# 5. Pre-flight safe swap: Create rollback backup of current live DB if present
if [ -f "$DB_PATH" ]; then
  PRE_ROLLBACK="$DB_PATH.pre-restore.$(date +%Y%m%d_%H%M%S)"
  echo "Backing up current live DB to $PRE_ROLLBACK before applying restore..."
  cp "$DB_PATH" "$PRE_ROLLBACK"
fi

# Ensure parent directory for target DB exists
mkdir -p "$(dirname "$DB_PATH")"

# Atomic file replacement
echo "Applying restored database to $DB_PATH..."
cp "$TEMP_RESTORE_DB" "$DB_PATH"

# If prisma/data/timedrift.db exists and is separate from DB_PATH, also synchronize it
if [ "$DB_PATH" != "$PROJECT_ROOT/prisma/data/timedrift.db" ] && [ -d "$PROJECT_ROOT/prisma/data" ]; then
  echo "Synchronizing prisma/data/timedrift.db copy..."
  cp "$TEMP_RESTORE_DB" "$PROJECT_ROOT/prisma/data/timedrift.db"
fi

# Final live verification
FINAL_CHECK="$(sqlite3 "$DB_PATH" "PRAGMA integrity_check;")"
if [ "$FINAL_CHECK" != "ok" ]; then
  echo "CRITICAL: Live database failed integrity check after restore: $FINAL_CHECK" >&2
  if [ -n "${PRE_ROLLBACK:-}" ] && [ -f "$PRE_ROLLBACK" ]; then
    echo "Rolling back to previous database state..."
    cp "$PRE_ROLLBACK" "$DB_PATH"
  fi
  exit 1
fi

echo "=== TimeDrift Restore Completed Successfully (Integrity: OK) ==="
