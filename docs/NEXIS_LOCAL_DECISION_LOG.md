# NEXIS-LOCAL — Decision Log

**Project:** NEXIS-LOCAL  
**Organization:** ARC NEXUS LLC  
**Document Type:** Institutional Memory / Decision Record  
**Last Updated:** 2026-05-29  
**Audience:** AI assistants, engineers, future contributors  

> This log records decisions that shaped NEXIS-LOCAL — why they were made, what alternatives were considered, and what tradeoffs were accepted. Before replacing logic, simplifying code, or removing complexity, read the relevant entries. The complexity may be solving a known historical problem.

> **Source integrity:** Every decision in this log is either directly verified in codebase files, derived from explicit code comments, or explicitly marked as `UNVERIFIED — NEEDS CONFIRMATION`. No decisions have been fabricated or inferred from filenames alone.

---

## How to Read This Log

Each entry follows this format:

```
Decision ID:        D-XXX
Status:             Verified | Inherited | Unverified | Proposed
Category:           Foundational | Architecture | Auth | Storage | AI | Development | UX
Title:              Short description
Problem:            What gap or risk was being addressed
Options Considered: What alternatives existed
Decision:           What was chosen
Reason:             Why it was chosen
Tradeoffs Accepted: What was given up
Implementation:     Where this lives in the code
Related Files:      Files that embody this decision
Lessons Learned:    What experience taught after the fact
Future Notes:       Open questions or planned evolution
```

---

## Section 1 — Foundational NEXIS-LOCAL Decisions

---

```
Decision ID:        D-001
Status:             Verified
Category:           Foundational
```

**Title:** Local-First Architecture as the Core Design Principle

**Problem:** AI-powered tools typically require cloud infrastructure, API keys, and subscription billing. This creates a barrier for users who want privacy, offline capability, or cost control.

**Options Considered:**
- Cloud-hosted AI with API keys required
- Hybrid (local preferred, cloud fallback)
- Local-first with cloud as optional secondary

**Decision:** Local-first. All core computation (ingestion, AI inference, storage) happens on the user's machine. Cloud services are optional or explicitly scoped secondary paths.

**Reason:** User privacy, offline capability, no ongoing inference cost, and user control over their own data. Verified in multiple locations.

**Tradeoffs Accepted:**
- User must install and run Ollama locally
- User must download model weights
- Setup friction is higher than cloud tools

**Implementation:**
- Ollama as AI layer (`localhost:11434`)
- NEXIS Companion as local AI manager (`localhost:8765`)
- SQLite as default database
- `localStorage` as default frontend persistence
- All feature flags default `False`

**Related Files:**
- `backend/app/core/config.py` — feature flags all default to `False`
- `backend/app/services/llm_service.py` — raises 503 if `OLLAMA_URL` not set
- `frontend/src/lib/bridge.js` — all AI routes through local companion
- `README.md` — "Your AI should work for you — locally when possible"

**Lessons Learned:** The local-first default must be protected actively. Code that assumes `OLLAMA_URL` is always set, or that a cloud backend is reachable, will silently break local deployments.

**Future Notes:** A future hosted NEXIS is a separate product. Local-first behavior of NEXIS-LOCAL must be preserved even if hosted code is developed in parallel.

---

```
Decision ID:        D-002
Status:             Verified
Category:           Foundational
```

**Title:** Single-User-First Design — `DEFAULT_USER_ID = "default"`

**Problem:** Building multi-user infrastructure (session isolation, per-user database rows, tenant scoping) adds significant complexity before the product has proven value with a single user.

**Options Considered:**
- Multi-user from the start
- Single-user with future upgrade path
- Anonymous/keyless local mode with no user concept

**Decision:** Single-user first. All usage tracking and account logic operates against a hardcoded `DEFAULT_USER_ID = "default"`.

**Reason:** Avoids premature complexity. One user per installation is the correct assumption for a local desktop application at MVP stage.

**Tradeoffs Accepted:**
- Cannot support multiple local users on the same installation
- Usage data is not portable if user concept is later added
- Any transition to real user IDs requires a data migration

**Implementation:** `DEFAULT_USER_ID = "default"` constant in `backend/app/core/usage.py`. All usage API endpoints call `tracker.load_usage(db, DEFAULT_USER_ID)` without deriving a user ID from auth.

**Related Files:**
- `backend/app/core/usage.py` — `DEFAULT_USER_ID = "default"`
- `backend/app/models/account.py` — comment: *"'default' is used in the single-user phase; swap for a real auth user ID once authentication is implemented"*
- `backend/app/api/routes/usage.py` — all endpoints use `DEFAULT_USER_ID`

**Lessons Learned:** The constant is well-named and clearly commented. This should not be changed without a deliberate migration plan for the `user_accounts` table.

**Future Notes:** If multi-user support is added, `DEFAULT_USER_ID` must be replaced with a real auth-derived user ID throughout all usage endpoints. The comment in `account.py` already anticipates this.

---

```
Decision ID:        D-003
Status:             Verified
Category:           Foundational
```

**Title:** User-Owned Compute and User-Owned Data

**Problem:** Cloud AI services bill per token and retain user data on remote servers. Users have no control over inference cost, data retention, or model behavior.

**Options Considered:**
- Managed cloud inference with user API keys
- Self-hosted inference on a server the developer controls
- User runs inference on their own hardware

**Decision:** User runs their own Ollama instance. The model, the compute, and the inference output belong to the user.

**Reason:** Privacy, cost control, no vendor lock-in, offline capability.

**Tradeoffs Accepted:**
- User must have hardware capable of running models (RAM, optional GPU)
- Setup is more complex than entering an API key
- Model quality is limited to what the user's hardware can run

**Implementation:** All generation calls ultimately reach Ollama at `localhost:11434` on the user's machine. The backend (`llm_service.py`) explicitly refuses to call any LLM URL that is not configured — it will not fall back to a remote service silently.

**Related Files:**
- `backend/app/services/llm_service.py` — *"Ollama runs on the USER's machine, not on this Render server"*
- `frontend/src/lib/bridge.js` — routes all generation to user's local companion
- `backend/app/api/routes/system.py` — *"Ollama runs on the user's machine, not this server"*

**Future Notes:** Provider API key mode (OpenAI, etc.) exists as a secondary option. It must remain secondary. User-owned compute is the primary path.

---

## Section 2 — Inherited Decisions

---

```
Decision ID:        D-010
Status:             Inherited
Category:           Foundational
```

**Title:** Local-First Philosophy as Foundational Constraint

**Source:** Inherited from AEGIS-era ARC NEXUS development philosophy.

