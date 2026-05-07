// ============================================================
// NEXIS - LOCAL COMPANION CLIENT
// File: src/lib/bridge.js
// Version: 002 (user-first: start/restart Ollama, pull models)
//
// All communication with the NEXIS Local Companion goes
// through this module. Nothing else in the frontend talks
// to Ollama or localhost:11434 directly.
//
// The companion runs on http://localhost:8765 on the user's
// machine and manages Ollama on their behalf.
//
// Error codes from the companion:
//   COMPANION_NOT_RUNNING  companion process not found
//   OLLAMA_NOT_INSTALLED   ollama binary not found
//   OLLAMA_NOT_RUNNING     ollama installed but not started
//   NO_MODELS              ollama running but no models
//   MODEL_NOT_AVAILABLE    requested model not in Ollama
//   GENERATION_FAILED      LLM call errored or returned empty
// ============================================================

// ?? Constants ??????????????????????????????????????????????????????????????

export const BRIDGE_DEFAULT_URL = "http://localhost:8765";
export const RECOMMENDED_MODEL  = "llama3.1:8b";

// Release asset URLs ? update the tag here for each new release.
// Supported platforms: Windows and Linux (including WSL2).
export const COMPANION_DOWNLOAD_URLS = {
  windows: "https://github.com/OneBadUnit/NEXIS/releases/download/companion-v0.1.0/NEXIS.Companion.exe",
  linux:   "https://github.com/OneBadUnit/NEXIS/releases/download/companion-v0.1.0/nexis-bridge-linux",
};

// Returns { url, label, platform, supported } for the current user's OS.
// Windows  ? NEXIS Companion.exe
// Linux    ? nexis-bridge-linux
// Other    ? unsupported (no download URL)
export function getCompanionDownload() {
  const ua = (navigator.userAgent || "").toLowerCase();
  if (ua.includes("win")) {
    return { url: COMPANION_DOWNLOAD_URLS.windows, label: "Download NEXIS Companion", platform: "Windows", supported: true };
  }
  if (ua.includes("linux")) {
    return { url: COMPANION_DOWNLOAD_URLS.linux, label: "Download NEXIS Bridge", platform: "Linux / WSL2", supported: true };
  }
  return { url: null, label: null, platform: null, supported: false };
}

const DETECT_TIMEOUT_MS  = 6000;
const GENERATE_TIMEOUT_MS = 180_000;
const START_TIMEOUT_MS   = 25_000; // ollama start can take ~20s

// ?? Legacy endpoint migration ???????????????????????????????????????????????

const RAW_OLLAMA_PATTERNS = [
  "http://localhost:11434",
  "http://127.0.0.1:11434",
  "https://localhost:11434",
  "https://127.0.0.1:11434",
];

export function isLegacyOllamaEndpoint(endpoint) {
  if (!endpoint) return false;
  const norm = endpoint.replace(/\/$/, "").toLowerCase();
  return RAW_OLLAMA_PATTERNS.some((p) => norm === p.toLowerCase());
}

export function getModelConfigWithMigration() {
  try {
    const raw = localStorage.getItem("nexis_model_config");
    if (!raw) return null;
    const config = JSON.parse(raw);
    if (config?.type === "local" && isLegacyOllamaEndpoint(config?.endpoint)) {
      config.endpoint = BRIDGE_DEFAULT_URL;
      localStorage.setItem("nexis_model_config", JSON.stringify(config));
    }
    return config;
  } catch {
    return null;
  }
}

// ?? Low-level fetch helpers ?????????????????????????????????????????????????

async function fetchWithTimeout(url, options = {}, timeoutMs = DETECT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Safe JSON POST  never throws. Returns { data } or { error, code }.
async function postJSON(url, body, timeoutMs = DETECT_TIMEOUT_MS) {
  try {
    const res = await fetchWithTimeout(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      timeoutMs
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: data.error || "Request failed", code: data.code || "UNKNOWN" };
    }
    return { data };
  } catch (err) {
    return { error: err.message, code: _networkErrorCode(err) };
  }
}

function _networkErrorCode(err) {
  if (err?.name === "AbortError") return "COMPANION_NOT_RUNNING";
  if (err instanceof TypeError) return "COMPANION_NOT_RUNNING";
  return "UNKNOWN";
}

// ?? Core health / diagnostics ???????????????????????????????????????????????

