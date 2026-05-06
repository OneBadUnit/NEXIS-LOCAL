// ============================================================
// ARC-NEXUS - API CLIENT
// File: src/api/api.js
// Version: 002 (Centralized + Expandable)
// ============================================================


// ------------------------------------------------------------
// Base URL
// Resolution order:
//   1. REACT_APP_API_BASE_URL env var (explicit override)
//   2. localhost fallback when running on localhost/127.0.0.1
//   3. Hosted Render backend for all other origins (Vercel etc.)
// ------------------------------------------------------------
const LOCAL_API_BASE = "http://127.0.0.1:8000";
const HOSTED_API_BASE = "https://nexis-l8oc.onrender.com";

const isLocalHost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

export const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  (isLocalHost ? LOCAL_API_BASE : HOSTED_API_BASE);

// Keep BASE_URL as an internal alias so existing call sites don't change.
const BASE_URL = API_BASE;

// TEMPORARY DEBUG — remove after confirming hosted env var
console.log("[NEXIS API] hostname =", window.location.hostname);
console.log("[NEXIS API] process.env.REACT_APP_API_BASE_URL =", process.env.REACT_APP_API_BASE_URL);
console.log("[NEXIS API] API_BASE =", API_BASE);

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
// Read saved model config from localStorage.
// When type === "local", generation goes directly to the
// user's Ollama instance in the browser — never to Render.
// ------------------------------------------------------------
function getModelConfig() {
  try {
    const raw = localStorage.getItem("nexis_model_config");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function runLocalOllama(prompt, modelConfig) {
  const base = (modelConfig.endpoint || "http://localhost:11434").replace(/\/$/, "");
  const model = modelConfig.model;
  console.log("[LOCAL MODE] using browser Ollama endpoint:", base, "| model:", model);

  const res = await fetch(`${base}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt, stream: false }),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => res.status);
    throw new Error(`Ollama request failed (${res.status}): ${msg}`);
  }

  const data = await res.json();
  return (data.response || "").trim();
}


// ------------------------------------------------------------
// NEXIS - CONVERT
// Routes to local Ollama when a local model is configured,
// otherwise calls the hosted backend.
// ------------------------------------------------------------
export async function nexisConvert(payload) {
  const modelConfig = getModelConfig();

  if (modelConfig?.type === "local" && modelConfig?.model && modelConfig?.endpoint) {
    console.log("[LOCAL MODE] using browser Ollama endpoint");
    const { buildReconstructionPrompt } = await import("../lib/prompts.js");
    const prompt = buildReconstructionPrompt(
      payload.text,
      payload.preset,
      payload.action,
      payload.option
    );
    const output = await runLocalOllama(prompt, modelConfig);
    return { output };
  }

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
// Routes to local Ollama for "refine" when a local model is
// configured, otherwise calls the hosted backend.
// ------------------------------------------------------------
export async function nexisCreate(payload) {
  const modelConfig = getModelConfig();

  if (modelConfig?.type === "local" && modelConfig?.model && modelConfig?.endpoint) {
    console.log("[LOCAL MODE] using browser Ollama endpoint");
    const { buildCreationPrompt } = await import("../lib/prompts.js");
    const prompt = buildCreationPrompt(payload.text, payload.mode, payload.option);
    const output = await runLocalOllama(prompt, modelConfig);
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
