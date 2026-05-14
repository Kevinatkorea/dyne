/* global React */
const { useState, useRef, useEffect, useMemo } = React;

/* ============================================================
   Photo — Unsplash with rich studio-mood fallback
   ============================================================ */
function Photo({ src, alt, label = "", className = "", style = {}, mono = true, ratio = "16/9" }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={"photo " + className}
      style={{
        position: "relative",
        overflow: "hidden",
        background: "#101010",
        aspectRatio: ratio,
        ...style,
      }}
    >
      {!failed && src && (
        <img
          src={src}
          alt={alt || label}
          onError={() => setFailed(true)}
          loading="lazy"
          className={mono ? "img-mono" : ""}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
      {(failed || !src) && <PhotoPlaceholder label={label} />}
    </div>
  );
}

function PhotoPlaceholder({ label = "" }) {
  // Deterministic seed from label so reloads stay consistent
  const seed = useMemo(() => {
    let h = 0;
    for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
    return h;
  }, [label]);
  const hue = 0; // monochrome
  const angle = (seed % 360);
  const x = 20 + (seed % 60);
  const y = 30 + ((seed >> 4) % 50);
  return (
    <div
      style={{
        position: "absolute", inset: 0,
        background: `
          radial-gradient(ellipse at ${x}% ${y}%, #2a2a2a 0%, #161616 35%, #060606 100%),
          linear-gradient(${angle}deg, rgba(255,255,255,0.04), rgba(255,255,255,0) 50%, rgba(0,0,0,0.45) 100%)
        `,
        backgroundBlendMode: "screen",
        color: "#fff",
      }}
    >
      {/* Faint scan-line texture */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0 1px, transparent 1px 4px)",
        mixBlendMode: "screen",
      }} />
      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.55) 100%)",
      }} />
      {/* Corner crosshair */}
      <Crosshair pos="topleft" />
      <Crosshair pos="bottomright" />
      {/* Label */}
      <div style={{
        position: "absolute", left: 16, bottom: 14,
        fontFamily: "var(--font-display)",
        fontSize: 10, fontWeight: 700, letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.6)",
        display: "flex", alignItems: "center", gap: 10,
      }}>
        <span style={{ display: "inline-block", width: 14, height: 1, background: "currentColor", opacity: 0.6 }} />
        {label || "Image"}
      </div>
      {/* AI / placeholder marker */}
      <div style={{
        position: "absolute", right: 14, top: 14,
        fontFamily: "var(--font-display)",
        fontSize: 9, fontWeight: 700, letterSpacing: "0.22em",
        color: "rgba(255,255,255,0.35)",
      }}>PLACEHOLDER</div>
    </div>
  );
}

function Crosshair({ pos = "topleft" }) {
  const styleMap = {
    topleft: { left: 12, top: 12 },
    topright: { right: 12, top: 12 },
    bottomleft: { left: 12, bottom: 12 },
    bottomright: { right: 12, bottom: 12 },
  };
  return (
    <svg style={{ position: "absolute", width: 10, height: 10, opacity: 0.5, ...styleMap[pos] }} viewBox="0 0 10 10">
      <line x1="0" y1="0" x2="10" y2="0" stroke="#fff" strokeWidth="1" />
      <line x1="0" y1="0" x2="0" y2="10" stroke="#fff" strokeWidth="1" />
    </svg>
  );
}

/* ============================================================
   Nav — sticky top bar, BMW-style uppercase 900 weight
   ============================================================ */
