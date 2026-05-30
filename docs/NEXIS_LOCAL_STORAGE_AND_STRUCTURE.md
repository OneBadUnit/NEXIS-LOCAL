# NEXIS-LOCAL — Storage and Architecture Reference

**Project:** NEXIS-LOCAL  
**Organization:** ARC NEXUS LLC  
**Document Type:** Technical Architecture Reference  
**Last Updated:** 2026-05-29 (Documentation Sync)  
**Audience:** Engineers, AI assistants, technical contributors  

> This is a technical reference document. It documents what exists in the codebase as verified by direct file inspection. Items that could not be verified are explicitly marked.

---

## Section 1 — Project Structure

### Root Layout

```
NEXIS-LOCAL/
├── backend/          FastAPI Python application
├── bridge/           NEXIS Companion (Go binary source)
├── frontend/         React web application
├── docs/             Project documentation
├── assets/           Static assets (ASSUMED — not inspected)
├── tmp/              Temporary media processing directory
├── ARC_CONTEXT.md    Project priorities and coding preferences
├── NEXIS_TREE.md     Repository structure reference
└── README.md         Public-facing project readme
```

---

### `backend/`

FastAPI application. Runs locally on an unspecified port (default FastAPI: `8000`).

```
backend/
├── requirements.txt
└── app/
    ├── main.py                  FastAPI entrypoint, CORS, router registration
    ├── assimilation.py          Ingestion engine router (collect pipeline)
    ├── reconstruction.py        Package generation router (Summary + Creator packages)
    ├── creation.py              Content creation router (format, argument, refine)
    ├── vision.py                Image collect router (OCR + Ollama vision)
    ├── api/
    │   └── routes/
    │       ├── usage.py         Usage counter endpoints
    │       └── system.py        System check + OCR diagnostics
    ├── core/
    │   ├── config.py            Settings model (pydantic-settings, .env backed)
    │   ├── db.py                SQLAlchemy engine + session factory
    │   ├── tiers.py             Plan definitions (all limits set to 99999 locally)
    │   └── usage.py             Usage enforcement logic + DEFAULT_USER_ID
    ├── models/
    │   └── account.py           UserAccount ORM model (tier + usage counters)
    ├── services/
    │   ├── llm_service.py       Ollama HTTP client for text generation
    │   ├── vision_service.py    Ollama vision model client (LLaVA)
    │   ├── doc_intel.py         Document collection brief generator
    │   └── video_intel.py       YouTube video brief generator
    ├── prompts/
    │   ├── summary_package_rules.txt   Rules prepended to Summary Package prompts
    │   └── creator_package_rules.txt   Rules prepended to Creator Package prompts
    └── utils/
        └── gpu_detection.py     Whisper device selection (CUDA vs CPU)
```

**Critical note:** `backend/app/main.py` is the FastAPI entrypoint. All routers are registered there. CORS is configured before any router.

---

### `backend/ingestion/`

Standalone ingestion module. Imported by `app/assimilation.py` and `app/vision.py`.

```
ingestion/
├── __init__.py
├── file_router.py       Routes uploaded files to correct extractor by extension
├── pdf_utils.py         PDF text extraction
├── docx_utils.py        DOCX text extraction
├── ocr_utils.py         Tesseract OCR wrapper + diagnostics
├── url_utils.py         URL fetch, article body extraction (trafilatura + BS4 selector fallback + contamination detection), YouTube routing
├── youtube_utils.py     YouTube transcript + yt-dlp fallback
├── audio_utils.py       Audio transcription (faster-whisper)
└── video_utils.py       Video processing utilities
```

**Temp directory:** `backend/tmp/` — resolved portably via `os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "tmp"))`. Created on startup via `os.makedirs(..., exist_ok=True)`.

---

### `bridge/`

NEXIS Companion source code. Written in Go. Uses Go stdlib only — no external modules.

```
bridge/
├── nexis_bridge.go      Main companion server (all logic)
├── sysproc_windows.go   Windows-specific process management
├── sysproc_unix.go      Unix-specific process management
├── go.mod               Module: nexis-bridge, go 1.26.3
├── build.bat            Windows build script
├── build.sh             Linux/Mac build script
└── README.md
```

Built binary is distributed separately (not stored in Git). Users download:
- Windows: `NEXIS.Companion.exe`
- Linux: `nexis-bridge-linux`

---

### `frontend/`

React application (Create React App). Runs locally on port `3000`.

