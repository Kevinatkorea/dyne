/* global React */
/* =====================================================================
   api.jsx — 서버 통신 헬퍼 (전역 window.API 로 노출)
   ===================================================================== */

const BASE = "/api";

async function request(method, url, body, opts = {}) {
  const init = {
    method,
    credentials: "same-origin",
    headers: {},
  };
  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + url, init);

  if (opts.raw) return res;

  let data = null;
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    try { data = await res.json(); } catch { data = null; }
  }
  if (!res.ok) {
    const err = new Error((data && data.error) || `요청 실패 (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : "";
};

const API = {
  qs,
  get: (url, params) => request("GET", url + qs(params)),
  post: (url, body) => request("POST", url, body),
  put: (url, body) => request("PUT", url, body),
  del: (url) => request("DELETE", url),

  /* 진행률이 필요한 업로드는 XHR 로 */
  upload(url, files, fields = {}, onProgress) {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append("files", f));
      Object.entries(fields).forEach(([k, v]) => { if (v != null && v !== "") fd.append(k, v); });

      const xhr = new XMLHttpRequest();
      xhr.open("POST", BASE + url);
      xhr.withCredentials = true;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        let data = null;
        try { data = JSON.parse(xhr.responseText); } catch { /* noop */ }
        if (xhr.status >= 200 && xhr.status < 300) resolve(data);
        else reject(new Error((data && data.error) || `업로드 실패 (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error("업로드 중 네트워크 오류가 발생했습니다."));
      xhr.send(fd);
    });
  },

  /* 파일 다운로드 (CSV / 백업 JSON) */
  download(url, filename) {
    const a = document.createElement("a");
    a.href = BASE + url;
    if (filename) a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  /* --- 도메인별 단축 경로 --- */
  auth: {
    me: () => API.get("/auth/me"),
    login: (email, password) => API.post("/auth/login", { email, password }),
    logout: () => API.post("/auth/logout"),
    password: (current, next) => API.post("/auth/password", { current, next }),
  },
  admin: {
    summary: () => API.get("/admin/stats/summary"),
    visits: (days) => API.get("/admin/stats/visits", { days }),

    inquiries: (params) => API.get("/admin/inquiries", params),
    inquiry: (id) => API.get(`/admin/inquiries/${id}`),
    inquiryUpdate: (id, body) => API.put(`/admin/inquiries/${id}`, body),
    inquiryEvent: (id, body) => API.post(`/admin/inquiries/${id}/events`, body),
    inquiryDelete: (id) => API.del(`/admin/inquiries/${id}`),
    inquiryBulk: (ids, status) => API.post("/admin/inquiries/bulk-status", { ids, status }),

    portfolio: (params) => API.get("/admin/portfolio", params),
    portfolioUpdate: (id, body) => API.put(`/admin/portfolio/${id}`, body),
    portfolioDelete: (id) => API.del(`/admin/portfolio/${id}`),
    portfolioReorder: (ids, base) => API.post("/admin/portfolio/reorder", { ids, base }),
    portfolioBulk: (body) => API.post("/admin/portfolio/bulk", body),

    media: (params) => API.get("/admin/media", params),
    mediaUpdate: (id, alt) => API.put(`/admin/media/${id}`, { alt }),
    mediaDelete: (id) => API.del(`/admin/media/${id}`),

    settings: () => API.get("/admin/settings"),
    settingsSave: (body) => API.put("/admin/settings", body),
    settingsReset: (key) => API.post("/admin/settings/reset", { key }),

    users: () => API.get("/admin/users"),
    userOptions: () => API.get("/admin/users/options"),
    userCreate: (body) => API.post("/admin/users", body),
    userUpdate: (id, body) => API.put(`/admin/users/${id}`, body),
    userDelete: (id) => API.del(`/admin/users/${id}`),

    audit: (params) => API.get("/admin/audit", params),
    restore: (payload) => API.post("/admin/restore", payload),
    pruneVisits: (keepDays) => API.post("/admin/prune-visits", { keepDays }),

    /* content.js 가 마운트한 공통 CRUD — resource = services|equipment|... */
    list: (resource, params) => API.get(`/admin/${resource}`, params),
    create: (resource, body) => API.post(`/admin/${resource}`, body),
    update: (resource, id, body) => API.put(`/admin/${resource}/${id}`, body),
    remove: (resource, id) => API.del(`/admin/${resource}/${id}`),
    reorder: (resource, ids) => API.post(`/admin/${resource}/reorder`, { ids }),
    bulkVisible: (resource, ids, visible) => API.post(`/admin/${resource}/bulk-visible`, { ids, visible }),
    bulkDelete: (resource, ids) => API.post(`/admin/${resource}/bulk-delete`, { ids }),
  },
};

window.API = API;