function Nav({ page, setPage, theme }) {
  const [open, setOpen] = useState(false);
  const items = [
    { id: "home", label: "HOME", kr: "홈" },
    { id: "about", label: "ABOUT", kr: "회사소개" },
    { id: "services", label: "SERVICES", kr: "서비스" },
    { id: "facility", label: "FACILITY", kr: "장비/시설" },
    { id: "portfolio", label: "PORTFOLIO", kr: "포트폴리오" },
    { id: "contact", label: "CONTACT", kr: "견적/문의" },
  ];
  const isDark = theme === "dark" || page === "home";
  const bg = isDark ? "rgba(8,8,8,0.92)" : "rgba(247,245,239,0.92)";
  const fg = isDark ? "#fff" : "#161616";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <header style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      background: bg,
      color: fg,
      backdropFilter: "blur(14px)",
      WebkitBackdropFilter: "blur(14px)",
      borderBottom: `1px solid ${border}`,
      transition: "background 200ms, color 200ms",
    }}>
      <div className="container container--wide" style={{
        display: "flex", alignItems: "center", height: 72,
      }}>
        <a href="#" onClick={(e) => { e.preventDefault(); setPage("home"); }} style={{
          display: "inline-flex", alignItems: "center", gap: 14, marginRight: 48,
        }}>
          <Logo color={fg} />
        </a>
        <nav style={{ display: "flex", gap: 0 }}>
          {items.map((it) => (
            <a key={it.id} href="#" onClick={(e) => { e.preventDefault(); setPage(it.id); window.scrollTo({ top: 0 }); }}
              style={{
                display: "inline-flex", alignItems: "center", height: 72, padding: "0 18px",
                fontFamily: "var(--font-display)",
                fontSize: 13, fontWeight: 900, letterSpacing: "0.06em",
                color: page === it.id ? "var(--accent)" : fg,
                position: "relative",
              }}
            >
              {it.label}
              {page === it.id && (
                <span style={{
                  position: "absolute", left: 18, right: 18, bottom: 18,
                  height: 2, background: "var(--accent)",
                }} />
              )}
            </a>
          ))}
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{
            fontFamily: "var(--font-display)",
            fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
            opacity: 0.7,
          }}>02-514-2450</span>
          <button
            onClick={() => setPage("contact")}
            style={{
              height: 40, padding: "0 18px", border: 0, borderRadius: 0,
              background: "var(--accent)", color: "#fff",
              fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
              cursor: "pointer",
            }}
          >
            견적 요청 →
          </button>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   Logo — wordmark + roundel placeholder
   ============================================================ */
function Logo({ color = "#161616", size = "md" }) {
  const s = size === "lg" ? 1.35 : 1;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 * s }}>
      <svg width={32 * s} height={32 * s} viewBox="0 0 32 32" style={{ display: "block" }}>
        <rect x="0.5" y="0.5" width="31" height="31" fill="none" stroke={color} strokeWidth="1" />
        <line x1="0.5" y1="0.5" x2="31.5" y2="31.5" stroke={color} strokeWidth="1" />
        <text x="16" y="20.5" textAnchor="middle" fontFamily="var(--font-display)" fontSize="11" fontWeight="900" fill={color}>D</text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 16 * s, fontWeight: 900, letterSpacing: "0.04em", color,
        }}>DYNESKETCH</span>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 9 * s, fontWeight: 700, letterSpacing: "0.32em",
          color, opacity: 0.55, marginTop: 3,
        }}>SINCE 2008 · SEOUL</span>
      </div>
    </div>
  );
}

/* ============================================================
   Eyebrow + Section Title block
   ============================================================ */
/* Brand mark — renders the company name in accent blue + bold so it
   visually leads any sentence it appears in. Use <Brand /> inline in
   JSX, or pass arbitrary strings through <Branded text="..." /> to
   highlight every occurrence automatically. */
function Brand({ dark = false }) {
  return (
    <strong style={{
      color: dark ? "#7fb1ff" : "var(--accent)",
      fontWeight: 800,
      letterSpacing: "-0.02em",
    }}>다인스케치</strong>
  );
}

function Branded({ text, dark = false }) {
  if (text == null) return null;
  const parts = String(text).split("다인스케치");
  if (parts.length === 1) return text;
  const out = [parts[0]];
  for (let i = 1; i < parts.length; i++) {
    out.push(<Brand key={i} dark={dark} />, parts[i]);
  }
  return out;
}

