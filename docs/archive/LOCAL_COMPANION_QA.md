# NEXIS Local Companion — QA Checklist

**Scope:** Internal QA / regression checklist for the NEXIS Local Companion architecture.  
**Audience:** Developers and QA testers. Not for end users.  
**Last updated:** 2026-05-07  

---

## Architecture Overview (for reference)

```
Browser (Vercel)  →  NEXIS Local Companion (localhost:8765)  →  Ollama (localhost:11434)  →  AI model
```

- The browser **never** calls `localhost:11434` directly (CORS blocks it).  
- All local generation, Ollama management, and model downloads route through the Companion.  
- Auth, Supabase storage, usage tracking, and collect/ingestion are **not** affected by Companion state.

---

## Test Environment Requirements

| Item | Value |
|------|-------|
| Companion binary | `nexis-bridge.exe` (Win) / `nexis-bridge` (Mac/Linux) built from `bridge/` |
| Companion port | 8765 |
| Ollama port | 11434 |
| Frontend | `http://localhost:3000` (dev) or `https://nexis-psi.vercel.app` (prod) |
| Recommended model | `qwen2.5:7b` |

---

## Section 1 — Companion Binary

### 1.1 Build
- [ ] `build.bat` (Windows) runs without errors: `go mod init nexis-bridge && go build . -o nexis-bridge.exe`
- [ ] `build.sh` (Mac/Linux) runs without errors
- [ ] Binary starts and prints startup banner with: version, port, Ollama path, model list
- [ ] Port conflict: if 8765 is in use, companion prints clear error and waits for Enter before exiting

### 1.2 CORS
- [ ] `GET /health` responds to `Origin: https://nexis-psi.vercel.app` with correct CORS headers
- [ ] `GET /health` responds to `Origin: https://nexis-abc123.vercel.app` (preview) with CORS headers
- [ ] `GET /health` responds to `Origin: http://localhost:3000` with CORS headers
- [ ] `GET /health` responds to `Origin: https://evil.com` **without** CORS headers (request still responds but no ACAO header)
- [ ] Preflight `OPTIONS /generate` returns 204 with CORS headers for trusted origins

---

## Section 2 — Companion Endpoints

### 2.1 GET /health
- [ ] Returns `{ status: "ok", bridge_version, ollama_installed, ollama_path, ollama_reachable, model_storage, recommended_model }`
- [ ] `ollama_installed: true` when Ollama is on PATH or in known install dirs
- [ ] `ollama_installed: false` when Ollama is not found anywhere
- [ ] `ollama_reachable: true` only when Ollama responds to `/api/tags` within 3s
- [ ] `ollama_path` is non-empty string when installed, empty string when not

### 2.2 GET /diagnostics
- [ ] Returns all fields: `companion_ok`, `bridge_version`, `ollama_installed`, `ollama_path`, `ollama_running`, `ollama_version`, `models`, `model_storage`, `has_nvidia_gpu`, `cpu_count`, `platform`, `recommended_model`
- [ ] `models` is `[]` (empty array, not null) when Ollama is not running
- [ ] `models` is an array of strings when Ollama is running with models
- [ ] `ollama_version` is populated when Ollama is installed; empty string otherwise

### 2.3 GET /ollama/find
- [ ] Returns `{ found: true, path: "...", searched_paths: [...] }` when Ollama is installed
- [ ] Returns `{ found: false, path: "", searched_paths: [...] }` when not installed
- [ ] `searched_paths` contains all platform-specific candidate paths

### 2.4 POST /ollama/start
- [ ] Returns `{ already_running: true, ollama_now_running: true }` if Ollama was already up
- [ ] Returns `{ started: true, ollama_now_running: true }` when Ollama starts successfully
- [ ] Returns `{ started: true, ollama_now_running: false }` if Ollama starts but does not become ready within 20s
- [ ] Returns error `OLLAMA_NOT_INSTALLED` if Ollama binary not found
- [ ] Returns error `START_FAILED` if `exec.Command` fails
- [ ] Does not error if called twice while Ollama is running (idempotent)

