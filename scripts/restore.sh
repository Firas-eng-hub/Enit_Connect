#!/usr/bin/env bash
################################################################################
# ENIT Connect — restore a backup made by scripts/backup.sh
#
# Usage:
#   ./scripts/restore.sh /var/backups/enit-connect/20261119-030000
#   ./scripts/restore.sh <dir> --db-only | --uploads-only
#
# To restore from off-site first:  rclone copy r2:enit-backups/<STAMP> /tmp/<STAMP>
#
# DESTRUCTIVE: replaces the current database contents and uploads.
# The backend is stopped during the restore and started again afterwards.
# Run from the directory containing docker-compose.yml.
################################################################################
set -Eeuo pipefail

SRC="${1:-}"
MODE="${2:-all}"
DB_CONTAINER="${DB_CONTAINER:-tic-db}"
DB_NAME="${DB_NAME:-enit_connect}"
DB_USER="${DB_USER:-enit_user}"
UPLOADS_VOLUME="${UPLOADS_VOLUME:-tic-uploads}"
BACKEND_SERVICE="${BACKEND_SERVICE:-backend}"

log() { echo "[$(date '+%F %T')] $*"; }
fail() { log "ERROR: $*"; exit 1; }

[[ -n "$SRC" && -d "$SRC" ]] || fail "usage: $0 <backup-dir> [--db-only|--uploads-only]"
case "$MODE" in all|--db-only|--uploads-only) ;; *) fail "unknown option $MODE" ;; esac

if [[ -f "$SRC/SHA256SUMS" ]]; then
  ( cd "$SRC" && sha256sum -c --quiet SHA256SUMS ) || fail "checksum mismatch in $SRC"
fi

echo "This will OVERWRITE production data with the backup in: $SRC ($MODE)"
read -r -p "Type 'restore' to continue: " answer
[[ "$answer" == "restore" ]] || fail "aborted"

log "Stopping backend"
docker compose stop "$BACKEND_SERVICE"
trap 'log "Starting backend"; docker compose start "$BACKEND_SERVICE"' EXIT

if [[ "$MODE" != "--uploads-only" ]]; then
  [[ -f "$SRC/db.dump" ]] || fail "$SRC/db.dump not found"
  log "Restoring database $DB_NAME"
  docker exec -i "$DB_CONTAINER" pg_restore -U "$DB_USER" -d "$DB_NAME" \
    --clean --if-exists --no-owner --single-transaction < "$SRC/db.dump"
fi

if [[ "$MODE" != "--db-only" ]]; then
  [[ -f "$SRC/uploads.tar.gz" ]] || fail "$SRC/uploads.tar.gz not found"
  log "Restoring uploads into volume $UPLOADS_VOLUME"
  docker run --rm -i -v "$UPLOADS_VOLUME":/data alpine:3 \
    sh -c 'find /data -mindepth 1 -delete && tar -xzf - -C /data' < "$SRC/uploads.tar.gz"
fi

log "Restore finished"