**Problem:** AI tooling defaults toward cloud dependencies. Early AEGIS work established local-first as the non-negotiable default.

**Decision:** Local-first is not a feature — it is an architectural constraint. All future decisions are evaluated against it.

**Reason:** Privacy, user control, no forced cloud dependency.

**How It Carries Forward:** Every new system in NEXIS-LOCAL is evaluated for local viability first. Cloud paths require explicit justification. This is documented in `ARC_CONTEXT.md` and enforced by development rules.

**Related Files:**
- `ARC_CONTEXT.md` — project priorities
- `docs/NEXIS_LOCAL_DEVELOPER_RULES.md` — Section 2

---

```
Decision ID:        D-011
Status:             Inherited
Category:           Development
```

**Title:** Minimal Dependency Philosophy

**Source:** Inherited from AEGIS-era development conventions.

**Problem:** Dependency accumulation increases maintenance burden, attack surface, and breakage risk across upgrades.

**Decision:** Add dependencies only when clearly necessary. Prefer existing stdlib, established packages, and known-stable libraries over novel integrations.

**How It Carries Forward:**
- The NEXIS Companion (bridge) uses Go stdlib only — no external modules (`go.mod` contains only the module declaration)
- `ARC_CONTEXT.md` — "Minimal dependencies"
- Frontend: no Redux, no new styling libraries, no state management frameworks added beyond React context

**Related Files:**
- `bridge/go.mod` — stdlib-only Go module
- `ARC_CONTEXT.md` — "Minimal dependencies"
- `docs/NEXIS_LOCAL_DEVELOPER_RULES.md` — Sections 7.6, 7.7

---

```
Decision ID:        D-012
Status:             Inherited
Category:           Development
```

**Title:** Documentation-First Approach for AI Handoff

**Source:** Inherited from AEGIS-era documentation conventions.

**Problem:** AI assistants working on a codebase without context make incorrect assumptions, break working systems, and introduce architectural drift.

**Decision:** Maintain authoritative AI-readable documentation that gives new assistants accurate context before they touch any code.

**How It Carries Forward:**
- `docs/NEXIS_LOCAL_AI_HANDOFF_SOP.md` — what NEXIS-LOCAL is and is not
- `docs/NEXIS_LOCAL_STORAGE_AND_STRUCTURE.md` — technical architecture reference
- `docs/NEXIS_LOCAL_DEVELOPER_RULES.md` — how to work on the codebase safely
- `docs/NEXIS_LOCAL_DECISION_LOG.md` (this file) — why decisions were made
- `docs/ai/KNOWN_ISSUES.md` — active bugs and fragile areas

---

```
Decision ID:        D-013
Status:             Inherited
Category:           Development
```

**Title:** Full-File Return Preference for Code Changes

**Source:** Inherited from AEGIS-era coding conventions. Documented in `ARC_CONTEXT.md`.

**Problem:** Partial code returns (snippets with placeholders, omission markers, `// ... rest of file`) require manual integration, introduce merge errors, and lose comment context.

**Decision:** When editing or rewriting a file, return the complete file. No placeholders. No omission markers.

**How It Carries Forward:**
- `ARC_CONTEXT.md` — "Return full files"
- `docs/NEXIS_LOCAL_DEVELOPER_RULES.md` — Section 3.2

**Tradeoffs Accepted:** Larger responses. This is acceptable — correctness and completeness are more valuable than response brevity.

---

```
Decision ID:        D-014
Status:             Inherited
Category:           Development
```

**Title:** Preserve Comments as Engineering Memory

**Source:** Inherited from AEGIS-era conventions. Documented in `ARC_CONTEXT.md`.

**Problem:** Comments in a codebase record why decisions were made, not just what the code does. Removing or overwriting comments during edits destroys institutional memory.

**Decision:** Preserve all comments. Do not remove comments when editing files. Do not reformat comments.

**How It Carries Forward:**
- `ARC_CONTEXT.md` — "Preserve comments"
- Evidence throughout codebase: every file has version headers, decision notes, and behavioral explanations embedded in comments

---

## Section 3 — Architectural Decisions

---

```
Decision ID:        D-020
Status:             Verified
Category:           Architecture
```

**Title:** NEXIS Companion as Required Intermediary Between Frontend and Ollama

**Problem:** Browser JavaScript cannot call `localhost:11434` (Ollama) directly. CORS blocks cross-origin requests from web pages. Additionally, managing Ollama's lifecycle (start, restart, model pulls, diagnostics) from a web page is not feasible.

**Options Considered:**
- Direct browser-to-Ollama with CORS headers added to Ollama
- Backend proxy (FastAPI forwards generation requests to Ollama)
- Standalone local binary acting as health manager + proxy

**Decision:** NEXIS Companion — a standalone Go binary on `localhost:8765` that manages Ollama and proxies generation requests.

**Reason:**
1. Browsers cannot call Ollama directly (CORS)
2. The companion does more than proxy — it detects Ollama, starts it, restarts it, pulls models, and reports diagnostics
3. Users should never need a terminal to manage their local AI
4. Go was chosen for the companion for: single binary output, cross-platform, stdlib-only, low memory footprint

**Tradeoffs Accepted:**
- Users must download and run a separate binary
- Updates to companion endpoints require binary redistribution
- Two moving parts to manage instead of one

**Implementation:**
- Companion listens on port `8765` (hardcoded constant `bridgePort`)
- All frontend AI communication routes through `bridge.js` → `generateViaBridge()`
- `bridge.js` explicitly migrates any stored `localhost:11434` URLs to the bridge URL
- `bridge.js` error codes enumerate all failure modes clearly

**Related Files:**
- `bridge/nexis_bridge.go` — full companion implementation
- `frontend/src/lib/bridge.js` — *"All communication with the NEXIS Local Companion goes through this module. Nothing else in the frontend talks to Ollama or localhost:11434 directly."*
- `frontend/src/api/api.jsx` — *"browser NEVER calls localhost:11434 directly — CORS blocks it"*

**Lessons Learned:** Legacy code that stored `localhost:11434` as the model endpoint required a migration path. `bridge.js` handles this via `getModelConfigWithMigration()`. This migration must be preserved.

**Future Notes:** If companion endpoints are renamed or added, `bridge.js` call sites must be updated simultaneously.

---

```
Decision ID:        D-021
Status:             Verified
Category:           Architecture
```

**Title:** CORS Must Be Registered Before All Routers in FastAPI

**Problem:** FastAPI CORS middleware must handle `OPTIONS` preflight requests before any router processes the request. If routers are registered first, they intercept preflight requests and return incorrect responses, silently breaking all cross-origin API calls.

