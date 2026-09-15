/* global React */
/* =====================================================================
   ui.jsx — 관리자 공통 UI (전역 노출)
   토스트 · 모달 · 확인창 · 폼 필드 · 드래그앤드롭 훅 · 업로드 드롭존 · 페이저
   ===================================================================== */
const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ---- 토스트 ------------------------------------------------------ */
let toastSeq = 0;
const toastSubs = new Set();
const toastState = { items: [] };

function pushToast(message, kind = "info", ms = 3200) {
  const id = ++toastSeq;
  toastState.items = [...toastState.items, { id, message, kind }];
  toastSubs.forEach((f) => f());
  setTimeout(() => {
    toastState.items = toastState.items.filter((t) => t.id !== id);
    toastSubs.forEach((f) => f());
  }, ms);
}
const toast = {
  info: (m) => pushToast(m, "info"),
  ok: (m) => pushToast(m, "ok"),
  err: (m) => pushToast(typeof m === "string" ? m : (m && m.message) || "오류가 발생했습니다.", "err", 5000),
};

function Toasts() {
  const [, force] = useState(0);
  useEffect(() => {
    const f = () => force((n) => n + 1);
    toastSubs.add(f);
    return () => toastSubs.delete(f);
  }, []);
  return (
    <div className="toasts">
      {toastState.items.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind}`}>{t.message}</div>
      ))}
    </div>
  );
}

/* ---- 모달 -------------------------------------------------------- */
function Modal({ title, children, onClose, footer, wide }) {
  useEffect(() => {
    const esc = (e) => { if (e.key === "Escape") onClose && onClose(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="modal-bg" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose && onClose(); }}>
      <div className={`modal${wide ? " modal--wide" : ""}`}>
        <div className="modal__hd">
          <h2>{title}</h2>
          <div style={{ flex: 1 }} />
          <button className="btn btn--sm" onClick={onClose}>닫기</button>
        </div>
        <div className="modal__bd">{children}</div>
        {footer ? <div className="modal__ft">{footer}</div> : null}
      </div>
    </div>
  );
}

/* 간단 확인 — window.confirm 대체 (브라우저 모달 회피) */
function useConfirm() {
  const [ask, setAsk] = useState(null);
  const confirm = useCallback(
    (message, { danger = false, okLabel = "확인" } = {}) =>
      new Promise((resolve) => setAsk({ message, danger, okLabel, resolve })),
    []
  );
  const node = ask ? (
    <Modal
      title="확인"
      onClose={() => { ask.resolve(false); setAsk(null); }}
      footer={
        <>
          <button className="btn" onClick={() => { ask.resolve(false); setAsk(null); }}>취소</button>
          <button
            className={`btn ${ask.danger ? "btn--danger" : "btn--pri"}`}
            onClick={() => { ask.resolve(true); setAsk(null); }}
          >{ask.okLabel}</button>
        </>
      }
    >
      <div style={{ whiteSpace: "pre-wrap" }}>{ask.message}</div>
    </Modal>
  ) : null;
  return [confirm, node];
}

/* ---- 폼 필드 ----------------------------------------------------- */
function Field({ label, children, hint }) {
  return (
    <label className="f">
      <span>{label}</span>
      {children}
      {hint ? <div className="small muted" style={{ marginTop: 4 }}>{hint}</div> : null}
    </label>
  );
}

function Text({ value, onChange, ...rest }) {
  return <input type="text" value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />;
}
function Area({ value, onChange, ...rest }) {
  return <textarea value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest} />;
}
function Select({ value, onChange, options, ...rest }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} {...rest}>
      {options.map((o) =>
        typeof o === "string"
          ? <option key={o} value={o}>{o}</option>
          : <option key={o.value} value={o.value}>{o.label}</option>
      )}
    </select>
  );
}
function Check({ checked, onChange, label }) {
  return (
    <label className="row" style={{ gap: 7, cursor: "pointer", marginBottom: 10 }}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} />
      <span style={{ fontSize: 13 }}>{label}</span>
    </label>
  );
}

/* ---- 드래그앤드롭 정렬 훅 ------------------------------------------
   items 배열과 "새 순서 배열"을 받는 콜백을 주면
   각 항목에 뿌릴 props(dragProps)와 상태 클래스를 돌려준다.
   HTML5 DnD 기반이라 외부 라이브러리가 필요 없다.
------------------------------------------------------------------- */
function useSortable(items, onReorder, { keyOf = (it) => it.id } = {}) {
  const [dragKey, setDragKey] = useState(null);
  const [overKey, setOverKey] = useState(null);
  const dragKeyRef = useRef(null);

  const move = (from, to) => {
    if (from === to || from < 0 || to < 0) return;
    const next = items.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorder(next);
  };

  const dragProps = (item) => {
    const key = keyOf(item);
    return {
      draggable: true,
      onDragStart: (e) => {
        dragKeyRef.current = key;
        setDragKey(key);
        e.dataTransfer.effectAllowed = "move";
        /* Firefox 는 데이터가 없으면 드래그를 시작하지 않는다 */
        try { e.dataTransfer.setData("text/plain", String(key)); } catch { /* noop */ }
      },
      onDragEnd: () => { dragKeyRef.current = null; setDragKey(null); setOverKey(null); },
      onDragOver: (e) => {
        if (dragKeyRef.current == null) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (overKey !== key) setOverKey(key);
      },
      onDragLeave: () => { if (overKey === key) setOverKey(null); },
      onDrop: (e) => {
        e.preventDefault();
        e.stopPropagation();
        const from = items.findIndex((it) => keyOf(it) === dragKeyRef.current);
        const to = items.findIndex((it) => keyOf(it) === key);
        move(from, to);
        dragKeyRef.current = null;
        setDragKey(null);
        setOverKey(null);
      },
    };
  };

  const cls = (item) => {
    const key = keyOf(item);
    return `${dragKey === key ? " is-drag" : ""}${overKey === key && dragKey !== key ? " is-over" : ""}`;
  };

  return { dragProps, cls, dragging: dragKey != null };
}

/* ---- 파일 드롭존 -------------------------------------------------- */
function DropZone({ onFiles, accept = "image/*", multiple = true, children, disabled }) {
  const [over, setOver] = useState(false);
  const inputRef = useRef(null);

  const handle = (files) => {
    const list = Array.from(files || []).filter((f) => f.size > 0);
    if (list.length) onFiles(list);
  };

  return (
    <div
      className={`dz${over ? " is-over" : ""}`}
      onDragOver={(e) => { if (disabled) return; e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        setOver(false);
        handle(e.dataTransfer.files);
      }}
      onClick={() => !disabled && inputRef.current && inputRef.current.click()}
      style={{ cursor: disabled ? "not-allowed" : "pointer" }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => { handle(e.target.files); e.target.value = ""; }}
      />
      {children || (
        <>
          <div style={{ fontSize: 22, marginBottom: 6 }}>⬆</div>
          <div><b>이미지를 여기에 끌어다 놓으세요</b></div>
          <div className="small" style={{ marginTop: 4 }}>클릭해서 파일 선택도 가능 · 여러 장 동시 업로드</div>
        </>
      )}
    </div>
  );
}

/* ---- 페이저 ------------------------------------------------------ */
function Pager({ page, pages, total, onPage }) {
  if (pages <= 1) return <div className="small muted">{total}건</div>;
  const nums = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pages, from + 4);
  for (let i = from; i <= to; i++) nums.push(i);
  return (
    <div className="row" style={{ gap: 4 }}>
      <span className="small muted" style={{ marginRight: 8 }}>{total}건</span>
      <button className="btn btn--sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>이전</button>
      {from > 1 ? <button className="btn btn--sm" onClick={() => onPage(1)}>1</button> : null}
      {from > 2 ? <span className="muted small">…</span> : null}
      {nums.map((n) => (
        <button key={n} className={`btn btn--sm${n === page ? " btn--pri" : ""}`} onClick={() => onPage(n)}>{n}</button>
      ))}
      {to < pages - 1 ? <span className="muted small">…</span> : null}
      {to < pages ? <button className="btn btn--sm" onClick={() => onPage(pages)}>{pages}</button> : null}
      <button className="btn btn--sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>다음</button>
    </div>
  );
}

/* ---- 표시 헬퍼 ---------------------------------------------------- */
const fmtDate = (v, withTime = true) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  const opt = withTime
    ? { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }
    : { year: "numeric", month: "2-digit", day: "2-digit" };
  return d.toLocaleString("ko-KR", { ...opt, timeZone: "Asia/Seoul" });
};

const fmtAgo = (v) => {
  if (!v) return "";
  const diff = Date.now() - new Date(v).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return fmtDate(v, false);
};

const fmtNum = (n) => (n == null ? "" : Number(n).toLocaleString("ko-KR"));
const fmtBytes = (b) => {
  if (!b) return "0 B";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let v = Number(b);
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i ? 1 : 0)} ${u[i]}`;
};

/* 이미지 URL — 레포 자산은 상대경로(resource/...), 업로드는 /uploads/... */
const imgUrl = (src) => {
  if (!src) return "";
  if (/^(https?:)?\/\//.test(src) || src.startsWith("/")) return src;
  return `/${src}`;
};

/* ---- 로딩 / 빈 상태 ----------------------------------------------- */
const Loading = ({ label = "불러오는 중…" }) => (
  <div className="empty"><span className="spin" /> <span style={{ marginLeft: 8 }}>{label}</span></div>
);
const Empty = ({ label = "표시할 항목이 없습니다." }) => <div className="empty">{label}</div>;

/* 비동기 로더 훅 */
function useLoad(fn, deps = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [nonce, setNonce] = useState(0);
  const reload = useCallback(() => setNonce((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true }));
    Promise.resolve(fn())
      .then((data) => alive && setState({ loading: false, data, error: null }))
      .catch((error) => {
        if (!alive) return;
        setState({ loading: false, data: null, error });
        if (error.status !== 401) toast.err(error);
      });
    return () => { alive = false; };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [...deps, nonce]);
  return { ...state, reload, setData: (d) => setState((s) => ({ ...s, data: d })) };
}

window.UI = {
  Toasts, toast, Modal, useConfirm, Field, Text, Area, Select, Check,
  useSortable, DropZone, Pager, Loading, Empty, useLoad,
  fmtDate, fmtAgo, fmtNum, fmtBytes, imgUrl,
  React: { useState, useEffect, useRef, useCallback, useMemo },
};
