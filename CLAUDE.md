# 다인스케치 (DYNESKETCH) — 프로젝트 가이드

## 작업 규칙 (사용자가 지시한 것)

- **모든 작업이 완료되면 자동으로 `git add` → `git commit` → `git push` 실행.**
  사용자가 "git add commit push"라고 매번 말하지 않아도 작업 종료 시점에 알아서 처리.
  단, 깨진 상태로 의도적으로 멈춘 경우(중간 디버깅, 의도가 불명확한 경우)에는 묻기.
- 커밋 메시지는 한글로 작성. 무엇이 왜 바뀌었는지 1–3줄로 요약.
- co-author trailer 등 시그니처는 사용자가 명시적으로 요청하지 않는 한 추가하지 않음.

## 배포

- **운영 서버**: 49.247.41.172 (`website` 계정, sudo 없음 — root 는 `su -l`)
  - **라이브**: https://dy.mostvisual.co.kr/ · 관리자 https://dy.mostvisual.co.kr/admin/ (HTTPS, 인증서 자동갱신)
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
대시보드 · 방문통계 · **견적요청** · **문자 알림** · **포트폴리오(드래그앤드롭 정렬·업로드)** ·
사업영역 · 보유장비 · 연혁 · 고객사 · 수상인증 · 상단배경 · 공지팝업 · 미디어 ·
사이트설정 · 관리자계정 · 백업복원 · 감사로그

## 고객사 로고

공개 사이트의 CLIENTS 영역은 로고를 **회색으로, 이름 위에, 칸 절반 크기로 가운데** 놓는다.
로고 주소는 이 순서로 정해진다:

1. 관리자 [고객사]에서 **직접 올린 로고**(`logo_src`)
2. 없으면 **홈페이지 주소**(`url`)로 `/api/logo?d=<도메인>` 중계
3. 둘 다 없거나 못 찾으면 **글자만**

`/api/logo` 가 왜 서버 중계인가 — 구글 파비콘은 로고가 없어도 "지구본 기본 아이콘"을
본문에 실어 주기 때문에 브라우저 `<img onError>` 가 걸리지 않는다. 그 아이콘을
해시로 걸러 **진짜 404** 로 바꿔야 글자만 깔끔히 남는다. 기본 아이콘 해시는 존재하지
않는 도메인으로 한 번 물어 학습하며, **모든 요청이 그 학습을 기다린다**(안 기다리면
동시 요청 일부가 지구본을 진짜 로고로 캐시해 버린다 — 실제로 겪은 버그).
디스크 캐시는 `uploads/.logocache`, 응답 캐시는 1일.

⚠ SSRF 방지: 고객사가 입력한 주소로 **직접 요청하지 않는다.** 고정된 구글
엔드포인트에 도메인만 넘기고, 도메인 형식도 정규식으로 제한한다.

자동 로고는 파비콘이라 화질·모양이 들쭉날쭉하다. 제대로 된 로고는 관리자에서
직접 올리면 그쪽이 우선한다.

## 문자 알림 (알리고)

관리자 **[문자 알림]** 에서 설정한다. 상담신청(견적요청)이 접수되면 두 갈래로 발송:

1. **신청자** — 폼에 적은 연락처로 접수 확인 문자
2. **담당자** — 지정한 번호들로 새 요청 알림

각각 따로 켜고 끄며, 본문은 `{code} {company} {name} {phone} {email} {service}
{quantity} {deadline} {budget} {message}` 자리표시자로 편집한다.

- 발신번호는 **알리고에 사전 등록·승인된 번호**만 쓸 수 있다.
- 90바이트 이하는 SMS, 초과하면 LMS(요금이 다르다). 화면이 실시간으로 알려 준다.
- **테스트 모드**를 켜면 실제 발송 없이 성공 응답만 받는다(요금 미차감).
- 발송 성공/실패는 전부 `sms_logs` 에 남고 [발송 이력]에서 본다.

구현 원칙:
- `server/src/lib/sms.js` 는 **절대 throw 하지 않는다.** 알리고가 느리거나 죽어도
  견적요청 접수는 성공해야 하므로, 접수 응답을 먼저 보낸 뒤 문자를 보낸다.
- **API 키는 비밀값이다.** `/api/site`(공개)는 `PUBLIC_SETTING_KEYS` 화이트리스트로
  제한돼 있어 `sms` 그룹이 아예 나가지 않는다. 관리자 화면에도 키를 돌려주지 않고
  끝 4자리만 표시하며, 빈 값으로 저장하면 기존 키를 유지한다.
  **설정 그룹을 새로 추가할 때 공개해야 한다면 `PUBLIC_SETTING_KEYS` 에 명시적으로
  넣어야 한다** (기본은 비공개).

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

- **검색엔진 색인은 일부러 막아 두었다.** 임시 도메인이 색인되면 정식 도메인 전환 후
  중복 콘텐츠가 되기 때문. `X-Robots-Tag` 헤더 + `robots.txt` 이중 차단이며,
  관리자 [사이트 설정 → SEO → noindex] 해제로 즉시 풀린다.
- `dynesketch.co.kr` 은 현재 CloudFront(13.225.x)를 가리킨다. 전환 절차는 `deploy/RUNBOOK.md`.
- GitHub Pages 는 아직 살아 있다. 정식 도메인 전환 후 정리 여부를 결정한다.
- 견적요청 접수 알림은 **문자(알리고)로 발송한다.** 메일 발송은 아직 없다(설정 필드만 존재 — SMTP 연동 필요).
- 이미지 썸네일 생성 없음. 원본을 그대로 서빙한다 (네이티브 모듈 의존 회피).
- 방문 통계는 자체 집계라 검색엔진 유입 상세는 알 수 없다. 필요하면 GA4/Naver Analytics 를
  [사이트 설정 → SEO] 의 `gaId`/`gtmId` 로 연동.