**Options Considered:**
- Register CORS after routers (incorrect — preflight fails)
- Register CORS before routers (correct)
- Use a custom preflight handler

**Decision:** CORS middleware is registered immediately after `app = FastAPI(...)`, before any router includes.

**Reason:** Preflight (`OPTIONS`) requests must be handled by CORS middleware, not by route handlers. Middleware registered after routers may not intercept pre-flight correctly.

**Tradeoffs Accepted:** None. This is the correct behavior.

**Implementation:** `main.py` version comment explicitly records this: *"Version: 005 (CORS before routers + preflight debug middleware)"*. The comment sequence in `main.py` places `app.add_middleware(CORSMiddleware, ...)` before all `app.include_router(...)` calls.

**Related Files:**
- `backend/app/main.py` — CORS registered before routers, version comment documents the reason

**Lessons Learned:** This was discovered as a bug and fixed in version 005. The version comment is intentional historical record. Do not reorder middleware and routers.

---

```
Decision ID:        D-022
Status:             Verified
Category:           Architecture
```

**Title:** SQLite as Local Database Default

**Problem:** PostgreSQL requires a running database server, configuration, and connection management. For a single-user local application, this creates unnecessary setup friction.

**Options Considered:**
- PostgreSQL required (no fallback)
- SQLite only (no PostgreSQL support)
- SQLite default with PostgreSQL opt-in via `DATABASE_URL`

**Decision:** SQLite default. When `DATABASE_URL` is empty, `db.py` uses `sqlite:///./nexis.db`. PostgreSQL is available if `DATABASE_URL` is set.

**Reason:** Zero-config local operation. The database file is auto-created on first startup. No database server installation required.

**Tradeoffs Accepted:**
- `project.py` imports `JSONB` from `sqlalchemy.dialects.postgresql` — this may not behave as native JSONB under SQLite (may serialize as text)
- SQLite does not support true concurrent writes
- SQLite file is not suitable for a hosted multi-user deployment

**Implementation:**
- `db.py`: `_DATABASE_URL = settings.DATABASE_URL or "sqlite:///./nexis.db"`
- `check_same_thread: False` set for SQLite connections to support FastAPI's async/threaded request handling

**Related Files:**
- `backend/app/core/db.py` — *"Defaults to a local SQLite file (nexis.db) when no DATABASE_URL is configured"*
- `backend/app/models/project.py` — uses `JSONB` from PostgreSQL dialect

**Lessons Learned:** The `JSONB` import in `project.py` is a known portability concern. If JSONB querying is needed in SQLite mode, this must be verified explicitly.

**Future Notes:** Future hosted NEXIS would use PostgreSQL. The `DATABASE_URL` env var is the migration path.

---

```
Decision ID:        D-023
Status:             Verified
Category:           Architecture
```

**Title:** All Feature Flags Default to False

**Problem:** Optional features (OCR, Whisper, vision model, YouTube ingestion, hosted mode) require specific local dependencies. Enabling them by default would break installations that don't have those dependencies.

**Options Considered:**
- Auto-detect capabilities at startup
- All features enabled by default
- All features disabled by default, opt-in via env vars

**Decision:** All optional feature flags default to `False`. Must be explicitly enabled via environment variables.

**Reason:** Fail-safe defaults. A missing Tesseract binary or uninstalled Whisper dependency should not crash the application — the feature should simply be unavailable.

**Tradeoffs Accepted:** Users must know to set env vars to unlock features. Default install has limited capabilities.

**Implementation:** `config.py`:
```python
WHISPER_ENABLED: bool = False
OCR_ENABLED: bool = False
VISION_ENABLED: bool = False
YOUTUBE_INGESTION_ENABLED: bool = False
NEXIS_HOSTED_MODE: bool = False
```

**Related Files:**
- `backend/app/core/config.py` — all flags with `False` defaults and comment: *"Default false — enable via env vars for local dev. Keep false on hosted (Render) unless explicitly enabled."*

**Future Notes:** `NEXIS_HOSTED_MODE` is the flag that will gate hosted-specific behavior. It must remain `False` in all local builds.

---

```
Decision ID:        D-024
Status:             Verified
Category:           Architecture
```

**Title:** LLM Service Returns HTTP 503 When OLLAMA_URL Is Not Set

**Problem:** In local mode, generation goes through the NEXIS Companion bridge directly to Ollama — not through the FastAPI backend. If the backend's LLM service were to silently fail or fall back to a wrong URL, it would produce confusing errors.

**Options Considered:**
- Silent failure (return empty string)
- Fall back to a default Ollama URL
- Raise a clear HTTP 503 with explanation

**Decision:** If `OLLAMA_URL` is not set in the environment, `run_llm()` raises HTTP 503 immediately with a human-readable message.

**Reason:** Explicit failure is better than silent failure. The 503 message tells the operator exactly what is missing. In correct local operation, the backend's LLM path is not used for generation at all — the companion handles it.

**Tradeoffs Accepted:** Any backend route that calls `run_llm()` without `OLLAMA_URL` configured will return a 503. This is correct behavior for local mode.

**Implementation:** `llm_service.py`:
```python
LLM_URL = os.environ.get("OLLAMA_URL", "")
# ...
if not LLM_URL:
    raise HTTPException(status_code=503, detail="No LLM backend configured on this server. Configure a local model using the NEXIS Local Companion.")
```

**Related Files:**
- `backend/app/services/llm_service.py` — *"Version: 004 (env-var URL — no hardcoded Ollama host)"*

**Lessons Learned:** Hardcoding an Ollama URL in the service was a prior approach (pre-version 004). The env-var approach is more correct for portability across local and hosted deployments.

---

```
Decision ID:        D-025
Status:             Verified
Category:           Architecture
```

**Title:** Image Pipeline Produces Two Separate Artifacts (OCR Text + Vision Brief)

**Problem:** Image ingestion needs to serve two different downstream purposes: OCR text feeds directly into the generation pipeline (as raw content), while a visual description provides an AI analysis layer for the collection brief. These are different artifacts with different consumers.

**Options Considered:**
- Combine OCR and vision description into one text blob
- Separate fields for each artifact
- Only OCR (no vision model)

**Decision:** Two-artifact output. `raw_content` stores OCR text. `brief` stores the vision model description.

**Reason:** The generation pipeline (Convert/Create) needs clean, parseable OCR text. The collection brief is a human-readable AI analysis. Mixing them would pollute the generation context with metadata.

**Tradeoffs Accepted:**
- More complex response shape
- Both artifacts may be empty if Tesseract and the vision model are both unavailable

