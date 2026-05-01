// ============================================================
// ARC-NEXUS - LANDING SCREEN
// File: src/pages/LandingScreen.jsx
// Version: 002 (Syntax Fix + API Alignment)
// ============================================================

import React, { useEffect, useState, useContext, useCallback } from "react";
import { ArcNContext } from "../context/ArcNContext";
import { systemCheck } from "../api/api";

const LandingScreen = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setActivePage } = useContext(ArcNContext);

  const runSystemCheck = useCallback(async () => {
    setLoading(true);

    try {
      const data = await systemCheck();

      setStatus({
        configOk: data.config?.isReady ?? false,
        modelsOk: data.models?.ready ?? false,
        ollamaInstalled: data.ollama?.installed ?? false,
        ollamaRunning: data.ollama?.running ?? false,
        error: null,
      });
    } catch {
      setStatus({ error: true });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    runSystemCheck();
  }, [runSystemCheck]);

  const fixConfig = async () => {
    await fetch("http://127.0.0.1:8000/api/system/fix/config", {
      method: "POST",
    });
    runSystemCheck();
  };

  const fixModels = async () => {
    await fetch("http://127.0.0.1:8000/api/system/fix/models", {
      method: "POST",
    });
    runSystemCheck();
  };

  const handleEnterNexus = () => {
    setActivePage("nexus");
  };

  if (loading) {
    return (
      <div
        style={{
          textAlign: "center",
          paddingTop: "120px",
          color: "var(--arc-text)",
        }}
      >
        Running system diagnostics…
      </div>
    );
  }

  if (!status || status.error) {
    return (
      <div className="module-container">
        <div className="panel">
          <h2>System Diagnostics</h2>
          <p style={{ color: "red" }}>Error running system check.</p>
        </div>
      </div>
    );
  }

  const allGreen =
    status.configOk &&
    status.modelsOk &&
    status.ollamaInstalled &&
    status.ollamaRunning;

  return (
    <div className="module-container">
      <div className="panel" style={{ textAlign: "center" }}>
        <h2>System Diagnostics</h2>

        <div style={{ marginTop: "20px", textAlign: "left" }}>
          <StatusItem label="Ollama Installed" ok={status.ollamaInstalled} />
          <StatusItem label="Ollama Running" ok={status.ollamaRunning} />

          <StatusItem label="Config File" ok={status.configOk}>
            {!status.configOk && (
              <button className="btn" onClick={fixConfig}>
                Fix
              </button>
            )}
          </StatusItem>

          <StatusItem label="Models" ok={status.modelsOk}>
            {!status.modelsOk && (
              <button className="btn" onClick={fixModels}>
                Fix
              </button>
            )}
          </StatusItem>
        </div>

        {allGreen && (
          <button
            className="btn"
            style={{ marginTop: "20px" }}
            onClick={handleEnterNexus}
          >
            ENTER NEXUS
          </button>
        )}
      </div>
    </div>
  );
};

function StatusItem({ label, ok, children }) {
  return (
    <div
      style={{
        marginBottom: "12px",
        padding: "10px",
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

export default LandingScreen;