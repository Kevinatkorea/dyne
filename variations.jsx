/* global React, ReactDOM, Photo, Nav, Logo, SectionHead, Stat, Marquee,
          ProcessSteps, ClientWall, EquipmentCard, PortfolioCard, PHOTO,
          DesignCanvas, DCSection, DCArtboard */
const { useState: useS } = React;

/* ===========================================================
   Variation builders — reuse home.jsx pieces but isolated
   =========================================================== */

function MiniHero({ variant, lang = "en", themeAccent = "#1c69d4" }) {
  const variants = {
    press:    { photo: PHOTO.pressCloseup,  label: "Heidelberg XL106",       eyebrow: "PRINT · DESIGN · DELIVER",  en: ["PRINT","REIMAGINED."],     kr: ["인쇄,","다시 그리다."] },
    portfolio:{ photo: PHOTO.bookPages,     label: "브로슈어 결과물",          eyebrow: "PORTFOLIO",                en: ["FOR THE","CRAFTED FEW."],  kr: ["섬세하게,","정확하게."] },
    typo:     { photo: PHOTO.inkCmyk,       label: "CMYK 디테일",             eyebrow: "TOTAL ONESTOP SERVICE",    en: ["EVERY","PRESS RUN.","PERFECTED."], kr: ["모든 인쇄,","완벽하게."] },
    stats:    { photo: PHOTO.designStudio,  label: "성수동 스튜디오",          eyebrow: "EST. 2008 · SEONGSU",      en: ["18 YEARS.","1,200 JOBS.","ZERO COMP."], kr: ["18년","1,200건","무타협"] },
  };
  const v = variants[variant];
  return (
    <div style={{ position: "relative", height: "100%", background: "#000", color: "#fff", overflow: "hidden" }}>
      <Photo src={v.photo} label={v.label} ratio="auto" style={{ width: "100%", height: "100%", aspectRatio: "auto", position: "absolute", inset: 0 }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.85) 100%)" }} />
      <div style={{ position: "relative", height: "100%", padding: 48, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 16 }}>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em",
          color: "rgba(255,255,255,0.8)", display: "inline-flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ width: 24, height: 1, background: "currentColor" }} /> {v.eyebrow}
        </span>
        <h1 style={{
          margin: 0, fontFamily: "var(--font-display)",
          fontSize: 64, fontWeight: 300, lineHeight: 0.92, color: "#fff",
          textTransform: "uppercase", letterSpacing: "-0.02em",
        }}>
          {(lang === "kr" ? v.kr : v.en).map((line, i) => <span key={i} style={{ display: "block" }}>{line}</span>)}
        </h1>
        <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.75)", maxWidth: 360, lineHeight: 1.55, fontWeight: 500 }}>
          기획부터 인쇄·후가공·납품까지 한 팀이 책임집니다.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <span style={{
            height: 40, padding: "0 18px", background: themeAccent, color: "#fff",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}>견적 요청 →</span>
          <span style={{
            height: 40, padding: "0 18px", background: "transparent", color: "#fff",
            border: "1px solid rgba(255,255,255,0.6)",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            display: "inline-flex", alignItems: "center",
          }}>포트폴리오</span>
        </div>
      </div>
    </div>
  );
}

