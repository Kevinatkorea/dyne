#!/usr/bin/env bash
# =====================================================================
# backup.sh — DB 덤프 + 업로드 이미지 백업 (14일 보관)
# crontab 예:  50 4 * * * bash /home/website/dy.mostvisual.co.kr/deploy/backup.sh
# =====================================================================
set -euo pipefail

APP_DIR="/home/website/dy.mostvisual.co.kr"
OUT="$APP_DIR/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"
KEEP_DAYS=14

mkdir -p "$OUT"

# .env 에서 DB 접속 정보를 읽는다
set -a
# shellcheck disable=SC1091
. "$APP_DIR/server/.env"
set +a

mysqldump --single-transaction --quick --default-character-set=utf8mb4 \
  -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" \
  -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" \
  | gzip -9 > "$OUT/dyne_db_${STAMP}.sql.gz"

# 업로드 이미지 (레포 자산은 git 에 있으므로 제외)
if [ -d "$APP_DIR/uploads" ]; then
  tar -czf "$OUT/dyne_uploads_${STAMP}.tar.gz" -C "$APP_DIR" uploads
fi

find "$OUT" -name 'dyne_*' -type f -mtime "+${KEEP_DAYS}" -delete

echo "백업 완료: $OUT (보관 ${KEEP_DAYS}일)"
ls -lh "$OUT" | tail -5
