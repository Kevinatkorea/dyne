/* global React, API, UI */
/* =====================================================================
   portfolio.jsx — 포트폴리오 관리
   · 타일을 끌어다 놓아 노출 순서 변경 (드래그앤드롭)
   · 파일을 끌어다 놓아 업로드 (드래그앤드롭)
   · 카테고리/연도별 필터 · 다중선택 일괄작업 · 항목 상세 편집
   ===================================================================== */
const { useState, useEffect, useCallback, useMemo } = React;
const {
  Modal, useConfirm, Field, Text, Area, Select, Check, DropZone,
  useSortable, Loading, Empty, toast, imgUrl, fmtNum, fmtDate,
} = UI;

const CATEGORIES = [
  "표지디자인", "브로슈어_카탈로그", "리플릿", "포스터",
  "보고서_자료집", "현수막_배너", "기타인쇄물",
];
const catLabel = (c) => (c ? c.replace(/_/g, " / ") : "미분류");

/* ---- 항목 편집 ------------------------------------------------------ */
function ItemEditor({ item, years, onClose, onSaved, onDeleted, canWrite }) {
  const [f, setF] = useState({ ...item });
  const [busy, setBusy] = useState(false);
  const [confirm, confirmNode] = useConfirm();
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const r = await API.admin.portfolioUpdate(item.id, {
        title: f.title, client: f.client, description: f.description, tags: f.tags,
        category: f.category || null, year: f.year || null,
        visible: f.visible ? 1 : 0, featured: f.featured ? 1 : 0,
      });
      onSaved(r.item);
      toast.ok("저장했습니다.");
      onClose();
    } catch (e) { toast.err(e); } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!(await confirm("이 작업물을 삭제할까요?\n업로드한 이미지도 함께 삭제됩니다.", { danger: true, okLabel: "삭제" }))) return;
    try { await API.admin.portfolioDelete(item.id); onDeleted(item.id); toast.ok("삭제했습니다."); onClose(); }
    catch (e) { toast.err(e); }
  };

  return (
    <Modal
      title="작업물 상세"
      onClose={onClose}
      wide
      footer={
        canWrite ? (
          <>
            <button className="btn btn--danger" style={{ marginRight: "auto" }} onClick={remove}>삭제</button>
            <button className="btn" onClick={onClose}>취소</button>
            <button className="btn btn--pri" disabled={busy} onClick={save}>저장</button>
          </>
        ) : <button className="btn" onClick={onClose}>닫기</button>
      }
    >
      {confirmNode}
      <div className="grid grid--2" style={{ alignItems: "start" }}>
        <div>
          <img src={imgUrl(item.src)} alt="" style={{ width: "100%", borderRadius: 8, border: "1px solid var(--a-line)" }} />
          <div className="small muted mono" style={{ marginTop: 6, wordBreak: "break-all" }}>{item.src}</div>
          <div className="small muted">등록 {fmtDate(item.created_at)}</div>
        </div>
        <div>
          <Field label="제목"><Text value={f.title} onChange={set("title")} placeholder="예: 2024 문화체육관광부 연차보고서" /></Field>
          <Field label="발주처 / 클라이언트"><Text value={f.client} onChange={set("client")} /></Field>
          <div className="grid grid--2" style={{ gap: 10 }}>
            <Field label="카테고리">
              <Select value={f.category || ""} onChange={set("category")}
                options={[{ value: "", label: "미분류" }, ...CATEGORIES.map((c) => ({ value: c, label: catLabel(c) }))]} />
            </Field>
            <Field label="연도">
              <Select value={f.year || ""} onChange={set("year")}
                options={[{ value: "", label: "미지정" }, ...years.map((y) => ({ value: y, label: y }))]} />
            </Field>
          </div>
          <Field label="설명"><Area value={f.description} onChange={set("description")} /></Field>
          <Field label="태그" hint="쉼표로 구분">
            <Text value={f.tags} onChange={set("tags")} placeholder="보고서, 무선제본, 200p" />
          </Field>
          <Check checked={f.visible} onChange={set("visible")} label="홈페이지에 노출" />
          <Check checked={f.featured} onChange={set("featured")} label="대표 작업물 (메인 우선 노출)" />
        </div>
      </div>
    </Modal>
  );
}

