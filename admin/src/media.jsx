/* global React, API, UI */
/* =====================================================================
   media.jsx — 미디어 라이브러리
   ===================================================================== */
const { useState, useEffect, useCallback } = React;
const { useConfirm, DropZone, Loading, Empty, toast, imgUrl, fmtBytes, fmtDate, Select } = UI;

const FOLDERS = [
  { value: "", label: "전체 폴더" },
  { value: "portfolio", label: "포트폴리오" },
  { value: "equipment", label: "장비" },
  { value: "clients", label: "고객사" },
  { value: "awards", label: "수상" },
  { value: "hero", label: "상단배경" },
  { value: "notice", label: "공지" },
  { value: "general", label: "일반" },
];

function Media({ canWrite }) {
  const [folder, setFolder] = useState("");
  const [q, setQ] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(0);
  const [confirm, confirmNode] = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    API.admin.media({ folder, q, limit: 200 })
      .then(setData).catch(toast.err).finally(() => setLoading(false));
  }, [folder, q]);
  useEffect(load, [load]);

  const upload = async (files) => {
    setBusy(1);
    try {
      const r = await API.upload(
        `/admin/media/upload?folder=${encodeURIComponent(folder || "general")}`,
        files, {}, setBusy
      );
      toast.ok(`${r.items.length}개 업로드했습니다.`);
      load();
    } catch (e) { toast.err(e); } finally { setBusy(0); }
  };

  const remove = async (m) => {
    if (!(await confirm(`"${m.original || m.filename}" 파일을 삭제할까요?\n되돌릴 수 없습니다.`, { danger: true, okLabel: "삭제" }))) return;
    try { await API.admin.mediaDelete(m.id); load(); toast.ok("삭제했습니다."); }
    catch (e) { toast.err(e); }
  };

  const copy = (url) => {
    navigator.clipboard?.writeText(location.origin + url)
      .then(() => toast.ok("주소를 복사했습니다."))
      .catch(() => toast.err("복사에 실패했습니다."));
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {confirmNode}
      {canWrite ? (
        <DropZone onFiles={upload} accept="image/*,application/pdf" disabled={busy > 0}>
          {busy > 0
            ? <div><b>업로드 중… {busy}%</b></div>
            : <div><b>파일을 끌어다 놓으면 «{FOLDERS.find((f) => f.value === (folder || "general"))?.label}» 폴더로 업로드됩니다</b>
                <div className="small" style={{ marginTop: 4 }}>이미지 · PDF 지원</div></div>}
        </DropZone>
      ) : null}

      <div className="card">
        <div className="card__hd">
          <h2>미디어</h2>
          <div style={{ width: 160 }}>
            <Select value={folder} onChange={setFolder} options={FOLDERS} />
          </div>
          <input type="search" placeholder="파일명 검색" style={{ width: 200 }}
            defaultValue={q}
            onKeyDown={(e) => { if (e.key === "Enter") setQ(e.target.value); }}
            onBlur={(e) => { if (e.target.value !== q) setQ(e.target.value); }} />
          <div style={{ flex: 1 }} />
          {data ? <span className="small muted">{data.total}개</span> : null}
        </div>
        <div className="card__bd">
          {loading ? <Loading /> : !data || data.items.length === 0 ? <Empty label="업로드된 파일이 없습니다." /> : (
            <div className="tiles">
              {data.items.map((m) => (
                <div className="tile" key={m.id} style={{ cursor: "default" }}>
                  {m.mime && m.mime.startsWith("image/")
                    ? <span className="tile__img" style={{ backgroundImage: `url("${imgUrl(m.url)}")`, aspectRatio: "4/3" }} />
                    : <span className="tile__img" style={{ aspectRatio: "4/3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📄</span>}
                  <div className="tile__bar" style={{ flexDirection: "column", alignItems: "stretch", gap: 3 }}>
                    <span className="t" title={m.original}>{m.original || m.filename}</span>
                    <span className="small muted">{fmtBytes(m.size)} · {fmtDate(m.created_at, false)}</span>
                    <div className="row" style={{ gap: 4 }}>
                      <button className="btn btn--sm" onClick={() => copy(m.url)}>주소복사</button>
                      {canWrite && m.source === "upload"
                        ? <button className="btn btn--sm btn--danger" onClick={() => remove(m)}>삭제</button> : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {data && data.folders ? (
          <div className="card__hd" style={{ borderTop: "1px solid var(--a-line-2)", borderBottom: 0, flexWrap: "wrap" }}>
            {data.folders.map((f) => (
              <span key={f.folder} className="badge badge--muted">
                {FOLDERS.find((x) => x.value === f.folder)?.label || f.folder} {f.n}개 · {fmtBytes(f.bytes)}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

window.Media = Media;
