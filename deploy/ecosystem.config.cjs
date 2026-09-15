/* =====================================================================
   PM2 — dynesketch-web
   서버에서:  pm2 startOrReload deploy/ecosystem.config.cjs && pm2 save
   ===================================================================== */
module.exports = {
  apps: [
    {
      name: "dynesketch-web",
      cwd: "/home/website/dy.mostvisual.co.kr",
      script: "server/src/index.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 12,
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 3410,
      },
      out_file: "/home/website/dy.mostvisual.co.kr/logs/out.log",
      error_file: "/home/website/dy.mostvisual.co.kr/logs/err.log",
      merge_logs: true,
      time: true,
    },
  ],
};