**Implementation:**
- `vision.py`: *"Version: 007 (Dual-artifact: raw_content=ocr_text, brief=image analysis)"*
- If Tesseract missing: `raw_content` = `"[OCR UNAVAILABLE]"` message, no crash
- If vision model absent: `brief` contains `"unavailable"` note, no crash

**Related Files:**
- `backend/app/vision.py` — dual-artifact architecture
- `backend/app/services/vision_service.py` — Ollama vision model client

---

```
Decision ID:        D-026
Status:             Verified
Category:           Architecture
```

**Title:** Document Collection Brief Generated at Ingest Time

**Problem:** Long documents exceed what can be passed as context directly to generation prompts. Additionally, users benefit from seeing a structured summary of what was ingested before generating a package.

**Options Considered:**
- No document brief (raw text only)
- Brief generated at generate-time (redundant work per generation)
- Brief generated at ingest-time and stored with the source

**Decision:** `doc_intel.py` generates a DOCUMENT COLLECTION BRIEF at ingest time using a local Ollama model. Short documents go through a single LLM pass. Long documents are chunked, each chunk summarized, then combined into a final brief.

**Reason:** Brief is generated once, stored with the source, and reused across multiple generation runs. Also surfaces the ingested content to the user before they commit to generating a package.

**Tradeoffs Accepted:**
- Ingest is slower (requires LLM call)
- If Ollama is offline at ingest time, brief is a clear failure message — raw text is still stored

**Implementation:**
- `CHUNK_DIRECT_LIMIT = 1200` words → single pass
- `CHUNK_WORD_LIMIT = 1500` words per chunk for long documents
- Graceful fallback: if Ollama offline, brief contains `"[LLM ...]"` sentinel string

**Related Files:**
- `backend/app/services/doc_intel.py` — chunked summarization pipeline
- `backend/app/assimilation.py` — calls `doc_intel.py` for `_DOC_EXT` file types

---

```
Decision ID:        D-027
Status:             Verified
Category:           Architecture
```

**Title:** Tier/Plan System Present but Limits Set to Unlimited for Local Use

**Problem:** A tiered plan system was designed for a hosted, subscription-gated product. That billing model does not apply to a single-user local application.

**Options Considered:**
- Remove tier system entirely
- Keep tier system but set all limits to unlimited
- Gate the tier system behind a hosted-mode flag

**Decision:** Keep tier system in code. Set all local plan limits to `99999` (effectively unlimited). Enforcement code runs but never blocks a local user.

**Reason:** Preserves the code structure for a future hosted product without adding behavioral constraints to local users. Removing the tier system entirely would require significant refactoring that adds risk for no local benefit.

**Tradeoffs Accepted:**
- Dead code overhead (tier enforcement logic that never triggers)
- Frontend `tiers.js` must stay in sync with backend `tiers.py`
- Future real enforcement requires changing limit values, not architecture

**Implementation:**
- All plan limits in `tiers.py` and `tiers.js` set to `99999`
- `tiers.js` comment: *"Mirrors backend app/core/tiers.py — values must stay in sync. Used for display only. Enforcement is always server-side."*

**Related Files:**
- `backend/app/core/tiers.py`
- `frontend/src/lib/tiers.js`

---

```
Decision ID:        D-028
Status:             Verified
Category:           Architecture
```

**Title:** URL Ingestion — Article Body Isolation via Text-Density Extraction

**Problem:** The original HTML ingestion path called `BeautifulSoup.get_text()` on the entire DOM after stripping only a handful of structural tags (`script`, `style`, `nav`, etc.). Wikipedia was the only special case. For arbitrary news and article URLs, this returned the full page body — including navigation, sidebars, "Latest Articles," "Most Popular," ads, membership prompts, and footer content. This contaminated source material before it reached Summary Packages and Creator Packages, causing the generation pipeline to produce outputs about unrelated homepage stories rather than the selected article.

**Verified Evidence of Problem:** Times of Israel article URL test — raw extraction before fix: 31,957 characters, 18 of 26 contamination markers detected. After fix: 3,654 characters, 0 contamination markers. All 8 expected article topic keywords present.

**Options Considered:**
- BS4 with per-site CSS selector knowledge — requires maintaining per-site patterns; breaks with redesigns; not viable for arbitrary URLs
- `newspaper3k` — no longer actively maintained; inconsistent on modern SPAs
- `readability-lxml` (python-readability) — viable but fewer active maintainers than trafilatura
- `trafilatura` — text-density-based extraction, language-independent, actively maintained, pure Python + lxml, no system dependencies, widely deployed in ingestion pipelines
- Prompt engineering (tell the model to ignore clutter) — explicitly rejected; the model should never receive contaminated input

**Decision:** Three-strategy extraction pipeline with contamination detection:
1. `trafilatura` — text-density extraction, primary path for arbitrary news/article URLs
2. BS4 semantic selectors — ordered priority list of 15+ `article`, `[role=article]`, `main`, and common article-body class/id patterns; covers cases where trafilatura returns insufficient content
3. Noise-stripped full body — last resort; always triggers contamination check and always sets a warning

Contamination detection checks extracted text against 26 known boilerplate phrases ("Most Popular," "Advertisement," "Latest Articles," etc.). If ≥3 markers found, a `warning` field is set in the response and surfaced to the user in the frontend — but collection is not blocked.

**Reason:** Text-density extraction is the only approach that works reliably for arbitrary news sites without per-site knowledge. CSS selectors are the right secondary layer for well-structured sites that trafilatura cannot confidently isolate. Full-body fallback is kept as a last resort with a mandatory warning rather than silently serving contaminated content.

**Tradeoffs Accepted:**
- New Python dependency (`trafilatura==1.12.2`) added to `requirements.txt`
- Three-strategy pipeline is more complex than a single path — complexity is justified by the quality gap
- Trafilatura may return insufficient content for very short or heavily JS-rendered pages — BS4 selector fallback handles this
- Contamination warning does not block collection — user may still generate from flagged content; this is intentional

**Implementation:**
- `backend/ingestion/url_utils.py` — `_extract_article_content()` owns all three strategies; `_detect_contamination()` checks for boilerplate markers; `_strip_noise_elements()` removes sidebar/ad/cookie class patterns from BS4 soup; `_ARTICLE_SELECTORS` is the ordered selector priority list
- `backend/app/assimilation.py` — extracts and passes through `warning` field in `/collect/process` response
- `frontend/src/pages/ProjectWorkspace.jsx` — `collectWarning` state renders an amber warning box below the collect button when `data.warning` is set
- `backend/requirements.txt` — `trafilatura==1.12.2` added with rationale comment

