// ============================================================
// ARC-NEXUS - MODEL CONFIG
// File: src/components/ModelConfig/ModelConfig.jsx
//
// Manages local model or provider key configuration.
// Stores config in localStorage under "nexis_model_config".
//
// Detect Model flow (local):
//   1. Connect to /api/tags  — confirms Ollama is running, fetches model list
//   2. Send tiny prompt      — loads the selected model so /api/ps reflects it
//   3. Read /api/ps          — determines processor (GPU / CPU / mixed)
//
// Props:
//   config         — current model config object or null (from parent state)
//   onConfigChange — called with new config object or null on save/clear
// ============================================================

import React, { useState } from "react";

// ----------------------------------------------------------
// Fetch available model names from /api/tags
// Returns string[] of model names, or [] on error
// ----------------------------------------------------------
async function fetchLocalModels(endpoint) {
  const base = endpoint.replace(/\/$/, "");
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(`${base}/api/tags`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const data = await res.json();
    return (Array.isArray(data.models) ? data.models : []).map(
      (m) => m.name || m.model || String(m)
    );
  } catch {
    return [];
  }
}

// ----------------------------------------------------------
// Send a minimal prompt to ensure the model is loaded
// so that /api/ps reflects its processor assignment
// ----------------------------------------------------------
async function warmModel(endpoint, model) {
  const base = endpoint.replace(/\/$/, "");
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    await fetch(`${base}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: "OK", stream: false }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch {
    // warm failure is non-fatal — we still check /api/ps
  }
}

// ----------------------------------------------------------
// Processor detection via Ollama /api/ps
// Matches the specific selected model by name.
// Ollama reports processor via size_vram vs size:
//   size_vram === size  → fully on GPU
//   size_vram === 0     → fully on CPU
//   0 < size_vram < size → split (mixed)
// Returns: { status: "gpu"|"cpu"|"mixed"|"unknown", label: string }
// ----------------------------------------------------------
async function detectProcessorStatus(endpoint, modelName) {
  const base = endpoint.replace(/\/$/, "");
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${base}/api/ps`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return { status: "unknown", label: "Processor not confirmed" };

    const data = await res.json();
    const models = Array.isArray(data.models) ? data.models : [];

    if (models.length === 0) {
      return { status: "unknown", label: "Processor not confirmed" };
    }

    // Find the entry for the selected model; fall back to first entry
    let entry = models[0];
    if (modelName) {
      const target = modelName.toLowerCase();
      const match = models.find((m) => {
        const name = (m.name || m.model || "").toLowerCase();
        return name === target || name.startsWith(target.split(":")[0]);
      });
      if (match) entry = match;
    }

    // Ollama uses size_vram vs size to indicate GPU usage
    const size = entry.size ?? 0;
    const sizeVram = entry.size_vram ?? 0;

    if (size > 0 && sizeVram >= size) {
      return { status: "gpu", label: "GPU" };
    }
    if (sizeVram === 0) {
      return { status: "cpu", label: "CPU" };
    }
    if (sizeVram > 0 && sizeVram < size) {
      return { status: "mixed", label: "CPU/GPU mixed" };
    }
    return { status: "unknown", label: "Processor not confirmed" };
  } catch (err) {
    return { status: "unknown", label: `Processor not confirmed` };
  }
}

// ----------------------------------------------------------
// Processor warning shown after detection
// ----------------------------------------------------------
function ProcessorWarning({ result }) {
  const status = result?.status ?? "unknown";
  const backend = result?.backendInfo?.acceleration_backend;
  const gpuName = result?.backendInfo?.gpu_name;

  if (status === "gpu") {
    return (
      <div style={{ margin: "8px 0 0" }}>
        <p style={{ fontSize: "0.78rem", color: "var(--arc-accent)", margin: 0 }}>
          GPU acceleration detected.
        </p>
        {gpuName && (
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", margin: "3px 0 0" }}>
            GPU: {gpuName}
          </p>
        )}
        {backend && (
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", margin: "3px 0 0" }}>
            Acceleration backend: {backend}
          </p>
        )}
        {!backend && (
          <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", margin: "3px 0 0" }}>
            Acceleration backend: Unknown GPU
          </p>
        )}
      </div>
    );
  }
  if (status === "cpu") {
    return (
      <div style={{ margin: "8px 0 0" }}>
        <p style={{ fontSize: "0.78rem", color: "#f59e0b", margin: 0 }}>
          Running on CPU.
        </p>
        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: "3px 0 0" }}>
          CPU mode: supported, may be slower
        </p>
      </div>
    );
  }
  if (status === "mixed") {
    return (
      <p style={{ fontSize: "0.78rem", color: "#f59e0b", margin: "8px 0 0" }}>
        This model is split between CPU and GPU. Performance may vary.
      </p>
    );
  }
  // unknown or null
  return (
    <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)", margin: "8px 0 0" }}>
      Acceleration unknown — local model use may still work.
    </p>
  );
}