```
frontend/
├── package.json
├── electron.js          Electron wrapper (loads localhost:3000)
├── vercel.json          ASSUMED — Vercel deployment config remnant
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── robots.txt
└── src/
    ├── index.js                 React entry point
    ├── ArcNexusApp.jsx          Root app component (AcknowledgmentModal + Layout)
    ├── index.css
    ├── context/
    │   └── ArcNContext.jsx      Global React context provider
    ├── layout/
    │   ├── AppLayout.jsx        Auth gate + top-level layout
    │   ├── TopBar.jsx           Navigation bar
    │   └── layout.css
    ├── pages/
    │   ├── NexusDashboard.jsx   Project list + usage display
    │   └── ProjectWorkspace.jsx Full project workflow (collect/create/refine)
    ├── components/              UI overlay components
    ├── api/
    │   ├── api.jsx              FastAPI client + bridge routing
    │   └── system.jsx           System check API wrapper
    ├── lib/
    │   ├── bridge.js            NEXIS Companion client + direct Ollama generation
    │   ├── tiers.js             Frontend tier config (mirrors backend tiers.py)
    │   └── prompts.js           ASSUMED — not inspected
    ├── utils/
    │   └── projectStorage.js    localStorage adapter for projects, raw items, outputs
    └── styles/ + ui/            CSS files
```

---

### `docs/`

```
docs/
├── NEXIS_LOCAL_AI_HANDOFF_SOP.md      AI handoff and onboarding reference
├── NEXIS_LOCAL_STORAGE_AND_STRUCTURE.md  (this document)
└── ai/
    ├── NEXIS_CONTEXT.md               Product identity and philosophy
    └── KNOWN_ISSUES.md                Active bugs, fragile areas, deferred fixes
```

---

## Section 2 — Data Flow

### Collect → Create → Refine: Full Path

```
USER INPUT
│
│  URL / file upload / text paste / image
│
▼
FRONTEND — ProjectWorkspace.jsx
│  Calls collectSource() / analyzeImage() from api.jsx
│  Sends HTTP POST to FastAPI backend
│
▼
BACKEND — app/assimilation.py  (text/URL/file)
          app/vision.py         (images)
│
│  URL path:       ingestion/url_utils.py → article body extraction (trafilatura primary, BS4 selector fallback, contamination detection) or YouTube pipeline
│  File path:      ingestion/file_router.py → routes by extension:
│                    .txt/.md       → direct decode
│                    .pdf           → ingestion/pdf_utils.py
│                    .docx          → ingestion/docx_utils.py
│                    .png/.jpg/etc  → ingestion/ocr_utils.py (Tesseract)
│                    .mp3/.wav/etc  → ingestion/audio_utils.py (faster-whisper)
│                    .mp4/.mov/etc  → ingestion/audio_utils.py (faster-whisper)
│  Image path:     Tesseract OCR + Ollama vision model (llava:13b default)
│  Document path:  services/doc_intel.py → Document Collection Brief via Ollama
│
▼
BACKEND RESPONSE
│  Returns extracted text + optional brief to frontend
│
▼
FRONTEND — localStorage (projectStorage.js)
│  Raw items stored in localStorage under key:
│    nexis_local_arcn_raw_items
│  Keyed by projectId
│
▼
USER SELECTS SOURCES FOR GENERATION
│  In ProjectWorkspace.jsx
│  Selects which raw items feed into the package
│
▼
FRONTEND — api.jsx
│  Determines model config from localStorage (nexis_local_nexis_model_config)
│  If type === "local":
│    Calls runViaOllama() → generateDirectOllama() in bridge.js
│  If type === "provider":
│    Calls FastAPI backend → llm_service.py → external provider
│
▼
AI GENERATION PATH (local mode — Phase A, current):
│
│  FRONTEND
│  └─ bridge.js → generateDirectOllama()
│     └─ POST http://localhost:11434/api/generate
│
│  OLLAMA
│  └─ runs local model (default: qwen2.5:7b)
│  └─ returns generated text
│
│  Returns: response text → bridge → frontend
│
AI GENERATION PATH (provider mode — backend route):
│
│  FRONTEND
│  └─ api.jsx → POST /nexis/convert or similar to FastAPI
│
│  BACKEND
│  └─ reconstruction.py or creation.py
│  └─ llm_service.py → HTTP POST to OLLAMA_URL env var
│  └─ (if OLLAMA_URL not set: raises HTTP 503)
│
▼
GENERATED OUTPUT
│  Returned to frontend as text
│  Stored in localStorage under key:
│    nexis_local_arcn_outputs
│  Keyed by projectId
│
▼
REFINEMENT
│  User selects a previously generated output
│  Sends refinement request with original text + refinement instruction
│  Same generation pipeline applies (local bridge or provider)
│  Refined result replaces or appends to output record in localStorage
│
▼
SAVED OUTPUT
   Persisted in localStorage
   Survives page refresh
   Cleared only via explicit project delete or clearAllProjectStorage()
```

---

### Important Storage Split

**Critical architecture distinction verified in code:**

