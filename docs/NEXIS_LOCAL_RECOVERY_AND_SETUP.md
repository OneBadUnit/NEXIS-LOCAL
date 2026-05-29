# NEXIS LOCAL — Recovery & Setup Playbook

**Purpose:** Rebuild NEXIS-LOCAL from GitHub on a fresh Windows machine,
or restore a working environment after losing AI assistant access.

**Last verified:** 2026-05-29  
**Stack:** FastAPI (Python 3.11) + React CRA (Node 24) + SQLite + Ollama 0.24 + NEXIS Companion

---

## Table of Contents

1. [Required Folders](#1-required-folders)
2. [Required Runtimes](#2-required-runtimes)
3. [GitHub Clone / Pull Process](#3-github-clone--pull-process)
4. [Backend Setup](#4-backend-setup)
5. [Frontend Setup](#5-frontend-setup)
6. [Ollama Setup](#6-ollama-setup)
7. [NEXIS Companion Setup](#7-nexis-companion-setup)
8. [Environment Files](#8-environment-files)
9. [Startup Procedure](#9-startup-procedure)
10. [Common Failures and Fixes](#10-common-failures-and-fixes)
11. [Restore Checklist](#11-restore-checklist)
12. [What NOT to Commit](#12-what-not-to-commit)

---

## 1. Required Folders

The project root on the developer machine is:

```
D:\ARC NEXUS LLC\NEXIS-LOCAL\
```

This path is not hard-coded in application logic except for two defaults that
are overridable via `.env`:

- `NEXIS_TESSERACT_PATH` in `backend/app/core/config.py` defaults to
  `D:\ARC NEXUS LLC\NEXIS\Tesseract-OCR\tesseract.exe`

If cloning to a different path, override this variable in `backend/.env` (see
Section 8).

### Project structure (top level)

```
NEXIS-LOCAL/
├── backend/          Python FastAPI app
├── bridge/           Go source for NEXIS Companion
├── frontend/         React CRA app
├── docs/             Project documentation
├── assets/           Static assets
└── tmp/              Temp working directory (auto-created at runtime)
```

---

## 2. Required Runtimes

| Runtime | Verified version | Install source |
|---|---|---|
| Python | 3.11.0 | https://www.python.org/downloads/ |
| Node.js | 24.14.1 | https://nodejs.org/ |
| npm | 11.11.0 | Bundled with Node.js |
| Go | 1.26.3 | https://go.dev/dl/ — only needed to BUILD the Companion from source |
| Ollama | 0.24.0 | https://ollama.com/download |

**Python version note:** `requirements.txt` packages were resolved against
Python 3.11. Using 3.12+ may require package version adjustments. Use 3.11
unless you have a specific reason to upgrade.

**Go note:** Go is only required if you need to build `NEXIS Companion.exe`
from source (see Section 7). Normal setup uses a pre-built binary.

---

## 3. GitHub Clone / Pull Process

### Fresh clone

```bat
cd "D:\ARC NEXUS LLC"
git clone https://github.com/OneBadUnit/NEXIS.git NEXIS-LOCAL
cd NEXIS-LOCAL
```

### Pull latest changes into an existing clone

```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL"
git pull origin main
```

### What the repository does NOT contain

- Python virtual environment (`venv/`)
- `node_modules/`
- `nexis.db` (SQLite database — auto-created on first backend start)
- `.env` files (never committed — see Section 8)
- Model weights (managed by Ollama — see Section 6)
- Pre-built `NEXIS Companion.exe` (download from releases or build locally)

---

## 4. Backend Setup

All backend commands run from `D:\ARC NEXUS LLC\NEXIS-LOCAL\backend\`.

### 4.1 Create a virtual environment

```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\backend"
python -m venv venv
```

### 4.2 Activate the virtual environment

```bat
venv\Scripts\activate
```

You should see `(venv)` in your prompt. All subsequent pip and uvicorn
commands must be run with the venv active.

### 4.3 Install Python dependencies

```bat
pip install -r requirements.txt
```

`requirements.txt` is at `backend/requirements.txt`. This single command
installs all dependencies including:

- `fastapi==0.110.0` + `uvicorn==0.29.0` — web server
- `sqlalchemy==2.0.30` — ORM / SQLite
- `pymupdf==1.23.26` — PDF extraction
- `pytesseract==0.3.10` + `Pillow==10.2.0` + `opencv-python-headless==4.9.0.80` — OCR
- `python-docx==1.1.0` — DOCX extraction
- `beautifulsoup4==4.12.3` + `trafilatura==1.12.2` — HTML/article extraction
- `faster-whisper==1.0.3` — audio/video transcription
- `yt-dlp==2024.03.10` + `youtube-transcript-api==0.6.1` — YouTube
- `pydantic-settings==2.2.1` — settings from `.env`

### 4.4 Create the backend .env file

```bat
copy NUL .env
```

Then edit `.env` and add variables (see Section 8.1 for the full list).

The minimum required `.env` to start the backend locally:

```env
LLM_MODEL=qwen2.5:7b
OLLAMA_URL=http://localhost:11434
```

Everything else has working defaults for local mode.

### 4.5 Start the backend

```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\backend"
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend runs on **port 8000**.

Verify it is running by visiting: `http://localhost:8000/`

Expected response:

```json
{"status": "ARC-NEXUS backend running", ...}
```

**Critical:** uvicorn must be started from the `backend/` directory. Starting
it from any other directory causes `ModuleNotFoundError: No module named 'app'`
(see Section 10).

---

## 5. Frontend Setup

All frontend commands run from `D:\ARC NEXUS LLC\NEXIS-LOCAL\frontend\`.

### 5.1 Install npm dependencies

```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\frontend"
npm install
```

`package.json` is at `frontend/package.json`. This installs all dependencies
including:

- `react@^19.2.5` + `react-dom`
- `react-scripts@5.0.1` (Create React App)
- `axios@^1.15.0`
- `@supabase/supabase-js@^2.105.3`
- `electron@^41.2.1` (desktop wrapper)
- `concurrently@^9.2.1`

### 5.2 Create the frontend .env file

```bat
copy frontend\.env.example frontend\.env
```

Then edit `frontend/.env` with real values (see Section 8.2).

### 5.3 Start the frontend (browser mode)

```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\frontend"
npm start
```

The frontend runs on **port 3000**.

Visit: `http://localhost:3000/`

### 5.4 Start the frontend (Electron desktop app)

```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\frontend"
npm run dev
```

This uses `concurrently` to start `npm start` and `electron .` together.
The Electron window waits for the React dev server to respond before opening.

### 5.5 CRA proxy

`frontend/package.json` contains:

```json
"proxy": "http://localhost:8000"
```

This means in development, any `fetch("/collect/process")` call from the
React app is proxied to the FastAPI backend on port 8000 automatically.
**The backend must already be running** before you start the frontend.

---

## 6. Ollama Setup

### 6.1 Install Ollama

Download and install from: `https://ollama.com/download`

On Windows, the installer places the Ollama binary at:

```
C:\Users\<YourName>\AppData\Local\Programs\Ollama\ollama.exe
```

### 6.2 Start Ollama

After installation, Ollama typically runs as a background service automatically.

To start it manually:

```bat
ollama serve
```

Or: find **Ollama** in the system tray and ensure it shows as running.

### 6.3 Verify Ollama is running

```bat
ollama list
```

Expected: a table of installed models. If you get a connection error, Ollama
is not running.

```bat
curl http://localhost:11434/
```

Expected: `Ollama is running`

### 6.4 Pull required models

These are the models NEXIS uses. Pull both:

```bat
ollama pull qwen2.5:7b
ollama pull llava:13b
```

**`qwen2.5:7b`** — Primary LLM. Used for all Summarise, Create, and Understand
operations. Referenced in `config.py` as `LLM_MODEL`. ~4.7 GB.

**`llava:13b`** — Vision model. Used for image description when
`VISION_ENABLED=True`. Referenced in `config.py` as `NEXIS_VISION_MODEL`.
~8.0 GB.

### 6.5 Verify models are available

```bat
ollama list
```

Both `qwen2.5:7b` and `llava:13b` must appear in the output.

### 6.6 About model sizes

| Model | Size | Required for |
|---|---|---|
| `qwen2.5:7b` | ~4.7 GB | All LLM operations — required |
| `llava:13b` | ~8.0 GB | Vision/image — required only when `VISION_ENABLED=True` |

---

## 7. NEXIS Companion Setup

### 7.1 What the Companion is

NEXIS Companion is a compiled Go binary that runs a local HTTP server on
**port 8765**. It provides Ollama lifecycle management: detection, startup,
restart, model downloads, and diagnostics.

> **Phase A change (2026-05-29):** AI generation (Create / Refine) now goes
> directly from the browser to Ollama at `localhost:11434` via
> `generateDirectOllama()` in `bridge.js`. The Companion is **optional** for
> users who manage Ollama independently. It is **recommended** for first-time
> setup and for users who want one-click Ollama management and diagnostics.

The Companion handles:
- Checking whether Ollama is installed and where it lives
- Starting and restarting Ollama
- Downloading and listing models
- Reporting diagnostics (GPU, version, model list)

The frontend (`frontend/src/lib/bridge.js`) calls the Companion at
`localhost:8765` for management operations, and calls Ollama directly at
`localhost:11434` for generation.

### 7.2 Getting the binary

**Option A — Download pre-built (recommended)**

Download `NEXIS Companion.exe` from the GitHub releases page:

```
https://github.com/OneBadUnit/NEXIS/releases/download/companion-v0.1.0/NEXIS.Companion.exe
```

Place it anywhere convenient — it is a standalone executable with no installer.

**Option B — Build from source**

Requires Go 1.26+ installed. From the `bridge/` directory:

```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\bridge"
build.bat
```

Output: `bridge/dist/windows/NEXIS Companion.exe`

### 7.3 Starting the Companion

Double-click `NEXIS Companion.exe`.

A console window opens. Keep it open (minimise is fine — do not close it).

Or from a terminal:

```bat
"NEXIS Companion.exe"
```

The Companion starts on **port 8765** and prints status to the console.

### 7.4 Verify the Companion is running

```bat
curl http://localhost:8765/health
```

Expected: a JSON object showing companion and Ollama status.

### 7.5 How the frontend talks to the Companion

`frontend/src/lib/bridge.js` hardcodes:

```js
export const BRIDGE_DEFAULT_URL = "http://localhost:8765";
```

No environment variable needed. The frontend always calls `localhost:8765`.

---

## 8. Environment Files

### 8.1 Backend — `backend/.env`

`config.py` reads this file via `pydantic-settings`. The file is never
committed (`.env` is git-ignored).

**Full variable list with defaults and notes:**

```env
# ── Model config ──────────────────────────────────────────────
LLM_MODEL=qwen2.5:7b
# Must match exactly what `ollama list` shows.

OLLAMA_URL=http://localhost:11434
# Change only if Ollama is running on a non-default port.

NEXIS_VISION_MODEL=llava:13b
# Must match exactly what `ollama list` shows.
# Only used when VISION_ENABLED=True.

# ── Feature flags (all default False) ─────────────────────────
WHISPER_ENABLED=False
# Set True to enable audio/video transcription via faster-whisper.

OCR_ENABLED=False
# Set True to enable Tesseract OCR for images and scanned PDFs.

VISION_ENABLED=False
# Set True to enable image description via llava:13b.

YOUTUBE_INGESTION_ENABLED=False
# Set True to enable YouTube download via yt-dlp.

NEXIS_HOSTED_MODE=False
# Keep False for local development. True restricts certain features.

# ── OCR path ──────────────────────────────────────────────────
NEXIS_TESSERACT_PATH=D:\ARC NEXUS LLC\NEXIS\Tesseract-OCR\tesseract.exe
# Override if your Tesseract is installed elsewhere.
# Only needed when OCR_ENABLED=True.

# ── Database (optional) ───────────────────────────────────────
DATABASE_URL=
# Leave empty to use local SQLite (nexis.db). App works out of the box.
# Set to a PostgreSQL URL for production.

# ── Other (not active in local mode) ──────────────────────────
REDIS_URL=
OPENAI_API_KEY=
FRONTEND_URL=
```

**Minimum `.env` to start locally:**

```env
LLM_MODEL=qwen2.5:7b
OLLAMA_URL=http://localhost:11434
```

### 8.2 Frontend — `frontend/.env`

An example file exists at `frontend/.env.example`. Copy it to `frontend/.env`
and fill in real values.

```env
# Backend API base URL
REACT_APP_API_BASE_URL=https://your-backend.onrender.com

# Supabase variables — no longer required for local operation (Phase 1 auth removal, 2026-05-29)
# The Supabase auth gate has been replaced with LOCAL_USER/LOCAL_PROFILE in AppLayout.jsx v009.
# These may be left blank for local use. NexusDashboard still imports supabase for
# the app announcements panel — this call fails silently with a null fallback if the
# values are absent. Phase 2 cleanup will remove this import.
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
```

**For local development:**
`REACT_APP_API_BASE_URL` is optional in local dev — the CRA proxy setting
in `package.json` routes API calls to `localhost:8000` automatically when
running `npm start` on `localhost`.

Supabase env vars may be left blank or omitted entirely. The app will compile
and run without them.

**For production (Vercel):**
`REACT_APP_API_BASE_URL` must be set to the Render backend URL in Vercel
project settings → Environment Variables.

---

## 9. Startup Procedure

There is no bundled startup `.bat` in the repository root. The three
processes must be started manually in three terminals. Start them in this order:

### Terminal 1 — Ollama

Ollama may already be running as a Windows service. Verify first:

```bat
ollama list
```

If it is not running:

```bat
ollama serve
```

Or start via the Ollama system tray icon.

### Terminal 2 — NEXIS Companion (optional)

> **Optional:** The Companion is recommended for first-time setup and for
> Ollama lifecycle management. If Ollama is already running with a model,
> AI generation works without the Companion.

```bat
"D:\ARC NEXUS LLC\NEXIS Companion.exe"
```

(Or wherever you placed the binary.)

Wait until the console shows the Companion is ready.

### Terminal 3 — Backend

```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\backend"
venv\Scripts\activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Wait for: `Application startup complete.`

### Terminal 4 — Frontend

```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\frontend"
npm start
```

Wait for: `Compiled successfully!`

Then open: `http://localhost:3000/`

### Port summary

| Service | Port |
|---|---|
| FastAPI backend | 8000 |
| React frontend | 3000 |
| NEXIS Companion | 8765 |
| Ollama | 11434 |

---

## 10. Common Failures and Fixes

### `ModuleNotFoundError: No module named 'app'`

**Cause:** uvicorn was started from the wrong directory (not `backend/`).

**Fix:**
```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\backend"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The working directory must be `backend/` so that `app/` is a top-level
package relative to the Python path.

---

### `ModuleNotFoundError: No module named 'fastapi'` (or any other package)

**Cause:** The virtual environment is not activated, or `pip install -r requirements.txt`
was not run.

**Fix:**
```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\backend"
venv\Scripts\activate
pip install -r requirements.txt
```

---

### `npm start` fails with `Cannot find module`

**Cause:** `npm install` was not run after cloning, or `node_modules` was
deleted.

**Fix:**
```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\frontend"
npm install
```

---

### `package.json not found` or npm command fails from wrong directory

**Cause:** npm was run from `NEXIS-LOCAL/` root instead of `frontend/`.

**Fix:** All npm commands must run from `frontend/`:
```bat
cd "D:\ARC NEXUS LLC\NEXIS-LOCAL\frontend"
npm install
npm start
```

---

### Frontend shows `[NEXIS API] REACT_APP_API_BASE_URL is not set`

**Cause:** `.env` file missing in `frontend/`, or
`REACT_APP_API_BASE_URL` not defined.

**Fix:** Create `frontend/.env` from the example:
```bat
copy "D:\ARC NEXUS LLC\NEXIS-LOCAL\frontend\.env.example" "D:\ARC NEXUS LLC\NEXIS-LOCAL\frontend\.env"
```
Then edit `.env` and set `REACT_APP_API_BASE_URL`.

In local dev, the CRA proxy handles routing without this variable when running
on `localhost` — but the console warning will persist if unset.

---

### Ollama not running — LLM calls fail

**Symptoms:** Backend starts fine but all Understand/Create/Collect operations
fail or hang.

**Verify:**
```bat
curl http://localhost:11434/
```

Expected: `Ollama is running`

**Fix:**
```bat
ollama serve
```

Or restart via the Ollama system tray icon.

---

### `llm_service` errors — model not found

**Cause:** The model named in `LLM_MODEL` is not installed in Ollama.

**Verify:**
```bat
ollama list
```

**Fix:**
```bat
ollama pull qwen2.5:7b
```

---

### NEXIS Companion not reachable — frontend shows companion error

**Symptoms:** The frontend Diagnostics overlay shows "Companion not running"
or bridge calls fail.

**Verify:**
```bat
curl http://localhost:8765/health
```

**Fix:** Start or restart `NEXIS Companion.exe`. If the console window was
closed, re-open the executable.

---

### CORS errors in browser console

**Cause:** The backend CORS allowed origins list does not include the frontend
origin.

For local dev, `http://localhost:3000` is already in the allowed origins in
`backend/app/main.py`. This error should not occur in normal local setup.

If running the frontend on a different port or domain, add the origin via
the `FRONTEND_URL` environment variable in `backend/.env`:

```env
FRONTEND_URL=http://localhost:3001
```

---

### Python interpreter mismatch (wrong Python version activated)

**Cause:** Multiple Python versions installed; `venv` was created with the
wrong one.

**Fix:** Recreate the venv using the explicit Python 3.11 binary:
```bat
py -3.11 -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

---

### OCR not working / Tesseract not found

**Cause:** `OCR_ENABLED=True` but `NEXIS_TESSERACT_PATH` points to a path
that does not exist on this machine.

**Fix:** Install Tesseract and update `backend/.env`:
```env
OCR_ENABLED=True
NEXIS_TESSERACT_PATH=C:\path\to\your\tesseract.exe
```

Tesseract for Windows: `https://github.com/UB-Mannheim/tesseract/wiki`

---

## 11. Restore Checklist

Step-by-step from a fresh Windows machine to a working local NEXIS instance.

```
[ ] 1.  Install Python 3.11 from python.org
[ ] 2.  Install Node.js 24 (includes npm) from nodejs.org
[ ] 3.  Install Ollama from ollama.com/download
[ ] 4.  Clone the repository:
            git clone https://github.com/OneBadUnit/NEXIS.git NEXIS-LOCAL
[ ] 5.  Download NEXIS Companion.exe from GitHub releases
[ ] 6.  Backend: create and activate venv
            cd backend
            python -m venv venv
            venv\Scripts\activate
[ ] 7.  Backend: install dependencies
            pip install -r requirements.txt
[ ] 8.  Backend: create .env with LLM_MODEL and OLLAMA_URL
[ ] 9.  Frontend: install dependencies
            cd frontend
            npm install
[ ] 10. Frontend: create .env from .env.example (Supabase vars may be left
         blank — auth gate removed in Phase 1, 2026-05-29; see Section 8.2)
[ ] 11. Pull required Ollama models:
            ollama pull qwen2.5:7b
            ollama pull llava:13b
[ ] 12. Start Ollama (verify with: curl http://localhost:11434/)
[ ] 13. Start NEXIS Companion.exe (verify with: curl http://localhost:8765/health)
[ ] 14. Start backend:
            cd backend && venv\Scripts\activate
            uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
            (verify: http://localhost:8000/)
[ ] 15. Start frontend:
            cd frontend
            npm start
            (verify: http://localhost:3000/)
[ ] 16. In the browser, open Diagnostics overlay and confirm:
            - Companion: connected
            - Ollama: running
            - Model: qwen2.5:7b available
[ ] 17. Test a Collect operation with a simple URL to confirm end-to-end
         ingestion and LLM response are working.
```

---

## 12. What NOT to Commit

These must never appear in the Git repository:

| Path | Reason |
|---|---|
| `backend/venv/` | Machine-specific Python environment |
| `frontend/node_modules/` | Reconstructed by `npm install` |
| `backend/.env` | Contains secrets and machine-specific paths |
| `frontend/.env` | Contains API base URL and any configured keys |
| `backend/nexis.db` | Local database — user data, not source |
| `tmp/` | Temporary processing files |
| `bridge/dist/` | Build output — not source |
| `*.pyc` / `__pycache__/` | Python bytecode |

### Verify your .gitignore

Before committing, confirm the following are in `.gitignore`:

```
venv/
node_modules/
.env
*.db
tmp/
__pycache__/
*.pyc
bridge/dist/
```

`.env.example` files are safe to commit — they contain no real secrets.
