/* global React, API, UI */
/* =====================================================================
   stats.jsx — 방문 통계 (서버 기록 기반)
   ===================================================================== */
const { useState } = React;
const { useLoad, Loading, Empty, fmtNum, Select } = UI;

const PAGE_LABEL = {
  "/": "메인", "/about": "회사소개", "/services": "사업영역",
  "/facility": "시설·장비", "/portfolio": "포트폴리오", "/contact": "견적문의",
};
const DEVICE_LABEL = { desktop: "PC", mobile: "모바일", tablet: "태블릿" };

function BarList({ rows, labelKey, valueKey, label }) {
  const max = Math.max(1, ...rows.map((r) => Number(r[valueKey]) || 0));
  if (!rows.length) return <Empty label="데이터 없음" />;
  return (
    <div className="bar-line">
      {rows.map((r, i) => (
        <div className="bar-row" key={i}>
          <span className="clip" title={r[labelKey]}>{PAGE_LABEL[r[labelKey]] || r[labelKey]}</span>
          <span className="track"><span className="fill" style={{ width: `${((Number(r[valueKey]) || 0) / max) * 100}%` }} /></span>
          <span className="num mono small" style={{ textAlign: "right" }}>{fmtNum(r[valueKey])}{label || ""}</span>
        </div>
      ))}
    </div>
  );
}

function Stats() {
  const [days, setDays] = useState(30);
  const { loading, data } = useLoad(() => API.admin.visits(days), [days]);
  if (loading || !data) return <Loading />;

  /* 기록 없는 날도 0으로 채워야 기간 길이가 그래프에 제대로 보인다 */
  const byDay = Object.fromEntries(data.daily.map((r) => [r.d, r]));
  const today = new Date();
  const daily = Array.from({ length: days }, (_, i) => {
    const dt = new Date(today.getFullYear(), today.getMonth(), today.getDate() - (days - 1 - i));
    const d = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
    return byDay[d] || { d, pv: 0, uv: 0 };
  });
  const max = Math.max(1, ...daily.map((d) => Number(d.pv)));

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="card">
        <div className="card__hd">
          <h2>방문 추이</h2>
          <div style={{ flex: 1 }} />
          <div style={{ width: 130 }}>
            <Select value={String(days)} onChange={(v) => setDays(Number(v))}
              options={[
                { value: "7", label: "최근 7일" }, { value: "30", label: "최근 30일" },
                { value: "90", label: "최근 90일" }, { value: "180", label: "최근 180일" },
              ]} />
          </div>
        </div>
        <div className="card__bd">
          <div className="row" style={{ marginBottom: 14 }}>
            <span className="badge badge--new">페이지뷰 {fmtNum(data.totals.pv)}</span>
            <span className="badge badge--won">순방문자 {fmtNum(data.totals.uv)}</span>
          </div>
          <div className="bars" style={{ height: 160 }}>
            {daily.map((d) => (
              <div key={d.d} className="b"
                   style={{ height: `${(Number(d.pv) / max) * 100}%`,
                            opacity: Number(d.pv) ? 1 : 0.18 }}
                   title={`${d.d} · PV ${d.pv} / UV ${d.uv}`} />
            ))}
          </div>
          {data.totals.pv === 0 ? <Empty label="아직 방문 기록이 없습니다." /> : (
            <div className="row" style={{ justifyContent: "space-between", marginTop: 8 }}>
              <span className="small muted">{daily[0].d}</span>
              <span className="small muted">일 최대 {max} PV</span>
              <span className="small muted">{daily[daily.length - 1].d}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="card__hd"><h2>페이지별</h2></div>
          <div className="card__bd"><BarList rows={data.byPath} labelKey="path" valueKey="pv" /></div>
        </div>
        <div className="card">
          <div className="card__hd"><h2>유입 경로</h2></div>
          <div className="card__bd"><BarList rows={data.byReferrer} labelKey="ref" valueKey="pv" /></div>
        </div>
      </div>

      <div className="card">
        <div className="card__hd"><h2>기기</h2></div>
        <div className="card__bd">
          <BarList rows={data.byDevice.map((d) => ({ ...d, device: DEVICE_LABEL[d.device] || d.device }))}
                   labelKey="device" valueKey="pv" />
        </div>
      </div>

      <div className="small muted">
        방문 기록은 이 서버가 직접 집계합니다. 검색봇은 제외되며, 방문자 식별은 IP·브라우저 정보를 해시로만 저장합니다.
      </div>
    </div>
  );
}

window.Stats = Stats;