| Data | Storage Location | File |
|---|---|---|
| Projects list | `localStorage` | `projectStorage.js` |
| Raw items (collected sources) | `localStorage` | `projectStorage.js` |
| Generated outputs | `localStorage` | `projectStorage.js` |
| Model config | `localStorage` | `projectStorage.js` |
| UI navigation state | `localStorage` | `ArcNContext.jsx` |
| Assimilation / reconstruction session state | `localStorage` | `ArcNContext.jsx` |
| User account + usage counters | SQLite (`nexis.db`) | `account.py` |
| User auth session | Local constant (`LOCAL_USER`) in `AppLayout.jsx` | `AppLayout.jsx` v009 |
| User profile | Local constant (`LOCAL_PROFILE`) in `AppLayout.jsx` | `AppLayout.jsx` v009 |

---

## Section 3 — AI Architecture

### Overview

```
FRONTEND (browser / Electron)
│
│  bridge.js — all AI generation routes here
│  getModelConfigWithMigration() reads localStorage for model + endpoint
│
│  type === "local" (primary path):
│  └─ generateDirectOllama() → POST localhost:11434/api/generate
│
▼
OLLAMA (localhost:11434)
│
│  /api/generate  — text generation
│  /api/tags      — model list
│  /api/pull      — model downloads
│
▼
LOCAL MODEL (e.g. qwen2.5:7b)
   Runs on user hardware (CPU or GPU via CUDA)
```

**Optional management path (NEXIS Companion):**

```
FRONTEND bridge.js management functions
│
│  getDiagnostics(), startOllama(), restartOllama(), pullModel(), etc.
│
▼
NEXIS COMPANION (localhost:8765)
│
│  Manages Ollama lifecycle — start, restart, model pulls, diagnostics
│  Does NOT handle generation (Phase A, 2026-05-29)
│
▼
OLLAMA (localhost:11434)
```

### Why All Ollama Generation Calls Route Through `bridge.js`

All frontend code that sends a prompt to Ollama must go through `generateDirectOllama()` in `bridge.js`. Raw `fetch()` calls to `localhost:11434` are forbidden outside `bridge.js`.

**Reasons:**

1. **Centralized call site.** `bridge.js` is the single auditable location for all Ollama calls. Changes to URL, headers, timeout, or error handling apply everywhere automatically.

2. **Legacy config migration.** `getModelConfigWithMigration()` in `bridge.js` migrates any stored model config that pointed at `localhost:8765` (old companion proxy) or other legacy endpoints. This migration must run before generation — not in scattered call sites.

3. **Error handling contract.** `bridge.js` normalizes Ollama errors into the `GENERATION_FAILED` and companion-related error codes used by `DiagnosticsOverlay`. Scattered raw fetch calls would bypass this normalization.

**Prior constraint (pre-Phase A):** Direct browser-to-Ollama was blocked by CORS in strict web contexts. Ollama does not serve `Access-Control-Allow-Origin` headers by default for all callers. In the Electron wrapper and current Ollama versions, direct calls work. `bridge.js` abstracts this — if CORS behavior changes, the fix is in one place.

See Decision Log D-036 (Phase A), D-020 (original Companion decision), D-040 (CORS lesson).

### Companion Endpoints (verified in `nexis_bridge.go`)

| Endpoint | Method | Purpose |
|---|---|---|
| `/health` | GET | Companion status + Ollama reachability |
| `/diagnostics` | GET | Full system state snapshot |
| `/ollama/find` | GET | Search known Ollama install paths |
| `/ollama/start` | POST | Start Ollama if installed |
| `/ollama/restart` | POST | Kill + restart Ollama |
| `/models` | GET | List available Ollama models |
| `/models/pull` | POST | Start async model pull |
| `/models/pull/progress?job=<id>` | GET | SSE stream of pull progress |
| `/generate` | POST | Run prompt through Ollama |
| `/system` | GET | System info (CPU, GPU, paths) |
| `/diagnostics/open-terminal` | POST | Open OS terminal (last resort) |

### Companion CORS Policy (verified in `nexis_bridge.go`)

Trusted origins hardcoded in companion:
- `https://nexis-psi.vercel.app`
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`
- Any `https://*.vercel.app` preview URL

### Model Configuration Storage

Model config is stored in `localStorage` under key `nexis_local_nexis_model_config`.

Fields include:
- `type`: `"local"` or `"provider"`
- `endpoint`: bridge URL (defaults to `http://localhost:8765`)
- `model`: model name string (default: `qwen2.5:7b`)
- `providerName`: for provider mode (ASSUMED — not deeply inspected)

`bridge.js` migrates any stored endpoint pointing to `localhost:11434` to the bridge URL on first access.

---

## Section 4 — Database Structure

### Database File

- **Engine:** SQLite (default) or PostgreSQL (via `DATABASE_URL` env var)
- **Default file:** `nexis.db` in the working directory (auto-created by `init_db()`)
- **ORM:** SQLAlchemy with `declarative_base()`
- **Session factory:** `SessionLocal` from `db.py`
- **Thread safety:** `check_same_thread: False` for SQLite

`init_db()` is called once at application startup via `Base.metadata.create_all(bind=engine)`.

---

### Verified Tables

#### `user_accounts`

Defined in `app/models/account.py`.

