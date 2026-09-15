/* =====================================================================
   routes/users.js — 관리자 계정 관리 (super 전용)
   ===================================================================== */
import express from "express";
import { q, q1, exec } from "../db.js";
import { wrap, notFound, bad, int, s, pick, bool01 } from "../lib/util.js";
import { requireAuth, requireRole, hashPassword, audit } from "../lib/auth.js";

const router = express.Router();
const ROLES = ["super", "staff", "viewer"];

/* 담당자 지정용 — 로그인 사용자면 누구나 목록 조회 가능 */
router.get("/options", requireAuth, wrap(async (_req, res) => {
  res.json({ items: await q("SELECT id, name, email, role FROM users WHERE active = 1 ORDER BY name") });
}));

router.get("/", requireAuth, requireRole("super"), wrap(async (_req, res) => {
  res.json({
    items: await q(
      "SELECT id, email, name, role, active, last_login_at, created_at FROM users ORDER BY id"
    ),
  });
}));

router.post("/", requireAuth, requireRole("super"), wrap(async (req, res) => {
  const email = s(req.body?.email, 190);
  const name = s(req.body?.name, 80);
  const role = pick(req.body?.role, ROLES, "staff");
  const password = String(req.body?.password || "");
  if (!email || !name) throw bad("이메일과 이름은 필수입니다.");
  if (password.length < 8) throw bad("비밀번호는 8자 이상이어야 합니다.");

  const dup = await q1("SELECT id FROM users WHERE email = ?", [email]);
  if (dup) throw bad("이미 등록된 이메일입니다.");

  const r = await exec(
    "INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, ?, ?)",
    [email, name, role, await hashPassword(password)]
  );
  await audit(req, "create", "user", r.insertId, { email, role });
  res.json({
    item: await q1("SELECT id, email, name, role, active, created_at FROM users WHERE id = ?", [r.insertId]),
  });
}));

router.put("/:id", requireAuth, requireRole("super"), wrap(async (req, res, next) => {
  const id = int(req.params.id);
  const b = req.body || {};
  const sets = [];
  const params = [];

  if (b.name !== undefined)  { sets.push("name = ?");   params.push(s(b.name, 80)); }
  if (b.role !== undefined)  { sets.push("role = ?");   params.push(pick(b.role, ROLES, "staff")); }
  if (b.active !== undefined){ sets.push("active = ?"); params.push(bool01(b.active, 1)); }
  if (b.password) {
    if (String(b.password).length < 8) throw bad("비밀번호는 8자 이상이어야 합니다.");
    sets.push("password_hash = ?");
    params.push(await hashPassword(b.password));
  }
  if (!sets.length) throw bad("변경할 값이 없습니다.");

  /* 마지막 활성 super 계정을 스스로 잠그는 사고 방지 */
  if (id === req.user.id && (b.active === 0 || b.active === false || (b.role && b.role !== "super"))) {
    const supers = await q1("SELECT COUNT(*) AS n FROM users WHERE role = 'super' AND active = 1");
    if (supers.n <= 1) throw bad("마지막 최고관리자 계정은 비활성화하거나 권한을 낮출 수 없습니다.");
  }

  const r = await exec(`UPDATE users SET ${sets.join(", ")} WHERE id = ?`, [...params, id]);
  if (!r.affectedRows) return next(notFound());
  await audit(req, "update", "user", id, { fields: Object.keys(b) });
  res.json({
    item: await q1("SELECT id, email, name, role, active, last_login_at, created_at FROM users WHERE id = ?", [id]),
  });
}));

router.delete("/:id", requireAuth, requireRole("super"), wrap(async (req, res, next) => {
  const id = int(req.params.id);
  if (id === req.user.id) throw bad("자기 자신은 삭제할 수 없습니다.");
  const supers = await q1("SELECT COUNT(*) AS n FROM users WHERE role = 'super' AND active = 1");
  const target = await q1("SELECT role FROM users WHERE id = ?", [id]);
  if (!target) return next(notFound());
  if (target.role === "super" && supers.n <= 1) throw bad("마지막 최고관리자 계정은 삭제할 수 없습니다.");

  await exec("UPDATE inquiries SET assignee_id = NULL WHERE assignee_id = ?", [id]);
  await exec("DELETE FROM users WHERE id = ?", [id]);
  await audit(req, "delete", "user", id);
  res.json({ ok: true });
}));

export default router;
