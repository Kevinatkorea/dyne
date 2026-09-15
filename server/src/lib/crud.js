/* =====================================================================
   crud.js — 정렬(드래그앤드롭) 지원 공용 CRUD 라우터 팩토리
   장비 / 연혁 / 고객사 / 수상 / 히어로슬라이드 / 공지 / 서비스 처럼
   "목록 + 추가 + 수정 + 삭제 + 순서변경 + 노출토글" 만 필요한 테이블용.
   ===================================================================== */
import express from "express";
import { q, q1, exec, tx } from "../db.js";
import { wrap, notFound, bad, bool01, int } from "./util.js";
import { requireAuth, requireWrite, audit } from "./auth.js";

/**
 * @param {object} opt
 * @param {string} opt.table      테이블명 (하드코딩된 화이트리스트에서만 호출)
 * @param {string[]} opt.fields   수정 가능한 컬럼
 * @param {object} opt.coerce     컬럼별 변환 함수 { col: (v) => value }
 * @param {string} opt.order      기본 정렬 SQL
 * @param {string} opt.entity     감사로그 엔티티명
 */
export function crudRouter(opt) {
  const { table, fields, coerce = {}, order = "sort_order ASC, id ASC", entity = opt.table } = opt;
  const r = express.Router();
  const cols = fields.map((f) => `\`${f}\``).join(", ");

  const shape = (body) => {
    const out = {};
    for (const f of fields) {
      if (!(f in body)) continue;
      out[f] = coerce[f] ? coerce[f](body[f]) : body[f];
    }
    return out;
  };

  /* 목록 (관리자 — 비노출 포함) */
  r.get("/", requireAuth, wrap(async (req, res) => {
    const where = [];
    const params = [];
    if (req.query.q) {
      const like = `%${String(req.query.q).slice(0, 60)}%`;
      const searchable = fields.filter((f) => /name|title|kr|en|maker|model|org|caption|client/.test(f));
      if (searchable.length) {
        where.push("(" + searchable.map((f) => `\`${f}\` LIKE ?`).join(" OR ") + ")");
        searchable.forEach(() => params.push(like));
      }
    }
    if (req.query.page && fields.includes("page")) {
      where.push("`page` = ?");
      params.push(String(req.query.page).slice(0, 40));
    }
    const sql = `SELECT * FROM \`${table}\`${where.length ? " WHERE " + where.join(" AND ") : ""} ORDER BY ${order}`;
    res.json({ items: await q(sql, params) });
  }));

  /* 단건 */
  r.get("/:id", requireAuth, wrap(async (req, res, next) => {
    const row = await q1(`SELECT * FROM \`${table}\` WHERE id = ?`, [int(req.params.id)]);
    if (!row) return next(notFound());
    res.json({ item: row });
  }));

  /* 추가 — 목록 맨 앞에 배치 */
  r.post("/", requireAuth, requireWrite, wrap(async (req, res) => {
    const data = shape(req.body || {});
    const min = await q1(`SELECT MIN(sort_order) AS m FROM \`${table}\``);
    data.sort_order = (min?.m ?? 0) - 1;
    const keys = Object.keys(data);
    if (!keys.length) throw bad("입력값이 없습니다.");
    const result = await exec(
      `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(", ")})
       VALUES (${keys.map(() => "?").join(", ")})`,
      keys.map((k) => data[k])
    );
    await audit(req, "create", entity, result.insertId, data);
    res.json({ item: await q1(`SELECT * FROM \`${table}\` WHERE id = ?`, [result.insertId]) });
  }));

  /* 수정 */
  r.put("/:id", requireAuth, requireWrite, wrap(async (req, res, next) => {
    const id = int(req.params.id);
    const data = shape(req.body || {});
    const keys = Object.keys(data);
    if (!keys.length) throw bad("변경할 값이 없습니다.");
    const result = await exec(
      `UPDATE \`${table}\` SET ${keys.map((k) => `\`${k}\` = ?`).join(", ")} WHERE id = ?`,
      [...keys.map((k) => data[k]), id]
    );
    if (!result.affectedRows) return next(notFound());
    await audit(req, "update", entity, id, data);
    res.json({ item: await q1(`SELECT * FROM \`${table}\` WHERE id = ?`, [id]) });
  }));

  /* 삭제 */
  r.delete("/:id", requireAuth, requireWrite, wrap(async (req, res, next) => {
    const id = int(req.params.id);
    const result = await exec(`DELETE FROM \`${table}\` WHERE id = ?`, [id]);
    if (!result.affectedRows) return next(notFound());
    await audit(req, "delete", entity, id);
    res.json({ ok: true });
  }));

  /* 순서 저장 — 드래그앤드롭 결과 [id, id, ...] */
  r.post("/reorder", requireAuth, requireWrite, wrap(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((v) => int(v)).filter(Boolean) : [];
    if (!ids.length) throw bad("정렬할 항목이 없습니다.");
    await tx(async (conn) => {
      for (let i = 0; i < ids.length; i++) {
        await conn.query(`UPDATE \`${table}\` SET sort_order = ? WHERE id = ?`, [i, ids[i]]);
      }
    });
    await audit(req, "reorder", entity, null, { count: ids.length });
    res.json({ ok: true, count: ids.length });
  }));

  /* 노출 일괄 토글 */
  r.post("/bulk-visible", requireAuth, requireWrite, wrap(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((v) => int(v)).filter(Boolean) : [];
    const visible = bool01(req.body?.visible, 1);
    if (!ids.length) throw bad("선택된 항목이 없습니다.");
    await exec(
      `UPDATE \`${table}\` SET visible = ? WHERE id IN (${ids.map(() => "?").join(",")})`,
      [visible, ...ids]
    );
    await audit(req, "bulk-visible", entity, null, { ids, visible });
    res.json({ ok: true });
  }));

  /* 일괄 삭제 */
  r.post("/bulk-delete", requireAuth, requireWrite, wrap(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((v) => int(v)).filter(Boolean) : [];
    if (!ids.length) throw bad("선택된 항목이 없습니다.");
    await exec(`DELETE FROM \`${table}\` WHERE id IN (${ids.map(() => "?").join(",")})`, ids);
    await audit(req, "bulk-delete", entity, null, { ids });
    res.json({ ok: true, count: ids.length });
  }));

  return r;
}