| Column | Type | Notes |
|---|---|---|
| `user_id` | String (PK) | `"default"` in single-user phase |
| `tier` | String | Plan key — matches `tiers.py` |
| `project_count` | Integer | Current stored project count |
| `raw_input_count` | Integer | Current stored raw input count |
| `output_count` | Integer | Current stored output count |
| `raw_inputs_this_month` | Integer | Monthly usage counter |
| `actions_this_month` | Integer | Monthly usage counter |
| `billing_cycle_start` | String | ISO date string |
| `updated_at` | DateTime | Auto-updated on write |

**Single-user note:** `DEFAULT_USER_ID = "default"` is hardcoded in `core/usage.py`. All usage operations use this key. There is no per-user isolation at this layer.

---

### Usage Enforcement Rules (verified in `core/usage.py`)

- Deleting items reduces storage counts (`project_count`, `raw_input_count`, `output_count`).
- Deleting **never** reduces monthly counters (`raw_inputs_this_month`, `actions_this_month`).
- Monthly counters reset after 30 days from `billing_cycle_start`.
- All checks and increments are committed atomically per request.
- In NEXIS-LOCAL, all plan limits are `99999` — enforcement runs but never blocks the user.

---

### Tables Not Verified

The following may exist but were not confirmed by direct inspection:

- Any output storage table — `ASSUMED NOT PRESENT`: outputs are stored in `localStorage` per `projectStorage.js`
- Any migrations table — `ASSUMED NOT PRESENT`: schema is created via `create_all`, no Alembic config found

---

## Section 5 — Authentication

### Current Auth System

Authentication is handled locally via hardcoded constants in `AppLayout.jsx`. There is no external authentication service required for NEXIS-LOCAL.

**Verified in:** `frontend/src/layout/AppLayout.jsx` v009 (2026-05-29)

**Local user constants (defined at module scope in `AppLayout.jsx`):**
```js
const LOCAL_USER = { id: "local-user", email: "local@nexis" };
const LOCAL_PROFILE = {
  id: "local-user",
  email: "local@nexis",
  tier: "free",
  bonus_actions: 0,
  first_name: "Local",
  last_name: "User",
  phone: null,
  company: null,
};
```

These constants are passed directly to `NexusDashboard` and `TopBar` on every render. No session check, no network call, no loading state.

**Auth gate status:** Removed. `AppLayout.jsx` v009 does not contain a `SignedOutScreen` gate, `authLoading` state, or any Supabase session check. The app renders immediately on load.

**Sign-in/sign-out UI:** Removed from TopBar. `user={null}` is passed to `TopBar`; the existing `{user && ...}` guard means the email display, Account button, and Sign Out button are all hidden automatically.

**Supabase files:** `auth.js` and `supabase.js` were deleted in the Phase 2 cleanup (2026-05-29). No Supabase files remain in the codebase. `@supabase/supabase-js` remains in `package.json` as an unused package dependency.

**Prior auth architecture (v008 — no longer active):**
- Email + password sign-up and sign-in via `supabase.auth.signInWithPassword`
- Session check on load via `supabase.auth.getSession`
- Auth state change listener via `supabase.auth.onAuthStateChange`
- `authLoading` state blocked entire app render until session resolved
- Hard gate: `if (!user) return <SignedOutScreen>` — no bypass

See Decision Log D-035 for full analysis and rationale.

---

### Current Requirements vs Future Possibilities

**Current — what NEXIS-LOCAL requires:**
- No auth service required
- No internet access required for authentication
- No account required

**Future Possibility Only — NOT Current Architecture:**
- Return of Supabase auth gate for a future hosted product (would require full gate restoration)
- Multi-user local accounts
- JWT-based self-hosted auth

---

## Section 6 — Frontend Architecture

### Startup Sequence

Verified in `ArcNexusApp.jsx` v006 (2026-05-29):

```
App mounts
│
├─ AcknowledgmentModal checks localStorage for version key
│    Key: nexis_local_arcn_ack_version
│    Shows modal if stored version ≠ CURRENT_VERSION (1.0.7)
└─ AppLayout mounts — renders immediately with LOCAL_USER / LOCAL_PROFILE constants
     └─ Renders NexusDashboard directly (no auth check, no loading state)
```

> Note: LogoOverlay and OnboardingOverlay were removed from `ArcNexusApp.jsx` in D-039 (2026-05-29). The component files remain but are not imported. `nexis_local_nexusOnboardingSkipped` localStorage key in `projectStorage.js` migration is a harmless orphan.

### Context Provider

**File:** `src/context/ArcNContext.jsx`  
**Type:** React context (`createContext` + `useContext`)  
**Provider:** `ArcNProvider` wraps the entire application tree from `ArcNexusApp.jsx`

**State owned by `ArcNContext`:**

