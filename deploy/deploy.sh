#!/usr/bin/env bash
# =====================================================================
# deploy.sh — 서버(49.247.41.172)에서 실행하는 배포 스크립트
#   bash deploy/deploy.sh          코드 갱신 + 빌드 + 재기동
#   SEED=1 bash deploy/deploy.sh   최초 배포 (초기 데이터 시드 포함)
#
# 이 서버에는 다른 서비스가 10개 넘게 돌고 있다.
# 이 스크립트는 dynesketch 자원(포트 3410 · PM2 dynesketch-web · DB dyne)만
# 건드리며 Apache/MariaDB 설정은 절대 수정하지 않는다.
# =====================================================================
set -euo pipefail

APP_DIR="/home/website/dy.mostvisual.co.kr"
APP_NAME="dynesketch-web"
PORT="${PORT:-3410}"

export PATH="$HOME/.npm-global/bin:$PATH"

step() { printf "\n\033[36m▶ %s\033[0m\n" "$1"; }

cd "$APP_DIR"

step "코드 갱신"
git fetch --prune origin
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
git reset --hard "origin/${BRANCH}"
git log -1 --format='  %h %s (%an, %ar)'

step "의존성 설치"
cd "$APP_DIR/server"
if [ -f package-lock.json ]; then
  npm ci --omit=optional --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

step "스키마 적용"
node scripts/migrate.js

if [ "${SEED:-0}" = "1" ]; then
  step "초기 데이터 시드"
  node scripts/seed.js
fi

step "정적 빌드 (JSX 사전 컴파일)"
npm run build

step "PM2 기동"
cd "$APP_DIR"
mkdir -p logs
PORT="$PORT" pm2 startOrReload deploy/ecosystem.config.cjs --update-env
pm2 save

step "헬스체크"
ok=0
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then ok=1; break; fi
  sleep 1
done
if [ "$ok" != "1" ]; then
  echo "  ✖ 헬스체크 실패 — 최근 로그:"
  pm2 logs "$APP_NAME" --lines 40 --nostream || true
  exit 1
fi
curl -fsS "http://127.0.0.1:${PORT}/api/health"; echo

step "이웃 서비스 무영향 확인"
bash "$APP_DIR/deploy/verify_neighbors.sh"

printf "\n\033[32m✔ 배포 완료\033[0m\n"
