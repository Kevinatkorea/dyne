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
import crypto from "node:crypto";
import esbuild from "esbuild";
import { REPO_ROOT } from "../src/config.js";

const DIST = path.join(REPO_ROOT, "dist");

/* 빌드마다 바뀌는 짧은 식별자 — 캐시 버스팅용 */
const BUILD_ID = crypto.randomBytes(6).toString("hex");

/* index.html 의 로드 순서와 동일해야 한다 */
const ENTRIES = ["tweaks-panel", "components", "home", "subpages", "app", "site-data"];

/* esbuild 공통 옵션.
   minifyIdentifiers 는 끈다 — 파일 간 참조가 전역 이름에 의존하므로
   최상위 이름이 바뀌면 안 된다. */
const TRANSFORM = {
  loader: "jsx",
  target: "es2019",
  minifyWhitespace: true,
  minifySyntax: true,
  minifyIdentifiers: false,
  sourcemap: false,
  legalComments: "none",
};

/* ── 왜 IIFE 로 감싸는가 ───────────────────────────────────────────
   Babel standalone 은 각 스크립트를 eval 로 실행했다. eval 안의
   let/const 는 그 eval 안에만 살아서, 파일마다 최상위에 있는
   `const { useState } = React;` 가 서로 충돌하지 않았다.
   사전 컴파일한 클래식 스크립트는 최상위 const 가 전부 같은 전역
   렉시컬 스코프에 들어가 "Identifier 'useState' has already been
   declared" 로 죽는다.

   그래서 각 파일을 IIFE 로 감싼다. 다만 eval 에서는 `function Foo(){}`
   선언이 전역 객체에 올라갔으므로, 그 동작을 유지하려고 최상위 함수
   선언만 골라 window 에 다시 붙여 준다. (파일 간 참조가 이것에 의존한다)
   ────────────────────────────────────────────────────────────── */
function wrapIife(code, source) {
  const names = Array.from(
    new Set(
      Array.from(source.matchAll(/^function\s+([A-Za-z_$][\w$]*)\s*\(/gm), (m) => m[1])
    )
  );
  const exportLine = names.length
    ? `try{Object.assign(window,{${names.join(",")}});}catch(e){}`
    : "";
  return `(function(){${code}\n${exportLine}})();`;
}

function transformAll() {
  fs.mkdirSync(DIST, { recursive: true });
  const built = [];
  for (const name of ENTRIES) {
    const src = path.join(REPO_ROOT, `${name}.jsx`);
    if (!fs.existsSync(src)) continue;
    const source = fs.readFileSync(src, "utf8");
    const out = esbuild.transformSync(source, TRANSFORM);
    fs.writeFileSync(path.join(DIST, `${name}.js`), wrapIife(out.code, source), "utf8");
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

  /* text/babel *.jsx → 컴파일된 클래식 스크립트.
     ?v=<빌드해시> 를 붙여, 오래 캐시하면서도 배포 즉시 새 파일을 받게 한다. */
  html = html.replace(
    /<script type="text\/babel" src="([\w.-]+)\.jsx"><\/script>/g,
    (m, name) =>
      built.includes(name) ? `<script src="/dist/${name}.js?v=${BUILD_ID}"></script>` : m
  );

  fs.writeFileSync(path.join(DIST, "index.html"), html, "utf8");
}

/* 관리자 SPA 도 같은 방식으로 사전 컴파일 → dist/admin/*.js
   admin/index.html 은 이 파일들이 있으면 Babel 없이 바로 쓴다. */
const ADMIN_ENTRIES = ["api", "ui", "dashboard", "inquiries", "portfolio", "content",
                       "media", "stats", "settings", "sms", "users", "audit", "app"];

function buildAdmin() {
  const srcDir = path.join(REPO_ROOT, "admin", "src");
  const outDir = path.join(DIST, "admin");
  if (!fs.existsSync(srcDir)) return [];
  fs.mkdirSync(outDir, { recursive: true });
  const built = [];
  for (const name of ADMIN_ENTRIES) {
    const src = path.join(srcDir, `${name}.jsx`);
    if (!fs.existsSync(src)) continue;
    const source = fs.readFileSync(src, "utf8");
    const out = esbuild.transformSync(source, TRANSFORM);
    fs.writeFileSync(path.join(outDir, `${name}.js`), wrapIife(out.code, source), "utf8");
    built.push(name);
  }
  return built;
}

const built = transformAll();
buildHtml(built);
const adminBuilt = buildAdmin();

/* 관리자 로더가 읽어서 ?v= 로 붙인다 */
fs.writeFileSync(path.join(DIST, "admin", "build-id.txt"), BUILD_ID, "utf8");

console.log(`[build] dist/ 생성 완료 (build ${BUILD_ID}) — 사이트: ${built.join(", ")}`);
console.log(`[build] dist/admin/ 생성 완료 — ${adminBuilt.length}개 파일`);
