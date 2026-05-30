// ============================================================
// ARC-NEXUS — AEGIS API CLIENT
// File: src/api/aegis.js
// ============================================================
//
// All communication with the local AEGIS backend goes through
// this module. AEGIS runs at http://127.0.0.1:8002 by default.
//
// Config is stored in localStorage under "aegis_config":
//   { "url": "http://127.0.0.1:8002" }
//
// All functions catch errors internally and return null on
// failure so callers never need to wrap in try/catch.
// ============================================================

const AEGIS_DEFAULT_URL = "http://127.0.0.1:8002";
const CONFIG_KEY = "aegis_config";
const TIMEOUT_MS = 7000;

// ── Config helpers ────────────────────────────────────────────

export function getAegisConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { url: AEGIS_DEFAULT_URL };
    const parsed = JSON.parse(raw);
    return { url: AEGIS_DEFAULT_URL, ...parsed };
  } catch {
    return { url: AEGIS_DEFAULT_URL };
  }
}

export function setAegisConfig(config) {
  try {
    const current = getAegisConfig();
    localStorage.setItem(CONFIG_KEY, JSON.stringify({ ...current, ...config }));
  } catch {
    // localStorage unavailable — silently ignore
  }
}

function getBaseUrl() {
  return (getAegisConfig().url || AEGIS_DEFAULT_URL).replace(/\/$/, "");
}

// ── Fetch helper ──────────────────────────────────────────────

async function fetchJson(path, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Endpoints ─────────────────────────────────────────────────

/**
 * GET /health
 * Returns { status: "ok" } when AEGIS is running, or null if unreachable.
 */
export async function aegisHealth() {
  return fetchJson("/health");
}

/**
 * GET /api/radar/consensus
 * Latest front page consensus scan.
 * Returns { status, scan_id, scanned_at, clusters } or null.
 */
export async function fetchConsensus() {
  return fetchJson("/api/radar/consensus");
}

/**
 * GET /api/radar/consensus/archive
 * All historical scans, newest first.
 * Returns { status, snapshots: [ { scan_id, created_at, cluster_count } ] } or null.
 */
export async function fetchConsensusArchive() {
  return fetchJson("/api/radar/consensus/archive");
}

/**
 * GET /api/radar/consensus/snapshot/:scanId
 * Full cluster list for a specific historical scan.
 * Returns same shape as fetchConsensus, or null.
 */
export async function fetchConsensusSnapshot(scanId) {
  if (!scanId) return null;
  return fetchJson(`/api/radar/consensus/snapshot/${encodeURIComponent(scanId)}`);
}

/**
 * GET /api/radar/consensus-status
 * Current or last scan run state.
 * Returns { status, scan: { running, started_at, finished_at, summary, error } } or null.
 */
export async function fetchConsensusScanStatus() {
  return fetchJson("/api/radar/consensus-status");
}

/**
 * POST /api/radar/consensus-scan
 * Trigger a new front page scan.
 * Returns { status: "started" | "already_running", message } or null.
 */
export async function triggerConsensusScan() {
  return fetchJson("/api/radar/consensus-scan", { method: "POST" });
}