**Related Files:**
- `backend/ingestion/url_utils.py` — *"Version: 007 (Article body isolation + contamination detection)"*
- `backend/app/assimilation.py` — `result_warning` field in response shape
- `frontend/src/pages/ProjectWorkspace.jsx` — `collectWarning` state + amber warning display
- `backend/requirements.txt` — trafilatura dependency with explanation

**Lessons Learned:** BeautifulSoup is a parser, not a content extractor. It has no concept of text density or article boundaries. Stripping a handful of HTML tags is insufficient for modern news sites that embed navigation, promotions, and sidebar content inline in the DOM. Text-density extraction is required for reliable article isolation on arbitrary URLs.

**Future Notes:** If trafilatura is ever removed or replaced, the BS4 selector list in `_ARTICLE_SELECTORS` must be validated as a standalone fallback. Do not replace the three-strategy pipeline with a single-strategy approach without testing against a representative set of news/article URLs.

---

## Section 4 — Development Decisions

---

```
Decision ID:        D-030
Status:             Verified
Category:           Development
```

**Title:** localStorage as Current Frontend Persistence Layer

**Problem:** Full backend integration for project storage requires a complete API contract, schema design, and migration path. At MVP stage, this is premature. A local persistence layer allows the frontend to be built and validated first.

**Options Considered:**
- Full backend persistence from day one
- Browser IndexedDB
- localStorage with planned migration

**Decision:** `projectStorage.js` wraps all localStorage reads and writes for projects, raw items, outputs, and model config. It is explicitly flagged as a temporary adapter.

**Reason:** Fast MVP iteration. localStorage is sufficient for a single-user local application. The adapter pattern means backend integration requires only replacing the functions inside `projectStorage.js`, not refactoring all call sites.

**Tradeoffs Accepted:**
- Data lost if user clears browser storage
- No backup or export without additional tooling
- Key names must never change without a migration (breaking change for existing users)

**Implementation:**
- `projectStorage.js` comment: *"Version: 001 (localStorage — swap these functions for API calls when backend integration is ready)"*
- All keys prefixed with `nexis_local_` to avoid collisions
- All read/write operations wrapped in `try/catch` for SecurityError protection

**Related Files:**
- `frontend/src/utils/projectStorage.js`
- `frontend/src/context/ArcNContext.jsx` — additional localStorage state

**Future Notes:** Backend persistence migration is a planned future task. When implemented, it must be a deliberate migration — not a side effect of another change. Existing localStorage keys must not be broken until migration is verified.

---

```
Decision ID:        D-031
Status:             Verified
Category:           Development
```

**Title:** No State Management Library — React Context Is Sufficient

**Problem:** Adding Redux, Zustand, or similar global state management adds dependency weight and architectural complexity. At MVP scale with a single user and a relatively simple state model, a context provider is sufficient.

**Options Considered:**
- Redux / Redux Toolkit
- Zustand
- React Context

**Decision:** React Context (`ArcNContext`). One `ArcNProvider` wraps the application tree.

**Reason:** Project explicitly documents this decision. `ARC_CONTEXT.md` — *"Avoid Redux/global state unless necessary"*.

**Tradeoffs Accepted:**
- Context re-renders more broadly than a fine-grained state manager
- As state grows, context may need to be split

**Implementation:**
- `src/context/ArcNContext.jsx` — single provider with all global state

**Related Files:**
- `frontend/src/context/ArcNContext.jsx`
- `ARC_CONTEXT.md`

---

```
Decision ID:        D-032
Status:             Verified — Superseded by D-035 (2026-05-29)
Category:           Development
```

**Title:** Email + Password Auth Only — Magic Links and OTP Removed

**Problem:** Magic links (OTP via email) add auth flow complexity. For a local-first tool where the user controls their environment, a simple email + password flow is more predictable and less dependent on email delivery timing.

**Options Considered:**
- Magic link / OTP only
- Email + password only
- Both options supported

**Decision:** Email + password only. Magic links and OTP deliberately absent.

**Reason:** Simpler, more reliable. No dependency on email delivery speed for login.

**Implementation:**
- `AppLayout.jsx` comment: *"AUTH CHANGE: All magic-link / OTP code removed. Auth gate relies exclusively on the Supabase session returned by getSession() / onAuthStateChange(). No localStorage flags, URL params, demo booleans, or hardcoded bypasses are used anywhere in this file."*
- `auth.js` comment: *"AUTH CHANGE: Removed magic-link / OTP entirely. Only email+password flows are supported. sendMagicLink / signInWithOtp are intentionally absent."*

**Related Files:**
- `frontend/src/lib/auth.js`
- `frontend/src/layout/AppLayout.jsx`

**Lessons Learned:** This change was intentional and documented. Do not re-add OTP or magic link flows without explicit user approval.

---

```
Decision ID:        D-033
Status:             Verified
Category:           Development
```

**Title:** Package Generation Rules Loaded From Files at Startup

**Problem:** Embedding prompt rules as string literals inside Python code makes them difficult to read, edit, and reason about separately from the generation logic.

**Options Considered:**
- Prompt rules as inline string constants in `reconstruction.py`
- Prompt rules loaded from external `.txt` files at startup
- Prompt rules stored in database

**Decision:** Rules loaded from `app/prompts/summary_package_rules.txt` and `app/prompts/creator_package_rules.txt` at application startup. If file is missing, rule string defaults to empty (generation continues without rules).

**Reason:** Keeps prompt engineering separated from application logic. Rules can be edited without modifying Python code.

**Tradeoffs Accepted:**
- If rule files are missing at startup, generation proceeds without quality rules (silent degradation)
- Rules are global — there is no per-user or per-project rule set

**Implementation:**
```python
try:
    with open(_RULES_PATH, encoding="utf-8") as _f:
        _SUMMARY_RULES = _f.read().strip()
except Exception:
    _SUMMARY_RULES = ""
```

**Related Files:**
- `backend/app/reconstruction.py` — rule loading at module level
- `backend/app/prompts/summary_package_rules.txt`
- `backend/app/prompts/creator_package_rules.txt`

---

```
Decision ID:        D-034
Status:             Verified
Category:           Development
```

**Title:** Titles & Keywords Combined in UI but Sent as Separate Backend Calls

**Problem:** Displaying "Title Suggestions" and "Keywords" as two separate UI items adds clutter. Combined, they represent one concept for the user: "what to call this and how to tag it."

**Options Considered:**
- Two separate UI items
- One combined UI item, combined backend call
- One combined UI item, two separate backend calls

**Decision:** One combined UI label ("Titles & Keywords"), two separate backend calls (`"Title Suggestions"` and `"Keywords"`).

