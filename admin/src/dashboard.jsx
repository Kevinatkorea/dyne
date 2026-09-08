/* global React, API, UI */
/* =====================================================================
   dashboard.jsx — 대시보드
   ===================================================================== */
const { useLoad, Loading, fmtNum, fmtAgo, fmtDate } = UI;

const ST_LABEL = {
  new: "신규", reviewing: "검토중", quoted: "견적발송",
  won: "수주", lost: "실주", closed: "종료",
};

function Kpi({ k, v, d, alert }) {
  return (
    <div className={`card kpi${alert ? " is-alert" : ""}`}>
      <div className="k">{k}</div>
      <div className="v">{v}</div>
      {d ? <div className="d">{d}</div> : null}
    </div>
  );
}

/* 14일 PV/UV 막대 */
function MiniBars({ rows, aKey, bKey, aLabel, bLabel }) {
  const max = Math.max(1, ...rows.map((r) => Number(r[aKey]) || 0));
  return (
    <div>
      <div className="bars">
        {rows.map((r) => (
          <div key={r.d} className="b" style={{ height: `${((Number(r[aKey]) || 0) / max) * 100}%` }} title={`${r.d} · ${aLabel} ${r[aKey]}${bKey ? ` / ${bLabel} ${r[bKey]}` : ""}`} />
        ))}
        {rows.length === 0 ? <div className="muted small">데이터 없음</div> : null}
      </div>
      <div className="row" style={{ justifyContent: "space-between", marginTop: 6 }}>
        <span className="small muted">{rows[0] ? rows[0].d.slice(5) : ""}</span>
        <span className="small muted">{rows.length ? rows[rows.length - 1].d.slice(5) : ""}</span>
      </div>
    </div>
  );
}

function Dashboard({ go }) {
  const { loading, data } = useLoad(() => API.admin.summary(), []);
  if (loading || !data) return <Loading />;

  const { inquiries: iq, portfolio, media, visits, daily, inquiryDaily, recentInquiries, recentAudit } = data;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div className="grid grid--4">
        <Kpi k="신규 견적요청" v={fmtNum(iq.new)} d={`읽지 않음 ${fmtNum(iq.unread)}건`} alert={iq.new > 0} />
        <Kpi k="오늘 접수" v={fmtNum(iq.today)} d={`최근 7일 ${fmtNum(iq.week)}건`} />
        <Kpi k="오늘 방문" v={fmtNum(visits.today)} d={`순방문 ${fmtNum(visits.uvToday)} · 7일 ${fmtNum(visits.week)}`} />
        <Kpi k="공개 포트폴리오" v={fmtNum(portfolio.total - portfolio.hidden)} d={`숨김 ${fmtNum(portfolio.hidden)} · 미디어 ${fmtNum(media.total)}`} />
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="card__hd"><h2>최근 14일 방문</h2><div style={{ flex: 1 }} />
            <button className="btn btn--sm" onClick={() => go("stats")}>통계 전체</button>
          </div>
          <div className="card__bd"><MiniBars rows={daily} aKey="pv" bKey="uv" aLabel="PV" bLabel="UV" /></div>
        </div>
        <div className="card">
          <div className="card__hd"><h2>최근 14일 견적요청</h2></div>
          <div className="card__bd"><MiniBars rows={inquiryDaily} aKey="n" aLabel="건" /></div>
        </div>
      </div>

      <div className="card">
        <div className="card__hd"><h2>견적요청 처리 현황</h2></div>
        <div className="card__bd">
          <div className="row">
            {Object.keys(ST_LABEL).map((k) => (
              <button key={k} className="tab" onClick={() => go("inquiries", { status: k })}>
                {ST_LABEL[k]}<span className="n">{fmtNum(iq.byStatus[k] || 0)}</span>
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <span className="small muted">전체 {fmtNum(iq.total)}건</span>
          </div>
        </div>
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="card__hd"><h2>최근 견적요청</h2><div style={{ flex: 1 }} />
            <button className="btn btn--sm" onClick={() => go("inquiries")}>전체보기</button>
          </div>
          <div className="card__bd card__bd--flush">
            <table className="tbl">
              <tbody>
                {recentInquiries.map((r) => (
                  <tr key={r.id} style={{ cursor: "pointer" }} onClick={() => go("inquiries", { open: r.id })}>
                    <td style={{ width: 92 }}><span className={`badge badge--${r.status}`}>{ST_LABEL[r.status]}</span></td>
                    <td className="clip"><b>{r.company || "(회사명 없음)"}</b> · {r.name}</td>
                    <td className="clip muted small">{r.service || "-"}</td>
                    <td className="muted small" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{fmtAgo(r.created_at)}</td>
                  </tr>
                ))}
                {recentInquiries.length === 0 ? (
                  <tr><td className="empty">아직 접수된 견적요청이 없습니다.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card__hd"><h2>최근 활동</h2><div style={{ flex: 1 }} />
            <button className="btn btn--sm" onClick={() => go("audit")}>감사로그</button>
          </div>
          <div className="card__bd card__bd--flush">
            <table className="tbl">
              <tbody>
                {recentAudit.map((r) => (
                  <tr key={r.id}>
                    <td style={{ width: 90 }} className="small">{r.user_name || "시스템"}</td>
                    <td className="small clip">{r.action} · {r.entity || "-"}{r.entity_id ? ` #${r.entity_id}` : ""}</td>
                    <td className="muted small" style={{ textAlign: "right", whiteSpace: "nowrap" }}>{fmtAgo(r.created_at)}</td>
                  </tr>
                ))}
                {recentAudit.length === 0 ? <tr><td className="empty">기록 없음</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="small muted">데이터 기준 {fmtDate(new Date())}</div>
    </div>
  );
}

window.Dashboard = Dashboard;
window.ST_LABEL = ST_LABEL;
