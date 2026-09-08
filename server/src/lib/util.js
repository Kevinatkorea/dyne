/* =====================================================================
   util.js — 공용 헬퍼
   ===================================================================== */
import crypto from "node:crypto";

/** 라우트 핸들러 async 에러를 next 로 넘긴다 */
export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code || null;
  }
}
export const bad = (msg, code) => new HttpError(400, msg, code);
export const unauthorized = (msg = "로그인이 필요합니다.") => new HttpError(401, msg);
export const forbidden = (msg = "권한이 없습니다.") => new HttpError(403, msg);
export const notFound = (msg = "대상을 찾을 수 없습니다.") => new HttpError(404, msg);

/** 클라이언트 IP (Apache 리버스 프록시 뒤) */
export function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim().slice(0, 60);
  return (req.socket?.remoteAddress || "").slice(0, 60);
}

export const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");

/** 견적요청 코드: DY-260908-XXXX */
export function inquiryCode(d = new Date()) {
  const yy = String(d.getFullYear()).slice(2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `DY-${yy}${mm}${dd}-${rand}`;
}

/** 문자열 정리 — 길이 제한 + 트림 */
export const s = (v, max = 255) =>
  v === undefined || v === null ? null : String(v).trim().slice(0, max) || null;

export const int = (v, dflt = null) => {
  if (v === undefined || v === null || v === "") return dflt;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : dflt;
};

export const bool01 = (v, dflt = 0) => {
  if (v === undefined || v === null || v === "") return dflt;
  if (v === true || v === 1 || v === "1" || v === "true") return 1;
  if (v === false || v === 0 || v === "0" || v === "false") return 0;
  return dflt;
};

/** enum 화이트리스트 */
export const pick = (v, allowed, dflt) => (allowed.includes(v) ? v : dflt);

/** ISO 날짜 → MySQL DATETIME */
export function toDbDate(v) {
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace("T", " ");
}

/** CSV 셀 escape (엑셀 수식 주입 방지 포함) */
export function csvCell(v) {
  let t = v === null || v === undefined ? "" : String(v);
  if (/^[=+\-@]/.test(t)) t = "'" + t;
  return '"' + t.replace(/"/g, '""') + '"';
}

export function toCsv(headers, rows) {
  const head = headers.map((h) => csvCell(h.label)).join(",");
  const body = rows
    .map((r) => headers.map((h) => csvCell(h.get ? h.get(r) : r[h.key])).join(","))
    .join("\r\n");
  /* 엑셀 한글 깨짐 방지 BOM */
  return "﻿" + head + "\r\n" + body + "\r\n";
}

/** 디바이스 판정 */
export function deviceOf(ua = "") {
  const u = String(ua).toLowerCase();
  if (/ipad|tablet|playbook|silk/.test(u)) return "tablet";
  if (/mobi|android|iphone|ipod/.test(u)) return "mobile";
  return "desktop";
}