function SectionHead({ eyebrow, title, kr, sub, align = "left", dark = false }) {
  return (
    <div style={{
      textAlign: align,
      display: "flex", flexDirection: "column",
      alignItems: align === "center" ? "center" : "flex-start",
      gap: 24,
      maxWidth: 720,
      marginInline: align === "center" ? "auto" : 0,
    }}>
      {eyebrow && (
        <span className="eyebrow eyebrow-line" style={{ color: dark ? "rgba(255,255,255,0.6)" : "var(--ink-2)" }}>
          {eyebrow}
        </span>
      )}
      {title && (
        <h2 className="display" style={{
          fontSize: "clamp(40px, 5vw, 64px)",
          fontWeight: 300,
          color: dark ? "#fff" : "var(--ink-1)",
          textWrap: "balance",
        }}>{title}</h2>
      )}
      {kr && (
        <p className="kr-headline" style={{
          fontSize: 22, fontWeight: 700, letterSpacing: "-0.025em",
          color: dark ? "rgba(255,255,255,0.9)" : "var(--ink-1)",
          maxWidth: 640,
        }}><Branded text={kr} dark={dark} /></p>
      )}
      {sub && (
        <p style={{
          fontSize: 16, lineHeight: 1.65, color: dark ? "rgba(255,255,255,0.65)" : "var(--ink-2)",
          maxWidth: 580, margin: 0,
        }}><Branded text={sub} dark={dark} /></p>
      )}
    </div>
  );
}

/* ============================================================
   Stat — big number block
   ============================================================ */
function Stat({ value, label, sub, dark = false }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 12,
      paddingTop: 32,
      borderTop: `1px solid ${dark ? "rgba(255,255,255,0.2)" : "var(--hairline)"}`,
    }}>
      <span className="display" style={{
        fontSize: "clamp(48px, 5.5vw, 88px)",
        fontWeight: 300,
        color: dark ? "#fff" : "var(--ink-1)",
        lineHeight: 1,
      }}>{value}</span>
      <span style={{
        fontFamily: "var(--font-display)",
        fontSize: 11, fontWeight: 700, letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: dark ? "rgba(255,255,255,0.7)" : "var(--ink-2)",
      }}>{label}</span>
      {sub && <span style={{
        fontSize: 13, color: dark ? "rgba(255,255,255,0.55)" : "var(--ink-2)",
      }}>{sub}</span>}
    </div>
  );
}

/* ============================================================
   Marquee — horizontal scrolling text
   ============================================================ */
