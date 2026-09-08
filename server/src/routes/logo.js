/* =====================================================================
   routes/logo.js — 고객사 로고 중계  GET /api/logo?d=<도메인>

   왜 서버가 중계하나:
     · 구글 파비콘은 로고가 없어도 200/404 로 "지구본 기본 아이콘"을 돌려준다.
       브라우저는 그 이미지를 그려 버려서 <img onError> 가 걸리지 않는다.
       → 기본 아이콘을 골라내 진짜 404 로 바꿔야 글자만 깔끔히 남는다.
     · 방문자 IP 가 구글로 직접 나가지 않는다.
     · 디스크에 캐시해 두 번째부터는 외부 호출이 없다.

   ⚠ SSRF 방지: 고객사가 입력한 주소로 직접 요청하지 않는다.
     고정된 구글 엔드포인트에 도메인을 질의 문자열로만 넘기고,
     도메인 형식도 화이트리스트 정규식으로 제한한다.
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import express from "express";
import { config } from "../config.js";
import { wrap } from "../lib/util.js";

const router = express.Router();

const CACHE_DIR = path.join(config.uploadDir, ".logocache");
const SRC = (d) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(d)}&sz=128`;
const TIMEOUT_MS = 8000;
const NEG_TTL_MS = 24 * 60 * 60 * 1000;   // 못 찾은 도메인은 하루 동안 재시도 안 함

/* 도메인만 허용 — 경로·질의·프로토콜 문자는 전부 거른다 */
const DOMAIN_RE = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function cleanDomain(v) {
  let d = String(v || "").trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "").replace(/^www\./, "");
  d = d.split("/")[0].split("?")[0].split("#")[0].split(":")[0];
  if (d.length > 253 || !DOMAIN_RE.test(d)) return null;
  /* 숫자로만 이루어진 주소(IP)는 거른다 — 로고가 있을 수 없다 */
  if (/^[0-9.]+$/.test(d)) return null;
  /* TLD 는 두 글자 이상의 문자여야 한다 */
  if (!/\.[a-z]{2,}$/.test(d)) return null;
  return d;
}

/* 구글이 "로고 없음"일 때 주는 기본 아이콘의 해시.
   구글이 아이콘을 바꿔도 따라가도록, 존재하지 않는 도메인으로 한 번 물어 학습한다. */
let genericHashes = new Set(["b8a0bf372c76a5f0d0f0b6e5ea2f1e5f"]);  // 최초 관측값(대체용)
let genericLearnedAt = 0;

async function learnGeneric() {
  if (Date.now() - genericLearnedAt < 6 * 60 * 60 * 1000) return;
  genericLearnedAt = Date.now();
  try {
    const buf = await fetchIcon("no-such-domain-for-logo-probe-9f3a1.invalid");
    if (buf) genericHashes.add(md5(buf));
  } catch { /* 실패해도 기본 해시로 동작 */ }
}

const md5 = (buf) => crypto.createHash("md5").update(buf).digest("hex");

async function fetchIcon(domain) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(SRC(domain), {
      signal: ac.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; dynesketch-logo/1.0)" },
    });
    const buf = Buffer.from(await res.arrayBuffer());
    /* 404 여도 본문에 기본 아이콘이 실려 오므로 상태만으로 판단하지 않는다 */
    return buf.length ? buf : null;
  } finally {
    clearTimeout(timer);
  }
}

function cachePath(domain, ext) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  return path.join(CACHE_DIR, `${md5(domain)}${ext}`);
}

router.get("/", wrap(async (req, res) => {
  const domain = cleanDomain(req.query.d);
  if (!domain) return res.status(400).json({ error: "도메인 형식이 올바르지 않습니다." });

  const hit = cachePath(domain, ".png");
  const miss = cachePath(domain, ".miss");

  /* 캐시 적중.
     ⚠ res.sendFile 을 쓰면 안 된다 — 캐시 경로에 점 디렉터리(.logocache)가
       있어서 Express 의 dotfiles:'ignore' 기본값에 걸려 404 가 된다.
       파일이 몇 KB라 그냥 읽어 보낸다. */
  if (fs.existsSync(hit)) {
    try {
      const buf = fs.readFileSync(hit);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "public, max-age=604800");   // 7일
      return res.end(buf);
    } catch { /* 읽기 실패하면 아래에서 다시 받아 온다 */ }
  }
  /* 최근에 못 찾은 도메인 — 다시 물어보지 않는다 */
  if (fs.existsSync(miss) && Date.now() - fs.statSync(miss).mtimeMs < NEG_TTL_MS) {
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(404).end();
  }

  await learnGeneric();

  let buf = null;
  try {
    buf = await fetchIcon(domain);
  } catch {
    buf = null;
  }

  /* 못 찾았거나 기본 지구본이면 404 — 화면에서는 글자만 남는다 */
  if (!buf || genericHashes.has(md5(buf))) {
    try { fs.writeFileSync(miss, ""); } catch { /* noop */ }
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(404).end();
  }

  try { fs.writeFileSync(hit, buf); } catch (e) {
    console.error("[logo] 캐시 저장 실패:", e.message);
  }
  res.setHeader("Content-Type", "image/png");
  res.setHeader("Cache-Control", "public, max-age=604800");
  res.end(buf);
}));

export default router;
