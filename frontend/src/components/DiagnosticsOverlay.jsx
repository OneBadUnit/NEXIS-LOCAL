// ============================================================
// ARC-NEXUS - DIAGNOSTICS OVERLAY
// File: src/components/DiagnosticsOverlay.jsx
// Version: 001
// ============================================================
// User-controlled diagnostic report for troubleshooting
// NEXIS Companion / Local AI issues.
//
// PRIVACY GUARANTEES (enforced in code):
//   - No prompts, file contents, auth tokens, API keys,
//     cookies, browser history, clipboard contents, or
//     arbitrary filesystem data are ever collected.
//   - Optional advanced fields are only included when the
//     user explicitly checks each one.
//   - The report is displayed for user review before any
//     action. NEXIS does not upload it automatically.
// ============================================================

import React, { useState } from "react";
import PageOverlay from "./PageOverlay";
import {
  getDiagnostics,
  getModelConfigWithMigration,
  BRIDGE_DEFAULT_URL,
} from "../lib/bridge.js";

// Increment when the NEXIS app version changes.
const NEXIS_APP_VERSION = "1.0.0";

// ── Helpers ─────────────────────────────────────────────────

function modeLabel(cfg) {
  if (!cfg?.type) return "Not configured";
  if (cfg.type === "local") return "Local AI (NEXIS Companion + Ollama)";
  if (cfg.type === "provider") {
    return `Provider / API${cfg.provider ? ` (${cfg.provider})` : ""}`;
  }
  return cfg.type;
}

async function buildReport(advanced) {
  // ── 1. Fetch companion diagnostics ──────────────────────
  // getDiagnostics never throws — returns null when companion unreachable.
  const modelConfig = getModelConfigWithMigration();
  const bridgeUrl = (modelConfig?.endpoint || BRIDGE_DEFAULT_URL).replace(/\/$/, "");

  let diag = null;
  let companionReachable = false;
  try {
    diag = await getDiagnostics(bridgeUrl);
    companionReachable = diag !== null;
  } catch {
    // Defensive — getDiagnostics should never throw, but guard anyway.
    companionReachable = false;
    diag = null;
  }

  // ── 2. Browser-sourced system info (no sensitive data) ──
  // navigator.deviceMemory: available in Chrome, not in Firefox/Safari.
  const ramValue =
    typeof navigator.deviceMemory !== "undefined"
      ? `${navigator.deviceMemory} GB (approximate, browser-reported)`
      : "Unknown (not exposed by this browser)";

  const cpuCores =
    diag?.cpu_count
    || (typeof navigator.hardwareConcurrency !== "undefined"
      ? String(navigator.hardwareConcurrency)
      : "Unknown");

  // ── 3. Assemble report lines ────────────────────────────
  const sep = "─".repeat(52);
  const timestamp = new Date().toISOString();

  const pad = (label) => label.padEnd(24, " ");

  const lines = [
    "NEXIS DIAGNOSTIC REPORT",
    `Generated : ${timestamp}`,
    sep,
    "",
    "▸ NEXIS",
    `  ${pad("App Version")} ${NEXIS_APP_VERSION}`,
    `  ${pad("AI Mode")} ${modeLabel(modelConfig)}`,
    `  ${pad("Selected Model")} ${modelConfig?.model || "None"}`,
    "",
    "▸ NEXIS COMPANION",
    `  ${pad("Status")} ${companionReachable ? "Connected" : "Not reachable"}`,
    `  ${pad("Version")} ${
      diag?.bridge_version || (companionReachable ? "Unknown" : "—")
    }`,
    "",
    "▸ SYSTEM",
    `  ${pad("Platform")} ${diag?.platform || navigator.platform || "Unknown"}`,
    `  ${pad("CPU Cores")} ${cpuCores}`,
    `  ${pad("GPU (NVIDIA)")} ${
      diag
        ? (diag.has_nvidia_gpu ? "Detected" : "Not detected")
        : "Unknown"
    }`,
    `  ${pad("RAM")} ${ramValue}`,
    "",
    "▸ OLLAMA",
  ];

  if (!companionReachable) {
    lines.push(
      `  ${pad("Status")} Unknown — Companion not reachable`,
      `  ${pad("Note")} Start the NEXIS Companion to get full Ollama diagnostics.`
    );
  } else {
    const modelList =
      diag.models?.length ? diag.models.join(", ") : "None";
    lines.push(
      `  ${pad("Installed")} ${diag.ollama_installed ? "Yes" : "No"}`,
      `  ${pad("Running")} ${diag.ollama_running ? "Yes" : "No"}`,
      `  ${pad("Version")} ${
        diag.ollama_version
          || (diag.ollama_installed ? "Installed (version unknown)" : "—")
      }`,
      `  ${pad("Installed Models")} ${modelList}`
    );
  }

  const localReady =
    companionReachable &&
    diag?.ollama_running &&
    diag?.models?.length > 0;

  lines.push(
    "",
    "▸ CONNECTION STATUS",
    `  ${pad("Companion Reachable")} ${companionReachable ? "Yes" : "No"}`,
    `  ${pad("Local AI Ready")} ${
      localReady ? "Yes" : (companionReachable ? "No" : "Unknown")
    }`,
    "",
    "▸ SESSION DATA",
    `  ${pad("Recent Error Codes")} None recorded in this session`,
    `  ${pad("Response Timing")} Not tracked in this session`
  );

  // ── 4. Optional advanced fields (user-selected only) ────
  const hasAdvanced = Object.values(advanced).some(Boolean);
  if (hasAdvanced) {
    lines.push("", sep, "▸ ADVANCED DIAGNOSTICS (user-selected fields)", "");

    if (advanced.ollamaPath) {
      lines.push(
        `  ${pad("Ollama Install Path")} ${diag?.ollama_path || "Unknown"}`
      );
    }
    if (advanced.modelStorage) {
      lines.push(
        `  ${pad("Model Storage Path")} ${diag?.model_storage || "Unknown"}`
      );
    }
    if (advanced.endpointUrls) {
      const ep = modelConfig?.endpoint || BRIDGE_DEFAULT_URL;
      lines.push(`  ${pad("Companion Endpoint")} ${ep}`);
    }
    if (advanced.hostname) {
      // Browser cannot expose device hostname — report app origin instead.
      lines.push(
        `  ${pad("App Origin")} ${window.location.origin}`,
        `  ${pad("Note")} Device hostname is not accessible from the browser.`
      );
    }
    if (advanced.envDetails) {
      // Sanitized browser environment — no cookies, no storage dump.
      // Browser user-agent and screen resolution omitted (not needed for troubleshooting).
      lines.push(
        `  ${pad("Language")} ${navigator.language}`
      );
    }
    if (advanced.debugLogs) {
      lines.push(
        `  ${pad("Debug Logs")} No debug log buffer available in this session.`
      );
    }
  }

  lines.push(
    "",
    sep,
    "END OF REPORT",
    "This report was generated for your review only.",
    "NEXIS did not upload or transmit this report."
  );

  return lines.join("\n");
}

