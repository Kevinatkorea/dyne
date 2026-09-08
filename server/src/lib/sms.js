/* =====================================================================
   sms.js — 알리고(Aligo) 문자 발송
   https://apis.aligo.in/send/   POST (application/x-www-form-urlencoded)
     필수: key, user_id, sender, receiver, msg
     선택: msg_type(SMS|LMS|MMS), title(LMS/MMS 전용, 44바이트), testmode_yn
     응답: { result_code: 1 성공 / 음수 실패, message, msg_id, success_cnt, error_cnt }

   발송 실패가 견적요청 접수를 막아서는 안 된다.
   이 모듈은 절대 throw 하지 않고 { ok, ... } 를 돌려준다.
   ===================================================================== */
import { exec } from "../db.js";

const SEND_URL = "https://apis.aligo.in/send/";
const REMAIN_URL = "https://apis.aligo.in/remain/";
const TIMEOUT_MS = 12000;

/** 알리고는 EUC-KR 바이트로 길이를 센다 — 한글 2바이트, ASCII 1바이트. */
export function smsByteLength(text) {
  let n = 0;
  for (const ch of String(text || "")) n += ch.charCodeAt(0) > 0x7f ? 2 : 1;
  return n;
}

/** 90바이트 이하면 SMS, 넘으면 LMS (알리고 기준) */
export const smsTypeFor = (text) => (smsByteLength(text) <= 90 ? "SMS" : "LMS");

/** 전화번호 정규화 — 숫자만 남긴다. 유효하지 않으면 null. */
export function normalizePhone(v) {
  const d = String(v || "").replace(/[^0-9]/g, "");
  if (!d) return null;
  /* 국가번호 82 → 0 으로 (예: 821012345678 → 01012345678) */
  const local = d.startsWith("82") && d.length >= 11 ? "0" + d.slice(2) : d;
  if (local.length < 9 || local.length > 11) return null;
  if (!local.startsWith("0")) return null;
  return local;
}

/** 44바이트로 자르기 (LMS 제목 제한) */
function clipTitle(text) {
  let out = "";
  let n = 0;
  for (const ch of String(text || "")) {
    const w = ch.charCodeAt(0) > 0x7f ? 2 : 1;
    if (n + w > 44) break;
    out += ch;
    n += w;
  }
  return out || "알림";
}

/** 본문 템플릿 — {name} 같은 자리표시자를 채운다. 없는 값은 빈 문자열. */
export function renderTemplate(tpl, vars) {
  return String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => {
    const v = vars[k];
    return v === undefined || v === null ? "" : String(v);
  }).replace(/\n{3,}/g, "\n\n").trim();
}

function conf(settings) {
  const s = (settings && settings.sms) || {};
  return {
    enabled: s.enabled === true,
    apiKey: String(s.apiKey || "").trim(),
    userId: String(s.userId || "").trim(),
    sender: normalizePhone(s.sender),
    testMode: s.testMode === true,
  };
}

/** 설정이 실제로 발송 가능한 상태인지 */
export function smsReady(settings) {
  const c = conf(settings);
  if (!c.enabled) return { ok: false, reason: "문자 발송이 꺼져 있습니다." };
  if (!c.apiKey) return { ok: false, reason: "API 키가 비어 있습니다." };
  if (!c.userId) return { ok: false, reason: "알리고 아이디가 비어 있습니다." };
  if (!c.sender) return { ok: false, reason: "발신번호가 없거나 형식이 올바르지 않습니다." };
  return { ok: true };
}

/**
 * 문자 발송. 절대 throw 하지 않는다.
 * @returns {{ok:boolean, resultCode?:string, message:string, msgId?:string, msgType?:string, skipped?:boolean}}
 */
export async function sendSms(settings, { to, text, title, kind = "staff", inquiryId = null }) {
  const c = conf(settings);
  const ready = smsReady(settings);
  const receivers = (Array.isArray(to) ? to : [to])
    .map(normalizePhone)
    .filter(Boolean);

  const body = String(text || "").trim();
  const base = {
    inquiry_id: inquiryId, kind, sender: c.sender,
    receiver: receivers.join(",").slice(0, 200), body,
  };

  if (!ready.ok) return log({ ...base, ok: 0, message: ready.reason }, { skipped: true });
  if (!receivers.length) return log({ ...base, ok: 0, message: "받는 번호가 없습니다." }, { skipped: true });
  if (!body) return log({ ...base, ok: 0, message: "본문이 비어 있습니다." }, { skipped: true });

  const msgType = smsTypeFor(body);
  const form = new URLSearchParams({
    key: c.apiKey,
    user_id: c.userId,
    sender: c.sender,
    receiver: receivers.join(","),
    msg: body,
    msg_type: msgType,
  });
  if (msgType !== "SMS") form.set("title", clipTitle(title || "알림"));
  if (c.testMode) form.set("testmode_yn", "Y");

  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(SEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
      body: form,
      signal: ac.signal,
    });
    const data = await res.json().catch(() => ({}));
    /* 알리고: result_code 1 이 성공, 음수가 실패 */
    const code = Number(data.result_code);
    const ok = code === 1;
    return log(
      {
        ...base, msg_type: msgType, ok: ok ? 1 : 0,
        result_code: String(data.result_code ?? res.status),
        message: String(data.message || (ok ? "success" : "발송 실패")).slice(0, 400),
        msg_id: data.msg_id != null ? String(data.msg_id) : null,
      },
      { resultCode: String(data.result_code ?? ""), msgType, testMode: c.testMode }
    );
  } catch (e) {
    const msg = e.name === "AbortError" ? "알리고 응답 시간 초과" : `발송 오류: ${e.message}`;
    return log({ ...base, msg_type: msgType, ok: 0, message: msg });
  } finally {
    clearTimeout(timer);
  }
}

/** 이력 기록 후 결과 객체 반환. 기록 실패해도 발송 결과는 그대로 돌려준다. */
async function log(row, extra = {}) {
  try {
    await exec(
      `INSERT INTO sms_logs (inquiry_id, kind, receiver, sender, msg_type, body, ok, result_code, message, msg_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        row.inquiry_id ?? null, row.kind, row.receiver || "-", row.sender ?? null,
        row.msg_type ?? null, row.body ? row.body.slice(0, 4000) : null,
        row.ok ? 1 : 0, row.result_code ?? null,
        row.message ? String(row.message).slice(0, 400) : null, row.msg_id ?? null,
      ]
    );
  } catch (e) {
    console.error("[sms] 이력 기록 실패:", e.message);
  }
  if (!row.ok) console.warn(`[sms] ${row.kind} → ${row.receiver}: ${row.message}`);
  return { ok: !!row.ok, message: row.message || "", ...extra };
}

/** 잔여 건수 조회 */
export async function remainCount(settings) {
  const c = conf(settings);
  if (!c.apiKey || !c.userId) return { ok: false, message: "API 키와 아이디를 먼저 저장하세요." };
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(REMAIN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=utf-8" },
      body: new URLSearchParams({ key: c.apiKey, user_id: c.userId }),
      signal: ac.signal,
    });
    const d = await res.json().catch(() => ({}));
    if (Number(d.result_code) !== 1) {
      return { ok: false, message: String(d.message || "조회 실패") };
    }
    return { ok: true, sms: d.SMS_CNT, lms: d.LMS_CNT, mms: d.MMS_CNT, message: "조회 성공" };
  } catch (e) {
    return { ok: false, message: e.name === "AbortError" ? "응답 시간 초과" : e.message };
  } finally {
    clearTimeout(timer);
  }
}
