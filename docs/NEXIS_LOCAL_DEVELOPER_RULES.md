# NEXIS-LOCAL — Developer Rules

**Project:** NEXIS-LOCAL  
**Organization:** ARC NEXUS LLC  
**Document Type:** Development Rules and Working Conventions  
**Last Updated:** 2026-05-29 (Documentation Sync)  
**Audience:** AI assistants, engineers, contributors  

> This document tells you **how to work on NEXIS-LOCAL safely**. It is not architecture documentation. It is not user documentation. It is not a decision log. Read this before touching any code.

---

## Section 1 — Core Development Philosophy

### 1.1 Preserve Working Systems

If something is working, the default answer is: leave it alone.

A working UI flow, a working ingestion path, a working generation call — these are more valuable than cleaner code. Do not refactor working systems in order to fix an adjacent bug. Do not rewrite files that are not involved in the task.

### 1.2 Stability Over Cleverness

NEXIS-LOCAL is in MVP stabilization. The priority is predictable, reliable behavior for one user on one machine.

Do not introduce clever abstractions, dynamic patterns, or sophisticated architectures to solve problems that a simple fix would resolve. The simplest solution that works correctly is the right solution.

### 1.3 Smallest Useful Change

Every change should be scoped to the minimum required to accomplish the task.

- If a bug is in one function, fix that function.
- If a component needs a new prop, add that prop.
- If a route needs a new field, add that field.

Do not touch code that is outside the blast radius of the task. Do not "clean up while you're in there."

### 1.4 Understand Before Modifying

Before editing any file:

1. Read the file in full.
2. Understand what it does, what it exports, and what depends on it.
3. Verify the current behavior is what you think it is.
4. Confirm the change will not break anything the file touches.

Never edit a file based on its filename alone.

### 1.5 No Unnecessary Rewrites

Do not rewrite a file unless:
- The existing structure is actively causing the bug, or
- The user has explicitly requested a rewrite.

Rewrites introduce risk, lose context in comments, and can break behavior in subtle ways. A targeted patch is almost always better.

### 1.6 Local-First by Default

Every decision must default to local-first behavior. If a feature can be implemented locally or with a cloud service, implement it locally. If adding a network call, stop and ask first.

The default assumption for any new code is: runs on one machine, offline if needed, no external service required.

---

## Section 2 — Local-First Protection Rules

### 2.1 Prohibited Without Explicit Approval

AI assistants and developers must not introduce any of the following without the user explicitly requesting it:

| Prohibited | Why |
|---|---|
| Required cloud processing | NEXIS-LOCAL processes everything locally |
| Required hosted inference | Ollama is the AI layer; external APIs are secondary |
| Required external APIs | No mandatory third-party dependencies |
| Telemetry | No usage data collection |
| Analytics | No behavioral tracking |
| Remote storage | Projects and outputs stay on the user's machine |
| Raw `fetch()` to `localhost:11434` outside `bridge.js` | All direct Ollama calls must go through `generateDirectOllama()` in `bridge.js` — keeps the call site centralized and auditable |
| Hosted-mode assumptions | `NEXIS_HOSTED_MODE` is `False` and must stay `False` |

### 2.2 Secondary / Optional Features Must Remain Optional

Provider API key support (OpenAI, Anthropic, etc.) exists as a fallback mode, not a default. Any changes to AI generation must preserve local mode as the primary path.

Feature flags in `config.py` (`WHISPER_ENABLED`, `OCR_ENABLED`, `VISION_ENABLED`, `YOUTUBE_INGESTION_ENABLED`, `NEXIS_HOSTED_MODE`) all default to `False`. Do not change defaults. Do not enable flags unconditionally.

### 2.3 New Network Calls Require Justification

Before adding any `fetch()`, `requests.post()`, or outbound HTTP call to the codebase:

1. State which external host is being called.
2. Explain why it cannot be done locally.
3. Confirm user approval before proceeding.

---

## Section 3 — File Modification Rules

### 3.1 Read Before Editing

Always read the complete current content of a file before editing it. Never edit based on:
- Filename alone
- Assumed content from previous context
- Partial reads