**Reason:** UX clarity without changing the backend contract. Backend treats them as distinct generation options with distinct prompts.

**Implementation:**
- `ProjectWorkspace.jsx` comment: *"Display label only — backend receives 'Title Suggestions' + 'Keywords' separately. DO NOT split these in the UI."*
- `PACKAGES.creator.items` contains `"Titles & Keywords"` (display)
- `BACKEND_ITEMS.creator` contains separate `"Title Suggestions"` and `"Keywords"` (API)

**Related Files:**
- `frontend/src/pages/ProjectWorkspace.jsx`

**Lessons Learned:** This mapping is a silent contract between frontend display and backend API. Changing the display label or the backend option strings independently will break the mapping.

---

```
Decision ID:        D-035
Status:             Verified
Category:           Auth
```

**Title:** Local Auth Removal Phase 1 — Supabase Gate Replaced with Local User Constants

**Problem:** Supabase authentication was the only required cloud dependency in NEXIS-LOCAL. The entire frontend was gated behind `supabase.auth.getSession()`, meaning users needed a Supabase account and internet access to log in before any part of the app was accessible. This contradicted the local-first architecture principle (D-001) and the documented "no cloud account required" claim in the User Install Guide.

**Analysis (2026-05-29):**
- `AppLayout.jsx` v008 had a hard gate: `if (!user) return <SignedOutScreen>` — no bypass existed
- `user` was populated exclusively by `supabase.auth.getSession()` and `onAuthStateChange()`
- The backend has zero Supabase references — `DEFAULT_USER_ID = "default"` hardcoded in all usage paths
- All tier limits in `tiers.js` are `99999` — enforcement never blocks a local user regardless of profile state
- `NexusDashboard.jsx` already handles `profile?.tier || "free"` gracefully (null profile falls through to free tier)
- Supabase auth was required only to unlock the UI, not to protect any backend data or enforce any meaningful rule

**Options Considered:**
- Keep Supabase, update docs to note it is required (preserves complexity, only fixes documentation)
- Add an environment variable bypass flag
- Replace the auth gate with local constants in `AppLayout.jsx` — Phase 1 (minimal, targeted)
- Full cleanup: delete `auth.js`, `supabase.js`, remove package dependency — Phase 2, deferred

**Decision:** Phase 1 only. Replace the Supabase auth gate in `AppLayout.jsx` with `LOCAL_USER` and `LOCAL_PROFILE` constants. All other Supabase files remain untouched.

**Reason:** The backend never validated Supabase credentials. All tier limits are `99999` locally. The auth gate added a mandatory cloud dependency with no corresponding backend security or data protection benefit for a single-user local application.

**Tradeoffs Accepted:**
- `auth.js` and `supabase.js` remain as unused frontend code until Phase 2 cleanup
- `NexusDashboard.jsx` still imports `supabase` for the app announcements fetch — call fails silently, caught by existing `try/catch`, `announcements` set to `null`, fallback renders
- No Account overlay or sign-in/sign-out UI — appropriate for a local single-user application
- `@supabase/supabase-js` remains as an unused package dependency until Phase 2
- `AccountOverlay.jsx`, `SignedOutScreen.jsx`, `PasswordRecoveryOverlay.jsx`, `ResetPasswordOverlay.jsx` remain as dead code until Phase 2

**Implementation:**
- `AppLayout.jsx` v009 (2026-05-29): removed imports of `SignedOutScreen`, `PasswordRecoveryOverlay`, `AccountOverlay`, `supabase`, `auth.js`, `clearAllProjectStorage`; added `LOCAL_USER` and `LOCAL_PROFILE` constants at module scope; removed both auth `useEffect` blocks, the debug `useEffect` block, `handleSignIn/SignUp/SignOut` functions, and `authLoading`/`showAccount`/`showPasswordRecovery` state; removed the `if (!user) return <SignedOutScreen>` gate; passes `user={null}` to `TopBar` (email/Account/Sign Out hidden by existing `{user && ...}` guard)
- `TopBar.jsx`: no changes required

**Related Files:**
- `frontend/src/layout/AppLayout.jsx` — v009, primary change
- `frontend/src/layout/TopBar.jsx` — unchanged; `{user && ...}` guard hides auth controls automatically when `user` is null
- `frontend/src/lib/auth.js` — unchanged; Supabase auth functions remain, no longer imported by AppLayout
- `frontend/src/lib/supabase.js` — unchanged; still imported by `NexusDashboard` for announcements fetch

**Lessons Learned:** A cloud auth gate is not appropriate for a local-first single-user tool. When the backend has no auth validation and uses `DEFAULT_USER_ID = "default"`, a frontend auth gate adds cloud friction without security. The gate was architecture for a future hosted product inadvertently deployed in a local one.

**Future Notes:** Phase 2 cleanup — delete `auth.js`, `supabase.js`, remove `@supabase/supabase-js` from `package.json`, remove announcements fetch from `NexusDashboard.jsx`, remove Supabase env vars from `.env.example` and documentation. Phase 2 should be a deliberate tracked operation, not a side effect of another change.

---

## Section 5 — Lessons Learned

---

```
Decision ID:        D-040
Status:             Verified
Category:           Lessons
```

**Title:** Direct Browser-to-Ollama Calls Are Blocked by CORS

**Lesson:** Early implementation may have attempted to call `localhost:11434` directly from the browser. This fails because browsers enforce CORS on all cross-origin requests, including `localhost` to a different `localhost` port. Ollama does not serve `Access-Control-Allow-Origin` headers by default.

**Evidence:** `bridge.js` contains explicit legacy URL migration logic that detects stored `localhost:11434` endpoints and migrates them to the bridge URL. This migration code would not exist without a prior period where `localhost:11434` was used directly.

**Resolution:** All AI calls route through the NEXIS Companion at `localhost:8765`, which does serve correct CORS headers.

**Related Files:**
- `frontend/src/lib/bridge.js` — `RAW_OLLAMA_PATTERNS` array and migration logic

---

```
Decision ID:        D-041
Status:             Verified
Category:           Lessons
```

**Title:** localStorage Access Can Throw SecurityError in Restricted Environments

**Lesson:** `localStorage` is not universally available. In certain browser contexts (private browsing with strict settings, sandboxed iframes, some WebViews) access throws `SecurityError`. Unprotected access crashes the component or application.

**Resolution:** All `localStorage` reads and writes in `projectStorage.js` and `ArcNContext.jsx` are wrapped in `try/catch`. Failed writes log a warning but do not throw.

**Evidence:** `KNOWN_ISSUES.md` documents this. `projectStorage.js` has `try/catch` on every operation.

