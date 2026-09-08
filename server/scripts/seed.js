/* =====================================================================
   seed.js — 최초 1회 초기 데이터 주입
     node scripts/seed.js          비어 있는 테이블만 채운다 (안전, 반복 실행 OK)
     node scripts/seed.js --force  포트폴리오를 레포 파일 기준으로 재동기화

   포트폴리오는 components.jsx 의 RESOURCE 매니페스트와 동일한 규칙으로
   resource/ 폴더를 훑어 만든다. 즉 시드 직후 공개 사이트 모습이 현재와 같다.
   ===================================================================== */
import fs from "node:fs";
import path from "node:path";
import { REPO_ROOT, config } from "../src/config.js";
import { q, q1, exec, applySchema, closePool } from "../src/db.js";
import { hashPassword } from "../src/lib/auth.js";

const force = process.argv.includes("--force");
const log = (...a) => console.log("  ", ...a);

/* ---- components.jsx 의 매니페스트 규칙을 그대로 옮긴 것 ------------- */
const range = (start, count, ext, prefix) =>
  Array.from({ length: count }, (_, i) =>
    `resource/${prefix}/${String(i + start).padStart(3, "0")}.${ext}`);

const excludeAt = (arr, idx) => {
  const set = new Set(idx);
  return arr.filter((_, i) => !set.has(i));
};

/* 디코딩 안 되는 깨진 파일 */
const BROKEN = new Set([
  "resource/2022_포트폴리오/015.png",
  "resource/2021_포트폴리오/028.png",
]);
const skip = (arr) => arr.filter((s) => !BROKEN.has(s));

const MANIFEST = {
  category: {
    표지디자인:        range(2, 27, "jpg", "표지디자인"),
    브로슈어_카탈로그: excludeAt(range(2, 10, "png", "브로슈어_카탈로그"), [0, 1, 2, 3, 4, 5]),
    리플릿:            excludeAt(range(2, 9,  "png", "리플릿"),            [0, 1, 2, 3, 4]),
    포스터:            excludeAt(range(2, 4,  "png", "포스터"),            [0, 1]),
    보고서_자료집:     excludeAt(range(2, 7,  "png", "보고서_자료집"),      [0, 1, 2, 3]),
    현수막_배너:       range(2, 7,  "png", "현수막_배너"),
    기타인쇄물:        range(2, 8,  "png", "기타인쇄물"),
  },
  year: {
    2023: skip(range(1, 18, "png", "2023_포트폴리오")),
    2022: skip(range(1, 45, "png", "2022_포트폴리오")),
    2021: skip(range(1, 63, "png", "2021_포트폴리오")),
  },
};

const exists = (rel) => fs.existsSync(path.join(REPO_ROOT, rel));