// ── Sub-components ───────────────────────────────────────────

function SectionLabel({ children, color = "rgba(255,255,255,0.4)" }) {
  return (
    <p style={{
      margin: "0 0 10px",
      fontSize: "0.74rem",
      fontWeight: 700,
      color,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
    }}>
      {children}
    </p>
  );
}

const bulletItem = {
  fontSize: "0.82rem",
  color: "rgba(255,255,255,0.55)",
  lineHeight: "1.9",
};

const btnBase = {
  padding: "6px 14px",
  borderRadius: 6,
  fontSize: "0.8rem",
  cursor: "pointer",
  transition: "all 0.15s ease",
};

// ── Main component ───────────────────────────────────────────

export default function DiagnosticsOverlay({ onClose }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [report, setReport]             = useState(null);
  const [copied, setCopied]             = useState(false);

  const [advanced, setAdvanced] = useState({
    ollamaPath:   false,
    modelStorage: false,
    endpointUrls: false,
    hostname:     false,
    envDetails:   false,
    debugLogs:    false,
  });

  const toggleAdv = (key) =>
    setAdvanced((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleGenerate = async () => {
    if (!acknowledged || generating) return;
    setGenerating(true);
    setReport(null);
    setCopied(false);
    try {
      const text = await buildReport(advanced);
      setReport(text);
    } catch (err) {
      setReport(`Error generating report:\n${err.message}`);
    }
    setGenerating(false);
    // Reset acknowledgement — user must re-check to generate again.
    setAcknowledged(false);
  };

  const handleCopy = async () => {
    if (!report) return;
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard API unavailable — selection fallback not needed;
      // textarea is readOnly and the user can select manually.
    }
  };

  const handleClear = () => {
    setReport(null);
    setCopied(false);
  };

  const canGenerate = acknowledged && !generating;

  return (
    <PageOverlay title="Diagnostics" onClose={onClose}>

      {/* ── Intro ─────────────────────────────────────────── */}
      <div className="panel">
        <p style={{ margin: "0 0 6px", fontSize: "0.92rem", fontWeight: 600 }}>
          Local AI diagnostic report
        </p>
        <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.52)", lineHeight: 1.6 }}>
          NEXIS can generate a diagnostic report to help troubleshoot NEXIS Companion
          or Ollama issues. The report is shown to you before you copy it.
          NEXIS will not upload it automatically — you decide whether to copy or share it.
        </p>
      </div>

      {/* ── Will be included / Never included ─────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, margin: "16px 0 0" }}>

        {/* WILL BE INCLUDED */}
        <div className="panel">
          <SectionLabel color="var(--arc-accent)">Will be included</SectionLabel>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {[
              "NEXIS app version",
              "NEXIS Companion version",
              "Operating system",
              "CPU core count",
              "GPU detection (NVIDIA)",
              "RAM (approximate)",
              "Ollama status and version",
              "Installed AI models",
              "Selected model",
              "Companion connection status",
              "Local AI readiness status",
              "AI mode: Local or Provider",
              "Recent session error codes",
              "Response timing data",
            ].map((item) => (
              <li key={item} style={bulletItem}>{item}</li>
            ))}
          </ul>
        </div>

        {/* NEVER INCLUDED */}
        <div className="panel">
          <SectionLabel color="rgba(239,68,68,0.85)">Never included</SectionLabel>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {[
              "Prompts or conversations",
              "Uploaded documents or files",
              "Browser history",
              "Passwords",
              "API keys",
              "Authentication tokens",
              "Clipboard contents",
              "Personal folders unrelated to NEXIS",
              "Arbitrary file scans",
              "Cookies or session data",
            ].map((item) => (
              <li key={item} style={bulletItem}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Optional advanced diagnostics ─────────────────── */}
      <div className="panel" style={{ marginTop: 16 }}>
        <SectionLabel>Optional advanced diagnostics</SectionLabel>
        <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.5 }}>
          Leave all unchecked for the standard report. Check any field to include it.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { key: "ollamaPath",   label: "Exact Ollama install path" },
            { key: "modelStorage", label: "Model storage path" },
            { key: "endpointUrls", label: "Local endpoint URLs" },
            { key: "hostname",     label: "Hostname / device name" },
            { key: "envDetails",   label: "Sanitized environment details" },
            { key: "debugLogs",    label: "Expanded debug logs" },
          ].map(({ key, label }) => (
            <label
              key={key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 9,
                cursor: "pointer",
                fontSize: "0.83rem",
                color: "rgba(255,255,255,0.65)",
                userSelect: "none",
              }}
            >
              <input
                type="checkbox"
                checked={advanced[key]}
                onChange={() => toggleAdv(key)}
                style={{ accentColor: "var(--arc-accent)", width: 15, height: 15, flexShrink: 0 }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      {/* ── Acknowledgement + generate button ─────────────── */}
      <div className="panel" style={{ marginTop: 16 }}>
        <label
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => setAcknowledged(e.target.checked)}
            disabled={generating}
            style={{
              accentColor: "var(--arc-accent)",
              width: 15,
              height: 15,
              marginTop: 3,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.72)", lineHeight: 1.55 }}>
            I understand this report will be generated for me to review and copy.
            NEXIS will not upload it automatically.
          </span>
        </label>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            marginTop: 14,
            padding: "9px 22px",
            borderRadius: 7,
            border: "none",
            cursor: canGenerate ? "pointer" : "not-allowed",
            background: canGenerate ? "var(--arc-accent)" : "rgba(255,255,255,0.08)",
            color: canGenerate ? "#000" : "rgba(255,255,255,0.28)",
            fontSize: "0.88rem",
            fontWeight: 600,
            transition: "background 0.15s ease, color 0.15s ease",
          }}
        >
          {generating ? "Generating…" : "Create Diagnostic Report"}
        </button>
      </div>

      {/* ── Report output ─────────────────────────────────── */}
      {report && (
        <div className="panel" style={{ marginTop: 16 }}>

          {/* Header row */}
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 8,
          }}>
            <p style={{
              margin: 0,
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "rgba(255,255,255,0.55)",
            }}>
              Diagnostic report — review before sharing
            </p>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleCopy}
                style={{
                  ...btnBase,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: copied
                    ? "rgba(var(--arc-accent-rgb,99,202,183),0.14)"
                    : "rgba(255,255,255,0.05)",
                  color: copied ? "var(--arc-accent)" : "rgba(255,255,255,0.7)",
                }}
              >
                {copied ? "Copied ✓" : "Copy Report"}
              </button>
              <button
                onClick={handleClear}
                style={{
                  ...btnBase,
                  border: "1px solid rgba(255,255,255,0.07)",
                  background: "transparent",
                  color: "rgba(255,255,255,0.32)",
                }}
              >
                Clear Output
              </button>
            </div>
          </div>

          {/* Report textarea */}
          <textarea
            readOnly
            value={report}
            rows={22}
            style={{
              width: "100%",
              background: "rgba(0,0,0,0.38)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 6,
              padding: "12px 14px",
              fontFamily: "monospace",
              fontSize: "0.77rem",
              color: "rgba(255,255,255,0.72)",
              resize: "vertical",
              outline: "none",
              boxSizing: "border-box",
              lineHeight: 1.65,
            }}
          />
        </div>
      )}

    </PageOverlay>
  );
}