| State | Type | localStorage key |
|---|---|---|
| `activePage` | string | `nexis_local_arcn_active_page` |
| `activeModule` | string/null | `nexis_local_arcn_active_module` |
| `globalLoading` | boolean | — (ephemeral) |
| `assimilationState` | object | `nexis_local_arcn_assimilation_state` |
| `savedAssimilations` | array | `nexis_local_arcn_saved_assimilations` |
| `reconstructionState` | object | `nexis_local_arcn_reconstruction_state` |

**Note:** `file` field is stripped from `assimilationState` before saving to localStorage (File objects are not serializable).

### localStorage Keys (verified)

All NEXIS-LOCAL localStorage keys use the `nexis_local_` prefix.

| Key | Owner | Contents |
|---|---|---|
| `nexis_local_arcn_active_page` | ArcNContext | Current page name |
| `nexis_local_arcn_active_module` | ArcNContext | Current module name |
| `nexis_local_arcn_assimilation_state` | ArcNContext | Collect form state |
| `nexis_local_arcn_saved_assimilations` | ArcNContext | Saved collect results |
| `nexis_local_arcn_reconstruction_state` | ArcNContext | Package generation state |
| `nexis_local_arcn_projects` | projectStorage.js | All project records |
| `nexis_local_arcn_raw_items` | projectStorage.js | All raw items (all projects) |
| `nexis_local_arcn_outputs` | projectStorage.js | All outputs (all projects) |
| `nexis_local_nexis_model_config` | projectStorage.js / bridge.js | Model + endpoint config |
| `nexis_local_arcn_ack_version` | ArcNexusApp.jsx | Acknowledgment modal version |

**localStorage access is wrapped in try/catch** to handle restricted browser environments (SecurityError).

### API Layer

**File:** `src/api/api.jsx`

- `API_BASE` = value of `REACT_APP_API_BASE_URL` env var; in local dev, CRA proxy routes API calls to `localhost:8000` automatically; `_localDevFallback` is `"http://localhost:8000"`
- All FastAPI calls go through the `request()` helper which parses FastAPI `{ detail: "..." }` error shapes
- AI generation calls route through `bridge.js` in local mode, not through `API_BASE`

**Key exported functions (partial list — not exhaustive):**
- `collectSource()` — POST to assimilation endpoint
- `analyzeImage()` — POST to vision endpoint
- `nexisUnderstand()` — POST to reconstruction endpoint (Summary/Creator package generation)
- `nexisCreate()` — POST to creation endpoint
- `getUsage()` — GET /api/usage
- `syncUsage()` — POST to sync usage counters
- `addProjectUsage()` / `removeProjectUsage()` — project count management
- `systemCheck()` — GET /api/system/check

### Bridge Layer

**File:** `src/lib/bridge.js`

- `BRIDGE_DEFAULT_URL = "http://localhost:8765"` — Companion management URL
- `OLLAMA_DIRECT_URL = "http://localhost:11434"` — direct Ollama generation URL
- `RECOMMENDED_MODEL = "qwen2.5:7b"`
- `getModelConfigWithMigration()` — reads model config from localStorage, migrates legacy endpoint URLs
- `generateDirectOllama()` — sends prompt directly to Ollama at `localhost:11434` (Phase A, current generation path)
- `getCompanionDownload()` — returns platform-appropriate binary download URL

**Active companion management exports:** `getDiagnostics`, `startOllama`, `restartOllama`, `pullModel`, `subscribePullProgress`, `openTerminal`

**Timeouts (verified):**
- Detection: 6000ms
- Generation: 180,000ms (3 minutes)
- Ollama start: 25,000ms

### Routing

There is no React Router. Navigation is state-driven via `activePage` in `ArcNContext`. Page rendering is controlled by conditional logic in `AppLayout.jsx` and `NexusDashboard.jsx`.

### Electron Wrapper

**File:** `frontend/electron.js`

Wraps the React app in an Electron window. Polls `localhost:3000` until the React dev server responds (300ms interval), then loads it in a `BrowserWindow` (1400×900).

---

## Section 7 — Backend Architecture

### FastAPI Entrypoint

**File:** `backend/app/main.py`

- App title: `"ARC-NEXUS Backend"`, version `3.0`
- CORS middleware registered **before** all routers (required for preflight handling)
- All routers registered after CORS

**Active CORS origins (verified):**
- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://nexis-psi.vercel.app` (legacy Vercel — harmless remnant)
- Additional origin via `FRONTEND_URL` env var

### Router Registration (verified in `main.py`)

| Router variable | File | Route prefix / tags |
|---|---|---|
| `assimilation_router` | `app/assimilation.py` | tag: `nexis-ingestion` |
| `vision_router` | `app/vision.py` | tag: `nexis-vision` |
| `understand_router` | `app/reconstruction.py` | tag: `nexis-understand` |
| `create_router` | `app/creation.py` | tag: `nexis-create` |
| `system_router` | `app/api/routes/system.py` | tag: `system` |
| `usage_router` | `app/api/routes/usage.py` | prefix: `/usage` |

