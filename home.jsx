/* global React, Photo, Nav, Logo, SectionHead, Stat, Marquee, Footer,
          ProcessSteps, ClientWall, EquipmentCard, PortfolioCard, PHOTO, CLIENT_GROUPS */
const { useState, useRef, useEffect } = React;

/* ============================================================
   HOME — full-bleed hi-fi marketing homepage
   ============================================================ */
function HomePage({ setPage, tweaks }) {
  const heroStyle = tweaks.heroStyle || "press";
  const lang = tweaks.headlineLang || "en";

  return (
    <main>
      <Hero variant={heroStyle} lang={lang} setPage={setPage} />
      <TrustBar />
      <IntroSection />
      <ServicesGrid setPage={setPage} />
      <FacilityTeaser setPage={setPage} layout={tweaks.facilityLayout || "grid"} />
      <PortfolioTeaser setPage={setPage} />
      <ProcessSection />
      <ClientsSection />
      <AwardsStrip />
      <CtaSection setPage={setPage} />
    </main>
  );
}

/* -- HERO ------------------------------------------------------ */
function Hero({ variant = "press", lang = "en", setPage }) {
  const variants = {
    press: {
      photo: "resource/top6.jpg",
      photoLabel: "다인스케치 메인 비주얼",
      eyebrow: "PRINT · DESIGN · DELIVER",
      headEn: ["PRINT", "REIMAGINED."],
      headKr: ["인쇄, 다시 그리다."],
      sub: "기획부터 디자인, 인쇄, 후가공, 납품까지\n다인스케치는 각 분야 10년 이상의 전문가들이 한 팀으로 일합니다.",
    },
    portfolio: {
      photo: pickSample("표지디자인", 0),
      photoLabel: "다인스케치 표지 작업 샘플",
      eyebrow: "PORTFOLIO",
      headEn: ["FOR THE", "CRAFTED FEW."],
      headKr: ["섬세하게,", "정확하게."],
      sub: "정부기관, 대기업, 출판사 — 1,200+ 프로젝트가 증명한 다인스케치의 정확도와 미감.",
    },
    typo: {
      photo: PHOTO.inkCmyk,
      photoLabel: "CMYK 잉크 디테일",
      eyebrow: "TOTAL ONESTOP SERVICE",
      headEn: ["EVERY", "PRESS RUN.", "PERFECTED."],
      headKr: ["모든 인쇄,", "완벽하게."],
      sub: "컨설팅 · 기획 · 디자인 · 인쇄 · 후가공 · 납품. 다인스케치 한 팀이 끝까지 책임집니다.",
    },
    stats: {
      photo: PHOTO.designStudio,
      photoLabel: "성수동 스튜디오 외관",
      eyebrow: "EST. 2008 · SEONGSU, SEOUL",
      headEn: ["18 YEARS.", "1,200+ JOBS.", "ZERO COMPROMISE."],
      headKr: ["18년 · 1,200건 · 무타협"],
      sub: "다인스케치는 성수동에서 시작한 14년+ 편집디자인·인쇄 전문기업입니다.",
    },
  };
  const v = variants[variant] || variants.press;

  return (
    <section style={{ position: "relative", minHeight: "100vh", background: "#000", color: "#fff" }}>
      {/* Photo */}
      <div style={{ position: "absolute", inset: 0 }}>
        <Photo src={v.photo} label={v.photoLabel} ratio="auto" style={{ width: "100%", height: "100%", aspectRatio: "auto" }} />
      </div>
      {/* Overlay gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.85) 100%)",
      }} />
      {/* Right vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(90deg, rgba(0,0,0,0.55) 0%, transparent 55%)",
      }} />

      {/* Content */}
      <div className="container container--wide" style={{
        position: "relative", minHeight: "100vh",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        paddingTop: 140, paddingBottom: 80,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 1080 }}>
          <span className="eyebrow eyebrow-line fade-in" style={{ color: "rgba(255,255,255,0.85)" }}>
            {v.eyebrow}
          </span>
          <h1 className="display fade-in" style={{
            fontSize: "clamp(64px, 9vw, 168px)",
            fontWeight: 300,
            lineHeight: 0.92,
            color: "#fff",
            letterSpacing: "-0.02em",
            animationDelay: "120ms",
          }}>
            {(lang === "kr" ? v.headKr : v.headEn).map((line, i) => (
              <span key={i} style={{ display: "block" }}>{line}</span>
            ))}
          </h1>
          <p className="kr-headline fade-in" style={{
            fontSize: 18, fontWeight: 500, color: "rgba(255,255,255,0.82)",
            letterSpacing: "-0.02em", lineHeight: 1.6, maxWidth: 540,
            whiteSpace: "pre-line",
            animationDelay: "240ms",
          }}><Branded text={v.sub} dark /></p>

          <div className="fade-in" style={{ display: "flex", gap: 14, marginTop: 24, animationDelay: "360ms" }}>
            <button onClick={() => setPage("contact")} style={{
              height: 56, padding: "0 32px", background: "var(--accent)", color: "#fff",
              border: 0, fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, letterSpacing: "0.06em",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 12,
            }}>견적 요청하기 <ArrowRight /></button>
            <button onClick={() => setPage("portfolio")} style={{
              height: 56, padding: "0 32px", background: "transparent", color: "#fff",
              border: "1px solid rgba(255,255,255,0.55)",
              fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 700, letterSpacing: "0.06em",
              cursor: "pointer",
            }}>포트폴리오 보기</button>
          </div>
        </div>

        {/* Bottom-right indicator */}
        <div style={{
          position: "absolute", right: 48, bottom: 80,
          display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 16,
        }}>
          <span style={{
            fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.32em",
            color: "rgba(255,255,255,0.7)",
          }}>SCROLL</span>
          <div style={{ width: 1, height: 56, background: "rgba(255,255,255,0.4)" }} />
        </div>

        {/* Caption bottom-left */}
        <div style={{
          position: "absolute", left: 48, bottom: 32,
          display: "flex", gap: 8, alignItems: "center",
          fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.24em",
          color: "rgba(255,255,255,0.6)",
        }}>
          <span style={{ width: 6, height: 6, background: "var(--accent)" }} />
          {v.photoLabel}
        </div>
      </div>
    </section>
  );
}

