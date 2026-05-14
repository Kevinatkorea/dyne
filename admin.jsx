/* global React, ReactDOM */
/* =====================================================================
   admin.jsx — 다인스케치 관리자 모드
   --------------------------------------------------------------------
   접근:  URL 끝에 #admin 을 붙여 새로고침 (예: /#admin)
   인증:  비밀번호 1개. 기본값 'admin1234' (설정 패널에서 변경 가능).
   저장:  localStorage 단일 키 (DYNE_ADMIN_KEY). 내보내기/가져오기 지원.

   6개 패널:
     1) 견적요청      — Contact 폼 제출 내역, 처리 상태 토글
     2) 연혁          — About 페이지 타임라인 항목 CRUD
     3) 포트폴리오    — 이미지 노출/비노출 토글
     4) 장비          — Facility 장비 목록 CRUD
     5) 방문통계      — 페이지별·일별 PV/UV 그래프
     6) 사이트설정    — 푸터·연락처·저작권 등 회사 정보 편집

   공개 사이트와의 연결:
     window.ADMIN_DATA — 현재 admin 데이터 (다른 jsx에서 참조)
     window.adminSettings(key) — 설정 값 조회 헬퍼 (기본값 fallback)
     window.adminPush(section, payload) — 데이터 추가 (Contact 폼 → quotes)
     window.adminTrackVisit(page) — 방문 기록
   ===================================================================== */

const { useState: useSA, useEffect: useEA, useMemo: useMA, useRef: useRA } = React;

const DYNE_ADMIN_KEY = "dyne_admin_v1";
const DEFAULT_PASSWORD = "admin1234";

/* 관리자 화면 반응형 CSS 1회 주입 */
if (typeof document !== "undefined" && !document.getElementById("admin-responsive")) {
  const s = document.createElement("style");
  s.id = "admin-responsive";
  s.textContent = `
    /* 태블릿 (≤1024px) */
    @media (max-width: 1024px) {
      #admin-root [style*="padding: 28px"] { padding: 20px !important; }
      #admin-root [style*="padding: 40px"] { padding: 24px !important; }
      #admin-root [style*="max-width: 1400"] { max-width: 100% !important; }

      /* 모든 다중 칼럼 → 2칸 또는 1칸 */
      #admin-root [style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }

      /* 큰 폼 그리드 → 1칸 */
      #admin-root [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; gap: 12px !important; }

      /* 견적 카드 KV 4칸 → 2칸 */
      #admin-root [style*="grid-template-columns: repeat(4, 1fr)"] { grid-template-columns: repeat(2, 1fr) !important; }

      /* 통계 2칸 → 1칸 */
      #admin-root [style*="grid-template-columns: 2fr 1fr"] { grid-template-columns: 1fr !important; }
    }

    /* 모바일 (≤768px) */
    @media (max-width: 768px) {
      #admin-root [style*="padding: 16px 28px"],
      #admin-root [style*="padding: 20px"],
      #admin-root [style*="padding: 24px"] { padding: 14px 16px !important; }
      #admin-root [style*="padding: 16px 20px"] { padding: 14px !important; }
      #admin-root [style*="padding: 20px 28px"] { padding: 14px 16px !important; }

      #admin-root h1 { font-size: 22px !important; }
      #admin-root h2 { font-size: 18px !important; }

      /* 헤더 버튼 라벨 줄여서 한 줄 유지 */
      #admin-root header strong,
      #admin-root [style*="font-size: 18px"] { font-size: 14px !important; }

      /* 헤더 버튼 압축 */
      #admin-root header button { font-size: 11px !important; padding: 0 10px !important; height: 32px !important; }

      /* 탭 — 가로 스크롤로 변경 */
      #admin-root nav, #admin-root [style*="border-bottom: 1px solid #2a2a2a"] {
        overflow-x: auto; white-space: nowrap;
      }
      #admin-root [role="tab"], #admin-root button[style*="padding: 16px 24px"] {
        padding: 12px 14px !important; min-width: max-content;
      }

      /* 그리드 → 모두 1칸 */
      #admin-root [style*="grid-template-columns: repeat(2"],
      #admin-root [style*="grid-template-columns: repeat(3"],
      #admin-root [style*="grid-template-columns: repeat(4"],
      #admin-root [style*="grid-template-columns: 1fr 1fr"],
      #admin-root [style*="grid-template-columns: 2fr 1fr"] { grid-template-columns: 1fr !important; gap: 10px !important; }

      /* 견적·연혁·장비 카드 그리드(180/80/1fr 등 비정형) → 세로 스택 */
      #admin-root [style*="grid-template-columns: 100px 1fr auto"],
      #admin-root [style*="grid-template-columns: 80px 1fr 1fr"],
      #admin-root [style*="grid-template-columns: 180px 1fr 1.5fr"],
      #admin-root [style*="grid-template-columns: 1fr 1fr auto"],
      #admin-root [style*="grid-template-columns: 80px 200px 1fr 1fr auto"] {
        grid-template-columns: 1fr !important; gap: 10px !important;
      }

      /* 인풋 폭 100% 보장 */
      #admin-root input, #admin-root textarea, #admin-root button { font-size: 14px !important; }

      /* 포트폴리오 썸네일 그리드 — 모바일에서 3칸 */
      #admin-root [style*="repeat(auto-fill, minmax(140px"] { grid-template-columns: repeat(3, 1fr) !important; }

      /* 통계 차트 영역 — 적절히 축소 */
      #admin-root [style*="height: 220"] { height: 160px !important; }
    }

    /* 소형 모바일 (≤480px) */
    @media (max-width: 480px) {
      #admin-root [style*="repeat(auto-fill, minmax(140px"] { grid-template-columns: repeat(2, 1fr) !important; }
      #admin-root header strong { font-size: 13px !important; }
      #admin-root [style*="width: 360px"] { width: calc(100% - 32px) !important; }
    }
  `;
  document.head.appendChild(s);
}