If a file is long, read it in full. Understanding the full context prevents accidental behavior changes.

### 3.2 Return Full Updated Files

When rewriting or significantly modifying a file:

- Return the complete file.
- No snippets with surrounding context omitted.
- No placeholder comments like `// ... rest of file` or `// existing code`.
- No omission markers.

The user must be able to replace the file directly with the returned content.

### 3.3 Snippets Only When Explicitly Requested

If the user asks for a specific function, component, or code block — return only that. Do not infer that a snippet is acceptable when a full file was expected.

When in doubt: return the full file.

### 3.4 Identify All Modified Files

At the conclusion of any change, state clearly:

- Which files were modified.
- What was changed in each file (one line summary per file).
- Which files were read but not modified.

### 3.5 Explain Why Changes Matter

For any non-trivial change, explain:

- What the bug or gap was.
- Why this specific change fixes it.
- What would break if the change were done differently.

Do not submit changes silently.

### 3.6 Preserve Comments and Structure

Comments in NEXIS-LOCAL files are engineering memory. They explain past decisions, known fragility, and intentional behavior. Preserve all comments unless the code they describe has been removed. Do not reformat files. Do not rearrange sections.

---

## Section 4 — Feature Development Rules

### 4.1 Do Not Infer New Features

If the user's request is ambiguous, stop and clarify. Do not infer that a missing feature should be added. Do not assume that adjacent functionality implies a new feature should be built.

Only implement what was explicitly requested.

### 4.2 Do Not Add Surprise Workflows

Do not introduce new UI flows, new API routes, new generation modes, or new configuration options unless the user asked for them. Surprise additions create maintenance burden and unexpected behavior.

### 4.3 Do Not Create Hidden Behaviors

Do not add:
- Silent fallbacks that change behavior without user visibility
- Background polling without clear UI indication
- Auto-save behavior that was not previously present
- Auto-retry logic that masks errors

If behavior changes, the user must be able to see it.

### 4.4 Protected Systems — Do Not Modify Without Request

The following systems must not be changed unless the user explicitly tasks a change to that system:

| System | Protected Behavior |
|---|---|
| Local auth constants | `LOCAL_USER` and `LOCAL_PROFILE` in `AppLayout.jsx`. Do not re-introduce an auth gate or a second auth system. |
| Bridge / generation | All AI generation goes through `bridge.js` → `generateDirectOllama()`. Do not add raw `fetch()` to Ollama outside `bridge.js`. |
| Companion management | `getDiagnostics`, `startOllama`, `restartOllama`, `pullModel`, `subscribePullProgress`, `openTerminal` — do not remove without explicit instruction. |
| localStorage adapter | `projectStorage.js` is the current persistence layer. Do not migrate. |
| Database default | SQLite is the default. Do not add PostgreSQL migration. |
| Feature flags | All default to `False`. Do not change defaults. |
| `DEFAULT_USER_ID` | Hardcoded `"default"`. Do not introduce user-scoped logic. |

### 4.5 Ask Before Adding New Concepts

If implementing a request would require introducing a new concept — a new state manager, a new storage layer, a new auth method, a new service dependency — stop and ask before proceeding. Do not introduce new concepts silently.

---

## Section 5 — UI/UX Rules

### 5.1 Novice-Friendly First

This application is intended to be usable by people who are not developers. Workflows must be clear, labels must be legible, and error messages must be human-readable.

Do not add UI that requires technical knowledge to understand.

### 5.2 Clear Setup Flow

Onboarding and setup steps must be explicit and sequential. The user should always know:
- What they need to do next.
- Whether the local AI is running.
- Whether they are connected.

Do not remove setup guidance or diagnostic feedback.

### 5.3 No UI Clutter

Do not add new UI elements, panels, modals, or overlays unless explicitly requested. The existing layout has been deliberate. Adding controls that were not requested creates confusion.

### 5.4 No Unnecessary Animations

Transitions and animations must serve a clear purpose (conveying state change, directing attention). Do not add cosmetic animations. Do not make existing transitions more elaborate.

