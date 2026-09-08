/* global React, API, UI */
/* =====================================================================
   settings.jsx — 사이트 설정 (회사정보 · SEO · 푸터 · 통계숫자 · 견적폼 · 기능)
   ===================================================================== */
const { useState, useEffect } = React;
const { Field, Text, Area, Check, Loading, toast } = UI;
const ImagePick = window.ImagePick;   /* content.jsx 가 먼저 로드된다 */

const GROUPS = [
  { key: "company", name: "회사 정보" },
  { key: "seo", name: "SEO · 검색엔진" },
  { key: "footer", name: "푸터" },
  { key: "stats", name: "메인 숫자" },
  { key: "inquiryForm", name: "견적요청 폼" },
  { key: "features", name: "기능 켜기/끄기" },
];

const LABEL = {
  company: {
    name: "법인명", brand: "브랜드명(한글)", brandEn: "브랜드명(영문)", ceo: "대표자",
    founded: "설립", bizNo: "사업자등록번호", address: "주소", addressShort: "약식 주소",
    tel: "전화", fax: "팩스", email: "이메일", hours: "업무시간",
    mapLat: "지도 위도", mapLng: "지도 경도",
  },
  seo: {
    title: "페이지 타이틀", description: "메타 설명", keywords: "키워드",
    canonical: "대표 주소(canonical)", ogImage: "공유 썸네일",
    naverVerification: "네이버 사이트 인증", googleVerification: "구글 사이트 인증",
    gaId: "Google Analytics ID", gtmId: "Google Tag Manager ID",
  },
  footer: { copyright: "저작권 문구", note: "부가 문구" },
  inquiryForm: {
    notifyEmail: "접수 알림 받을 이메일", thanksMessage: "접수 완료 안내문",
    services: "서비스 선택지", budgets: "예산 선택지", enabled: "견적요청 접수 사용",
  },
  features: {
    tweaksPanel: "개발용 튜닝 패널 표시", visitTracking: "방문 통계 수집",
    popupNotice: "공지 팝업 표시", portfolioPublic: "포트폴리오 공개",
  },
};

const LONG = new Set(["description", "keywords", "thanksMessage", "note", "address"]);

function GroupEditor({ gkey, value, onChange }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v });

  /* 메인 숫자는 배열 */
  if (gkey === "stats") {
    const rows = Array.isArray(value) ? value : [];
    const upd = (i, k, v) => onChange(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
    return (
      <div>
        {rows.map((r, i) => (
          <div className="row" key={i} style={{ marginBottom: 8 }}>
            <div style={{ width: 150 }}><Text value={r.label} onChange={(v) => upd(i, "label", v)} placeholder="항목명" /></div>
            <div style={{ width: 120 }}><Text value={r.value} onChange={(v) => upd(i, "value", v)} placeholder="숫자" /></div>
            <div style={{ width: 80 }}><Text value={r.suffix} onChange={(v) => upd(i, "suffix", v)} placeholder="단위" /></div>
            <button className="btn btn--sm btn--danger" onClick={() => onChange(rows.filter((_, j) => j !== i))}>삭제</button>
          </div>
        ))}
        <button className="btn btn--sm" onClick={() => onChange([...rows, { label: "", value: "", suffix: "" }])}>+ 항목 추가</button>
      </div>
    );
  }

  return (
    <>
      {Object.entries(value || {}).map(([k, v]) => {
        const label = (LABEL[gkey] && LABEL[gkey][k]) || k;
        if (typeof v === "boolean") {
          return <Check key={k} checked={v} onChange={set(k)} label={label} />;
        }
        if (Array.isArray(v)) {
          return (
            <Field key={k} label={label} hint="줄바꿈으로 구분">
              <Area value={v.join("\n")} onChange={(s) => set(k)(s.split("\n").map((x) => x.trim()).filter(Boolean))} />
            </Field>
          );
        }
        if (typeof v === "object" && v !== null) return null;
        if (k === "ogImage") {
          return <Field key={k} label={label}><ImagePick value={v} onChange={set(k)} folder="general" /></Field>;
        }
        if (LONG.has(k)) {
          return <Field key={k} label={label}><Area value={String(v ?? "")} onChange={set(k)} /></Field>;
        }
        return <Field key={k} label={label}><Text value={String(v ?? "")} onChange={set(k)} /></Field>;
      })}
    </>
  );
}

function Settings({ canWrite }) {
  const [tab, setTab] = useState("company");
  const [settings, setSettings] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.admin.settings().then((d) => setSettings(d.settings)).catch(toast.err);
  }, []);

  if (!settings) return <Loading />;

  const save = async () => {
    setSaving(true);
    try {
      const r = await API.admin.settingsSave({ [tab]: settings[tab] });
      setSettings(r.settings);
      setDirty(false);
      toast.ok("저장했습니다. 홈페이지에 바로 반영됩니다.");
    } catch (e) { toast.err(e); } finally { setSaving(false); }
  };

  const reset = async () => {
    try {
      const r = await API.admin.settingsReset(tab);
      setSettings(r.settings);
      setDirty(false);
      toast.ok("기본값으로 되돌렸습니다.");
    } catch (e) { toast.err(e); }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="row">
        {GROUPS.map((g) => (
          <button key={g.key} className={`tab${tab === g.key ? " is-on" : ""}`} onClick={() => setTab(g.key)}>{g.name}</button>
        ))}
      </div>

      <div className="card">
        <div className="card__hd">
          <h2>{GROUPS.find((g) => g.key === tab).name}</h2>
          <div style={{ flex: 1 }} />
          {dirty ? <span className="badge badge--reviewing">저장되지 않은 변경</span> : null}
          {canWrite ? (
            <>
              <button className="btn btn--sm" onClick={reset}>기본값 복원</button>
              <button className="btn btn--pri" disabled={saving || !dirty} onClick={save}>저장</button>
            </>
          ) : null}
        </div>
        <div className="card__bd" style={{ maxWidth: 720 }}>
          <GroupEditor
            gkey={tab}
            value={settings[tab]}
            onChange={(v) => { setSettings((s) => ({ ...s, [tab]: v })); setDirty(true); }}
          />
        </div>
      </div>

      <div className="small muted">
        저장 즉시 홈페이지에 반영됩니다(공개 데이터는 최대 20초 캐시).
        SEO 설정 중 페이지 타이틀·메타 설명은 검색엔진 재수집 후 노출까지 시간이 걸립니다.
      </div>
    </div>
  );
}

window.Settings = Settings;