const DEFAULT_ADMIN_DATA = {
  version: 1,
  password: DEFAULT_PASSWORD,
  settings: {
    company:       "주식회사 다인스케치",
    ceo:           "전명호",
    businessNo:    "220-87-73258",
    mailOrderNo:   "서울성동-20804",
    tel:           "02-514-2450",
    fax:           "02-465-2450",
    email:         "design2@dynes.co.kr",
    address:       "서울 성동구 성수이로18길 31",
    addressDetail: "풍림테크원 401, 407호",
    hours:         "평일 09:30 – 18:30",
    copyright:     "© 2026 DYNESKETCH Co., Ltd. All rights reserved.",
    footerTagline: "다인스케치는 2008년 설립된 14년+ 편집디자인·인쇄 전문기업.\n컨설팅 · 기획 · 디자인 · 인쇄 · 납품을 하나의 팀이 책임집니다.",
  },
  quotes: [],            // 견적 요청 (Contact 폼 제출 내역)
  timeline: [],          // [{ id, year, title }] — 비어있으면 기본값 사용
  portfolioHidden: [],   // 숨김 처리할 이미지 src 배열
  equipment: [],         // [{ id, tag, name, spec, photo, label }] — 비어있으면 기본값
  stats: { visits: [] }, // [{ page, ts, sid, ref, ua }]
};

/* ─── 로컬 저장 레이어 ─── */
function loadAdminData() {
  try {
    const raw = localStorage.getItem(DYNE_ADMIN_KEY);
    if (!raw) return { ...DEFAULT_ADMIN_DATA };
    const parsed = JSON.parse(raw);
    // shallow-merge against defaults so new fields land in old data
    return {
      ...DEFAULT_ADMIN_DATA,
      ...parsed,
      settings: { ...DEFAULT_ADMIN_DATA.settings, ...(parsed.settings || {}) },
      stats:    { ...DEFAULT_ADMIN_DATA.stats,    ...(parsed.stats || {}) },
    };
  } catch (e) {
    console.error("[admin] failed to load:", e);
    return { ...DEFAULT_ADMIN_DATA };
  }
}
function saveAdminData(d) {
  try { localStorage.setItem(DYNE_ADMIN_KEY, JSON.stringify(d)); }
  catch (e) { console.error("[admin] failed to save:", e); }
}

/* ─── 전역 헬퍼 (다른 jsx에서 호출) ─── */
window.ADMIN_DATA = loadAdminData();

window.adminSettings = (key, fallback) => {
  const v = window.ADMIN_DATA?.settings?.[key];
  return v != null && v !== "" ? v : fallback;
};

window.adminPush = (section, payload) => {
  const d = loadAdminData();
  if (!d[section]) d[section] = [];
  d[section].unshift({ id: Date.now() + Math.random().toString(36).slice(2, 7),
                       ts: new Date().toISOString(), ...payload });
  saveAdminData(d);
  window.ADMIN_DATA = d;
};

