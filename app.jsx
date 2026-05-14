/* global React, ReactDOM,
          Nav, Footer,
          HomePage, AboutPage, ServicesPage, FacilityPage, PortfolioPage, ContactPage,
          useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakSelect, TweakColor, TweakToggle */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "heroStyle": "press",
  "headlineLang": "en",
  "theme": "warm",
  "accent": "#1c69d4",
  "facilityLayout": "grid"
}/*EDITMODE-END*/;

const THEMES = {
  warm: {
    "--paper-1": "#f7f5ef",
    "--paper-2": "#ede9df",
    "--ink-1": "#161616",
    "--ink-2": "#5e5e5e",
    "--hairline": "#d8d3c6",
  },
  dark: {
    "--paper-1": "#0c0c0c",
    "--paper-2": "#161616",
    "--ink-1": "#f3f1e8",
    "--ink-2": "#9a9385",
    "--hairline": "#2a2a2a",
  },
  midnight: {
    "--paper-1": "#0a1422",
    "--paper-2": "#0f1b2c",
    "--ink-1": "#f3f5fa",
    "--ink-2": "#8696b3",
    "--hairline": "#1c2a40",
  },
  bright: {
    "--paper-1": "#ffffff",
    "--paper-2": "#f4f4f4",
    "--ink-1": "#0a0a0a",
    "--ink-2": "#666666",
    "--hairline": "#e6e6e6",
  },
};

const ACCENTS = ["#1c69d4", "#e10600", "#c4933b", "#39ff14"];

function App() {
  const [page, setPage] = useState("home");
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme CSS vars to :root
  useEffect(() => {
    const theme = THEMES[t.theme] || THEMES.warm;
    Object.entries(theme).forEach(([k, v]) => {
      document.documentElement.style.setProperty(k, v);
    });
    document.documentElement.style.setProperty("--accent", t.accent);
    // Body background follows paper-1
    document.body.style.background = theme["--paper-1"];
    document.body.style.color = theme["--ink-1"];
  }, [t.theme, t.accent]);

  // Reset scroll on page change
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [page]);

  // Update document title + meta description per page for browser tabs,
  // bookmarking, and crawlers that re-fetch after JS executes.
  useEffect(() => {
    const PAGE_META = {
      home:      { t: "다인스케치 DYNESKETCH | 편집디자인·인쇄 전문기업 (성수동, 18년)",
                   d: "2008년 성수동에서 시작한 18년차 편집디자인·인쇄 전문기업. 기획·디자인·인쇄·후가공·납품을 한 팀이 책임집니다." },
      about:    { t: "회사 소개 · About — 다인스케치 DYNESKETCH",
                   d: "주식회사 다인스케치는 2008년 7월 성수동에서 4명의 디자이너로 시작했습니다. 18년·1,200건·320곳의 기업·기관과 함께 일했습니다." },
      services: { t: "서비스 · Services — 다인스케치 DYNESKETCH",
                   d: "표지디자인, 브로슈어·카탈로그, 리플릿, 포스터, 보고서·자료집, 현수막·배너, 기타 인쇄물까지 7가지 카테고리." },
      facility: { t: "보유 장비 · Facility — 다인스케치 DYNESKETCH",
                   d: "Heidelberg Speedmaster XL106, HP Indigo 12000, KOMORI Lithrone GL40 등 옵셋·디지털·후가공 핵심 장비 12종." },
      portfolio:{ t: "포트폴리오 · Portfolio — 다인스케치 DYNESKETCH",
                   d: "2008년부터 1,200건 이상의 작업. 카테고리별·연도별로 다인스케치의 실제 작업 사례를 확인하세요." },
      contact:  { t: "견적 / 문의 · Contact — 다인스케치 DYNESKETCH",
                   d: "다인스케치 견적 요청. TEL 02-514-2450 · design2@dynes.co.kr · 서울 성동구 성수이로18길 31 풍림테크원 401·407호." },
    };
    const m = PAGE_META[page] || PAGE_META.home;
    document.title = m.t;
    const setMeta = (sel, value) => {
      const el = document.querySelector(sel);
      if (el) el.setAttribute("content", value);
    };
    setMeta('meta[name="description"]', m.d);
    setMeta('meta[property="og:title"]', m.t);
    setMeta('meta[property="og:description"]', m.d);
    setMeta('meta[name="twitter:title"]', m.t);
    setMeta('meta[name="twitter:description"]', m.d);
  }, [page]);

  const isDarkTheme = t.theme === "dark" || t.theme === "midnight";

  let pageEl;
  switch (page) {
    case "about": pageEl = <AboutPage setPage={setPage} />; break;
    case "services": pageEl = <ServicesPage setPage={setPage} />; break;
    case "facility": pageEl = <FacilityPage setPage={setPage} />; break;
    case "portfolio": pageEl = <PortfolioPage setPage={setPage} />; break;
    case "contact": pageEl = <ContactPage setPage={setPage} />; break;
    default: pageEl = <HomePage setPage={setPage} tweaks={t} />;
  }

  return (
    <div data-screen-label={`다인스케치 — ${page}`}>
      <Nav page={page} setPage={setPage} theme={isDarkTheme ? "dark" : "light"} />
      {pageEl}
      <Footer setPage={setPage} />

      <TweaksPanel title="Tweaks · 다인스케치">
        <TweakSection label="Hero · 메인 히어로">
          <TweakSelect
            label="Hero style"
            value={t.heroStyle}
            options={[
              { value: "press", label: "01 · 인쇄기 클로즈업 (기본)" },
              { value: "portfolio", label: "02 · 포트폴리오 결과물" },
              { value: "typo", label: "03 · 타이포그래피 중심" },
              { value: "stats", label: "04 · 수치/연혁 강조" },
            ]}
            onChange={(v) => setTweak("heroStyle", v)}
          />
          <TweakRadio
            label="Headline 언어"
            value={t.headlineLang}
            options={[
              { value: "en", label: "English" },
              { value: "kr", label: "한글" },
            ]}
            onChange={(v) => setTweak("headlineLang", v)}
          />
        </TweakSection>

        <TweakSection label="Theme · 컬러 테마">
          <TweakSelect
            label="Background"
            value={t.theme}
            options={[
              { value: "warm", label: "Warm · 성수동 오프화이트 (기본)" },
              { value: "bright", label: "Bright · 화이트" },
              { value: "dark", label: "Dark · 그레인 다크" },
              { value: "midnight", label: "Midnight · 네이비 블루" },
            ]}
            onChange={(v) => setTweak("theme", v)}
          />
          <TweakColor
            label="Accent"
            value={t.accent}
            options={ACCENTS}
            onChange={(v) => setTweak("accent", v)}
          />
        </TweakSection>

        <TweakSection label="Facility · 장비 섹션">
          <TweakRadio
            label="Layout"
            value={t.facilityLayout}
            options={[
              { value: "grid", label: "Grid" },
              { value: "carousel", label: "Carousel" },
            ]}
            onChange={(v) => setTweak("facilityLayout", v)}
          />
        </TweakSection>

        <div style={{
          padding: "12px 16px", fontSize: 11, lineHeight: 1.6,
          color: "rgba(255,255,255,0.55)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}>
          상단 메뉴를 클릭하면 About / Services / Facility / Portfolio / Contact 페이지로 이동합니다.
          히어로 스타일·언어 변경은 홈 페이지에서 즉시 반영됩니다.
          <br /><br />
          <a href="다인스케치 변형.html" style={{ color: "#fff", textDecoration: "underline" }}>→ 섹션 베리에이션 캔버스 열기</a>
        </div>
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
