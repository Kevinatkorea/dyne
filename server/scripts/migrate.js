/* =====================================================================
   migrate.js — 스키마 적용 (모두 IF NOT EXISTS, 반복 실행 안전)
   ===================================================================== */
import { applySchema, closePool } from "../src/db.js";

try {
  const n = await applySchema();
  console.log(`[migrate] 스키마 적용 완료 — ${n}개 문`);
} catch (e) {
  console.error("[migrate] 실패:", e.message);
  process.exitCode = 1;
} finally {
  await closePool();
}
