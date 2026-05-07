// ============================================================
// NEXIS - LOCAL COMPANION BRIDGE CLIENT
// File: src/lib/bridge.js
// Version: 001
//
// All communication with the NEXIS Local Companion goes
// through this module. Nothing else in the frontend talks
// to Ollama or localhost:11434 directly.
//
// The bridge runs on http://localhost:8765 on the user's
// machine and proxies to Ollama at localhost:11434.
//
// Error codes returned by the bridge:
//   BRIDGE_NOT_RUNNING    — bridge process is not running
//   OLLAMA_NOT_INSTALLED  — ollama binary not found
//   OLLAMA_NOT_RUNNING    — ollama installed but not started
//   NO_MODELS             — ollama running but no models
//   MODEL_NOT_AVAILABLE   — requested model not in Ollama
//   GENERATION_FAILED     — LLM call errored or returned empty
// ============================================================

// ── Constants ─────────────────────────────────────────────────────────────

// Default bridge URL. Hidden from users; configurable via ModelConfig Advanced.
export const BRIDGE_DEFAULT_URL = "http://localhost:8765";

// Timeout for health / model-list calls (ms).
const DETECT_TIMEOUT_MS = 5000;

// Timeout for generation calls (ms) — generous for large models.
const GENERATE_TIMEOUT_MS = 180_000;

// ── Old endpoint migration ─────────────────────────────────────────────────
// If a user has an old localStorage config pointing directly at raw Ollama
// (localhost:11434 or 127.0.0.1:11434) we silently migrate it to the bridge.

const RAW_OLLAMA_PATTERNS = [
  "http://localhost:11434",
  "http://127.0.0.1:11434",
  "https://localhost:11434",
  "https://127.0.0.1:11434",
];

/**
 * Returns true when the given endpoint string is a raw Ollama URL
 * that should be migrated to the bridge.
 */
export function isLegacyOllamaEndpoint(endpoint) {
  if (!endpoint) return false;
  const norm = endpoint.replace(/\/$/, "").toLowerCase();
  return RAW_OLLAMA_PATTERNS.some((p) => norm === p.toLowerCase());
}

/**
 * Read the saved model config from localStorage and transparently
 * migrate legacy localhost:11434 endpoints to the bridge URL.
 * Writes the migrated config back if a migration was needed.
 * Returns the (possibly migrated) config or null.
 */
export function getModelConfigWithMigration() {
  try {
    const raw = localStorage.getItem("nexis_model_config");
    if (!raw) return null;
    const config = JSON.parse(raw);

    // Migrate old direct-Ollama endpoints to the bridge URL
    if (config?.type === "local" && isLegacyOllamaEndpoint(config?.endpoint)) {
      console.log(
        "[Bridge] Migrating legacy Ollama endpoint",
        config.endpoint,
        "→",
        BRIDGE_DEFAULT_URL
      );
      config.endpoint = BRIDGE_DEFAULT_URL;
      localStorage.setItem("nexis_model_config", JSON.stringify(config));
    }

    return config;
  } catch {
    return null;
  }
}

// ── Low-level fetch helper ─────────────────────────────────────────────────

/**
 * Fetch with an AbortController timeout.
 * Throws a DOMException (name === "AbortError") on timeout,
 * or a TypeError on network failure (connection refused).
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = DETECT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ── Error classification ───────────────────────────────────────────────────

/**
 * classifyBridgeError maps a raw Error or a bridge error-code string into
 * a user-facing message. All messages avoid terminal commands in the main
 * text; troubleshooting details are placed at the end.
 *
 * @param {Error|string|null} errOrCode  — Error object or bridge code string
 * @param {string} [model]               — model name, for MODEL_NOT_AVAILABLE
 * @returns {{ message: string, code: string }}
 */