/* ---- 서비스 (components.jsx SERVICE_CATEGORIES) -------------------- */
const SERVICES = [
  { key: "표지디자인", kr: "표지 디자인", en: "Cover Design", cat: "EDITORIAL",
    short: "단행본·교과서·전집 표지의 컨셉과 타이포그래피를 설계합니다.",
    d: "단행본·교과서·전집 표지의 컨셉, 타이포그래피, 후가공을 다인스케치가 한 번에 설계합니다. 시리즈물의 일관된 시각 시스템을 강점으로 합니다.",
    d2: "수십 권 단위 시리즈 작업에서도 첫 권의 컨셉이 끝까지 흐트러지지 않도록 마스터 그리드와 타입 시스템을 함께 정리해 드립니다. 박·형압·에폭시·홀로그램 등 특수 후가공은 사전 목업으로 검증해 인쇄 사고 위험을 차단합니다.",
    deliverables: ["컨셉 보드", "표지 시안 2–3안", "본문 제목 페이지", "박/형압/에폭시 후가공"] },
  { key: "브로슈어_카탈로그", kr: "브로슈어 / 카탈로그", en: "Brochure & Catalog", cat: "CORPORATE",
    short: "기업·기관용 브로슈어와 제품 카탈로그를 일관된 시스템으로 디자인합니다.",
    d: "기업·기관용 브로슈어와 제품 카탈로그를 다인스케치가 시스템화된 그리드로 설계합니다. 영문·다국어 동시 운영에 최적화되어 있습니다.",
    d2: "한국어·영문·중문·일문 동시 발간에 익숙하며, 본문 텍스트량의 변동에도 그리드가 무너지지 않도록 마스터 페이지로 설계합니다. 분기·연간 단위로 반복 발간하는 카탈로그는 기존 인디자인 데이터를 재활용해 작업 기간을 30–50% 단축합니다.",
    deliverables: ["콘텐츠 정리", "그리드 시스템", "다국어 버전", "옵셋 본인쇄"] },
  { key: "리플릿", kr: "리플릿", en: "Leaflet", cat: "CAMPAIGN",
    short: "행사·캠페인·관광 리플릿을 접지·후가공까지 최적화합니다.",
    d: "행사·캠페인·관광 리플릿을 접지·재단·후가공까지 최적화합니다. 도무송 가공이 필요한 특수 형태도 가능합니다.",
    d2: "2단·3단·4단 접지부터 도무송 가공이 필요한 비정형 형태까지, 인쇄 후 손으로 만지는 단계의 사용성을 우선해 설계합니다. 박람회·행사 현장에서 손상 없이 견딜 수 있도록 종이 결과 코팅 옵션을 함께 검토해 드립니다.",
    deliverables: ["접지 설계", "도무송 가공", "대량 인쇄", "지역 배송"] },
  { key: "포스터", kr: "포스터", en: "Poster", cat: "CAMPAIGN",
    short: "전시·문화행사·캠페인 포스터의 비주얼 시스템을 구축합니다.",
    d: "전시·문화행사·캠페인 포스터의 비주얼 시스템을 구축합니다. A1·B1 대형부터 시리즈물까지 동일 톤으로 진행합니다.",
    d2: "한 점의 포스터가 아닌 시리즈로 운영되는 캠페인의 경우, 색상·타이포·여백을 시스템화해 추가 제작 시에도 일관성을 유지합니다. 옥외 부착용은 자외선 내성 잉크, 실내 게시용은 무광 코팅 등 환경에 맞는 출력 옵션을 제안합니다.",
    deliverables: ["키 비주얼", "시리즈 변형", "대형 옵셋", "후가공 옵션"] },
  { key: "보고서_자료집", kr: "보고서 / 자료집", en: "Report & Whitepaper", cat: "RESEARCH",
    short: "정부·연구기관 보고서의 데이터 시각화와 편집 그리드를 설계합니다.",
    d: "정부·연구기관 보고서의 데이터 시각화와 편집 그리드를 설계합니다. 다인스케치는 200–500p 분량의 대형 보고서 경험이 풍부합니다.",
    d2: "복잡한 통계 데이터를 한눈에 읽히는 그래프와 표로 재구성해 정보 전달력을 높입니다. 500p 이상의 대형 보고서도 색인·각주·참고문헌 시스템을 정리해 본문 가독성과 학술적 신뢰성을 동시에 확보합니다.",
    deliverables: ["인포그래픽", "표·그래프 시스템", "무선 제본", "성동구 직접 납품"] },
  { key: "현수막_배너", kr: "현수막 / 배너", en: "Banner & Signage", cat: "SIGNAGE",
    short: "대형 실사 출력·X배너·롤업까지 동일 톤으로 제작합니다.",
    d: "대형 실사 출력·X배너·롤업·시트지까지 다인스케치가 동일 톤으로 제작합니다. 행사 당일 긴급 제작도 가능합니다.",
    d2: "행사 당일 추가 발주가 발생하는 경우, 디자인·출력·시공을 24시간 내에 처리할 수 있는 긴급 라인을 운영합니다. 옥외 대형 현수막은 봉바느질·아일렛·줄 설치까지 마감해 현장에서 바로 게시할 수 있도록 준비해 드립니다.",
    deliverables: ["대형 실사 출력", "X배너 / 롤업", "시트지 / 부착물", "긴급 24h 제작"] },
  { key: "기타인쇄물", kr: "기타 인쇄물", en: "Custom Print", cat: "ETC",
    short: "명함·봉투·패키지·굿즈 등 일상 인쇄물.",
    d: "명함, 봉투, 레터헤드, 패키지 박스, 굿즈류 등 일상 인쇄물도 다인스케치의 같은 기준으로 제작합니다.",
    d2: "100매 단위 소량 명함부터 1,000부 미만 굿즈류까지 디지털 인쇄로 비용 부담을 낮춰 제작합니다. 자사 작업장 내에서 디자인·교정·인쇄·후가공이 모두 진행되어 짧은 납기에도 품질 편차가 없습니다.",
    deliverables: ["명함 / 봉투 / 레터헤드", "패키지 박스", "굿즈 / 노벨티", "소량 디지털 인쇄"] },
];

