#!/usr/bin/env bash
# =====================================================================
# verify_neighbors.sh — 같은 서버의 다른 서비스가 멀쩡한지 확인
# 배포로 남의 서비스를 죽이지 않았는지 매번 검증한다.
# =====================================================================
set -uo pipefail

SITES=(
  "mostvisual.co.kr"
  "deleteit.mostvisual.co.kr"
  "bookdream.co.kr"
  "law.mostvisual.co.kr"
  "eventory.mostvisual.co.kr"
  "dongbang.rrp.kr"
)

fail=0
for host in "${SITES[@]}"; do
  code="$(curl -sk -o /dev/null -w '%{http_code}' --max-time 12 \
          --resolve "${host}:443:127.0.0.1" "https://${host}/" || echo 000)"
  if [ "$code" = "000" ]; then
    echo "  ✖ ${host} — 응답 없음"
    fail=1
  else
    echo "  · ${host} → ${code}"
  fi
done

if [ "$fail" = "1" ]; then
  echo "  ✖ 이웃 서비스 중 응답하지 않는 것이 있습니다."
  exit 1
fi
echo "  ✔ 이웃 서비스 정상"
