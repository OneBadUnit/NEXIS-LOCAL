// ============================================================
// ARC-NEXUS - MODEL CONFIG
// File: src/components/ModelConfig/ModelConfig.jsx
// Version: 002 (local-first via NEXIS Local Companion bridge)
//
// Local mode is the PRIMARY/DEFAULT path.
// Provider key mode is secondary.
//
// Detection flow:
//   1. Modal opens → auto-run bridge detection immediately
//   2. checkBridge() → confirms bridge + Ollama reachable
//   3. fetchBridgeModels() → populates model list
//   4. "Reconnect" button re-runs detection manually
//
// Status shown in workspace row:
//   - No config        → "No model configured"          (red dot)
//   - Saved, unchecked → "Saved — not checked"          (amber dot)
//   - Bridge error     → specific error message          (red dot)
//   - Connected        → "Local model ready — {model}"  (green dot)
//   - Provider         → "Provider configured"           (green dot)
//
// localStorage migration:
//   Old configs pointing at localhost:11434 or 127.0.0.1:11434
//   are automatically migrated to the bridge URL on read.
//
// Props:
//   config         — current model config object or null
//   onConfigChange — called with new config object or null on save/clear
// ============================================================

import React, { useState } from "react";
import {
  checkBridge,
  fetchBridgeModels,
  getBridgeSystem,
  BRIDGE_DEFAULT_URL,
  isLegacyOllamaEndpoint,
} from "../../lib/bridge.js";

// ── Status label / dot helpers ────────────────────────────────────────────

// "live" detection state separate from saved config:
// null = not yet checked, "checking", "ok", "error"
function workspaceStatusLabel(config, liveStatus) {
  if (!config) return "No model configured";

  if (config.type === "provider") {
    return `Provider configured (${config.providerName || "unknown"})`;
  }

  // Local type
  if (!config.model) return "No model selected";

  switch (liveStatus) {
    case "ok":
      return `Local model ready — ${config.model}`;
    case "error":
      return "Local Companion — connection error";
    case "checking":
      return "Checking local model…";
    default:
      // null = saved but not yet verified this session
      return `Saved — not checked`;
  }
}

function workspaceDotColor(config, liveStatus) {
  if (!config) return "rgba(239,68,68,0.7)";
  if (config.type === "provider") return "var(--arc-accent)";
  switch (liveStatus) {
    case "ok":      return "var(--arc-accent)";
    case "error":   return "rgba(239,68,68,0.7)";
    case "checking": return "#f59e0b";
    default:        return "#f59e0b"; // amber = saved but unchecked
  }
}

// ── Processor badge shown after detection ─────────────────────────────────

function ProcessorBadge({ system }) {
  if (!system) return null;
  const { has_nvidia_gpu, cpu_count, platform } = system;

  return (
    <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 3 }}>
      {has_nvidia_gpu ? (
        <p style={{ fontSize: "0.78rem", color: "var(--arc-accent)", margin: 0 }}>
          NVIDIA GPU detected.
        </p>
      ) : (
        <p style={{ fontSize: "0.78rem", color: "#f59e0b", margin: 0 }}>
          No NVIDIA GPU detected — model will run on CPU.
        </p>
      )}
      {cpu_count > 0 && (
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: 0 }}>
          {cpu_count} CPU threads · {platform}
        </p>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────