### 2.5 POST /ollama/restart
- [ ] Kills existing `ollama.exe` / `ollama` process, waits 1s, starts fresh
- [ ] Returns `{ restarted: true, ollama_now_running: true }` on success
- [ ] Returns `{ restarted: true, ollama_now_running: false }` if restart fails to come up
- [ ] Returns error `OLLAMA_NOT_INSTALLED` if binary not found
- [ ] Works even if Ollama was not running (kill is non-fatal)

### 2.6 GET /models
- [ ] Returns `{ models: [...], recommended_model: "qwen2.5:7b" }` when Ollama running with models
- [ ] Returns `OLLAMA_NOT_RUNNING` error when Ollama installed but not running
- [ ] Returns `OLLAMA_NOT_INSTALLED` error when Ollama not found
- [ ] Returns `NO_MODELS` error (not empty array) when Ollama running but `models: []` from `/api/tags`
- [ ] **Critical:** `NO_MODELS` is only returned after confirming Ollama is reachable AND `/api/tags` returns HTTP 200 AND models list is empty

### 2.7 POST /models/pull
- [ ] Returns `{ job_id, model, started: true }` immediately (async)
- [ ] Returns `OLLAMA_NOT_RUNNING` if Ollama not reachable
- [ ] Defaults to `qwen2.5:7b` if no model in request body

### 2.8 GET /models/pull/progress?job=<id>
- [ ] SSE stream: sends `data: {...}\n\n` events
- [ ] Each event has `status`, `completed`, `total` fields
- [ ] Final event has `done: true` or `status: "success"` or `error` field
- [ ] Returns 404 if `job` param is missing or unknown
- [ ] Stream closes after job completes

### 2.9 POST /generate
- [ ] Returns `{ output: "..." }` for a valid model + prompt
- [ ] Returns `OLLAMA_NOT_RUNNING` if Ollama not reachable
- [ ] Returns `OLLAMA_NOT_INSTALLED` if Ollama binary missing
- [ ] Returns `MODEL_NOT_AVAILABLE` if model not in Ollama's list
- [ ] Returns `GENERATION_FAILED` if Ollama responds with error
- [ ] Returns `GENERATION_FAILED` if Ollama responds with empty `response` field
- [ ] Timeout is 180s (does not return before that for large model prompts)

### 2.10 GET /system
- [ ] Returns `ollama_installed`, `ollama_path`, `ollama_running`, `models`, `model_storage`, `platform`, `cpu_count`, `has_nvidia_gpu`

### 2.11 POST /diagnostics/open-terminal
- [ ] Opens `cmd` on Windows
- [ ] Opens `Terminal` app on macOS
- [ ] Opens first available terminal emulator on Linux
- [ ] Returns `{ opened: true, shell: "..." }` on success
- [ ] Returns `NO_TERMINAL` error on Linux if no emulator found
- [ ] **Must not** be accessible without explicit user intent (frontend guards this under Advanced > Troubleshooting with a confirmation dialog)

---

## Section 3 — Frontend: bridge.js

### 3.1 getDiagnostics()
- [ ] Returns full diagnostics object when companion running
- [ ] Returns `null` (not an error) when companion not running
- [ ] Never throws

### 3.2 checkBridge()
- [ ] Returns `{ reachable: false }` when companion not running (TypeError/AbortError caught)
- [ ] Returns `{ reachable: true, ollamaInstalled: true/false, ollamaReachable: true/false }` when companion running

### 3.3 startOllama() / restartOllama()
- [ ] Returns `{ ollamaNowRunning: true }` on success
- [ ] Returns `{ error, code }` on failure — does not throw
- [ ] Timeout is 25s (generous for Ollama startup)

### 3.4 fetchBridgeModels()
- [ ] Returns `{ models: string[], recommendedModel }` on success
- [ ] Returns `{ error, code }` on failure — does not throw
- [ ] `models` is always an array (never null)

