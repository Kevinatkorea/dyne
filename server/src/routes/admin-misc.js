/* =====================================================================
   routes/admin-misc.js — 감사 로그 · 백업/복원
   ===================================================================== */
import express from "express";
import { q, q1, exec, tx } from "../db.js";
import { wrap, int, bad, toCsv } from "../lib/util.js";
import { requireAuth, requireRole, audit } from "../lib/auth.js";
import { loadSettings } from "./settings.js";

const router = express.Router();

/* ---- 감사 로그 -------------------------------------------------- */
router.get("/audit", requireAuth, wrap(async (req, res) => {
  const page = Math.max(1, int(req.query.page, 1));
  const size = Math.min(200, Math.max(10, int(req.query.size, 50)));
  const where = [];
  const params = [];
  if (req.query.action) { where.push("action = ?"); params.push(String(req.query.action).slice(0, 60)); }
  if (req.query.entity) { where.push("entity = ?"); params.push(String(req.query.entity).slice(0, 60)); }
  if (int(req.query.user)) { where.push("user_id = ?"); params.push(int(req.query.user)); }
  const whereSql = where.length ? " WHERE " + where.join(" AND ") : "";

  const items = await q(
    `SELECT * FROM audit_logs${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, size, (page - 1) * size]
  );
  const cnt = await q1(`SELECT COUNT(*) AS n FROM audit_logs${whereSql}`, params);
  res.json({ items, total: cnt.n, page, size, pages: Math.max(1, Math.ceil(cnt.n / size)) });
}));

router.get("/audit/export.csv", requireAuth, requireRole("super"), wrap(async (_req, res) => {
  const rows = await q("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 10000");
  const csv = toCsv(
    [
      { label: "일시", get: (r) => new Date(r.created_at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) },
      { label: "사용자", key: "user_name" },
      { label: "동작", key: "action" },
      { label: "대상", key: "entity" },
      { label: "대상ID", key: "entity_id" },
      { label: "IP", key: "ip" },
      { label: "상세", key: "detail" },
    ],
    rows
  );
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="dynesketch-audit.csv"');
  res.send(csv);
}));

/* ---- 백업 / 복원 ------------------------------------------------ */
/* 업로드 파일(바이너리)은 제외한 "콘텐츠 전체"를 JSON 한 덩어리로 뽑는다.
   실제 이미지는 서버 uploads/ 디렉터리를 별도 백업(deploy/backup.sh). */
const BACKUP_TABLES = [
  "portfolio_items", "services", "equipment", "history",
  "clients", "awards", "hero_slides", "notices", "settings", "media",
];

router.get("/backup", requireAuth, requireRole("super"), wrap(async (req, res) => {
  const data = {};
  for (const t of BACKUP_TABLES) data[t] = await q(`SELECT * FROM \`${t}\``);
  if (req.query.inquiries === "1") {
    data.inquiries = await q("SELECT * FROM inquiries");
    data.inquiry_events = await q("SELECT * FROM inquiry_events");
  }
  await audit(req, "backup", "system", null, { tables: Object.keys(data) });

  const payload = {
    app: "dynesketch",
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: await loadSettings(),
    data,
  };
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="dynesketch-backup-${new Date().toISOString().slice(0, 10)}.json"`
  );
  res.send(JSON.stringify(payload, null, 2));
}));

router.post("/restore", requireAuth, requireRole("super"), wrap(async (req, res) => {
  const payload = req.body;
  if (!payload || payload.app !== "dynesketch" || !payload.data) {
    throw bad("다인스케치 백업 파일이 아닙니다.");
  }
  const mode = payload.mode === "replace" || req.query.mode === "replace" ? "replace" : "merge";
  const restored = {};

  await tx(async (conn) => {
    for (const t of BACKUP_TABLES) {
      const rows = payload.data[t];
      if (!Array.isArray(rows)) continue;
      if (mode === "replace") await conn.query(`DELETE FROM \`${t}\``);
      let n = 0;
      for (const row of rows) {
        const keys = Object.keys(row);
        if (!keys.length) continue;
        const ph = keys.map(() => "?").join(",");
        const cols = keys.map((k) => `\`${k}\``).join(",");
        const upd = keys.filter((k) => k !== "id").map((k) => `\`${k}\` = VALUES(\`${k}\`)`).join(",");
        await conn.query(
          `INSERT INTO \`${t}\` (${cols}) VALUES (${ph})` +
          (upd ? ` ON DUPLICATE KEY UPDATE ${upd}` : ""),
          keys.map((k) => row[k])
        );
        n++;
      }
      restored[t] = n;
    }
  });
  await audit(req, "restore", "system", null, { mode, restored });
  res.json({ ok: true, mode, restored });
}));

/* 위험 작업 — 방문 로그 정리 */
router.post("/prune-visits", requireAuth, requireRole("super"), wrap(async (req, res) => {
  const days = Math.min(3650, Math.max(30, int(req.body?.keepDays, 365)));
  const r = await exec("DELETE FROM visits WHERE day < DATE_SUB(CURDATE(), INTERVAL ? DAY)", [days]);
  await audit(req, "prune", "visits", null, { keepDays: days, deleted: r.affectedRows });
  res.json({ ok: true, deleted: r.affectedRows });
}));

export default router;
