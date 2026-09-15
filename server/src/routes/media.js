/* =====================================================================
   routes/media.js — 미디어 라이브러리
   ===================================================================== */
import express from "express";
import { q, q1, exec } from "../db.js";
import { wrap, notFound, bad, int, s } from "../lib/util.js";
import { requireAuth, requireWrite, audit } from "../lib/auth.js";
import { uploader, saveMediaRow, removeUploadFile, safeFolder } from "../lib/uploads.js";

const router = express.Router();

router.get("/", requireAuth, wrap(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.folder) { where.push("folder = ?"); params.push(safeFolder(req.query.folder)); }
  if (req.query.source) { where.push("source = ?"); params.push(req.query.source === "repo" ? "repo" : "upload"); }
  if (req.query.q) {
    const like = `%${String(req.query.q).slice(0, 60)}%`;
    where.push("(original LIKE ? OR filename LIKE ? OR alt LIKE ? OR url LIKE ?)");
    params.push(like, like, like, like);
  }
  const whereSql = where.length ? " WHERE " + where.join(" AND ") : "";
  const limit = Math.min(300, Math.max(1, int(req.query.limit, 120)));
  const offset = Math.max(0, int(req.query.offset, 0));

  const items = await q(
    `SELECT * FROM media${whereSql} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const cnt = await q1(`SELECT COUNT(*) AS n FROM media${whereSql}`, params);
  const folders = await q(
    "SELECT folder, COUNT(*) AS n, SUM(size) AS bytes FROM media GROUP BY folder ORDER BY folder"
  );
  res.json({ items, total: cnt.n, folders });
}));

router.post(
  "/upload",
  requireAuth,
  requireWrite,
  (req, res, next) => uploader(safeFolder(req.query.folder || "general"), { docs: true })
    .array("files", 40)(req, res, next),
  wrap(async (req, res) => {
    const files = req.files || [];
    if (!files.length) throw bad("업로드된 파일이 없습니다.");
    const folder = safeFolder(req.query.folder || "general");
    const items = [];
    for (const f of files) items.push(await saveMediaRow(req, f, folder));
    await audit(req, "upload", "media", null, { count: items.length, folder });
    res.json({ items });
  })
);

router.put("/:id", requireAuth, requireWrite, wrap(async (req, res, next) => {
  const id = int(req.params.id);
  const alt = s(req.body?.alt, 255);
  const r = await exec("UPDATE media SET alt = ? WHERE id = ?", [alt, id]);
  if (!r.affectedRows) return next(notFound());
  res.json({ item: await q1("SELECT * FROM media WHERE id = ?", [id]) });
}));

router.delete("/:id", requireAuth, requireWrite, wrap(async (req, res, next) => {
  const id = int(req.params.id);
  const m = await q1("SELECT * FROM media WHERE id = ?", [id]);
  if (!m) return next(notFound());

  const used = await q1("SELECT COUNT(*) AS n FROM portfolio_items WHERE media_id = ?", [id]);
  if (used.n) throw bad(`포트폴리오 ${used.n}건에서 사용 중입니다. 먼저 해당 항목을 삭제하세요.`);

  await exec("DELETE FROM media WHERE id = ?", [id]);
  if (m.source === "upload") removeUploadFile(m.url);
  await audit(req, "delete", "media", id, { url: m.url });
  res.json({ ok: true });
}));

export default router;