// ----------------------------------------------------------
// Persistent status label shown in the workspace panel
// ----------------------------------------------------------
function statusLabel(config) {
  if (!config) return "No model configured";
  if (config.type === "local") {
    if (!config.model) return "Local model detected — no model selected";
    const proc = config.processorLabel ? ` — ${config.processorLabel}` : "";
    return `Local model detected — ${config.model}${proc}`;
  }
  if (config.type === "provider") {
    return `Provider model configured (${config.providerName || "unknown"})`;
  }
  return "No model configured";
}

function statusDotColor(config) {
  if (!config) return "rgba(239,68,68,0.7)";
  if (config.type === "local" && !config.model) return "#f59e0b";
  return "var(--arc-accent)";
}

// ----------------------------------------------------------
// Main component
// ----------------------------------------------------------
export default function ModelConfig({ config, onConfigChange }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState("local");

  // Local model state
  const [localEndpoint, setLocalEndpoint] = useState("http://localhost:11434");
  const [detectStatus, setDetectStatus] = useState(null); // null | "detecting" | "ok" | "fail"
  const [detectDetail, setDetectDetail] = useState("");
  const [processorResult, setProcessorResult] = useState(null);
  const [testStatus, setTestStatus] = useState(null); // null | "testing" | "done"
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");

  // Provider state
  const [providerName, setProviderName] = useState("");
  const [providerKey, setProviderKey] = useState("");

  // ---- Open modal, pre-populate from saved config ----
  const handleOpen = async () => {
    if (config?.type === "local") {
      setTab("local");
      const ep = config.endpoint || "http://localhost:11434";
      setLocalEndpoint(ep);
      setSelectedModel(config.model || "");
      setDetectStatus(null);
      setDetectDetail("");
      setProcessorResult(
        config.processorStatus
          ? { status: config.processorStatus, label: config.processorLabel || "" }
          : null
      );
      setTestStatus(config.processorStatus ? "done" : null);
      setAvailableModels([]);
      setModalOpen(true);
      // Silently pre-load model list so current selection is visible immediately
      const models = await fetchLocalModels(ep);
      if (models.length > 0) {
        setAvailableModels(models);
        setDetectStatus("ok");
        setDetectDetail("Models loaded.");
      }
    } else if (config?.type === "provider") {
      setTab("provider");
      setProviderName(config.providerName || "");
      setProviderKey(config.providerKey || "");
      setModalOpen(true);
    } else {
      setTab("local");
      setLocalEndpoint("http://localhost:11434");
      setSelectedModel("");
      setDetectStatus(null);
      setDetectDetail("");
      setProcessorResult(null);
      setTestStatus(null);
      setAvailableModels([]);
      setModalOpen(true);
    }
  };

  // ---- Detect Models: connect + fetch model list only ----
  const handleDetect = async () => {
    setDetectStatus("detecting");
    setDetectDetail("Connecting...");
    setProcessorResult(null);
    setTestStatus(null);
    setAvailableModels([]);

    const models = await fetchLocalModels(localEndpoint);
    if (models.length === 0) {
      setDetectStatus("fail");
      setDetectDetail("Could not connect or no models found.");
      return;
    }

    setAvailableModels(models);
    setDetectStatus("ok");
    setDetectDetail("Models found. Select a model, then test CPU/GPU.");

    // Keep previous selection if still valid, else pick first
    const current =
      selectedModel && models.includes(selectedModel) ? selectedModel : models[0];
    setSelectedModel(current);
  };

  // ---- Test CPU/GPU: warm selected model, then read /api/ps + system GPU ----
  const handleTestProcessor = async () => {
    if (!selectedModel) return;
    setTestStatus("testing");
    setProcessorResult(null);

    await warmModel(localEndpoint, selectedModel);
    const proc = await detectProcessorStatus(localEndpoint, selectedModel);

    // Enrich with vendor/backend info from the system GPU endpoint
    let backendInfo = null;
    try {
      const API_BASE =
        process.env.REACT_APP_API_BASE_URL || "http://127.0.0.1:8000";
      const gpuRes = await fetch(`${API_BASE}/api/system/gpu`);
      if (gpuRes.ok) {
        const gpuData = await gpuRes.json();
        backendInfo = gpuData.detail || null;
      }
    } catch (_) {}

    setProcessorResult({ ...proc, backendInfo });
    setTestStatus("done");
  };

  // ---- Save local config ----
  const handleSaveLocal = () => {
    const backendStr = processorResult?.backendInfo?.acceleration_backend;
    const procLabel =
      processorResult?.status === "gpu" && backendStr
        ? `GPU — ${backendStr}`
        : processorResult?.label || null;
    const newConfig = {
      type: "local",
      endpoint: localEndpoint,
      model: selectedModel,
      processorStatus: processorResult?.status || null,
      processorLabel: procLabel,
    };
    localStorage.setItem("nexis_model_config", JSON.stringify(newConfig));
    onConfigChange(newConfig);
    setModalOpen(false);
  };

  // ---- Save provider config ----
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

  // ---- Clear config ----
  const handleClear = () => {
    localStorage.removeItem("nexis_model_config");
    onConfigChange(null);
    setModalOpen(false);
  };

  return (
    <>
      {/* ---- Persistent status row ---- */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: "0.82rem", color: statusDotColor(config) }}>
          ⬤
        </span>
        <span style={{ fontSize: "0.82rem", color: statusDotColor(config) }}>
          {statusLabel(config)}
        </span>
        <button
          className="btn"
          style={{ padding: "3px 12px", fontSize: "0.8rem", marginLeft: 4 }}
          onClick={handleOpen}
        >
          {config ? "Edit Model" : "Configure Model"}
        </button>
      </div>

      {/* ---- Config modal ---- */}
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
            style={{ width: 420, margin: 0, maxHeight: "90vh", overflowY: "auto" }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <h3 style={{ margin: 0 }}>Configure Model</h3>
              <button
                className="btn"
                style={{ padding: "3px 10px" }}
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className="row" style={{ marginBottom: 20 }}>
              <button
                className={`btn${tab === "local" ? " active" : ""}`}
                onClick={() => setTab("local")}
              >
                Local Model
              </button>
              <button
                className={`btn${tab === "provider" ? " active" : ""}`}
                onClick={() => setTab("provider")}
              >
                Provider Key
              </button>
            </div>

            {/* ---- LOCAL MODEL ---- */}
            {tab === "local" && (
              <div>
                <label style={{ fontSize: "0.82rem", display: "block", marginBottom: 6 }}>
                  Local Endpoint
                </label>
                <input
                  value={localEndpoint}
                  onChange={(e) => {
                    setLocalEndpoint(e.target.value);
                    setDetectStatus(null);
                    setAvailableModels([]);
                    setSelectedModel("");
                    setProcessorResult(null);
                  }}
                  placeholder="http://localhost:11434"
                  style={{ marginBottom: 10 }}
                />

                {/* Detect Models button */}
                <button
                  className="btn"
                  style={{ padding: "5px 14px", fontSize: "0.85rem", marginBottom: 14 }}
                  onClick={handleDetect}
                  disabled={detectStatus === "detecting"}
                >
                  {detectStatus === "detecting" ? "Detecting..." : "Detect Models"}
                </button>

                {/* Detection status feedback */}
                {detectStatus === "detecting" && (
                  <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", margin: "0 0 8px" }}>
                    {detectDetail}
                  </p>
                )}
                {detectStatus === "fail" && (
                  <p style={{ fontSize: "0.8rem", color: "var(--arc-error)", margin: "0 0 8px" }}>
                    {detectDetail}
                  </p>
                )}
                {detectStatus === "ok" && (
                  <p style={{ fontSize: "0.8rem", color: "var(--arc-accent)", margin: "0 0 8px" }}>
                    {detectDetail}
                  </p>
                )}

                {/* Model list */}
                {availableModels.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div className="subtle" style={{ fontSize: "0.78rem", marginBottom: 8 }}>
                      Detected Models
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
                          onClick={() => {
                            setSelectedModel(m);
                            setProcessorResult(null);
                            setTestStatus(null);
                          }}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Test CPU/GPU button — shown once a model is selected */}
                {selectedModel && (
                  <div style={{ marginTop: 16 }}>
                    <button
                      className="btn"
                      style={{ padding: "5px 14px", fontSize: "0.85rem" }}
                      onClick={handleTestProcessor}
                      disabled={testStatus === "testing"}
                    >
                      {testStatus === "testing" ? "Testing processor…" : "Test CPU/GPU"}
                    </button>

                    {/* Show result after test completes */}
                    {testStatus === "done" && (
                      <ProcessorWarning result={processorResult} />
                    )}

                    {/* Prompt to test before any test has run */}
                    {!testStatus && (
                      <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", margin: "8px 0 0" }}>
                        Processor not confirmed — click to check.
                      </p>
                    )}
                  </div>
                )}

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
                    disabled={!selectedModel}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* ---- PROVIDER KEY ---- */}
            {tab === "provider" && (
              <div>
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
                  Key is stored in localStorage. Do not use on shared devices.
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
