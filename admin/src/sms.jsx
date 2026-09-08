/* global React, API, UI */
/* =====================================================================
   sms.jsx — 문자 알림 (알리고)
   API 설정 · 신청자/담당자 문자 템플릿 · 테스트 발송 · 발송 이력
   ===================================================================== */
const { useState, useEffect, useCallback } = React;
const { Field, Text, Area, Check, Loading, Empty, toast, fmtDate, Pager } = UI;

/* 템플릿에서 쓸 수 있는 자리표시자 */
const VARS = [
  ["{code}", "접수번호"], ["{company}", "회사명"], ["{name}", "담당자"],
  ["{phone}", "연락처"], ["{email}", "이메일"], ["{service}", "서비스"],
  ["{quantity}", "수량"], ["{deadline}", "납기"], ["{budget}", "예산"],
  ["{message}", "문의내용"],
];

function VarHelp() {
  return (
    <div className="small muted" style={{ marginTop: 4, lineHeight: 1.9 }}>
      쓸 수 있는 항목:{" "}
      {VARS.map(([v, label]) => (
        <span key={v} className="badge badge--muted" style={{ marginRight: 4 }}>
          <span className="mono">{v}</span> {label}
        </span>
      ))}
    </div>
  );
}

/* 본문 길이/종류 표시 — 90바이트 넘으면 LMS(요금이 다르다) */
function LengthBadge({ text }) {
  const [info, setInfo] = useState(null);
  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      API.post("/admin/sms/preview", { template: text })
        .then((d) => alive && setInfo(d))
        .catch(() => {});
    }, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [text]);
  if (!info) return null;
  return (
    <div className="small" style={{ marginTop: 6 }}>
      <span className={`badge badge--${info.type === "SMS" ? "won" : "reviewing"}`}>
        {info.type} · {info.bytes}바이트
      </span>
      <span className="muted" style={{ marginLeft: 8 }}>
        {info.type === "SMS" ? "90바이트 이하 — 단문 요금" : "90바이트 초과 — 장문(LMS) 요금"}
      </span>
      <div className="muted" style={{ whiteSpace: "pre-wrap", marginTop: 6,
        padding: 10, background: "#fafbfc", border: "1px solid var(--a-line-2)", borderRadius: 6 }}>
        {info.text}
      </div>
    </div>
  );
}

function SmsLogs({ nonce }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    API.get("/admin/sms/logs", { page, size: 20 })
      .then(setData).catch(toast.err).finally(() => setLoading(false));
  }, [page, nonce]);
  useEffect(load, [load]);

  const KIND = { customer: "신청자", staff: "담당자", test: "테스트" };

  return (
    <div className="card">
      <div className="card__hd">
        <h2>발송 이력</h2>
        {data && data.failed > 0
          ? <span className="badge badge--lost">실패 {data.failed}건</span> : null}
        <div style={{ flex: 1 }} />
        <button className="btn btn--sm" onClick={load}>새로고침</button>
      </div>
      <div className="card__bd card__bd--flush">
        {loading ? <Loading /> : !data || data.items.length === 0 ? (
          <Empty label="아직 발송 이력이 없습니다." />
        ) : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 150 }}>일시</th>
                  <th style={{ width: 72 }}>구분</th>
                  <th style={{ width: 130 }}>받는번호</th>
                  <th style={{ width: 62 }}>종류</th>
                  <th style={{ width: 70 }}>결과</th>
                  <th>내용 / 메시지</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td className="small muted">{fmtDate(r.created_at)}</td>
                    <td><span className="badge badge--muted">{KIND[r.kind] || r.kind}</span></td>
                    <td className="small mono">{r.receiver}</td>
                    <td className="small">{r.msg_type || "-"}</td>
                    <td>{r.ok
                      ? <span className="badge badge--won">성공</span>
                      : <span className="badge badge--lost">실패</span>}</td>
                    <td className="small clip" title={`${r.message || ""}\n\n${r.body || ""}`}>
                      {r.ok ? (r.body || "") : (r.message || "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data ? (
        <div className="card__hd" style={{ borderTop: "1px solid var(--a-line-2)", borderBottom: 0 }}>
          <Pager page={data.page} pages={data.pages} total={data.total} onPage={setPage} />
        </div>
      ) : null}
    </div>
  );
}

