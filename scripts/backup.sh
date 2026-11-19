#!/usr/bin/env bash
################################################################################
# ENIT Connect — production backup
#
# Backs up the PostgreSQL database (pg_dump custom format) and the uploads
# volume, keeps the last N days locally and optionally copies them off-site
# with rclone (Cloudflare R2, Backblaze B2, S3, Google Drive, ...).
#
# Usage:
#   ./scripts/backup.sh
#
# Cron (daily at 03:00):
#   0 3 * * * /opt/enit-connect/scripts/backup.sh >> /var/log/enit-backup.log 2>&1
#
# Environment (all optional; defaults match docker-compose.prod.yml):
#   BACKUP_DIR        local destination          (/var/backups/enit-connect)
#   RETENTION_DAYS    local days to keep         (14)
#   DB_CONTAINER      postgres container name    (tic-db)
#   DB_NAME / DB_USER database and role          (enit_connect / enit_user)
#   UPLOADS_VOLUME    docker volume for uploads  (tic-uploads)
#   RCLONE_REMOTE     e.g. "r2:enit-backups" — off-site copy is skipped if empty
#   REMOTE_RETENTION  rclone age for remote pruning, e.g. "60d" (empty = keep all)
#
# Exit codes: 0 success, 1 failure (cron mail / log will show the step).
################################################################################
set -Eeuo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/enit-connect}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DB_CONTAINER="${DB_CONTAINER:-tic-db}"
DB_NAME="${DB_NAME:-enit_connect}"
DB_USER="${DB_USER:-enit_user}"
UPLOADS_VOLUME="${UPLOADS_VOLUME:-tic-uploads}"
RCLONE_REMOTE="${RCLONE_REMOTE:-}"
REMOTE_RETENTION="${REMOTE_RETENTION:-}"

STAMP="$(date +%Y%m%d-%H%M%S)"
DEST="$BACKUP_DIR/$STAMP"

log() { echo "[$(date '+%F %T')] $*"; }
fail() { log "ERROR: $*"; exit 1; }
trap 'fail "backup aborted at line $LINENO"' ERR

# Prevent two backups running at once (e.g. a slow run overlapping the next cron).
exec 9>"/tmp/enit-backup.lock"
flock -n 9 || fail "another backup is already running"

command -v docker >/dev/null || fail "docker not found"
docker inspect -f '{{.State.Running}}' "$DB_CONTAINER" 2>/dev/null | grep -q true \
  || fail "database container '$DB_CONTAINER' is not running"

umask 077                      # dumps contain personal data — owner-only
mkdir -p "$DEST"
log "Backing up to $DEST"

# 1. Database — custom format is compressed and restorable table-by-table.
log "Dumping database $DB_NAME"
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -Fc --no-owner \
  > "$DEST/db.dump"
# Verify the archive is readable before trusting it.
docker exec -i "$DB_CONTAINER" pg_restore --list < "$DEST/db.dump" >/dev/null \
  || fail "database dump failed verification"

# 2. Uploads — read-only mount of the named volume through a throwaway container.
if docker volume inspect "$UPLOADS_VOLUME" >/dev/null 2>&1; then
  log "Archiving uploads volume $UPLOADS_VOLUME"
  docker run --rm -v "$UPLOADS_VOLUME":/data:ro alpine:3 \
    tar -czf - -C /data . > "$DEST/uploads.tar.gz"
  gzip -t "$DEST/uploads.tar.gz" || fail "uploads archive is corrupt"
else
  log "WARN: volume '$UPLOADS_VOLUME' not found — skipping uploads"
fi

( cd "$DEST" && sha256sum ./* > SHA256SUMS )
log "Local backup done ($(du -sh "$DEST" | cut -f1))"

# 3. Off-site copy.
if [[ -n "$RCLONE_REMOTE" ]]; then
  command -v rclone >/dev/null || fail "RCLONE_REMOTE is set but rclone is not installed"
  log "Uploading to $RCLONE_REMOTE/$STAMP"
  rclone copy "$DEST" "$RCLONE_REMOTE/$STAMP"
  if [[ -n "$REMOTE_RETENTION" ]]; then
    log "Pruning remote backups older than $REMOTE_RETENTION"
    rclone delete "$RCLONE_REMOTE" --min-age "$REMOTE_RETENTION"
    rclone rmdirs "$RCLONE_REMOTE" --leave-root
  fi
else
  log "WARN: RCLONE_REMOTE not set — backup is only on this server"
fi

# 4. Local retention (only timestamped dirs created by this script).
find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*-*' \
  -mtime +"$RETENTION_DAYS" -exec rm -rf {} +

log "Backup finished"