### 5.5 Preserve Working Layouts

If a layout works correctly, do not restructure it. Do not change component hierarchy, CSS class names, or styling rules unless the change is directly related to the task. Layout regressions are difficult to diagnose.

### 5.6 Keep Local AI Status Understandable

The companion status — whether Ollama is running, which model is loaded, whether a pull is in progress — must always be surfaced clearly to the user. Do not reduce or hide diagnostic information.

### 5.7 Do Not Bury Diagnostics

The DiagnosticsOverlay and system check flow exist for a reason. Users troubleshooting local AI issues depend on them. Do not:
- Remove diagnostic endpoints
- Shorten error messages
- Replace specific errors with generic messages
- Gate diagnostics behind additional steps

---

## Section 6 — Debugging Rules

When diagnosing a problem in NEXIS-LOCAL, work through this checklist in order.

### 6.1 Ports

| Service | Expected Port | Check |
|---|---|---|
| React frontend | 3000 | Browser navigates to `http://localhost:3000` |
| FastAPI backend | 8000 (default) | `http://localhost:8000/health` returns `{"status": "ok"}` |
| NEXIS Companion | 8765 | `http://localhost:8765/health` returns companion status |
| Ollama | 11434 | `http://localhost:11434/api/tags` lists models |

### 6.2 Companion Status

- Is `NEXIS.Companion.exe` (Windows) or `nexis-bridge-linux` (Linux) running?
- Does `GET /health` on port 8765 respond?
- Does `GET /diagnostics` report Ollama reachable?
- Is the companion binary current? (Stale binary may have mismatched endpoints.)

### 6.3 Ollama Status

- Is Ollama installed? Check known paths in `nexis_bridge.go` for the current platform.
- Is the required model pulled? `ollama list` or `GET /models` on the companion.
- Is the model name in localStorage config an exact match to `ollama list` output?
- Is Ollama consuming port 11434?

### 6.4 Local Auth

- NEXIS-LOCAL has no cloud auth. `AppLayout.jsx` uses `LOCAL_USER` and `LOCAL_PROFILE` constants.
- Supabase files (`auth.js`, `supabase.js`) remain but are unused by the auth flow (Phase 2 cleanup deferred).
- `REACT_APP_SUPABASE_URL` and `REACT_APP_SUPABASE_ANON_KEY` may be absent — the app works without them.

### 6.5 Python / Backend

- Is the virtual environment activated before running `uvicorn`?
- Does `pip list` show `fastapi`, `sqlalchemy`, `pydantic-settings`, `pydantic`?
- Is `nexis.db` present or will it be created on startup?
- Is `NEXIS_TESSERACT_PATH` set in `.env` (if OCR is used and Tesseract is not on PATH)?
- Is `ffprobe` on PATH (if audio/video ingestion is used)? (`shutil.which("ffprobe")` is used — no hardcoded path)

### 6.6 Frontend Environment Variables

- Is `REACT_APP_API_BASE_URL` set for production?
- In local dev, the CRA proxy routes API calls to `localhost:8000` automatically — `REACT_APP_API_BASE_URL` is not required
- Are env vars prefixed with `REACT_APP_`? Vite-style `import.meta.env` does not work — this is a CRA project.

### 6.7 localStorage

- Open DevTools → Application → Local Storage
- Are the expected `nexis_local_*` keys present?
- Is `nexis_local_nexis_model_config` set to a valid JSON object with correct `model` and `type`?
- For local mode, `type` should be `"local"` — generation calls `generateDirectOllama()` at `localhost:11434`

### 6.8 CORS

Backend CORS is defined in `app/main.py`. Companion CORS is defined in `nexis_bridge.go`.

If getting CORS errors in the browser:
- Confirm the origin (`http://localhost:3000`) is in `ALLOWED_ORIGINS` in `main.py`.
- Confirm the origin is in `trustedOrigins` in `nexis_bridge.go`.
- Confirm CORS middleware is registered before all routers in `main.py`.
- Check for preflight (`OPTIONS`) failures — these indicate CORS is not handling pre-flight correctly.

### 6.9 Root Cause First

