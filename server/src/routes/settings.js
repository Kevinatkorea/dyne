/* =====================================================================
   routes/settings.js — 사이트 설정 (회사정보 · 연락처 · SEO · 푸터 · 기능토글)
   settings 테이블에 key → JSON 으로 저장. 기본값은 defaults.js.
   ===================================================================== */
import express from "express";
import { q, exec } from "../db.js";
import { wrap, bad } from "../lib/util.js";
import { requireAuth, requireWrite, audit } from "../lib/auth.js";
import { SETTING_DEFAULTS } from "../lib/defaults.js";

const router = express.Router();

/* 요청마다 DB 를 때리지 않도록 짧게 캐시한다.
   설정 저장 시 invalidateSettingsCache() 로 즉시 비운다. */
let cache = { at: 0, value: null };
const CACHE_MS = 15 * 1000;
export const invalidateSettingsCache = () => { cache = { at: 0, value: null }; };

/** 캐시된 설정 (헤더·robots.txt 처럼 매 요청 필요한 곳에서 사용) */
export async function getSettings() {
  if (cache.value && Date.now() - cache.at < CACHE_MS) return cache.value;
  const value = await loadSettings();
  cache = { at: Date.now(), value };
  return value;
}

/** DB 값 + 기본값 병합 */
export async function loadSettings() {
  const rows = await q("SELECT `key`, value FROM settings");
  const out = JSON.parse(JSON.stringify(SETTING_DEFAULTS));
  for (const r of rows) {
    try {
      const parsed = JSON.parse(r.value);
      out[r.key] = (parsed && typeof parsed === "object" && !Array.isArray(parsed) && out[r.key] && typeof out[r.key] === "object" && !Array.isArray(out[r.key]))
        ? { ...out[r.key], ...parsed }
        : parsed;
    } catch {
      out[r.key] = r.value;
    }
  }
  return out;
}

/* 비밀값 — 읽을 때 내보내지 않는다. 저장 시 빈 값이면 기존 값을 유지한다. */
const SECRET_FIELDS = { sms: ["apiKey"] };

function maskSecrets(settings) {
  const out = JSON.parse(JSON.stringify(settings));
  const meta = {};
  for (const [group, fields] of Object.entries(SECRET_FIELDS)) {
    if (!out[group]) continue;
    meta[group] = {};
    for (const f of fields) {
      const v = String(out[group][f] || "");
      meta[group][f] = { set: !!v, hint: v ? `····${v.slice(-4)}` : "" };
      out[group][f] = "";
    }
  }
  return { settings: out, meta };
}

router.get("/", requireAuth, wrap(async (_req, res) => {
  const { settings, meta } = maskSecrets(await loadSettings());
  res.json({ settings, meta, defaults: SETTING_DEFAULTS });
}));

/* 그룹 단위 저장 — { company: {...}, seo: {...} } */
router.put("/", requireAuth, requireWrite, wrap(async (req, res) => {
  const body = req.body || {};
  const keys = Object.keys(body);
  if (!keys.length) throw bad("저장할 설정이 없습니다.");

  const current = await loadSettings();

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(SETTING_DEFAULTS, key)) {
      throw bad(`알 수 없는 설정 그룹입니다: ${key}`);
    }
    /* 비밀값이 비어 있으면 지우려는 게 아니라 "그대로 두기"로 본다.
       (화면에서 읽어오지 않으므로 빈 값으로 돌아오는 게 정상이다) */
    for (const f of SECRET_FIELDS[key] || []) {
      if (body[key] && typeof body[key] === "object" && !String(body[key][f] || "").trim()) {
        body[key][f] = current[key]?.[f] || "";
      }
    }
    await exec(
      "INSERT INTO settings (`key`, value, updated_by) VALUES (?, ?, ?) " +
      "ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)",
      [key, JSON.stringify(body[key]), req.user.id]
    );
  }
  invalidateSettingsCache();
  await audit(req, "update", "settings", null, { keys });
  res.json(maskSecrets(await loadSettings()));
}));

/* 기본값으로 되돌리기 */
router.post("/reset", requireAuth, requireWrite, wrap(async (req, res) => {
  const key = String(req.body?.key || "");
  if (!Object.prototype.hasOwnProperty.call(SETTING_DEFAULTS, key)) throw bad("알 수 없는 설정 그룹입니다.");
  await exec("DELETE FROM settings WHERE `key` = ?", [key]);
  invalidateSettingsCache();
  await audit(req, "reset", "settings", key);
  res.json(maskSecrets(await loadSettings()));
}));

export default router;
