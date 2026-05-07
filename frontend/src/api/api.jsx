// ============================================================
// ARC-NEXUS - API CLIENT
// File: src/api/api.jsx
// Version: 004 (local-first via NEXIS Local Companion bridge)
// ============================================================
//
// LOCAL MODE: generation goes browser → nexis-bridge (port 8765)
//             → Ollama (port 11434). The browser NEVER calls
//             localhost:11434 directly — CORS blocks it.
// PROVIDER/HOSTED MODE: uses the Render backend (API_BASE).
//
// NOTE: This is a Create React App (CRA) project.
// Environment variables must be prefixed REACT_APP_ and are
// accessed via process.env.REACT_APP_* at build time.
// Vite-style import.meta.env is NOT available here.
//
// Required env var:
//   REACT_APP_API_BASE_URL=https://nexis-l8oc.onrender.com
//
// Set this in:
//   - Vercel project settings → Environment Variables (production)
//   - .env.local for local development (git-ignored)
// ------------------------------------------------------------

import {
  getModelConfigWithMigration,
  generateViaBridge,
  BRIDGE_DEFAULT_URL,
} from "../lib/bridge.js";

// Local dev detection — compares hostname only (not full URL).
// "https://nexis-l8oc.onrender.com" is a full URL string, not a hostname,
// so it was previously always false and never matched in a browser.
// Fixed: compare against the bare hostname "nexis-l8oc.onrender.com".
const _isLocalDev =
  window.location.hostname === "localhost" ||
  window.location.hostname === "nexis-l8oc.onrender.com";

// Local dev fallback — only applies when running on localhost.
// In production (Vercel) REACT_APP_API_BASE_URL must be set explicitly.
const _localDevFallback = _isLocalDev ? "https://nexis-l8oc.onrender.com" : null;

export const API_BASE = process.env.REACT_APP_API_BASE_URL || _localDevFallback;

if (!API_BASE) {
  console.error(
    "[NEXIS API] REACT_APP_API_BASE_URL is not set and this is not a local dev " +
    "environment. API calls will fail. " +
    "Set REACT_APP_API_BASE_URL in your Vercel environment variables."
  );
}

console.log("[NEXIS API] API_BASE =", API_BASE);

// Keep BASE_URL as an internal alias so existing call sites don't change.
const BASE_URL = API_BASE;

// ------------------------------------------------------------
// Helper
// ------------------------------------------------------------
async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  console.log("[NEXIS API] request URL =", url);
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    let message;
    try {
      const json = await res.json();
      // FastAPI wraps errors in { detail: "..." }
      message = json.detail || JSON.stringify(json);
    } catch {
      message = await res.text();
    }
    throw new Error(message || "API request failed");
  }

  return res.json();
}


// ------------------------------------------------------------
// SYSTEM
// ------------------------------------------------------------
export async function systemCheck() {
  return request("/api/system/check");
}


// ------------------------------------------------------------
// LOCAL MODEL HELPERS
// Read saved model config from localStorage, migrating any
// legacy localhost:11434 endpoints to the bridge URL.
// When type === "local", generation goes:
//   browser → NEXIS Local Companion (port 8765) → Ollama
// The browser NEVER calls localhost:11434 directly.
// ------------------------------------------------------------

// Re-export so ModelConfig can import from one place if needed.
export { BRIDGE_DEFAULT_URL };

// Internal alias used by nexisConvert / nexisCreate.
function getModelConfig() {
  return getModelConfigWithMigration();
}

// runViaBridge — replaces the old runLocalOllama direct-Ollama call.
// Sends a prompt through the local companion bridge to Ollama.
// Throws a user-facing Error on any failure.
async function runViaBridge(prompt, modelConfig) {
  const bridgeUrl = (modelConfig.endpoint || BRIDGE_DEFAULT_URL).replace(/\/$/, "");
  const model = modelConfig.model;
  console.log("[LOCAL MODE] → NEXIS Local Companion:", bridgeUrl, "| model:", model);

  const result = await generateViaBridge(prompt, model, bridgeUrl);

  if (result.error) {
    // result.code is a structured bridge error code
    console.error("[LOCAL MODE] bridge error:", result.code, result.error);
    throw new Error(result.error);
  }

  return result.output;
}


