/* =====================================================================
   routes/public.js — 공개 사이트가 쓰는 API (인증 없음)
     GET  /api/site        사이트 전체 콘텐츠 한 번에 (설정·포트폴리오·장비·연혁 …)
     POST /api/inquiries   견적요청 접수
     POST /api/track       방문 기록
   ===================================================================== */
import express from "express";
import { q, exec, q1 } from "../db.js";
import { wrap, bad, s, clientIp, sha, deviceOf, inquiryCode } from "../lib/util.js";
import { loadSettings } from "./settings.js";
import { sendSms, renderTemplate, normalizePhone } from "../lib/sms.js";

const router = express.Router();

/* 공개 콘텐츠는 초 단위로 캐시 — 이미지가 많아 요청이 몰린다 */
let cache = { at: 0, body: null };
const CACHE_MS = 20 * 1000;
export const invalidateSiteCache = () => { cache = { at: 0, body: null }; };

/* ⚠ 공개 사이트로 내보내도 되는 설정만 나열한다.
   기본값을 통째로 내보내면 sms.apiKey 같은 비밀값이 그대로 유출된다.
   설정 그룹을 새로 추가할 때 여기에 넣지 않으면 공개되지 않는다(안전한 기본값). */
const PUBLIC_SETTING_KEYS = ["company", "seo", "footer", "stats", "inquiryForm", "features"];

/* 그룹 안에서도 빼야 할 필드 */
const REDACT = {
  inquiryForm: ["notifyEmail"],
  seo: ["naverVerification", "googleVerification"],
};

function publicSettings(all) {
  const out = {};
  for (const k of PUBLIC_SETTING_KEYS) {
    if (!(k in all)) continue;
    const v = all[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const copy = { ...v };
      for (const f of REDACT[k] || []) delete copy[f];
      out[k] = copy;
    } else {
      out[k] = v;
    }
  }
  return out;
}

router.get("/site", wrap(async (_req, res) => {
  if (cache.body && Date.now() - cache.at < CACHE_MS) return res.json(cache.body);

  const [settings, portfolio, services, equipment, history, clients, awards, hero, notices] =
    await Promise.all([
      loadSettings(),
      q(`SELECT id, src, category, year, title, client, description, tags, featured
           FROM portfolio_items WHERE visible = 1 ORDER BY sort_order ASC, id ASC`),
      q("SELECT * FROM services WHERE visible = 1 ORDER BY sort_order ASC, id ASC"),
      q("SELECT * FROM equipment WHERE visible = 1 ORDER BY sort_order ASC, id ASC"),
      q("SELECT * FROM history WHERE visible = 1 ORDER BY sort_order ASC, year DESC, id ASC"),
      q("SELECT * FROM clients WHERE visible = 1 ORDER BY sort_order ASC, id ASC"),
      q("SELECT * FROM awards WHERE visible = 1 ORDER BY sort_order ASC, id ASC"),
      q("SELECT * FROM hero_slides WHERE visible = 1 ORDER BY page ASC, sort_order ASC, id ASC"),
      q(`SELECT id, type, title, body, link, src FROM notices
          WHERE visible = 1
            AND (start_at IS NULL OR start_at <= NOW())
            AND (end_at   IS NULL OR end_at   >= NOW())
          ORDER BY sort_order ASC, id ASC`),
    ]);

  /* 서비스의 deliverables 는 JSON 문자열로 저장돼 있다 */
  for (const sv of services) {
    if (typeof sv.deliverables === "string") {
      try { sv.deliverables = JSON.parse(sv.deliverables); } catch { sv.deliverables = []; }
    }
  }

  /* 공개 사이트가 바로 쓰도록 카테고리/연도별로 미리 묶어 준다 */
  const byCategory = {};
  const byYear = {};
  for (const it of portfolio) {
    if (it.category) (byCategory[it.category] ||= []).push(it.src);
    if (it.year) (byYear[it.year] ||= []).push(it.src);
  }

  const body = {
    settings: publicSettings(settings),
    portfolio, byCategory, byYear,
    services, equipment, history, clients, awards,
    hero, notices,
    generatedAt: new Date().toISOString(),
  };
  cache = { at: Date.now(), body };
  res.json(body);
}));

/* ---- 견적요청 접수 ---------------------------------------------- */
const submitLog = new Map();  // ip → [timestamps]
function throttled(ip) {
  const now = Date.now();
  const arr = (submitLog.get(ip) || []).filter((t) => now - t < 60 * 60 * 1000);
  arr.push(now);
  submitLog.set(ip, arr);
  return arr.length > 10;   // 시간당 10건 초과 차단
}