function Sms({ canWrite }) {
  const [settings, setSettings] = useState(null);
  const [meta, setMeta] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [remain, setRemain] = useState(null);
  const [testTo, setTestTo] = useState("");
  const [testWhich, setTestWhich] = useState("staff");
  const [sending, setSending] = useState(false);
  const [logNonce, setLogNonce] = useState(0);

  const load = useCallback(() => {
    API.admin.settings()
      .then((d) => { setSettings(d.settings); setMeta(d.meta || {}); setDirty(false); })
      .catch(toast.err);
  }, []);
  useEffect(load, [load]);

  const checkRemain = useCallback(() => {
    API.get("/admin/sms/remain").then(setRemain).catch(toast.err);
  }, []);
  useEffect(checkRemain, [checkRemain]);

  if (!settings) return <Loading />;
  const sms = settings.sms || {};
  const set = (k) => (v) => { setSettings((s) => ({ ...s, sms: { ...s.sms, [k]: v } })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      const r = await API.admin.settingsSave({ sms: settings.sms });
      setSettings(r.settings);
      setMeta(r.meta || {});
      setDirty(false);
      toast.ok("저장했습니다.");
      checkRemain();
    } catch (e) { toast.err(e); } finally { setSaving(false); }
  };

  const test = async () => {
    if (!testTo.trim()) return toast.err("받는 번호를 입력하세요.");
    if (dirty) return toast.err("먼저 저장한 뒤 테스트하세요. (저장된 설정으로 발송합니다)");
    setSending(true);
    try {
      const r = await API.post("/admin/sms/test", { to: testTo, template: testWhich });
      setLogNonce((n) => n + 1);
      if (r.ok) {
        toast.ok(r.testMode
          ? "테스트모드로 처리했습니다 (실제 발송 안 됨)."
          : `발송했습니다 — ${r.preview.type} ${r.preview.bytes}바이트`);
      } else {
        toast.err(`발송 실패: ${r.message}`);
      }
    } catch (e) { toast.err(e); } finally { setSending(false); }
  };

  const keySet = meta?.sms?.apiKey?.set;
  const keyHint = meta?.sms?.apiKey?.hint;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {/* 연결 상태 */}
      <div className="card">
        <div className="card__hd">
          <h2>알리고 연결</h2>
          <div style={{ flex: 1 }} />
          {remain?.ready?.ok
            ? <span className="badge badge--won">발송 준비됨</span>
            : <span className="badge badge--lost">{remain?.ready?.reason || "설정 필요"}</span>}
          {remain?.remain?.ok ? (
            <span className="small muted">
              잔여 SMS {remain.remain.sms} · LMS {remain.remain.lms} · MMS {remain.remain.mms}
            </span>
          ) : remain?.remain?.message ? (
            <span className="small muted">잔여 조회: {remain.remain.message}</span>
          ) : null}
          <button className="btn btn--sm" onClick={checkRemain}>다시 확인</button>
        </div>
        <div className="card__bd" style={{ maxWidth: 640 }}>
          <Check checked={!!sms.enabled} onChange={set("enabled")} label="문자 발송 사용" />

          <Field label="API 키"
            hint={keySet
              ? `저장되어 있습니다 (${keyHint}). 바꿀 때만 새 값을 입력하세요.`
              : "알리고 [문자 API] 메뉴에서 발급한 키"}>
            <input type="password" autoComplete="new-password"
              value={sms.apiKey || ""} onChange={(e) => set("apiKey")(e.target.value)}
              placeholder={keySet ? "변경하지 않으려면 비워 두세요" : "발급받은 API 키"} />
          </Field>

          <Field label="알리고 아이디" hint="API 키를 발급받은 계정의 아이디">
            <Text value={sms.userId} onChange={set("userId")} placeholder="aligo_id" />
          </Field>

          <Field label="발신번호"
            hint="알리고에 사전 등록·승인된 번호만 쓸 수 있습니다. 미등록 번호는 발송이 거부됩니다.">
            <Text value={sms.sender} onChange={set("sender")} placeholder="02-514-2450" />
          </Field>

          <Check checked={!!sms.testMode} onChange={set("testMode")}
            label="테스트 모드 (실제로 보내지 않고 성공 응답만 — 요금 미차감)" />
        </div>
      </div>

      {/* 신청자 문자 */}
      <div className="card">
        <div className="card__hd">
          <h2>1. 신청자에게 접수 확인 문자</h2>
          <span className="small muted">견적요청 폼에 적힌 연락처로 발송</span>
        </div>
        <div className="card__bd" style={{ maxWidth: 720 }}>
          <Check checked={!!sms.notifyCustomer} onChange={set("notifyCustomer")}
            label="상담신청이 들어오면 신청자에게 접수 확인 문자를 보낸다" />
          <Field label="제목 (장문일 때만 표시)">
            <Text value={sms.customerTitle} onChange={set("customerTitle")} />
          </Field>
          <Field label="본문">
            <Area value={sms.customerTemplate} onChange={set("customerTemplate")} rows={6} />
          </Field>
          <VarHelp />
          <LengthBadge text={sms.customerTemplate || ""} />
        </div>
      </div>

      {/* 담당자 문자 */}
      <div className="card">
        <div className="card__hd">
          <h2>2. 담당자에게 알림 문자</h2>
          <span className="small muted">지정한 번호로 발송</span>
        </div>
        <div className="card__bd" style={{ maxWidth: 720 }}>
          <Check checked={!!sms.notifyStaff} onChange={set("notifyStaff")}
            label="상담신청이 들어오면 담당자에게 알림 문자를 보낸다" />
          <Field label="받는 번호" hint="줄바꿈으로 여러 명 등록">
            <Area
              value={(sms.staffReceivers || []).join("\n")}
              onChange={(v) => set("staffReceivers")(v.split("\n").map((x) => x.trim()).filter(Boolean))}
              rows={3}
              placeholder={"010-1234-5678\n010-9876-5432"} />
          </Field>
          <Field label="제목 (장문일 때만 표시)">
            <Text value={sms.staffTitle} onChange={set("staffTitle")} />
          </Field>
          <Field label="본문">
            <Area value={sms.staffTemplate} onChange={set("staffTemplate")} rows={6} />
          </Field>
          <VarHelp />
          <LengthBadge text={sms.staffTemplate || ""} />
        </div>
      </div>

      {/* 저장 + 테스트 */}
      <div className="card">
        <div className="card__hd">
          <h2>저장 · 테스트 발송</h2>
          <div style={{ flex: 1 }} />
          {dirty ? <span className="badge badge--reviewing">저장되지 않은 변경</span> : null}
          {canWrite ? (
            <button className="btn btn--pri" disabled={saving || !dirty} onClick={save}>저장</button>
          ) : null}
        </div>
        <div className="card__bd">
          <div className="row" style={{ alignItems: "flex-end" }}>
            <div style={{ width: 180 }}>
              <Field label="받는 번호">
                <Text value={testTo} onChange={setTestTo} placeholder="010-0000-0000" />
              </Field>
            </div>
            <div style={{ width: 170 }}>
              <Field label="보낼 내용">
                <select value={testWhich} onChange={(e) => setTestWhich(e.target.value)}>
                  <option value="staff">담당자 알림 템플릿</option>
                  <option value="customer">신청자 확인 템플릿</option>
                  <option value="custom">간단 테스트 문구</option>
                </select>
              </Field>
            </div>
            <div style={{ marginBottom: 12 }}>
              <button className="btn" disabled={sending || !canWrite} onClick={test}>
                {sending ? "발송 중…" : "테스트 발송"}
              </button>
            </div>
          </div>
          <div className="small muted">
            저장된 설정으로 실제 발송합니다. 요금이 나가지 않게 확인만 하려면 위의 <b>테스트 모드</b>를 켜세요.
          </div>
        </div>
      </div>

      <SmsLogs nonce={logNonce} />

      <div className="small muted">
        접수 확인 문자는 신청자가 직접 요청한 건에 대한 <b>정보성 안내</b>입니다.
        여기에 홍보·할인 같은 광고성 문구를 넣으면 정보통신망법상 광고 표기(‘(광고)’ 문구·수신거부 번호) 의무가 생깁니다.
      </div>
    </div>
  );
}

window.Sms = Sms;