/**
 * Full system state snapshot from the companion.
 * Returns the diagnostics object, or null if the companion is not running.
 * Never throws.
 */
export async function getDiagnostics(bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  try {
    const res = await fetchWithTimeout(`${base}/diagnostics`, {}, DETECT_TIMEOUT_MS);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Lightweight health check  returns { reachable, ollamaReachable, version }.
 * Never throws.
 */
export async function checkBridge(bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  try {
    const res = await fetchWithTimeout(`${base}/health`, {}, DETECT_TIMEOUT_MS);
    if (!res.ok) return { reachable: false, ollamaReachable: false, version: null };
    const data = await res.json();
    return {
      reachable: true,
      ollamaReachable: !!data.ollama_reachable,
      ollamaInstalled: !!data.ollama_installed,
      version: data.bridge_version || null,
      recommendedModel: data.recommended_model || RECOMMENDED_MODEL,
    };
  } catch {
    return { reachable: false, ollamaReachable: false, version: null };
  }
}

// ?? Ollama management ???????????????????????????????????????????????????????

/**
 * Ask the companion to find the Ollama installation path.
 * Returns { found, path, searchedPaths } or null on failure.
 */
export async function findOllama(bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  try {
    const res = await fetchWithTimeout(`${base}/ollama/find`, {}, DETECT_TIMEOUT_MS);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Ask the companion to start Ollama.
 * Returns { started, alreadyRunning, ollamaNowRunning, waitedMs }
 * or { error, code } on failure. Never throws.
 */
export async function startOllama(bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  const { data, error, code } = await postJSON(`${base}/ollama/start`, {}, START_TIMEOUT_MS);
  if (error) return { error, code };
  return {
    started: !!data.started,
    alreadyRunning: !!data.already_running,
    ollamaNowRunning: !!data.ollama_now_running,
    waitedMs: data.waited_ms || 0,
  };
}

/**
 * Ask the companion to kill and restart Ollama.
 * Returns { restarted, ollamaNowRunning, waitedMs }
 * or { error, code } on failure. Never throws.
 */
export async function restartOllama(bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  const { data, error, code } = await postJSON(`${base}/ollama/restart`, {}, START_TIMEOUT_MS);
  if (error) return { error, code };
  return {
    restarted: !!data.restarted,
    ollamaNowRunning: !!data.ollama_now_running,
    waitedMs: data.waited_ms || 0,
  };
}

// ?? Model management ????????????????????????????????????????????????????????

/**
 * Fetch the list of available models.
 * Returns { models, recommendedModel } on success.
 * Returns { error, code } on failure. Never throws.
 */
export async function fetchBridgeModels(bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  try {
    const res = await fetchWithTimeout(`${base}/models`, {}, DETECT_TIMEOUT_MS);
    if (res.ok) {
      const data = await res.json();
      return {
        models: Array.isArray(data.models) ? data.models : [],
        recommendedModel: data.recommended_model || RECOMMENDED_MODEL,
      };
    }
    let errData = {};
    try { errData = await res.json(); } catch { /* ignore */ }
    return { error: errData.error || "Could not fetch models", code: errData.code || "UNKNOWN" };
  } catch (err) {
    return { error: err.message, code: _networkErrorCode(err) };
  }
}

/**
 * Start an async model pull job on the companion.
 * Returns { jobId, model, started } or { error, code }. Never throws.
 */
export async function pullModel(model = RECOMMENDED_MODEL, bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  const { data, error, code } = await postJSON(
    `${base}/models/pull`,
    { model },
    60_000 // just for starting the job
  );
  if (error) return { error, code };
  return { jobId: data.job_id, model: data.model, started: !!data.started };
}

/**
 * Subscribe to pull progress events via SSE.
 * Calls onProgress({ status, completed, total, percent }) for each event.
 * Calls onDone({ success, error }) when the pull finishes.
 *
 * Returns a cancel function.
 */
export function subscribePullProgress(jobId, bridgeUrl = BRIDGE_DEFAULT_URL, onProgress, onDone) {
  const base = bridgeUrl.replace(/\/$/, "");
  const url = `${base}/models/pull/progress?job=${encodeURIComponent(jobId)}`;

  // Use a fetch-based reader so we can cancel cleanly
  const controller = new AbortController();

  (async () => {
    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        onDone({ success: false, error: "Could not connect to pull progress stream." });
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete line
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr) continue;
          try {
            const ev = JSON.parse(jsonStr);
            if (ev.error) {
              onDone({ success: false, error: ev.error });
              return;
            }
            if (ev.done || ev.status === "success") {
              onDone({ success: true });
              return;
            }
            const percent =
              ev.total > 0 ? Math.round((ev.completed / ev.total) * 100) : null;
            onProgress({ status: ev.status, completed: ev.completed, total: ev.total, percent });
          } catch {
            /* malformed line  skip */
          }
        }
      }
      onDone({ success: true });
    } catch (err) {
      if (err?.name !== "AbortError") {
        onDone({ success: false, error: err.message });
      }
    }
  })();

  return () => controller.abort();
}