window.adminTrackVisit = (page) => {
  const d = loadAdminData();
  let sid = sessionStorage.getItem("dyne_sid");
  if (!sid) { sid = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("dyne_sid", sid); }
  d.stats.visits.push({
    page, ts: new Date().toISOString(), sid,
    ref: document.referrer || "",
    ua: navigator.userAgent.slice(0, 200),
  });
  // 6개월 초과 데이터 트림 (브라우저 용량 보호)
  const cutoff = Date.now() - 180 * 86400 * 1000;
  d.stats.visits = d.stats.visits.filter((v) => new Date(v.ts).getTime() > cutoff);
  saveAdminData(d);
  window.ADMIN_DATA = d;
};

/* ─────────────────────────────────────────────────────────
   AdminApp — 메인 컴포넌트
   ───────────────────────────────────────────────────────── */
function AdminApp() {
  const [data, setData] = useSA(loadAdminData);
  const [authed, setAuthed] = useSA(false);
  const [pw, setPw] = useSA("");
  const [tab, setTab] = useSA("quotes");
  const [toast, setToast] = useSA("");

  // 데이터 변경 시 즉시 저장 + window 동기화
  useEA(() => { saveAdminData(data); window.ADMIN_DATA = data; }, [data]);

  const show = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2200); };
  const patch = (sec, val) => setData((d) => ({
    ...d,
    [sec]: typeof val === "function" ? val(d[sec]) : val,
  }));

  if (!authed) {
    return (
      <AdminGate
        onSubmit={() => {
          if (pw === (data.password || DEFAULT_PASSWORD)) { setAuthed(true); show("로그인 성공"); }
          else show("비밀번호가 일치하지 않습니다");
        }}
        pw={pw} setPw={setPw} toast={toast}
      />
    );
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "#1a1a1a", color: "#f3f1e8",
      fontFamily: "Pretendard, sans-serif", overflow: "auto",
      display: "flex", flexDirection: "column",
    }}>
      <AdminHeader onClose={() => { history.replaceState(null, "", " "); location.reload(); }}
        onExport={() => exportJson(data, show)}
        onImport={(d) => { setData(d); show("가져오기 완료"); }}
      />
      <AdminTabs tab={tab} setTab={setTab} />
      <div style={{ flex: 1, padding: 28, overflow: "auto", maxWidth: 1400, margin: "0 auto", width: "100%" }}>
        {tab === "quotes"    && <QuotesPanel data={data.quotes} patch={(v) => patch("quotes", v)} show={show} />}
        {tab === "timeline"  && <TimelinePanel data={data.timeline} patch={(v) => patch("timeline", v)} show={show} />}
        {tab === "portfolio" && <PortfolioPanel hidden={data.portfolioHidden} patch={(v) => patch("portfolioHidden", v)} show={show} />}
        {tab === "equipment" && <EquipmentPanel data={data.equipment} patch={(v) => patch("equipment", v)} show={show} />}
        {tab === "stats"     && <StatsPanel visits={data.stats.visits} />}
        {tab === "settings"  && <SettingsPanel settings={data.settings} password={data.password}
                                  patch={(v) => patch("settings", v)} patchPw={(v) => patch("password", v)} show={show} />}
      </div>
      {toast && <Toast text={toast} />}
    </div>
  );
}

/* ─── 인증 화면 ─── */
function AdminGate({ pw, setPw, onSubmit, toast }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000, background: "#0c0c0c", color: "#f3f1e8",
      display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Pretendard, sans-serif",
    }}>
      <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}
        style={{ width: 360, padding: 40, background: "#161616",
                 border: "1px solid #2a2a2a", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: "#888" }}>ADMIN MODE</div>
          <h1 style={{ margin: "8px 0 0", fontSize: 28, fontWeight: 800 }}>관리자 로그인</h1>
        </div>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)}
          autoFocus placeholder="비밀번호"
          style={{ height: 48, padding: "0 16px", background: "#0c0c0c", color: "#fff",
                   border: "1px solid #2a2a2a", borderRadius: 0, fontSize: 16, outline: "none" }} />
        <button type="submit" style={{
          height: 48, border: 0, background: "#1c69d4", color: "#fff",
          fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: "0.02em",
        }}>로그인 →</button>
        <a href="#" onClick={(e) => { e.preventDefault(); history.replaceState(null, "", " "); location.reload(); }}
          style={{ fontSize: 12, color: "#888", textAlign: "center", textDecoration: "underline" }}>
          ← 사이트로 돌아가기
        </a>
        <div style={{ fontSize: 11, color: "#666", lineHeight: 1.6, marginTop: 8 }}>
          기본 비밀번호: <code style={{ color: "#1c69d4" }}>admin1234</code><br />
          로그인 후 [사이트설정] 패널에서 변경하세요.
        </div>
      </form>
      {toast && <Toast text={toast} />}
    </div>
  );
}