**Additional routers** (`projects.py`, `sources.py`, `creation.py` route file, `health.py`) — registration in `main.py` **VERIFY IN CODE** — not confirmed they are all registered.

### Ingestion Engine (`app/assimilation.py`)

- Accepts: URL string, uploaded file
- Routes files by extension via `ingestion/file_router.py`
- Audio/video: duration checked via `ffprobe` (resolved via `shutil.which("ffprobe")` — no hardcoded path)
- Documents: `doc_intel.py` generates a DOCUMENT COLLECTION BRIEF via Ollama
- Returns extracted text + optional brief + optional `warning` field as JSON

**URL article extraction pipeline** (verified in `ingestion/url_utils.py` version 007):
1. **trafilatura** — text-density extraction; primary path for arbitrary news and article URLs; returns clean article body for most news sites without per-site knowledge
2. **BS4 semantic selectors** — fallback; tries `article`, `[role=article]`, `main`, and 12+ common article-body class/id patterns in priority order
3. **Noise-stripped full body** — last resort; always triggers contamination check and always sets a user-visible warning

**Contamination detection:** Extracted URL content is checked against 26 known boilerplate phrases ("Most Popular," "Advertisement," "Latest Articles," etc.) before the response is returned. If ≥3 markers are detected, the `warning` field is set to a user-facing message. The `warning` field is displayed as an amber notice in `ProjectWorkspace.jsx` but does not block collection. If extraction falls back to the full-body path, a warning is always set regardless of marker count.

**trafilatura dependency:** `trafilatura==1.12.2` added to `backend/requirements.txt`. Rationale documented in Decision Log D-028.

**Feature flags that gate ingestion paths (from `config.py`):**
- `WHISPER_ENABLED` — controls audio/video transcription
- `OCR_ENABLED` — controls Tesseract OCR
- `VISION_ENABLED` — controls Ollama vision model
- `YOUTUBE_INGESTION_ENABLED` — controls YouTube pipeline

All default to `False`. Must be set via env vars.

### Package Generation (`app/reconstruction.py`)

- Accepts: `text`, `preset` (summary/creator/explained/analysis), `action`, `option`
- Loads rules from `app/prompts/summary_package_rules.txt` and `app/prompts/creator_package_rules.txt` at startup
- Constructs prompt from preset + action + option + rules
- Calls `llm_service.run_llm()`
- Returns `{ output: str }`

**Summary Package sections (verified in `ProjectWorkspace.jsx`):**  
Core Themes, Strategic Timeline, Institutional Dynamics, Key Findings, Analytical Summary, Open Questions

**Creator Package sections (verified in `ProjectWorkspace.jsx`):**  
Make Engaging, Video Script Framework, Hook Options, Real Quote Pulls, Commentary Lines, Title Suggestions, Keywords

> Titles & Keywords are sent as two separate backend calls but displayed as one UI item ("Titles & Keywords").

### LLM Service (`app/services/llm_service.py`)

- Reads `OLLAMA_URL` from environment (`os.environ.get("OLLAMA_URL", "")`)
- If `OLLAMA_URL` is empty: raises HTTP 503 immediately
- This is intentional — in local mode, generation goes through the companion bridge, not the backend
- In provider/hosted mode: `OLLAMA_URL` must be set explicitly
- Default model: `qwen2.5:7b`
- Generation timeout: 180 seconds
- Temperature: `0.2`, top_p: `0.9`

### Image Pipeline (`app/vision.py`)

Two-artifact output:
- `raw_content`: OCR text from Tesseract (used by Convert/Create)
- `brief`: visual description from Ollama vision model (AI analysis layer)

Graceful fallbacks:
- Tesseract missing → `[OCR UNAVAILABLE]` message, does not crash
- Vision model missing or Ollama offline → `"unavailable"` note, does not crash
- Hosted mode (`NEXIS_HOSTED_MODE=True`) → HTTP 503 blocks all image analysis

Vision model config: reads `NEXIS_VISION_MODEL` from settings, falls back to `VISION_MODEL`, final fallback to `llava:13b`.

### System Check (`app/api/routes/system.py`)

- `GET /api/system/check` returns:
  - Ollama note: "runs on user's machine, not this server"
  - Config file status: `~/.arc_nexus/config.json`
  - OCR diagnostics: executable found, available, path
- Ollama is **not** checked from this endpoint — it is checked by the companion

---

## Section 8 — Companion Architecture

### Purpose

The NEXIS Companion is a standalone Go binary that acts as the local AI health manager. It is **optional** for AI generation (Phase A, 2026-05-29 — generation goes direct to Ollama). It exists because:

1. Users should not need a terminal to manage Ollama (start, restart, check status)
2. The companion handles the full Ollama lifecycle: detection, startup, restart, model pulls, diagnostics
3. DiagnosticsOverlay provides a GUI interface to Companion operations

### Runtime