Do not patch symptoms. If a generation call is failing:
- Is it failing at the bridge call? (companion not running)
- Or at the companion-to-Ollama call? (Ollama not running / model not loaded)
- Or at the backend API call? (backend not running / CORS / wrong URL)

Identify which layer is failing before touching code.

---

## Section 7 — Architecture Rules

### 7.1 Preserve the Three-Layer Separation

NEXIS-LOCAL has three primary layers. They must remain separated.

| Layer | Responsibility | Must Not |
|---|---|---|
| Frontend (React) | UI, state, user interaction | Own business logic; add raw Ollama calls outside `bridge.js` |
| Backend (FastAPI) | Ingestion, package generation, usage tracking | Assume hosted mode by default |
| Companion (Go) | Ollama lifecycle management (start, restart, model downloads, diagnostics) | Be bypassed for management operations |

### 7.2 Frontend AI Generation Must Use `bridge.js` → `generateDirectOllama()`

Any frontend code that sends a prompt to a model **must** route through `bridge.js` → `generateDirectOllama()`. This keeps all Ollama call logic centralized and auditable.

Forbidden patterns:
```js
// FORBIDDEN — raw fetch outside bridge.js
fetch("http://localhost:11434/api/generate", ...)

// FORBIDDEN — bypassing bridge.js entirely
fetch("http://127.0.0.1:11434/api/generate", ...)
```

Required pattern:
```js
// CORRECT — direct Ollama via bridge.js abstraction
import { generateDirectOllama, OLLAMA_DIRECT_URL } from "../lib/bridge.js";
await generateDirectOllama(prompt, model, OLLAMA_DIRECT_URL);
```

### 7.3 Backend Must Not Assume Hosted Mode

`NEXIS_HOSTED_MODE` is `False`. Do not add code that checks `if NEXIS_HOSTED_MODE` and changes core behavior for local users. Hosted-mode paths in the codebase are for future hosted builds only.

`llm_service.py` returns HTTP 503 when `OLLAMA_URL` is not set — this is intentional. In local mode, generation goes directly from `bridge.js` → `generateDirectOllama()` → Ollama, bypassing the backend entirely. The backend's LLM service is used only when `OLLAMA_URL` is configured (e.g., provider mode or future hosted mode). Do not remove this behavior.

### 7.4 SQLite Is the Local Default

`db.py` falls back to SQLite when `DATABASE_URL` is empty. This is the correct local behavior.

- Do not remove the SQLite fallback.
- Do not add Alembic migrations that assume PostgreSQL.
- Do not add schema changes that rely on PostgreSQL-only features (e.g., native `JSONB` behavior, `pg_trgm`, `ARRAY` columns) unless the project has explicitly moved to PostgreSQL.

> Note: `project.py` currently imports `JSONB` from `sqlalchemy.dialects.postgresql`. This may behave as a text column under SQLite. Verify actual behavior before relying on JSONB querying in local mode.

### 7.5 localStorage Adapter Is the Current Frontend Persistence Layer

`projectStorage.js` is the current source of truth for project data, raw items, outputs, and model config in the frontend. It is explicitly marked in the source as a temporary adapter.

Do not:
- Add a second persistence layer in parallel.
- Move data silently from localStorage to backend without user awareness.
- Change localStorage key names (this breaks existing stored data).

When backend persistence is eventually added, it must be an explicit migration task, not a side effect of another change.

### 7.6 Do Not Add Redux or Global State Frameworks

React context (`ArcNContext`) is the current global state solution. It is sufficient for the current scope.

Do not add:
- Redux / Redux Toolkit
- Zustand
- Jotai
- MobX
- Any other global state library

Unless the user explicitly requests it. `ARC_CONTEXT.md` lists "Avoid Redux/global state unless necessary" as a project priority.

### 7.7 Do Not Add New Styling Libraries

The project uses plain CSS and existing utility classes. Do not add:
- Tailwind CSS
- Styled Components
- Emotion
- CSS Modules (unless already present)
- Any new design system

Unless explicitly requested.

---

## Section 8 — Sensitive Files