// ?? Generation ??????????????????????????????????????????????????????????????

/**
 * Send a generation request through the companion to Ollama.
 * Returns { output } on success.
 * Returns { error, code } on failure. Never throws.
 */
export async function generateViaBridge(prompt, model, bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  try {
    const res = await fetchWithTimeout(
      `${base}/generate`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, prompt }),
      },
      GENERATE_TIMEOUT_MS
    );
    if (res.ok) {
      const data = await res.json();
      const output = (data.output || "").trim();
      if (!output) return { error: "Generation returned an empty response.", code: "GENERATION_FAILED" };
      return { output };
    }
    let errData = {};
    try { errData = await res.json(); } catch { /* ignore */ }
    return { error: errData.error || "Generation failed", code: errData.code || "GENERATION_FAILED" };
  } catch (err) {
    return { error: err.message, code: _networkErrorCode(err) };
  }
}

// ?? System info ?????????????????????????????????????????????????????????????

/**
 * Fetch basic system info (CPU, GPU, platform) from the companion.
 * Returns the parsed JSON or null. Never throws.
 */
export async function getBridgeSystem(bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  try {
    const res = await fetchWithTimeout(`${base}/system`, {}, DETECT_TIMEOUT_MS);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ?? Last-resort terminal ????????????????????????????????????????????????????

/**
 * Ask the companion to open the OS default terminal window.
 * LAST RESORT  only call from the Advanced > Troubleshooting section.
 * Returns { opened, shell } or { error, code }. Never throws.
 */
export async function openTerminal(bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  const { data, error, code } = await postJSON(`${base}/diagnostics/open-terminal`, {});
  if (error) return { error, code };
  return { opened: !!data.opened, shell: data.shell || "" };
}

// ?? Error classification ????????????????????????????????????????????????????

/**
 * Map a raw Error or bridge error-code into a user-facing plain-English message.
 * All messages avoid terminal jargon in primary text.
 */
export function classifyBridgeError(errOrCode, model = "") {
  if (
    errOrCode instanceof TypeError ||
    (errOrCode instanceof Error &&
      (errOrCode.message.includes("Failed to fetch") ||
        errOrCode.message.includes("NetworkError") ||
        errOrCode.message.includes("ECONNREFUSED")))
  ) {
    return { code: "COMPANION_NOT_RUNNING", message: "NEXIS Companion is not running." };
  }
  if (errOrCode instanceof Error && errOrCode.name === "AbortError") {
    return { code: "COMPANION_NOT_RUNNING", message: "NEXIS Companion did not respond." };
  }

  const code = typeof errOrCode === "string" ? errOrCode : (errOrCode?.code || "");
  switch (code) {
    case "COMPANION_NOT_RUNNING":
      return { code, message: "NEXIS Companion is not running." };
    case "OLLAMA_NOT_INSTALLED":
      return { code, message: "Ollama is not installed on this computer." };
    case "OLLAMA_NOT_RUNNING":
      return { code, message: "Ollama is installed but not open." };
    case "NO_MODELS":
      return { code, message: "No AI model found." };
    case "MODEL_NOT_AVAILABLE":
      return {
        code,
        message: model
          ? `The model "${model}" is not downloaded in Ollama.`
          : "The selected model is not downloaded in Ollama.",
      };
    case "GENERATION_FAILED":
      return { code, message: "Generation failed. Make sure Ollama is open and the model is downloaded." };
    default:
      return {
        code: code || "UNKNOWN",
        message: errOrCode?.message || "An unexpected error occurred.",
      };
  }
}
