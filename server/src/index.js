/* =====================================================================
   index.js — 다인스케치 홈페이지 서버
     · 공개 사이트 정적 서빙 (dist 우선, 없으면 레포 루트)
     · /uploads  업로드 이미지
     · /api      공개 API
     · /admin    관리자 SPA + /api/admin/* API
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import express from "express";
import compression from "compression";
import cookieParser from "cookie-parser";

import { config, REPO_ROOT } from "./config.js";
import { applySchema, pool } from "./db.js";
import { attachUser } from "./lib/auth.js";
import { HttpError, wrap } from "./lib/util.js";
import { ensureUploadDir } from "./lib/uploads.js";

import publicRoutes, { invalidateSiteCache } from "./routes/public.js";
import authRoutes from "./routes/auth.js";
import inquiryRoutes from "./routes/inquiries.js";
import portfolioRoutes from "./routes/portfolio.js";
import mediaRoutes from "./routes/media.js";
import contentRoutes from "./routes/content.js";
import settingsRoutes, { getSettings } from "./routes/settings.js";
import statsRoutes from "./routes/stats.js";
import userRoutes from "./routes/users.js";
import miscRoutes from "./routes/admin-misc.js";

const app = express();
app.set("trust proxy", true);
app.disable("x-powered-by");

app.use(compression());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));
app.use(cookieParser());
app.use(attachUser);

/* 보안 헤더 (Apache 앞단에 HSTS 등이 이미 있으므로 최소한만) */
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  next();
});

/* 임시 도메인 색인 차단.
   HTTP 헤더라 JS 를 실행하지 않는 크롤러에도 확실히 걸린다.
   정식 도메인으로 옮긴 뒤 [사이트 설정 → SEO] 에서 끄면 된다. */
app.use(wrap(async (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  const s = await getSettings();
  if (s.seo?.noindex) res.setHeader("X-Robots-Tag", "noindex, nofollow");
  next();
}));

/* robots.txt 도 설정을 따른다 (정적 파일보다 먼저 잡는다) */
app.get("/robots.txt", wrap(async (_req, res) => {
  const s = await getSettings();
  res.type("text/plain");
  if (s.seo?.noindex) {
    return res.send(
      "# 임시 도메인 — 색인하지 않습니다.\n" +
      "# 정식 도메인 전환 후 관리자 [사이트 설정 → SEO] 에서 해제하세요.\n" +
      "User-agent: *\nDisallow: /\n"
    );
  }
  res.sendFile(path.join(REPO_ROOT, "robots.txt"));
}));

/* ---- API -------------------------------------------------------- */
app.use("/api", publicRoutes);
app.use("/api/auth", authRoutes);

/* 관리자 쓰기 요청은 공개 사이트 캐시를 무효화한다 */
app.use("/api/admin", (req, _res, next) => {
  if (req.method !== "GET") invalidateSiteCache();
  next();
});
app.use("/api/admin/inquiries", inquiryRoutes);
app.use("/api/admin/portfolio", portfolioRoutes);
app.use("/api/admin/media", mediaRoutes);
app.use("/api/admin/settings", settingsRoutes);
app.use("/api/admin/stats", statsRoutes);
app.use("/api/admin/users", userRoutes);
app.use("/api/admin", contentRoutes);   // /services /equipment /history /clients /awards /hero-slides /notices
app.use("/api/admin", miscRoutes);      // /audit /backup /restore /prune-visits

/* ---- 정적 파일 --------------------------------------------------- */
const DIST = path.join(REPO_ROOT, "dist");
const ADMIN_DIR = path.join(REPO_ROOT, "admin");
const hasDist = fs.existsSync(path.join(DIST, "index.html"));

const YEAR = { maxAge: "365d", immutable: true };

/* HTML 은 캐시하지 않는다 — 이 안의 ?v= 가 나머지 캐시를 결정하므로
   HTML 이 낡으면 배포가 반영되지 않는다. */
const noStore = (res) => res.setHeader("Cache-Control", "no-cache, must-revalidate");

app.use("/uploads", express.static(config.uploadDir, { maxAge: "30d", fallthrough: true }));
app.use("/resource", express.static(path.join(REPO_ROOT, "resource"), YEAR));
/* /dist 는 URL 에 ?v=<빌드ID> 가 붙으므로 오래 캐시해도 안전하다 */
if (hasDist) app.use("/dist", express.static(DIST, YEAR));
app.use("/admin", express.static(ADMIN_DIR, { maxAge: 0, index: false }));

/* 관리자 SPA — /admin, /admin/포트폴리오 등 모두 index.html */
app.get(/^\/admin(\/.*)?$/, (_req, res) => {
  noStore(res);
  res.sendFile(path.join(ADMIN_DIR, "index.html"));
});

/* 공개 사이트 — 빌드본(dist/index.html) 우선 */
app.get("/", (_req, res) => {
  noStore(res);
  res.sendFile(hasDist ? path.join(DIST, "index.html") : path.join(REPO_ROOT, "index.html"));
});

/* 나머지 정적 자산 (styles.css, tokens.css, *.jsx, robots.txt, sitemap.xml …) */
app.use(express.static(REPO_ROOT, {
  index: false,
  maxAge: "1h",
  dotfiles: "ignore",
  setHeaders(res, filePath) {
    if (filePath.endsWith(".jsx")) res.setHeader("Content-Type", "text/plain; charset=utf-8");
  },
}));

/* SPA 폴백 — 해시 라우팅이지만 직접 경로 접근도 살려 둔다.
   (Express 5 는 "*" 문자열 경로를 받지 않는다 — 정규식으로 쓴다) */
app.get(/.*/, (req, res, next) => {
  if (req.path.startsWith("/api/")) return next();
  if (path.extname(req.path)) return next();
  noStore(res);
  res.sendFile(hasDist ? path.join(DIST, "index.html") : path.join(REPO_ROOT, "index.html"));
});

/* ---- 에러 핸들러 ------------------------------------------------- */
app.use((req, res) => {
  res.status(404).json({ error: "요청한 경로를 찾을 수 없습니다.", path: req.path });
});

app.use((err, _req, res, _next) => {
  const status = err instanceof HttpError ? err.status
    : err?.status && err.status >= 400 && err.status < 600 ? err.status
    : err?.code === "LIMIT_FILE_SIZE" ? 413
    : 500;
  if (status >= 500) console.error("[error]", err);
  res.status(status).json({
    error: status >= 500 ? "서버 오류가 발생했습니다." : err.message,
    code: err.code || null,
  });
});

/* ---- 기동 -------------------------------------------------------- */
async function main() {
  ensureUploadDir("general");
  try {
    const n = await applySchema();
    console.log(`[db] 스키마 확인 완료 (${n}개 문)`);
  } catch (e) {
    console.error("[db] 스키마 적용 실패 —", e.message);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`[dynesketch] http://127.0.0.1:${config.port}  (${config.env})`);
    console.log(`[dynesketch] 정적 소스: ${hasDist ? "dist (빌드본)" : "레포 루트 (Babel 런타임)"}`);
  });

  const shutdown = async (sig) => {
    console.log(`\n[dynesketch] ${sig} — 종료합니다.`);
    server.close(async () => {
      try { await pool.end(); } catch { /* ignore */ }
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 8000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main();
