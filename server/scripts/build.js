/* =====================================================================
   build.js — 공개 사이트 사전 컴파일
     · 루트의 *.jsx 를 esbuild 로 JSX만 변환해 dist/*.js 로 출력
       (모듈로 묶지 않는다 — 지금처럼 전역 스코프를 공유하는 클래식
        스크립트 그대로여야 파일 간 참조가 깨지지 않는다)
     · index.html 을 dist/index.html 로 복사하며
       Babel standalone 제거 + React 프로덕션 빌드로 교체
   결과: 초기 로딩에서 Babel 2MB 다운로드와 런타임 컴파일이 사라진다.
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import esbuild from "esbuild";
import { REPO_ROOT } from "../src/config.js";

const DIST = path.join(REPO_ROOT, "dist");

/* index.html 의 로드 순서와 동일해야 한다 */
const ENTRIES = ["tweaks-panel", "components", "home", "subpages", "app", "site-data"];

function transformAll() {
  fs.mkdirSync(DIST, { recursive: true });
  const built = [];
  for (const name of ENTRIES) {
    const src = path.join(REPO_ROOT, `${name}.jsx`);
    if (!fs.existsSync(src)) continue;
    const out = esbuild.transformSync(fs.readFileSync(src, "utf8"), {
      loader: "jsx",
      target: "es2019",
      format: undefined,          // 전역 스코프 유지 (IIFE/ESM 로 감싸지 않음)
      minify: true,
      sourcemap: false,
      legalComments: "none",
    });
    fs.writeFileSync(path.join(DIST, `${name}.js`), out.code, "utf8");
    built.push(name);
  }
  return built;
}

function buildHtml(built) {
  let html = fs.readFileSync(path.join(REPO_ROOT, "index.html"), "utf8");

  /* 상대경로 자산이 SPA 딥링크에서도 깨지지 않도록 */
  html = html.replace(/<head>/, '<head>\n  <base href="/" />');

  /* React 개발빌드 → 프로덕션 빌드, Babel standalone 제거 */
  html = html
    .replace("react@18.3.1/umd/react.development.js", "react@18.3.1/umd/react.production.min.js")
    .replace("react-dom@18.3.1/umd/react-dom.development.js", "react-dom@18.3.1/umd/react-dom.production.min.js")
    .replace(/^[ \t]*<script src="https:\/\/unpkg\.com\/@babel\/standalone[^>]*><\/script>[ \t]*\r?\n/m, "");

  /* text/babel *.jsx → 컴파일된 클래식 스크립트 */
  html = html.replace(
    /<script type="text\/babel" src="([\w.-]+)\.jsx"><\/script>/g,
    (m, name) => (built.includes(name) ? `<script src="/dist/${name}.js"></script>` : m)
  );

  fs.writeFileSync(path.join(DIST, "index.html"), html, "utf8");
}

/* 관리자 SPA 도 같은 방식으로 사전 컴파일 → dist/admin/*.js
   admin/index.html 은 이 파일들이 있으면 Babel 없이 바로 쓴다. */
const ADMIN_ENTRIES = ["api", "ui", "dashboard", "inquiries", "portfolio", "content",
                       "media", "stats", "settings", "users", "audit", "app"];

function buildAdmin() {
  const srcDir = path.join(REPO_ROOT, "admin", "src");
  const outDir = path.join(DIST, "admin");
  if (!fs.existsSync(srcDir)) return [];
  fs.mkdirSync(outDir, { recursive: true });
  const built = [];
  for (const name of ADMIN_ENTRIES) {
    const src = path.join(srcDir, `${name}.jsx`);
    if (!fs.existsSync(src)) continue;
    const out = esbuild.transformSync(fs.readFileSync(src, "utf8"), {
      loader: "jsx",
      target: "es2019",
      minify: true,
      legalComments: "none",
    });
    fs.writeFileSync(path.join(outDir, `${name}.js`), out.code, "utf8");
    built.push(name);
  }
  return built;
}

const built = transformAll();
buildHtml(built);
const adminBuilt = buildAdmin();
console.log(`[build] dist/ 생성 완료 — 사이트: ${built.join(", ")}`);
console.log(`[build] dist/admin/ 생성 완료 — ${adminBuilt.length}개 파일`);