export function classifyBridgeError(errOrCode, model = "") {
  // Connection refused or fetch failed → bridge not running
  if (
    errOrCode instanceof TypeError ||
    (errOrCode instanceof Error &&
      (errOrCode.message.includes("Failed to fetch") ||
        errOrCode.message.includes("NetworkError") ||
        errOrCode.message.includes("ECONNREFUSED")))
  ) {
    return {
      code: "BRIDGE_NOT_RUNNING",
      message:
        "The NEXIS Local Companion is not running. Start it to use local AI.",
    };
  }

  // AbortError → timeout (treat as bridge not running)
  if (errOrCode instanceof Error && errOrCode.name === "AbortError") {
    return {
      code: "BRIDGE_NOT_RUNNING",
      message:
        "The NEXIS Local Companion did not respond. Make sure it is running.",
    };
  }

  // Bridge returned a structured error code
  const code =
    typeof errOrCode === "string"
      ? errOrCode
      : errOrCode?.code || "";

  switch (code) {
    case "OLLAMA_NOT_INSTALLED":
      return {
        code,
        message:
          "Ollama is not installed on this computer. Download and install Ollama, then click Reconnect.",
      };
    case "OLLAMA_NOT_RUNNING":
      return {
        code,
        message:
          "Ollama is installed but not running. Open Ollama, then click Reconnect.",
      };
    case "NO_MODELS":
      return {
        code,
        message:
          "Ollama is running but no models are installed. Open Ollama and download a model, then click Reconnect.",
      };
    case "MODEL_NOT_AVAILABLE":
      return {
        code,
        message: model
          ? `The model "${model}" is not available in Ollama. Open Ollama and download it, then click Reconnect.`
          : "The selected model is not available in Ollama. Open Ollama and download it, then click Reconnect.",
      };
    case "GENERATION_FAILED":
      return {
        code,
        message:
          "Generation failed. Make sure Ollama is open and the selected model is downloaded.",
      };
    default:
      return {
        code: code || "UNKNOWN",
        message:
          errOrCode?.message ||
          "An unexpected error occurred. Check that the NEXIS Local Companion and Ollama are both running.",
      };
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Check whether the bridge is reachable and whether Ollama is running.
 * Returns { reachable: bool, ollamaReachable: bool, version: string }
 * Never throws — all errors are caught and returned as reachable:false.
 */
export async function checkBridge(bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  try {
    const res = await fetchWithTimeout(`${base}/health`, {}, DETECT_TIMEOUT_MS);
    if (!res.ok) {
      return { reachable: false, ollamaReachable: false, version: null };
    }
    const data = await res.json();
    return {
      reachable: true,
      ollamaReachable: !!data.ollama_reachable,
      version: data.bridge_version || null,
    };
  } catch {
    return { reachable: false, ollamaReachable: false, version: null };
  }
}

/**
 * Fetch the list of available models from the bridge.
 * Returns { models: string[] } on success.
 * Returns { error: string, code: string } on failure — never throws.
 */
export async function fetchBridgeModels(bridgeUrl = BRIDGE_DEFAULT_URL) {
  const base = bridgeUrl.replace(/\/$/, "");
  try {
    const res = await fetchWithTimeout(`${base}/models`, {}, DETECT_TIMEOUT_MS);
    if (res.ok) {
      const data = await res.json();
      return { models: Array.isArray(data.models) ? data.models : [] };
    }
    // Parse bridge error JSON
    let errData = {};
    try { errData = await res.json(); } catch { /* ignore */ }
    const classified = classifyBridgeError(errData.code || "UNKNOWN");
    return { error: classified.message, code: classified.code };
  } catch (err) {
    const classified = classifyBridgeError(err);
    return { error: classified.message, code: classified.code };
  }
}

/**
 * Send a generation request through the bridge to Ollama.
 * Returns { output: string } on success.
 * Returns { error: string, code: string } on failure — never throws.
 *
 * @param {string} prompt
 * @param {string} model
 * @param {string} [bridgeUrl]
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
      if (!output) {
        return { error: "Generation returned an empty response.", code: "GENERATION_FAILED" };
      }
      return { output };
    }

    let errData = {};
    try { errData = await res.json(); } catch { /* ignore */ }
    const classified = classifyBridgeError(errData.code || "GENERATION_FAILED", model);
    return { error: classified.message, code: classified.code };
  } catch (err) {
    const classified = classifyBridgeError(err, model);
    return { error: classified.message, code: classified.code };
  }
}

/**
 * Fetch full system + Ollama diagnostic info from the bridge.
 * Returns the parsed JSON on success, or null on failure.
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