router.post("/inquiries", wrap(async (req, res) => {
  const settings = await loadSettings();
  if (settings.inquiryForm?.enabled === false) throw bad("현재 견적요청을 받고 있지 않습니다.");

  const b = req.body || {};
  if (b.website) return res.json({ ok: true, code: "IGNORED" });  // 허니팟

  const name = s(b.name, 80);
  const message = b.message == null ? null : String(b.message).slice(0, 8000);
  if (!name) throw bad("담당자명을 입력해 주세요.");
  if (!message) throw bad("문의 내용을 입력해 주세요.");
  if (!s(b.phone, 60) && !s(b.email, 190)) throw bad("연락처 또는 이메일을 입력해 주세요.");

  const ip = clientIp(req);
  if (throttled(ip)) throw bad("요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.");

  const code = inquiryCode();
  const r = await exec(
    `INSERT INTO inquiries
      (code, company, name, phone, email, service, quantity, deadline, budget, message,
       source, ip, referrer, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'web', ?, ?, ?)`,
    [
      code, s(b.company, 160), name, s(b.phone, 60), s(b.email, 190),
      s(b.service, 80), s(b.quantity, 80), s(b.deadline, 80), s(b.budget, 80), message,
      ip, s(req.headers.referer, 500), s(req.headers["user-agent"], 400),
    ]
  );
  await exec(
    "INSERT INTO inquiry_events (inquiry_id, type, note) VALUES (?, 'created', '홈페이지 폼으로 접수')",
    [r.insertId]
  );

  /* 접수 응답을 먼저 보내고, 문자는 뒤에서 보낸다.
     알리고가 느리거나 죽어도 접수 자체는 성공해야 한다. */
  res.json({
    ok: true,
    code,
    message: settings.inquiryForm?.thanksMessage || "견적 요청이 접수되었습니다.",
  });

  notifyBySms(settings, {
    id: r.insertId,
    code,
    company: s(b.company, 160),
    name,
    phone: s(b.phone, 60),
    email: s(b.email, 190),
    service: s(b.service, 80),
    quantity: s(b.quantity, 80),
    deadline: s(b.deadline, 80),
    budget: s(b.budget, 80),
    message,
  });
}));

/* 견적요청 문자 알림 — 실패해도 접수에 영향을 주지 않는다(이력은 sms_logs 에 남는다). */
async function notifyBySms(settings, inq) {
  const sms = settings.sms || {};
  if (!sms.enabled) return;

  const vars = { ...inq };

  try {
    /* 1) 신청자에게 접수 확인 */
    if (sms.notifyCustomer && normalizePhone(inq.phone)) {
      await sendSms(settings, {
        to: inq.phone,
        title: sms.customerTitle,
        text: renderTemplate(sms.customerTemplate, vars),
        kind: "customer",
        inquiryId: inq.id,
      });
    }

    /* 2) 담당자에게 알림 */
    const staff = Array.isArray(sms.staffReceivers) ? sms.staffReceivers : [];
    if (sms.notifyStaff && staff.length) {
      await sendSms(settings, {
        to: staff,
        title: sms.staffTitle,
        text: renderTemplate(sms.staffTemplate, vars),
        kind: "staff",
        inquiryId: inq.id,
      });
    }
  } catch (e) {
    console.error("[sms] 견적요청 알림 실패:", e.message);
  }
}

/* ---- 방문 기록 --------------------------------------------------- */
router.post("/track", wrap(async (req, res) => {
  const settings = await loadSettings();
  if (settings.features?.visitTracking === false) return res.json({ ok: true, skipped: true });

  const path = s(req.body?.path, 200) || "/";
  const ip = clientIp(req);
  const ua = String(req.headers["user-agent"] || "");
  if (/bot|crawler|spider|slurp|bingpreview|facebookexternalhit/i.test(ua)) {
    return res.json({ ok: true, skipped: "bot" });
  }
  /* 방문자 식별은 IP+UA 해시 — 개인정보 원본은 저장하지 않는다 */
  const visitor = sha(`${ip}|${ua}`).slice(0, 32);

  await exec(
    "INSERT INTO visits (day, path, visitor, referrer, device, ip) VALUES (CURDATE(), ?, ?, ?, ?, ?)",
    [path, visitor, s(req.body?.referrer, 400), deviceOf(ua), sha(ip).slice(0, 32)]
  );
  res.json({ ok: true });
}));

/* 헬스체크 — 배포 스크립트가 확인한다 */
router.get("/health", wrap(async (_req, res) => {
  const r = await q1("SELECT 1 AS ok");
  res.json({ ok: r?.ok === 1, uptime: Math.round(process.uptime()), at: new Date().toISOString() });
}));

export default router;