**Related Files:**
- `frontend/src/utils/projectStorage.js`
- `frontend/src/context/ArcNContext.jsx`
- `docs/ai/KNOWN_ISSUES.md`

---

```
Decision ID:        D-042
Status:             Verified
Category:           Lessons
```

**Title:** CORS Middleware Order in FastAPI Is Load-Order Dependent

**Lesson:** Registering routers before CORS middleware in FastAPI means the CORS middleware does not intercept `OPTIONS` preflight requests before route handlers process them. This silently breaks all cross-origin API calls without a clear error.

**Resolution:** CORS is registered immediately after `FastAPI()` instantiation, before any `include_router()` calls. This is now codified in `main.py` version comment.

**Related Files:**
- `backend/app/main.py` — *"Version: 005 (CORS before routers + preflight debug middleware)"*

---

```
Decision ID:        D-043
Status:             Verified
Category:           Lessons
```

**Title:** CRA Projects Require `REACT_APP_` Prefix for Environment Variables

**Lesson:** Create React App (CRA) only exposes environment variables prefixed with `REACT_APP_` to the browser bundle. Variables without this prefix are silently undefined. Vite-style `import.meta.env` does not work in CRA.

**Resolution:** All frontend environment variables use the `REACT_APP_` prefix. This is documented in `api.jsx`.

**Evidence:** `api.jsx` comment: *"NOTE: This is a Create React App (CRA) project. Environment variables must be prefixed REACT_APP_ and are accessed via process.env.REACT_APP_* at build time. Vite-style import.meta.env is NOT available here."*

**Related Files:**
- `frontend/src/api/api.jsx`

---

```
Decision ID:        D-044
Status:             Verified
Category:           Lessons
```

**Title:** `localhost` Hostname Comparison Must Use Hostname Only, Not Full URL

**Lesson:** A prior version of `api.jsx` compared `window.location.hostname` against a full URL string (`"https://nexis-l8oc.onrender.com"`) instead of a bare hostname. This comparison always returned `false` in a browser, meaning the local dev fallback never triggered correctly.

**Resolution:** Fixed to compare against bare hostname (`"nexis-l8oc.onrender.com"`).

**Evidence:** `api.jsx` comment: *"Local dev detection — compares hostname only (not full URL). 'https://nexis-l8oc.onrender.com' is a full URL string, not a hostname, so it was previously always false and never matched in a browser. Fixed: compare against the bare hostname."*

**Related Files:**
- `frontend/src/api/api.jsx`

---

```
Decision ID:        D-045
Status:             Verified
Category:           Lessons
```

**Title:** Overlay Startup Timing Requires Careful Sequencing and Timer Cleanup

**Lesson:** The startup overlay chain (LogoOverlay → OnboardingOverlay → AcknowledgmentModal) involves timers and visibility state. Race conditions between overlay transitions, missing timer cleanup on unmount, and localStorage access during startup have all caused fragile behavior.

**Resolution:** `OnboardingOverlay` mounts only after `LogoOverlay` completes (via callback). Timer cleanup is validated. localStorage access is wrapped. `ArcNexusApp.jsx` manages the sequence through state rather than timers alone.

**Evidence:** `KNOWN_ISSUES.md` — "Startup / Overlay Flow: Status: Active Review Area"

**Related Files:**
- `frontend/src/ArcNexusApp.jsx`
- `docs/ai/KNOWN_ISSUES.md`

---

```
Decision ID:        D-046
Status:             Verified
Category:           Lessons
```

**Title:** Whisper Model Must Be Loaded Lazily, Not at Import Time

**Lesson:** Loading `faster_whisper.WhisperModel` at module import time slows application startup significantly and fails if the model is not downloaded. Heavy AI dependencies must be deferred to first use.

**Resolution:** `_get_whisper_model()` loads the model on first call and caches it. Import of `faster_whisper` is inside the function body.

**Evidence:** `services/assimilation.py` comment: *"Heavy imports (yt_dlp, faster_whisper, youtube_transcript_api) are deferred to function bodies — NOT loaded at import time."*

**Related Files:**
- `backend/app/services/assimilation.py`

---

## Section 6 — Failed or Rejected Approaches

---

```
Decision ID:        D-050
Status:             Verified Failure
Category:           Architecture
```

**Title:** Hardcoded Ollama URL in LLM Service

**Problem:** An earlier version of `llm_service.py` hardcoded an Ollama URL (likely `http://localhost:11434`). This broke portability between local and hosted deployments.

**Why It Failed:**
- On a hosted server (Render), Ollama is not installed. A hardcoded localhost URL always fails silently or with a confusing connection error.
- Cannot be overridden without code changes.

**Resolution:** `OLLAMA_URL` is read from environment. If not set, raises HTTP 503 with an explanatory message.

**Evidence:** `llm_service.py` — *"Version: 004 (env-var URL — no hardcoded Ollama host)"*

**Related Files:**
- `backend/app/services/llm_service.py`

---

```
Decision ID:        D-051
Status:             Verified Failure
Category:           Architecture
```

**Title:** Subprocess Calls to `ollama` CLI from Backend

**Problem:** An earlier version of `system.py` used subprocess calls to `ollama` CLI for status checking. On hosted servers (Render), Ollama is not installed. Subprocess calls always fail silently.

**Why It Failed:**
- Server does not have `ollama` binary
- Failures were silent — status reported incorrectly
- Wrong layer of responsibility: Ollama status is a user-machine concern, not a server concern

**Resolution:** `system.py` no longer calls `ollama` subprocess. Ollama status is handled exclusively by the NEXIS Companion on the user's machine.

**Evidence:** `system.py` — *"Subprocess calls to 'ollama' were removed because they always fail silently on Render (ollama is not installed there). Ollama status is reported by the NEXIS Local Companion bridge (localhost:8765 on the user's machine), not from this API."*

**Related Files:**
- `backend/app/api/routes/system.py`

---

```
Decision ID:        D-052
Status:             Verified Failure
Category:           Auth
```

**Title:** Magic Link / OTP Authentication

**Problem:** Magic link authentication was present in an earlier version. It was deliberately removed.

**Why It Failed / Was Rejected:**
- Adds complexity to the auth flow
- Depends on email delivery speed for every login
- For a local-first tool, predictability of the login experience is more important than passwordless convenience

**Resolution:** Removed entirely. Email + password only.

**Evidence:** `auth.js` — *"AUTH CHANGE: Removed magic-link / OTP entirely."*. `AppLayout.jsx` — *"AUTH CHANGE: All magic-link / OTP code removed."*

---

```
Decision ID:        D-053
Status:             Verified Failure
Category:           Architecture
```

