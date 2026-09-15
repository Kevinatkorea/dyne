/* =====================================================================
   routes/inquiries.js — 견적요청 관리 (관리자)
   목록/검색/필터/페이지네이션 · 상세 · 상태·담당·메모 · 처리이력 · CSV
   ===================================================================== */
import express from "express";
import { q, q1, exec } from "../db.js";
import { wrap, notFound, bad, int, s, pick, toCsv, bool01 } from "../lib/util.js";
import { requireAuth, requireWrite, audit } from "../lib/auth.js";

const router = express.Router();

export const STATUSES = ["new", "reviewing", "quoted", "won", "lost", "closed"];
export const STATUS_LABEL = {
  new: "신규", reviewing: "검토중", quoted: "견적발송",
  won: "수주", lost: "실주", closed: "종료",
};
const PRIORITIES = ["low", "normal", "high"];

/* 목록 조건 조립 — 목록/CSV 공용 */
function buildWhere(query) {
  const where = [];
  const params = [];

  if (query.status && STATUSES.includes(query.status)) {
    where.push("i.status = ?");
    params.push(query.status);
  }
  if (query.priority && PRIORITIES.includes(query.priority)) {
    where.push("i.priority = ?");
    params.push(query.priority);
  }
  if (query.assignee === "none") {
    where.push("i.assignee_id IS NULL");
  } else if (int(query.assignee)) {
    where.push("i.assignee_id = ?");
    params.push(int(query.assignee));
  }
  if (query.service) {
    where.push("i.service = ?");
    params.push(String(query.service).slice(0, 80));
  }
  if (query.starred === "1") where.push("i.starred = 1");
  if (query.unread === "1") where.push("i.read_at IS NULL");

  if (query.from) { where.push("i.created_at >= ?"); params.push(`${String(query.from).slice(0, 10)} 00:00:00`); }
  if (query.to)   { where.push("i.created_at <= ?"); params.push(`${String(query.to).slice(0, 10)} 23:59:59`); }

  if (query.q) {
    const like = `%${String(query.q).slice(0, 60)}%`;
    where.push("(i.company LIKE ? OR i.name LIKE ? OR i.phone LIKE ? OR i.email LIKE ? OR i.message LIKE ? OR i.code LIKE ?)");
    params.push(like, like, like, like, like, like);
  }
  return { sql: where.length ? " WHERE " + where.join(" AND ") : "", params };
}

/* 목록 */
router.get("/", requireAuth, wrap(async (req, res) => {
  const page = Math.max(1, int(req.query.page, 1));
  const size = Math.min(100, Math.max(5, int(req.query.size, 20)));
  const { sql: whereSql, params } = buildWhere(req.query);

  const sortMap = {
    created_desc: "i.created_at DESC",
    created_asc: "i.created_at ASC",
    updated_desc: "i.updated_at DESC",
    status: "FIELD(i.status,'new','reviewing','quoted','won','lost','closed'), i.created_at DESC",
  };
  const orderBy = sortMap[req.query.sort] || sortMap.created_desc;

  const rows = await q(
    `SELECT i.*, u.name AS assignee_name
       FROM inquiries i
       LEFT JOIN users u ON u.id = i.assignee_id
       ${whereSql}
      ORDER BY i.starred DESC, ${orderBy}
      LIMIT ? OFFSET ?`,
    [...params, size, (page - 1) * size]
  );
  const cnt = await q1(`SELECT COUNT(*) AS n FROM inquiries i${whereSql}`, params);

  /* 상태별 집계 — 탭 뱃지용 (필터와 무관하게 전체 기준) */
  const byStatus = await q("SELECT status, COUNT(*) AS n FROM inquiries GROUP BY status");
  const counts = Object.fromEntries(STATUSES.map((k) => [k, 0]));
  byStatus.forEach((r) => { counts[r.status] = r.n; });
  const unread = await q1("SELECT COUNT(*) AS n FROM inquiries WHERE read_at IS NULL");

  res.json({
    items: rows,
    total: cnt.n,
    page,
    size,
    pages: Math.max(1, Math.ceil(cnt.n / size)),
    counts,
    unread: unread.n,
  });
}));

/* CSV 내보내기 */
router.get("/export.csv", requireAuth, wrap(async (req, res) => {
  const { sql: whereSql, params } = buildWhere(req.query);
  const rows = await q(
    `SELECT i.*, u.name AS assignee_name
       FROM inquiries i LEFT JOIN users u ON u.id = i.assignee_id
       ${whereSql} ORDER BY i.created_at DESC LIMIT 5000`,
    params
  );
  const fmt = (d) => (d ? new Date(d).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "");
  const csv = toCsv(
    [
      { label: "접수번호", key: "code" },
      { label: "접수일시", get: (r) => fmt(r.created_at) },
      { label: "상태", get: (r) => STATUS_LABEL[r.status] || r.status },
      { label: "회사명", key: "company" },
      { label: "담당자", key: "name" },
      { label: "연락처", key: "phone" },
      { label: "이메일", key: "email" },
      { label: "서비스", key: "service" },
      { label: "수량", key: "quantity" },
      { label: "납기", key: "deadline" },
      { label: "예산", key: "budget" },
      { label: "내용", key: "message" },
      { label: "우리담당", key: "assignee_name" },
      { label: "견적금액", key: "amount" },
      { label: "내부메모", key: "memo" },
    ],
    rows
  );
  await audit(req, "export", "inquiry", null, { count: rows.length });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="dynesketch-inquiries-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  res.send(csv);
}));

