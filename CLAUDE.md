# 다인스케치 (DYNESKETCH) — 프로젝트 가이드

## 작업 규칙 (사용자가 지시한 것)

- **모든 작업이 완료되면 자동으로 `git add` → `git commit` → `git push` 실행.**
  사용자가 "git add commit push"라고 매번 말하지 않아도 작업 종료 시점에 알아서 처리.
  단, 깨진 상태로 의도적으로 멈춘 경우(중간 디버깅, 의도가 불명확한 경우)에는 묻기.
- 커밋 메시지는 한글로 작성. 무엇이 왜 바뀌었는지 1–3줄로 요약.
- co-author trailer 등 시그니처는 사용자가 명시적으로 요청하지 않는 한 추가하지 않음.

## 배포

- GitHub: https://github.com/Kevinatkorea/dyne (public)
- 공개 사이트: https://kevinatkorea.github.io/dyne/
- GitHub Pages가 `main` 브랜치 root에서 자동 빌드. 보통 1–2분 내 배포.
- 로컬 개발: `python -m http.server 5173 --bind 127.0.0.1` 백그라운드 실행 중.
  URL: http://127.0.0.1:5173/

## 관리자 페이지

- URL: `<base>/#admin`
- 비밀번호: 기본 `admin1234` (관리자 [사이트설정] 패널에서 변경 가능)
- 모든 데이터 localStorage 저장 (단일 키 `dyne_admin_v1`)
- JSON 내보내기/가져오기로 디바이스 간 이전

## 아키텍처

- 정적 SPA: `index.html`이 React 18 UMD + Babel standalone을 로드하고 모든
  JSX 파일을 `text/babel`로 컴파일·실행.
- 백엔드 없음. GitHub Pages가 정적 파일만 서빙.
- 진짜 성능을 원하면 Vite/esbuild로 JSX 사전 컴파일 필요 (Babel-standalone 제거).

## 디렉터리

- `index.html` — 진입점 + SEO 메타 + JSON-LD
- `app.jsx` — 라우팅·테마·tweaks·페이지 메타 동적 갱신
- `home.jsx` — 메인 페이지 (Hero, 통계, Intro, Services, Equipment, Portfolio, Process, Clients, Awards, CTA, Footer)
- `subpages.jsx` — About/Services/Facility/Portfolio/Contact 5개 서브 페이지
- `components.jsx` — 공통 (Photo, Nav, Logo, SectionHead, Stat, Marquee, Footer, ProcessSteps, ClientWall, EquipmentCard, PortfolioCard, Brand/Branded), RESOURCE 매니페스트, SERVICE_CATEGORIES
- `tweaks-panel.jsx` — 우측 하단 토글 패널 (Hero 스타일·언어·테마·액센트)
- `admin.jsx` — 관리자 모드 (조건부 로드: `#admin`)
- `styles.css` — 사이트 스타일 + 반응형 미디어쿼리
- `tokens.css` — CSS 토큰 (브랜드 컬러·타이포·간격)
- `resource/` — 모든 이미지 자산
  - 카테고리 폴더 (표지디자인, 브로슈어_카탈로그, 리플릿, 포스터, 보고서_자료집, 현수막_배너, 기타인쇄물)
  - 연도별 폴더 (2021/2022/2023_포트폴리오)
  - `equipment/` — 실제 인쇄 장비 사진 (제조사 사이트에서 수집)
  - `top1.jpg ~ top12.jpg` — 페이지별 히어로 배경
  - `building.jpg` — About 페이지 본사 사진

## 핵심 동작

- 한 줄짜리 `index.html`이 6개 페이지를 클라이언트 라우팅으로 노출.
- Hero `press` variant는 top6/top11/top7/top12 4장을 3초 간격 cross-fade 롤링.
- 포트폴리오 카테고리 뷰는 `excludeAt`로 용지규격 참고 이미지 제외 후 표시.
- 모바일 반응형: attribute selector로 인라인 grid-template-columns 패턴 일괄 오버라이드.

## 알려진 제한

- localStorage 기반 admin은 같은 브라우저에서만 동작. 다른 디바이스에서 보려면 JSON export/import.
- 방문 통계도 클라이언트 기반이라 실제 외부 방문 추적은 안 됨. 진짜 통계는 Naver Analytics / GA 연동 필요.
- React UMD + Babel standalone 구조라 초기 로딩 1–2초 (이후 캐시).
