/* =====================================================================
   routes/sms.js — 문자(알리고) 관리 API
     GET  /api/admin/sms/remain   잔여 건수 조회
     POST /api/admin/sms/test     테스트 발송
     GET  /api/admin/sms/logs     발송 이력
   ===================================================================== */
import express from "express";
import { q, q1 } from "../db.js";
import { wrap, bad, int, s } from "../lib/util.js";
import { requireAuth, requireWrite, audit } from "../lib/auth.js";
import {
  sendSms, remainCount, smsReady, renderTemplate, normalizePhone, smsByteLength, smsTypeFor,
} from "../lib/sms.js";
import { getSettings } from "./settings.js";

const router = express.Router();

/* 설정 점검 + 잔여 건수 */
router.get("/remain", requireAuth, wrap(async (_req, res) => {
  const settings = await getSettings();
  const ready = smsReady(settings);
  const remain = await remainCount(settings);
  res.json({ ready, remain });
}));

/* 테스트 발송 — 실제 견적요청 없이 문자만 보내 본다 */
router.post("/test", requireAuth, requireWrite, wrap(async (req, res) => {
  const settings = await getSettings();
  const to = normalizePhone(req.body?.to);
  if (!to) throw bad("받는 번호를 올바르게 입력하세요. (예: 010-1234-5678)");

  const ready = smsReady(settings);
  if (!ready.ok) throw bad(ready.reason);

  /* 어떤 템플릿을 시험할지 — 실제 발송과 같은 내용으로 확인할 수 있게 한다 */
  const which = s(req.body?.template, 20) || "custom";
  const sms = settings.sms || {};
  const sample = {
    code: "DY-260908-TEST",
    company: "테스트 주식회사",
    name: "홍길동",
    phone: "010-1234-5678",
    email: "test@example.com",
    service: "브로슈어 / 카탈로그",
    quantity: "1,000부",
    deadline: "2026-10-01",
    budget: "300 – 1,000만원",
    message: "테스트 발송입니다.",
  };

  let text;
  let title;
  if (which === "customer") {
    text = renderTemplate(sms.customerTemplate, sample);
    title = sms.customerTitle;
  } else if (which === "staff") {
    text = renderTemplate(sms.staffTemplate, sample);
    title = sms.staffTitle;
  } else {
    text = s(req.body?.text, 2000) || "[다인스케치] 문자 발송 테스트입니다.";
    title = "발송 테스트";
  }

  const r = await sendSms(settings, { to, text, title, kind: "test" });
  await audit(req, "sms-test", "sms", null, { to, template: which, ok: r.ok });

  res.json({
    ...r,
    preview: { text, bytes: smsByteLength(text), type: smsTypeFor(text) },
    testMode: settings.sms?.testMode === true,
  });
}));

/* 템플릿 미리보기 — 발송 없이 길이/종류만 계산 */
router.post("/preview", requireAuth, wrap(async (req, res) => {
  const text = renderTemplate(s(req.body?.template, 4000) || "", {
    code: "DY-260908-TEST", company: "테스트 주식회사", name: "홍길동",
    phone: "010-1234-5678", email: "test@example.com",
    service: "브로슈어 / 카탈로그", quantity: "1,000부",
    deadline: "2026-10-01", budget: "300 – 1,000만원", message: "테스트 문의 내용입니다.",
  });
  res.json({ text, bytes: smsByteLength(text), type: smsTypeFor(text) });
}));

/* 발송 이력 */
router.get("/logs", requireAuth, wrap(async (req, res) => {
  const page = Math.max(1, int(req.query.page, 1));
  const size = Math.min(100, Math.max(10, int(req.query.size, 30)));
  const where = [];
  const params = [];
  if (req.query.kind && ["customer", "staff", "test"].includes(req.query.kind)) {
    where.push("kind = ?");
    params.push(req.query.kind);
  }
  if (req.query.ok === "0") where.push("ok = 0");
  if (req.query.ok === "1") where.push("ok = 1");
  const whereSql = where.length ? " WHERE " + where.join(" AND ") : "";

  const items = await q(
    `SELECT * FROM sms_logs${whereSql} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, size, (page - 1) * size]
  );
  const cnt = await q1(`SELECT COUNT(*) AS n FROM sms_logs${whereSql}`, params);
  const fail = await q1("SELECT COUNT(*) AS n FROM sms_logs WHERE ok = 0");
  res.json({
    items, total: cnt.n, page, size,
    pages: Math.max(1, Math.ceil(cnt.n / size)),
    failed: fail.n,
  });
}));

export default router;