These files are high-risk. A mistake in any of them can break core functionality silently or catastrophically.

---

### `backend/app/main.py`

**Why sensitive:** FastAPI entrypoint. Controls all routers, CORS policy, and middleware order.

**What breaks if modified incorrectly:**
- CORS registered after routers → preflight OPTIONS requests fail silently → all cross-origin API calls rejected
- Router removed → entire feature area (ingestion, generation, usage) disappears
- CORS origin list changed → frontend blocked from backend, no error shown to user beyond network failure

---

### `backend/app/core/config.py`

**Why sensitive:** Single source of truth for all runtime configuration. Changing any value affects global behavior.

**What breaks if modified incorrectly:**
- `OLLAMA_URL` set to a non-empty default → `llm_service.py` tries to call a server that doesn't exist in local mode
- Feature flag defaults changed → unexpected features enabled for all local users
- `NEXIS_TESSERACT_PATH` changed → OCR breaks for users with Tesseract at the default path
- `NEXIS_VISION_MODEL` changed → image pipeline requests a model that isn't installed

---

### `backend/app/core/db.py`

**Why sensitive:** Database engine and session factory. SQLite fallback lives here.

**What breaks if modified incorrectly:**
- SQLite fallback removed → startup fails for any user without `DATABASE_URL` configured
- `check_same_thread: False` removed → SQLite threading errors under concurrent requests
- Session factory misconfigured → all database operations fail with cryptic SQLAlchemy errors

---

### `backend/app/core/usage.py`

**Why sensitive:** Usage enforcement and the `DEFAULT_USER_ID` constant.

**What breaks if modified incorrectly:**
- `DEFAULT_USER_ID` changed → usage records not found; new records created with every call; old data abandoned
- Limit enforcement logic tightened → local users blocked from actions (all limits are `99999`, but the check code still runs)
- Monthly reset logic changed → counter never resets or resets too aggressively

---

### `frontend/src/lib/bridge.js`

**Why sensitive:** All local AI generation routes through this module via `generateDirectOllama()`. It is also the Companion management contract.

**What breaks if modified incorrectly:**
- `OLLAMA_DIRECT_URL` changed → `generateDirectOllama()` calls wrong endpoint; all AI generation breaks
- `BRIDGE_DEFAULT_URL` changed → all Companion management calls fail unless user has custom config
- Legacy URL migration removed → users with old stored configs cannot generate
- `generateDirectOllama()` signature changed → `runViaOllama()` in `api.jsx` breaks
- Error code constants changed → DiagnosticsOverlay shows wrong or missing error messages

---

### `frontend/src/utils/projectStorage.js`

**Why sensitive:** Primary persistence layer for all project data.

**What breaks if modified incorrectly:**
- localStorage key names changed → all existing user data silently lost on next load
- `try/catch` removed → app crashes in restricted browser environments (SecurityError)
- `loadProjects()` / `saveProjects()` signature changed → dashboard stops loading projects
- `clearAllProjectStorage()` called in wrong context → irreversible data loss

---

### `frontend/src/context/ArcNContext.jsx`

**Why sensitive:** Global state provider for the entire application. Navigation, collection state, and package state all live here.

**What breaks if modified incorrectly:**
- localStorage sync effects removed → all state lost on page refresh
- Key names changed → state conflicts between old and new keys; state not loaded correctly
- `ArcNProvider` not wrapping tree → all context consumers receive `undefined`; runtime errors everywhere
- State shape changed without updating all consumers → partial renders, missing data

---

### `frontend/src/layout/AppLayout.jsx`

**Why sensitive:** Top-level layout and local user identity. Owns `LOCAL_USER` and `LOCAL_PROFILE` constants (defined at module scope) that are passed to `NexusDashboard` and `TopBar` on every render. Controls which overlays are mounted (Help, Diagnostics) and the scroll-to-top behavior. Prior to v009 this was the Supabase auth gate — see Decision Log D-035 for history.

