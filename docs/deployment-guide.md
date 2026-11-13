# Deployment Guide – Smart CRM (Mekong Mobile) · Flow L2: Warranty request intake and classification

Student: INTHAXAY Vilaiphone – 237480201IS06 · Track SE · Release: tag `v1.0`

This guide lets a person who has never seen the project start the whole system on a clean machine
with **two commands**, without asking the author anything. Everything below was run on the author's
machine (Windows 11 + Docker Desktop 4.99.0); screenshots are in `docs/screenshots/`
(`docker-compose-ps.png`, `docker-health.png`, `docker-npm-test-1.png`, `docker-npm-test-2.png`, `docker-web-login.png`, `docker-web-tao-phieu.png`).

What starts:

| Service | What it is | URL on your machine |
|---|---|---|
| `app` | REST API (Node.js 24 + Express 5) with a SQLite database stored in the Docker volume `appdata` | http://localhost:3000 |
| `web` | User interface (React 18 built by Vite, served by nginx) – screens M1 intake, M2 ticket list, M3 ticket detail | http://localhost:5173 |

There is no separate database server: SQLite is a single file inside the volume (see TD-12 in
`docs/thay-doi-thiet-ke.md`). The database schema and the sample data are created automatically every
time the `app` container starts.

---

## 1. Requirements

| Software | Version tested | Check with |
|---|---|---|
| Docker Desktop (Windows / macOS) or Docker Engine (Linux) | Docker Desktop 4.99.0 on Windows 11 (WSL 2 backend), Compose v2 | `docker --version` and `docker compose version` |
| Git | any recent version | `git --version` |
| Free ports | `3000` (API) and `5173` (UI) | see Troubleshooting if they are busy |
| Disk / RAM | about 1 GB free disk for images, 4 GB RAM | – |

Node.js does **not** need to be installed on the host – it runs inside the containers.
On Windows, if Docker Desktop is not installed yet, the quickest way is (PowerShell as Administrator):
`wsl --install --no-distribution`, then `winget install -e --id Docker.DockerDesktop`, then restart the computer.
On Windows, Docker Desktop must show **"Engine running"** before you run the commands.

## 2. Setup steps

```bash
git clone --branch v1.0 https://github.com/VilaiphoneINTHAXAY/smartcrm-237480201is06-tiep-nhan-bao-hanh.git
cd smartcrm-237480201is06-tiep-nhan-bao-hanh
```

Then the **two commands** that start the system:

```bash
cp .env.example .env
docker compose up -d --build
```

- `cp` also works in Windows PowerShell (it is an alias of `Copy-Item`). In the old `cmd.exe` use `copy .env.example .env`.
- The first build downloads the base images `node:24-alpine` and `nginx:1.27-alpine` and takes about 2–5 minutes. Later starts take a few seconds.
- `web` waits until `app` reports **healthy**, so the UI never starts against an API that is not ready.

Stop the system: `docker compose down` (keeps the data) · Reset everything including the database: `docker compose down -v`.

## 3. Environment variables

All variables live in `.env` (copied from `.env.example`). **No variable is secret** – the repository
contains no passwords, keys or connection strings, and `.env` is in `.gitignore`.
The default values work as they are; you do not need to edit anything.

| Variable | Default | Used by | Meaning |
|---|---|---|---|
| `PORT` | `3000` | API (when run without Docker) | Port the API listens on. In Docker it is fixed to `3000` inside the container. |
| `DB_PATH` | `data/smartcrm.db` | API (without Docker) | SQLite file. In Docker it is forced to `/app/data/smartcrm.db` (inside the `appdata` volume). |
| `SESSION_TIMEOUT_MINUTES` | `30` | API | Login session expires after this many idle minutes (NFR-06). Must be an integer 1–1440. |
| `FRONTEND_ORIGIN` | `http://localhost:5173` | API | Origins allowed by CORS, comma separated. `*` is rejected at start-up. In Docker it is set automatically to `http://localhost:${WEB_PORT}`. |
| `DEMO_PASSWORD` | `Demo@123` | migrate | Password given to the three sample accounts when the database is created. Sample data only. |
| `APP_PORT` | `3000` | docker compose | Port of the API **on your machine**. |
| `WEB_PORT` | `5173` | docker compose | Port of the UI **on your machine**. |

If a value is invalid (for example `FRONTEND_ORIGIN=*` or `PORT=abc`), the API stops immediately and
prints which variable is wrong (`src/backend/config.js`); `docker compose ps` will then show `app`
restarting instead of healthy.

## 4. Sample data

Loaded automatically on every start by `src/backend/migrate.js` from `migrations/` and `seeds/`.
Running it again does not duplicate rows (`INSERT OR IGNORE` + `UNIQUE` columns + table `schema_migration`).

