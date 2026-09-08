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

router.get("/", requireAuth, wrap(async (_req, res) => {
  res.json({ settings: await loadSettings(), defaults: SETTING_DEFAULTS });
}));

/* 그룹 단위 저장 — { company: {...}, seo: {...} } */
router.put("/", requireAuth, requireWrite, wrap(async (req, res) => {
  const body = req.body || {};
  const keys = Object.keys(body);
  if (!keys.length) throw bad("저장할 설정이 없습니다.");

  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(SETTING_DEFAULTS, key)) {
      throw bad(`알 수 없는 설정 그룹입니다: ${key}`);
    }
    await exec(
      "INSERT INTO settings (`key`, value, updated_by) VALUES (?, ?, ?) " +
      "ON DUPLICATE KEY UPDATE value = VALUES(value), updated_by = VALUES(updated_by)",
      [key, JSON.stringify(body[key]), req.user.id]
    );
  }
  invalidateSettingsCache();
  await audit(req, "update", "settings", null, { keys });
  res.json({ settings: await loadSettings() });
}));

/* 기본값으로 되돌리기 */
router.post("/reset", requireAuth, requireWrite, wrap(async (req, res) => {
  const key = String(req.body?.key || "");
  if (!Object.prototype.hasOwnProperty.call(SETTING_DEFAULTS, key)) throw bad("알 수 없는 설정 그룹입니다.");
  await exec("DELETE FROM settings WHERE `key` = ?", [key]);
  invalidateSettingsCache();
  await audit(req, "reset", "settings", key);
  res.json({ settings: await loadSettings() });
}));

export default router;