function ArrowRight() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
      <path d="M0 5h12M8 1l4 4-4 4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/* -- TRUST BAR (right under hero) --------------------------- */
function TrustBar() {
  const items = [
    { v: "18", l: "YEARS", k: "업력" },
    { v: "1,200+", l: "PROJECTS", k: "프로젝트" },
    { v: "320+", l: "CLIENTS", k: "거래처" },
    { v: "99.4%", l: "ON-TIME", k: "납기 준수율" },
    { v: "10+", l: "YRS EXP.", k: "디자이너 평균 경력" },
  ];
  return (
    <section style={{ background: "#0a0a0a", color: "#fff", padding: "60px 0" }}>
      <div className="container container--wide" style={{
        display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 0,
      }}>
        {items.map((it, i) => (
          <div key={i} style={{
            padding: "0 32px",
            borderLeft: i === 0 ? "none" : "1px solid rgba(255,255,255,0.15)",
            display: "flex", flexDirection: "column", gap: 8,
          }}>
            <span className="display" style={{
              fontSize: "clamp(40px, 4vw, 64px)", fontWeight: 300, lineHeight: 1, color: "#fff",
            }}>{it.v}</span>
            <span style={{
              fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.55)",
            }}>{it.l}</span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.78)", marginTop: 2 }}>{it.k}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* -- INTRO --------------------------------------------------- */
function IntroSection() {
  return (
    <section className="section" style={{ background: "var(--paper-1)" }}>
      <div className="container container--wide" style={{
        display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 120, alignItems: "start",
      }}>
        <div className="intro-sticky" style={{ position: "sticky", top: 120 }}>
          <SectionHead
            eyebrow="TOTAL ONESTOP SERVICE"
            title="ONE TEAM,"
            kr="컨설팅에서 납품까지, 한 팀이 책임집니다."
          />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 56 }}>
          <p style={{
            fontSize: 22, lineHeight: 1.55, color: "var(--ink-1)",
            fontWeight: 500, letterSpacing: "-0.02em", margin: 0,
            textWrap: "pretty",
          }}>
            <Brand />는 2008년 성수동에서 출발해 18년째 같은 자리에서 일하고 있습니다.
            기획자, 디자이너, 인쇄·후가공 디렉터가 한 사무실에서 만나기 때문에
            <strong style={{ color: "var(--ink-1)", fontWeight: 700 }}> 일정과 품질을 흔들지 않고 </strong>
            결과물을 만들어낼 수 있습니다.
          </p>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0,
            borderTop: "1px solid var(--hairline)",
          }}>
            {[
              { t: "Excellence", k: "최소 10년+ 실무 경력", d: "10년 이상의 실무 경력을 가진 디자이너·디렉터가 직접 작업합니다." },
              { t: "Accountability", k: "단일 창구 책임제", d: "한 명의 PM이 처음부터 끝까지 커뮤니케이션을 맡습니다." },
              { t: "Onsite Press", k: "감리·교정 인쇄 상시", d: "성수동 작업장에서 색 교정과 본인쇄 감리를 직접 수행합니다." },
              { t: "On-time", k: "99.4% 납기 준수", d: "지난 3년간 1,200건 작업 중 약속된 납기를 99.4% 준수했습니다." },
            ].map((it, i) => (
              <div key={i} style={{
                padding: "32px 0 32px 32px",
                borderBottom: "1px solid var(--hairline)",
                borderRight: i % 2 === 0 ? "1px solid var(--hairline)" : "none",
                paddingRight: i % 2 === 0 ? 32 : 0,
                paddingLeft: i % 2 === 0 ? 0 : 32,
              }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em",
                  color: "var(--accent)",
                }}>{it.t}</div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", marginTop: 10 }}>{it.k}</div>
                <p style={{ margin: "10px 0 0", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.65 }}>{it.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -- SERVICES GRID -----------------------------------------
   Derived from SERVICE_CATEGORIES + real samples in /resource.
   HOME_SAMPLE_INDEX overrides the default 0th sample per category
   when a specific image works better as the home teaser. */
const HOME_SAMPLE_INDEX = {
  보고서_자료집: 3,
  브로슈어_카탈로그: 3,
  리플릿: 2,
};
const SERVICES = SERVICE_CATEGORIES.slice(0, 6).map((s) => ({
  k: s.kr, e: s.en, d: s.short,
  photo: pickSample(s.key, HOME_SAMPLE_INDEX[s.key] ?? 0),
  label: `${s.kr} 샘플`,
}));

function ServicesGrid({ setPage }) {
  return (
    <section className="section" style={{ background: "var(--paper-2)" }}>
      <div className="container container--wide">
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginBottom: 64, gap: 32, flexWrap: "wrap",
        }}>
          <SectionHead
            eyebrow="SERVICES — 01 / 06"
            title="WHAT WE MAKE."
            kr="우리가 만드는 것"
          />
          <a href="#" onClick={(e) => { e.preventDefault(); setPage("services"); }} className="btn btn--ghost-dark">
            모든 서비스 보기 →
          </a>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
          borderTop: "1px solid var(--hairline)", borderLeft: "1px solid var(--hairline)",
        }}>
          {SERVICES.map((s, i) => (
            <a key={i} href="#" onClick={(e) => { e.preventDefault(); setPage("services"); }} style={{
              display: "flex", flexDirection: "column",
              borderRight: "1px solid var(--hairline)", borderBottom: "1px solid var(--hairline)",
              background: "transparent", cursor: "pointer",
              transition: "background 200ms",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "#fff"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
            >
              <Photo src={s.photo} label={s.label} ratio="4/3" />
              <div style={{ padding: "28px 28px 32px", display: "flex", flexDirection: "column", gap: 10 }}>
                <span className="eyebrow" style={{ color: "var(--accent)" }}>{`0${i + 1}`} · {s.e}</span>
                <h3 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{s.k}</h3>
                <p style={{ margin: 0, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.65 }}>{s.d}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -- FACILITY TEASER ---------------------------------------- */
const EQUIPMENT = [
  { tag: "OFFSET PRESS", name: "Heidelberg Speedmaster XL 106", spec: "6color · max 750×1060mm · 18,000 sph", photo: PHOTO.eqHeidelbergXL106, label: "Heidelberg XL106" },
  { tag: "OFFSET PRESS", name: "KOMORI Lithrone GL40", spec: "4color · max 720×1030mm · 16,500 sph", photo: PHOTO.eqKomoriGL40, label: "KOMORI GL40" },
  { tag: "DIGITAL PRESS", name: "HP Indigo 12000", spec: "B2 size · 4,600 sheets/hr · 7color CMYKOV+", photo: PHOTO.eqHPIndigo12000, label: "HP Indigo 12000" },
  { tag: "FINISHING", name: "Müller Martini Presto Saddle", spec: "Saddle stitching · max 13,500 cycles/hr", photo: PHOTO.eqMullerMartiniPresto, label: "Müller Martini Presto" },
  { tag: "FINISHING", name: "Polar 137 XT Cutter", spec: "Hi-precision · 137cm cut · auto program", photo: PHOTO.eqPolar137XT, label: "Polar 137 XT" },
  { tag: "LARGE FORMAT", name: "Roland TrueVIS LG-540", spec: "Wide format · UV/eco-solv · 1.6m width", photo: PHOTO.eqRolandLG540, label: "Roland LG-540" },
];

function FacilityTeaser({ setPage, layout = "grid" }) {
  const [idx, setIdx] = useState(0);

  return (
    <section className="section section--dark">
      <div className="container container--wide">
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginBottom: 64, gap: 32, flexWrap: "wrap",
        }}>
          <SectionHead
            eyebrow="FACILITY · 성수동 작업장"
            title="MACHINES THAT MATTER."
            kr="좋은 결과는 좋은 장비에서"
            dark
          />
          <a href="#" onClick={(e) => { e.preventDefault(); setPage("facility"); }} className="btn btn--ghost-light">
            전체 장비 목록 →
          </a>
        </div>

        {layout === "carousel" ? (
          <FacilityCarousel idx={idx} setIdx={setIdx} />
        ) : (
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24,
          }}>
            {EQUIPMENT.map((e, i) => (
              <EquipmentCard key={i} {...e} photoLabel={e.label} dark />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function FacilityCarousel({ idx, setIdx }) {
  const e = EQUIPMENT[idx];
  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 0,
        background: "#000", border: "1px solid rgba(255,255,255,0.12)",
      }}>
        <Photo src={e.photo} label={e.label} ratio="16/10" />
        <div style={{ padding: "56px 48px", display: "flex", flexDirection: "column", gap: 24, justifyContent: "center" }}>
          <span className="eyebrow" style={{ color: "var(--accent)" }}>{e.tag}</span>
          <h3 className="display" style={{ fontSize: 40, fontWeight: 300, color: "#fff", lineHeight: 1.05 }}>
            {e.name}
          </h3>
          <p style={{
            margin: 0, fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7,
            fontFamily: "var(--font-mono), monospace", letterSpacing: "0.02em",
          }}>{e.spec}</p>
          <div style={{ display: "flex", gap: 12, marginTop: 16, alignItems: "center" }}>
            <button onClick={() => setIdx((idx - 1 + EQUIPMENT.length) % EQUIPMENT.length)} style={{
              width: 48, height: 48, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff",
              cursor: "pointer", fontFamily: "var(--font-display)", fontSize: 18,
            }}>←</button>
            <button onClick={() => setIdx((idx + 1) % EQUIPMENT.length)} style={{
              width: 48, height: 48, border: "1px solid rgba(255,255,255,0.3)", background: "transparent", color: "#fff",
              cursor: "pointer", fontFamily: "var(--font-display)", fontSize: 18,
            }}>→</button>
            <span style={{
              marginLeft: 12, fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700,
              letterSpacing: "0.18em", color: "rgba(255,255,255,0.6)",
            }}>{String(idx + 1).padStart(2, "0")} / {String(EQUIPMENT.length).padStart(2, "0")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -- PORTFOLIO TEASER --------------------------------------- */
const PORTFOLIO_SAMPLES = [
  { cat: "보고서 / 자료집",  title: "보고서 · 자료집",       client: "정부·연구기관 시리즈", year: "Recent", photo: pickSample("보고서_자료집", HOME_SAMPLE_INDEX["보고서_자료집"]),       label: "보고서 표지·내지", big: true },
  { cat: "브로슈어 / 카탈로그", title: "기업 브로슈어",       client: "코퍼레이트 시리즈",     year: "Recent", photo: pickSample("브로슈어_카탈로그", HOME_SAMPLE_INDEX["브로슈어_카탈로그"]), label: "브로슈어 펼침면" },
  { cat: "표지 디자인",       title: "단행본 표지",          client: "출판 파트너 시리즈",     year: "Recent", photo: pickSample("표지디자인", 0),                                            label: "표지 시리즈" },
  { cat: "포스터",            title: "전시·캠페인 포스터",     client: "문화·미술 기획",         year: "Recent", photo: pickSample("포스터", 0),                                                label: "포스터 시리즈" },
  { cat: "리플릿",            title: "관광·캠페인 리플릿",     client: "지자체 · 공공",          year: "Recent", photo: pickSample("리플릿", HOME_SAMPLE_INDEX["리플릿"]),                       label: "리플릿" },
  { cat: "현수막 / 배너",     title: "행사 현수막·배너",       client: "기업 · 지자체 행사",     year: "Recent", photo: pickSample("현수막_배너", 0),                                            label: "대형 출력물" },
];

function PortfolioTeaser({ setPage }) {
  return (
    <section className="section" style={{ background: "var(--paper-1)" }}>
      <div className="container container--wide">
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          marginBottom: 64, gap: 32, flexWrap: "wrap",
        }}>
          <SectionHead
            eyebrow="SELECTED WORK · 2024–25"
            title="WORK,"
            kr="최근 작업"
          />
          <a href="#" onClick={(e) => { e.preventDefault(); setPage("portfolio"); }} className="btn btn--ghost-dark">
            전체 포트폴리오 →
          </a>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "48px 24px",
        }}>
          {PORTFOLIO_SAMPLES.map((p, i) => (
            <PortfolioCard key={i} category={p.cat} title={p.title} client={p.client} year={p.year} photo={p.photo} photoLabel={p.label} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* -- PROCESS ------------------------------------------------- */
function ProcessSection() {
  return (
    <section className="section" style={{ background: "var(--paper-2)" }}>
      <div className="container container--wide">
        <div style={{ marginBottom: 64 }}>
          <SectionHead
            eyebrow="HOW WE WORK · 06 STEPS"
            title="FROM BRIEF TO DELIVERY."
            kr="문의에서 납품까지, 6단계"
          />
        </div>
        <ProcessSteps />
      </div>
    </section>
  );
}

/* -- CLIENTS ------------------------------------------------- */
function ClientsSection() {
  return (
    <section className="section" style={{ background: "var(--paper-1)" }}>
      <div className="container container--wide">
        <div style={{ marginBottom: 56 }}>
          <SectionHead
            eyebrow="CLIENTS · 320+ COMPANIES"
            title="TRUSTED BY."
            kr="정부, 대기업, 출판사 — 320곳 이상이 함께합니다"
          />
        </div>
        <ClientWall />
        <div style={{
          marginTop: 56, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16,
        }}>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {Object.keys(CLIENT_GROUPS).map((cat) => (
              <span key={cat} style={{
                fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.18em", color: "var(--ink-2)",
              }}>· {cat.toUpperCase()}</span>
            ))}
          </div>
          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>로고 표기는 협의된 거래처에 한합니다.</span>
        </div>
      </div>
    </section>
  );
}

/* -- AWARDS STRIP ------------------------------------------- */
function AwardsStrip() {
  const awards = [
    { y: "2024", t: "대한민국 디자인전람회 / 편집부문 입선" },
    { y: "2023", t: "한국출판문화상 / 본상 (북디자인)" },
    { y: "2022", t: "iF Design Award / Communication 부문" },
    { y: "2021", t: "조달청 우수 인쇄업체 지정" },
    { y: "2020", t: "ISO 9001 품질경영시스템 인증" },
    { y: "2019", t: "서울특별시 우수 중소기업 선정" },
  ];
  return (
    <section style={{ background: "#0a0a0a", color: "#fff", padding: "100px 0" }}>
      <div className="container container--wide">
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 2fr", gap: 80, alignItems: "start",
        }}>
          <SectionHead
            eyebrow="AWARDS & CERTIFICATIONS"
            title="RECOGNIZED."
            kr="수상·인증"
            dark
          />
          <div>
            {awards.map((a, i) => (
              <div key={i} style={{
                display: "flex", gap: 48, padding: "24px 0",
                borderTop: "1px solid rgba(255,255,255,0.15)",
                ...(i === awards.length - 1 ? { borderBottom: "1px solid rgba(255,255,255,0.15)" } : {}),
              }}>
                <span className="display" style={{
                  fontSize: 32, fontWeight: 300, color: "var(--accent)", minWidth: 100,
                }}>{a.y}</span>
                <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.02em", color: "#fff" }}>{a.t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* -- CTA ----------------------------------------------------- */
function CtaSection({ setPage }) {
  return (
    <section style={{ background: "var(--paper-1)" }}>
      <Marquee items={["BROCHURE", "CATALOG", "REPORT", "POSTER", "BOOK COVER", "LEAFLET", "BANNER", "WHITEPAPER"]} />
      <div className="container container--wide" style={{ padding: "120px 0" }}>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 32,
        }}>
          <span className="eyebrow eyebrow-line">READY WHEN YOU ARE</span>
          <h2 className="display" style={{
            fontSize: "clamp(56px, 7vw, 112px)", fontWeight: 300, lineHeight: 0.95, letterSpacing: "-0.01em",
            textWrap: "balance",
          }}>
            START YOUR<br />NEXT PRINT.
          </h2>
          <p className="kr-headline" style={{
            fontSize: 20, fontWeight: 500, color: "var(--ink-2)", letterSpacing: "-0.02em",
            lineHeight: 1.55, maxWidth: 520,
          }}>
            견적은 평균 1영업일 이내 회신.<br />사양이 정해지지 않은 단계라도 부담 없이 문의해주세요.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
            <button onClick={() => setPage("contact")} style={{
              height: 56, padding: "0 32px", background: "var(--accent)", color: "#fff",
              border: 0, fontSize: 14, fontWeight: 700, letterSpacing: "0.06em",
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 12,
            }}>견적 요청 보내기 <ArrowRight /></button>
            <a href="tel:02-514-2450" className="btn btn--secondary" style={{ height: 56, padding: "0 32px" }}>
              02-514-2450
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HomePage });
