#!/usr/bin/env python
"""
다인스케치 — 원격 배포 (Windows → 49.247.41.172)

    python scripts/deploy.py                배포 (git pull → 빌드 → PM2 리로드)
    python scripts/deploy.py --seed         최초 배포 (초기 데이터 시드 포함)
    python scripts/deploy.py --bootstrap    최초 1회: clone + .env 생성 + 디렉터리 준비
    python scripts/deploy.py --cmd "..."    서버에서 임의 명령 실행
    python scripts/deploy.py --root-setup   root 작업(vhost 설치·인증서) 안내/실행
    python scripts/deploy.py --logs         PM2 로그 확인

배포는 GitHub 경유다. 로컬 변경을 먼저 push 해야 서버에 반영된다.
비밀번호는 scripts/.deploy_secret (gitignore) 또는 환경변수로 넘긴다.
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

# Windows 콘솔에서 한글/em-dash 가 깨지지 않도록
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
sys.stderr.reconfigure(encoding="utf-8", errors="replace")

try:
    import paramiko
except ImportError:
    sys.exit("paramiko 가 필요합니다:  pip install paramiko")

HOST = os.environ.get("DYNE_HOST", "49.247.41.172")
USER = os.environ.get("DYNE_USER", "website")
APP_DIR = "/home/website/dy.mostvisual.co.kr"
REPO = os.environ.get("DYNE_REPO", "https://github.com/Kevinatkorea/dyne.git")
BRANCH = os.environ.get("DYNE_BRANCH", "main")
PORT = os.environ.get("DYNE_PORT", "3410")

ROOT = Path(__file__).resolve().parent.parent
SECRET_FILE = ROOT / "scripts" / ".deploy_secret"


def password() -> str:
    pw = os.environ.get("DYNE_SSH_PASSWORD")
    if pw:
        return pw
    if SECRET_FILE.exists():
        return SECRET_FILE.read_text(encoding="utf-8").strip()
    sys.exit(
        "SSH 비밀번호를 찾을 수 없습니다.\n"
        f"  {SECRET_FILE} 에 한 줄로 저장하거나 DYNE_SSH_PASSWORD 환경변수를 설정하세요."
    )


def root_password() -> str:
    pw = os.environ.get("DYNE_ROOT_PASSWORD")
    if pw:
        return pw
    f = ROOT / "scripts" / ".root_secret"
    if f.exists():
        return f.read_text(encoding="utf-8").strip()
    sys.exit("root 비밀번호가 필요합니다: scripts/.root_secret 또는 DYNE_ROOT_PASSWORD")


def step(msg: str) -> None:
    print(f"\n\033[36m▶ {msg}\033[0m", flush=True)


def connect() -> paramiko.SSHClient:
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, 22, USER, password(), timeout=30)
    return c


def run(c: paramiko.SSHClient, cmd: str, check: bool = True) -> int:
    full = f'export PATH="$HOME/.npm-global/bin:$PATH"; {cmd}'
    _, out, err = c.exec_command(full, get_pty=True, timeout=1800)
    for line in iter(out.readline, ""):
        print("  " + line.rstrip(), flush=True)
    code = out.channel.recv_exit_status()
    tail = err.read().decode("utf-8", "replace").strip()
    if tail:
        print("  [stderr] " + tail[:2000], flush=True)
    if check and code != 0:
        sys.exit(f"\n✖ 실패 (exit {code}): {cmd}")
    return code


def run_as_root(c: paramiko.SSHClient, script: str, timeout: int = 300) -> None:
    """root SSH 로그인이 막혀 있어 su -l 로 승격한다.

    ⚠ 각 명령이 '실제로 끝날 때까지' 기다린다. 고정 sleep 으로 넘기면
       certbot 처럼 오래 걸리는 명령이 세션 종료와 함께 SIGHUP 으로 죽고,
       스크립트 뒷부분(vhost 설치)만 실행돼 인증서 없는 SSL vhost 가
       남는 사고가 난다. 반드시 완료 신호를 확인한다.
    """
    ch = c.invoke_shell(width=220, height=80)
    ch.settimeout(timeout)
    time.sleep(1)
    if ch.recv_ready():
        ch.recv(65535)

    def drain(wait: float) -> str:
        time.sleep(wait)
        buf = b""
        while ch.recv_ready():
            buf += ch.recv(65535)
            time.sleep(0.3)
        return buf.decode("utf-8", "replace")

    ch.send("su -l\n")
    drain(2.0)
    ch.send(root_password() + "\n")
    drain(3.0)
    ch.send("whoami\n")
    if "root" not in drain(2.0):
        ch.close()
        sys.exit("✖ root 승격 실패")

    for n, line in enumerate(script.strip().splitlines()):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        print("  # " + line, flush=True)

        marker = f"__DYNE_DONE_{n}__"
        ch.send(f"{line}; echo {marker}rc=$?\n")

        buf = ""
        deadline = time.time() + timeout
        while f"{marker}rc=" not in buf.replace(f"echo {marker}rc=$?", ""):
            if time.time() > deadline:
                ch.close()
                sys.exit(f"\n✖ 시간 초과({timeout}s): {line}")
            try:
                chunk = ch.recv(65535)
            except Exception:
                break
            if not chunk:
                break
            buf += chunk.decode("utf-8", "replace")

        rc = None
        for part in buf.split(marker + "rc="):
            tail = part.strip().split()
            if tail and tail[0].isdigit():
                rc = int(tail[0])
        for l in buf.splitlines():
            s = l.strip()
            if not s or marker in s or s.startswith("echo ") or line in s:
                continue
            print("    " + l.rstrip(), flush=True)
        if rc:
            print(f"    ↑ 종료코드 {rc}", flush=True)
            ch.close()
            sys.exit(f"\n✖ 실패(exit {rc}): {line}")

    ch.send("exit\n")
    time.sleep(1)
    ch.close()


def bootstrap(c: paramiko.SSHClient) -> None:
    step("디렉터리 · 클론")
    run(c, f"mkdir -p {APP_DIR} {APP_DIR}/logs {APP_DIR}/uploads "
           f"{APP_DIR}/webroot/.well-known/acme-challenge {APP_DIR}/backups")
    run(c, f"if [ ! -d {APP_DIR}/.git ]; then "
           f"  rm -rf /tmp/dyne_clone && "
           f"  git clone --branch {BRANCH} {REPO} /tmp/dyne_clone && "
           f"  cp -a /tmp/dyne_clone/. {APP_DIR}/ && rm -rf /tmp/dyne_clone; "
           f"else echo '  이미 클론됨'; fi")
    run(c, f"cd {APP_DIR} && git fetch origin {BRANCH} && "
           f"git checkout -B {BRANCH} origin/{BRANCH} && git log -1 --oneline")

    step(".env 생성 (이미 있으면 유지)")
    run(c, f"""
