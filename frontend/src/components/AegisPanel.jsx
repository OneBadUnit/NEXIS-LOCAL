// ============================================================
// ARC-NEXUS — AEGIS PANEL
// File: src/components/AegisPanel.jsx
// ============================================================
//
// Self-contained AEGIS status + Front Page scan display panel.
// Probes AEGIS health on mount. Shows latest consensus clusters.
// Archive selector allows viewing any previous scan.
// Never throws — all fetch errors are caught internally.
//
// States:
//   loading     — initial health probe in progress
//   unavailable — AEGIS not running / unreachable
//   no-scan     — AEGIS running but no scan data exists yet
//   ready       — clusters available; renders AegisConsensusCluster cards
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from "react";
import AegisConsensusCluster from "./AegisConsensusCluster";
import {
  aegisHealth,
  fetchConsensus,
  fetchConsensusArchive,
  fetchConsensusSnapshot,
  fetchConsensusScanStatus,
  triggerConsensusScan,
} from "../api/aegis";

const POLL_INTERVAL_MS = 5000;

export default function AegisPanel() {
  // "loading" | "unavailable" | "no-scan" | "ready"
  const [status, setStatus]             = useState("loading");

  // Latest scan data (always kept up-to-date after loadConsensus)
  const [latestClusters, setLatestClusters]   = useState([]);
  const [latestScannedAt, setLatestScannedAt] = useState(null);

  // Archive list: [{ scan_id, created_at, cluster_count }]
  const [archive, setArchive]           = useState([]);

  // Currently selected scan: null = show latest
  const [selectedScanId, setSelectedScanId] = useState(null);

  // Snapshot state when an archived scan is selected
  const [snapshotClusters, setSnapshotClusters]   = useState([]);
  const [snapshotScannedAt, setSnapshotScannedAt] = useState(null);
  const [snapshotLoading, setSnapshotLoading]     = useState(false);

  const [scanRunning, setScanRunning] = useState(false);
  const [scanError, setScanError]     = useState(null);
  const pollRef = useRef(null);

  // ── Derived display values ─────────────────────────────────
  // When an archived scan is selected, display snapshot data;
  // otherwise display the latest scan data.
  const displayClusters  = selectedScanId ? snapshotClusters  : latestClusters;
  const displayScannedAt = selectedScanId ? snapshotScannedAt : latestScannedAt;

  // ── Load archive list ──────────────────────────────────────

  const loadArchive = useCallback(async () => {
    const data = await fetchConsensusArchive();
    if (data && Array.isArray(data.snapshots)) {
      setArchive(data.snapshots);
    }
  }, []);

  // ── Load latest consensus ──────────────────────────────────

  const loadConsensus = useCallback(async () => {
    const health = await aegisHealth();
    if (!health || health.status !== "ok") {
      setStatus("unavailable");
      return;
    }

    const data = await fetchConsensus();
    if (!data || !Array.isArray(data.clusters)) {
      setStatus("unavailable");
      return;
    }

    if (data.clusters.length === 0) {
      setStatus("no-scan");
      setLatestClusters([]);
      setLatestScannedAt(null);
    } else {
      setStatus("ready");
      setLatestClusters(data.clusters);
      setLatestScannedAt(data.scanned_at || null);
    }

    // Always refresh archive alongside latest
    await loadArchive();
  }, [loadArchive]);

  useEffect(() => {
    loadConsensus();
  }, [loadConsensus]);

  // ── Load snapshot when archive selection changes ───────────

  useEffect(() => {
    if (!selectedScanId) return; // null = show latest, no fetch needed
    let cancelled = false;
    async function load() {
      setSnapshotLoading(true);
      setSnapshotClusters([]);
      setSnapshotScannedAt(null);
      const data = await fetchConsensusSnapshot(selectedScanId);
      if (cancelled) return;
      if (data && Array.isArray(data.clusters)) {
        setSnapshotClusters(data.clusters);
        setSnapshotScannedAt(data.scanned_at || null);
      }
      setSnapshotLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, [selectedScanId]);

  // ── Scan status polling ────────────────────────────────────

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const statusData = await fetchConsensusScanStatus();
      if (!statusData) return;
      const scan = statusData.scan || {};
      if (!scan.running) {
        stopPolling();
        setScanRunning(false);
        if (scan.error) {
          setScanError(scan.error);
        } else {
          setScanError(null);
          setSelectedScanId(null); // jump back to latest after new scan
          await loadConsensus();
        }
      }
    }, POLL_INTERVAL_MS);
  }, [stopPolling, loadConsensus]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Trigger scan ───────────────────────────────────────────

  const handleTriggerScan = async () => {
    setScanError(null);
    setScanRunning(true);
    const result = await triggerConsensusScan();
    if (!result) {
      setScanRunning(false);
      setScanError("Could not reach AEGIS. Is it running?");
      return;
    }
    startPolling();
  };

  // ── Timestamp formatter ────────────────────────────────────

  function formatTs(ts) {
    if (!ts) return null;
    try {
      return new Date(ts).toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return ts;
    }
  }

  // ── Archive selector ───────────────────────────────────────

  const showArchiveSelector = status === "ready" && archive.length > 0;

  // ── Render ─────────────────────────────────────────────────

  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", maxHeight: "480px" }}>

      {/* Panel header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: showArchiveSelector ? 10 : 16,
          paddingBottom: 12,
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h3 style={{ margin: 0, padding: 0, border: "none" }}>AEGIS</h3>
          {/* Status dot */}
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: "50%",
              flexShrink: 0,
              background:
                status === "ready"   ? "#4ade80" :
                status === "loading" ? "#94a3b8" :
                status === "no-scan" ? "#f59e0b" :
                                       "#ef4444",
            }}
            title={
              status === "ready"   ? "AEGIS connected" :
              status === "loading" ? "Connecting…" :
              status === "no-scan" ? "AEGIS running — no scan yet" :
                                     "AEGIS not running"
            }
          />
        </div>

        {/* Run scan button — shown when AEGIS is reachable */}
        {(status === "ready" || status === "no-scan") && (
          <button
            className="btn"
            onClick={handleTriggerScan}
            disabled={scanRunning}
            style={{ fontSize: "0.78rem", padding: "4px 10px" }}
          >
            {scanRunning ? "Scanning…" : "Run Scan"}
          </button>
        )}
      </div>

      {/* Archive selector — fixed, outside scroll */}
      {showArchiveSelector && (
        <div
          style={{
            marginBottom: 12,
            paddingBottom: 10,
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            flexShrink: 0,
          }}
        >
          <select
            value={selectedScanId ?? ""}
            onChange={(e) => setSelectedScanId(e.target.value || null)}
            style={{
              width: "100%",
              background: "#1a1f2e",
              border: "1px solid rgba(255,255,255,0.18)",
              borderRadius: 5,
              color: "rgba(255,255,255,0.88)",
              fontSize: "0.78rem",
              padding: "6px 10px",
              cursor: "pointer",
              outline: "none",
              appearance: "auto",
              fontFamily: "inherit",
              letterSpacing: "0.01em",
              boxShadow: "inset 0 1px 3px rgba(0,0,0,0.35)",
            }}
          >
            <option value="">
              Latest scan
              {latestScannedAt ? ` — ${formatTs(latestScannedAt)}` : ""}
              {latestClusters.length > 0 ? ` (${latestClusters.length} clusters)` : ""}
            </option>
            {archive.map((snap) => (
              <option key={snap.scan_id} value={snap.scan_id}>
                {formatTs(snap.created_at) || snap.scan_id}
                {snap.cluster_count != null ? ` (${snap.cluster_count} clusters)` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scrollable content */}
      <div style={{ overflowY: "auto", flex: 1, minHeight: 0 }}>

        {/* Scan error */}
        {scanError && (
          <p style={{ color: "#ef4444", fontSize: "0.82rem", marginBottom: 10 }}>
            {scanError}
          </p>
        )}

        {/* Scan in progress */}
        {scanRunning && (
          <p className="subtle" style={{ marginBottom: 10 }}>
            Front page scan running…
          </p>
        )}

        {/* loading */}
        {status === "loading" && !scanRunning && (
          <p className="subtle">Connecting to AEGIS…</p>
        )}

        {/* unavailable */}
        {status === "unavailable" && !scanRunning && (
          <div>
            <p className="subtle" style={{ marginBottom: 6 }}>
              AEGIS is not running.
            </p>
            <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", marginBottom: 10 }}>
              Start AEGIS using <strong>Launch AEGIS.vbs</strong>, then click Retry.
            </p>
            <button
              className="btn"
              style={{ fontSize: "0.78rem", padding: "4px 10px" }}
              onClick={loadConsensus}
            >
              Retry
            </button>
          </div>
        )}

        {/* no scan yet */}
        {status === "no-scan" && !scanRunning && (
          <p className="subtle" style={{ fontSize: "0.85rem" }}>
            AEGIS is running but no front page scan exists yet. Click <strong>Run Scan</strong>.
          </p>
        )}

        {/* Snapshot loading */}
        {status === "ready" && selectedScanId && snapshotLoading && (
          <p className="subtle" style={{ fontSize: "0.82rem" }}>Loading archived scan…</p>
        )}

        {/* ready — render clusters */}
        {status === "ready" && !snapshotLoading && displayClusters.length > 0 && (
          <div>
            {displayScannedAt && (
              <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>
                {selectedScanId ? "Archived scan" : "Last scan"}: {formatTs(displayScannedAt)}
              </p>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {displayClusters.map((cluster) => (
                <AegisConsensusCluster
                  key={cluster.id ?? (cluster.scan_id ?? selectedScanId ?? "latest") + cluster.topic}
                  cluster={cluster}
                />
              ))}
            </div>
          </div>
        )}

        {/* archived scan loaded but empty */}
        {status === "ready" && selectedScanId && !snapshotLoading && displayClusters.length === 0 && (
          <p className="subtle" style={{ fontSize: "0.82rem" }}>No cluster data for this scan.</p>
        )}

      </div>{/* end scrollable content */}
    </div>
  );
}
