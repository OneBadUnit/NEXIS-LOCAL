// ============================================================
// ARC-NEXUS - MODEL CONFIG
// File: src/components/ModelConfig/ModelConfig.jsx
// Version: 003 (user-first state machine — NEXIS Local Companion)
//
// Design principles:
//   - Normal users never see "localhost", "port", or terminal commands
//   - Every problem state has a plain-language label and a next-step button
//   - Terminal access is buried under Advanced > Troubleshooting only
//   - Local AI is the primary/default path; provider mode is secondary
//   - The companion handles Ollama start, restart, and model downloads
//
// UI states (uiState):
//   COMPANION_NOT_RUNNING — companion exe not found at bridge URL
//   CHECKING              — currently running detection
//   OLLAMA_NOT_INSTALLED  — companion found but Ollama not on machine
//   OLLAMA_NOT_RUNNING    — Ollama installed but not started
//   OLLAMA_STARTING       — companion is starting Ollama (polling)
//   OLLAMA_HUNG           — start was attempted, timed out
//   NO_MODELS             — Ollama confirmed running, models list empty
//   PULLING_MODEL         — async model download in progress
//   PULL_FAILED           — model download failed
//   MODEL_READY           — connected, model selected, ready to save
//   CHECK_FAILED_TEMP     — had a saved config but temporary check failed
//
// Props:
//   config         — saved model config object or null
//   onConfigChange — called with new config or null on save/clear
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import {
  getDiagnostics,
  startOllama,
  restartOllama,
  pullModel,
  subscribePullProgress,
  openTerminal,
  BRIDGE_DEFAULT_URL,
  RECOMMENDED_MODEL,
  getCompanionDownload,
  isLegacyOllamaEndpoint,
} from "../../lib/bridge.js";

// ── Tested models data ────────────────────────────────────────────────────

const TESTED_MODELS = [
  {
    name: "qwen2.5:7b",
    tag: "Recommended",
    tagColor: "#38bdf8",
    bestFor: ["Summaries", "Timelines", "Extraction", "Structured outputs"],
    notes: [
      "Performs well with NEXIS Summary Packages",
      "Good at preserving structure and formatting",
    ],
    hardware: "Mid-range GPU recommended",
  },
  {
    name: "llama3.1:8b",
    tag: "Popular",
    tagColor: "rgba(255,255,255,0.25)",
    bestFor: ["Conversation", "Brainstorming", "Creative generation"],
    notes: [
      "Strong conversational model",
      "May struggle with large mixed-document summarization",
    ],
    hardware: "Mid / high-range GPU recommended",
  },
  {
    name: "phi-3-mini",
    tag: "Low-end",
    tagColor: "rgba(255,255,255,0.2)",
    bestFor: ["Low-end systems", "CPU / light GPU usage"],
    notes: [
      "Faster but less detailed outputs",
    ],
    hardware: "Low-end GPU or CPU systems",
  },
];

// ── Tested Models Overlay ───────────────────────────────────────────────────