### 3.5 pullModel() + subscribePullProgress()
- [ ] `pullModel()` returns `{ jobId, model, started }` or `{ error, code }`
- [ ] `subscribePullProgress()` calls `onProgress({ status, completed, total, percent })` during download
- [ ] `subscribePullProgress()` calls `onDone({ success: true })` on completion
- [ ] `subscribePullProgress()` calls `onDone({ success: false, error })` on failure
- [ ] Returns a cancel function that aborts the SSE stream cleanly

### 3.6 generateViaBridge()
- [ ] Returns `{ output }` on success
- [ ] Returns `{ error, code }` on all failure cases — does not throw
- [ ] Used by `api.jsx` `runViaBridge()` which converts errors to thrown Error

### 3.7 Legacy endpoint migration (getModelConfigWithMigration)
- [ ] Old config with `endpoint: "http://localhost:11434"` → migrated to `http://localhost:8765` in localStorage
- [ ] Old config with `endpoint: "http://127.0.0.1:11434"` → same migration
- [ ] Config without endpoint → not affected
- [ ] Config with `endpoint: "http://localhost:8765"` → not modified
- [ ] Migration is silent (no user-visible change)

---

## Section 4 — Frontend: ModelConfig.jsx State Machine

### 4.1 State transitions
- [ ] Modal open → immediately runs detection → shows `CHECKING`
- [ ] Companion not found → `COMPANION_NOT_RUNNING` (no retry — companion is either there or not)
- [ ] Companion found, `ollama_installed: false` → `OLLAMA_NOT_INSTALLED`
- [ ] Companion found, `ollama_installed: true`, `ollama_running: false` → `OLLAMA_NOT_RUNNING`
- [ ] `ollama_running: true`, `models: []` → `NO_MODELS` (**not** CHECK_FAILED_TEMP)
- [ ] `ollama_running: true`, `models: [...]` → `MODEL_READY`
- [ ] Had saved config + companion unreachable → `CHECK_FAILED_TEMP` (not `COMPANION_NOT_RUNNING`)
- [ ] **Critical:** `NO_MODELS` state is ONLY shown after: Ollama confirmed running + `/api/tags` HTTP 200 + empty list

### 4.2 "Start Ollama" action
- [ ] Shows `OLLAMA_STARTING` state while waiting
- [ ] On success → re-runs full detection → transitions to appropriate state
- [ ] On failure (20s timeout) → transitions to `OLLAMA_HUNG`
- [ ] Button is disabled during `isBusy` states

### 4.3 "Restart Ollama" action
- [ ] Calls `restartOllama()`, shows `OLLAMA_STARTING`
- [ ] On success → re-runs detection
- [ ] On failure → `OLLAMA_HUNG`

### 4.4 "Download Recommended Model" action
- [ ] Shows `PULLING_MODEL` with progress bar
- [ ] Progress updates via SSE subscription
- [ ] On complete → re-runs detection → `MODEL_READY`
- [ ] On failure → `PULL_FAILED`
- [ ] Cancel button aborts SSE stream

### 4.5 UI rules
- [ ] Terminal access only visible under Advanced → Troubleshooting (double-collapsed)
- [ ] "Open Command Prompt" button shows confirmation dialog before opening
- [ ] Endpoint field hidden under Advanced (never shown in primary flow)
- [ ] Save button disabled unless `uiState === "MODEL_READY"` and `selectedModel` is set
- [ ] Provider tab unaffected by local tab state

### 4.6 Workspace status row
- [ ] No config → "No model configured" (red dot)
- [ ] Saved local, `null` liveState → "Saved — not checked" (amber dot)
- [ ] `CHECKING` → "Checking your local AI…" (amber dot)
- [ ] `COMPANION_NOT_RUNNING` → "NEXIS Companion is not running" (red dot)
- [ ] `OLLAMA_NOT_RUNNING` → "Ollama is installed but not open" (red dot)
- [ ] `MODEL_READY` → "Local AI is ready — {model}" (green dot)
- [ ] Provider config → "Provider configured (name)" (green dot)

---

## Section 5 — api.jsx Routing

