/* =====================================================================
   auth.js — bcrypt 비밀번호 + JWT httpOnly 쿠키 세션
   ===================================================================== */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { q1, exec } from "../db.js";
import { unauthorized, forbidden, clientIp } from "./util.js";

export const hashPassword = (plain) => bcrypt.hash(String(plain), 10);
export const verifyPassword = (plain, hash) => bcrypt.compare(String(plain), String(hash || ""));

export function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: `${config.sessionHours}h` }
  );
}

export function setSessionCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: config.cookieSecure,
    maxAge: config.sessionHours * 3600 * 1000,
    path: "/",
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(config.cookieName, { path: "/" });
}

/** 쿠키 → req.user (없으면 null). 인증 강제하지 않음. */
export async function attachUser(req, _res, next) {
  req.user = null;
  const token = req.cookies?.[config.cookieName];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await q1(
      "SELECT id, email, name, role, active FROM users WHERE id = ? LIMIT 1",
      [payload.sub]
    );
    if (user && user.active) req.user = user;
  } catch {
    /* 만료/위조 토큰은 비로그인 취급 */
  }
  next();
}

/** 로그인 필수 */
export function requireAuth(req, _res, next) {
  if (!req.user) return next(unauthorized());
  next();
}

/** 역할 필수 — requireRole('super') */
export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(unauthorized());
    if (!roles.includes(req.user.role)) return next(forbidden());
    next();
  };
}

/** 읽기 전용 계정(viewer)은 쓰기 차단 */
export function requireWrite(req, _res, next) {
  if (!req.user) return next(unauthorized());
  if (req.user.role === "viewer") return next(forbidden("읽기 전용 계정입니다."));
  next();
}

/** 감사 로그 기록 — 실패해도 요청은 계속 진행 */
export async function audit(req, action, entity, entityId, detail) {
  try {
    await exec(
      `INSERT INTO audit_logs (user_id, user_name, action, entity, entity_id, detail, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user?.id ?? null,
        req.user?.name ?? null,
        String(action).slice(0, 60),
        entity ? String(entity).slice(0, 60) : null,
        entityId !== undefined && entityId !== null ? String(entityId).slice(0, 60) : null,
        detail ? JSON.stringify(detail).slice(0, 4000) : null,
        clientIp(req),
      ]
    );
  } catch (e) {
    console.error("[audit] 기록 실패:", e.message);
  }
}