if [ -f {APP_DIR}/server/.env ]; then
  echo '  .env 이미 존재 — 유지';
else
  DBPW=$(openssl rand -hex 16);
  JWT=$(openssl rand -hex 32);
  ADMINPW=$(openssl rand -base64 12 | tr -d '/+=' | cut -c1-12);
  echo "$DBPW" > {APP_DIR}/.dbpw; chmod 600 {APP_DIR}/.dbpw;
  sed -e "s|__DBPW__|$DBPW|g" -e "s|__JWT__|$JWT|g" -e "s|__ADMINPW__|$ADMINPW|g" \
      {APP_DIR}/deploy/env.production.example > {APP_DIR}/server/.env;
  chmod 600 {APP_DIR}/server/.env;
  sed "s|__DBPW__|$DBPW|g" {APP_DIR}/deploy/setup_db.sql > {APP_DIR}/deploy/_setup_db.filled.sql;
  chmod 600 {APP_DIR}/deploy/_setup_db.filled.sql;
  echo "  .env 생성 완료";
  echo "  최초 관리자 비밀번호: $ADMINPW";
fi
""".strip())

    print(f"""
다음은 root 작업입니다 (DB 생성 · vhost). 아래 중 하나로 진행하세요:

  python scripts/deploy.py --root-setup      (자동 — scripts/.root_secret 필요)

