// ============================================================
// ARC-NEXUS - NEXUS DASHBOARD
// File: src/pages/NexusDashboard.jsx
// Version: 003 (ESLint Cleanup)
// ============================================================

import React, { useEffect, useState, memo, useCallback } from "react";
import { systemCheck } from "../api/api";

const NexusDashboard = () => {
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fixingConfig, setFixingConfig] = useState(false);
  const [fixingModels, setFixingModels] = useState(false);
  const [fixMessage, setFixMessage] = useState("");

  const fetchStatus = useCallback(async (retry = 0) => {
    try {
      const data = await systemCheck();
      setSystemStatus(data);
      setError(null);
    } catch (err) {
      console.error("System status fetch failed:", err);

      if (retry < 3) {
        setTimeout(() => fetchStatus(retry + 1), 1000);
        return;
      }

      setError("Unable to fetch system status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleFixConfig = async () => {
    setFixingConfig(true);
    setFixMessage("");

    try {
      await fetch("http://127.0.0.1:8000/api/system/fix/config", {
        method: "POST",
      });
      setFixMessage("Config file created successfully.");
      await fetchStatus();
    } catch {
      setFixMessage("Failed to fix config.");
    } finally {
      setFixingConfig(false);
    }
  };

  const handleFixModels = async () => {
    setFixingModels(true);
    setFixMessage("");

    try {
      await fetch("http://127.0.0.1:8000/api/system/fix/models", {
        method: "POST",
      });
      setFixMessage("Models pulled successfully.");
      await fetchStatus();
    } catch {
      setFixMessage("Failed to pull models.");
    } finally {
      setFixingModels(false);
    }
  };

  return (
    <div className="module-container">
      <h1 className="module-title" style={{ marginBottom: "30px" }}>
        THE NEXUS
      </h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="panel">
            <h3>Quick Start</h3>

            <p className="subtle">
              Welcome to your command center. Use Collect → Understand → Create.
            </p>

            <p className="subtle">
              When System Status is green, everything is ready.
            </p>
          </div>

          <div className="panel">
            <h3>Demo Project</h3>
            <p className="subtle">Status: Idle</p>
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="panel">
            <h3>System Status</h3>

            {loading && <p>Checking system...</p>}
            {error && <p className="error">{error}</p>}

            {systemStatus && (
              <div
                style={{
                  marginTop: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <StatusRow label="Ollama Installed" ok={systemStatus.ollama?.installed} />
                <StatusRow label="Ollama Running" ok={systemStatus.ollama?.running} />

                <StatusRow label="Config Ready" ok={systemStatus.config?.isReady}>
                  {!systemStatus.config?.isReady && (
                    <button className="btn" onClick={handleFixConfig} disabled={fixingConfig}>
                      {fixingConfig ? "Fixing..." : "Fix Config"}
                    </button>
                  )}
                </StatusRow>

                <StatusRow label="Models Ready" ok={systemStatus.models?.available}>
                  {!systemStatus.models?.available && (
                    <button className="btn" onClick={handleFixModels} disabled={fixingModels}>
                      {fixingModels ? "Fixing..." : "Fix Models"}
                    </button>
                  )}
                </StatusRow>

                {fixMessage && <p className="success">{fixMessage}</p>}
              </div>
            )}
          </div>

          <div className="panel">
            <h3>Active Model</h3>
            <p>Local Ollama Model</p>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatusRow({ label, ok, children }) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "6px",
        background: "rgba(255,255,255,0.05)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: ok
          ? "1px solid var(--arc-green)"
          : "1px solid rgba(255,0,0,0.4)",
      }}
    >
      <span>
        {label}:{" "}
        <strong style={{ color: ok ? "var(--arc-green)" : "red" }}>
          {ok ? "OK" : "Missing"}
        </strong>
      </span>

      {children}
    </div>
  );
}

export default memo(NexusDashboard);