/* global React, Photo, SectionHead, Stat, ProcessSteps, ClientWall,
          EquipmentCard, PortfolioCard, PHOTO, CLIENT_GROUPS */
const { useState: useS_p } = React;

/* ============================================================
   ABOUT
   ============================================================ */
function AboutPage() {
  return (
    <main>
      <PageHero
        eyebrow="ABOUT · 회사 소개"
        en="WE ARE A PRINT HOUSE."
        kr="다인스케치는 18년째 같은 자리에서 인쇄를 만듭니다."
        photo="resource/top1.jpg"
        photoLabel="성수동 스튜디오 외관"
      />

      {/* Story */}
      <section className="section" style={{ background: "var(--paper-1)" }}>
        <div className="container container--wide" style={{
          display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 120,
        }}>
          <div className="intro-sticky" style={{ position: "sticky", top: 120, alignSelf: "start" }}>
            <SectionHead
              eyebrow="OUR STORY"
              title="SINCE 2008,"
              kr="성수동에서."
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            <p style={{
              fontSize: 22, lineHeight: 1.55, color: "var(--ink-1)",
              fontWeight: 500, letterSpacing: "-0.02em", margin: 0, textWrap: "pretty",
            }}>
              2008년 7월, 성수동 풍림테크원에서 4명의 디자이너가 <Brand />를 시작했습니다.
              <strong style={{ fontWeight: 700 }}> "기획자, 디자이너, 인쇄 디렉터가 같은 공간에서 일하면
              결과물이 달라진다"</strong>는 단순한 가설이 출발점이었습니다.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--ink-2)", margin: 0, textWrap: "pretty" }}>
              지금은 14명의 인력이 한 사무실에서 일하며, 누적 1,200건 이상의 프로젝트를
              마무리했습니다. 정부기관과 공공기관, 대기업, 출판사가 <Brand />를
              찾는 이유는 우리가 일하는 방식이 단순하기 때문입니다.
              담당자 한 명이 처음부터 끝까지 책임지고, 외주 없이 직접 디자인하고,
              우리 작업장에서 직접 감리하고, 약속한 날짜에 직접 납품합니다.
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: "var(--ink-2)", margin: 0, textWrap: "pretty" }}>
              인쇄는 컴퓨터 모니터에서 끝나지 않습니다. 종이의 질감, 잉크의 농도,
              제본의 강도 같은 것들이 모니터를 떠나서야 비로소 결정됩니다.
              그 마지막 한 단계까지 <Brand />가 함께합니다.
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section style={{ background: "#0a0a0a", color: "#fff", padding: "120px 0" }}>
        <div className="container container--wide">
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32,
          }}>
            <Stat value="2008" label="FOUNDED" sub="설립연도" dark />
            <Stat value="18" label="YEARS" sub="업력" dark />
            <Stat value="14" label="STAFF" sub="전문 인력" dark />
            <Stat value="1,200+" label="JOBS COMPLETED" sub="누적 프로젝트" dark />
          </div>
        </div>
      </section>

      {/* Team values */}
      <section className="section" style={{ background: "var(--paper-2)" }}>
        <div className="container container--wide">
          <div style={{ marginBottom: 64 }}>
            <SectionHead
              eyebrow="HOW WE WORK"
              title="OUR PRINCIPLES."
              kr="다인스케치가 일하는 4가지 원칙"
            />
          </div>

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
            borderTop: "1px solid var(--hairline)", borderLeft: "1px solid var(--hairline)",
          }}>
            {[
              { n: "01", t: "Onsite First", k: "현장에서 결정합니다", d: "감리·교정은 우리 작업장에서 직접. 색차를 모니터가 아닌 종이로 확인합니다." },
              { n: "02", t: "Single Window", k: "단일 창구 운영", d: "한 PM이 처음부터 납품까지. 담당자를 옮겨다닐 일이 없습니다." },
              { n: "03", t: "10+ Year Hands", k: "최소 10년 경력", d: "모든 디자이너·디렉터가 10년 이상의 실무 경험을 보유합니다." },
              { n: "04", t: "Long Calendar", k: "1년 단위 계약", d: "정부·공공·대기업과 1년 단위 연간 계약으로 안정적으로 일합니다." },
            ].map((v, i) => (
              <div key={i} style={{
                padding: "40px 28px",
                borderRight: "1px solid var(--hairline)",
                borderBottom: "1px solid var(--hairline)",
                background: "var(--paper-1)",
                display: "flex", flexDirection: "column", gap: 16, minHeight: 280,
              }}>
                <div style={{
                  fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
                  color: "var(--accent)",
                }}>PRINCIPLE {v.n}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span className="display" style={{ fontSize: 26, fontWeight: 300 }}>{v.t}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.02em" }}>{v.k}</span>
                </div>
                <p style={{
                  margin: "auto 0 0", fontSize: 13, lineHeight: 1.7, color: "var(--ink-2)",
                }}>{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section" style={{ background: "var(--paper-1)" }}>
        <div className="container container--wide">
          <div style={{ marginBottom: 64 }}>
            <SectionHead
              eyebrow="TIMELINE"
              title="A SHORT HISTORY."
              kr="다인스케치 연혁"
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 80 }}>
            <div>
              <Photo src="resource/building.jpg" label="성수동 다인스케치 본사" ratio="3/4" />
            </div>
            <div>
              {[
                { y: "2026", t: "성수동 본사 확장 · 인쇄 작업장 통합" },
                { y: "2024", t: "대한민국 디자인전람회 편집부문 입선" },
                { y: "2023", t: "누적 프로젝트 1,000건 돌파 · 한국출판문화상 본상" },
                { y: "2022", t: "iF Design Award Communication 부문 수상" },
                { y: "2021", t: "조달청 우수 인쇄업체 지정" },
                { y: "2020", t: "ISO 9001 품질경영시스템 인증" },
                { y: "2018", t: "직원 10명 돌파 · 성수동 풍림테크원 본사 이전" },
                { y: "2015", t: "정부·공공기관 연간 계약 본격화" },
                { y: "2008", t: "주식회사 다인스케치 설립 (대표 전명호)" },
              ].map((e, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "100px 1fr",
                  gap: 32, padding: "20px 0",
                  borderTop: "1px solid var(--hairline)",
                  ...(i === 8 ? { borderBottom: "1px solid var(--hairline)" } : {}),
                }}>
                  <span className="display" style={{
                    fontSize: 24, fontWeight: 300, color: "var(--accent)",
                  }}>{e.y}</span>
                  <span style={{ fontSize: 16, color: "var(--ink-1)", lineHeight: 1.55, paddingTop: 4 }}>{e.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   SERVICES (full)
   ============================================================ */
function ServicesPage({ setPage }) {
  /* Per-category override: which index of the first 4 samples is used
     as the BIG photo. The remaining images become the thumbnail strip.
     브로슈어/카탈로그·리플릿의 첫 샘플은 금박/은박 클로즈업이라 큰 사진에 어울리지 않아
     실제 카탈로그·리플릿 작업물(2번째)을 큰 사진으로 올린다. */
  const BIG_INDEX = { 브로슈어_카탈로그: 1, 리플릿: 1 };
  const SERVICES_FULL = SERVICE_CATEGORIES.map((s) => {
    const pool = (RESOURCE[s.key] || []).slice(0, 4);
    const bi = BIG_INDEX[s.key] ?? 0;
    const big = pool[bi] || pool[0];
    const thumbs = pool.filter((_, i) => i !== bi);
    return {
      key: s.key, cat: s.cat, k: s.kr, e: s.en, d: s.d, d2: s.d2,
      photo: big,
      label: s.kr,
      samples: [big, ...thumbs], // existing render slices [1..4] for thumbs
      deliverables: s.deliverables,
    };
  });

  return (
    <main>
      <PageHero
        eyebrow="SERVICES · 서비스"
        en="WHAT WE MAKE."
        kr="다인스케치는 7가지 카테고리의 인쇄물을 만듭니다."
        photo="resource/top2.jpg"
        photoLabel="서비스 카테고리"
      />

      <section className="section" style={{ background: "var(--paper-1)" }}>
        <div className="container container--wide" style={{ display: "flex", flexDirection: "column", gap: 100 }}>
          {SERVICES_FULL.map((s, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: i % 2 === 0 ? "minmax(0, 600px) 1fr" : "1fr minmax(0, 600px)",
              gap: 80, alignItems: "start",
            }}>
              <div className="service-photo" style={{ order: i % 2 === 0 ? 0 : 1,
                display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
                {s.key === "포스터" ? (
                  /* 포스터는 원본이 세로형이라 fixed 500px 회색 박스 안에 contain으로 표시 — 잘리지 않음 */
                  <div style={{
                    height: 500, width: "100%",
                    background: "var(--paper-2)", border: "1px solid var(--hairline)",
                    display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
                  }}>
                    <img src={s.photo} alt={s.label} loading="lazy" className="img-mono"
                      style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }} />
                  </div>
                ) : (
                  <Photo src={s.photo} label={s.label} ratio="16/10" />
                )}
                {s.key !== "포스터" && s.samples && s.samples.length > 1 && (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
                    {s.samples.slice(1, 4).map((src, j) => (
                      <Photo key={j} src={src} label={`${s.label} ${j + 2}`} ratio="1/1" />
                    ))}
                  </div>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                <span className="eyebrow eyebrow-line" style={{ color: "var(--accent)" }}>
                  {`0${i + 1}`} · {s.cat}
                </span>
                <h3 className="display" style={{
                  fontSize: "clamp(40px, 4vw, 64px)", fontWeight: 300, lineHeight: 1, letterSpacing: "-0.01em",
                }}>{s.e}</h3>
                <h4 className="kr-headline" style={{ fontSize: 28, fontWeight: 700 }}>{s.k}</h4>
                <p style={{ margin: 0, fontSize: 16, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 520 }}><Branded text={s.d} /></p>
                {s.d2 && (
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "var(--ink-2)", maxWidth: 520 }}><Branded text={s.d2} /></p>
                )}
                <ul style={{
                  listStyle: "none", padding: 0, margin: 0,
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
                  borderTop: "1px solid var(--hairline)", paddingTop: 24, marginTop: 12,
                }}>
                  {s.deliverables.map((d, j) => (
                    <li key={j} style={{
                      fontSize: 13, color: "var(--ink-1)",
                      display: "flex", alignItems: "center", gap: 12,
                    }}>
                      <span style={{ width: 6, height: 6, background: "var(--accent)" }} />
                      {d}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setPage("contact")} className="btn" style={{ alignSelf: "flex-start", marginTop: 16 }}>
                  이 서비스로 견적 받기 →
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

/* ============================================================
   FACILITY (장비 풀 페이지)
   ============================================================ */
function FacilityPage({ setPage }) {
  const EQ = [
    { tag: "OFFSET PRESS · 옵셋 인쇄", name: "Heidelberg Speedmaster XL 106", spec: "6color · max 750×1060mm · 18,000 sph · LE UV", photo: PHOTO.eqHeidelbergXL106, label: "Heidelberg XL106" },
    { tag: "OFFSET PRESS · 옵셋 인쇄", name: "KOMORI Lithrone GL40", spec: "4color · max 720×1030mm · 16,500 sph", photo: PHOTO.eqKomoriGL40, label: "KOMORI GL40" },
    { tag: "DIGITAL PRESS · 디지털 인쇄", name: "HP Indigo 12000", spec: "B2 size · 4,600 sheets/hr · 7color CMYKOV+", photo: PHOTO.eqHPIndigo12000, label: "HP Indigo 12000" },
    { tag: "DIGITAL PRESS · 디지털 인쇄", name: "Konica Minolta AccurioPress C14000", spec: "SRA3 · 140 ppm · auto duplex", photo: PHOTO.eqKonicaC14000, label: "AccurioPress C14000" },
    { tag: "BINDING · 제본", name: "Müller Martini Presto Saddle", spec: "Saddle stitching · 13,500 cycles/hr", photo: PHOTO.eqMullerMartiniPresto, label: "Müller Martini Presto" },
    { tag: "BINDING · 제본", name: "Horizon BQ-470 Perfect Binder", spec: "Perfect bind · PUR · 1,350 cycles/hr", photo: PHOTO.eqHorizonBQ470, label: "Horizon BQ-470" },
    { tag: "FINISHING · 후가공", name: "Polar 137 XT Cutter", spec: "Hi-precision · 137cm cut · auto program", photo: PHOTO.eqPolar137XT, label: "Polar 137 XT" },
    { tag: "FINISHING · 후가공", name: "Heidelberg Stahlfolder TH 56", spec: "Folding · max 56cm · combi-fold", photo: PHOTO.eqStahlfolderTH56, label: "Stahlfolder TH 56" },
    { tag: "LARGE FORMAT · 실사 출력", name: "Roland TrueVIS LG-540", spec: "UV/eco-solv · 1.6m width · 9 colors", photo: PHOTO.eqRolandLG540, label: "Roland LG-540" },
  ];

  return (
    <main>
      <PageHero
        eyebrow="FACILITY · 보유 장비"
        en="ON-SITE PRESS."
        kr="모든 인쇄와 후가공을 작업장에서 직접 진행합니다."
        photo="resource/top3.jpg"
        photoLabel="성수동 작업장 내부"
      />

      {/* Intro + stat */}
      <section className="section section--dark">
        <div className="container container--wide" style={{
          display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 80, alignItems: "start",
        }}>
          <SectionHead
            eyebrow="WHY ON-SITE"
            title="WE OWN THE PRESS."
            kr="외주로 빠지는 단계가 없습니다."
            dark
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <p style={{
              fontSize: 18, lineHeight: 1.7, color: "rgba(255,255,255,0.85)", margin: 0,
            }}>
              인쇄소를 가지고 있다는 건 단순한 인프라가 아닙니다.
              디자이너가 5분 만에 감리장에 내려갈 수 있고, 색이 마음에
              들지 않으면 그 자리에서 다시 돌릴 수 있다는 의미입니다.
            </p>
            <p style={{
              fontSize: 16, lineHeight: 1.7, color: "rgba(255,255,255,0.65)", margin: 0,
            }}>
              <Brand dark />는 옵셋·디지털·후가공 핵심 장비를 자체 보유하고 있으며,
              대형 실사 출력 외 모든 공정을 작업장에서 직접 진행합니다.
            </p>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 24,
            }}>
              <Stat value="12" label="MACHINES" dark />
              <Stat value="450㎡" label="WORKSHOP" dark />
              <Stat value="24h" label="RUSH JOB" dark />
            </div>
          </div>
        </div>
      </section>

      {/* Equipment grid */}
      <section className="section" style={{ background: "var(--paper-2)" }}>
        <div className="container container--wide">
          <div style={{ marginBottom: 64 }}>
            <SectionHead
              eyebrow={`EQUIPMENT · ${EQ.length} MACHINES`}
              title="MACHINES."
              kr="장비 목록"
            />
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24,
          }}>
            {EQ.map((e, i) => (
              <EquipmentCard key={i} {...e} photoLabel={e.label} />
            ))}
          </div>
          <div style={{
            marginTop: 48, padding: 24, background: "rgba(28,105,212,0.06)",
            border: "1px solid var(--hairline)", borderLeft: "3px solid var(--accent)",
            fontSize: 14, color: "var(--ink-2)", lineHeight: 1.7,
          }}>
            <strong style={{ color: "var(--ink-1)" }}>※ 본 페이지의 장비 정보는 플레이스홀더입니다.</strong>
            &nbsp;실제 보유 장비의 모델명·스펙·사진을 전달해주시면 그대로 교체해드립니다.
          </div>
        </div>
      </section>

      {/* CTA */}
      <CtaStrip setPage={setPage} />
    </main>
  );
}

/* ============================================================
   PORTFOLIO — real samples from /resource
   Two views:
   1) BY CATEGORY  — 7 service folders (표지·브로슈어·리플릿·포스터·보고서·현수막·기타)
   2) BY YEAR      — 2021/2022/2023 yearly archive folders
   ============================================================ */
/* Tile shows the image at its natural aspect ratio (no left/right cropping).
   Frame is a neutral box that fills any leftover space. Click opens lightbox. */
const PortfolioTile = ({ src, category, n, total, onOpen }) => (
  <button type="button" onClick={onOpen} style={{
    display: "flex", flexDirection: "column", gap: 12, cursor: "zoom-in",
    background: "transparent", border: 0, padding: 0, textAlign: "left",
    font: "inherit", color: "inherit",
  }}>
    <div style={{
      background: "var(--paper-2)",
      border: "1px solid var(--hairline)",
      display: "flex", alignItems: "center", justifyContent: "center",
      overflow: "hidden", width: "100%", maxWidth: 289, aspectRatio: "1 / 1",
    }}>
      <img src={src} alt={`${category} ${n}/${total}`} loading="lazy"
        className="img-mono"
        style={{ width: "100%", height: "100%",
          objectFit: "cover", objectPosition: "center", display: "block" }} />
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
      <span className="eyebrow" style={{ color: "var(--accent)" }}>{category}</span>
      <span style={{
        fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.18em",
        color: "var(--ink-2)",
      }}>{String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</span>
    </div>
  </button>
);

/* Modal lightbox — backdrop click / Esc to close, ←/→ to navigate. */
function Lightbox({ items, index, mode, onClose, onIndex }) {
  const cur = items[index];
  if (!cur) return null;
  const label = mode === "category" ? cur.catLabel : cur.year;

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft")  onIndex((index - 1 + items.length) % items.length);
      else if (e.key === "ArrowRight") onIndex((index + 1) % items.length);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, items.length, onClose, onIndex]);

  const Arrow = ({ side, onClick }) => (
    <button onClick={(e) => { e.stopPropagation(); onClick(); }}
      style={{
        position: "absolute", top: "50%", [side]: 24, transform: "translateY(-50%)",
        width: 56, height: 56, borderRadius: 28, border: "none",
        background: "rgba(255,255,255,0.1)", color: "#fff",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(8px)", zIndex: 2, transition: "background 150ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.22)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
        strokeWidth="1.8" strokeLinecap="round">
        <path d={side === "left" ? "M12 4l-6 6 6 6" : "M8 4l6 6-6 6"} />
      </svg>
    </button>
  );

  return ReactDOM.createPortal(
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(10,10,10,0.88)", backdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "80px 80px 56px",
    }}>
      {/* close */}
      <button onClick={(e) => { e.stopPropagation(); onClose(); }}
        style={{
          position: "absolute", top: 20, right: 24, width: 40, height: 40, borderRadius: 20,
          border: "none", background: "transparent", color: "rgba(255,255,255,0.8)",
          fontSize: 22, lineHeight: 1, cursor: "pointer", transition: "background 150ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>×</button>

      {/* image */}
      <div onClick={(e) => e.stopPropagation()} style={{
        flex: 1, minHeight: 0, width: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <img src={cur.src} alt={`${label} ${cur.n}/${cur.total}`}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain",
            boxShadow: "0 20px 80px rgba(0,0,0,0.5)" }} />
      </div>

      {/* caption */}
      <div onClick={(e) => e.stopPropagation()} style={{
        marginTop: 24, display: "flex", alignItems: "center", gap: 24,
        color: "rgba(255,255,255,0.85)", fontSize: 13,
      }}>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
          color: "var(--accent)",
        }}>{label}</span>
        <span style={{
          fontFamily: "var(--font-display)", fontWeight: 700, letterSpacing: "0.18em",
          color: "rgba(255,255,255,0.6)",
        }}>
          {String(cur.n).padStart(2, "0")} / {String(cur.total).padStart(2, "0")}
        </span>
        <span style={{ marginLeft: 12, opacity: 0.5, fontSize: 12 }}>
          {index + 1} / {items.length} · ←/→ 키로 이동
        </span>
      </div>

      <Arrow side="left"  onClick={() => onIndex((index - 1 + items.length) % items.length)} />
      <Arrow side="right" onClick={() => onIndex((index + 1) % items.length)} />
    </div>,
    document.body,
  );
}

const CATEGORY_TABS = [
  { key: "전체", label: "전체" },
  ...SERVICE_CATEGORIES.map((s) => ({ key: s.key, label: s.kr })),
];

const YEAR_TABS = [
  { key: "전체", label: "전체" },
  { key: "2023", label: "2023" },
  { key: "2022", label: "2022" },
  { key: "2021", label: "2021" },
];

function PortfolioPage({ setPage }) {
  const [mode, setMode] = useS_p("year"); // 'year' | 'category'
  const [cat, setCat] = useS_p("전체");
  const [year, setYear] = useS_p("전체");
  const [lightbox, setLightbox] = useS_p(null); // null | { index }

  // Build category dataset by flattening service folders.
  const categoryItems = React.useMemo(() => {
    const out = [];
    SERVICE_CATEGORIES.forEach((s) => {
      (RESOURCE[s.key] || []).forEach((src, idx) => {
        out.push({ src, catKey: s.key, catLabel: s.kr, n: idx + 1, total: RESOURCE[s.key].length });
      });
    });
    return out;
  }, []);

  // Build yearly dataset by flattening yearly folders.
  const yearItems = React.useMemo(() => {
    const out = [];
    ["2023", "2022", "2021"].forEach((y) => {
      (RESOURCE[y] || []).forEach((src, idx) => {
        out.push({ src, year: y, n: idx + 1, total: RESOURCE[y].length });
      });
    });
    return out;
  }, []);

  const filteredByCat = cat === "전체" ? categoryItems : categoryItems.filter((p) => p.catKey === cat);
  const filteredByYear = year === "전체" ? yearItems : yearItems.filter((p) => p.year === year);

  const view = mode === "category" ? filteredByCat : filteredByYear;
  const total = mode === "category" ? categoryItems.length : yearItems.length;

  React.useEffect(() => { setLightbox(null); }, [mode, cat, year]);

  return (
    <main>
      <PageHero
        eyebrow="PORTFOLIO · 작업 사례"
        en="SELECTED WORK."
        kr="2008년부터 1,200건 이상 — 그중 일부를 소개합니다."
        photo="resource/top4.jpg"
        photoLabel="포트폴리오 표지"
      />

      <section className="section" style={{ background: "var(--paper-1)" }}>
        <div className="container container--wide">
        <div className="portfolio-filters">
          {/* Mode toggle: 카테고리별 / 연도별 */}
          <div style={{
            display: "flex", gap: 0, marginBottom: 32,
            borderBottom: "1px solid var(--hairline)",
          }}>
            {[
              { k: "year",     label: "연도별",     en: "BY YEAR" },
              { k: "category", label: "카테고리별", en: "BY CATEGORY" },
            ].map((tab) => (
              <button key={tab.k} onClick={() => setMode(tab.k)} style={{
                padding: "20px 32px 18px", border: 0, borderRadius: 0, background: "transparent",
                cursor: "pointer", display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start",
                borderBottom: mode === tab.k ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: -1,
                color: mode === tab.k ? "var(--ink-1)" : "var(--ink-2)",
              }}>
                <span style={{
                  fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.22em",
                }}>{tab.en}</span>
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Filters */}
          <div style={{
            display: "flex", flexWrap: "wrap", gap: 32,
            padding: "0 0 32px",
            borderBottom: "1px solid var(--hairline)",
            marginBottom: 56, alignItems: "center",
          }}>
            {mode === "category" ? (
              <FilterRow label="CATEGORY" items={CATEGORY_TABS.map((t) => t.label)}
                active={CATEGORY_TABS.find((t) => t.key === cat).label}
                onChange={(v) => setCat(CATEGORY_TABS.find((t) => t.label === v).key)} />
            ) : (
              <FilterRow label="YEAR" items={YEAR_TABS.map((t) => t.label)}
                active={year}
                onChange={setYear} />
            )}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12,
              fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 700, letterSpacing: "0.18em",
              color: "var(--ink-2)",
            }}>
              SHOWING <span style={{ color: "var(--accent)" }}>{String(view.length).padStart(3, "0")}</span> / {String(total).padStart(3, "0")}
            </div>
          </div>
        </div>{/* /.portfolio-filters */}

          <div style={{
            display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "40px 16px",
          }}>
            {view.map((p, i) =>
              mode === "category" ? (
                <PortfolioTile key={p.src} src={p.src} category={p.catLabel} n={p.n} total={p.total}
                  onOpen={() => setLightbox({ index: i })} />
              ) : (
                <PortfolioTile key={p.src} src={p.src} category={`${p.year}`} n={p.n} total={p.total}
                  onOpen={() => setLightbox({ index: i })} />
              )
            )}
          </div>

          {lightbox && (
            <Lightbox
              items={view}
              index={lightbox.index}
              mode={mode}
              onClose={() => setLightbox(null)}
              onIndex={(i) => setLightbox({ index: i })}
            />
          )}

          {view.length === 0 && (
            <div style={{ padding: "80px 0", textAlign: "center", color: "var(--ink-2)", fontSize: 16 }}>
              해당 조건의 작업이 없습니다.
            </div>
          )}
        </div>
      </section>

      <CtaStrip setPage={setPage} />
    </main>
  );
}

function FilterRow({ label, items, active, onChange }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <span style={{
        fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
        color: "var(--ink-2)",
      }}>{label}</span>
      <div style={{ display: "flex", gap: 4 }}>
        {items.map((it) => (
          <button key={it} onClick={() => onChange(it)} style={{
            height: 36, padding: "0 16px", border: 0, borderRadius: 0,
            background: active === it ? "var(--ink-1)" : "transparent",
            color: active === it ? "#fff" : "var(--ink-1)",
            fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em",
            cursor: "pointer",
          }}>{it}</button>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   CONTACT — quote request form
   ============================================================ */
function ContactPage() {
  const [form, setForm] = useS_p({
    company: "", name: "", phone: "", email: "",
    service: "브로슈어/카탈로그", quantity: "", deadline: "", budget: "",
    message: "",
  });
  const [submitted, setSubmitted] = useS_p(false);
  const upd = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <main>
      <PageHero
        eyebrow="CONTACT · 견적/문의"
        en="LET'S START."
        kr="견적은 평균 1영업일 이내 회신해드립니다."
        photo="resource/top5.jpg"
        photoLabel="견적 요청"
        compact
      />

      <section className="section" style={{ background: "var(--paper-1)" }}>
        <div className="container container--wide" style={{
          display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 80, alignItems: "start",
        }}>
          {/* Left: contact info */}
          <div className="intro-sticky" style={{ position: "sticky", top: 120, display: "flex", flexDirection: "column", gap: 40 }}>
            <SectionHead
              eyebrow="DIRECT CHANNELS"
              title="REACH US."
              kr="바로 연락하기"
            />

            <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
              <ContactRow label="TELEPHONE" value="02-514-2450" href="tel:02-514-2450" />
              <ContactRow label="FAX" value="02-465-2450" />
              <ContactRow label="EMAIL" value="design2@dynes.co.kr" href="mailto:design2@dynes.co.kr" />
              <ContactRow label="HOURS" value="평일 09:30 – 18:30" />
              <ContactRow
                label="ADDRESS"
                value={`서울특별시 성동구 성수이로18길 31\n풍림테크원 401호 · 407호`}
              />
            </div>

            <div style={{ marginTop: 16 }}>
              <Photo src={PHOTO.building} label="다인스케치 본사 위치" ratio="4/3" />
              <div style={{
                marginTop: 12, fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.22em", color: "var(--ink-2)",
              }}>SEONGSU · SEOUL · 04787</div>
            </div>
          </div>

          {/* Right: form */}
          <div>
            {submitted ? (
              <div style={{
                padding: 64, background: "#fff", border: "1px solid var(--hairline)",
                display: "flex", flexDirection: "column", gap: 16, textAlign: "center",
              }}>
                <span className="eyebrow" style={{ color: "var(--accent)" }}>SUBMITTED</span>
                <h3 className="display" style={{ fontSize: 48, fontWeight: 300 }}>THANK YOU.</h3>
                <p className="kr-headline" style={{ fontSize: 18, fontWeight: 500, color: "var(--ink-2)" }}>
                  견적 요청이 접수되었습니다.<br />1영업일 이내에 회신드리겠습니다.
                </p>
                <button onClick={() => setSubmitted(false)} className="btn btn--secondary" style={{ marginTop: 24, alignSelf: "center" }}>
                  새 견적 요청 보내기
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span className="eyebrow eyebrow-line" style={{ color: "var(--accent)" }}>QUOTE REQUEST FORM</span>
                  <h3 className="display" style={{ fontSize: 40, fontWeight: 300, lineHeight: 1.05 }}>
                    TELL US YOUR PROJECT.
                  </h3>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                  <div className="field"><label>회사 / 기관명 *</label>
                    <input required value={form.company} onChange={upd("company")} placeholder="예: 한국문화예술위원회" />
                  </div>
                  <div className="field"><label>담당자 성함 *</label>
                    <input required value={form.name} onChange={upd("name")} placeholder="홍길동" />
                  </div>
                  <div className="field"><label>연락처 *</label>
                    <input required value={form.phone} onChange={upd("phone")} placeholder="010-0000-0000" />
                  </div>
                  <div className="field"><label>이메일 *</label>
                    <input required type="email" value={form.email} onChange={upd("email")} placeholder="contact@company.co.kr" />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
                  <div className="field"><label>서비스 종류 *</label>
                    <select value={form.service} onChange={upd("service")}>
                      <option>표지 디자인</option>
                      <option>브로슈어/카탈로그</option>
                      <option>리플릿</option>
                      <option>포스터</option>
                      <option>보고서/자료집</option>
                      <option>현수막/배너</option>
                      <option>기타 인쇄물</option>
                    </select>
                  </div>
                  <div className="field"><label>예상 수량</label>
                    <input value={form.quantity} onChange={upd("quantity")} placeholder="예: 1,000부" />
                  </div>
                  <div className="field"><label>희망 납기</label>
                    <input value={form.deadline} onChange={upd("deadline")} placeholder="YYYY-MM-DD" />
                  </div>
                </div>

                <div className="field"><label>예산 범위 (선택)</label>
                  <select value={form.budget} onChange={upd("budget")}>
                    <option value="">선택하지 않음</option>
                    <option>~ 300만원</option>
                    <option>300 – 1,000만원</option>
                    <option>1,000 – 3,000만원</option>
                    <option>3,000만원 이상</option>
                    <option>연간 계약 검토</option>
                  </select>
                </div>

                <div className="field"><label>프로젝트 상세 *</label>
                  <textarea required value={form.message} onChange={upd("message")}
                    placeholder="페이지 수, 사이즈, 후가공, 참고 사항 등 자유롭게 작성해주세요." />
                </div>

                <div style={{
                  padding: 16, fontSize: 12, color: "var(--ink-2)", background: "var(--paper-2)",
                  border: "1px solid var(--hairline)",
                }}>
                  ※ 견적은 영업일 기준 24시간 이내에 회신드립니다. 입력하신 정보는 견적 회신 외 다른 목적으로 사용되지 않습니다.
                </div>

                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button type="submit" className="btn" style={{ height: 56, padding: "0 32px" }}>
                    견적 요청 보내기 →
                  </button>
                  <span style={{ fontSize: 13, color: "var(--ink-2)" }}>
                    또는 <a href="mailto:design2@dynes.co.kr" style={{ color: "var(--accent)", textDecoration: "underline" }}>이메일로 직접</a>
                  </span>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function ContactRow({ label, value, href }) {
  const inner = (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{
        fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
        color: "var(--ink-2)",
      }}>{label}</span>
      <span style={{
        fontSize: 17, color: "var(--ink-1)", fontWeight: 500, whiteSpace: "pre-line", lineHeight: 1.5,
      }}>{value}</span>
    </div>
  );
  return (
    <div style={{ paddingTop: 20, borderTop: "1px solid var(--hairline)" }}>
      {href ? <a href={href} style={{ display: "block", textDecoration: "none" }}>{inner}</a> : inner}
    </div>
  );
}

/* ============================================================
   Shared sub-page bits
   ============================================================ */
function PageHero({ eyebrow, en, kr, photo, photoLabel, compact = false }) {
  return (
    <section style={{
      position: "relative", color: "#fff", background: "#000",
      minHeight: compact ? 460 : 640,
      paddingTop: 140, paddingBottom: 80,
    }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Photo src={photo} label={photoLabel} ratio="auto" style={{ width: "100%", height: "100%", aspectRatio: "auto" }} />
      </div>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.85) 100%)",
      }} />
      <div className="container container--wide" style={{
        position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end",
        gap: 24, minHeight: compact ? 320 : 500,
      }}>
        <span className="eyebrow eyebrow-line" style={{ color: "rgba(255,255,255,0.8)" }}>{eyebrow}</span>
        <h1 className="display" style={{
          fontSize: "clamp(34px, 5vw, 78px)", fontWeight: 300, lineHeight: 0.95, color: "#fff",
          letterSpacing: "-0.02em",
        }}>{en}</h1>
        <p className="kr-headline" style={{
          fontSize: 20, fontWeight: 500, color: "rgba(255,255,255,0.85)", maxWidth: 700,
          letterSpacing: "-0.02em", lineHeight: 1.55,
        }}><Branded text={kr} dark /></p>
      </div>
    </section>
  );
}

function CtaStrip({ setPage }) {
  return (
    <section style={{ background: "var(--paper-2)", padding: "80px 0" }}>
      <div className="container container--wide" style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 32, flexWrap: "wrap",
      }}>
        <h3 className="display" style={{
          fontSize: "clamp(32px, 4vw, 56px)", fontWeight: 300, lineHeight: 1, letterSpacing: "-0.01em",
        }}>READY TO START?</h3>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setPage("contact")} className="btn" style={{ height: 56, padding: "0 28px" }}>
            견적 요청하기 →
          </button>
          <a href="tel:02-514-2450" className="btn btn--secondary" style={{ height: 56, padding: "0 28px" }}>
            02-514-2450
          </a>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { AboutPage, ServicesPage, FacilityPage, PortfolioPage, ContactPage });
