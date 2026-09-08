/* global React, API, UI, ST_LABEL */
/* =====================================================================
   inquiries.jsx — 견적요청 관리
   상태 탭 · 검색/기간/담당 필터 · 일괄 상태변경 · 상세(메모·이력) · CSV
   ===================================================================== */
const { useState, useEffect, useCallback } = React;
const {
  Modal, useConfirm, Field, Text, Area, Select, Pager,
  Loading, Empty, toast, fmtDate, fmtAgo, fmtNum,
} = UI;

const STATUSES = ["new", "reviewing", "quoted", "won", "lost", "closed"];
const PRIORITY = { low: "낮음", normal: "보통", high: "긴급" };
const EVENT_LABEL = {
  created: "접수", status: "상태변경", note: "메모",
  call: "통화", email: "메일", meeting: "미팅", quote: "견적",
};

/* ---- 상세 ---------------------------------------------------------- */
function InquiryDetail({ id, users, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [memo, setMemo] = useState("");
  const [note, setNote] = useState("");
  const [noteType, setNoteType] = useState("note");
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    API.admin.inquiry(id)
      .then((d) => { setData(d); setMemo(d.item.memo || ""); })
      .catch(toast.err);
  }, [id]);

  useEffect(load, [load]);

  if (!data) {
    return <Modal title="견적요청" onClose={onClose} wide><Loading /></Modal>;
  }
  const it = data.item;

  const patch = async (body) => {
    setSaving(true);
    try {
      const r = await API.admin.inquiryUpdate(id, body);
      setData((d) => ({ ...d, item: r.item }));
      onChanged && onChanged();
      toast.ok("저장했습니다.");
      if (body.status) load();
    } catch (e) { toast.err(e); } finally { setSaving(false); }
  };

  const addEvent = async () => {
    if (!note.trim()) return;
    try {
      await API.admin.inquiryEvent(id, { type: noteType, note });
      setNote("");
      load();
      toast.ok("기록을 추가했습니다.");
    } catch (e) { toast.err(e); }
  };

  const KV = ({ k, v, href }) => (
    <div style={{ padding: "9px 0", borderBottom: "1px solid var(--a-line-2)" }}>
      <div className="small muted">{k}</div>
      <div style={{ marginTop: 2 }}>
        {href && v ? <a href={href} style={{ color: "var(--a-accent)" }}>{v}</a> : (v || <span className="muted">-</span>)}
      </div>
    </div>
  );

  return (
    <Modal
      title={<span>{it.company || "(회사명 없음)"} · {it.name}</span>}
      onClose={onClose}
      wide
      footer={
        <>
          <span className="small muted mono" style={{ marginRight: "auto" }}>{it.code}</span>
          <button className="btn btn--pri" disabled={saving} onClick={() => patch({ memo })}>메모 저장</button>
          <button className="btn" onClick={onClose}>닫기</button>
        </>
      }
    >
      <div className="grid grid--2" style={{ alignItems: "start" }}>
        {/* 좌: 접수 내용 */}
        <div>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className={`badge badge--${it.status}`}>{ST_LABEL[it.status]}</span>
            {it.priority === "high" ? <span className="badge badge--high">긴급</span> : null}
            <span className="small muted">{fmtDate(it.created_at)} 접수</span>
          </div>
          <KV k="회사명" v={it.company} />
          <KV k="담당자" v={it.name} />
          <KV k="연락처" v={it.phone} href={it.phone ? `tel:${it.phone}` : null} />
          <KV k="이메일" v={it.email} href={it.email ? `mailto:${it.email}` : null} />
          <KV k="요청 서비스" v={it.service} />
          <KV k="수량" v={it.quantity} />
          <KV k="희망 납기" v={it.deadline} />
          <KV k="예산" v={it.budget} />
          <div style={{ padding: "12px 0" }}>
            <div className="small muted">문의 내용</div>
            <div style={{ whiteSpace: "pre-wrap", marginTop: 6, lineHeight: 1.65 }}>{it.message}</div>
          </div>
          <div className="small muted">
            유입: {it.referrer || "직접"} · IP {it.ip || "-"}
          </div>
        </div>

        {/* 우: 처리 */}
        <div>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="card__bd">
              <Field label="처리 상태">
                <Select
                  value={it.status}
                  onChange={(v) => patch({ status: v })}
                  options={STATUSES.map((s) => ({ value: s, label: ST_LABEL[s] }))}
                />
              </Field>
              <div className="grid grid--2" style={{ gap: 10 }}>
                <Field label="우선순위">
                  <Select
                    value={it.priority}
                    onChange={(v) => patch({ priority: v })}
                    options={Object.entries(PRIORITY).map(([value, label]) => ({ value, label }))}
                  />
                </Field>
                <Field label="담당자">
                  <Select
                    value={it.assignee_id || ""}
                    onChange={(v) => patch({ assignee_id: v || null })}
                    options={[{ value: "", label: "미지정" },
                      ...users.map((u) => ({ value: String(u.id), label: u.name }))]}
                  />
                </Field>
              </div>
              <Field label="견적 금액 (원)">
                <input
                  type="number"
                  value={it.amount ?? ""}
                  onChange={(e) => setData((d) => ({ ...d, item: { ...d.item, amount: e.target.value } }))}
                  onBlur={(e) => patch({ amount: e.target.value === "" ? null : Number(e.target.value) })}
                  placeholder="예: 3500000"
                />
              </Field>
              <Field label="내부 메모">
                <Area value={memo} onChange={setMemo} placeholder="담당자 간 공유 메모" />
              </Field>
            </div>
          </div>

          <div className="card">
            <div className="card__hd"><h2>처리 이력</h2></div>
            <div className="card__bd">
              <div className="row" style={{ marginBottom: 8 }}>
                <div style={{ width: 110 }}>
                  <Select
                    value={noteType}
                    onChange={setNoteType}
                    options={[
                      { value: "note", label: "메모" }, { value: "call", label: "통화" },
                      { value: "email", label: "메일" }, { value: "meeting", label: "미팅" },
                      { value: "quote", label: "견적" },
                    ]}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <Text value={note} onChange={setNote} placeholder="예: 담당자 통화, 수량 재확인 요청" />
                </div>
                <button className="btn btn--pri" onClick={addEvent}>추가</button>
              </div>
              <div style={{ maxHeight: 260, overflow: "auto" }}>
                {data.events.map((e) => (
                  <div key={e.id} style={{ padding: "8px 0", borderTop: "1px solid var(--a-line-2)" }}>
                    <div className="row" style={{ gap: 6 }}>
                      <span className="badge badge--muted">{EVENT_LABEL[e.type] || e.type}</span>
                      <span className="small muted">{e.user_name || "시스템"}</span>
                      <div style={{ flex: 1 }} />
                      <span className="small muted">{fmtAgo(e.created_at)}</span>
                    </div>
                    <div style={{ marginTop: 4, whiteSpace: "pre-wrap" }}>{e.note}</div>
                  </div>
                ))}
                {data.events.length === 0 ? <Empty label="기록 없음" /> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* ---- 목록 ---------------------------------------------------------- */
function Inquiries({ params, canWrite }) {
  const [filter, setFilter] = useState({
    status: params?.status || "", q: "", from: "", to: "",
    assignee: "", sort: "created_desc", page: 1, size: 20,
  });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sel, setSel] = useState([]);
  const [openId, setOpenId] = useState(params?.open || null);
  const [users, setUsers] = useState([]);
  const [confirm, confirmNode] = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    API.admin.inquiries(filter)
      .then((d) => setData(d))
      .catch((e) => { setData(null); setError(e.message || "불러오지 못했습니다."); toast.err(e); })
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(load, [load]);
  useEffect(() => { API.admin.userOptions().then((d) => setUsers(d.items)).catch(() => {}); }, []);

  const set = (k, v) => setFilter((f) => ({ ...f, [k]: v, page: k === "page" ? v : 1 }));
  const toggle = (id) => setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  const allSel = data && data.items.length > 0 && sel.length === data.items.length;

  const bulk = async (status) => {
    if (!sel.length) return;
    if (!(await confirm(`선택한 ${sel.length}건의 상태를 "${ST_LABEL[status]}"로 변경할까요?`))) return;
    try {
      await API.admin.inquiryBulk(sel, status);
      setSel([]);
      load();
      toast.ok("변경했습니다.");
    } catch (e) { toast.err(e); }
  };

  const removeOne = async (id, label) => {
    if (!(await confirm(`"${label}" 견적요청을 삭제할까요?\n삭제한 내용은 복구할 수 없습니다.`, { danger: true, okLabel: "삭제" }))) return;
    try { await API.admin.inquiryDelete(id); load(); toast.ok("삭제했습니다."); }
    catch (e) { toast.err(e); }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {confirmNode}

      {/* 상태 탭 */}
      <div className="row">
        <button className={`tab${filter.status === "" ? " is-on" : ""}`} onClick={() => set("status", "")}>
          전체{data ? <span className="n">{fmtNum(data.total)}</span> : null}
        </button>
        {STATUSES.map((s) => (
          <button key={s} className={`tab${filter.status === s ? " is-on" : ""}`} onClick={() => set("status", s)}>
            {ST_LABEL[s]}{data ? <span className="n">{fmtNum(data.counts[s] || 0)}</span> : null}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          className="btn btn--sm"
          onClick={() => API.download(`/admin/inquiries/export.csv${API.qs(filter)}`)}
        >CSV 내보내기</button>
      </div>

      {/* 검색 */}
      <div className="card">
        <div className="card__bd">
          <div className="row">
            <div style={{ flex: 2, minWidth: 200 }}>
              <input
                type="search" placeholder="회사명 · 담당자 · 연락처 · 내용 · 접수번호 검색"
                defaultValue={filter.q}
                onKeyDown={(e) => { if (e.key === "Enter") set("q", e.target.value); }}
                onBlur={(e) => { if (e.target.value !== filter.q) set("q", e.target.value); }}
              />
            </div>
            <input type="date" value={filter.from} onChange={(e) => set("from", e.target.value)} style={{ width: 145 }} />
            <span className="muted">~</span>
            <input type="date" value={filter.to} onChange={(e) => set("to", e.target.value)} style={{ width: 145 }} />
            <div style={{ width: 150 }}>
              <Select
                value={filter.assignee}
                onChange={(v) => set("assignee", v)}
                options={[{ value: "", label: "담당자 전체" }, { value: "none", label: "미지정" },
                  ...users.map((u) => ({ value: String(u.id), label: u.name }))]}
              />
            </div>
            <div style={{ width: 140 }}>
              <Select
                value={filter.sort}
                onChange={(v) => set("sort", v)}
                options={[
                  { value: "created_desc", label: "최신순" },
                  { value: "created_asc", label: "오래된순" },
                  { value: "updated_desc", label: "최근수정순" },
                  { value: "status", label: "상태순" },
                ]}
              />
            </div>
            <button className="btn" onClick={() => setFilter({ status: "", q: "", from: "", to: "", assignee: "", sort: "created_desc", page: 1, size: 20 })}>초기화</button>
          </div>

          {sel.length > 0 && canWrite ? (
            <div className="row" style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid var(--a-line-2)" }}>
              <b className="small">{sel.length}건 선택</b>
              <span className="muted small">일괄 상태변경 →</span>
              {STATUSES.map((s) => (
                <button key={s} className="btn btn--sm" onClick={() => bulk(s)}>{ST_LABEL[s]}</button>
              ))}
              <button className="btn btn--sm" onClick={() => setSel([])}>선택해제</button>
            </div>
          ) : null}
        </div>
      </div>

      {/* 표 */}
      <div className="card">
        <div className="card__bd card__bd--flush">
          {loading ? <Loading /> : error ? (
            <div className="empty">
              <div style={{ color: "var(--a-danger)", marginBottom: 10 }}>{error}</div>
              <button className="btn" onClick={load}>다시 불러오기</button>
            </div>
          ) : !data || data.items.length === 0 ? (
            <Empty label="조건에 맞는 견적요청이 없습니다." />
          ) : (
            <div className="tbl-wrap">
              <table className="tbl">
                <thead>
                  <tr>
                    <th style={{ width: 34 }}>
                      <input type="checkbox" checked={allSel}
                        onChange={() => setSel(allSel ? [] : data.items.map((i) => i.id))} />
                    </th>
                    <th style={{ width: 84 }}>상태</th>
                    <th style={{ width: 140 }}>접수일</th>
                    <th>회사 / 담당자</th>
                    <th style={{ width: 130 }}>서비스</th>
                    <th style={{ width: 130 }}>연락처</th>
                    <th style={{ width: 90 }}>우리담당</th>
                    <th style={{ width: 56 }} />
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((r) => (
                    <tr key={r.id}
                        className={`${r.read_at ? "" : "is-unread"}${sel.includes(r.id) ? " is-sel" : ""}`}>
                      <td onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" checked={sel.includes(r.id)} onChange={() => toggle(r.id)} />
                      </td>
                      <td onClick={() => setOpenId(r.id)} style={{ cursor: "pointer" }}>
                        <span className={`badge badge--${r.status}`}>{ST_LABEL[r.status]}</span>
                      </td>
                      <td onClick={() => setOpenId(r.id)} style={{ cursor: "pointer" }} className="small muted">
                        {fmtDate(r.created_at)}
                      </td>
                      <td onClick={() => setOpenId(r.id)} style={{ cursor: "pointer" }}>
                        {r.priority === "high" ? <span className="badge badge--high" style={{ marginRight: 6 }}>긴급</span> : null}
                        <b>{r.company || "(회사명 없음)"}</b>
                        <span className="muted"> · {r.name}</span>
                        <div className="small muted clip">{r.message}</div>
                      </td>
                      <td onClick={() => setOpenId(r.id)} style={{ cursor: "pointer" }} className="small">{r.service || "-"}</td>
                      <td className="small mono">{r.phone || r.email || "-"}</td>
                      <td className="small">{r.assignee_name || <span className="muted">미지정</span>}</td>
                      <td>
                        {canWrite ? (
                          <button className="btn btn--sm btn--danger"
                                  onClick={() => removeOne(r.id, r.company || r.name)}>삭제</button>
                        ) : null}
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
            <Pager page={data.page} pages={data.pages} total={data.total} onPage={(p) => set("page", p)} />
          </div>
        ) : null}
      </div>

      {openId ? (
        <InquiryDetail id={openId} users={users} onClose={() => { setOpenId(null); load(); }} onChanged={load} />
      ) : null}
    </div>
  );
}

window.Inquiries = Inquiries;