// ------------------------------------------------------------
// NEXIS - CONVERT
// LOCAL:  browser → NEXIS Local Companion (bridge) → Ollama
// HOSTED: browser → Render backend (provider/API-key mode)
// ------------------------------------------------------------
export async function nexisConvert(payload) {
  const modelConfig = getModelConfig();

  // Local path: requires bridge + Ollama on user's machine.
  // endpoint defaults to bridge URL if not set.
  if (modelConfig?.type === "local" && modelConfig?.model) {
    console.log("[LOCAL MODE] routing through NEXIS Local Companion");
    const { buildReconstructionPrompt } = await import("../lib/prompts.js");
    const prompt = buildReconstructionPrompt(
      payload.text,
      payload.preset,
      payload.action,
      payload.option
    );
    const output = await runViaBridge(prompt, modelConfig);
    return { output };
  }

  // Hosted/provider path: goes through Render backend.
  console.log("[HOSTED MODE] using backend inference endpoint");
  return request("/nexis/convert", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}


// ------------------------------------------------------------
// 🔄 LEGACY SUPPORT (so nothing breaks)
// ------------------------------------------------------------
export async function nexisUnderstand(payload) {
  return nexisConvert(payload);
}


// ------------------------------------------------------------
// NEXIS - CREATE
// LOCAL:  browser → NEXIS Local Companion (bridge) → Ollama
// HOSTED: browser → Render backend (provider/API-key mode)
// ------------------------------------------------------------
export async function nexisCreate(payload) {
  const modelConfig = getModelConfig();

  if (modelConfig?.type === "local" && modelConfig?.model) {
    console.log("[LOCAL MODE] routing through NEXIS Local Companion");
    const { buildCreationPrompt } = await import("../lib/prompts.js");
    const prompt = buildCreationPrompt(payload.text, payload.mode, payload.option);
    const output = await runViaBridge(prompt, modelConfig);
    return { output };
  }

  console.log("[HOSTED MODE] using backend inference endpoint");
  return request("/nexis/create", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}


// ------------------------------------------------------------
// INGESTION - COLLECT
// (multipart, no JSON header override)
// ------------------------------------------------------------
async function parseErrorFromResponse(res) {
  try {
    const json = await res.json();
    return json.detail || JSON.stringify(json);
  } catch {
    return await res.text();
  }
}

export async function collectSource(formData) {
  const res = await fetch(`${BASE_URL}/collect/process`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const msg = await parseErrorFromResponse(res);
    throw new Error(msg || "Collect failed");
  }

  return res.json();
}


// ------------------------------------------------------------
// VISION
// ------------------------------------------------------------
export async function analyzeImage(formData) {
  const res = await fetch(`${BASE_URL}/vision/analyze`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const msg = await parseErrorFromResponse(res);
    throw new Error(msg || "Vision failed");
  }

  return res.json();
}


// ------------------------------------------------------------
// USAGE / LIMITS
// ------------------------------------------------------------
export async function getUsage() {
  return request("/api/usage");
}

export async function syncUsage(counts) {
  // counts: { projects?, raw_inputs?, outputs? }
  // Syncs localStorage storage counts to the backend so enforcement
  // is always based on the real number of saved items.
  console.log("[NEXIS USAGE DEBUG] syncUsage using BASE:", BASE_URL);
  return request("/api/usage/sync", {
    method: "POST",
    body: JSON.stringify(counts),
  });
}

export async function removeOutputUsage() {
  return request("/api/usage/output/remove", { method: "POST" });
}

export async function removeRawInputUsage() {
  return request("/api/usage/raw-input/remove", { method: "POST" });
}

export async function addProjectUsage() {
  console.log("[NEXIS USAGE DEBUG] addProjectUsage using BASE:", BASE_URL);
  return request("/api/usage/project/add", { method: "POST" });
}

export async function removeProjectUsage() {
  return request("/api/usage/project/remove", { method: "POST" });
}

// ------------------------------------------------------------
// Package-level convert gate + completion
// checkConvertLimits — call once before running a package
// completeConvertPackage — call once after all sections succeed
// ------------------------------------------------------------
export async function checkConvertLimits() {
  return request("/api/usage/convert/check");
}

export async function completeConvertPackage() {
  return request("/api/usage/convert/complete", { method: "POST" });
}
