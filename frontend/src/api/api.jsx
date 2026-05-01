// ============================================================
// ARC-NEXUS - API CLIENT
// File: src/api/api.js
// Version: 002 (Centralized + Expandable)
// ============================================================


// ------------------------------------------------------------
// Base URL
// ------------------------------------------------------------
const BASE_URL = "http://127.0.0.1:8000";


// ------------------------------------------------------------
// Helper
// ------------------------------------------------------------
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
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
export async function collectSource(formData) {
  const res = await fetch(`${BASE_URL}/collect/process`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Collect failed");
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
    const text = await res.text();
    throw new Error(text || "Vision failed");
  }

  return res.json();
}