/* 상세 — 열람 시 read_at 기록 */
router.get("/:id", requireAuth, wrap(async (req, res, next) => {
  const id = int(req.params.id);
  const item = await q1(
    `SELECT i.*, u.name AS assignee_name
       FROM inquiries i LEFT JOIN users u ON u.id = i.assignee_id
      WHERE i.id = ?`,
    [id]
  );
  if (!item) return next(notFound("견적요청을 찾을 수 없습니다."));

  if (!item.read_at) {
    await exec("UPDATE inquiries SET read_at = NOW() WHERE id = ?", [id]);
    item.read_at = new Date();
  }
  const events = await q(
    "SELECT * FROM inquiry_events WHERE inquiry_id = ? ORDER BY created_at DESC, id DESC",
    [id]
  );
  const files = await q(
    `SELECT m.* FROM inquiry_files f JOIN media m ON m.id = f.media_id
      WHERE f.inquiry_id = ? ORDER BY f.id ASC`,
    [id]
  );
  res.json({ item, events, files });
}));

/* 수정 — 상태 / 담당 / 우선순위 / 메모 / 금액 / 중요표시 */
router.put("/:id", requireAuth, requireWrite, wrap(async (req, res, next) => {
  const id = int(req.params.id);
  const before = await q1("SELECT * FROM inquiries WHERE id = ?", [id]);
  if (!before) return next(notFound());

  const b = req.body || {};
  const sets = [];
  const params = [];
  const changed = {};

  if (b.status !== undefined) {
    const v = pick(b.status, STATUSES, before.status);
    sets.push("status = ?"); params.push(v); changed.status = v;
  }
  if (b.priority !== undefined) {
    const v = pick(b.priority, PRIORITIES, before.priority);
    sets.push("priority = ?"); params.push(v); changed.priority = v;
  }
  if (b.assignee_id !== undefined) {
    const v = int(b.assignee_id) || null;
    sets.push("assignee_id = ?"); params.push(v); changed.assignee_id = v;
  }
  if (b.memo !== undefined) {
    const v = b.memo === null ? null : String(b.memo).slice(0, 8000);
    sets.push("memo = ?"); params.push(v); changed.memo = "(변경)";
  }
  if (b.amount !== undefined) {
    const v = int(b.amount);
    sets.push("amount = ?"); params.push(v); changed.amount = v;
  }
  if (b.starred !== undefined) {
    const v = bool01(b.starred, 0);
    sets.push("starred = ?"); params.push(v); changed.starred = v;
  }
  if (!sets.length) throw bad("변경할 값이 없습니다.");

  await exec(`UPDATE inquiries SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);

  /* 상태 변경은 처리이력으로 남긴다 */
  if (changed.status && changed.status !== before.status) {
    await exec(
      `INSERT INTO inquiry_events (inquiry_id, user_id, user_name, type, note)
       VALUES (?, ?, ?, 'status', ?)`,
      [id, req.user.id, req.user.name,
       `${STATUS_LABEL[before.status]} → ${STATUS_LABEL[changed.status]}`]
    );
  }
  await audit(req, "update", "inquiry", id, changed);
  const item = await q1(
    `SELECT i.*, u.name AS assignee_name FROM inquiries i
       LEFT JOIN users u ON u.id = i.assignee_id WHERE i.id = ?`,
    [id]
  );
  res.json({ item });
}));

/* 처리 이력 추가 (통화·메일 기록 등) */
router.post("/:id/events", requireAuth, requireWrite, wrap(async (req, res) => {
  const id = int(req.params.id);
  const type = pick(req.body?.type, ["note", "call", "email", "meeting", "quote"], "note");
  const note = s(req.body?.note, 4000);
  if (!note) throw bad("내용을 입력하세요.");
  const r = await exec(
    `INSERT INTO inquiry_events (inquiry_id, user_id, user_name, type, note) VALUES (?, ?, ?, ?, ?)`,
    [id, req.user.id, req.user.name, type, note]
  );
  await audit(req, "event", "inquiry", id, { type });
  res.json({ item: await q1("SELECT * FROM inquiry_events WHERE id = ?", [r.insertId]) });
}));

/* 일괄 상태 변경 */
router.post("/bulk-status", requireAuth, requireWrite, wrap(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((v) => int(v)).filter(Boolean) : [];
  const status = pick(req.body?.status, STATUSES, null);
  if (!ids.length || !status) throw bad("항목과 상태를 선택하세요.");
  await exec(
    `UPDATE inquiries SET status = ? WHERE id IN (${ids.map(() => "?").join(",")})`,
    [status, ...ids]
  );
  await audit(req, "bulk-status", "inquiry", null, { ids, status });
  res.json({ ok: true, count: ids.length });
}));

/* 삭제 */
router.delete("/:id", requireAuth, requireWrite, wrap(async (req, res, next) => {
  const id = int(req.params.id);
  const r = await exec("DELETE FROM inquiries WHERE id = ?", [id]);
  if (!r.affectedRows) return next(notFound());
  await exec("DELETE FROM inquiry_events WHERE inquiry_id = ?", [id]);
  await exec("DELETE FROM inquiry_files WHERE inquiry_id = ?", [id]);
  await audit(req, "delete", "inquiry", id);
  res.json({ ok: true });
}));

export default router;