/* Color theme strip — shows full hero in different theme contexts */
function ThemeStrip({ themeName, vars, accent = "#1c69d4" }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    if (!ref.current) return;
    Object.entries(vars).forEach(([k, v]) => ref.current.style.setProperty(k, v));
    ref.current.style.setProperty("--accent", accent);
  }, [vars, accent]);
  return (
    <div ref={ref} style={{ height: "100%", background: vars["--paper-1"], color: vars["--ink-1"], display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "24px 32px", borderBottom: `1px solid ${vars["--hairline"]}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 900, letterSpacing: "0.04em" }}>DYNESKETCH</span>
        <span style={{
          height: 32, padding: "0 14px", background: accent, color: "#fff",
          fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
          display: "inline-flex", alignItems: "center",
        }}>견적 요청 →</span>
      </div>
      <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 20, flex: 1, justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: vars["--ink-2"], display: "inline-flex", alignItems: "center", gap: 10 }}>
          <span style={{ width: 24, height: 1, background: "currentColor" }} /> {themeName.toUpperCase()}
        </span>
        <h2 style={{
          margin: 0, fontFamily: "var(--font-display)",
          fontSize: 48, fontWeight: 300, lineHeight: 0.95, color: vars["--ink-1"],
          textTransform: "uppercase", letterSpacing: "-0.02em",
        }}>PRINT,<br />REIMAGINED.</h2>
        <p style={{ margin: 0, fontSize: 14, color: vars["--ink-2"], maxWidth: 380, lineHeight: 1.55 }}>
          기획부터 인쇄·후가공·납품까지 한 팀이 책임지는 통합 서비스.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 0, borderTop: `1px solid ${vars["--hairline"]}`, paddingTop: 16, marginTop: 8 }}>
          {[["18","YEARS"],["1,200+","JOBS"],["320+","CLIENTS"],["99%","ON-TIME"]].map(([v, l], i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 300, color: vars["--ink-1"] }}>{v}</span>
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: vars["--ink-2"] }}>{l}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* Equipment section in different layouts */
function FacilityVariant({ kind }) {
  const items = [
    { tag: "OFFSET", name: "Heidelberg XL 106", spec: "6c · 750×1060mm", photo: PHOTO.pressCloseup, label: "XL106" },
    { tag: "OFFSET", name: "KOMORI GL40",       spec: "4c · 720×1030mm", photo: PHOTO.pressRollers, label: "GL40" },
    { tag: "DIGITAL", name: "HP Indigo 12000",  spec: "B2 · 7c CMYKOV+",  photo: PHOTO.inkCmyk, label: "Indigo" },
    { tag: "BIND", name: "Müller Martini",      spec: "Saddle · 13.5k/h", photo: PHOTO.bookbind, label: "Müller" },
    { tag: "CUT", name: "Polar 137 XT",          spec: "Hi-precision 137cm", photo: PHOTO.cutter, label: "Polar" },
    { tag: "LF", name: "Roland LG-540",          spec: "UV/eco · 1.6m",   photo: PHOTO.printSamples, label: "Roland" },
  ];
  if (kind === "grid") {
    return (
      <div style={{ background: "#0f0f0f", color: "#fff", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="FACILITY · 보유 장비" title="MACHINES." kr="장비" dark />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 24 }}>
          {items.map((e, i) => <EquipmentCard key={i} {...e} photoLabel={e.label} dark />)}
        </div>
      </div>
    );
  }
  if (kind === "carousel") {
    return (
      <div style={{ background: "#0f0f0f", color: "#fff", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="FACILITY · 캐러셀" title="MACHINES." kr="한 대씩 자세히" dark />
        <div style={{ marginTop: 24, background: "#000", border: "1px solid rgba(255,255,255,0.12)", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 0 }}>
          <Photo src={items[0].photo} label={items[0].label} ratio="16/10" />
          <div style={{ padding: 32, display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "var(--accent)" }}>{items[0].tag} PRESS</span>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 300, color: "#fff", textTransform: "uppercase", lineHeight: 1.05 }}>{items[0].name}</h3>
            <p style={{ margin: 0, fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "rgba(255,255,255,0.7)", letterSpacing: "0.02em" }}>{items[0].spec}</p>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <span style={{ width: 40, height: 40, border: "1px solid rgba(255,255,255,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>←</span>
              <span style={{ width: 40, height: 40, border: "1px solid rgba(255,255,255,0.3)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>→</span>
              <span style={{ marginLeft: 12, alignSelf: "center", fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em", color: "rgba(255,255,255,0.6)" }}>01 / 06</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 16, overflow: "hidden" }}>
          {items.slice(1, 5).map((e, i) => (
            <div key={i} style={{ flex: 1, opacity: 0.5 }}>
              <Photo src={e.photo} label={e.label} ratio="4/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "spec-table") {
    return (
      <div style={{ background: "var(--paper-1)", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="FACILITY · 스펙 테이블" title="MACHINES." kr="목록 + 스펙" />
        <div style={{ marginTop: 24, borderTop: "1px solid var(--hairline)" }}>
          {items.map((e, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 80px 1fr 1.4fr 40px", gap: 24, padding: "20px 0", borderBottom: "1px solid var(--hairline)", alignItems: "center" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "var(--accent)" }}>{e.tag}</span>
              <div style={{ width: 80, height: 56 }}><Photo src={e.photo} label={e.label} ratio="auto" style={{ width: 80, height: 56, aspectRatio: "auto" }} /></div>
              <span style={{ fontWeight: 700, letterSpacing: "-0.01em", fontSize: 15 }}>{e.name}</span>
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 12, color: "var(--ink-2)" }}>{e.spec}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, color: "var(--ink-2)" }}>→</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

/* Trust section variations */
function TrustVariant({ kind }) {
  if (kind === "stats-dark") {
    return (
      <div style={{ background: "#0a0a0a", color: "#fff", padding: 48, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(255,255,255,0.6)", marginBottom: 32 }}>TRUST · 다인스케치를 보여주는 5가지 숫자</span>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0 }}>
          {[
            ["18", "YEARS", "업력"],
            ["1,200+", "PROJECTS", "프로젝트"],
            ["320+", "CLIENTS", "거래처"],
            ["99.4%", "ON-TIME", "납기 준수"],
            ["10+", "YRS EXP.", "디자이너 경력"],
          ].map(([v, l, k], i) => (
            <div key={i} style={{ padding: "0 24px", borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: 300, color: "#fff", lineHeight: 1 }}>{v}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "rgba(255,255,255,0.55)", marginTop: 12 }}>{l}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.78)", marginTop: 4 }}>{k}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "logos-grid") {
    return (
      <div style={{ background: "var(--paper-1)", padding: 32, height: "100%", overflow: "hidden" }}>
        <SectionHead eyebrow="CLIENTS · 320+ COMPANIES" title="TRUSTED BY." kr="320곳 이상의 거래처" />
        <div style={{ marginTop: 24 }}><ClientWall /></div>
      </div>
    );
  }
  if (kind === "principles") {
    return (
      <div style={{ background: "var(--paper-2)", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="HOW WE WORK" title="OUR PRINCIPLES." kr="다인스케치의 4가지 원칙" />
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, borderTop: "1px solid var(--hairline)", borderLeft: "1px solid var(--hairline)" }}>
          {[
            { n: "01", t: "Onsite First", k: "현장에서 결정", d: "감리·교정을 우리 작업장에서 직접." },
            { n: "02", t: "Single Window", k: "단일 창구 운영", d: "PM 한 명이 처음부터 끝까지." },
            { n: "03", t: "10+ Year Hands", k: "최소 10년 경력", d: "디자이너·디렉터 평균 경력." },
            { n: "04", t: "On-time", k: "99.4% 납기 준수", d: "1,200건 누적 작업 기준." },
          ].map((v, i) => (
            <div key={i} style={{ padding: 20, borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)", background: "var(--paper-1)", display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", color: "var(--accent)" }}>PRINCIPLE {v.n}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 300, textTransform: "uppercase" }}>{v.t}</span>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "-0.02em" }}>{v.k}</span>
              <span style={{ fontSize: 11, color: "var(--ink-2)", lineHeight: 1.6 }}>{v.d}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "awards") {
    return (
      <div style={{ background: "#0a0a0a", color: "#fff", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="AWARDS & CERTIFICATIONS" title="RECOGNIZED." kr="수상·인증" dark />
        <div style={{ marginTop: 24 }}>
          {[
            ["2024", "대한민국 디자인전람회 / 편집부문 입선"],
            ["2023", "한국출판문화상 / 본상 (북디자인)"],
            ["2022", "iF Design Award / Communication 부문"],
            ["2021", "조달청 우수 인쇄업체 지정"],
            ["2020", "ISO 9001 품질경영시스템 인증"],
          ].map(([y, t], i) => (
            <div key={i} style={{ display: "flex", gap: 32, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.15)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 300, color: "var(--accent)", minWidth: 80 }}>{y}</span>
              <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: "-0.02em" }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

/* Portfolio section variations */
function PortfolioVariant({ kind }) {
  const items = [
    { cat: "보고서", title: "2025 한국문화예술백서", client: "한국문화예술위원회", year: "2025", photo: PHOTO.report, label: "백서" },
    { cat: "브로슈어", title: "Hyundai N Brand Book", client: "현대자동차", year: "2025", photo: PHOTO.brochure, label: "브로슈어" },
    { cat: "표지", title: "민음 한국문학선 표지", client: "민음사", year: "2024", photo: PHOTO.bookPages, label: "표지" },
    { cat: "포스터", title: "서울국제도서전 포스터", client: "대한출판문화협회", year: "2024", photo: PHOTO.poster, label: "포스터" },
    { cat: "카탈로그", title: "LG H&A 라인업", client: "LG전자", year: "2024", photo: PHOTO.catalog, label: "카탈로그" },
    { cat: "리플릿", title: "성수동 관광 가이드", client: "성동구청", year: "2024", photo: PHOTO.leaflet, label: "리플릿" },
  ];

  if (kind === "grid") {
    return (
      <div style={{ background: "var(--paper-1)", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="SELECTED WORK" title="WORK," kr="그리드 레이아웃" />
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px 16px" }}>
          {items.map((p, i) => <PortfolioCard key={i} category={p.cat} title={p.title} client={p.client} year={p.year} photo={p.photo} photoLabel={p.label} />)}
        </div>
      </div>
    );
  }
  if (kind === "filter") {
    return (
      <div style={{ background: "var(--paper-1)", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="PORTFOLIO" title="WITH FILTERS." kr="카테고리 필터 + 그리드" />
        <div style={{ marginTop: 20, display: "flex", gap: 4, borderBottom: "1px solid var(--hairline)", paddingBottom: 16, marginBottom: 24, flexWrap: "wrap" }}>
          {["전체", "표지", "브로슈어", "리플릿", "포스터", "보고서", "카탈로그"].map((c, i) => (
            <span key={i} style={{
              height: 30, padding: "0 12px", background: i === 0 ? "var(--ink-1)" : "transparent",
              color: i === 0 ? "#fff" : "var(--ink-1)", fontSize: 11, fontWeight: 600,
              display: "inline-flex", alignItems: "center",
            }}>{c}</span>
          ))}
          <span style={{ marginLeft: "auto", alignSelf: "center", fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "var(--ink-2)" }}>
            SHOWING <span style={{ color: "var(--accent)" }}>06</span> / 12
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "32px 16px" }}>
          {items.slice(0,6).map((p, i) => <PortfolioCard key={i} category={p.cat} title={p.title} client={p.client} year={p.year} photo={p.photo} photoLabel={p.label} />)}
        </div>
      </div>
    );
  }
  if (kind === "feature") {
    return (
      <div style={{ background: "var(--paper-1)", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="CASE STUDY · 01 / 03" title="WORK," kr="큐레이션된 케이스 스터디" />
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
          <Photo src={items[0].photo} label={items[0].label} ratio="16/11" />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, justifyContent: "center" }}>
            <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em", color: "var(--accent)" }}>BOGOSEO · 보고서</span>
            <h3 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 32, fontWeight: 300, lineHeight: 1.05, textTransform: "uppercase", letterSpacing: "-0.01em" }}>2025 한국문화예술<br />백서</h3>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-2)", lineHeight: 1.65 }}>
              한국문화예술위원회 / 분량 384p / 발행 2025.06 · 데이터 시각화와 본문 그리드를 6개월에 걸쳐 새로 설계했습니다.
            </p>
            <div style={{ display: "flex", gap: 24, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
              <div><span style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "var(--ink-2)" }}>YEAR</span><div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>2025</div></div>
              <div><span style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "var(--ink-2)" }}>PAGES</span><div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>384</div></div>
              <div><span style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "var(--ink-2)" }}>RUN</span><div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>3,000부</div></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/* Process variations */
function ProcessVariant({ kind }) {
  if (kind === "horizontal") {
    return (
      <div style={{ background: "var(--paper-2)", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="HOW WE WORK · 6 STEPS" title="FROM BRIEF TO DELIVERY." kr="가로형 6단계" />
        <div style={{ marginTop: 24 }}><ProcessSteps /></div>
      </div>
    );
  }
  if (kind === "vertical") {
    const steps = [
      { n: "01", t: "Brief",   k: "기획/컨설팅",    d: "고객사 요구를 듣고 핵심 메시지·예산·납기를 정의합니다." },
      { n: "02", t: "Plan",    k: "기획·구성안",     d: "콘텐츠 구성, 분량, 페이지·사이즈·후가공 사양 설계." },
      { n: "03", t: "Design",  k: "디자인 시안",     d: "10년 이상 경력의 디자이너가 2–3안 시안 제시." },
      { n: "04", t: "Proof",   k: "교정·감리",       d: "색 교정과 감리로 색·재질을 사전 검증." },
      { n: "05", t: "Print",   k: "본인쇄",          d: "옵셋·디지털·실사 분야 전문 장비로 인쇄." },
      { n: "06", t: "Deliver", k: "후가공·납품",     d: "재단·제본·코팅·박 후가공 후 납기 준수." },
    ];
    return (
      <div style={{ background: "var(--paper-1)", padding: 32, height: "100%", overflow: "auto" }}>
        <SectionHead eyebrow="HOW WE WORK" title="6 STEPS." kr="세로 타임라인" />
        <div style={{ marginTop: 24 }}>
          {steps.map((s, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "60px 1fr 1fr", gap: 24, padding: "16px 0", borderTop: "1px solid var(--hairline)" }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 300, color: "var(--accent)" }}>{s.n}</span>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 300, textTransform: "uppercase" }}>{s.t}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--ink-1)", marginTop: 4 }}>{s.k}</div>
              </div>
              <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: "var(--ink-2)" }}>{s.d}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "diagram") {
    const steps = ["Brief", "Plan", "Design", "Proof", "Print", "Deliver"];
    return (
      <div style={{ background: "#0a0a0a", color: "#fff", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="HOW WE WORK" title="THE LOOP." kr="다이어그램 형식" dark />
        <div style={{ marginTop: 48, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <div style={{ width: 76, height: 76, border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                  <span style={{ position: "absolute", top: 6, left: 8, fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", color: "var(--accent)" }}>{`0${i+1}`}</span>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 300, textTransform: "uppercase", letterSpacing: "0.02em" }}>{s}</span>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.2)", margin: "0 -4px", position: "relative" }}>
                  <span style={{ position: "absolute", right: -6, top: -4, color: "rgba(255,255,255,0.4)" }}>›</span>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        <p style={{ marginTop: 56, fontSize: 13, color: "rgba(255,255,255,0.6)", maxWidth: 500, lineHeight: 1.7 }}>
          한 명의 PM이 6단계 전체를 끝까지 책임지며, 단계 사이에서 외주로 빠지는 작업이 없습니다.
        </p>
      </div>
    );
  }
}

/* Service tile variations */
function ServiceVariant({ kind }) {
  const items = [
    { k: "표지 디자인", e: "Cover Design", photo: PHOTO.bookPages, label: "표지" },
    { k: "브로슈어", e: "Brochure", photo: PHOTO.brochure, label: "브로슈어" },
    { k: "포스터", e: "Poster", photo: PHOTO.poster, label: "포스터" },
    { k: "보고서", e: "Report", photo: PHOTO.report, label: "보고서" },
    { k: "리플릿", e: "Leaflet", photo: PHOTO.leaflet, label: "리플릿" },
    { k: "현수막", e: "Banner", photo: PHOTO.printSamples, label: "현수막" },
  ];
  if (kind === "photo-tiles") {
    return (
      <div style={{ background: "var(--paper-2)", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="SERVICES" title="WHAT WE MAKE." kr="포토 타일" />
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: "1px solid var(--hairline)", borderLeft: "1px solid var(--hairline)" }}>
          {items.map((s, i) => (
            <div key={i} style={{ borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)" }}>
              <Photo src={s.photo} label={s.label} ratio="4/3" />
              <div style={{ padding: 16 }}>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", color: "var(--accent)" }}>{`0${i+1}`} · {s.e}</div>
                <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 6 }}>{s.k}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "list") {
    return (
      <div style={{ background: "var(--paper-1)", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="SERVICES · INDEX" title="WHAT WE MAKE." kr="리스트 (큰 타이포)" />
        <div style={{ marginTop: 24, borderTop: "1px solid var(--hairline)" }}>
          {items.map((s, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "40px 160px 1fr 80px",
              gap: 24, padding: "18px 0", borderBottom: "1px solid var(--hairline)", alignItems: "center",
              transition: "background 200ms",
            }}>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "var(--ink-2)" }}>{`0${i+1}`}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 300, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{s.e}</span>
              <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{s.k}</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", color: "var(--ink-2)", justifySelf: "end" }}>VIEW →</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (kind === "icon-cards") {
    return (
      <div style={{ background: "var(--paper-1)", padding: 32, height: "100%" }}>
        <SectionHead eyebrow="SERVICES" title="WHAT WE MAKE." kr="아이콘 카드 (이미지 없이)" />
        <div style={{ marginTop: 24, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: "1px solid var(--hairline)", borderLeft: "1px solid var(--hairline)" }}>
          {items.map((s, i) => (
            <div key={i} style={{
              padding: 24, borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)",
              minHeight: 160, display: "flex", flexDirection: "column", gap: 12,
              background: i === 0 ? "var(--ink-1)" : "transparent",
              color: i === 0 ? "#fff" : "var(--ink-1)",
            }}>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", color: i === 0 ? "var(--accent)" : "var(--ink-2)" }}>{`0${i+1}`}</div>
              <div style={{
                width: 36, height: 36, border: `1px solid ${i === 0 ? "rgba(255,255,255,0.4)" : "var(--ink-1)"}`,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 700,
              }}>{s.e[0]}</div>
              <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginTop: "auto" }}>{s.k}</div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", opacity: 0.7 }}>{s.e}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }
}

/* ===========================================================
   App
   =========================================================== */
function VariationsApp() {
  return (
    <div style={{ background: "#1a1a1a", minHeight: "100vh" }}>
      <div style={{
        position: "fixed", top: 16, left: 16, zIndex: 10,
        padding: "12px 16px", background: "rgba(0,0,0,0.85)", color: "#fff",
        fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
        backdropFilter: "blur(8px)",
      }}>
        다인스케치 · 섹션 베리에이션
        <div style={{ fontSize: 10, fontWeight: 400, letterSpacing: "0.04em", opacity: 0.6, marginTop: 4, textTransform: "none" }}>
          드래그·휠로 캔버스 이동/줌 · 아트보드 클릭 시 포커스 모드
        </div>
      </div>
      <a href="index.html" style={{
        position: "fixed", top: 16, right: 16, zIndex: 10,
        padding: "10px 16px", background: "var(--accent)", color: "#fff",
        fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
      }}>← 풀 사이트 보기</a>

      <DesignCanvas minScale={0.15} maxScale={2}>
        <DCSection id="hero" title="01 — Hero (4 styles)" subtitle="메인 페이지 히어로 — 인쇄기 클로즈업 / 포트폴리오 / 타이포 / 수치">
          <DCArtboard id="h-press" label="01 · 인쇄기 클로즈업 (기본)" width={900} height={760}><MiniHero variant="press" /></DCArtboard>
          <DCArtboard id="h-portfolio" label="02 · 포트폴리오 결과물" width={900} height={760}><MiniHero variant="portfolio" /></DCArtboard>
          <DCArtboard id="h-typo" label="03 · 타이포그래피 중심" width={900} height={760}><MiniHero variant="typo" /></DCArtboard>
          <DCArtboard id="h-stats" label="04 · 수치/연혁 강조" width={900} height={760}><MiniHero variant="stats" /></DCArtboard>
        </DCSection>

        <DCSection id="lang" title="02 — Headline 언어" subtitle="영문 vs 한글 헤드라인 비교">
          <DCArtboard id="lang-en" label="EN · 영문 디스플레이" width={900} height={760}><MiniHero variant="press" lang="en" /></DCArtboard>
          <DCArtboard id="lang-kr" label="KR · 한글 헤드라인" width={900} height={760}><MiniHero variant="press" lang="kr" /></DCArtboard>
        </DCSection>

        <DCSection id="theme" title="03 — Color theme · 컬러 테마" subtitle="배경 톤 4종 + 액센트 4종">
          <DCArtboard id="t-warm" label="Warm · 성수 오프화이트" width={680} height={500}>
            <ThemeStrip themeName="Warm Off-white" vars={{ "--paper-1": "#f7f5ef", "--paper-2": "#ede9df", "--ink-1": "#161616", "--ink-2": "#5e5e5e", "--hairline": "#d8d3c6" }} />
          </DCArtboard>
          <DCArtboard id="t-bright" label="Bright · 화이트" width={680} height={500}>
            <ThemeStrip themeName="Bright White" vars={{ "--paper-1": "#ffffff", "--paper-2": "#f4f4f4", "--ink-1": "#0a0a0a", "--ink-2": "#666666", "--hairline": "#e6e6e6" }} />
          </DCArtboard>
          <DCArtboard id="t-dark" label="Dark · 그레인 다크" width={680} height={500}>
            <ThemeStrip themeName="Grain Dark" vars={{ "--paper-1": "#0c0c0c", "--paper-2": "#161616", "--ink-1": "#f3f1e8", "--ink-2": "#9a9385", "--hairline": "#2a2a2a" }} />
          </DCArtboard>
          <DCArtboard id="t-midnight" label="Midnight · 네이비" width={680} height={500}>
            <ThemeStrip themeName="Midnight Navy" vars={{ "--paper-1": "#0a1422", "--paper-2": "#0f1b2c", "--ink-1": "#f3f5fa", "--ink-2": "#8696b3", "--hairline": "#1c2a40" }} accent="#39ff14" />
          </DCArtboard>
        </DCSection>

        <DCSection id="accent" title="04 — Accent 컬러" subtitle="액센트 4종으로 같은 히어로 적용 비교">
          <DCArtboard id="a-blue"  label="BMW Blue · #1c69d4 (기본)" width={680} height={520}><ThemeStrip themeName="Accent · Blue"  vars={{ "--paper-1": "#f7f5ef", "--paper-2": "#ede9df", "--ink-1": "#161616", "--ink-2": "#5e5e5e", "--hairline": "#d8d3c6" }} accent="#1c69d4" /></DCArtboard>
          <DCArtboard id="a-red"   label="Crimson · #e10600"          width={680} height={520}><ThemeStrip themeName="Accent · Red"   vars={{ "--paper-1": "#f7f5ef", "--paper-2": "#ede9df", "--ink-1": "#161616", "--ink-2": "#5e5e5e", "--hairline": "#d8d3c6" }} accent="#e10600" /></DCArtboard>
          <DCArtboard id="a-gold"  label="Gold · #c4933b"             width={680} height={520}><ThemeStrip themeName="Accent · Gold"  vars={{ "--paper-1": "#f7f5ef", "--paper-2": "#ede9df", "--ink-1": "#161616", "--ink-2": "#5e5e5e", "--hairline": "#d8d3c6" }} accent="#c4933b" /></DCArtboard>
          <DCArtboard id="a-neon"  label="Neon · #39ff14"             width={680} height={520}><ThemeStrip themeName="Accent · Neon"  vars={{ "--paper-1": "#f7f5ef", "--paper-2": "#ede9df", "--ink-1": "#161616", "--ink-2": "#5e5e5e", "--hairline": "#d8d3c6" }} accent="#39ff14" /></DCArtboard>
        </DCSection>

        <DCSection id="facility" title="05 — Facility · 장비 섹션" subtitle="장비 보여주는 3가지 방식">
          <DCArtboard id="f-grid" label="A · 그리드 (다크)" width={1100} height={780}><FacilityVariant kind="grid" /></DCArtboard>
          <DCArtboard id="f-carousel" label="B · 캐러셀" width={1100} height={780}><FacilityVariant kind="carousel" /></DCArtboard>
          <DCArtboard id="f-table" label="C · 스펙 테이블" width={1100} height={780}><FacilityVariant kind="spec-table" /></DCArtboard>
        </DCSection>

        <DCSection id="trust" title="06 — Trust 섹션" subtitle="신뢰도를 보여주는 4가지 패턴">
          <DCArtboard id="tr-stats" label="A · 수치 5종 (다크)" width={1100} height={460}><TrustVariant kind="stats-dark" /></DCArtboard>
          <DCArtboard id="tr-logos" label="B · 클라이언트 로고 월" width={1100} height={760}><TrustVariant kind="logos-grid" /></DCArtboard>
          <DCArtboard id="tr-principles" label="C · 4가지 원칙" width={1100} height={460}><TrustVariant kind="principles" /></DCArtboard>
          <DCArtboard id="tr-awards" label="D · 수상·인증" width={900} height={580}><TrustVariant kind="awards" /></DCArtboard>
        </DCSection>

        <DCSection id="portfolio" title="07 — Portfolio 섹션" subtitle="포트폴리오 보여주는 3가지 레이아웃">
          <DCArtboard id="p-grid" label="A · 그리드 (기본)" width={1100} height={700}><PortfolioVariant kind="grid" /></DCArtboard>
          <DCArtboard id="p-filter" label="B · 카테고리 필터 + 그리드" width={1100} height={700}><PortfolioVariant kind="filter" /></DCArtboard>
          <DCArtboard id="p-feature" label="C · 큐레이션 케이스 스터디" width={1100} height={600}><PortfolioVariant kind="feature" /></DCArtboard>
        </DCSection>

        <DCSection id="services" title="08 — Services 섹션" subtitle="서비스 카탈로그 3가지 형식">
          <DCArtboard id="s-tiles" label="A · 포토 타일 그리드" width={1100} height={780}><ServiceVariant kind="photo-tiles" /></DCArtboard>
          <DCArtboard id="s-list" label="B · 큰 타이포 리스트" width={1100} height={620}><ServiceVariant kind="list" /></DCArtboard>
          <DCArtboard id="s-icons" label="C · 아이콘 카드 (이미지 없이)" width={1100} height={640}><ServiceVariant kind="icon-cards" /></DCArtboard>
        </DCSection>

        <DCSection id="process" title="09 — Process 섹션" subtitle="6단계 프로세스 3가지 표현">
          <DCArtboard id="pr-h" label="A · 가로 그리드 6칸 (기본)" width={1400} height={520}><ProcessVariant kind="horizontal" /></DCArtboard>
          <DCArtboard id="pr-v" label="B · 세로 타임라인" width={800} height={760}><ProcessVariant kind="vertical" /></DCArtboard>
          <DCArtboard id="pr-d" label="C · 다이어그램 (다크)" width={1400} height={460}><ProcessVariant kind="diagram" /></DCArtboard>
        </DCSection>
      </DesignCanvas>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<VariationsApp />);