function Marquee({ items = [], dark = false, speed = 40 }) {
  const content = (
    <div style={{ display: "flex", gap: 56, paddingRight: 56, flexShrink: 0 }}>
      {items.map((it, i) => (
        <span key={i} className="display" style={{
          fontSize: 36, fontWeight: 300, color: dark ? "#fff" : "var(--ink-1)",
          whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 56,
        }}>
          {it}
          <span style={{ width: 8, height: 8, background: "var(--accent)" }} />
        </span>
      ))}
    </div>
  );
  return (
    <div style={{ overflow: "hidden", padding: "32px 0", borderBlock: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "var(--hairline)"}` }}>
      <div style={{
        display: "flex", width: "max-content",
        animation: `marquee ${speed}s linear infinite`,
      }}>
        {content}
        {content}
      </div>
    </div>
  );
}

/* ============================================================
   Footer
   ============================================================ */
function Footer({ setPage }) {
  return (
    <footer style={{ background: "#0a0a0a", color: "#fff", paddingTop: 100, paddingBottom: 48 }}>
      <div className="container container--wide">
        <div style={{
          display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 56, marginBottom: 80,
        }}>
          <div>
            <Logo color="#fff" size="lg" />
            <p style={{
              marginTop: 32, fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.6)", maxWidth: 360,
            }}>
              <Brand dark />는 2008년 설립된 14년+ 편집디자인·인쇄 전문기업.<br />
              컨설팅 · 기획 · 디자인 · 인쇄 · 납품을 하나의 팀이 책임집니다.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
              <button onClick={() => setPage("contact")} style={{
                height: 44, padding: "0 20px", background: "var(--accent)", color: "#fff",
                border: 0, fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, letterSpacing: "0.04em", cursor: "pointer",
              }}>견적 요청 →</button>
              <a href="tel:02-514-2450" style={{
                height: 44, padding: "0 20px", display: "inline-flex", alignItems: "center",
                border: "1px solid rgba(255,255,255,0.3)",
                fontSize: 13, fontWeight: 700, letterSpacing: "0.04em",
              }}>02-514-2450</a>
            </div>
          </div>

          <FooterCol title="SERVICES" items={[
            "표지디자인", "브로슈어/카탈로그", "리플릿", "포스터",
            "보고서/자료집", "현수막/배너", "기타 인쇄물",
          ]} />
          <FooterCol title="COMPANY" items={[
            "회사 소개", "제작 프로세스", "보유 장비", "포트폴리오", "수상 및 인증",
          ]} />
          <FooterCol title="CONTACT" items={[
            "design2@dynes.co.kr",
            "TEL  02-514-2450",
            "FAX  02-465-2450",
            "서울 성동구 성수이로18길 31",
            "풍림테크원 401, 407호",
          ]} />
        </div>

        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-end",
          paddingTop: 32, borderTop: "1px solid rgba(255,255,255,0.12)",
          flexWrap: "wrap", gap: 16,
        }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", lineHeight: 1.8 }}>
            주식회사 <Brand dark /> · 대표 전명호 · 사업자등록번호 220-87-73258 · 통신판매업 서울성동-20804<br />
            © 2026 DYNESKETCH Co., Ltd. All rights reserved.
          </div>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 10, fontWeight: 700, letterSpacing: "0.32em",
            color: "rgba(255,255,255,0.4)",
          }}>SEOUL · SEONGSU</div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, items, mono = false }) {
  return (
    <div>
      <h4 style={{
        fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
        color: "rgba(255,255,255,0.5)", margin: "0 0 24px",
      }}>{title}</h4>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {items.map((it, i) => (
          <li key={i} style={{
            fontSize: 13, color: "rgba(255,255,255,0.82)",
            fontFamily: mono ? "var(--font-mono), var(--font-body)" : "var(--font-body)",
            letterSpacing: mono ? "0.02em" : "0",
          }}>{it}</li>
        ))}
      </ul>
    </div>
  );
}

/* ============================================================
   Process steps
   ============================================================ */
function ProcessSteps({ dark = false, compact = false }) {
  const steps = [
    { n: "01", t: "Brief", k: "기획/컨설팅", d: "고객사 요구를 듣고 핵심 메시지·예산·납기를 정의합니다." },
    { n: "02", t: "Plan", k: "기획·구성안", d: "콘텐츠 구성, 분량, 페이지·사이즈·후가공 사양을 설계합니다." },
    { n: "03", t: "Design", k: "디자인 시안", d: "최소 10년 실무 경력의 디자이너가 2–3안의 시안을 제시합니다." },
    { n: "04", t: "Proof", k: "교정·감리", d: "색 교정 인쇄와 감리를 통해 결과물의 색·재질을 사전 검증합니다." },
    { n: "05", t: "Print", k: "본인쇄", d: "옵셋·디지털·실사 각 분야 전문 장비로 인쇄를 진행합니다." },
    { n: "06", t: "Deliver", k: "후가공 납품", d: "재단·제본·코팅·박 후가공 후 약속한 납기에 납품합니다." },
  ];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(6, 1fr)",
      borderTop: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "var(--hairline)"}`,
      borderLeft: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "var(--hairline)"}`,
    }}>
      {steps.map((s) => (
        <div key={s.n} style={{
          padding: compact ? "28px 24px" : "40px 28px",
          borderRight: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "var(--hairline)"}`,
          borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "var(--hairline)"}`,
          display: "flex", flexDirection: "column", gap: 16, minHeight: compact ? 160 : 260,
          color: dark ? "#fff" : "var(--ink-1)",
        }}>
          <div style={{
            fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
            color: dark ? "rgba(255,255,255,0.55)" : "var(--ink-2)",
          }}>STEP {s.n}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span className="display" style={{
              fontSize: 28, fontWeight: 300, color: dark ? "#fff" : "var(--ink-1)",
            }}>{s.t}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>{s.k}</span>
          </div>
          {!compact && (
            <p style={{
              margin: 0, fontSize: 13, lineHeight: 1.65,
              color: dark ? "rgba(255,255,255,0.62)" : "var(--ink-2)",
            }}>{s.d}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   Client logo wall — text-based "logos" for placeholder
   ============================================================ */
const CLIENT_GROUPS = {
  "정부 · 공공기관": [
    "서울특별시", "문화체육관광부", "과학기술정보통신부", "한국콘텐츠진흥원",
    "한국관광공사", "한국전력공사", "국토교통부", "보건복지부",
  ],
  "대기업 · 금융": [
    "현대자동차", "삼성SDS", "LG화학", "SK하이닉스", "포스코",
    "KB금융", "신한금융", "우리은행",
  ],
  "출판 · 미디어": [
    "민음사", "창비", "문학동네", "북이십일",
    "한겨레", "조선일보", "JTBC", "EBS",
  ],
  "교육 · 연구": [
    "서울대학교", "KAIST", "포스텍", "고려대학교",
    "이화여자대학교", "KDI", "STEPI", "산업연구원",
  ],
};

function ClientWall({ dark = false }) {
  const all = Object.values(CLIENT_GROUPS).flat();
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(8, 1fr)",
      borderTop: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "var(--hairline)"}`,
      borderLeft: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "var(--hairline)"}`,
    }}>
      {all.map((name, i) => (
        <div key={i} style={{
          aspectRatio: "1.6/1",
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRight: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "var(--hairline)"}`,
          borderBottom: `1px solid ${dark ? "rgba(255,255,255,0.15)" : "var(--hairline)"}`,
          padding: 16,
          color: dark ? "rgba(255,255,255,0.78)" : "var(--ink-1)",
          fontFamily: "var(--font-body)",
          fontSize: 13, fontWeight: 600, letterSpacing: "-0.01em",
          textAlign: "center",
          transition: "background 200ms, color 200ms",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "var(--accent)"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = dark ? "rgba(255,255,255,0.78)" : "var(--ink-1)"; }}
        >{name}</div>
      ))}
    </div>
  );
}

