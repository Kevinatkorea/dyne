/* global React, API, UI */
/* =====================================================================
   audit.jsx — 감사 로그 + 백업/복원
   ===================================================================== */
const { useState, useEffect, useCallback, useRef } = React;
const { Pager, Loading, Empty, toast, fmtDate, useConfirm, Check } = UI;

const ACTION_LABEL = {
  login: "로그인", logout: "로그아웃", create: "등록", update: "수정", delete: "삭제",
  reorder: "순서변경", upload: "업로드", export: "내보내기", backup: "백업",
  restore: "복원", prune: "정리", event: "이력추가", "password-change": "비밀번호변경",
};
const ENTITY_LABEL = {
  inquiry: "견적요청", portfolio: "포트폴리오", media: "미디어", user: "계정",
  settings: "설정", service: "서비스", equipment: "장비", history: "연혁",
  client: "고객사", award: "수상", hero_slide: "상단배경", notice: "공지", system: "시스템",
  visits: "방문기록",
};

function Audit({ me }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    API.admin.audit({ page, size: 50 }).then(setData).catch(toast.err).finally(() => setLoading(false));
  }, [page]);
  useEffect(load, [load]);

  return (
    <div className="card">
      <div className="card__hd">
        <h2>감사 로그</h2>
        <span className="small muted">누가 언제 무엇을 바꿨는지 기록됩니다</span>
        <div style={{ flex: 1 }} />
        {me.role === "super"
          ? <button className="btn btn--sm" onClick={() => API.download("/admin/audit/export.csv")}>CSV 내보내기</button>
          : null}
      </div>
      <div className="card__bd card__bd--flush">
        {loading ? <Loading /> : !data || data.items.length === 0 ? <Empty /> : (
          <div className="tbl-wrap">
            <table className="tbl">
              <thead>
                <tr><th style={{ width: 150 }}>일시</th><th style={{ width: 110 }}>사용자</th>
                  <th style={{ width: 100 }}>동작</th><th style={{ width: 110 }}>대상</th>
                  <th>상세</th><th style={{ width: 120 }}>IP</th></tr>
              </thead>
              <tbody>
                {data.items.map((r) => (
                  <tr key={r.id}>
                    <td className="small muted">{fmtDate(r.created_at)}</td>
                    <td className="small">{r.user_name || "시스템"}</td>
                    <td><span className="badge badge--muted">{ACTION_LABEL[r.action] || r.action}</span></td>
                    <td className="small">{ENTITY_LABEL[r.entity] || r.entity || "-"}{r.entity_id ? ` #${r.entity_id}` : ""}</td>
                    <td className="small muted clip" title={r.detail}>{r.detail}</td>
                    <td className="small mono muted">{r.ip}</td>
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

function Backup({ me }) {
  const [withInq, setWithInq] = useState(false);
  const [busy, setBusy] = useState(false);
  const [replace, setReplace] = useState(false);
  const fileRef = useRef(null);
  const [confirm, confirmNode] = useConfirm();

  if (me.role !== "super") return <Empty label="백업·복원은 최고관리자만 사용할 수 있습니다." />;

  const restore = async (file) => {
    let payload;
    try { payload = JSON.parse(await file.text()); }
    catch { return toast.err("JSON 파일을 읽을 수 없습니다."); }

    const msg = replace
      ? "기존 콘텐츠를 모두 지우고 백업 내용으로 교체합니다.\n정말 진행할까요?"
      : "백업 내용을 현재 데이터에 병합합니다. 같은 ID는 덮어씁니다.\n진행할까요?";
    if (!(await confirm(msg, { danger: replace, okLabel: "복원" }))) return;

    setBusy(true);
    try {
      const r = await API.admin.restore({ ...payload, mode: replace ? "replace" : "merge" });
      toast.ok(`복원 완료 — ${Object.entries(r.restored).map(([k, v]) => `${k} ${v}건`).join(", ")}`);
    } catch (e) { toast.err(e); } finally { setBusy(false); }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {confirmNode}
      <div className="card">
        <div className="card__hd"><h2>백업 내보내기</h2></div>
        <div className="card__bd">
          <p className="small muted" style={{ marginTop: 0 }}>
            포트폴리오·서비스·장비·연혁·고객사·수상·상단배경·공지·설정·미디어 목록을 JSON 한 파일로 내려받습니다.
            업로드한 이미지 파일 자체는 서버 <span className="mono">uploads/</span> 디렉터리에 있으며 서버 백업 스크립트가 함께 보관합니다.
          </p>
          <Check checked={withInq} onChange={setWithInq} label="견적요청 내역도 포함 (개인정보 포함 — 취급 주의)" />
          <button className="btn btn--pri"
                  onClick={() => API.download(`/admin/backup${withInq ? "?inquiries=1" : ""}`)}>
            백업 파일 내려받기
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card__hd"><h2>복원</h2></div>
        <div className="card__bd">
          <Check checked={replace} onChange={setReplace} label="기존 데이터를 모두 지우고 교체 (체크 해제 시 병합)" />
          <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }}
                 onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; if (f) restore(f); }} />
          <button className="btn" disabled={busy} onClick={() => fileRef.current.click()}>
            {busy ? "복원 중…" : "백업 파일 선택"}
          </button>
        </div>
      </div>
    </div>
  );
}

window.Audit = Audit;
window.Backup = Backup;
