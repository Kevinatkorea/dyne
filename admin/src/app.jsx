/* global React, ReactDOM, API, UI */
/* =====================================================================
   app.jsx — 관리자 셸: 로그인 · 좌측 네비 · 화면 라우팅
   ===================================================================== */
const { useState, useEffect, useCallback } = React;
const { Toasts, toast, Field, Loading } = UI;

const MENU = [
  { group: "현황", items: [
    { key: "dashboard", label: "대시보드", icon: "▤" },
    { key: "stats", label: "방문 통계", icon: "▥" },
  ]},
  { group: "영업", items: [
    { key: "inquiries", label: "견적요청", icon: "✉", badge: "inquiries" },
  ]},
  { group: "콘텐츠", items: [
    { key: "portfolio", label: "포트폴리오", icon: "▣" },
    { key: "services", label: "사업영역", icon: "◈" },
    { key: "equipment", label: "보유 장비", icon: "⚙" },
    { key: "history", label: "연혁", icon: "⏱" },
    { key: "clients", label: "고객사", icon: "◎" },
    { key: "awards", label: "수상·인증", icon: "★" },
    { key: "hero-slides", label: "상단 배경", icon: "▦" },
    { key: "notices", label: "공지·팝업", icon: "◐" },
    { key: "media", label: "미디어", icon: "🖼" },
  ]},
  { group: "설정", items: [
    { key: "settings", label: "사이트 설정", icon: "⚒" },
    { key: "users", label: "관리자 계정", icon: "◇" },
    { key: "backup", label: "백업·복원", icon: "⇩" },
    { key: "audit", label: "감사 로그", icon: "☰" },
  ]},
];

const TITLES = {};
MENU.forEach((g) => g.items.forEach((i) => { TITLES[i.key] = i.label; }));

/* ---- 로그인 ------------------------------------------------------- */
function Login({ onDone }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr("");
    try {
      const r = await API.auth.login(email, password);
      onDone(r.user);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  };

  return (
    <div className="login">
      <form className="login__box card" onSubmit={submit} style={{ padding: 28 }}>
        <h1>다인스케치 관리자</h1>
        <p>DYNESKETCH ADMIN</p>
        <Field label="이메일">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                 autoComplete="username" autoFocus required />
        </Field>
        <Field label="비밀번호">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                 autoComplete="current-password" required />
        </Field>
        {err ? <div className="badge badge--lost" style={{ display: "block", padding: "8px 10px", marginBottom: 12 }}>{err}</div> : null}
        <button className="btn btn--pri" style={{ width: "100%" }} disabled={busy}>
          {busy ? "확인 중…" : "로그인"}
        </button>
        <div className="small muted" style={{ marginTop: 14, textAlign: "center" }}>
          <a href="/" style={{ color: "var(--a-ink-3)" }}>← 홈페이지로</a>
        </div>
      </form>
    </div>
  );
}

/* ---- 셸 ----------------------------------------------------------- */
function Shell({ me, onLogout }) {
  const [view, setView] = useState(() => (location.hash || "#dashboard").slice(1).split("?")[0] || "dashboard");
  const [params, setParams] = useState({});
  const [unread, setUnread] = useState(0);

  const canWrite = me.role !== "viewer";

  const go = useCallback((key, p = {}) => {
    setView(key);
    setParams(p);
    location.hash = key;
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onHash = () => {
      const k = (location.hash || "#dashboard").slice(1);
      if (k && k !== view) { setView(k); setParams({}); }
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, [view]);

  /* 신규 견적요청 뱃지 — 60초마다 갱신 */
  useEffect(() => {
    let alive = true;
    const tick = () => API.admin.inquiries({ size: 5 })
      .then((d) => alive && setUnread(d.unread || 0))
      .catch(() => {});
    tick();
    const t = setInterval(tick, 60000);
    return () => { alive = false; clearInterval(t); };
  }, [view]);

  const logout = async () => {
    try { await API.auth.logout(); } catch { /* noop */ }
    onLogout();
  };

  let screen = null;
  if (view === "dashboard") screen = <window.Dashboard go={go} />;
  else if (view === "inquiries") screen = <window.Inquiries params={params} canWrite={canWrite} />;
  else if (view === "portfolio") screen = <window.Portfolio canWrite={canWrite} />;
  else if (view === "media") screen = <window.Media canWrite={canWrite} />;
  else if (view === "stats") screen = <window.Stats />;
  else if (view === "settings") screen = <window.Settings canWrite={canWrite} />;
  else if (view === "users") screen = <window.Users me={me} />;
  else if (view === "audit") screen = <window.Audit me={me} />;
  else if (view === "backup") screen = <window.Backup me={me} />;
  else if (window.CONTENT_CFG[view]) screen = <window.ContentManager cfg={window.CONTENT_CFG[view]} canWrite={canWrite} />;
  else screen = <div className="empty">알 수 없는 화면입니다.</div>;

  return (
    <div className="shell">
      <nav className="nav">
        <div className="nav__brand">
          <b>다인스케치</b>
          <span>DYNESKETCH ADMIN</span>
        </div>
        {MENU.map((g) => (
          <div key={g.group}>
            <div className="nav__group">{g.group}</div>
            {g.items.map((i) => (
              <button key={i.key}
                      className={`nav__item${view === i.key ? " is-on" : ""}`}
                      onClick={() => go(i.key)}>
                <span className="ic">{i.icon}</span>
                <span>{i.label}</span>
                {i.badge === "inquiries" && unread > 0 ? <span className="nav__badge">{unread}</span> : null}
              </button>
            ))}
          </div>
        ))}
        <div className="nav__foot">
          <div className="who">{me.name}</div>
          <div className="role">
            {me.role === "super" ? "최고관리자" : me.role === "staff" ? "운영자" : "읽기전용"}
          </div>
          <div className="row" style={{ marginTop: 8, gap: 6 }}>
            <a className="btn btn--sm" href="/" target="_blank" rel="noreferrer">홈페이지</a>
            <button className="btn btn--sm" onClick={logout}>로그아웃</button>
          </div>
        </div>
      </nav>

      <div className="main">
        <div className="top">
          <h1>{TITLES[view] || "관리자"}</h1>
          {!canWrite ? <span className="badge badge--muted">읽기 전용 계정</span> : null}
          <div className="spacer" />
          <a className="btn btn--sm" href="/" target="_blank" rel="noreferrer">사이트 보기 ↗</a>
        </div>
        <div className="body">{screen}</div>
      </div>
    </div>
  );
}

/* ---- 부트 ---------------------------------------------------------- */
function App() {
  const [state, setState] = useState({ loading: true, me: null });

  useEffect(() => {
    API.auth.me()
      .then((d) => setState({ loading: false, me: d.user }))
      .catch(() => setState({ loading: false, me: null }));
  }, []);

  if (state.loading) return <Loading label="확인 중…" />;
  return (
    <>
      {state.me
        ? <Shell me={state.me} onLogout={() => setState({ loading: false, me: null })} />
        : <Login onDone={(me) => setState({ loading: false, me })} />}
      <Toasts />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("admin-root")).render(<App />);
