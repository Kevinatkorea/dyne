-- =====================================================================
-- DB · 계정 생성 (root 1회 작업)
--   mysql < deploy/_setup_db.filled.sql
-- __DBPW__ 를 실제 비밀번호로 치환한 파일이 _setup_db.filled.sql 이다.
-- 이 계정은 dyne 스키마에만 접근할 수 있어 이웃 서비스 DB와 격리된다.
-- =====================================================================
CREATE DATABASE IF NOT EXISTS `dyne`
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'dyne_app'@'localhost' IDENTIFIED BY '__DBPW__';
CREATE USER IF NOT EXISTS 'dyne_app'@'127.0.0.1' IDENTIFIED BY '__DBPW__';

GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
  ON `dyne`.* TO 'dyne_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP, REFERENCES
  ON `dyne`.* TO 'dyne_app'@'127.0.0.1';

FLUSH PRIVILEGES;
