# 다인스케치 (DYNESKETCH) — 프로젝트 가이드

## 작업 규칙 (사용자가 지시한 것)

- **모든 작업이 완료되면 자동으로 `git add` → `git commit` → `git push` 실행.**
  사용자가 "git add commit push"라고 매번 말하지 않아도 작업 종료 시점에 알아서 처리.
  단, 깨진 상태로 의도적으로 멈춘 경우(중간 디버깅, 의도가 불명확한 경우)에는 묻기.
- 커밋 메시지는 한글로 작성. 무엇이 왜 바뀌었는지 1–3줄로 요약.
- co-author trailer 등 시그니처는 사용자가 명시적으로 요청하지 않는 한 추가하지 않음.

## 배포

- **운영 서버**: 49.247.41.172 (`website` 계정, sudo 없음 — root 는 `su -l`)
  - 임시 주소: https://dy.mostvisual.co.kr/ · 관리자 https://dy.mostvisual.co.kr/admin/
  - 향후 정식 도메인: https://dynesketch.co.kr/
  - 앱 경로 `/home/website/dy.mostvisual.co.kr` · 포트 3410 · PM2 `dynesketch-web` · DB `dyne`
  - 배포: `git push` 후 `python scripts/deploy.py` — 자세한 절차는 `deploy/RUNBOOK.md`
- GitHub: https://github.com/Kevinatkorea/dyne (public)
- (구) GitHub Pages https://kevinatkorea.github.io/dyne/ — 자체 서버로 이전됨
- 로컬 개발: `cd server && npm install && npm run dev` → http://127.0.0.1:3410/
  (MariaDB 가 필요합니다. DB 없이 정적 확인만 하려면
   `python -m http.server 5173` 로 레포 루트를 띄우면 기본값으로 동작합니다.)

## 관리자 페이지

- URL: `https://dy.mostvisual.co.kr/admin/` (예전 `#admin` 은 자동 리다이렉트)
- 계정: 이메일 + 비밀번호. 초기 계정은 `server/.env` 의 `SEED_ADMIN_*` (배포 시 무작위 생성)
- 권한 3단계: `super`(전체) / `staff`(콘텐츠·견적 관리) / `viewer`(조회만)
- 데이터는 전부 **서버 MariaDB** 에 저장 — 디바이스가 달라도 같은 내용이 보입니다.
  (localStorage 기반이던 예전 `admin.jsx` 는 제거)

관리자 화면:
대시보드 · 방문통계 · **견적요청** · **포트폴리오(드래그앤드롭 정렬·업로드)** ·
사업영역 · 보유장비 · 연혁 · 고객사 · 수상인증 · 상단배경 · 공지팝업 · 미디어 ·
사이트설정 · 관리자계정 · 백업복원 · 감사로그

## 아키텍처

- **공개 사이트**: 정적 SPA. `index.html` 이 React 18 UMD + 각 JSX 를 로드.
  배포본은 `server/scripts/build.js` 가 esbuild 로 JSX 를 사전 컴파일해
  `dist/` 에 넣고 Babel standalone 을 제거한다 (초기 로딩 2MB 절약).
- **서버**: Node 20 + Express 5 + MariaDB(mysql2). `server/` 아래.
  공개 사이트 정적 서빙 + `/api` 공개 API + `/api/admin/*` 관리자 API 를 한 프로세스가 담당.
- **관리자**: `admin/` — React UMD SPA. 빌드본(`dist/admin/`)이 있으면 그것을,
  없으면 Babel standalone 으로 그 자리에서 컴파일한다 (빌드 없이도 동작).
- 공개 사이트는 `/api/site` 를 한 번 받아 관리자가 저장한 내용을 반영하고,
  **서버가 없거나 데이터가 비면 각 jsx 의 하드코딩 기본값으로 그대로 동작**한다.

## 디렉터리

- `index.html` — 진입점 + SEO 메타 + JSON-LD
- `site-data.jsx` — **`/api/site` 연결 계층**. `window.site*` 헬퍼로 "DB 값 or 기본값" 제공
- `app.jsx` — 라우팅·테마·tweaks·페이지 메타·방문기록
- `home.jsx` — 메인 페이지
- `subpages.jsx` — About/Services/Facility/Portfolio/Contact + 견적요청 폼(→ `/api/inquiries`)
- `components.jsx` — 공통 컴포넌트, RESOURCE 매니페스트(기본값), SERVICE_CATEGORIES
- `tweaks-panel.jsx` — 우측 하단 튜닝 패널 (운영에서는 사이트설정에서 꺼 둠)
- `styles.css` / `tokens.css`
- `resource/` — 기존 이미지 자산 (git 관리)
- `admin/` — 관리자 SPA (`index.html`, `admin.css`, `src/*.jsx`)
- `server/` — Express 서버
  - `src/index.js` 진입점 · `src/db.js` · `src/schema.sql` · `src/config.js`
  - `src/lib/` auth · crud(정렬 지원 공용 CRUD) · uploads · util · defaults
  - `src/routes/` public · auth · inquiries · portfolio · media · content · settings · stats · users · admin-misc
  - `scripts/` build.js(esbuild) · migrate.js · seed.js
- `deploy/` — ecosystem · deploy.sh · Apache vhost 2종 · setup_db.sql · backup.sh · RUNBOOK.md
- `scripts/deploy.py` — Windows → 서버 원격 배포
- `uploads/` — 관리자 업로드본 (**gitignore** · 레포 밖에 두어 `git reset --hard` 에도 안전)

## 핵심 동작

- 견적요청 폼 → `POST /api/inquiries` → 관리자 [견적요청]에 즉시 표시 (접수번호 `DY-YYMMDD-XXXX`).
- 포트폴리오는 DB `portfolio_items` 가 원본. 시드가 `resource/` 를 훑어
  기존 매니페스트와 **동일한 순서·구성**으로 채우므로 이전 후 화면이 같다.
- 포트폴리오 정렬은 필터(카테고리/연도)를 걸어 놓고 바꿔도 전체 순서가 엉키지 않는다
  — 해당 항목들이 원래 차지하던 `sort_order` 자리만 재배치한다.
- 방문 통계는 서버가 직접 집계. 봇 제외, 방문자 식별은 IP·UA 해시만 저장.
- 모든 관리자 변경은 `audit_logs` 에 남는다.

## 알려진 제한 / 다음 할 일

- **DNS**: `dy.mostvisual.co.kr` A 레코드가 필요하다. 없으면 HTTPS 인증서를 발급할 수 없다.
- `dynesketch.co.kr` 은 현재 CloudFront(13.225.x)를 가리킨다. 전환 시 A 레코드 변경 필요.
- 견적요청 접수 알림 메일은 아직 발송하지 않는다 (설정 필드만 있음 — SMTP 연동 필요).
- 이미지 썸네일 생성 없음. 원본을 그대로 서빙한다 (네이티브 모듈 의존 회피).
- 방문 통계는 자체 집계라 검색엔진 유입 상세는 알 수 없다. 필요하면 GA4/Naver Analytics 를
  [사이트 설정 → SEO] 의 `gaId`/`gtmId` 로 연동.
