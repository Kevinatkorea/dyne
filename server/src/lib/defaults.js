/* =====================================================================
   defaults.js — 사이트 설정 기본값
   현재 index.html / components.jsx 에 하드코딩되어 있던 회사 정보를
   그대로 옮겨 놓은 것. 관리자에서 바꾸면 DB 값이 우선한다.
   ===================================================================== */
export const SETTING_DEFAULTS = {
  company: {
    name: "주식회사 다인스케치",
    brand: "다인스케치",
    brandEn: "DYNESKETCH",
    ceo: "전명호",
    founded: "2008-07",
    bizNo: "220-87-73258",
    address: "서울특별시 성동구 성수이로18길 31 풍림테크원 401·407호",
    addressShort: "성수동",
    tel: "02-514-2450",
    fax: "02-465-2450",
    email: "design2@dynes.co.kr",
    hours: "평일 09:30 – 18:30",
    mapLat: 37.5445,
    mapLng: 127.0557,
  },

  seo: {
    title: "다인스케치 DYNESKETCH | 편집디자인·인쇄 전문기업 (성수동, 18년)",
    description:
      "다인스케치는 2008년 성수동에서 시작한 편집디자인·인쇄 전문기업입니다. 표지디자인, 브로슈어·카탈로그, 리플릿, 포스터, 보고서·자료집, 현수막·배너, 기타 인쇄물까지 — 기획·디자인·인쇄·후가공·납품을 한 팀이 책임집니다.",
    keywords:
      "다인스케치, DYNESKETCH, 편집디자인, 인쇄소, 성수동인쇄소, 성수동디자인, 표지디자인, 브로슈어, 카탈로그, 리플릿, 포스터, 보고서, 자료집, 현수막, 배너, 명함, 단행본, 출판인쇄, 옵셋인쇄, 디지털인쇄, 후가공, B2B인쇄",
    canonical: "https://dy.mostvisual.co.kr/",
    ogImage: "/resource/top6.jpg",
    naverVerification: "",
    googleVerification: "",
    gaId: "",
    gtmId: "",
  },

  footer: {
    copyright: "© 2026 주식회사 다인스케치. All rights reserved.",
    note: "기획 · 디자인 · 인쇄 · 후가공 · 납품을 한 팀이 책임집니다.",
    links: [],
  },

  /* 홈 상단 통계 카드 */
  stats: [
    { label: "설립", value: "2008", suffix: "" },
    { label: "누적 프로젝트", value: "3,000", suffix: "+" },
    { label: "거래처", value: "250", suffix: "+" },
    { label: "경력", value: "18", suffix: "년" },
  ],

  /* 견적요청 폼 옵션 */
  inquiryForm: {
    services: [
      "표지 디자인", "브로슈어 / 카탈로그", "리플릿", "포스터",
      "보고서 / 자료집", "현수막 / 배너", "기타 인쇄물", "기타 문의",
    ],
    budgets: ["100만원 미만", "100–500만원", "500–1,000만원", "1,000만원 이상", "미정"],
    notifyEmail: "",
    thanksMessage: "견적 요청이 접수되었습니다. 영업일 기준 1일 이내에 담당자가 연락드립니다.",
    enabled: true,
  },

  /* 기능 토글 */
  features: {
    tweaksPanel: false,     // 우측 하단 개발용 튜닝 패널 — 운영에서는 끈다
    visitTracking: true,
    popupNotice: true,
    portfolioPublic: true,
  },
};