- Port: `8765` (hardcoded constant `bridgePort`)
- Binds to `localhost` only
- HTTP timeout: 180 seconds
- Ollama start wait: 20 seconds (polls with 1-second intervals)
- Ollama probe timeout: 3 seconds per probe

### Ollama Search Paths (verified per platform)

**Windows:**
- `%USERPROFILE%\AppData\Local\Programs\Ollama\ollama.exe`
- `C:\Program Files\Ollama\ollama.exe`
- `C:\Program Files (x86)\Ollama\ollama.exe`

**macOS:**
- `/usr/local/bin/ollama`
- `/opt/homebrew/bin/ollama`
- `/Applications/Ollama.app/Contents/MacOS/ollama`

**Linux:**
- `/usr/local/bin/ollama`
- `/usr/bin/ollama`

### Startup Behavior

1. Companion process starts
2. HTTP server opens on port `8765`
3. First frontend request triggers Ollama status check
4. If Ollama unreachable: companion can start it via `POST /ollama/start`
5. Startup waits up to 20 seconds for Ollama to become available

### Model Pull Flow

1. Frontend calls `POST /models/pull { model: "qwen2.5:7b" }`
2. Companion creates a pull job, returns job ID
3. Companion calls Ollama `/api/pull` with streaming enabled
4. Companion accumulates progress events in-memory (`pullJob` struct)
5. Frontend polls `GET /models/pull/progress?job=<id>` as SSE stream
6. Events include `{ status, completed, total, done, error }`

### Error Codes Surfaced to Frontend (verified in `bridge.js`)

| Code | Meaning |
|---|---|
| `COMPANION_NOT_RUNNING` | Companion process not reachable |
| `OLLAMA_NOT_INSTALLED` | Ollama binary not found in search paths |
| `OLLAMA_NOT_RUNNING` | Ollama installed but not started |
| `NO_MODELS` | Ollama running but no models loaded |
| `MODEL_NOT_AVAILABLE` | Requested model not in Ollama |
| `GENERATION_FAILED` | LLM call errored or returned empty |

### Platform-Specific Process Management

- `sysproc_windows.go` — Windows process handling (CREATE_NEW_PROCESS_GROUP, etc.)
- `sysproc_unix.go` — Unix process handling

---

## Section 9 — Critical Files

### `backend/app/main.py`

**Why it matters:** FastAPI entrypoint. Controls which routers are active, CORS policy, and startup sequence.  
**What breaks:** Reordering CORS before routers breaks preflight handling. Removing a router removes that entire feature. Wrong CORS origins block frontend requests silently.

### `backend/app/core/config.py`

**Why it matters:** Single source of truth for all runtime configuration. Controls model names, feature flags, database URL, Tesseract path, Ollama URL.  
**What breaks:** Changing `OLLAMA_URL` to a non-empty default would break local mode (LLM service would try to call a non-existent server). Changing feature flag defaults changes behavior for all local users. Changing `NEXIS_TESSERACT_PATH` breaks OCR for users who have Tesseract at the default location.

### `backend/app/core/db.py`

**Why it matters:** Creates the database engine and session factory. Falls back to SQLite when `DATABASE_URL` is empty.  
**What breaks:** Removing the SQLite fallback breaks local startup for users without `DATABASE_URL` set. Removing `check_same_thread: False` causes SQLite threading errors.

### `backend/app/core/usage.py`

**Why it matters:** Enforces plan limits. Controls `DEFAULT_USER_ID = "default"`.  
**What breaks:** Changing `DEFAULT_USER_ID` breaks usage record lookup for all existing local databases. Adding real limit enforcement against local users would incorrectly block them (all limits are `99999`).

### `frontend/src/lib/bridge.js`

**Why it matters:** All local AI communication goes through this module. Nothing else should call Ollama directly.  
**What breaks:** Adding direct `localhost:11434` calls bypasses the companion health manager and breaks CORS. Changing `BRIDGE_DEFAULT_URL` must be reflected in companion server config. Removing the legacy URL migration breaks existing stored model configs.

### `frontend/src/utils/projectStorage.js`

**Why it matters:** Primary persistence layer for all project data in the frontend.  
**What breaks:** Changing key names invalidates all stored data for existing users. Removing try/catch breaks app in restricted browser environments. This file is explicitly temporary — it is the integration point where backend persistence will eventually be connected.

### `frontend/src/layout/AppLayout.jsx`

**Why it matters:** Top-level layout and local user identity. Owns `LOCAL_USER` and `LOCAL_PROFILE` constants (defined at module scope) that are passed to `NexusDashboard` and `TopBar` on every render. Controls which overlays are mounted (Help, Diagnostics) and the scroll-to-top behavior. Prior to v009 this was the Supabase auth gate — see Decision Log D-035 for the full history.  
**What breaks:** Changing `LOCAL_PROFILE.tier` changes the resolved tier config. All limits are `99999` locally — this is intentional per D-027. Removing or nulling `LOCAL_USER` breaks `TopBar` and `NexusDashboard` prop contracts.

