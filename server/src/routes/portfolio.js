/* =====================================================================
   routes/portfolio.js — 포트폴리오 관리
   드래그앤드롭 정렬 · 드래그앤드롭 업로드 · 카테고리/연도 분류 · 일괄작업
   ===================================================================== */
import express from "express";
import { q, q1, exec, tx } from "../db.js";
import { wrap, notFound, bad, int, s, bool01 } from "../lib/util.js";
import { requireAuth, requireWrite, audit } from "../lib/auth.js";
import { uploader, saveMediaRow, removeUploadFile } from "../lib/uploads.js";

const router = express.Router();

/* 목록 — 관리자용(비노출 포함) */
router.get("/", requireAuth, wrap(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.category) { where.push("category = ?"); params.push(String(req.query.category).slice(0, 60)); }
  if (req.query.year)     { where.push("year = ?");     params.push(String(req.query.year).slice(0, 10)); }
  if (req.query.visible === "0") where.push("visible = 0");
  if (req.query.visible === "1") where.push("visible = 1");
  if (req.query.featured === "1") where.push("featured = 1");
  if (req.query.q) {
    const like = `%${String(req.query.q).slice(0, 60)}%`;
    where.push("(title LIKE ? OR client LIKE ? OR tags LIKE ? OR src LIKE ?)");
    params.push(like, like, like, like);
  }
  const whereSql = where.length ? " WHERE " + where.join(" AND ") : "";

  const limit = Math.min(1000, Math.max(1, int(req.query.limit, 500)));
  const offset = Math.max(0, int(req.query.offset, 0));

  const items = await q(
    `SELECT * FROM portfolio_items${whereSql} ORDER BY sort_order ASC, id ASC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const cnt = await q1(`SELECT COUNT(*) AS n FROM portfolio_items${whereSql}`, params);

  /* 사이드바용 그룹 집계 */
  const byCat = await q(
    `SELECT category, COUNT(*) AS n, SUM(visible = 0) AS hidden
       FROM portfolio_items WHERE category IS NOT NULL GROUP BY category ORDER BY category`
  );
  const byYear = await q(
    `SELECT year, COUNT(*) AS n, SUM(visible = 0) AS hidden
       FROM portfolio_items WHERE year IS NOT NULL GROUP BY year ORDER BY year DESC`
  );

  res.json({ items, total: cnt.n, byCategory: byCat, byYear });
}));

/* 순서 저장 — 드래그앤드롭 결과.
   카테고리/연도로 걸러 놓고 정렬해도 전체 목록 순서가 뒤엉키지 않도록,
   "이 항목들이 원래 차지하던 sort_order 자리"만 재배치한다. */
router.post("/reorder", requireAuth, requireWrite, wrap(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((v) => int(v)).filter(Boolean) : [];
  if (!ids.length) throw bad("정렬할 항목이 없습니다.");
  const ph = ids.map(() => "?").join(",");
  const rows = await q(`SELECT id, sort_order FROM portfolio_items WHERE id IN (${ph})`, ids);
  if (rows.length !== ids.length) throw bad("삭제되었거나 존재하지 않는 항목이 포함돼 있습니다.");

  const slots = rows.map((r) => r.sort_order).sort((a, b) => a - b);
  await tx(async (conn) => {
    for (let i = 0; i < ids.length; i++) {
      await conn.query("UPDATE portfolio_items SET sort_order = ? WHERE id = ?", [slots[i], ids[i]]);
    }
  });
  await audit(req, "reorder", "portfolio", null, { count: ids.length });
  res.json({ ok: true, count: ids.length });
}));

/* 단건 수정 */
router.put("/:id", requireAuth, requireWrite, wrap(async (req, res, next) => {
  const id = int(req.params.id);
  const b = req.body || {};
  const map = {
    title: () => s(b.title, 200),
    client: () => s(b.client, 160),
    description: () => (b.description == null ? null : String(b.description).slice(0, 4000)),
    tags: () => s(b.tags, 400),
    category: () => s(b.category, 60),
    year: () => s(b.year, 10),
    visible: () => bool01(b.visible, 1),
    featured: () => bool01(b.featured, 0),
  };
  const sets = [];
  const params = [];
  for (const k of Object.keys(map)) {
    if (b[k] === undefined) continue;
    sets.push(`\`${k}\` = ?`);
    params.push(map[k]());
  }
  if (!sets.length) throw bad("변경할 값이 없습니다.");
  const r = await exec(`UPDATE portfolio_items SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);
  if (!r.affectedRows) return next(notFound());
  await audit(req, "update", "portfolio", id, b);
  res.json({ item: await q1("SELECT * FROM portfolio_items WHERE id = ?", [id]) });
}));

/* 삭제 (업로드본이면 실제 파일도 정리) */
router.delete("/:id", requireAuth, requireWrite, wrap(async (req, res, next) => {
  const id = int(req.params.id);
  const item = await q1("SELECT * FROM portfolio_items WHERE id = ?", [id]);
  if (!item) return next(notFound());
  await exec("DELETE FROM portfolio_items WHERE id = ?", [id]);
  if (item.media_id) {
    const m = await q1("SELECT * FROM media WHERE id = ?", [item.media_id]);
    if (m && m.source === "upload") {
      await exec("DELETE FROM media WHERE id = ?", [m.id]);
      removeUploadFile(m.url);
    }
  }
  await audit(req, "delete", "portfolio", id, { src: item.src });
  res.json({ ok: true });
}));

/* 일괄 작업 — 노출/숨김·삭제·카테고리 이동·연도 지정·대표지정 */
router.post("/bulk", requireAuth, requireWrite, wrap(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((v) => int(v)).filter(Boolean) : [];
  const action = String(req.body?.action || "");
  if (!ids.length) throw bad("선택된 항목이 없습니다.");
  const ph = ids.map(() => "?").join(",");

  switch (action) {
    case "show":
      await exec(`UPDATE portfolio_items SET visible = 1 WHERE id IN (${ph})`, ids); break;
    case "hide":
      await exec(`UPDATE portfolio_items SET visible = 0 WHERE id IN (${ph})`, ids); break;
    case "feature":
      await exec(`UPDATE portfolio_items SET featured = 1 WHERE id IN (${ph})`, ids); break;
    case "unfeature":
      await exec(`UPDATE portfolio_items SET featured = 0 WHERE id IN (${ph})`, ids); break;
    case "category":
      await exec(`UPDATE portfolio_items SET category = ? WHERE id IN (${ph})`,
        [s(req.body?.category, 60), ...ids]); break;
    case "year":
      await exec(`UPDATE portfolio_items SET year = ? WHERE id IN (${ph})`,
        [s(req.body?.year, 10), ...ids]); break;
    case "delete": {
      const rows = await q(`SELECT * FROM portfolio_items WHERE id IN (${ph})`, ids);
      await exec(`DELETE FROM portfolio_items WHERE id IN (${ph})`, ids);
      for (const it of rows) {
        if (!it.media_id) continue;
        const m = await q1("SELECT * FROM media WHERE id = ?", [it.media_id]);
        if (m && m.source === "upload") {
          await exec("DELETE FROM media WHERE id = ?", [m.id]);
          removeUploadFile(m.url);
        }
      }
      break;
    }
    default:
      throw bad("알 수 없는 작업입니다.");
  }
  await audit(req, `bulk-${action}`, "portfolio", null, { ids, body: req.body });
  res.json({ ok: true, count: ids.length });
}));

/* 업로드 — 드래그앤드롭 다중 업로드. 업로드 즉시 포트폴리오 항목 생성 */
router.post(
  "/upload",
  requireAuth,
  requireWrite,
  uploader("portfolio").array("files", 40),
  wrap(async (req, res) => {
    const files = req.files || [];
    if (!files.length) throw bad("업로드된 파일이 없습니다.");
    const category = s(req.body?.category, 60);
    const year = s(req.body?.year, 10);

    const min = await q1("SELECT MIN(sort_order) AS m FROM portfolio_items");
    let order = (min?.m ?? 0) - files.length;

    const created = [];
    for (const f of files) {
      const media = await saveMediaRow(req, f, "portfolio");
      const r = await exec(
        `INSERT INTO portfolio_items (src, category, year, title, sort_order, visible, media_id)
         VALUES (?, ?, ?, ?, ?, 1, ?)`,
        [media.url, category, year, s(f.originalname?.replace(/\.[^.]+$/, ""), 200), order++, media.id]
      );
      created.push(await q1("SELECT * FROM portfolio_items WHERE id = ?", [r.insertId]));
    }
    await audit(req, "upload", "portfolio", null, { count: created.length, category, year });
    res.json({ items: created });
  })
);

/* 기존 미디어에서 포트폴리오 항목 추가 */
router.post("/from-media", requireAuth, requireWrite, wrap(async (req, res) => {
  const mediaIds = Array.isArray(req.body?.media_ids) ? req.body.media_ids.map((v) => int(v)).filter(Boolean) : [];
  if (!mediaIds.length) throw bad("선택된 미디어가 없습니다.");
  const category = s(req.body?.category, 60);
  const year = s(req.body?.year, 10);
  const min = await q1("SELECT MIN(sort_order) AS m FROM portfolio_items");
  let order = (min?.m ?? 0) - mediaIds.length;
  const created = [];
  for (const mid of mediaIds) {
    const m = await q1("SELECT * FROM media WHERE id = ?", [mid]);
    if (!m) continue;
    const r = await exec(
      `INSERT INTO portfolio_items (src, category, year, title, sort_order, visible, media_id)
       VALUES (?, ?, ?, ?, ?, 1, ?)`,
      [m.url, category, year, s(m.alt || m.original, 200), order++, m.id]
    );
    created.push(await q1("SELECT * FROM portfolio_items WHERE id = ?", [r.insertId]));
  }
  await audit(req, "from-media", "portfolio", null, { count: created.length });
  res.json({ items: created });
}));

export default router;