/* ─── 헤더 + 탭 ─── */
function AdminHeader({ onClose, onExport, onImport }) {
  const fileRef = useRA(null);
  return (
    <div style={{
      display: "flex", alignItems: "center", padding: "16px 28px",
      borderBottom: "1px solid #2a2a2a", background: "#0c0c0c", gap: 16,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.22em", color: "#888" }}>ADMIN</div>
      <strong style={{ fontSize: 18, color: "#fff" }}>다인스케치 관리자 모드</strong>
      <div style={{ flex: 1 }} />
      <input ref={fileRef} type="file" accept="application/json" style={{ display: "none" }}
        onChange={(e) => importJson(e.target.files?.[0], onImport)} />
      <button onClick={() => fileRef.current?.click()} style={adminBtnGhost}>JSON 가져오기</button>
      <button onClick={onExport} style={adminBtnGhost}>JSON 내보내기</button>
      <button onClick={onClose} style={{ ...adminBtnGhost, color: "#ff6b6b", borderColor: "#552222" }}>✕ 닫기</button>
    </div>
  );
}

function AdminTabs({ tab, setTab }) {
  const tabs = [
    { k: "quotes",    label: "견적요청", en: "QUOTES" },
    { k: "timeline",  label: "연혁",     en: "TIMELINE" },
    { k: "portfolio", label: "포트폴리오", en: "PORTFOLIO" },
    { k: "equipment", label: "장비",     en: "EQUIPMENT" },
    { k: "stats",     label: "방문통계", en: "STATS" },
    { k: "settings",  label: "사이트설정", en: "SETTINGS" },
  ];
  return (
    <div style={{ display: "flex", borderBottom: "1px solid #2a2a2a", background: "#0c0c0c" }}>
      {tabs.map((t) => (
        <button key={t.k} onClick={() => setTab(t.k)} style={{
          padding: "16px 24px", border: 0, background: "transparent", cursor: "pointer",
          color: tab === t.k ? "#fff" : "#888",
          borderBottom: tab === t.k ? "2px solid #1c69d4" : "2px solid transparent",
          marginBottom: -1, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
        }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.22em" }}>{t.en}</span>
          <span style={{ fontSize: 14, fontWeight: 700 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── 패널 1: 견적요청 ─── */
function QuotesPanel({ data, patch, show }) {
  const [filter, setFilter] = useSA("all"); // all|new|done
  const filtered = data.filter((q) =>
    filter === "all" ? true : filter === "new" ? !q.done : q.done
  );
  const toggleDone = (id) => patch((arr) => arr.map((q) => q.id === id ? { ...q, done: !q.done } : q));
  const remove = (id) => { if (confirm("삭제할까요?")) patch((arr) => arr.filter((q) => q.id !== id)); };

  return (
    <div>
      <PanelHead title="견적요청" sub={`총 ${data.length}건 / 미처리 ${data.filter((q) => !q.done).length}건`} />
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["all", "전체"], ["new", "미처리"], ["done", "처리완료"]].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)}
            style={filter === k ? adminPill : adminPillOff}>{l}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <Empty text="견적 요청이 없습니다. Contact 페이지에서 제출된 요청이 여기 표시됩니다." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((q) => (
            <div key={q.id} style={panelCard}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 16, color: "#fff" }}>{q.company || "(회사명 미입력)"} · {q.name}</strong>
                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                    {new Date(q.ts).toLocaleString("ko-KR")} · {q.service || "서비스 미지정"}
                  </div>
                </div>
                <button onClick={() => toggleDone(q.id)} style={q.done ? adminPill : adminPillOff}>
                  {q.done ? "✓ 처리완료" : "미처리"}
                </button>
                <button onClick={() => remove(q.id)} style={adminBtnDanger}>삭제</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, fontSize: 13,
                            paddingTop: 12, borderTop: "1px solid #2a2a2a" }}>
                <KV k="전화" v={q.phone} />
                <KV k="이메일" v={q.email} />
                <KV k="수량" v={q.quantity} />
                <KV k="납기" v={q.deadline} />
                <KV k="예산" v={q.budget} />
              </div>
              {q.message && (
                <div style={{ marginTop: 12, padding: 14, background: "#0c0c0c",
                              fontSize: 14, color: "#ddd", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {q.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
const KV = ({ k, v }) => (
  <div><div style={{ fontSize: 10, color: "#888", letterSpacing: "0.1em", textTransform: "uppercase" }}>{k}</div>
    <div style={{ color: "#fff", marginTop: 2 }}>{v || "-"}</div></div>
);

/* ─── 패널 2: 연혁 ─── */
function TimelinePanel({ data, patch, show }) {
  const [year, setYear] = useSA("");
  const [title, setTitle] = useSA("");
  const add = () => {
    if (!year || !title) return show("연도와 내용을 입력하세요");
    patch((arr) => [{ id: Date.now() + "", year, title }, ...arr]);
    setYear(""); setTitle("");
  };
  const remove = (id) => patch((arr) => arr.filter((t) => t.id !== id));
  const sorted = [...data].sort((a, b) => (b.year || "").localeCompare(a.year || ""));

  return (
    <div>
      <PanelHead title="연혁 (About 페이지 타임라인)"
        sub={data.length === 0
          ? "현재 기본 연혁이 표시됩니다. 여기서 항목을 추가하면 기본값을 덮어씁니다."
          : `${data.length}개 항목 — 기본값을 덮어쓰는 중`} />
      <div style={{ display: "grid", gridTemplateColumns: "100px 1fr auto", gap: 12, marginBottom: 20 }}>
        <input value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026"
          style={adminInput} />
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="연혁 내용"
          style={adminInput} />
        <button onClick={add} style={adminBtn}>추가 →</button>
      </div>
      {data.length > 0 && (
        <button onClick={() => { if (confirm("모든 연혁을 비우고 기본값으로 되돌릴까요?")) patch([]); }}
          style={{ ...adminBtnGhost, marginBottom: 20 }}>↺ 기본값으로 복원</button>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {sorted.map((t) => (
          <div key={t.id} style={{ ...panelCard, display: "grid",
            gridTemplateColumns: "80px 1fr auto", gap: 16, alignItems: "center", padding: "16px 20px" }}>
            <strong style={{ fontSize: 18, color: "#1c69d4" }}>{t.year}</strong>
            <span style={{ color: "#fff" }}>{t.title}</span>
            <button onClick={() => remove(t.id)} style={adminBtnDanger}>삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 패널 3: 포트폴리오 (이미지 노출 토글) ─── */
function PortfolioPanel({ hidden, patch, show }) {
  const all = useMA(() => {
    const out = [];
    const R = window.RESOURCE || {};
    const CATS = window.SERVICE_CATEGORIES || [];
    CATS.forEach((c) => (R[c.key] || []).forEach((src) => out.push({ src, cat: c.kr })));
    ["2023", "2022", "2021"].forEach((y) =>
      (R[y] || []).forEach((src) => out.push({ src, cat: y + "년 아카이브" })));
    return out;
  }, []);
  const hiddenSet = useMA(() => new Set(hidden), [hidden]);
  const toggle = (src) => patch((arr) => {
    const s = new Set(arr);
    if (s.has(src)) s.delete(src); else s.add(src);
    return [...s];
  });
  return (
    <div>
      <PanelHead title="포트폴리오 이미지"
        sub={`총 ${all.length}장 · 숨김 ${hidden.length}장 — 클릭하면 노출/숨김 토글`} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 8 }}>
        {all.map((p, i) => {
          const isHidden = hiddenSet.has(p.src);
          return (
            <button key={i} onClick={() => toggle(p.src)} style={{
              background: "transparent", border: 0, padding: 0, cursor: "pointer",
              opacity: isHidden ? 0.25 : 1, position: "relative", display: "flex", flexDirection: "column", gap: 4,
            }}>
              <div style={{ width: "100%", aspectRatio: "1/1", background: "#0c0c0c",
                            border: isHidden ? "2px dashed #ff6b6b" : "1px solid #2a2a2a",
                            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                <img src={p.src} alt="" loading="lazy"
                  style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
              </div>
              <div style={{ fontSize: 10, color: isHidden ? "#ff6b6b" : "#888", textAlign: "left" }}>
                {isHidden ? "✕ 숨김" : p.cat}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── 패널 4: 장비 ─── */
function EquipmentPanel({ data, patch, show }) {
  const empty = { tag: "", name: "", spec: "", photo: "", label: "" };
  const [draft, setDraft] = useSA(empty);
  const add = () => {
    if (!draft.name) return show("장비명을 입력하세요");
    patch((arr) => [{ id: Date.now() + "", ...draft }, ...arr]);
    setDraft(empty);
  };
  const remove = (id) => patch((arr) => arr.filter((e) => e.id !== id));
  return (
    <div>
      <PanelHead title="장비 (Facility 페이지)"
        sub={data.length === 0
          ? "현재 기본 장비 목록이 표시됩니다. 추가하면 기본값을 덮어씁니다."
          : `${data.length}개 항목 — 기본값을 덮어쓰는 중`} />
      <div style={{ ...panelCard, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "180px 1fr 1.5fr", gap: 10, marginBottom: 8 }}>
          <input value={draft.tag} onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
            placeholder="OFFSET PRESS · 옵셋 인쇄" style={adminInput} />
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="장비명" style={adminInput} />
          <input value={draft.spec} onChange={(e) => setDraft({ ...draft, spec: e.target.value })}
            placeholder="스펙" style={adminInput} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
          <input value={draft.photo} onChange={(e) => setDraft({ ...draft, photo: e.target.value })}
            placeholder="이미지 경로 (resource/equipment/...)" style={adminInput} />
          <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            placeholder="라벨 (이미지 alt)" style={adminInput} />
          <button onClick={add} style={adminBtn}>추가 →</button>
        </div>
      </div>
      {data.length > 0 && (
        <button onClick={() => { if (confirm("모든 장비를 비우고 기본값으로 되돌릴까요?")) patch([]); }}
          style={{ ...adminBtnGhost, marginBottom: 16 }}>↺ 기본값으로 복원</button>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {data.map((e) => (
          <div key={e.id} style={{ ...panelCard, display: "grid",
            gridTemplateColumns: "80px 200px 1fr 1fr auto", gap: 16, alignItems: "center", padding: 16 }}>
            <div style={{ width: 80, height: 60, background: "#0c0c0c",
                          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
              {e.photo && <img src={e.photo} alt={e.label}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />}
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#1c69d4", letterSpacing: "0.18em" }}>{e.tag}</span>
            <strong style={{ color: "#fff" }}>{e.name}</strong>
            <span style={{ color: "#888", fontSize: 12, fontFamily: "monospace" }}>{e.spec}</span>
            <button onClick={() => remove(e.id)} style={adminBtnDanger}>삭제</button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 패널 5: 방문통계 ─── */
function StatsPanel({ visits }) {
  const [days, setDays] = useSA(30);

  const stats = useMA(() => {
    const now = Date.now();
    const cutoff = now - days * 86400 * 1000;
    const recent = visits.filter((v) => new Date(v.ts).getTime() >= cutoff);

    const byPage = {};
    const byDay = {};
    const sessions = new Set();
    const refMap = {};
    recent.forEach((v) => {
      byPage[v.page] = (byPage[v.page] || 0) + 1;
      const day = v.ts.slice(0, 10);
      byDay[day] = (byDay[day] || { pv: 0, sids: new Set() });
      byDay[day].pv++;
      byDay[day].sids.add(v.sid);
      sessions.add(v.sid);
      const r = (v.ref || "").replace(/^https?:\/\//, "").split("/")[0] || "(직접 접속)";
      refMap[r] = (refMap[r] || 0) + 1;
    });

    const dayKeys = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now - i * 86400 * 1000).toISOString().slice(0, 10);
      dayKeys.push(d);
    }
    const dayData = dayKeys.map((d) => ({
      day: d.slice(5), pv: byDay[d]?.pv || 0, uv: byDay[d]?.sids.size || 0,
    }));
    const maxPv = Math.max(1, ...dayData.map((d) => d.pv));
    const refList = Object.entries(refMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

    return { totalPV: recent.length, totalUV: sessions.size, byPage, dayData, maxPv, refList };
  }, [visits, days]);

  return (
    <div>
      <PanelHead title="방문 통계" sub={`최근 ${days}일 · PV ${stats.totalPV.toLocaleString()} · 순방문(UV) ${stats.totalUV.toLocaleString()}`} />
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {[7, 30, 90, 180].map((n) => (
          <button key={n} onClick={() => setDays(n)} style={days === n ? adminPill : adminPillOff}>
            최근 {n}일
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        {/* Daily chart */}
        <div style={panelCard}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#fff" }}>일별 페이지뷰</h3>
          <div style={{ display: "flex", alignItems: "flex-end", height: 220, gap: 2,
                        borderBottom: "1px solid #2a2a2a", paddingBottom: 4 }}>
            {stats.dayData.map((d, i) => (
              <div key={i} title={`${d.day} — PV ${d.pv} / UV ${d.uv}`} style={{
                flex: 1, height: `${(d.pv / stats.maxPv) * 100}%`, minHeight: d.pv > 0 ? 2 : 0,
                background: "#1c69d4", position: "relative",
              }} />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8,
                        fontSize: 10, color: "#666", fontFamily: "monospace" }}>
            <span>{stats.dayData[0]?.day}</span>
            <span>{stats.dayData[stats.dayData.length - 1]?.day}</span>
          </div>
        </div>

        {/* Page breakdown */}
        <div style={panelCard}>
          <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#fff" }}>페이지별 PV</h3>
          {Object.entries(stats.byPage).sort((a, b) => b[1] - a[1]).map(([page, count]) => (
            <div key={page} style={{ display: "flex", justifyContent: "space-between",
                                     padding: "8px 0", borderBottom: "1px solid #2a2a2a", fontSize: 13 }}>
              <span style={{ color: "#fff" }}>{page}</span>
              <strong style={{ color: "#1c69d4" }}>{count}</strong>
            </div>
          ))}
          {Object.keys(stats.byPage).length === 0 && <Empty text="아직 방문 기록이 없습니다." mini />}
        </div>
      </div>

      <div style={{ ...panelCard, marginTop: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#fff" }}>유입 경로 Top 10</h3>
        {stats.refList.length === 0 ? <Empty text="유입 경로 없음" mini /> : (
          stats.refList.map(([ref, n]) => (
            <div key={ref} style={{ display: "flex", justifyContent: "space-between",
                                    padding: "8px 0", borderBottom: "1px solid #2a2a2a", fontSize: 13 }}>
              <span style={{ color: "#fff" }}>{ref}</span>
              <strong style={{ color: "#1c69d4" }}>{n}</strong>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ─── 패널 6: 사이트 설정 ─── */
function SettingsPanel({ settings, password, patch, patchPw, show }) {
  const [pw1, setPw1] = useSA(""); const [pw2, setPw2] = useSA("");
  const set = (k, v) => patch({ ...settings, [k]: v });
  const FIELDS = [
    ["company",       "회사명",        "input"],
    ["ceo",           "대표자",        "input"],
    ["businessNo",    "사업자등록번호", "input"],
    ["mailOrderNo",   "통신판매업번호", "input"],
    ["tel",           "전화번호",      "input"],
    ["fax",           "팩스번호",      "input"],
    ["email",         "이메일",        "input"],
    ["address",       "주소",          "input"],
    ["addressDetail", "주소 상세",     "input"],
    ["hours",         "영업시간",      "input"],
    ["copyright",     "저작권 표기",   "input"],
    ["footerTagline", "푸터 소개문",   "textarea"],
  ];
  return (
    <div>
      <PanelHead title="사이트 설정" sub="푸터·연락처·저작권 등 회사 정보. 저장 즉시 사이트에 반영됩니다." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        {FIELDS.map(([k, label, kind]) => (
          <label key={k} style={{ display: "flex", flexDirection: "column", gap: 6,
            gridColumn: kind === "textarea" ? "span 2" : "auto" }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
                           color: "#888", textTransform: "uppercase" }}>{label}</span>
            {kind === "textarea" ? (
              <textarea value={settings[k] || ""} onChange={(e) => set(k, e.target.value)}
                rows={3} style={{ ...adminInput, height: "auto", padding: 12, resize: "vertical" }} />
            ) : (
              <input value={settings[k] || ""} onChange={(e) => set(k, e.target.value)} style={adminInput} />
            )}
          </label>
        ))}
      </div>

      <div style={{ ...panelCard, padding: 20 }}>
        <h3 style={{ margin: "0 0 16px", fontSize: 14, color: "#fff" }}>관리자 비밀번호 변경</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10 }}>
          <input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)}
            placeholder="새 비밀번호" style={adminInput} />
          <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)}
            placeholder="새 비밀번호 확인" style={adminInput} />
          <button onClick={() => {
            if (!pw1 || pw1.length < 4) return show("4자 이상 입력하세요");
            if (pw1 !== pw2) return show("두 비밀번호가 일치하지 않습니다");
            patchPw(pw1); setPw1(""); setPw2(""); show("비밀번호 변경 완료");
          }} style={adminBtn}>변경</button>
        </div>
        <div style={{ fontSize: 11, color: "#666", marginTop: 8 }}>
          현재 비밀번호: <code style={{ color: "#1c69d4" }}>{password || DEFAULT_PASSWORD}</code>
          &nbsp;(노출되어 있으니 변경 후 화면에서 확인하세요)
        </div>
      </div>
    </div>
  );
}

/* ─── 공통 UI ─── */
function PanelHead({ title, sub }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ margin: 0, fontSize: 24, color: "#fff", letterSpacing: "-0.02em" }}>{title}</h2>
      {sub && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#888" }}>{sub}</p>}
    </div>
  );
}
const Empty = ({ text, mini = false }) => (
  <div style={{ padding: mini ? 24 : 60, textAlign: "center", color: "#666", fontSize: 13,
                background: "#0c0c0c", border: "1px dashed #2a2a2a" }}>{text}</div>
);
const Toast = ({ text }) => (
  <div style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
                zIndex: 2000, padding: "12px 24px", background: "#1c69d4", color: "#fff",
                fontWeight: 700, fontSize: 13, boxShadow: "0 10px 30px rgba(28,105,212,0.4)" }}>{text}</div>
);

/* ─── 스타일 상수 ─── */
const adminBtn = {
  height: 44, padding: "0 22px", background: "#1c69d4", color: "#fff", border: 0,
  fontWeight: 700, fontSize: 13, cursor: "pointer", letterSpacing: "0.02em",
};
const adminBtnGhost = {
  height: 36, padding: "0 16px", background: "transparent", color: "#aaa",
  border: "1px solid #2a2a2a", fontSize: 12, fontWeight: 600, cursor: "pointer",
};
const adminBtnDanger = {
  height: 32, padding: "0 14px", background: "transparent", color: "#ff6b6b",
  border: "1px solid #552222", fontSize: 12, fontWeight: 600, cursor: "pointer",
};
const adminInput = {
  height: 40, padding: "0 14px", background: "#0c0c0c", color: "#fff",
  border: "1px solid #2a2a2a", borderRadius: 0, fontSize: 14, outline: "none",
  fontFamily: "Pretendard, sans-serif",
};
const adminPill = {
  height: 32, padding: "0 14px", background: "#1c69d4", color: "#fff",
  border: 0, fontSize: 12, fontWeight: 700, cursor: "pointer",
};
const adminPillOff = {
  ...adminPill, background: "transparent", color: "#888", border: "1px solid #2a2a2a",
};
const panelCard = {
  padding: 20, background: "#161616", border: "1px solid #2a2a2a",
};

/* ─── Export / Import ─── */
function exportJson(data, show) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `dynesketch_admin_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  show("JSON 내려받기 시작");
}
function importJson(file, onLoad) {
  if (!file) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d.version) throw new Error("형식이 올바르지 않습니다");
      onLoad({ ...DEFAULT_ADMIN_DATA, ...d,
        settings: { ...DEFAULT_ADMIN_DATA.settings, ...(d.settings || {}) } });
    } catch (e) { alert("가져오기 실패: " + e.message); }
  };
  r.readAsText(file);
}

/* ─── 마운트 ─── */
function mountAdmin() {
  if (document.getElementById("admin-root")) return;
  const div = document.createElement("div");
  div.id = "admin-root";
  document.body.appendChild(div);
  ReactDOM.createRoot(div).render(<AdminApp />);
}
function isAdminUrl() {
  return location.hash === "#admin" || /[?&]admin(=|$)/.test(location.search);
}
if (isAdminUrl()) mountAdmin();
window.addEventListener("hashchange", () => { if (isAdminUrl()) mountAdmin(); });

window.openAdmin = mountAdmin; // for manual trigger via console
