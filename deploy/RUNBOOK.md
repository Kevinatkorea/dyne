# 다인스케치 배포 런북 — dy.mostvisual.co.kr

> 대상 서버 **49.247.41.172** (Ubuntu 24.04, 공용 — mostvisual / deleteit / bookdream /
> law / eventory / dongbang 등 10개 이상 운영 중)
> 앱 경로 `/home/website/dy.mostvisual.co.kr` · 포트 **3410** · PM2 `dynesketch-web` · DB `dyne`

이 서버는 **root SSH 로그인이 비활성**이고 `website` 계정에는 sudo 권한이 없습니다.
`su -l` 로만 root 가 됩니다. 따라서 절차는 두 파트로 나뉩니다.

- **A. root 작업 (1회)** — DB 생성 · Apache vhost · 인증서
- **B. website 작업** — 코드 배포 (자동화됨, `python scripts/deploy.py`)

---

## 0. 사전 조건 — DNS

```
dy.mostvisual.co.kr  A  49.247.41.172
```

**인증서 발급 전에 전파되어 있어야 합니다.** (dnszi 콘솔)
DNS 없이도 앱 배포와 :80 vhost 설치까지는 가능하고, 인증서만 나중에 발급하면 됩니다.

향후 정식 도메인 전환 시:
```
dynesketch.co.kr  A  49.247.41.172        # 현재는 CloudFront(13.225.x)를 가리킴
```
전환 후 vhost `ServerName`·인증서·`SITE_URL`·`seo.canonical` 4곳을 바꾸고 재배포합니다.

---

## A. root 작업 (1회)

### 자동
```bash
# scripts/.root_secret 에 root 비밀번호를 한 줄로 저장한 뒤
python scripts/deploy.py --bootstrap        # 클론 + .env + DB용 SQL 생성
python scripts/deploy.py --root-setup       # DB 생성 + :80 vhost
python scripts/deploy.py --root-setup --ssl # DNS 전파 후 — 인증서 + :443 vhost
```

### 수동 (서버 콘솔에서)
```bash
su -l

# A-1. DB · 계정
mysql < /home/website/dy.mostvisual.co.kr/deploy/_setup_db.filled.sql
mysql -e "SHOW DATABASES LIKE 'dyne'"

# A-2. :80 vhost
cp /home/website/dy.mostvisual.co.kr/deploy/dy.mostvisual.co.kr.conf \
   /etc/apache2/sites-enabled/
apache2ctl configtest        # ★ "Syntax OK" 아니면 중단하고 파일 삭제
systemctl reload apache2     # restart 아님

# 챌린지 경로 확인
echo probe > /home/website/dy.mostvisual.co.kr/webroot/.well-known/acme-challenge/_probe
curl http://dy.mostvisual.co.kr/.well-known/acme-challenge/_probe    # → probe

# A-3. 인증서 + :443 vhost
certbot certonly --webroot -w /home/website/dy.mostvisual.co.kr/webroot \
        -d dy.mostvisual.co.kr --non-interactive --agree-tos -m pplanit2024@gmail.com
cp /home/website/dy.mostvisual.co.kr/deploy/dy.mostvisual.co.kr-le-ssl.conf \
   /etc/apache2/sites-enabled/
apache2ctl configtest && systemctl reload apache2
```

> ⚠️ `certbot --apache` 금지 (다른 vhost 의 ProxyPass 를 건드린 전례).
> `ports.conf` 에 Listen 추가 금지. 이웃 vhost 파일은 절대 수정하지 않습니다.

---

## B. 코드 배포

배포는 **GitHub 경유**입니다. 로컬 변경을 먼저 push 해야 서버에 반영됩니다.

```bash
git push                                # 먼저 push
python scripts/deploy.py --seed         # 최초 1회 — 초기 데이터 시드 포함
python scripts/deploy.py                # 이후 재배포
```

`deploy/deploy.sh` 가 서버에서 수행하는 일:
git reset --hard → `npm ci` → 스키마 적용 → (시드) → JSX 사전 컴파일 → PM2 리로드
→ `/api/health` 200 확인 → **이웃 서비스 6곳 무영향 검증**.

---

## 초기 관리자 계정

`--bootstrap` 이 `server/.env` 를 만들면서 무작위 비밀번호를 출력합니다.
확인:
```bash
python scripts/deploy.py --cmd "grep SEED_ADMIN /home/website/dy.mostvisual.co.kr/server/.env"
```

- 로그인: `https://dy.mostvisual.co.kr/admin/`
- 로그인 후 **[관리자 계정] → 내 비밀번호 변경** 을 즉시 실행하세요.

---

## 운영 명령

```bash
python scripts/deploy.py --logs                       # PM2 로그
python scripts/deploy.py --cmd "pm2 list"             # 프로세스 상태
python scripts/deploy.py --cmd "pm2 restart dynesketch-web"
python scripts/deploy.py --cmd "bash /home/website/dy.mostvisual.co.kr/deploy/backup.sh"
```

### 백업 자동화 (권장)
```bash
python scripts/deploy.py --cmd \
  "(crontab -l 2>/dev/null; echo '50 4 * * * bash /home/website/dy.mostvisual.co.kr/deploy/backup.sh >> /home/website/dy.mostvisual.co.kr/logs/backup.log 2>&1') | crontab -"
```
DB 덤프 + 업로드 이미지를 매일 04:50 에 `backups/` 로, 14일 보관합니다.
관리자 화면의 **[백업·복원]** 은 콘텐츠를 JSON 으로 내려받는 별도 수단입니다.

---

## 데이터가 어디에 있나

| 대상 | 위치 | 백업 |
|---|---|---|
| 견적요청 · 포트폴리오 메타 · 설정 · 방문통계 | MariaDB `dyne` | `backup.sh` 덤프 |
| 관리자가 업로드한 이미지 | `uploads/` (레포 밖) | `backup.sh` tar |
| 기존 포트폴리오 원본 이미지 | `resource/` (git 관리) | GitHub |

`uploads/` 를 레포 밖에 둔 이유: `git reset --hard` 로 배포하므로 레포 안에 있으면 지워집니다.

---

## 주의사항 (이 서버 고유)

- **sudo 없음** → root 작업은 `su -l` 로만. `apt install` 금지.
- **포트 3410** 은 이 앱 전용. 이미 쓰이는 포트: 3007 3200 3210 3300 4210 8100 8200 8210 9876.
- **MariaDB 는 공용**입니다. `dyne_app` 계정은 `dyne` 스키마 권한만 갖습니다.
- 배포 스크립트는 매번 **이웃 서비스 6곳**을 확인하고, 하나라도 죽으면 실패로 끝납니다.
- `pm2 save` 를 반드시 실행합니다 (`Linger=yes` 라 재부팅 후에도 살아납니다).