const EQUIPMENT = [
  { name: "Heidelberg Speedmaster XL 106", maker: "Heidelberg", model: "Speedmaster XL 106",
    spec: "6color · max 750×1060mm · 18,000 sph", description: "OFFSET PRESS",
    src: "resource/equipment/heidelberg-xl106.jpg" },
  { name: "KOMORI Lithrone GL40", maker: "KOMORI", model: "Lithrone GL40",
    spec: "4color · max 720×1030mm · 16,500 sph", description: "OFFSET PRESS",
    src: "resource/equipment/komori-gl40.jpg" },
  { name: "HP Indigo 12000", maker: "HP", model: "Indigo 12000",
    spec: "B2 size · 4,600 sheets/hr · 7color CMYKOV+", description: "DIGITAL PRESS",
    src: "resource/equipment/hp-indigo-12000.png" },
  { name: "Konica Minolta AccurioPress C14000", maker: "Konica Minolta", model: "AccurioPress C14000",
    spec: "140 ppm · 최대 900mm 배너 인쇄", description: "DIGITAL PRESS",
    src: "resource/equipment/konica-c14000.jpg" },
  { name: "Müller Martini Presto Saddle", maker: "Müller Martini", model: "Presto Saddle",
    spec: "Saddle stitching · max 13,500 cycles/hr", description: "FINISHING",
    src: "resource/equipment/muller-martini-presto.jpg" },
  { name: "Horizon BQ-470", maker: "Horizon", model: "BQ-470",
    spec: "무선제본 · 1,350 cycles/hr", description: "FINISHING",
    src: "resource/equipment/horizon-bq470.png" },
  { name: "Polar 137 XT Cutter", maker: "Polar", model: "137 XT",
    spec: "Hi-precision · 137cm cut · auto program", description: "FINISHING",
    src: "resource/equipment/polar-137xt.jpg" },
  { name: "Stahlfolder TH 56", maker: "Heidelberg", model: "Stahlfolder TH 56",
    spec: "접지기 · max 560mm", description: "FINISHING",
    src: "resource/equipment/stahlfolder-th56.jpg" },
  { name: "Roland TrueVIS LG-540", maker: "Roland", model: "TrueVIS LG-540",
    spec: "Wide format · UV/eco-solv · 1.6m width", description: "LARGE FORMAT",
    src: "resource/equipment/roland-lg540.jpg" },
];

const HISTORY = [
  { year: "2026", title: "성수동 본사 확장 · 인쇄 작업장 통합" },
  { year: "2024", title: "대한민국 디자인전람회 편집부문 입선" },
  { year: "2023", title: "누적 프로젝트 1,000건 돌파 · 한국출판문화상 본상" },
  { year: "2022", title: "iF Design Award Communication 부문 수상" },
  { year: "2021", title: "조달청 우수 인쇄업체 지정" },
  { year: "2020", title: "ISO 9001 품질경영시스템 인증" },
  { year: "2018", title: "직원 10명 돌파 · 성수동 풍림테크원 본사 이전" },
  { year: "2015", title: "정부·공공기관 연간 계약 본격화" },
  { year: "2008", title: "주식회사 다인스케치 설립 (대표 전명호)" },
];

const AWARDS = [
  { year: "2024", title: "대한민국 디자인전람회 / 편집부문 입선", org: "한국디자인진흥원" },
  { year: "2023", title: "한국출판문화상 / 본상 (북디자인)", org: "한국일보" },
  { year: "2022", title: "iF Design Award / Communication 부문", org: "iF International Forum Design" },
  { year: "2021", title: "조달청 우수 인쇄업체 지정", org: "조달청" },
  { year: "2020", title: "ISO 9001 품질경영시스템 인증", org: "한국표준협회" },
  { year: "2019", title: "서울특별시 우수 중소기업 선정", org: "서울특별시" },
];

const CLIENT_GROUPS = {
  "정부 · 공공기관": ["서울특별시", "문화체육관광부", "과학기술정보통신부", "한국콘텐츠진흥원",
    "한국관광공사", "한국전력공사", "국토교통부", "보건복지부"],
  "대기업 · 금융": ["현대자동차", "삼성SDS", "LG화학", "SK하이닉스", "포스코",
    "KB금융", "신한금융", "우리은행"],
  "출판 · 미디어": ["민음사", "창비", "문학동네", "북이십일",
    "한겨레", "조선일보", "JTBC", "EBS"],
  "교육 · 연구": ["서울대학교", "KAIST", "포스텍", "고려대학교",
    "이화여자대학교", "KDI", "STEPI", "산업연구원"],
};

