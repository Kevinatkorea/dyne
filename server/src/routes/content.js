/* =====================================================================
   routes/content.js — 콘텐츠 테이블 CRUD 묶음
   서비스 / 장비 / 연혁 / 고객사 / 수상 / 히어로슬라이드 / 공지·팝업
   전부 드래그앤드롭 정렬(POST .../reorder)을 지원한다.
   ===================================================================== */
import express from "express";
import { crudRouter } from "../lib/crud.js";
import { s, bool01, int, toDbDate, pick } from "../lib/util.js";

const router = express.Router();

const str = (max) => (v) => s(v, max);
const text = (max) => (v) => (v == null ? null : String(v).slice(0, max));
const json = (v) => (v == null ? null : JSON.stringify(v));

/* 사업영역 -------------------------------------------------------- */
router.use("/services", crudRouter({
  table: "services",
  entity: "service",
  fields: ["key", "kr", "en", "cat", "short", "d", "d2", "deliverables", "hero_src", "visible"],
  coerce: {
    key: str(60), kr: str(120), en: str(120), cat: str(60),
    short: str(400), d: text(4000), d2: text(4000),
    hero_src: str(500), visible: (v) => bool01(v, 1),
    deliverables: (v) => (Array.isArray(v) ? json(v) : text(2000)(v)),
  },
}));

/* 보유장비 -------------------------------------------------------- */
router.use("/equipment", crudRouter({
  table: "equipment",
  entity: "equipment",
  fields: ["name", "maker", "model", "spec", "description", "src", "visible"],
  coerce: {
    name: str(160), maker: str(120), model: str(120), spec: str(400),
    description: text(4000), src: str(500), visible: (v) => bool01(v, 1),
  },
}));

/* 연혁 ------------------------------------------------------------ */
router.use("/history", crudRouter({
  table: "history",
  entity: "history",
  order: "sort_order ASC, year DESC, id ASC",
  fields: ["year", "month", "title", "body", "visible"],
  coerce: {
    year: str(10), month: str(10), title: str(300),
    body: text(4000), visible: (v) => bool01(v, 1),
  },
}));

/* 고객사 ---------------------------------------------------------- */
router.use("/clients", crudRouter({
  table: "clients",
  entity: "client",
  fields: ["name", "group_name", "logo_src", "url", "visible"],
  coerce: {
    name: str(160), group_name: str(80), logo_src: str(500),
    url: str(400), visible: (v) => bool01(v, 1),
  },
}));

/* 수상 / 인증 ----------------------------------------------------- */
router.use("/awards", crudRouter({
  table: "awards",
  entity: "award",
  fields: ["year", "title", "org", "description", "src", "visible"],
  coerce: {
    year: str(10), title: str(300), org: str(200),
    description: text(4000), src: str(500), visible: (v) => bool01(v, 1),
  },
}));

/* 히어로 슬라이드 -------------------------------------------------- */
router.use("/hero-slides", crudRouter({
  table: "hero_slides",
  entity: "hero_slide",
  order: "page ASC, sort_order ASC, id ASC",
  fields: ["page", "src", "caption", "visible"],
  coerce: {
    page: (v) => pick(v, ["home", "about", "services", "facility", "portfolio", "contact"], "home"),
    src: str(500), caption: str(300), visible: (v) => bool01(v, 1),
  },
}));

/* 공지 / 팝업 ------------------------------------------------------ */
router.use("/notices", crudRouter({
  table: "notices",
  entity: "notice",
  fields: ["type", "title", "body", "link", "src", "start_at", "end_at", "visible"],
  coerce: {
    type: (v) => pick(v, ["notice", "popup", "banner"], "notice"),
    title: str(300), body: text(8000), link: str(400), src: str(500),
    start_at: toDbDate, end_at: toDbDate, visible: (v) => bool01(v, 1),
  },
}));

export default router;