export default function ModelConfig({ config, onConfigChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState("local");

  // Live detection state (this session only — never read from localStorage)
  // null = not checked, "checking", "ok", "error"
  const [liveStatus, setLiveStatus] = useState(null);
  const [liveErrorMsg, setLiveErrorMsg] = useState("");

  // Local model UI state
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [systemInfo, setSystemInfo] = useState(null);

  // Advanced endpoint (hidden by default)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localEndpoint, setLocalEndpoint] = useState(BRIDGE_DEFAULT_URL);

  // Provider state
  const [providerName, setProviderName] = useState("");
  const [providerKey, setProviderKey] = useState("");

  // ── Open modal ───────────────────────────────────────────────────────────
  const handleOpen = async () => {
    // Pre-populate from saved config
    if (config?.type === "local") {
      setTab("local");
      // Migrate legacy direct-Ollama endpoint to bridge URL
      const savedEndpoint = isLegacyOllamaEndpoint(config.endpoint)
        ? BRIDGE_DEFAULT_URL
        : (config.endpoint || BRIDGE_DEFAULT_URL);
      setLocalEndpoint(savedEndpoint);
      setSelectedModel(config.model || "");
      setShowAdvanced(false);
    } else if (config?.type === "provider") {
      setTab("provider");
      setProviderName(config.providerName || "");
      setProviderKey(config.providerKey || "");
    } else {
      // No saved config — default to local tab
      setTab("local");
      setLocalEndpoint(BRIDGE_DEFAULT_URL);
      setSelectedModel("");
      setShowAdvanced(false);
    }

    // Reset live state for this session
    setLiveStatus(null);
    setLiveErrorMsg("");
    setAvailableModels([]);
    setSystemInfo(null);

    setModalOpen(true);

    // Auto-run detection immediately on open (local tab)
    if (!config || config?.type === "local") {
      const ep = isLegacyOllamaEndpoint(config?.endpoint)
        ? BRIDGE_DEFAULT_URL
        : (config?.endpoint || BRIDGE_DEFAULT_URL);
      await runDetection(ep, config?.model || "");
    }
  };

  // ── Core detection logic ─────────────────────────────────────────────────
  // Called on modal open and on "Reconnect" click.
  const runDetection = async (endpoint = localEndpoint, currentModel = selectedModel) => {
    const base = endpoint.replace(/\/$/, "");
    setLiveStatus("checking");
    setLiveErrorMsg("");
    setAvailableModels([]);
    setSystemInfo(null);

    // Step 1: Check bridge is reachable
    const health = await checkBridge(base);
    if (!health.reachable) {
      setLiveStatus("error");
      setLiveErrorMsg(
        "The NEXIS Local Companion is not running. Start nexis-bridge.exe, then click Reconnect."
      );
      return;
    }

    // Step 2: Fetch model list
    const modelsResult = await fetchBridgeModels(base);
    if (modelsResult.error) {
      setLiveStatus("error");
      setLiveErrorMsg(modelsResult.error);
      return;
    }

    const models = modelsResult.models;
    setAvailableModels(models);

    // Step 3: Restore or pick model selection
    let chosenModel = currentModel;
    if (chosenModel && !models.includes(chosenModel)) {
      // Saved model was removed from Ollama
      chosenModel = models[0] || "";
    }
    if (!chosenModel && models.length > 0) {
      chosenModel = models[0];
    }
    setSelectedModel(chosenModel);

    // Step 4: Fetch system info (best-effort, non-blocking)
    getBridgeSystem(base).then((sys) => {
      if (sys) setSystemInfo(sys);
    });

    setLiveStatus("ok");
  };

  // ── Reconnect button (manual re-detect) ──────────────────────────────────
  const handleReconnect = async () => {
    await runDetection(localEndpoint, selectedModel);
  };

  // ── Save local config ─────────────────────────────────────────────────────
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

  // ── Save provider config ──────────────────────────────────────────────────
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

  // ── Clear config ──────────────────────────────────────────────────────────
  const handleClear = () => {
    localStorage.removeItem("nexis_model_config");
    onConfigChange(null);
    setModalOpen(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Persistent status row in workspace ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "0.82rem", color: workspaceDotColor(config, liveStatus) }}>
          ⬤
        </span>
        <span style={{ fontSize: "0.82rem", color: workspaceDotColor(config, liveStatus) }}>
          {workspaceStatusLabel(config, liveStatus)}
        </span>
        <button
          className="btn"
          style={{ padding: "3px 12px", fontSize: "0.8rem", marginLeft: 4 }}
          onClick={handleOpen}
        >
          {config ? "Edit Model" : "Configure Model"}
        </button>
      </div>

      {/* ── Config modal ── */}
      {modalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10001,
          }}
        >
          <div
            className="panel"
            style={{ width: 440, margin: 0, maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Model Settings</h3>
              <button className="btn" style={{ padding: "3px 10px" }} onClick={() => setModalOpen(false)}>
                &times;
              </button>
            </div>

            {/* Tabs — Local is first and default */}
            <div className="row" style={{ marginBottom: 20 }}>
              <button
                className={`btn${tab === "local" ? " active" : ""}`}
                onClick={() => setTab("local")}
              >
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

            {/* ── LOCAL AI TAB ── */}
            {tab === "local" && (
              <div>
                {/* Detection status area */}
                <div style={{ marginBottom: 14 }}>
                  {liveStatus === "checking" && (
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)", margin: 0 }}>
                      Connecting to NEXIS Local Companion…
                    </p>
                  )}
                  {liveStatus === "error" && (
                    <p style={{ fontSize: "0.82rem", color: "var(--arc-error, #f87171)", margin: 0 }}>
                      {liveErrorMsg}
                    </p>
                  )}
                  {liveStatus === "ok" && availableModels.length > 0 && (
                    <p style={{ fontSize: "0.82rem", color: "var(--arc-accent)", margin: 0 }}>
                      Connected — {availableModels.length} model{availableModels.length !== 1 ? "s" : ""} available.
                    </p>
                  )}
                  {liveStatus === null && (
                    <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.38)", margin: 0 }}>
                      Checking…
                    </p>
                  )}
                </div>

                {/* Reconnect button */}
                <button
                  className="btn"
                  style={{ padding: "5px 14px", fontSize: "0.85rem", marginBottom: 14 }}
                  onClick={handleReconnect}
                  disabled={liveStatus === "checking"}
                >
                  {liveStatus === "checking" ? "Connecting…" : "Reconnect"}
                </button>

                {/* Model list — shown once detection succeeds */}
                {liveStatus === "ok" && availableModels.length > 0 && (
                  <div style={{ marginTop: 4, marginBottom: 16 }}>
                    <div className="subtle" style={{ fontSize: "0.78rem", marginBottom: 8 }}>
                      Available Models
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {availableModels.map((m) => (
                        <button
                          key={m}
                          className={`btn${selectedModel === m ? " active" : ""}`}
                          style={{
                            textAlign: "left",
                            padding: "6px 12px",
                            fontSize: "0.85rem",
                            justifyContent: "flex-start",
                          }}
                          onClick={() => setSelectedModel(m)}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* System info badge */}
                {liveStatus === "ok" && systemInfo && (
                  <ProcessorBadge system={systemInfo} />
                )}

                {/* Advanced — endpoint field hidden by default */}
                <div style={{ marginTop: 18 }}>
                  <button
                    style={{
                      all: "unset",
                      cursor: "pointer",
                      fontSize: "0.78rem",
                      color: "rgba(255,255,255,0.35)",
                      textDecoration: "underline",
                      textUnderlineOffset: 3,
                    }}
                    onClick={() => setShowAdvanced((v) => !v)}
                  >
                    {showAdvanced ? "▾ Hide Advanced" : "▸ Advanced"}
                  </button>

                  {showAdvanced && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", display: "block", marginBottom: 5 }}>
                        Local Companion URL
                      </label>
                      <input
                        value={localEndpoint}
                        onChange={(e) => {
                          setLocalEndpoint(e.target.value);
                          setLiveStatus(null);
                          setAvailableModels([]);
                          setSelectedModel("");
                        }}
                        placeholder={BRIDGE_DEFAULT_URL}
                        style={{ marginBottom: 6, fontSize: "0.82rem" }}
                      />
                      <p className="subtle" style={{ fontSize: "0.75rem", margin: 0 }}>
                        Default: {BRIDGE_DEFAULT_URL}. Change only if you run the companion on a custom port.
                      </p>
                    </div>
                  )}
                </div>

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
                    disabled={!selectedModel || liveStatus !== "ok"}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* ── PROVIDER KEY TAB ── */}
            {tab === "provider" && (
              <div>
                <p className="subtle" style={{ fontSize: "0.82rem", marginBottom: 14 }}>
                  Use a provider API key (e.g. OpenAI, Anthropic) via the hosted backend.
                  Local AI mode is recommended for privacy and offline use.
                </p>

                <label style={{ fontSize: "0.82rem", display: "block", marginBottom: 6 }}>
                  Provider Name
                </label>
                <input
                  value={providerName}
                  onChange={(e) => setProviderName(e.target.value)}
                  placeholder="e.g. OpenAI, Anthropic"
                  style={{ marginBottom: 10 }}
                />

                <label style={{ fontSize: "0.82rem", display: "block", marginBottom: 6 }}>
                  API Key
                </label>
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
                    onClick={handleSaveProvider}
                    disabled={!providerName.trim() || !providerKey.trim()}
                  >
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
