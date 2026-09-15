/* =====================================================================
   routes/stats.js — 대시보드 요약 + 방문 통계 (서버 기록 기반)
   ===================================================================== */
import express from "express";
import { q, q1 } from "../db.js";
import { wrap, int } from "../lib/util.js";
import { requireAuth } from "../lib/auth.js";

const router = express.Router();

/* 대시보드 요약 */
router.get("/summary", requireAuth, wrap(async (_req, res) => {
  const [
    inqTotal, inqNew, inqUnread, inqToday, inqWeek,
    pfTotal, pfHidden, mediaTotal, visitToday, visitWeek, uvToday,
  ] = await Promise.all([
    q1("SELECT COUNT(*) AS n FROM inquiries"),
    q1("SELECT COUNT(*) AS n FROM inquiries WHERE status = 'new'"),
    q1("SELECT COUNT(*) AS n FROM inquiries WHERE read_at IS NULL"),
    q1("SELECT COUNT(*) AS n FROM inquiries WHERE DATE(created_at) = CURDATE()"),
    q1("SELECT COUNT(*) AS n FROM inquiries WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)"),
    q1("SELECT COUNT(*) AS n FROM portfolio_items"),
    q1("SELECT COUNT(*) AS n FROM portfolio_items WHERE visible = 0"),
    q1("SELECT COUNT(*) AS n FROM media"),
    q1("SELECT COUNT(*) AS n FROM visits WHERE day = CURDATE()"),
    q1("SELECT COUNT(*) AS n FROM visits WHERE day >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)"),
    q1("SELECT COUNT(DISTINCT visitor) AS n FROM visits WHERE day = CURDATE()"),
  ]);

  const statusBreakdown = await q(
    "SELECT status, COUNT(*) AS n FROM inquiries GROUP BY status"
  );
  const recentInquiries = await q(
    `SELECT id, code, company, name, service, status, created_at
       FROM inquiries ORDER BY created_at DESC LIMIT 8`
  );
  const recentAudit = await q(
    "SELECT id, user_name, action, entity, entity_id, created_at FROM audit_logs ORDER BY id DESC LIMIT 8"
  );
  const daily = await q(
    `SELECT DATE_FORMAT(day, '%Y-%m-%d') AS d,
            COUNT(*) AS pv, COUNT(DISTINCT visitor) AS uv
       FROM visits WHERE day >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
      GROUP BY day ORDER BY day ASC`
  );
  const inquiryDaily = await q(
    `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') AS d, COUNT(*) AS n
       FROM inquiries WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 13 DAY)
      GROUP BY d ORDER BY d ASC`
  );

  res.json({
    inquiries: {
      total: inqTotal.n, new: inqNew.n, unread: inqUnread.n,
      today: inqToday.n, week: inqWeek.n,
      byStatus: Object.fromEntries(statusBreakdown.map((r) => [r.status, r.n])),
    },
    portfolio: { total: pfTotal.n, hidden: pfHidden.n },
    media: { total: mediaTotal.n },
    visits: { today: visitToday.n, week: visitWeek.n, uvToday: uvToday.n },
    daily,
    inquiryDaily,
    recentInquiries,
    recentAudit,
  });
}));

/* 방문 통계 상세 */
router.get("/visits", requireAuth, wrap(async (req, res) => {
  const days = Math.min(180, Math.max(1, int(req.query.days, 30)));

  const daily = await q(
    `SELECT DATE_FORMAT(day, '%Y-%m-%d') AS d, COUNT(*) AS pv, COUNT(DISTINCT visitor) AS uv
       FROM visits WHERE day >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY day ORDER BY day ASC`,
    [days - 1]
  );
  const byPath = await q(
    `SELECT path, COUNT(*) AS pv, COUNT(DISTINCT visitor) AS uv
       FROM visits WHERE day >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY path ORDER BY pv DESC LIMIT 30`,
    [days - 1]
  );
  const byDevice = await q(
    `SELECT device, COUNT(*) AS pv FROM visits
      WHERE day >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY device`,
    [days - 1]
  );
  const byReferrer = await q(
    `SELECT COALESCE(NULLIF(referrer, ''), '(직접 유입)') AS ref, COUNT(*) AS pv
       FROM visits WHERE day >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      GROUP BY ref ORDER BY pv DESC LIMIT 20`,
    [days - 1]
  );
  const totals = await q1(
    `SELECT COUNT(*) AS pv, COUNT(DISTINCT visitor) AS uv
       FROM visits WHERE day >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
    [days - 1]
  );

  res.json({ days, daily, byPath, byDevice, byReferrer, totals });
}));

export default router;
