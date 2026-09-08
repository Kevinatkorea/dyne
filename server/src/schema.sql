-- =====================================================================
-- 다인스케치 (DYNESKETCH) — MariaDB 스키마
-- 모든 문(statement)은 IF NOT EXISTS 로 반복 실행에 안전하다.
-- 세미콜론(;) 단위로 잘라 실행하므로 문 안에 ; 를 넣지 말 것.
-- =====================================================================

CREATE TABLE IF NOT EXISTS users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(190) NOT NULL UNIQUE,
  name          VARCHAR(80)  NOT NULL,
  role          ENUM('super','staff','viewer') NOT NULL DEFAULT 'staff',
  password_hash VARCHAR(120) NOT NULL,
  active        TINYINT(1)   NOT NULL DEFAULT 1,
  last_login_at DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 미디어 라이브러리 --------------------------------------------------
CREATE TABLE IF NOT EXISTS media (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  url          VARCHAR(500) NOT NULL,
  filename     VARCHAR(255) NOT NULL,
  original     VARCHAR(255) NULL,
  mime         VARCHAR(100) NULL,
  size         INT          NULL DEFAULT 0,
  folder       VARCHAR(120) NOT NULL DEFAULT 'general',
  alt          VARCHAR(255) NULL,
  source       ENUM('upload','repo') NOT NULL DEFAULT 'upload',
  uploaded_by  INT          NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_media_folder (folder),
  INDEX idx_media_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 견적요청 -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(24)  NOT NULL UNIQUE,
  company     VARCHAR(160) NULL,
  name        VARCHAR(80)  NOT NULL,
  phone       VARCHAR(60)  NULL,
  email       VARCHAR(190) NULL,
  service     VARCHAR(80)  NULL,
  quantity    VARCHAR(80)  NULL,
  deadline    VARCHAR(80)  NULL,
  budget      VARCHAR(80)  NULL,
  message     TEXT         NULL,
  status      ENUM('new','reviewing','quoted','won','lost','closed') NOT NULL DEFAULT 'new',
  priority    ENUM('low','normal','high') NOT NULL DEFAULT 'normal',
  assignee_id INT          NULL,
  memo        TEXT         NULL,
  amount      INT          NULL,
  starred     TINYINT(1)   NOT NULL DEFAULT 0,
  read_at     DATETIME     NULL,
  source      VARCHAR(60)  NOT NULL DEFAULT 'web',
  ip          VARCHAR(64)  NULL,
  referrer    VARCHAR(500) NULL,
  user_agent  VARCHAR(400) NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_inq_status (status),
  INDEX idx_inq_created (created_at),
  INDEX idx_inq_assignee (assignee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inquiry_files (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  inquiry_id  INT NOT NULL,
  media_id    INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_if_inq (inquiry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inquiry_events (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  inquiry_id  INT NOT NULL,
  user_id     INT NULL,
  user_name   VARCHAR(80) NULL,
  type        VARCHAR(40) NOT NULL,
  note        TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ie_inq (inquiry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 포트폴리오 ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS portfolio_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  src         VARCHAR(500) NOT NULL,
  category    VARCHAR(60)  NULL,
  year        VARCHAR(10)  NULL,
  title       VARCHAR(200) NULL,
  client      VARCHAR(160) NULL,
  description TEXT         NULL,
  tags        VARCHAR(400) NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  featured    TINYINT(1)   NOT NULL DEFAULT 0,
  media_id    INT          NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_pf_cat (category, sort_order),
  INDEX idx_pf_year (year, sort_order),
  INDEX idx_pf_visible (visible)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사업영역(서비스) ---------------------------------------------------
CREATE TABLE IF NOT EXISTS services (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  `key`        VARCHAR(60)  NOT NULL UNIQUE,
  kr           VARCHAR(120) NOT NULL,
  en           VARCHAR(120) NULL,
  cat          VARCHAR(60)  NULL,
  short        VARCHAR(400) NULL,
  d            TEXT         NULL,
  d2           TEXT         NULL,
  deliverables TEXT         NULL,
  hero_src     VARCHAR(500) NULL,
  sort_order   INT          NOT NULL DEFAULT 0,
  visible      TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 보유장비 -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipment (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(160) NOT NULL,
  maker       VARCHAR(120) NULL,
  model       VARCHAR(120) NULL,
  spec        VARCHAR(400) NULL,
  description TEXT         NULL,
  src         VARCHAR(500) NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 연혁 ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  year        VARCHAR(10)  NOT NULL,
  month       VARCHAR(10)  NULL,
  title       VARCHAR(300) NOT NULL,
  body        TEXT         NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 고객사 -------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(160) NOT NULL,
  group_name  VARCHAR(80)  NULL,
  logo_src    VARCHAR(500) NULL,
  url         VARCHAR(400) NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 수상 / 인증 --------------------------------------------------------
CREATE TABLE IF NOT EXISTS awards (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  year        VARCHAR(10)  NULL,
  title       VARCHAR(300) NOT NULL,
  org         VARCHAR(200) NULL,
  description TEXT         NULL,
  src         VARCHAR(500) NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 히어로 슬라이드 ----------------------------------------------------
CREATE TABLE IF NOT EXISTS hero_slides (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  page        VARCHAR(40)  NOT NULL DEFAULT 'home',
  src         VARCHAR(500) NOT NULL,
  caption     VARCHAR(300) NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_hero_page (page, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 공지 / 팝업 --------------------------------------------------------
CREATE TABLE IF NOT EXISTS notices (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  type        ENUM('notice','popup','banner') NOT NULL DEFAULT 'notice',
  title       VARCHAR(300) NOT NULL,
  body        TEXT         NULL,
  link        VARCHAR(400) NULL,
  src         VARCHAR(500) NULL,
  start_at    DATETIME     NULL,
  end_at      DATETIME     NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  visible     TINYINT(1)   NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 사이트 설정 (key/value JSON) --------------------------------------
CREATE TABLE IF NOT EXISTS settings (
  `key`      VARCHAR(120) NOT NULL PRIMARY KEY,
  value      TEXT         NULL,
  updated_by INT          NULL,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 방문 통계 ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS visits (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  day        DATE         NOT NULL,
  path       VARCHAR(200) NOT NULL,
  visitor    VARCHAR(64)  NOT NULL,
  referrer   VARCHAR(400) NULL,
  device     VARCHAR(20)  NULL,
  ip         VARCHAR(64)  NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_visit_day (day),
  INDEX idx_visit_path (path),
  INDEX idx_visit_visitor (visitor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 문자(SMS) 발송 이력 ------------------------------------------------
CREATE TABLE IF NOT EXISTS sms_logs (
  id          BIGINT AUTO_INCREMENT PRIMARY KEY,
  inquiry_id  INT          NULL,
  kind        ENUM('customer','staff','test') NOT NULL DEFAULT 'staff',
  receiver    VARCHAR(200) NOT NULL,
  sender      VARCHAR(32)  NULL,
  msg_type    VARCHAR(10)  NULL,
  body        TEXT         NULL,
  ok          TINYINT(1)   NOT NULL DEFAULT 0,
  result_code VARCHAR(20)  NULL,
  message     VARCHAR(400) NULL,
  msg_id      VARCHAR(40)  NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_sms_created (created_at),
  INDEX idx_sms_inq (inquiry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 감사 로그 ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
  id         BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id    INT          NULL,
  user_name  VARCHAR(80)  NULL,
  action     VARCHAR(60)  NOT NULL,
  entity     VARCHAR(60)  NULL,
  entity_id  VARCHAR(60)  NULL,
  detail     TEXT         NULL,
  ip         VARCHAR(64)  NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created (created_at),
  INDEX idx_audit_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
