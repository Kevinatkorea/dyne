/* =====================================================================
   db.js — MariaDB 풀 + 스키마 적용 헬퍼
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { config, SERVER_ROOT } from "./config.js";

export const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  charset: "utf8mb4_unicode_ci",
  dateStrings: false,
  namedPlaceholders: false,
});

/** SELECT — 행 배열 반환 */
export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params);
  return rows;
}

/** SELECT — 첫 행 또는 null */
export async function q1(sql, params = []) {
  const rows = await q(sql, params);
  return rows.length ? rows[0] : null;
}

/** INSERT/UPDATE/DELETE — ResultSetHeader 반환 */
export async function exec(sql, params = []) {
  const [res] = await pool.query(sql, params);
  return res;
}

/** 트랜잭션 헬퍼 */
export async function tx(fn) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const out = await fn(conn);
    await conn.commit();
    return out;
  } catch (e) {
    try { await conn.rollback(); } catch { /* ignore */ }
    throw e;
  } finally {
    conn.release();
  }
}

/** schema.sql 을 세미콜론 단위로 실행 (IF NOT EXISTS 라 반복 안전) */
export async function applySchema() {
  const sqlPath = path.join(SERVER_ROOT, "src", "schema.sql");
  const raw = fs.readFileSync(sqlPath, "utf8");
  const statements = raw
    .split(/;\s*$/m)
    .map((s) => s.replace(/^\s*--.*$/gm, "").trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await pool.query(stmt);
  }
  return statements.length;
}

export async function closePool() {
  await pool.end();
}
