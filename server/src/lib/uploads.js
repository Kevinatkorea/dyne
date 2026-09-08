/* =====================================================================
   uploads.js — multer 업로드 + media 테이블 기록
   업로드본은 레포 밖(config.uploadDir)에 저장하고 /uploads/... 로 서빙한다.
   git pull 로 사라지지 않고, 백업 대상도 이 디렉터리 하나로 끝난다.
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";
import { config } from "../config.js";
import { exec, q1 } from "../db.js";
import { bad } from "./util.js";

const IMAGE_MIME = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml",
]);
const DOC_MIME = new Set([
  "application/pdf", "application/zip", "application/x-zip-compressed",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/postscript", "application/illustrator",
]);

/** 폴더명 화이트리스트 — 경로 탈출 차단 */
const FOLDERS = new Set([
  "portfolio", "equipment", "clients", "awards", "hero", "notice", "general", "inquiry",
]);
export const safeFolder = (f) => (FOLDERS.has(String(f)) ? String(f) : "general");

export function ensureUploadDir(folder) {
  const dir = path.join(config.uploadDir, safeFolder(folder));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

/** 확장자만 유지하고 파일명은 무작위로 — 한글/공백/중복/경로문자 문제 제거 */
function makeFilename(original) {
  const ext = (path.extname(original || "") || "").toLowerCase().slice(0, 10).replace(/[^.a-z0-9]/g, "");
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `${stamp}-${crypto.randomBytes(8).toString("hex")}${ext || ""}`;
}

export function uploader(folder, { docs = false } = {}) {
  const storage = multer.diskStorage({
    destination(_req, _file, cb) {
      try { cb(null, ensureUploadDir(folder)); } catch (e) { cb(e); }
    },
    filename(_req, file, cb) {
      cb(null, makeFilename(file.originalname));
    },
  });
  return multer({
    storage,
    limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 40 },
    fileFilter(_req, file, cb) {
      const ok = IMAGE_MIME.has(file.mimetype) || (docs && DOC_MIME.has(file.mimetype));
      if (!ok) return cb(bad(`허용되지 않는 파일 형식입니다: ${file.mimetype}`));
      cb(null, true);
    },
  });
}

/** multer 파일 → media 행 생성 */
export async function saveMediaRow(req, file, folder) {
  const f = safeFolder(folder);
  const url = `/uploads/${f}/${file.filename}`;
  const r = await exec(
    `INSERT INTO media (url, filename, original, mime, size, folder, source, uploaded_by)
     VALUES (?, ?, ?, ?, ?, ?, 'upload', ?)`,
    [
      url,
      file.filename,
      String(file.originalname || "").slice(0, 255),
      file.mimetype,
      file.size,
      f,
      req.user?.id ?? null,
    ]
  );
  return q1("SELECT * FROM media WHERE id = ?", [r.insertId]);
}

/** /uploads/... URL 에 해당하는 실제 파일 삭제 (경로 탈출 방어) */
export function removeUploadFile(url) {
  if (!url || !url.startsWith("/uploads/")) return false;
  const rel = url.replace(/^\/uploads\//, "");
  const abs = path.resolve(config.uploadDir, rel);
  const root = path.resolve(config.uploadDir);
  if (!abs.startsWith(root + path.sep)) return false;
  try {
    fs.unlinkSync(abs);
    return true;
  } catch {
    return false;
  }
}