function TestedModelsOverlay({ onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.72)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 10002,
    }}>
      <div className="panel" style={{
        width: 520, margin: 0, maxHeight: "88vh",
        overflowY: "auto", display: "flex", flexDirection: "column", gap: 0,
      }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h3 style={{ margin: 0 }}>Tested Models</h3>
          <button className="btn" style={{ padding: "3px 10px" }} onClick={onClose}>&times;</button>
        </div>

        {/* Intro */}
        <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", margin: "0 0 20px", lineHeight: 1.6 }}>
          NEXIS supports many local AI models. These are tested starting points.
          Results may vary depending on your hardware, quantization, and context size.
        </p>

        {/* Model cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
          {TESTED_MODELS.map((m) => (
            <div key={m.name} style={{
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(255,255,255,0.03)",
              padding: "14px 16px",
            }}>
              {/* Name + tag row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", fontFamily: "monospace" }}>{m.name}</span>
                <span style={{
                  fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
                  background: "rgba(255,255,255,0.08)", color: m.tagColor,
                  border: `1px solid ${m.tagColor}33`,
                }}>{m.tag}</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 16px" }}>
                {/* Best for */}
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Best for</div>
                  <ul style={{ margin: 0, paddingLeft: 14, lineHeight: 1.8, fontSize: "0.83rem" }}>
                    {m.bestFor.map((b) => <li key={b}>{b}</li>)}
                  </ul>
                </div>
                {/* Notes */}
                <div>
                  <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 5 }}>Notes</div>
                  <ul style={{ margin: 0, paddingLeft: 14, lineHeight: 1.8, fontSize: "0.83rem" }}>
                    {m.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                </div>
              </div>

              {/* Hardware */}
              <div style={{ marginTop: 10, fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>
                Hardware: {m.hardware}
              </div>
            </div>
          ))}
        </div>

        {/* Explore more */}
        <div style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          paddingTop: 16,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Explore more models</div>
          <a href="https://ollama.com/library" target="_blank" rel="noreferrer"
            style={{ fontSize: "0.85rem", color: "var(--arc-accent)", textDecoration: "none" }}>
            Ollama Model Library &rarr;
          </a>
          <a href="https://huggingface.co/models" target="_blank" rel="noreferrer"
            style={{ fontSize: "0.85rem", color: "var(--arc-accent)", textDecoration: "none" }}>
            Hugging Face Models &rarr;
          </a>
        </div>

      </div>
    </div>
  );
}

// ── Workspace status row (outside modal) ──────────────────────────────────

function workspaceLabel(config, liveState) {
  if (!config) return "No model configured";
  if (config.type === "provider") {
    return `Provider configured (${config.providerName || "unknown"})`;
  }
  if (!config.model) return "No model selected";
  switch (liveState) {
    case "MODEL_READY": return `Local AI is ready — ${config.model}`;
    case "CHECKING":    return "Checking your local AI…";
    case "COMPANION_NOT_RUNNING": return "NEXIS Companion is not running";
    case "OLLAMA_NOT_RUNNING":    return "Ollama is installed but not open";
    case "OLLAMA_NOT_INSTALLED":  return "Ollama is not installed";
    default:            return "Saved — not checked";
  }
}

function workspaceDot(config, liveState) {
  if (!config) return "rgba(239,68,68,0.7)";
  if (config.type === "provider") return "var(--arc-accent)";
  switch (liveState) {
    case "MODEL_READY": return "var(--arc-accent)";
    case "CHECKING":    return "#f59e0b";
    case "COMPANION_NOT_RUNNING":
    case "OLLAMA_NOT_INSTALLED":
    case "OLLAMA_HUNG":
    case "PULL_FAILED": return "rgba(239,68,68,0.7)";
    case "OLLAMA_NOT_RUNNING":
    case "NO_MODELS":
    case "PULLING_MODEL": return "#f59e0b";
    default:            return "#f59e0b"; // amber = saved but unchecked
  }
}

// ── Pull progress bar ─────────────────────────────────────────────────────

function PullProgressBar({ percent, status }) {
  const pct = percent != null ? percent : null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{
        height: 6,
        borderRadius: 3,
        background: "rgba(255,255,255,0.1)",
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          borderRadius: 3,
          background: "var(--arc-accent)",
          width: pct != null ? `${pct}%` : "30%",
          transition: pct != null ? "width 0.4s ease" : "none",
          animation: pct == null ? "pulse 1.5s ease-in-out infinite" : "none",
        }} />
      </div>
      <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)", margin: "5px 0 0" }}>
        {pct != null ? `${pct}% — ${status || "downloading…"}` : (status || "Preparing download…")}
      </p>
    </div>
  );
}

// ── System badge ──────────────────────────────────────────────────────────

