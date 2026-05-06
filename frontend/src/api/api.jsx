// ============================================================
// ARC-NEXUS - API CLIENT
// File: src/api/api.js
// Version: 002 (Centralized + Expandable)
// ============================================================


// ------------------------------------------------------------
// Base URL
// Falls back to localhost for local development.
// Set REACT_APP_API_BASE_URL in .env for hosted deployments.
// ------------------------------------------------------------
const BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";

// TEMPORARY DEBUG — remove after confirming hosted env var
console.log("[NEXIS API] process.env.REACT_APP_API_BASE_URL =", process.env.REACT_APP_API_BASE_URL);
console.log("[NEXIS API] BASE_URL =", BASE_URL);

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
// NEXIS - CONVERT
// ------------------------------------------------------------
export async function nexisConvert(payload) {
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
// ------------------------------------------------------------
export async function nexisCreate(payload) {
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