또는 서버에서 직접:
  su -l
  mysql < {APP_DIR}/deploy/_setup_db.filled.sql
  cp {APP_DIR}/deploy/dy.mostvisual.co.kr.conf /etc/apache2/sites-enabled/
  apache2ctl configtest && systemctl reload apache2
""")


def root_setup(c: paramiko.SSHClient, ssl: bool = False, email: str = "") -> None:
    step("root 작업 — DB · vhost" + (" · 인증서" if ssl else ""))
    script = f"""
mysql < {APP_DIR}/deploy/_setup_db.filled.sql
mysql -e "SHOW DATABASES LIKE 'dyne'"
cp {APP_DIR}/deploy/dy.mostvisual.co.kr.conf /etc/apache2/sites-enabled/dy.mostvisual.co.kr.conf
apache2ctl configtest
systemctl reload apache2
"""
    if ssl:
        # 인증서가 실제로 생긴 경우에만 SSL vhost 를 설치하고,
        # configtest 가 깨지면 즉시 되돌린다.
        # (인증서 없는 SSL vhost 를 남기면 다음 apache 재시작 때 이 서버의
        #  모든 사이트가 함께 죽는다.)
        script += f"""
certbot certonly --webroot -w {APP_DIR}/webroot -d dy.mostvisual.co.kr --non-interactive --agree-tos -m {email}
test -s /etc/letsencrypt/live/dy.mostvisual.co.kr/fullchain.pem
cp {APP_DIR}/deploy/dy.mostvisual.co.kr-le-ssl.conf /etc/apache2/sites-enabled/dy.mostvisual.co.kr-le-ssl.conf
apache2ctl configtest || (rm -f /etc/apache2/sites-enabled/dy.mostvisual.co.kr-le-ssl.conf; echo "configtest 실패 — SSL vhost 를 되돌렸습니다"; false)
systemctl reload apache2
certbot certificates -d dy.mostvisual.co.kr | grep -E "Certificate Name|Expiry|Domains"
"""
    run_as_root(c, script, timeout=420)


def deploy(c: paramiko.SSHClient, seed: bool) -> None:
    step("배포")
    env = "SEED=1 " if seed else ""
    run(c, f"cd {APP_DIR} && {env}PORT={PORT} bash deploy/deploy.sh")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--bootstrap", action="store_true", help="최초 1회 준비")
    ap.add_argument("--seed", action="store_true", help="초기 데이터 시드 포함")
    ap.add_argument("--root-setup", action="store_true", help="root 작업 (DB·vhost)")
    ap.add_argument("--ssl", action="store_true", help="root 작업에 인증서 발급 포함")
    ap.add_argument("--email", default="pplanit2024@gmail.com", help="certbot 등록 메일")
    ap.add_argument("--cmd", help="서버에서 임의 명령 실행")
    ap.add_argument("--logs", action="store_true", help="PM2 로그 보기")
    args = ap.parse_args()

    c = connect()
    try:
        if args.cmd:
            run(c, args.cmd, check=False)
            return
        if args.logs:
            run(c, "pm2 logs dynesketch-web --lines 80 --nostream", check=False)
            return
        if args.bootstrap:
            bootstrap(c)
            return
        if args.root_setup:
            root_setup(c, ssl=args.ssl, email=args.email)
            return
        deploy(c, seed=args.seed)
        print("\n\033[32m✔ 완료 — https://dy.mostvisual.co.kr/ · 관리자 /admin/\033[0m")
    finally:
        c.close()


if __name__ == "__main__":
    main()
