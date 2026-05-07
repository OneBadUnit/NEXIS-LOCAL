// ============================================================
// ARC-NEXUS - MODEL CONFIG
// File: src/components/ModelConfig/ModelConfig.jsx
// Version: 003 (user-first state machine â€” NEXIS Local Companion)
//
// Design principles:
//   - Normal users never see "localhost", "port", or terminal commands
//   - Every problem state has a plain-language label and a next-step button
//   - Terminal access is buried under Advanced > Troubleshooting only
//   - Local AI is the primary/default path; provider mode is secondary
//   - The companion handles Ollama start, restart, and model downloads
//
// UI states (uiState):
//   COMPANION_NOT_RUNNING â€” companion exe not found at bridge URL
//   CHECKING              â€” currently running detection
//   OLLAMA_NOT_INSTALLED  â€” companion found but Ollama not on machine
//   OLLAMA_NOT_RUNNING    â€” Ollama installed but not started
//   OLLAMA_STARTING       â€” companion is starting Ollama (polling)
//   OLLAMA_HUNG           â€” start was attempted, timed out
//   NO_MODELS             â€” Ollama confirmed running, models list empty
//   PULLING_MODEL         â€” async model download in progress
//   PULL_FAILED           â€” model download failed
//   MODEL_READY           â€” connected, model selected, ready to save
//   CHECK_FAILED_TEMP     â€” had a saved config but temporary check failed
//
// Props:
//   config         â€” saved model config object or null
//   onConfigChange â€” called with new config or null on save/clear
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import {
  getDiagnostics,
  startOllama,
  restartOllama,
  fetchBridgeModels,
  pullModel,
  subscribePullProgress,
  openTerminal,
  getBridgeSystem,
  BRIDGE_DEFAULT_URL,
  RECOMMENDED_MODEL,
  isLegacyOllamaEndpoint,
} from "../../lib/bridge.js";

// â”€â”€ Workspace status row (outside modal) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function workspaceLabel(config, liveState) {
  if (!config) return "No model configured";
  if (config.type === "provider") {
    return `Provider configured (${config.providerName || "unknown"})`;
  }
  if (!config.model) return "No model selected";
  switch (liveState) {
    case "MODEL_READY": return `Local AI is ready â€” ${config.model}`;
    case "CHECKING":    return "Checking your local AIâ€¦";
    case "COMPANION_NOT_RUNNING": return "NEXIS Companion is not running";
    case "OLLAMA_NOT_RUNNING":    return "Ollama is installed but not open";
    case "OLLAMA_NOT_INSTALLED":  return "Ollama is not installed";
    default:            return "Saved â€” not checked";
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

// â”€â”€ Pull progress bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
        {pct != null ? `${pct}% â€” ${status || "downloadingâ€¦"}` : (status || "Preparing downloadâ€¦")}
      </p>
    </div>
  );
}

