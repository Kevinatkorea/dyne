/* =====================================================================
   config.js — 환경변수 로딩 (.env 는 server/.env, 서버에만 존재)
   dotenv 의존 없이 직접 파싱한다. 값에 = 가 들어가도 안전.
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_ROOT = path.resolve(__dirname, "..");
export const REPO_ROOT = path.resolve(SERVER_ROOT, "..");

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(path.join(SERVER_ROOT, ".env"));
loadEnvFile(path.join(REPO_ROOT, ".env"));

const num = (v, d) => (v === undefined || v === "" ? d : Number(v));

export const config = {
  env: process.env.NODE_ENV || "development",
  port: num(process.env.PORT, 3410),

  db: {
    host: process.env.DB_HOST || "127.0.0.1",
    port: num(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || "dyne",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "dyne",
    connectionLimit: num(process.env.DB_POOL, 8),
  },

  jwtSecret: process.env.JWT_SECRET || "dev-insecure-secret-change-me",
  cookieName: process.env.COOKIE_NAME || "dyne_admin",
  cookieSecure: String(process.env.COOKIE_SECURE || "false") === "true",
  sessionHours: num(process.env.SESSION_HOURS, 12),

  /* 업로드는 레포 밖에 둔다 — git pull 로 날아가지 않도록. */
  uploadDir: process.env.UPLOAD_DIR || path.join(REPO_ROOT, "uploads"),
  maxUploadMb: num(process.env.MAX_UPLOAD_MB, 30),

  siteUrl: process.env.SITE_URL || "https://dy.mostvisual.co.kr",

  seed: {
    email: process.env.SEED_ADMIN_EMAIL || "admin@dynes.co.kr",
    password: process.env.SEED_ADMIN_PASSWORD || "dyne1234!",
    name: process.env.SEED_ADMIN_NAME || "최고관리자",
  },
};