**What breaks if modified incorrectly:**
- `LOCAL_USER` or `LOCAL_PROFILE` constants removed or malformed → TopBar and NexusDashboard prop contracts break
- `LOCAL_PROFILE.tier` changed → tier config resolves incorrectly (all limits are 99999 locally — intentional per D-027)
- Help or Diagnostics overlay state removed → HelpOverlay / DiagnosticsOverlay cannot be opened

---

### `frontend/src/api/api.jsx`

**Why sensitive:** FastAPI client and bridge routing logic. All backend and AI calls originate here.

**What breaks if modified incorrectly:**
- `API_BASE` logic changed → backend calls point to wrong URL
- `runViaBridge()` removed or renamed → local AI generation stops working
- Model config read logic changed → bridge cannot determine which model to use
- Error parsing changed → FastAPI `{ detail: "..." }` errors not shown correctly to user

---

### `bridge/nexis_bridge.go`

**Why sensitive:** The entire companion binary. Changing this requires rebuilding and redistributing the binary.

**What breaks if modified incorrectly:**
- `bridgePort` changed → frontend default URL no longer matches; all AI calls fail
- Endpoint paths changed → `bridge.js` call sites break
- CORS `trustedOrigins` changed → frontend cannot reach companion
- `ollamaBase` changed → all Ollama management stops working
- Pull job tracking broken → model download UI hangs or shows incorrect state
- `ollamaSearchPaths` changed → companion cannot locate Ollama on user's machine

---

## Section 9 — Documentation Rules

When work is done on NEXIS-LOCAL, the appropriate documentation must be updated. Stale documentation is actively harmful — it misleads future contributors and AI assistants.

### When to Update Each Document

| Change Type | Document to Update |
|---|---|
| Architecture changes (new layer, new service, new storage) | `docs/NEXIS_LOCAL_STORAGE_AND_STRUCTURE.md` |
| Data flow changes (how data moves, new persistence) | `docs/NEXIS_LOCAL_STORAGE_AND_STRUCTURE.md` |
| What NEXIS is / is not changes | `docs/NEXIS_LOCAL_AI_HANDOFF_SOP.md` |
| Core workflow changes (new step in Collect → Create → Refine) | `docs/NEXIS_LOCAL_AI_HANDOFF_SOP.md` |
| Working rules, safety rules, how to develop | `docs/NEXIS_LOCAL_DEVELOPER_RULES.md` (this file) |
| Major decisions made (why something was chosen) | `docs/NEXIS_LOCAL_DECISION_LOG.md` |

### Documentation Standards

- Mark anything unverified as `ASSUMED` or `VERIFY IN CODE`.
- Never document future plans as current architecture.
- When hosted concepts are mentioned, mark them: **FUTURE POSSIBILITY ONLY — NOT CURRENT ARCHITECTURE**.
- Keep entries factual and evidence-based. Do not speculate.

### Documentation Is Not Optional After Architecture Changes

If a change alters how the system works, the documentation must reflect the new state before the session ends. Do not defer documentation updates.

---

## Section 10 — Git Rules

### 10.1 Commit Before Major AI-Assisted Changes

Before any AI assistant makes significant changes to the codebase:

- The current working state should be committed.
- This creates a recovery point if the change introduces a regression.

### 10.2 Create Checkpoints

For multi-step changes, create intermediate commits at each stable point. Do not accumulate all changes in a single commit across many files.

### 10.3 Use Branches for Risky Changes

Changes that touch sensitive files (see Section 8), restructure data flow, modify auth behavior, or replace a core system should be made on a dedicated branch.

This protects the working local version while the change is being validated.

### 10.4 Protect the Working Local Version

The `main` branch (or equivalent) should always represent a working local install. Do not merge work-in-progress that breaks startup, auth, or the core workflow.

### 10.5 Do Not Force Push or Amend Published Commits Without Confirmation

Destructive git operations require explicit user confirmation. AI assistants must not suggest `git push --force`, `git reset --hard`, or `git commit --amend` on commits that have already been pushed.

---

## Section 11 — Future Hosted NEXIS Warning

### Future Hosted NEXIS Is Not Current NEXIS-LOCAL

These are two different products. Do not conflate them.