// â”€â”€ System badge â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SystemBadge({ diag }) {
  if (!diag) return null;
  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
      {diag.has_nvidia_gpu ? (
        <p style={{ fontSize: "0.78rem", color: "var(--arc-accent)", margin: 0 }}>
          NVIDIA GPU detected â€” AI will run fast.
        </p>
      ) : (
        <p style={{ fontSize: "0.78rem", color: "#f59e0b", margin: 0 }}>
          No NVIDIA GPU â€” AI will run on CPU (slower but supported).
        </p>
      )}
      {diag.cpu_count > 0 && (
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
          {diag.cpu_count} CPU threads Â· {diag.platform}
        </p>
      )}
    </div>
  );
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ModelConfig({ config, onConfigChange }) {
  const [modalOpen, setModalOpen]   = useState(false);
  const [tab, setTab]               = useState("local");

  // State machine
  const [uiState, setUiState]       = useState(null); // null = not yet checked this session
  const [statusMsg, setStatusMsg]   = useState("");    // secondary explanation line

  // Local AI data
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel]     = useState("");
  const [diagInfo, setDiagInfo]               = useState(null); // full /diagnostics snapshot
  const [ollamaInstalled, setOllamaInstalled] = useState(false);

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

  // â”€â”€ Open modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Full detection flow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // Calls /diagnostics â†’ derives uiState â†’ sets available models.

  const runDetection = async (endpoint = localEndpoint, currentModel = selectedModel) => {
    const base = endpoint.replace(/\/$/, "");
    setUiState("CHECKING");
    setStatusMsg("Checking your local AIâ€¦");
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
    setOllamaInstalled(!!diag.ollama_installed);

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

    // Ollama running â€” check models
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

  // â”€â”€ Action: Start Ollama â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleStartOllama = async () => {
    setUiState("OLLAMA_STARTING");
    setStatusMsg("Opening Ollamaâ€¦ this may take up to 20 seconds.");

    const result = await startOllama(localEndpoint);

    if (result.error || !result.ollamaNowRunning) {
      setUiState("OLLAMA_HUNG");
      setStatusMsg("Ollama did not start in time. Try restarting it.");
      return;
    }

    // Re-run full detection now that Ollama is up
    await runDetection(localEndpoint, selectedModel);
  };

  // â”€â”€ Action: Restart Ollama â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleRestartOllama = async () => {
    setUiState("OLLAMA_STARTING");
    setStatusMsg("Restarting Ollamaâ€¦");

    const result = await restartOllama(localEndpoint);

    if (result.error || !result.ollamaNowRunning) {
      setUiState("OLLAMA_HUNG");
      setStatusMsg("Restart did not complete. Try closing Ollama manually, then click Recheck.");
      return;
    }

    await runDetection(localEndpoint, selectedModel);
  };

  // â”€â”€ Action: Download recommended model â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleDownloadModel = async () => {
    setUiState("PULLING_MODEL");
    setPullPercent(null);
    setPullStatus("Starting downloadâ€¦");

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
        setPullStatus(status || "Downloadingâ€¦");
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
    // Return to NO_MODELS â€” don't re-detect so we don't re-show "no models"
    // if pull was partially complete. Let user recheck manually.
    setUiState("NO_MODELS");
    setStatusMsg("Download cancelled.");
  };

  // Cleanup on unmount
  useEffect(() => () => {
    if (cancelPullRef.current) cancelPullRef.current();
  }, []);

  // â”€â”€ Action: Open terminal (last resort) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const handleOpenTerminal = async () => {
    if (!window.confirm(
      "This will open a Command Prompt window on your computer.\n\n" +
      "Only do this if you have been asked to by NEXIS support. Continue?"
    )) return;

    setTerminalOpening(true);
    await openTerminal(localEndpoint);
    setTerminalOpening(false);
  };

  // â”€â”€ Save / Clear â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

  // â”€â”€ Derived helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const isBusy = uiState === "CHECKING" || uiState === "OLLAMA_STARTING" || uiState === "PULLING_MODEL";

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <>
      {/* â”€â”€ Workspace status row â”€â”€ */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "0.82rem", color: workspaceDot(config, uiState) }}>â¬¤</span>
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
      </div>

      {/* â”€â”€ Config modal â”€â”€ */}
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

            {/* â•â• LOCAL AI TAB â•â• */}
            {tab === "local" && (
              <div>

                {/* â”€â”€ State: CHECKING â”€â”€ */}
                {uiState === "CHECKING" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>
                      Checking your local AIâ€¦
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                      {statusMsg}
                    </p>
                  </div>
                )}

                {/* â”€â”€ State: COMPANION_NOT_RUNNING â”€â”€ */}
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
                      <a
                        href="https://github.com/arc-nexus/nexis-companion/releases"
                        target="_blank"
                        rel="noreferrer"
                        className="btn primary"
                        style={{ textDecoration: "none", padding: "6px 14px", fontSize: "0.85rem" }}
                      >
                        Download NEXIS Companion
                      </a>
                      <button className="btn" style={{ padding: "6px 14px", fontSize: "0.85rem" }}
                        onClick={() => runDetection(localEndpoint, selectedModel)}>
                        Recheck
                      </button>
                    </div>
                  </div>
                )}

                {/* â”€â”€ State: CHECK_FAILED_TEMP â”€â”€ */}
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

                {/* â”€â”€ State: OLLAMA_NOT_INSTALLED â”€â”€ */}
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

                {/* â”€â”€ State: OLLAMA_NOT_RUNNING â”€â”€ */}
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

                {/* â”€â”€ State: OLLAMA_STARTING â”€â”€ */}
                {uiState === "OLLAMA_STARTING" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", margin: "0 0 6px" }}>
                      Ollama is startingâ€¦
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                      {statusMsg}
                    </p>
                  </div>
                )}

                {/* â”€â”€ State: OLLAMA_HUNG â”€â”€ */}
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

                {/* â”€â”€ State: NO_MODELS â”€â”€ */}
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

                {/* â”€â”€ State: PULLING_MODEL â”€â”€ */}
                {uiState === "PULLING_MODEL" && (
                  <div>
                    <p style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.85)", margin: "0 0 4px", fontWeight: 500 }}>
                      Downloading AI modelâ€¦
                    </p>
                    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", margin: "0 0 8px" }}>
                      {pullModel_} â€” this may take several minutes depending on your internet speed.
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

                {/* â”€â”€ State: PULL_FAILED â”€â”€ */}
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

                {/* â”€â”€ State: MODEL_READY â”€â”€ */}
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

                {/* â”€â”€ Advanced section â”€â”€ */}
                <div style={{ marginTop: 22, borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14 }}>
                  <button
                    style={{ all: "unset", cursor: "pointer", fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", textDecoration: "underline", textUnderlineOffset: 3 }}
                    onClick={() => setShowAdvanced((v) => !v)}
                  >
                    {showAdvanced ? "â–¾ Hide Advanced" : "â–¸ Advanced"}
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

                      {/* Troubleshooting â€” deeper last-resort section */}
                      <div style={{ marginTop: 14 }}>
                        <button
                          style={{ all: "unset", cursor: "pointer", fontSize: "0.75rem", color: "rgba(255,255,255,0.25)", textDecoration: "underline", textUnderlineOffset: 3 }}
                          onClick={() => setShowTroubleshooting((v) => !v)}
                        >
                          {showTroubleshooting ? "â–¾ Hide Troubleshooting" : "â–¸ Troubleshooting"}
                        </button>

                        {showTroubleshooting && (
                          <div style={{ marginTop: 10, padding: "10px 12px", background: "rgba(255,255,255,0.04)", borderRadius: 6 }}>
                            {diagInfo && (
                              <div style={{ marginBottom: 10 }}>
                                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: "0 0 3px" }}>
                                  Companion v{diagInfo.bridge_version || "â€”"} Â· {diagInfo.platform || "â€”"} Â· {diagInfo.cpu_count || 0} CPUs
                                </p>
                                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: "0 0 3px" }}>
                                  Ollama path: {diagInfo.ollama_path || "not found"}
                                </p>
                                <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.35)", margin: 0 }}>
                                  Model storage: {diagInfo.model_storage || "â€”"}
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
                              {terminalOpening ? "Openingâ€¦" : "Open Command Prompt"}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* â”€â”€ Save / Clear buttons â”€â”€ */}
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

            {/* â•â• PROVIDER KEY TAB â•â• */}
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
    </>
  );
}