function SystemBadge({ diag }) {
  if (!diag) return null;
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
      {diag.has_nvidia_gpu ? (
        <p style={{ fontSize: "0.78rem", color: "var(--arc-accent)", margin: 0 }}>
          NVIDIA GPU detected — AI will run fast.
        </p>
      ) : (
        <p style={{ fontSize: "0.78rem", color: "#f59e0b", margin: 0 }}>
          No NVIDIA GPU — AI will run on CPU (slower but supported).
        </p>
      )}
      {diag.cpu_count > 0 && (
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
          {diag.cpu_count} CPU threads · {diag.platform}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function ModelConfig({ config, onConfigChange }) {
  const companionDl = getCompanionDownload();

  const [modalOpen, setModalOpen]           = useState(false);
  const [testedModelsOpen, setTestedModelsOpen] = useState(false);
  const [tab, setTab]                       = useState("local");

  // State machine
  const [uiState, setUiState]       = useState(null); // null = not yet checked this session
  const [statusMsg, setStatusMsg]   = useState("");    // secondary explanation line

  // Local AI data
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel]     = useState("");
  const [diagInfo, setDiagInfo]               = useState(null); // full /diagnostics snapshot

  // Pull state
  const [pullPercent, setPullPercent]   = useState(null);
  const [pullStatus, setPullStatus]     = useState("");
  const [pullModel_, setPullModel_]     = useState(RECOMMENDED_MODEL);
  const cancelPullRef = useRef(null);

  // Advanced / troubleshooting
  const [showAdvanced, setShowAdvanced]         = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [localEndpoint, setLocalEndpoint]       = useState(BRIDGE_DEFAULT_URL);
  const [terminalOpening, setTerminalOpening]   = useState(false);

  // Provider
  const [providerName, setProviderName] = useState("");
  const [providerKey, setProviderKey]   = useState("");

  // ── Open modal ────────────────────────────────────────────────────────────

  const handleOpen = async () => {
    if (config?.type === "provider") {
      setTab("provider");
      setProviderName(config.providerName || "");
      setProviderKey(config.providerKey || "");
      setModalOpen(true);
      return;
    }

    setTab("local");
    const ep = isLegacyOllamaEndpoint(config?.endpoint)
      ? BRIDGE_DEFAULT_URL
      : (config?.endpoint || BRIDGE_DEFAULT_URL);
    setLocalEndpoint(ep);
    setSelectedModel(config?.model || "");
    setShowAdvanced(false);
    setShowTroubleshooting(false);
    setModalOpen(true);

    await runDetection(ep, config?.model || "");
  };

  // ── Full detection flow ───────────────────────────────────────────────────
  // Calls /diagnostics → derives uiState → sets available models.

  const runDetection = async (endpoint = localEndpoint, currentModel = selectedModel) => {
    const base = endpoint.replace(/\/$/, "");
    setUiState("CHECKING");
    setStatusMsg("Checking your local AI…");
    setAvailableModels([]);
    setDiagInfo(null);

    const diag = await getDiagnostics(base);

    // Companion not running
    if (!diag) {
      // If user had a previously saved + working config, show temp failure
      if (config?.type === "local" && config?.model) {
        setUiState("CHECK_FAILED_TEMP");
        setStatusMsg("Could not reach the NEXIS Companion right now.");
      } else {
        setUiState("COMPANION_NOT_RUNNING");
        setStatusMsg("Start the NEXIS Companion to use local AI.");
      }
      return;
    }

    setDiagInfo(diag);

    // Ollama not installed
    if (!diag.ollama_installed) {
      setUiState("OLLAMA_NOT_INSTALLED");
      setStatusMsg("Ollama needs to be installed on your computer.");
      return;
    }

    // Ollama not running
    if (!diag.ollama_running) {
      setUiState("OLLAMA_NOT_RUNNING");
      setStatusMsg("Ollama is installed but not open. NEXIS can open it for you.");
      return;
    }

    // Ollama running — check models
    const models = Array.isArray(diag.models) ? diag.models : [];
    if (models.length === 0) {
      setUiState("NO_MODELS");
      setPullModel_(diag.recommended_model || RECOMMENDED_MODEL);
      setStatusMsg("No AI model found. NEXIS can download one for you.");
      return;
    }

    setAvailableModels(models);

    // Restore or pick model
    let chosen = currentModel;
    if (chosen && !models.includes(chosen)) {
      chosen = models[0];
    }
    if (!chosen) chosen = models[0];
    setSelectedModel(chosen);
    setUiState("MODEL_READY");
    setStatusMsg("");
  };

  // ── Action: Start Ollama ──────────────────────────────────────────────────

  const handleStartOllama = async () => {
    setUiState("OLLAMA_STARTING");
    setStatusMsg("Opening Ollama… this may take up to 20 seconds.");

    const result = await startOllama(localEndpoint);

    if (result.error || !result.ollamaNowRunning) {
      setUiState("OLLAMA_HUNG");
      setStatusMsg("Ollama did not start in time. Try restarting it.");
      return;
    }

    // Re-run full detection now that Ollama is up
    await runDetection(localEndpoint, selectedModel);
  };

  // ── Action: Restart Ollama ────────────────────────────────────────────────

  const handleRestartOllama = async () => {
    setUiState("OLLAMA_STARTING");
    setStatusMsg("Restarting Ollama…");

    const result = await restartOllama(localEndpoint);

    if (result.error || !result.ollamaNowRunning) {
      setUiState("OLLAMA_HUNG");
      setStatusMsg("Restart did not complete. Try closing Ollama manually, then click Recheck.");
      return;
    }

    await runDetection(localEndpoint, selectedModel);
  };

  // ── Action: Download recommended model ───────────────────────────────────

  const handleDownloadModel = async () => {
    setUiState("PULLING_MODEL");
    setPullPercent(null);
    setPullStatus("Starting download…");

    const model = pullModel_ || RECOMMENDED_MODEL;
    const result = await pullModel(model, localEndpoint);

    if (result.error || !result.started) {
      setUiState("PULL_FAILED");
      setStatusMsg(result.error || "Download could not start. Make sure Ollama is open.");
      return;
    }

    cancelPullRef.current = subscribePullProgress(
      result.jobId,
      localEndpoint,
      ({ status, percent }) => {
        setPullPercent(percent);
        setPullStatus(status || "Downloading…");
      },
      async ({ success, error }) => {
        cancelPullRef.current = null;
        if (!success) {
          setUiState("PULL_FAILED");
          setStatusMsg(error || "Download failed. Check that Ollama is open and try again.");
          return;
        }
        // Re-run detection to pick up the new model
        await runDetection(localEndpoint, model);
      }
    );
  };

  const handleCancelPull = () => {
    if (cancelPullRef.current) {
      cancelPullRef.current();
      cancelPullRef.current = null;
    }
    // Return to NO_MODELS — don't re-detect so we don't re-show "no models"
    // if pull was partially complete. Let user recheck manually.
    setUiState("NO_MODELS");
    setStatusMsg("Download cancelled.");
  };

  // Cleanup on unmount
  useEffect(() => () => {
    if (cancelPullRef.current) cancelPullRef.current();
  }, []);

  // ── Action: Open terminal (last resort) ───────────────────────────────────

  const handleOpenTerminal = async () => {
    if (!window.confirm(
      "This will open a Command Prompt window on your computer.\n\n" +
      "Only do this if you have been asked to by NEXIS support. Continue?"
    )) return;

    setTerminalOpening(true);
    await openTerminal(localEndpoint);
    setTerminalOpening(false);
  };

  // ── Save / Clear ──────────────────────────────────────────────────────────

  const handleSaveLocal = () => {
    const newConfig = {
      type: "local",
      endpoint: localEndpoint,
      model: selectedModel,
    };
    localStorage.setItem("nexis_model_config", JSON.stringify(newConfig));
    onConfigChange(newConfig);
    setModalOpen(false);
  };

  const handleSaveProvider = () => {
    if (!providerName.trim() || !providerKey.trim()) return;
    const newConfig = {
      type: "provider",
      providerName: providerName.trim(),
      providerKey: providerKey.trim(),
    };
    localStorage.setItem("nexis_model_config", JSON.stringify(newConfig));
    onConfigChange(newConfig);
    setModalOpen(false);
  };

  const handleClear = () => {
    localStorage.removeItem("nexis_model_config");
    onConfigChange(null);
    setModalOpen(false);
  };

  // ── Derived helpers ───────────────────────────────────────────────────────

  const isBusy = uiState === "CHECKING" || uiState === "OLLAMA_STARTING" || uiState === "PULLING_MODEL";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Workspace status row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.82rem", color: workspaceDot(config, uiState) }}>⬤</span>
        <span style={{ fontSize: "0.82rem", color: workspaceDot(config, uiState) }}>
          {workspaceLabel(config, uiState)}
        </span>
        <button
          className="btn"
          style={{ padding: "3px 12px", fontSize: "0.8rem", marginLeft: 4 }}
          onClick={handleOpen}
        >
          {config ? "Edit Model" : "Configure Model"}
        </button>
        <button
          className="btn"
          style={{ padding: "3px 12px", fontSize: "0.8rem" }}
          onClick={() => setTestedModelsOpen(true)}
        >
          Tested Models
        </button>
      </div>

      {/* ── Config modal ── */}
      {modalOpen && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10001,
        }}>
          <div className="panel" style={{ width: 460, margin: 0, maxHeight: "90vh", overflowY: "auto" }}>

            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>AI Model Settings</h3>
              <button className="btn" style={{ padding: "3px 10px" }} onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className="row" style={{ marginBottom: 20 }}>
              <button className={`btn${tab === "local" ? " active" : ""}`} onClick={() => setTab("local")}>
                Local AI
              </button>
              <button
                className={`btn${tab === "provider" ? " active" : ""}`}
                onClick={() => setTab("provider")}
                style={{ opacity: 0.7 }}
              >
                Provider Key
              </button>
            </div>

            {/* ══ LOCAL AI TAB ══ */}
            {tab === "local" && (
              <div>

                {/* ── State: CHECKING ── */}
                {uiState === "CHECKING" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>
                      Checking your local AI…
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                      {statusMsg}
                    </p>
                  </div>
                )}

                {/* ── State: COMPANION_NOT_RUNNING ── */}
                {uiState === "COMPANION_NOT_RUNNING" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 8px", fontWeight: 500 }}>
                      NEXIS Companion is not running.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>
                      The NEXIS Companion is a small program that enables local AI on your computer.
                      Download and run it once, then come back here.
                    </p>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      {companionDl.supported ? (
                        <a
                          href={companionDl.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn primary"
                          style={{ textDecoration: "none", padding: "6px 14px", fontSize: "0.85rem" }}
                        >
                          {companionDl.label}
                        </a>
                      ) : (
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}>
                          NEXIS Local Companion currently supports Windows and Linux/WSL2.
                        </p>
                      )}
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>
                        Recheck
                      </button>
                    </div>
                    <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}>
                      {companionDl.supported ? `Detected platform: ${companionDl.platform}` : "Unsupported platform"}
                    </p>
                  </div>
                )}

                {/* ── State: CHECK_FAILED_TEMP ── */}
                {uiState === "CHECK_FAILED_TEMP" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "#f59e0b", margin: "0 0 8px" }}>
                      Models could not be checked right now.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>
                      {statusMsg}
                    </p>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>
                        Recheck
                      </button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={handleRestartOllama}>
                        Restart Ollama
                      </button>
                    </div>
                  </div>
                )}

                {/* ── State: OLLAMA_NOT_INSTALLED ── */}
                {uiState === "OLLAMA_NOT_INSTALLED" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 8px", fontWeight: 500 }}>
                      Ollama is not installed.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>
                      Ollama is the free, open-source program that runs AI models on your computer.
                      Install it, then come back here.
                    </p>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <a
                        href="https://ollama.com/download"
                        target="_blank"
                        rel="noreferrer"
                        className="btn primary"
                        style={{ textDecoration: "none", padding: "6px 14px", fontSize: "0.85rem" }}
                      >
                        Install Ollama
                      </a>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>
                        Recheck
                      </button>
                    </div>
                  </div>
                )}

                {/* ── State: OLLAMA_NOT_RUNNING ── */}
                {uiState === "OLLAMA_NOT_RUNNING" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 8px", fontWeight: 500 }}>
                      Ollama is installed but not open.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>
                      {statusMsg}
                    </p>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <button className="btn primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={handleStartOllama}>
                        Start Ollama
                      </button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>
                        Recheck
                      </button>
                    </div>
                  </div>
                )}

                {/* ── State: OLLAMA_STARTING ── */}
                {uiState === "OLLAMA_STARTING" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>
                      Ollama is starting…
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                      {statusMsg}
                    </p>
                  </div>
                )}

                {/* ── State: OLLAMA_HUNG ── */}
                {uiState === "OLLAMA_HUNG" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "#f59e0b", margin: "0 0 8px", fontWeight: 500 }}>
                      Ollama appears to be stuck.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>
                      {statusMsg}
                    </p>
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <button className="btn primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={handleRestartOllama}>
                        Restart Ollama
                      </button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>
                        Recheck
                      </button>
                    </div>
                  </div>
                )}

                {/* ── State: NO_MODELS ── */}
                {uiState === "NO_MODELS" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 8px", fontWeight: 500 }}>
                      No AI model found.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 4px" }}>
                      NEXIS will download the recommended model ({pullModel_}) automatically.
                    </p>
                    {statusMsg && (
                      <p style={{ fontSize: "0.78rem", color: "#f59e0b", margin: "0 0 12px" }}>
                        {statusMsg}
                      </p>
                    )}
                    <div className="row" style={{ gap: 8, flexWrap: "wrap" }}>
                      <button className="btn primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={handleDownloadModel}>
                        Download Recommended Model
                      </button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>
                        Recheck
                      </button>
                    </div>
                  </div>
                )}

                {/* ── State: PULLING_MODEL ── */}
                {uiState === "PULLING_MODEL" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 4px", fontWeight: 500 }}>
                      Downloading AI model…
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", margin: "0 0 8px" }}>
                      {pullModel_} — this may take several minutes depending on your internet speed.
                    </p>
                    <PullProgressBar percent={pullPercent} status={pullStatus} />
                    <button
                      className="btn"
                      style={{ marginTop: 14, padding: "5px 12px", fontSize: "0.82rem" }}
                      onClick={handleCancelPull}
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* ── State: PULL_FAILED ── */}
                {uiState === "PULL_FAILED" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(239,68,68,0.9)", margin: "0 0 8px", fontWeight: 500 }}>
                      Download failed.
                    </p>
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: "0 0 16px" }}>
                      {statusMsg}
                    </p>
                    <div className="row" style={{ gap: 8 }}>
                      <button className="btn primary" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={handleDownloadModel}>
                        Try Again
                      </button>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>
                        Recheck
                      </button>
                    </div>
                  </div>
                )}

                {/* ── State: MODEL_READY ── */}
                {uiState === "MODEL_READY" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "var(--arc-accent)", margin: "0 0 4px", fontWeight: 500 }}>
                      Local AI is ready.
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: "0 0 14px" }}>
                      {availableModels.length} model{availableModels.length !== 1 ? "s" : ""} available.
                    </p>

                    {/* Model selection list */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                      {availableModels.map((m) => (
                        <button
                          key={m}
                          className={`btn${selectedModel === m ? " active" : ""}`}
                          style={{ textAlign: "left", padding: "6px 12px", fontSize: "0.85rem", justifyContent: "flex-start" }}
                          onClick={() => setSelectedModel(m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    {/* System info */}
                    <SystemBadge diag={diagInfo} />

                    {/* Recheck / reconnect */}
                    <button
                      className="btn"
                      style={{ marginTop: 14, padding: "5px 12px", fontSize: "0.82rem" }}
                      onClick={() => runDetection(localEndpoint, selectedModel)}
                      disabled={isBusy}
                    >
                      Recheck
                    </button>
                  </div>
                )}

                {/* ── Advanced section ── */}
                <div style={{ marginTop: 22, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
                  <button
                    style={{ all: "unset", cursor: "pointer", fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", textDecoration: "underline", textUnderlineOffset: 3 }}
                    onClick={() => setShowAdvanced((v) => !v)}
                  >
                    {showAdvanced ? "▾ Hide Advanced" : "▸ Advanced"}
                  </button>

                  {showAdvanced && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", display: "block", marginBottom: 5 }}>
                        NEXIS Companion URL
                      </label>
                      <input
                        value={localEndpoint}
                        onChange={(e) => {
                          setLocalEndpoint(e.target.value);
                          setUiState(null);
                          setAvailableModels([]);
                          setSelectedModel("");
                        }}
                        placeholder={BRIDGE_DEFAULT_URL}
                        style={{ marginBottom: 6, fontSize: "0.82rem" }}
                      />
                      <p className="subtle" style={{ fontSize: "0.75rem", margin: "0 0 10px" }}>
                        Default: {BRIDGE_DEFAULT_URL}. Change only if you run the companion on a custom port.
                      </p>
                      <button className="btn" style={{ padding: "4px 12px", fontSize: "0.8rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}
                        disabled={isBusy}>
                        Recheck with this URL
                      </button>

                      {/* Troubleshooting — deeper last-resort section */}
                      <div style={{ marginTop: 14 }}>
                        <button
                          style={{ all: "unset", cursor: "pointer", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", textDecoration: "underline", textUnderlineOffset: 3 }}
                          onClick={() => setShowTroubleshooting((v) => !v)}
                        >
                          {showTroubleshooting ? "▾ Hide Troubleshooting" : "▸ Troubleshooting"}
                        </button>

                        {showTroubleshooting && (
                          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                            {diagInfo && (
                              <div style={{ marginBottom: 10 }}>
                                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: "0 0 3px" }}>
                                  Companion v{diagInfo.bridge_version || "—"} · {diagInfo.platform || "—"} · {diagInfo.cpu_count || 0} CPUs
                                </p>
                                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: "0 0 3px" }}>
                                  Ollama path: {diagInfo.ollama_path || "not found"}
                                </p>
                                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
                                  Model storage: {diagInfo.model_storage || "—"}
                                </p>
                              </div>
                            )}
                            <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", margin: "0 0 8px" }}>
                              Open a terminal only if NEXIS support has asked you to.
                            </p>
                            <button
                              className="btn"
                              style={{ padding: "4px 12px", fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}
                              onClick={handleOpenTerminal}
                              disabled={terminalOpening}
                            >
                              {terminalOpening ? "Opening…" : "Open Command Prompt"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Save / Clear buttons ── */}
                <div className="row" style={{ marginTop: 20, justifyContent: "flex-end" }}>
                  {config && (
                    <button
                      className="btn"
                      style={{ color: "rgba(239,68,68,0.7)", borderColor: "rgba(239,68,68,0.4)" }}
                      onClick={handleClear}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    className="btn primary"
                    onClick={handleSaveLocal}
                    disabled={!selectedModel || uiState !== "MODEL_READY"}
                  >
                    Save
                  </button>
                </div>

              </div>
            )}

            {/* ══ PROVIDER KEY TAB ══ */}
            {tab === "provider" && (
              <div>
                <p className="subtle" style={{ fontSize: "0.82rem", marginBottom: 14 }}>
                  Use a provider API key (e.g. OpenAI, Anthropic) via the hosted backend.
                  Local AI mode is recommended for privacy and offline use.
                </p>
                <label style={{ fontSize: "0.82rem", display: "block", marginBottom: 6 }}>Provider Name</label>
                <input
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g. OpenAI, Anthropic"
                  style={{ marginBottom: 10 }}
                />
                <label style={{ fontSize: "0.82rem", display: "block", marginBottom: 6 }}>API Key</label>
                <input
                  type="password"
                  value={providerKey}
                  onChange={(e) => setProviderKey(e.target.value)}
                  placeholder="Paste your API key"
                  style={{ marginBottom: 10 }}
                />
                <p className="subtle" style={{ fontSize: "0.78rem", marginBottom: 16 }}>
                  Key is stored locally. Do not use on shared devices.
                </p>
                <div className="row" style={{ justifyContent: "flex-end" }}>
                  {config && (
                    <button className="btn"
                      style={{ color: "rgba(239,68,68,0.7)", borderColor: "rgba(239,68,68,0.4)" }}
                      onClick={handleClear}>
                      Clear
                    </button>
                  )}
                  <button className="btn primary" onClick={handleSaveProvider}
                    disabled={!providerName.trim() || !providerKey.trim()}>
                    Save
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── Tested Models overlay ── */}
      {testedModelsOpen && (
        <TestedModelsOverlay onClose={() => setTestedModelsOpen(false)} />
      )}
    </>
  );
}