### `frontend/src/context/ArcNContext.jsx`

**Why it matters:** Global state for the entire application. Navigation, collection state, package state, and saved data all live here.  
**What breaks:** Removing localStorage sync causes state loss on refresh. Changing localStorage key names invalidates stored state for existing users.

### `backend/app/prompts/summary_package_rules.txt` and `creator_package_rules.txt`

**Why it matters:** Loaded once at startup and prepended to every package generation prompt. These rules control all output quality and behavior.  
**What breaks:** Modifying these files changes all package output behavior globally. They are not versioned per-request. If the file is missing at startup, `_SUMMARY_RULES` or `_CREATOR_RULES` will be empty string — generation will proceed but without quality rules.

### `bridge/nexis_bridge.go`

**Why it matters:** Entire companion binary behavior. Endpoints, CORS, Ollama management, model pulls.  
**What breaks:** Changing `bridgePort` requires matching change in `bridge.js` `BRIDGE_DEFAULT_URL`. Removing or renaming endpoints breaks frontend calls. Adding required external modules requires updating `go.mod` and `go.sum`.

---

## Section 10 — Local-First Architecture Rules

These are verified architectural facts, not aspirational goals.

### Single User

- `DEFAULT_USER_ID = "default"` — hardcoded in `core/usage.py`
- All usage tracking operates against this single key
- No user isolation, no tenant separation

### Local Database

- Default: SQLite file `nexis.db` in working directory
- Auto-created on first startup via `init_db()`
- No external database server required

### Local AI

- AI inference: Ollama, `localhost:11434`
- All prompts dispatched through NEXIS Companion, `localhost:8765`
- Feature flags for all heavy AI features default to `False`
- If Ollama is not running, AI features fail gracefully with error messages — the app does not crash

### Local Storage

- Projects, raw items, and outputs: `localStorage`
- No object storage, no CDN, no S3

### No Required Cloud Processing

- No required external cloud services
- All computation (ingestion, generation, refinement) happens on-machine
- All generated output stays on-machine
- Tesseract OCR: local binary
- Whisper: local model (when enabled)
- Vision: local Ollama model

### Hardcoded Local Paths (verify before deployment)

- `SAFE_TMP` temp directory: `D:\NEXIS\tmp` — in `ingestion/file_router.py`
- ffprobe: `C:\ffmpeg\bin\ffprobe.exe` — in `app/assimilation.py`
- Tesseract default: `D:\ARC NEXUS LLC\NEXIS\Tesseract-OCR\tesseract.exe` — in `config.py` (overridable via `NEXIS_TESSERACT_PATH` env var)

---

## Section 11 — Future Hosted NEXIS

> **FUTURE POSSIBILITY ONLY — NOT IMPLEMENTED — NOT CURRENT ARCHITECTURE**

The following concepts describe a potential future hosted version of NEXIS. They are documented here to prevent confusion. None of these are active in NEXIS-LOCAL.

| Concept | Notes |
|---|---|
| Multi-user accounts | Real tier enforcement per user, user isolation |
| PostgreSQL | JSONB natively, no SQLite dialect concerns |
| Cloud-hosted FastAPI | Render, Railway, or similar |
| Managed AI inference | Hosted Ollama or external provider as primary |
| Supabase Storage | Uploaded file storage in cloud buckets |
| Real billing enforcement | Actual plan limits that block users |
| Team workspaces | Shared projects, collaborative editing |
| Analytics/telemetry | Usage dashboards, admin panel |
| No local companion requirement | Browser talks to cloud backend directly |

**`NEXIS_HOSTED_MODE` flag:** Present in `config.py` as `NEXIS_HOSTED_MODE: bool = False`. Setting this to `True` enables hosted-mode behavior in certain code paths (e.g., image analysis blocked in hosted mode per `vision.py`). This flag **must remain `False`** in all local builds.

---

## Section 12 — Source of Truth Hierarchy

When information conflicts about how NEXIS-LOCAL works, resolve it in this order:

1. **Actual codebase** — what the files say, verified by direct read. Highest authority.
2. **Decision Log** — `ASSUMED NOT PRESENT` at time of writing. `VERIFY IN CODE`.
3. **This document** (`NEXIS_LOCAL_STORAGE_AND_STRUCTURE.md`) — reflects codebase at last update date.
4. **AI Handoff SOP** (`NEXIS_LOCAL_AI_HANDOFF_SOP.md`) — architectural intent and onboarding context.
5. **Historical comments in code** — inline comments in source files that explain past decisions.

**When this document conflicts with the actual codebase:**  
The codebase wins. Update this document to match, do not update the code to match this document.

**When assumptions in this document are discovered to be wrong:**  
Correct the assumption here. Mark what was wrong and what the verified fact is.

---

*Verified against codebase: 2026-05-29. Update this document after any major architectural change.*