- [ ] `nexisConvert()` with `type: "local"` config → calls `runViaBridge()` → **not** Render backend
- [ ] `nexisConvert()` with `type: "provider"` config → calls Render backend
- [ ] `nexisConvert()` with `null` config → calls Render backend
- [ ] `nexisCreate()` same routing logic as above
- [ ] Bridge error in `runViaBridge()` → thrown as user-facing Error (not silent)
- [ ] **No direct calls to `localhost:11434` anywhere in frontend code**

---

## Section 6 — Backend (Render)

### 6.1 llm_service.py
- [ ] `OLLAMA_URL` env var not set → `run_llm()` raises `HTTP 503` with message about NEXIS Local Companion
- [ ] `OLLAMA_URL` env var set → `run_llm()` calls that URL
- [ ] No hardcoded `localhost:11434` references remain

### 6.2 system.py
- [ ] `GET /api/system/check` returns a `note` field explaining Ollama is local, not server-side
- [ ] `GET /api/system/check` does **not** attempt to run `ollama` subprocess
- [ ] `POST /api/system/fix/models` returns `HTTP 503` with user-friendly message
- [ ] `GET /api/system/gpu` still works (uses Python GPU detection, not subprocess ollama)

---

## Section 7 — Auth & Unrelated Features Regression

- [ ] Sign in with email/password works after all companion changes
- [ ] Sign up works
- [ ] Password reset works
- [ ] Supabase project storage (create/delete/load project) works
- [ ] Collect / ingestion (URL, file, image) unaffected
- [ ] Usage tracking (`syncUsage`, `addProjectUsage`) unaffected
- [ ] Provider mode API key save/load unaffected
- [ ] Vision analyze endpoint unaffected
- [ ] No auth bypass introduced (auth gate still keyed off Supabase session only)

---

## Section 8 — Migration Regression

- [ ] User with old localStorage `nexis_model_config` pointing at `http://localhost:11434`:
  - Opens app → `getModelConfigWithMigration()` auto-migrates endpoint to `http://localhost:8765`
  - Migrated config is written back to localStorage
  - No user prompt or error shown
- [ ] User with no localStorage config → no migration attempted, null returned
- [ ] User with `type: "provider"` config → migration not triggered (local type check)

---

## Section 9 — Help System

- [ ] Help overlay opens and closes correctly
- [ ] Left nav TOC renders all 11 sections
- [ ] Clicking a nav item scrolls to correct section
- [ ] Active section highlight updates as user scrolls
- [ ] "Local AI Setup" section visible and readable
- [ ] State table shows all 11 states with correct wording matching ModelConfig.jsx
- [ ] No terminal commands visible in primary Help content
- [ ] Terminal/advanced content is inside collapsed `Collapsible` sections
- [ ] All external links (`ollama.com/download`, Companion download) open in new tab
- [ ] PageOverlay `maxWidth={1040}` — sidebar + content do not overlap or overflow on 1280px viewport
- [ ] Other overlays using PageOverlay default still render at 760px max-width

---

## Section 10 — End-to-End Happy Path

1. [ ] Fresh machine (no Ollama, no config)
2. [ ] User opens NEXIS → opens AI Model Settings
3. [ ] NEXIS shows "NEXIS Companion is not running" → user starts companion → clicks Recheck
4. [ ] NEXIS shows "Ollama is not installed" → user clicks Install Ollama → installs → clicks Recheck
5. [ ] NEXIS shows "Ollama is installed but not open" → user clicks Start Ollama → NEXIS starts it
6. [ ] NEXIS shows "No AI model found" → user clicks Download Recommended Model → progress bar appears
7. [ ] Download completes → NEXIS shows "Local AI is ready" with model selected
8. [ ] User clicks Save → modal closes → workspace row shows "Local AI is ready — qwen2.5:7b"
9. [ ] User creates a package → generation routes through companion → output appears
10. [ ] User closes browser and reopens → config restored from localStorage → workspace row shows "Saved — not checked"

---

*This document is internal QA only. Do not include in user-facing help content.*
