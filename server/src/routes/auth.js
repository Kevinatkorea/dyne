/* =====================================================================
   routes/auth.js — 관리자 로그인 / 로그아웃 / 내 정보
   ===================================================================== */
import express from "express";
import { q1, exec } from "../db.js";
import { wrap, bad, unauthorized, clientIp, s, HttpError } from "../lib/util.js";
import {
  verifyPassword, hashPassword, signToken, setSessionCookie,
  clearSessionCookie, requireAuth, audit,
} from "../lib/auth.js";

const router = express.Router();

/* 무차별 대입 완화 — IP+이메일 단위 인메모리 카운터 */
const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_TRIES = 8;

function tooMany(key) {
  const rec = attempts.get(key);
  if (!rec) return false;
  if (Date.now() - rec.at > WINDOW_MS) { attempts.delete(key); return false; }
  return rec.n >= MAX_TRIES;
}
function noteFail(key) {
  const rec = attempts.get(key);
  if (!rec || Date.now() - rec.at > WINDOW_MS) attempts.set(key, { n: 1, at: Date.now() });
  else rec.n += 1;
}

router.post("/login", wrap(async (req, res) => {
  const email = s(req.body?.email, 190);
  const password = String(req.body?.password || "");
  if (!email || !password) throw bad("이메일과 비밀번호를 입력하세요.");

  const key = `${clientIp(req)}|${email.toLowerCase()}`;
  if (tooMany(key)) throw new HttpError(429, "로그인 시도가 너무 많습니다. 10분 후 다시 시도하세요.");

  const user = await q1(
    "SELECT id, email, name, role, active, password_hash FROM users WHERE email = ? LIMIT 1",
    [email]
  );
  const ok = user && user.active && (await verifyPassword(password, user.password_hash));
  if (!ok) {
    noteFail(key);
    throw unauthorized("이메일 또는 비밀번호가 올바르지 않습니다.");
  }
  attempts.delete(key);

  await exec("UPDATE users SET last_login_at = NOW() WHERE id = ?", [user.id]);
  setSessionCookie(res, signToken(user));
  req.user = user;
  await audit(req, "login", "user", user.id);

  res.json({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}));

router.post("/logout", wrap(async (req, res) => {
  if (req.user) await audit(req, "logout", "user", req.user.id);
  clearSessionCookie(res);
  res.json({ ok: true });
}));

router.get("/me", wrap(async (req, res) => {
  res.json({ user: req.user });
}));

/* 내 비밀번호 변경 */
router.post("/password", requireAuth, wrap(async (req, res) => {
  const current = String(req.body?.current || "");
  const next = String(req.body?.next || "");
  if (next.length < 8) throw bad("새 비밀번호는 8자 이상이어야 합니다.");

  const row = await q1("SELECT password_hash FROM users WHERE id = ?", [req.user.id]);
  if (!(await verifyPassword(current, row.password_hash))) throw bad("현재 비밀번호가 올바르지 않습니다.");

  await exec("UPDATE users SET password_hash = ? WHERE id = ?", [await hashPassword(next), req.user.id]);
  await audit(req, "password-change", "user", req.user.id);
  res.json({ ok: true });
}));

export default router;
