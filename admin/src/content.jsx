/* global React, API, UI */
/* =====================================================================
   content.jsx — 콘텐츠 관리 공용 화면
   서비스 / 장비 / 연혁 / 고객사 / 수상 / 히어로슬라이드 / 공지·팝업
   모두 같은 화면 부품으로 처리한다. 목록은 드래그앤드롭으로 정렬.
   ===================================================================== */
const { useState, useEffect, useCallback } = React;
const {
  Modal, useConfirm, Field, Text, Area, Select, Check, DropZone,
  useSortable, Loading, Empty, toast, imgUrl,
} = UI;

/* ---- 이미지 한 장 선택/업로드 ---------------------------------------- */
function ImagePick({ value, onChange, folder = "general" }) {
  const [busy, setBusy] = useState(false);
  const up = async (files) => {
    setBusy(true);
    try {
      const r = await API.upload(`/admin/media/upload?folder=${encodeURIComponent(folder)}`, [files[0]]);
      onChange(r.items[0].url);
      toast.ok("업로드했습니다.");
    } catch (e) { toast.err(e); } finally { setBusy(false); }
  };
  return (
    <div>
      <div className="row" style={{ alignItems: "flex-start" }}>
        {value ? (
          <img src={imgUrl(value)} alt=""
            style={{ width: 90, height: 68, objectFit: "cover", borderRadius: 6, border: "1px solid var(--a-line)" }} />
        ) : (
          <div style={{ width: 90, height: 68, borderRadius: 6, background: "#f0f2f5",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--a-ink-3)", fontSize: 11 }}>
            없음
          </div>
        )}
        <div style={{ flex: 1, minWidth: 180 }}>
          <Text value={value} onChange={onChange} placeholder="resource/... 또는 /uploads/..." />
          <div className="row" style={{ marginTop: 6 }}>
            <DropZone onFiles={up} multiple={false} disabled={busy}>
              <span className="small">{busy ? "업로드 중…" : "이미지 끌어놓기 또는 클릭해 선택"}</span>
            </DropZone>
            {value ? <button className="btn btn--sm" onClick={() => onChange("")}>비우기</button> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- 필드 스키마 렌더러 --------------------------------------------- */
function SchemaForm({ schema, value, onChange }) {
  const set = (k) => (v) => onChange({ ...value, [k]: v });
  return (
    <>
      {schema.map((f) => {
        if (f.type === "check") {
          return <Check key={f.key} checked={!!value[f.key]} onChange={set(f.key)} label={f.label} />;
        }
        if (f.type === "image") {
          return (
            <Field key={f.key} label={f.label} hint={f.hint}>
              <ImagePick value={value[f.key] || ""} onChange={set(f.key)} folder={f.folder} />
            </Field>
          );
        }
        if (f.type === "area") {
          return <Field key={f.key} label={f.label} hint={f.hint}>
            <Area value={value[f.key] || ""} onChange={set(f.key)} rows={f.rows || 4} />
          </Field>;
        }
        if (f.type === "select") {
          return <Field key={f.key} label={f.label} hint={f.hint}>
            <Select value={value[f.key] || ""} onChange={set(f.key)} options={f.options} />
          </Field>;
        }
        if (f.type === "datetime") {
          return <Field key={f.key} label={f.label} hint={f.hint}>
            <input type="datetime-local"
              value={value[f.key] ? String(value[f.key]).slice(0, 16) : ""}
              onChange={(e) => set(f.key)(e.target.value || null)} />
          </Field>;
        }
        if (f.type === "list") {
          const arr = Array.isArray(value[f.key]) ? value[f.key]
            : (() => { try { return JSON.parse(value[f.key] || "[]"); } catch { return []; } })();
          return (
            <Field key={f.key} label={f.label} hint={f.hint || "줄바꿈으로 구분"}>
              <Area value={arr.join("\n")} onChange={(v) => set(f.key)(v.split("\n").map((s) => s.trim()).filter(Boolean))} />
            </Field>
          );
        }
        return <Field key={f.key} label={f.label} hint={f.hint}>
          <Text value={value[f.key] || ""} onChange={set(f.key)} placeholder={f.placeholder} />
        </Field>;
      })}
    </>
  );
}

/* ---- 공용 관리 화면 -------------------------------------------------- */
function ContentManager({ cfg, canWrite }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(null);   // {} = 새 항목
  const [sel, setSel] = useState([]);
  const [error, setError] = useState("");
  const [confirm, confirmNode] = useConfirm();
  const [pageFilter, setPageFilter] = useState(cfg.pages ? cfg.pages[0].value : null);

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    API.admin.list(cfg.resource, cfg.pages ? { page: pageFilter } : {})
      .then((d) => setItems(d.items))
      .catch((e) => { setItems([]); setError(e.message || "불러오지 못했습니다."); toast.err(e); })
      .finally(() => setLoading(false));
  }, [cfg.resource, cfg.pages, pageFilter]);

  useEffect(load, [load]);

  const sortable = useSortable(items, (next) => {
    setItems(next);
    API.admin.reorder(cfg.resource, next.map((i) => i.id))
      .then(() => toast.ok("순서를 저장했습니다."))
      .catch((e) => { toast.err(e); load(); });
  });

  const save = async (draft) => {
    const body = { ...draft };
    delete body.id; delete body.created_at; delete body.updated_at; delete body.sort_order;
    if (typeof body.visible === "boolean") body.visible = body.visible ? 1 : 0;
    try {
      if (draft.id) await API.admin.update(cfg.resource, draft.id, body);
      else await API.admin.create(cfg.resource, cfg.pages ? { ...body, page: pageFilter } : body);
      setEdit(null);
      load();
      toast.ok("저장했습니다.");
    } catch (e) { toast.err(e); }
  };

  const removeOne = async (it) => {
    if (!(await confirm(`"${cfg.title(it)}" 항목을 삭제할까요?`, { danger: true, okLabel: "삭제" }))) return;
    try { await API.admin.remove(cfg.resource, it.id); load(); toast.ok("삭제했습니다."); }
    catch (e) { toast.err(e); }
  };

  const bulk = async (kind) => {
    if (!sel.length) return;
    try {
      if (kind === "delete") {
        if (!(await confirm(`선택한 ${sel.length}건을 삭제할까요?`, { danger: true, okLabel: "삭제" }))) return;
        await API.admin.bulkDelete(cfg.resource, sel);
      } else {
        await API.admin.bulkVisible(cfg.resource, sel, kind === "show" ? 1 : 0);
      }
      setSel([]); load(); toast.ok("적용했습니다.");
    } catch (e) { toast.err(e); }
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {confirmNode}

      <div className="card">
        <div className="card__hd">
          <h2>{cfg.name}</h2>
          <span className="small muted">{items.length}건 · 끌어서 순서 변경</span>
          <div style={{ flex: 1 }} />
          {cfg.pages ? (
            <div style={{ width: 160 }}>
              <Select value={pageFilter} onChange={setPageFilter} options={cfg.pages} />
            </div>
          ) : null}
          {canWrite ? <button className="btn btn--pri" onClick={() => setEdit(cfg.blank ? { ...cfg.blank } : { visible: 1 })}>+ 새 항목</button> : null}
        </div>

        {sel.length > 0 && canWrite ? (
          <div className="card__hd" style={{ background: "#f7f9fc" }}>
            <b className="small">{sel.length}건 선택</b>
            <button className="btn btn--sm" onClick={() => bulk("show")}>노출</button>
            <button className="btn btn--sm" onClick={() => bulk("hide")}>숨김</button>
            <button className="btn btn--sm btn--danger" onClick={() => bulk("delete")}>삭제</button>
            <button className="btn btn--sm" onClick={() => setSel([])}>선택해제</button>
          </div>
        ) : null}

        <div className="card__bd">
          {loading ? <Loading /> : error ? (
            <div className="empty">
              <div style={{ color: "var(--a-danger)", marginBottom: 10 }}>{error}</div>
              <button className="btn" onClick={load}>다시 불러오기</button>
            </div>
          ) : items.length === 0 ? <Empty /> : (
            <ul className="sortable">
              {items.map((it) => (
                <li key={it.id}
                    className={sortable.cls(it).trim()}
                    {...(canWrite ? sortable.dragProps(it) : {})}>
                  <span className="handle">⠿</span>
                  <input type="checkbox" checked={sel.includes(it.id)}
                    onChange={() => setSel((s) => (s.includes(it.id) ? s.filter((x) => x !== it.id) : [...s, it.id]))} />
                  {cfg.thumb ? (
                    it[cfg.thumb]
                      ? <img src={imgUrl(it[cfg.thumb])} alt="" style={{ width: 52, height: 38, objectFit: "cover", borderRadius: 4, border: "1px solid var(--a-line)" }} />
                      : <span style={{ width: 52, height: 38, borderRadius: 4, background: "#f0f2f5" }} />
                  ) : null}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600 }}>{cfg.title(it)}</div>
                    <div className="small muted clip">{cfg.sub ? cfg.sub(it) : ""}</div>
                  </div>
                  {!it.visible ? <span className="badge badge--muted">숨김</span> : null}
                  {canWrite ? (
                    <>
                      <button className="btn btn--sm" onClick={() => setEdit(it)}>편집</button>
                      <button className="btn btn--sm btn--danger" onClick={() => removeOne(it)}>삭제</button>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {edit ? (
        <ContentEditor cfg={cfg} item={edit} onClose={() => setEdit(null)} onSave={save} />
      ) : null}
    </div>
  );
}

function ContentEditor({ cfg, item, onClose, onSave }) {
  const [draft, setDraft] = useState(() => {
    const d = { ...item };
    /* deliverables 처럼 JSON 문자열로 저장된 값은 배열로 풀어 편집 */
    cfg.schema.forEach((f) => {
      if (f.type === "list" && typeof d[f.key] === "string") {
        try { d[f.key] = JSON.parse(d[f.key]); } catch { d[f.key] = []; }
      }
    });
    if (d.visible === undefined) d.visible = 1;
    return d;
  });

  return (
    <Modal
      title={item.id ? `${cfg.name} 편집` : `${cfg.name} 추가`}
      onClose={onClose}
      footer={
        <>
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn--pri" onClick={() => onSave(draft)}>저장</button>
        </>
      }
    >
      <SchemaForm schema={cfg.schema} value={draft} onChange={setDraft} />
      <Check checked={!!draft.visible} onChange={(v) => setDraft({ ...draft, visible: v ? 1 : 0 })} label="홈페이지에 노출" />
    </Modal>
  );
}

/* ---- 리소스별 설정 --------------------------------------------------- */
const CONTENT_CFG = {
  services: {
    name: "사업영역 (서비스)",
    resource: "services",
    thumb: "hero_src",
    title: (it) => it.kr || it.key,
    sub: (it) => it.short || it.d,
    blank: { visible: 1, deliverables: [] },
    schema: [
      { key: "key", label: "코드 (변경 주의)", hint: "포트폴리오 카테고리와 연결되는 키. 예: 표지디자인" },
      { key: "kr", label: "이름 (한글)" },
      { key: "en", label: "이름 (영문)" },
      { key: "cat", label: "분류 태그", placeholder: "EDITORIAL / CORPORATE / CAMPAIGN …" },
      { key: "short", label: "한 줄 소개" },
      { key: "d", label: "설명", type: "area" },
      { key: "d2", label: "상세 설명", type: "area", rows: 5 },
      { key: "deliverables", label: "제공 항목", type: "list" },
      { key: "hero_src", label: "대표 이미지", type: "image", folder: "general" },
    ],
  },
  equipment: {
    name: "보유 장비",
    resource: "equipment",
    thumb: "src",
    title: (it) => it.name,
    sub: (it) => [it.maker, it.spec].filter(Boolean).join(" · "),
    schema: [
      { key: "name", label: "장비명" },
      { key: "maker", label: "제조사" },
      { key: "model", label: "모델" },
      { key: "spec", label: "사양" },
      { key: "description", label: "분류 / 설명", placeholder: "OFFSET PRESS / DIGITAL PRESS / FINISHING …" },
      { key: "src", label: "사진", type: "image", folder: "equipment" },
    ],
  },
  history: {
    name: "연혁",
    resource: "history",
    title: (it) => `${it.year}${it.month ? `.${it.month}` : ""} — ${it.title}`,
    sub: (it) => it.body,
    schema: [
      { key: "year", label: "연도", placeholder: "2026" },
      { key: "month", label: "월 (선택)", placeholder: "07" },
      { key: "title", label: "내용" },
      { key: "body", label: "상세 (선택)", type: "area" },
    ],
  },
  clients: {
    name: "고객사",
    resource: "clients",
    thumb: "logo_src",
    title: (it) => it.name,
    sub: (it) => it.group_name,
    schema: [
      { key: "name", label: "고객사명" },
      { key: "group_name", label: "그룹", placeholder: "정부 · 공공기관 / 대기업 · 금융 / 출판 · 미디어 / 교육 · 연구" },
      { key: "logo_src", label: "로고", type: "image", folder: "clients" },
      { key: "url", label: "홈페이지 (선택)" },
    ],
  },
  awards: {
    name: "수상 · 인증",
    resource: "awards",
    thumb: "src",
    title: (it) => `${it.year || ""} ${it.title}`.trim(),
    sub: (it) => it.org,
    schema: [
      { key: "year", label: "연도" },
      { key: "title", label: "수상 / 인증명" },
      { key: "org", label: "주관 기관" },
      { key: "description", label: "설명 (선택)", type: "area" },
      { key: "src", label: "증빙 이미지 (선택)", type: "image", folder: "awards" },
    ],
  },
  "hero-slides": {
    name: "상단 배경 이미지",
    resource: "hero-slides",
    thumb: "src",
    title: (it) => it.caption || it.src,
    sub: (it) => `${it.page} 페이지`,
    pages: [
      { value: "home", label: "메인" }, { value: "about", label: "회사소개" },
      { value: "services", label: "사업영역" }, { value: "facility", label: "시설·장비" },
      { value: "portfolio", label: "포트폴리오" }, { value: "contact", label: "견적문의" },
    ],
    schema: [
      { key: "src", label: "이미지", type: "image", folder: "hero" },
      { key: "caption", label: "설명 (내부용)" },
    ],
  },
  notices: {
    name: "공지 · 팝업",
    resource: "notices",
    thumb: "src",
    title: (it) => it.title,
    sub: (it) => `${it.type} · ${it.start_at ? String(it.start_at).slice(0, 10) : "상시"} ~ ${it.end_at ? String(it.end_at).slice(0, 10) : ""}`,
    schema: [
      { key: "type", label: "형태", type: "select",
        options: [{ value: "notice", label: "공지" }, { value: "popup", label: "팝업" }, { value: "banner", label: "상단 배너" }] },
      { key: "title", label: "제목" },
      { key: "body", label: "내용", type: "area", rows: 5 },
      { key: "link", label: "링크 (선택)" },
      { key: "src", label: "이미지 (선택)", type: "image", folder: "notice" },
      { key: "start_at", label: "노출 시작", type: "datetime" },
      { key: "end_at", label: "노출 종료", type: "datetime" },
    ],
  },
};

window.ContentManager = ContentManager;
window.CONTENT_CFG = CONTENT_CFG;
window.ImagePick = ImagePick;