/* ---- 본체 ---------------------------------------------------------- */
function Portfolio({ canWrite }) {
  const [scope, setScope] = useState({ kind: "all", value: "" });   // all | category | year | hidden
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [groups, setGroups] = useState({ byCategory: [], byYear: [] });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState([]);
  const [edit, setEdit] = useState(null);
  const [uploading, setUploading] = useState(0);
  const [confirm, confirmNode] = useConfirm();

  const params = useMemo(() => {
    const p = { limit: 500, q };
    if (scope.kind === "category") p.category = scope.value;
    if (scope.kind === "year") p.year = scope.value;
    if (scope.kind === "hidden") p.visible = "0";
    return p;
  }, [scope, q]);

  const load = useCallback(() => {
    setLoading(true);
    API.admin.portfolio(params)
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
        setGroups({ byCategory: d.byCategory, byYear: d.byYear });
      })
      .catch(toast.err)
      .finally(() => setLoading(false));
  }, [params]);

  useEffect(load, [load]);

  const years = groups.byYear.map((y) => y.year);

  /* 드래그앤드롭 정렬 — 놓는 즉시 서버 저장 */
  const onReorder = (next) => {
    setItems(next);
    API.admin.portfolioReorder(next.map((i) => i.id))
      .then(() => toast.ok("순서를 저장했습니다."))
      .catch((e) => { toast.err(e); load(); });
  };
  const sortable = useSortable(items, onReorder);

  /* 드래그앤드롭 업로드 */
  const upload = async (files) => {
    setUploading(1);
    try {
      const res = await API.upload(
        "/admin/portfolio/upload",
        files,
        {
          category: scope.kind === "category" ? scope.value : "",
          year: scope.kind === "year" ? scope.value : "",
        },
        (p) => setUploading(p)
      );
      toast.ok(`${res.items.length}장을 업로드했습니다.`);
      load();
    } catch (e) { toast.err(e); } finally { setUploading(0); }
  };

  const toggleSel = (id, e) => {
    if (e && e.shiftKey && sel.length) {
      const last = sel[sel.length - 1];
      const a = items.findIndex((i) => i.id === last);
      const b = items.findIndex((i) => i.id === id);
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a];
        const range = items.slice(lo, hi + 1).map((i) => i.id);
        setSel((s) => Array.from(new Set([...s, ...range])));
        return;
      }
    }
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const bulk = async (action, extra = {}) => {
    if (!sel.length) return;
    if (action === "delete" &&
        !(await confirm(`선택한 ${sel.length}장을 삭제할까요?\n업로드한 이미지 파일도 함께 삭제됩니다.`, { danger: true, okLabel: "삭제" }))) return;
    try {
      await API.admin.portfolioBulk({ ids: sel, action, ...extra });
      setSel([]);
      load();
      toast.ok("적용했습니다.");
    } catch (e) { toast.err(e); }
  };

  const NavRow = ({ on, onClick, label, n, hidden }) => (
    <button className={`nav__item`} onClick={onClick}
      style={{
        margin: 0, width: "100%", color: on ? "#fff" : "var(--a-ink-2)",
        background: on ? "var(--a-accent)" : "transparent", borderRadius: 6, fontWeight: on ? 700 : 500,
      }}>
      <span className="t" style={{ flex: 1, textAlign: "left" }}>{label}</span>
      <span className="small" style={{ opacity: .7 }}>
        {fmtNum(n)}{hidden ? ` (숨김 ${hidden})` : ""}
      </span>
    </button>
  );

  return (
    <div className="grid grid--sidebar" style={{ gap: 16 }}>
      {confirmNode}

      {/* 좌: 분류 */}
      <div className="card" style={{ position: "sticky", top: 78 }}>
        <div className="card__bd" style={{ padding: 8 }}>
          <NavRow on={scope.kind === "all"} onClick={() => setScope({ kind: "all", value: "" })} label="전체" n={total} />
          <NavRow on={scope.kind === "hidden"} onClick={() => setScope({ kind: "hidden", value: "" })} label="숨김만 보기" n={groups.byCategory.reduce((a, c) => a + Number(c.hidden || 0), 0) + groups.byYear.reduce((a, c) => a + Number(c.hidden || 0), 0)} />
          <div className="nav__group" style={{ color: "var(--a-ink-3)" }}>카테고리</div>
          {groups.byCategory.map((c) => (
            <NavRow key={c.category} on={scope.kind === "category" && scope.value === c.category}
              onClick={() => setScope({ kind: "category", value: c.category })}
              label={catLabel(c.category)} n={c.n} hidden={Number(c.hidden) || 0} />
          ))}
          <div className="nav__group" style={{ color: "var(--a-ink-3)" }}>연도별</div>
          {groups.byYear.map((y) => (
            <NavRow key={y.year} on={scope.kind === "year" && scope.value === y.year}
              onClick={() => setScope({ kind: "year", value: y.year })}
              label={`${y.year}년`} n={y.n} hidden={Number(y.hidden) || 0} />
          ))}
        </div>
      </div>

      {/* 우: 타일 */}
      <div style={{ display: "grid", gap: 14, minWidth: 0 }}>
        {canWrite ? (
          <DropZone onFiles={upload} disabled={uploading > 0}>
            {uploading > 0 ? (
              <>
                <div style={{ fontSize: 20 }}>⏳</div>
                <div><b>업로드 중… {uploading}%</b></div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 20, marginBottom: 4 }}>⬆</div>
                <div><b>이미지를 여기에 끌어다 놓으면 바로 등록됩니다</b></div>
                <div className="small" style={{ marginTop: 4 }}>
                  {scope.kind === "category" ? `→ ${catLabel(scope.value)} 카테고리로 등록`
                    : scope.kind === "year" ? `→ ${scope.value}년으로 등록`
                    : "→ 미분류로 등록 (나중에 분류 가능)"} · 한 번에 40장까지
                </div>
              </>
            )}
          </DropZone>
        ) : null}

        <div className="card">
          <div className="card__hd">
            <h2>
              {scope.kind === "all" ? "전체" : scope.kind === "hidden" ? "숨김"
                : scope.kind === "category" ? catLabel(scope.value) : `${scope.value}년`}
            </h2>
            <span className="small muted">{fmtNum(items.length)}장 · 타일을 끌어서 순서 변경</span>
            <div style={{ flex: 1 }} />
            <input type="search" placeholder="제목·발주처·태그 검색" style={{ width: 220 }}
              defaultValue={q}
              onKeyDown={(e) => { if (e.key === "Enter") setQ(e.target.value); }}
              onBlur={(e) => { if (e.target.value !== q) setQ(e.target.value); }} />
            <button className="btn btn--sm" onClick={() => setSel(sel.length === items.length ? [] : items.map((i) => i.id))}>
              {sel.length === items.length && items.length ? "선택해제" : "전체선택"}
            </button>
          </div>

          {sel.length > 0 && canWrite ? (
            <div className="card__hd" style={{ background: "#f7f9fc", flexWrap: "wrap" }}>
              <b className="small">{sel.length}장 선택</b>
              <button className="btn btn--sm" onClick={() => bulk("show")}>노출</button>
              <button className="btn btn--sm" onClick={() => bulk("hide")}>숨김</button>
              <button className="btn btn--sm" onClick={() => bulk("feature")}>대표지정</button>
              <button className="btn btn--sm" onClick={() => bulk("unfeature")}>대표해제</button>
              <span className="muted small">카테고리 이동</span>
              <select style={{ width: 150 }} value=""
                onChange={(e) => e.target.value && bulk("category", { category: e.target.value === "__none" ? "" : e.target.value })}>
                <option value="">선택…</option>
                <option value="__none">미분류</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
              </select>
              <button className="btn btn--sm btn--danger" onClick={() => bulk("delete")}>삭제</button>
            </div>
          ) : null}

          <div className="card__bd">
            {loading ? <Loading /> : items.length === 0 ? (
              <Empty label="이 분류에 등록된 작업물이 없습니다. 위에 이미지를 끌어다 놓아 등록하세요." />
            ) : (
              <div className="tiles">
                {items.map((it) => (
                  <div
                    key={it.id}
                    className={`tile${sel.includes(it.id) ? " is-sel" : ""}${it.visible ? "" : " is-hidden"}${sortable.cls(it)}`}
                    {...(canWrite ? sortable.dragProps(it) : {})}
                    onDoubleClick={() => setEdit(it)}
                  >
                    <span className="tile__pick" onClick={(e) => { e.stopPropagation(); toggleSel(it.id, e); }}>
                      {sel.includes(it.id) ? "✓" : ""}
                    </span>
                    {it.featured ? <span className="tile__flag">대표</span> : null}
                    {!it.visible ? <span className="tile__flag" style={{ background: "rgba(180,40,40,.85)" }}>숨김</span> : null}
                    <span className="tile__img" style={{ backgroundImage: `url("${imgUrl(it.src)}")` }} />
                    <div className="tile__bar">
                      <span className="t" title={it.title || it.src}>{it.title || it.src.split("/").pop()}</span>
                      <button className="btn btn--sm btn--icon" onClick={(e) => { e.stopPropagation(); setEdit(it); }}>편집</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card__hd" style={{ borderTop: "1px solid var(--a-line-2)", borderBottom: 0 }}>
            <span className="small muted">
              타일을 끌어다 놓으면 순서가 바로 저장됩니다. 더블클릭하면 상세 편집이 열립니다.
            </span>
          </div>
        </div>
      </div>

      {edit ? (
        <ItemEditor
          item={edit}
          years={years.length ? years : ["2026", "2025", "2024", "2023", "2022", "2021"]}
          canWrite={canWrite}
          onClose={() => setEdit(null)}
          onSaved={(u) => setItems((list) => list.map((i) => (i.id === u.id ? u : i)))}
          onDeleted={(id) => setItems((list) => list.filter((i) => i.id !== id))}
        />
      ) : null}
    </div>
  );
}

window.Portfolio = Portfolio;
window.PF_CATEGORIES = CATEGORIES;
window.pfCatLabel = catLabel;