**Title:** Full-Body BeautifulSoup Extraction for Article URLs

**Problem:** The original URL ingestion implementation used `BeautifulSoup.get_text(separator="\n")` on the entire DOM after stripping only `script`, `style`, `noscript`, `header`, `footer`, `nav`, `form`, `iframe`, and `table` tags. Wikipedia was the only special-case extraction path.

**Why It Failed:**
- Modern news sites embed navigation, sidebars, "Latest Articles" lists, ads, membership prompts, homepage modules, and footer content directly in the `<body>` — none of which is removed by stripping the handful of structural tags above
- The extracted text for a single Times of Israel article included 18 of 26 known boilerplate contamination markers alongside the article content
- The contaminated source text was stored and fed directly into Summary Package and Creator Package generation, causing the LLM to summarize homepage content rather than the selected article
- There was no contamination detection, no warning, and no visible indication that extraction had failed

**Measured Impact:** Times of Israel article URL — before fix: 31,957 chars, 18/26 contamination markers, generation output focused on unrelated current homepage stories. After fix (D-028): 3,654 chars, 0/26 contamination markers, all 8 article-specific topic keywords present.

**Resolution:** Replaced with the three-strategy pipeline documented in D-028. `trafilatura` text-density extraction is the primary path. BS4 semantic selector fallback is the secondary path. Noise-stripped full body is the last resort, always accompanied by a user-visible warning.

**Related Files:**
- `backend/ingestion/url_utils.py` — prior approach was in the HTML branch; replaced in version 007

---

## Section 7 — Open Questions

---

```
Decision ID:        D-060
Status:             Future Discussion Required
Category:           Architecture
```

**Title:** Backend Persistence Migration for Frontend Project Data

**Problem:** Project data, raw items, and outputs currently live in `localStorage`. This is documented as a temporary adapter. The migration to backend persistence has not been designed or implemented.

**Open Questions:**
- Which backend endpoints will replace the localStorage adapter functions?
- What schema changes are needed in SQLite?
- How are existing localStorage records migrated?
- Is migration performed automatically on first login, or is it a manual export/import?

**Current State:** `projectStorage.js` labeled *"swap these functions for API calls when backend integration is ready."*

**Related Files:**
- `frontend/src/utils/projectStorage.js`

---

```
Decision ID:        D-061
Status:             Future Discussion Required
Category:           Architecture
```

**Title:** Future Hosted NEXIS — Separate Product or Shared Codebase?

**Open Questions:**
- Is hosted NEXIS built from the same codebase with `NEXIS_HOSTED_MODE=True`?
- Or is it a separate fork/repo?
- Which features of NEXIS-LOCAL translate directly to hosted?
- How is multi-user isolation designed?
- What replaces `DEFAULT_USER_ID = "default"`?

**Current State:** `NEXIS_HOSTED_MODE: bool = False` exists as a flag. Some hosted-mode code paths exist (e.g., `vision.py` blocks image analysis in hosted mode). No full hosted product has been implemented.

---

```
Decision ID:        D-062
Status:             Future Discussion Required
Category:           Architecture
```

**Title:** Multi-User Support on a Single Installation

**Open Questions:**
- Should multiple local users ever share one NEXIS-LOCAL installation?
- If so, how is per-user data isolation handled in SQLite?
- Does Supabase auth become the source of user IDs replacing `DEFAULT_USER_ID`?
- How does localStorage data get isolated per Supabase user?

**Current State:** Not implemented. Single-user assumption is deep in the codebase.

---

```
Decision ID:        D-063
Status:             Future Discussion Required
Category:           Architecture
```

**Title:** Real Billing and Tier Enforcement

**Open Questions:**
- When real billing is added, do the `99999` limits get replaced with actual values?
- Is enforcement done server-side only, or also client-side?
- Is Stripe or another payment provider integrated with Supabase?
- Does the tier system stay as-is, or is it redesigned?

**Current State:** Tier/plan system exists in code. All limits set to `99999`. Enforcement runs but never blocks.

---

```
Decision ID:        D-064
Status:             Future Discussion Required
Category:           Architecture
```

**Title:** Companion Binary Distribution and Updates

**Open Questions:**
- How does the user know there is a companion update?
- Is there an auto-update mechanism?
- What is the versioning strategy for companion releases?
- What happens when frontend expects a new companion endpoint that an older binary does not have?

**Current State:** Companion is distributed as a GitHub release binary. `bridge.js` references GitHub release URLs. No auto-update logic exists.

---

## Section 8 — How Future AI Should Use This Log

---

### Before Replacing Logic

Before replacing any existing logic, search this log for the relevant system. If a decision record exists, read it. The complexity you are about to remove may be the resolution to a known failure documented here.

Specifically:

- Before removing the legacy Ollama URL migration in `bridge.js` → Read **D-040**
- Before changing CORS order in `main.py` → Read **D-021** and **D-042**
- Before removing the `try/catch` in `projectStorage.js` → Read **D-041**
- Before adding subprocess Ollama calls to the backend → Read **D-051**
- Before adding magic link auth back → Read **D-052**
- Before hardcoding any service URLs → Read **D-050**
- Before removing or changing `DEFAULT_USER_ID` → Read **D-002**
- Before simplifying or removing the URL article extraction pipeline (trafilatura, BS4 selectors, contamination detection) → Read **D-028** and **D-053**
- Before re-adding a Supabase auth gate or login screen → Read **D-035**

### Before Simplifying Code

If code appears unnecessarily complex, ask: *is this complexity solving a problem documented here?*

Complexity categories to be suspicious of:
- Error code constants in `bridge.js` → user-facing diagnostic system, not accidental
- Dual-artifact image output → two distinct downstream consumers, not redundant
- Rules loaded from files at startup → deliberate separation of prompt engineering from code
- CORS registered before routers → load-order requirement, not convention

### Before Removing Fallbacks

Every graceful fallback in this codebase exists because the non-fallback path has failed before. Do not remove:
- The SQLite default when `DATABASE_URL` is empty
- The `[OCR UNAVAILABLE]` message when Tesseract is missing
- The `_SUMMARY_RULES = ""` fallback when the rules file is missing
- The `503` response when `OLLAMA_URL` is not set

These are not dead code. They are the designed failure modes.

### When a New Decision Is Made

Add a new entry to this log. Include:
- What the problem was
- What was tried before
- What was decided and why
- What breaks if the decision is reversed

A decision log entry costs 10 minutes to write and can save hours of re-investigation later.

---

*Add entries whenever a significant decision is made, a known failure is resolved, or a rejected approach is formally closed. Do not let this document drift from the actual codebase.*