/* 홈 히어로 press variant 가 쓰는 4장 + 페이지별 상단 배경 */
const HERO = [
  { page: "home", src: "resource/top6.jpg" },
  { page: "home", src: "resource/top11.jpg" },
  { page: "home", src: "resource/top7.jpg" },
  { page: "home", src: "resource/top12.jpg" },
  { page: "about", src: "resource/top1.jpg" },
  { page: "services", src: "resource/top2.jpg" },
  { page: "facility", src: "resource/top3.jpg" },
  { page: "portfolio", src: "resource/top4.jpg" },
  { page: "contact", src: "resource/top5.jpg" },
];

async function isEmpty(table) {
  const r = await q1(`SELECT COUNT(*) AS n FROM \`${table}\``);
  return r.n === 0;
}

async function seedPortfolio() {
  const empty = await isEmpty("portfolio_items");
  if (!empty && !force) { log("포트폴리오 — 이미 데이터 있음, 건너뜀 (--force 로 재동기화)"); return; }

  const existing = new Set((await q("SELECT src FROM portfolio_items")).map((r) => r.src));
  let order = 0;
  let added = 0;
  let missing = 0;

  const insert = async (src, category, year) => {
    if (existing.has(src)) { order++; return; }
    if (!exists(src)) { missing++; return; }
    await exec(
      `INSERT INTO portfolio_items (src, category, year, sort_order, visible, media_id)
       VALUES (?, ?, ?, ?, 1, NULL)`,
      [src, category, year, order++]
    );
    added++;
  };

  for (const [cat, list] of Object.entries(MANIFEST.category)) {
    for (const src of list) await insert(src, cat, null);
  }
  for (const [year, list] of Object.entries(MANIFEST.year)) {
    for (const src of list) await insert(src, null, year);
  }
  log(`포트폴리오 — ${added}건 추가${missing ? `, 파일 없음 ${missing}건 건너뜀` : ""}`);
}

async function seedTable(table, rows, build) {
  if (!(await isEmpty(table))) { log(`${table} — 이미 데이터 있음, 건너뜀`); return; }
  let i = 0;
  for (const row of rows) {
    const data = build(row, i++);
    const keys = Object.keys(data);
    await exec(
      `INSERT INTO \`${table}\` (${keys.map((k) => `\`${k}\``).join(",")})
       VALUES (${keys.map(() => "?").join(",")})`,
      keys.map((k) => data[k])
    );
  }
  log(`${table} — ${rows.length}건 생성`);
}

async function seedAdmin() {
  if (!(await isEmpty("users"))) { log("users — 이미 계정 있음, 건너뜀"); return; }
  await exec(
    "INSERT INTO users (email, name, role, password_hash) VALUES (?, ?, 'super', ?)",
    [config.seed.email, config.seed.name, await hashPassword(config.seed.password)]
  );
  log(`관리자 계정 생성 — ${config.seed.email} / ${config.seed.password}`);
  log("※ 로그인 후 즉시 비밀번호를 변경하세요.");
}

async function main() {
  console.log("\n▶ 다인스케치 초기 데이터 주입");
  await applySchema();

  await seedAdmin();
  await seedPortfolio();

  await seedTable("services", SERVICES, (r, i) => ({
    key: r.key, kr: r.kr, en: r.en, cat: r.cat, short: r.short, d: r.d, d2: r.d2,
    deliverables: JSON.stringify(r.deliverables), sort_order: i, visible: 1,
  }));
  await seedTable("equipment", EQUIPMENT, (r, i) => ({
    name: r.name, maker: r.maker, model: r.model, spec: r.spec,
    description: r.description, src: exists(r.src) ? r.src : null, sort_order: i, visible: 1,
  }));
  await seedTable("history", HISTORY, (r, i) => ({
    year: r.year, title: r.title, sort_order: i, visible: 1,
  }));
  await seedTable("awards", AWARDS, (r, i) => ({
    year: r.year, title: r.title, org: r.org, sort_order: i, visible: 1,
  }));
  await seedTable(
    "clients",
    Object.entries(CLIENT_GROUPS).flatMap(([g, names]) => names.map((n) => ({ name: n, group_name: g }))),
    (r, i) => ({ name: r.name, group_name: r.group_name, sort_order: i, visible: 1 })
  );
  await seedTable("hero_slides", HERO.filter((h) => exists(h.src)), (r, i) => ({
    page: r.page, src: r.src, sort_order: i, visible: 1,
  }));

  console.log("\n✔ 완료\n");
  await closePool();
}

main().catch(async (e) => {
  console.error("\n✖ 시드 실패:", e);
  await closePool();
  process.exit(1);
});