/* ============================================================
   Equipment grid card
   ============================================================ */
function EquipmentCard({ tag, name, spec, photo, photoLabel, dark = false }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column",
      background: dark ? "#0a0a0a" : "#fff",
      border: `1px solid ${dark ? "rgba(255,255,255,0.12)" : "var(--hairline)"}`,
      color: dark ? "#fff" : "var(--ink-1)",
    }}>
      <Photo src={photo} label={photoLabel} ratio="4/3" />
      <div style={{ padding: "24px 24px 28px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{
          fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.22em",
          color: "var(--accent)",
        }}>{tag}</div>
        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>{name}</div>
        <div style={{
          fontSize: 12, color: dark ? "rgba(255,255,255,0.6)" : "var(--ink-2)", lineHeight: 1.6,
          fontFamily: "var(--font-mono), monospace", letterSpacing: "0.02em",
        }}>{spec}</div>
      </div>
    </div>
  );
}

/* ============================================================
   Portfolio sample card
   ============================================================ */
function PortfolioCard({ category, title, client, photo, photoLabel, year, big = false }) {
  return (
    <a href="#" onClick={(e) => e.preventDefault()} style={{
      display: "flex", flexDirection: "column", gap: 16,
      gridColumn: big ? "span 2" : "span 1",
      cursor: "pointer",
    }}>
      <Photo src={photo} label={photoLabel} ratio={big ? "16/10" : "4/5"} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span className="eyebrow" style={{ color: "var(--accent)" }}>{category}</span>
          <h3 style={{
            margin: 0, fontSize: big ? 26 : 18, fontWeight: 700, letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}>{title}</h3>
          <span style={{ fontSize: 13, color: "var(--ink-2)" }}>{client}</span>
        </div>
        <span style={{
          fontFamily: "var(--font-display)", fontSize: 11, fontWeight: 700, letterSpacing: "0.18em",
          color: "var(--ink-2)",
        }}>{year}</span>
      </div>
    </a>
  );
}

/* ============================================================
   Data — Unsplash printing/industrial photo set (curated)
   ============================================================ */
const PHOTO = {
  /* Real equipment photos sourced from manufacturer / reseller sites,
     downloaded into resource/equipment/ for stable serving. */
  eqHeidelbergXL106:    "resource/equipment/heidelberg-xl106.jpg",
  eqKomoriGL40:         "resource/equipment/komori-gl40.jpg",
  eqHPIndigo12000:      "resource/equipment/hp-indigo-12000.png",
  eqKonicaC14000:       "resource/equipment/konica-c14000.jpg",
  eqMullerMartiniPresto:"resource/equipment/muller-martini-presto.jpg",
  eqHorizonBQ470:       "resource/equipment/horizon-bq470.png",
  eqPolar137XT:         "resource/equipment/polar-137xt.jpg",
  eqStahlfolderTH56:    "resource/equipment/stahlfolder-th56.jpg",
  eqRolandLG540:        "resource/equipment/roland-lg540.jpg",

  pressCloseup: "https://images.unsplash.com/photo-1586282391129-76a6df230234?w=1800&auto=format&fit=crop&q=80",
  pressRollers: "https://images.unsplash.com/photo-1611348586804-61bf6c080437?w=1800&auto=format&fit=crop&q=80",
  inkCmyk: "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?w=1600&auto=format&fit=crop&q=80",
  paperStack: "https://images.unsplash.com/photo-1532153975070-2e9ab71f1b14?w=1600&auto=format&fit=crop&q=80",
  bookPages: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=1600&auto=format&fit=crop&q=80",
  designStudio: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1800&auto=format&fit=crop&q=80",
  printSamples: "https://images.unsplash.com/photo-1568667256549-094345857637?w=1600&auto=format&fit=crop&q=80",
  prepress: "https://images.unsplash.com/photo-1521185496955-15097b20c5fe?w=1600&auto=format&fit=crop&q=80",
  hands: "https://images.unsplash.com/photo-1542435503-956c469947f6?w=1600&auto=format&fit=crop&q=80",
  brochure: "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=1600&auto=format&fit=crop&q=80",
  catalog: "https://images.unsplash.com/photo-1503694978374-8a2fa686963a?w=1600&auto=format&fit=crop&q=80",
  poster: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1600&auto=format&fit=crop&q=80",
  report: "https://images.unsplash.com/photo-1568667256549-094345857637?w=1600&auto=format&fit=crop&q=80",
  leaflet: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1600&auto=format&fit=crop&q=80",
  studio: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1800&auto=format&fit=crop&q=80",
  workshop: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1800&auto=format&fit=crop&q=80",
  bookbind: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=1600&auto=format&fit=crop&q=80",
  cutter: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1600&auto=format&fit=crop&q=80",
  team: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=1800&auto=format&fit=crop&q=80",
  building: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1800&auto=format&fit=crop&q=80",
};

/* ============================================================
   Real assets — dynesketch portfolio samples in /resource
   ============================================================ */
const range = (start, count, ext, prefix) =>
  Array.from({ length: count }, (_, i) =>
    `resource/${prefix}/${String(i + start).padStart(3, "0")}.${ext}`);

/* Drop items at the given (0-based) indices entirely. Used to remove
   paper-spec reference cards from category views (year archive is
   sourced from a different folder, so it's unaffected). */
const excludeAt = (arr, indices) => {
  const set = new Set(indices);
  return arr.filter((_, i) => !set.has(i));
};

/* Skip files that won't decode (broken PNGs etc.). */
const EXCLUDE = new Set([
  "resource/2022_포트폴리오/015.png", // 33rd file in 연도별 전체 view — broken
]);
const skip = (arr) => arr.filter((s) => !EXCLUDE.has(s));

const RESOURCE = {
  표지디자인:        range(2, 27, "jpg", "표지디자인"),
  브로슈어_카탈로그: excludeAt(range(2, 10, "png", "브로슈어_카탈로그"), [0, 1, 2, 3, 4, 5]),
  리플릿:           excludeAt(range(2, 9,  "png", "리플릿"),           [0, 1, 2, 3, 4]),
  포스터:           excludeAt(range(2, 4,  "png", "포스터"),           [0, 1]),
  보고서_자료집:     excludeAt(range(2, 7,  "png", "보고서_자료집"),     [0, 1, 2, 3]),
  현수막_배너:       range(2, 7,  "png", "현수막_배너"),
  기타인쇄물:        range(2, 8,  "png", "기타인쇄물"),
  "2023":           skip(range(1, 18, "png", "2023_포트폴리오")),
  "2022":           skip(range(1, 45, "png", "2022_포트폴리오")),
  "2021":           skip(range(1, 63, "png", "2021_포트폴리오")),
};

/* Service taxonomy — drives Services grid and Portfolio category filter. */
const SERVICE_CATEGORIES = [
  { key: "표지디자인",        kr: "표지 디자인",       en: "Cover Design",        cat: "EDITORIAL",
    d: "단행본·교과서·전집 표지의 컨셉, 타이포그래피, 후가공을 다인스케치가 한 번에 설계합니다. 시리즈물의 일관된 시각 시스템을 강점으로 합니다.",
    d2: "수십 권 단위 시리즈 작업에서도 첫 권의 컨셉이 끝까지 흐트러지지 않도록 마스터 그리드와 타입 시스템을 함께 정리해 드립니다. 박·형압·에폭시·홀로그램 등 특수 후가공은 사전 목업으로 검증해 인쇄 사고 위험을 차단합니다.",
    short: "단행본·교과서·전집 표지의 컨셉과 타이포그래피를 설계합니다.",
    deliverables: ["컨셉 보드", "표지 시안 2–3안", "본문 제목 페이지", "박/형압/에폭시 후가공"] },
  { key: "브로슈어_카탈로그", kr: "브로슈어 / 카탈로그", en: "Brochure & Catalog",  cat: "CORPORATE",
    d: "기업·기관용 브로슈어와 제품 카탈로그를 다인스케치가 시스템화된 그리드로 설계합니다. 영문·다국어 동시 운영에 최적화되어 있습니다.",
    d2: "한국어·영문·중문·일문 동시 발간에 익숙하며, 본문 텍스트량의 변동에도 그리드가 무너지지 않도록 마스터 페이지로 설계합니다. 분기·연간 단위로 반복 발간하는 카탈로그는 기존 인디자인 데이터를 재활용해 작업 기간을 30–50% 단축합니다.",
    short: "기업·기관용 브로슈어와 제품 카탈로그를 일관된 시스템으로 디자인합니다.",
    deliverables: ["콘텐츠 정리", "그리드 시스템", "다국어 버전", "옵셋 본인쇄"] },
  { key: "리플릿",            kr: "리플릿",            en: "Leaflet",             cat: "CAMPAIGN",
    d: "행사·캠페인·관광 리플릿을 접지·재단·후가공까지 최적화합니다. 도무송 가공이 필요한 특수 형태도 가능합니다.",
    d2: "2단·3단·4단 접지부터 도무송 가공이 필요한 비정형 형태까지, 인쇄 후 손으로 만지는 단계의 사용성을 우선해 설계합니다. 박람회·행사 현장에서 손상 없이 견딜 수 있도록 종이 결과 코팅 옵션을 함께 검토해 드립니다.",
    short: "행사·캠페인·관광 리플릿을 접지·후가공까지 최적화합니다.",
    deliverables: ["접지 설계", "도무송 가공", "대량 인쇄", "지역 배송"] },
  { key: "포스터",            kr: "포스터",            en: "Poster",              cat: "CAMPAIGN",
    d: "전시·문화행사·캠페인 포스터의 비주얼 시스템을 구축합니다. A1·B1 대형부터 시리즈물까지 동일 톤으로 진행합니다.",
    d2: "한 점의 포스터가 아닌 시리즈로 운영되는 캠페인의 경우, 색상·타이포·여백을 시스템화해 추가 제작 시에도 일관성을 유지합니다. 옥외 부착용은 자외선 내성 잉크, 실내 게시용은 무광 코팅 등 환경에 맞는 출력 옵션을 제안합니다.",
    short: "전시·문화행사·캠페인 포스터의 비주얼 시스템을 구축합니다.",
    deliverables: ["키 비주얼", "시리즈 변형", "대형 옵셋", "후가공 옵션"] },
  { key: "보고서_자료집",      kr: "보고서 / 자료집",    en: "Report & Whitepaper", cat: "RESEARCH",
    d: "정부·연구기관 보고서의 데이터 시각화와 편집 그리드를 설계합니다. 다인스케치는 200–500p 분량의 대형 보고서 경험이 풍부합니다.",
    d2: "복잡한 통계 데이터를 한눈에 읽히는 그래프와 표로 재구성해 정보 전달력을 높입니다. 500p 이상의 대형 보고서도 색인·각주·참고문헌 시스템을 정리해 본문 가독성과 학술적 신뢰성을 동시에 확보합니다.",
    short: "정부·연구기관 보고서의 데이터 시각화와 편집 그리드를 설계합니다.",
    deliverables: ["인포그래픽", "표·그래프 시스템", "무선 제본", "성동구 직접 납품"] },
  { key: "현수막_배너",        kr: "현수막 / 배너",      en: "Banner & Signage",    cat: "SIGNAGE",
    d: "대형 실사 출력·X배너·롤업·시트지까지 다인스케치가 동일 톤으로 제작합니다. 행사 당일 긴급 제작도 가능합니다.",
    d2: "행사 당일 추가 발주가 발생하는 경우, 디자인·출력·시공을 24시간 내에 처리할 수 있는 긴급 라인을 운영합니다. 옥외 대형 현수막은 봉바느질·아일렛·줄 설치까지 마감해 현장에서 바로 게시할 수 있도록 준비해 드립니다.",
    short: "대형 실사 출력·X배너·롤업까지 동일 톤으로 제작합니다.",
    deliverables: ["대형 실사 출력", "X배너 / 롤업", "시트지 / 부착물", "긴급 24h 제작"] },
  { key: "기타인쇄물",         kr: "기타 인쇄물",        en: "Custom Print",        cat: "ETC",
    d: "명함, 봉투, 레터헤드, 패키지 박스, 굿즈류 등 일상 인쇄물도 다인스케치의 같은 기준으로 제작합니다.",
    d2: "100매 단위 소량 명함부터 1,000부 미만 굿즈류까지 디지털 인쇄로 비용 부담을 낮춰 제작합니다. 자사 작업장 내에서 디자인·교정·인쇄·후가공이 모두 진행되어 짧은 납기에도 품질 편차가 없습니다.",
    short: "명함·봉투·패키지·굿즈 등 일상 인쇄물.",
    deliverables: ["명함 / 봉투 / 레터헤드", "패키지 박스", "굿즈 / 노벨티", "소량 디지털 인쇄"] },
];

/* Sample helper: deterministic pick from a folder, wraps on overflow. */
function pickSample(catKey, idx = 0) {
  const arr = RESOURCE[catKey] || [];
  return arr.length ? arr[idx % arr.length] : null;
}

/* ============================================================
   Export everything to window so other JSX files can use it
   ============================================================ */
Object.assign(window, {
  Photo, PhotoPlaceholder, Nav, Logo, SectionHead, Stat, Marquee, Footer,
  ProcessSteps, ClientWall, EquipmentCard, PortfolioCard,
  Brand, Branded,
  PHOTO, CLIENT_GROUPS,
  RESOURCE, SERVICE_CATEGORIES, pickSample,
});