NEXIS-LOCAL runs on one machine. Future hosted NEXIS would run on a server and serve multiple users. Code written for NEXIS-LOCAL will not automatically be correct for a hosted deployment.

### Do Not Introduce Hosted Assumptions Into Local Code

Hosted-mode concepts that must not appear in NEXIS-LOCAL code:

- Multi-user isolation logic
- Per-user database row scoping beyond `DEFAULT_USER_ID = "default"`
- Cloud object storage for uploaded files
- External AI inference as a required path
- Real billing enforcement
- Admin dashboards or usage telemetry
- Server-side session management beyond Supabase

If any of these appear in the codebase, they must be:
1. Clearly commented as future-only
2. Gated behind `NEXIS_HOSTED_MODE` flag
3. Defaulting to off

### Any Hosted-Specific Change Must Be Explicitly Scoped

If the user asks for something that would require hosted infrastructure, confirm explicitly:

> "This change would introduce hosted infrastructure. Should this be scoped for NEXIS-LOCAL, future hosted NEXIS, or both?"

Do not silently implement hosted patterns inside local code.

---

## Final Section — Instructions For Any Future AI

Read this section carefully. It is written directly to you.

---

### Who You Are Working With

You are working with an experienced developer building a local-first AI application. They know their codebase. They have written rules documents, decision logs, and handoff context precisely so that AI assistants do not make bad assumptions.

Respect the documented decisions. Do not override them.

### What This Project Owner Values

- **Accuracy over speed.** A careful, correct answer after a few reads is better than a fast, confident answer that is wrong.
- **Minimal changes.** The owner does not want rewrites. They want the smallest change that fixes the problem.
- **Verification.** If you are not sure what a file contains, read it. Do not guess.
- **Honesty about uncertainty.** If you cannot verify something, say so. Do not fabricate architecture.
- **Working code preserved.** If it works, it is valuable. Do not break it to clean it.

### How to Start Every Session

1. Read `docs/NEXIS_LOCAL_AI_HANDOFF_SOP.md`
2. Read `docs/NEXIS_LOCAL_STORAGE_AND_STRUCTURE.md`
3. Read `docs/NEXIS_LOCAL_DEVELOPER_RULES.md` (this file)
4. Read `docs/ai/KNOWN_ISSUES.md`
5. Read `ARC_CONTEXT.md`

Then confirm your understanding of the task before proceeding.

### Before Editing Any File

- Read it in full.
- Identify every call site that depends on what you are changing.
- State what you are about to change and why before making the change.

### When You Are Unsure

Stop. Say you are unsure. Ask for clarification or ask to read a specific file. Do not proceed on a guess.

Guessing in a tightly interconnected local system causes cascading failures that are slow to diagnose.

### When the User Asks You to Change Something Sensitive

If the user asks you to change a file listed in Section 8, or asks you to change auth, storage, the bridge, or the database:

1. State that this is a sensitive change.
2. Confirm which behavior will change.
3. Confirm what could break.
4. Ask the user to confirm before proceeding.

Do not treat sensitive changes as routine.

### What NOT to Do

- Do not add features that were not asked for.
- Do not refactor files that are not part of the task.
- Do not introduce new dependencies without asking.
- Do not change public API shapes silently.
- Do not write direct Ollama calls in the frontend.
- Do not remove or weaken error handling.
- Do not assume this is a hosted product.
- Do not add telemetry, logging endpoints, or analytics.
- Do not import cloud SDKs without explicit approval.
- Do not treat any `ASSUMED` or `VERIFY IN CODE` note in documentation as confirmed fact.

### What TO Do

- Read the files that are relevant to the task.
- Make the smallest change that accomplishes the goal.
- Return full files when rewriting.
- Preserve all comments.
- Explain what you changed and why.
- Update documentation when architecture changes.
- State uncertainty explicitly.
- Treat working code as valuable.

### The Single Most Important Rule

**If it is working, do not break it.**

Every decision in this codebase was made for a reason. Before overriding any decision, confirm with the user that overriding it is what they want. When in doubt, ask.

---

*Update this document whenever working rules or conventions change. Do not let it drift from current practice.*