| Table | Rows | Content |
|---|---|---|
| `app_user` | 3 | `nv01`, `nv02` – intake staff (A1) · `ql01` – warranty centre manager (A2). Password: `Demo@123` |
| `customer` | 3 | phones `0901234567`, `0912345678`, `0987654321` |
| `device` | 3 | Samsung Galaxy A55 (in warranty), iPhone 13 (warranty expired), Xiaomi Redmi Note 13 (no purchase date → *unverified*) |
| `issue_category` | 5 | Hardware, Software, Connectivity, Accessories/Appearance, Other – with keywords and priority |
| `ticket` | 0 | created by you during the check below |

Passwords are stored as `scrypt` hashes with a random salt per account, never in plain text.

## 5. Verify it works

Run these after `docker compose up -d --build` (one per line):

```bash
docker compose ps
```
Expected: both `app` and `web` show `Up … (healthy)`. If you see `(health: starting)`, wait 20 seconds and run it again.

```bash
curl http://localhost:3000/health
```
Expected: `{"status":"ok","db":"up"}`. On Windows PowerShell use `curl.exe` (plain `curl` is an alias of `Invoke-WebRequest`).
`/health` runs `SELECT 1` against the database, so it answers `503 {"status":"error","db":"down"}` if the database is broken.

```bash
curl http://localhost:3000/api/tickets
```
Expected: `401` `{"error":"CHUA_DANG_NHAP",…}` – every business API requires login.

```bash
docker compose exec app npm test
```
Expected: the automated test suite runs **inside the container** and ends with `# fail 0`.

In the browser, open http://localhost:5173:

1. Log in as `nv01` / `Demo@123`.
2. Tab **Tạo phiếu bảo hành** → phone `0987654321` → **Tra cứu**.
3. Pick device *Xiaomi Redmi Note 13 – IMEI 867530912345678*, description `Máy không lên nguồn` → **Lưu phiếu**.
4. You should see ticket `BH-0001`, category *Phần cứng · Cao*, warranty *Chưa xác minh*.
5. Log out, log in as `ql01` / `Demo@123`, open the ticket and approve the warranty.

### Clean-machine test (what the author ran before tagging v1.0)

```bash
docker compose down -v
docker system prune -af --volumes
# clone the tag into a NEW empty folder, then:
cp .env.example .env
docker compose up -d --build
docker compose ps
curl http://localhost:3000/health
docker compose exec app npm test
```

## 6. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `docker: command not found` / `'docker' is not recognized` | Docker is not installed, or the terminal was opened before installing | Install Docker Desktop, start it, wait for "Engine running", open a **new** terminal |
| `error during connect … dockerDesktopLinuxEngine` | Docker Desktop is not running | Start Docker Desktop and wait for "Engine running" |
| `Bind for 0.0.0.0:3000 failed: port is already allocated` | Another program (often `npm start` from development) uses the port | Stop that program, or set `APP_PORT=3001` / `WEB_PORT=5174` in `.env`, then `docker compose up -d --build` again (CORS follows `WEB_PORT` automatically) |
| `app` stays `(health: starting)` or `Restarting` | Wrong value in `.env`, or migration failed | `docker compose logs app` – the first lines name the wrong variable |
| UI shows a network / CORS error | UI was built for a different API port | After changing `APP_PORT`, rebuild: `docker compose up -d --build` (the API URL is baked into the UI at build time) |
| Login fails after you changed `DEMO_PASSWORD` | The password is only applied when the database is first created | `docker compose down -v` then start again |
| Want a completely fresh database | – | `docker compose down -v` then `docker compose up -d --build` |

## 7. HTTPS in a real deployment

The prototype runs on `localhost` over plain HTTP. In a real deployment, place the app behind a
reverse proxy (for example nginx, Caddy, or the platform's load balancer) that holds the TLS
certificate and redirects HTTP to HTTPS; the app then reads the `X-Forwarded-Proto` header to know
that the original request was HTTPS (in Express: `app.set('trust proxy', 1)`). The app does not use
cookies – the login token is sent in the `Authorization: Bearer …` header – so no `Secure` cookie flag
is needed. `FRONTEND_ORIGIN` must then list the real `https://` address of the UI.

## 8. Known limits

- Login sessions are kept in the API's memory: restarting the `app` container logs everyone out.
- The UI stores the token in `localStorage` (acceptable for a prototype; the UI never renders user input as HTML).
- One service centre only (TD-08); no SMS/Zalo notifications; holidays are not excluded from the SLA.
- The `npm audit` warnings of Vite/esbuild concern the **development server only**; the `web` image contains only the built static files served by nginx (see `docs/checklist-bao-mat.md`, item 7).
