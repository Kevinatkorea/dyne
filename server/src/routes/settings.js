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
  await audit(req, "update", "settings", null, { keys });
  res.json({ settings: await loadSettings() });
}));

/* 기본값으로 되돌리기 */
router.post("/reset", requireAuth, requireWrite, wrap(async (req, res) => {
  const key = String(req.body?.key || "");
  if (!Object.prototype.hasOwnProperty.call(SETTING_DEFAULTS, key)) throw bad("알 수 없는 설정 그룹입니다.");
  await exec("DELETE FROM settings WHERE `key` = ?", [key]);
  await audit(req, "reset", "settings", key);
  res.json({ settings: await loadSettings() });
}));

export default router;
