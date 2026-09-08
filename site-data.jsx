/* global React */
/* =====================================================================
   site-data.jsx — 공개 사이트 ↔ 서버 연결
   --------------------------------------------------------------------
   · 페이지가 뜨자마자 /api/site 를 한 번 받아 온다 (관리자가 저장한 내용).
   · 서버가 없거나 데이터가 비어 있으면 각 jsx 파일에 하드코딩된
     기본값(fallback)을 그대로 쓰므로, 이 파일이 실패해도 사이트는 멀쩡하다.
   · 다른 jsx 는 window.site* 헬퍼로 "DB 값이 있으면 그것, 없으면 기본값"을
     받아 간다.

   반드시 components.jsx 보다 먼저 로드되어야 한다.
   ===================================================================== */
(function () {
  var subs = new Set();
  var SITE = null;

  window.SITE = null;
  window.onSiteData = function (fn) { subs.add(fn); return function () { subs.delete(fn); }; };

  function notify() {
    window.SITE = SITE;
    subs.forEach(function (f) { try { f(SITE); } catch (e) { /* noop */ } });
  }

  /* --- 헬퍼: DB 값이 비어 있으면 fallback --- */
  function nonEmpty(arr) { return Array.isArray(arr) && arr.length ? arr : null; }

  window.siteSetting = function (group, key, dflt) {
    var g = SITE && SITE.settings && SITE.settings[group];
    if (!g) return dflt;
    if (key === undefined) return g;
    return g[key] === undefined || g[key] === null || g[key] === "" ? dflt : g[key];
  };

  window.siteServices = function (fallback) {
    var rows = SITE && nonEmpty(SITE.services);
    if (!rows) return fallback;
    return rows.map(function (s) {
      return {
        key: s.key, kr: s.kr, en: s.en, cat: s.cat, short: s.short,
        d: s.d, d2: s.d2,
        deliverables: Array.isArray(s.deliverables) ? s.deliverables : [],
      };
    });
  };

  window.siteEquipment = function (fallback) {
    var rows = SITE && nonEmpty(SITE.equipment);
    if (!rows) return fallback;
    return rows.map(function (e) {
      return {
        tag: e.description || "EQUIPMENT",
        name: e.name,
        spec: e.spec || "",
        photo: e.src || "",
        label: e.model || e.name,
      };
    });
  };

  window.siteHistory = function (fallback) {
    var rows = SITE && nonEmpty(SITE.history);
    if (!rows) return fallback;
    return rows.map(function (h) { return { y: h.year, t: h.title }; });
  };

  window.siteAwards = function (fallback) {
    var rows = SITE && nonEmpty(SITE.awards);
    if (!rows) return fallback;
    return rows.map(function (a) { return { y: a.year, t: a.title }; });
  };

  window.siteClientGroups = function (fallback) {
    var rows = SITE && nonEmpty(SITE.clients);
    if (!rows) return fallback;
    var out = {};
    rows.forEach(function (c) {
      var g = c.group_name || "고객사";
      (out[g] = out[g] || []).push(c.name);
    });
    return out;
  };

  window.siteHero = function (page, fallback) {
    var rows = SITE && nonEmpty(SITE.hero);
    if (!rows) return fallback;
    var mine = rows.filter(function (h) { return h.page === page; }).map(function (h) { return h.src; });
    return mine.length ? mine : fallback;
  };

  window.siteNotices = function () {
    return (SITE && SITE.notices) || [];
  };

  /* --- React 훅: 데이터가 도착하면 다시 그린다 --- */
  window.useSiteData = function () {
    var s = React.useState(0);
    React.useEffect(function () { return window.onSiteData(function () { s[1](function (n) { return n + 1; }); }); }, []);
    return SITE;
  };

  /* --- 견적요청 접수 --- */
  window.submitInquiry = function (form) {
    return fetch("/api/inquiries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) throw new Error(d.error || "접수에 실패했습니다. 잠시 후 다시 시도해 주세요.");
        return d;
      });
    });
  };

  /* --- 방문 기록 (실패해도 무시) --- */
  var lastPath = null;
  window.trackVisit = function (path) {
    if (path === lastPath) return;
    lastPath = path;
    try {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: path, referrer: document.referrer || "" }),
        keepalive: true,
      }).catch(function () {});
    } catch (e) { /* noop */ }
  };

  /* --- 부트: 사이트 데이터 로드 --- */
  fetch("/api/site", { headers: { Accept: "application/json" } })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data) return;
      SITE = data;

      /* 포트폴리오는 components.jsx 의 RESOURCE 객체를 제자리에서 교체한다.
         (RESOURCE 를 참조하는 코드를 전부 고치지 않아도 되도록) */
      if (window.RESOURCE) {
        var merged = Object.assign({}, data.byCategory || {}, data.byYear || {});
        if (Object.keys(merged).length) {
          Object.keys(window.RESOURCE).forEach(function (k) { delete window.RESOURCE[k]; });
          Object.assign(window.RESOURCE, merged);
        }
      }

      /* SEO 메타 — 관리자가 바꾼 값 반영 */
      var seo = data.settings && data.settings.seo;
      if (seo) {
        if (seo.title) document.title = seo.title;
        var setMeta = function (sel, val) {
          if (!val) return;
          var el = document.querySelector(sel);
          if (el) el.setAttribute("content", val);
        };
        setMeta('meta[name="description"]', seo.description);
        setMeta('meta[name="keywords"]', seo.keywords);
        setMeta('meta[property="og:title"]', seo.title);
        setMeta('meta[property="og:description"]', seo.description);

        /* 검색엔진 사이트 인증 토큰 */
        var verify = function (name, val) {
          if (!val) return;
          var el = document.querySelector('meta[name="' + name + '"]');
          if (el) el.setAttribute("content", val);
        };
        verify("naver-site-verification", seo.naverVerification);
        verify("google-site-verification", seo.googleVerification);

        /* GA4 / GTM — 관리자에 ID 를 넣으면 그때부터 붙는다 */
        if (seo.gaId && !window.__gaLoaded) {
          window.__gaLoaded = true;
          var g = document.createElement("script");
          g.async = true;
          g.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(seo.gaId);
          document.head.appendChild(g);
          window.dataLayer = window.dataLayer || [];
          window.gtag = function () { window.dataLayer.push(arguments); };
          window.gtag("js", new Date());
          window.gtag("config", seo.gaId);
        }
        if (seo.gtmId && !window.__gtmLoaded) {
          window.__gtmLoaded = true;
          window.dataLayer = window.dataLayer || [];
          window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
          var m = document.createElement("script");
          m.async = true;
          m.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(seo.gtmId);
          document.head.appendChild(m);
        }
      }

      notify();
    })
    .catch(function () { /* 서버 없이 열어도 기본값으로 동작 */ });
})();
