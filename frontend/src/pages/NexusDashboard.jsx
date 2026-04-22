import React, { useContext, useEffect, useState, memo, useCallback } from "react";
import { ArcNContext } from "../context/ArcNContext";
import axios from "axios";
import TranscriptOutput from "../components/TranscriptOutput";

const NexusDashboard = () => {
  const { setActivePage } = useContext(ArcNContext);

  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fixingConfig, setFixingConfig] = useState(false);
  const [fixingModels, setFixingModels] = useState(false);
  const [fixMessage, setFixMessage] = useState("");

  const fetchStatus = useCallback(async (retry = 0) => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/system/check");
      setSystemStatus(res.data);
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
      await axios.post("http://127.0.0.1:8000/api/system/fix/config");
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
      await axios.post("http://127.0.0.1:8000/api/system/fix/models");
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

      {/* Title */}
      <h1 className="module-title" style={{ marginBottom: "30px" }}>
        THE NEXUS
      </h1>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
        }}
      >
        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="panel">
  <div className="panel-header">
    <h3>Quick Start</h3>
  </div>

  <p className="subtle" style={{ lineHeight: "1.5" }}>
    Welcome to the Nexus Dashboard. This is your central command center for ARC NEXUS.
    To return here at any time, click <strong>NEXUS</strong> in the top‑left navigation.
  </p>

  <p className="subtle" style={{ marginTop: "12px", lineHeight: "1.5" }}>
    On the right, you’ll see <strong>System Status</strong>. When all indicators are 
    <span style={{ color: "var(--arc-green)" }}> green</span>, the system is fully operational. 
    If any show <span style={{ color: "lightcoral" }}>Missing</span>, consult the 
    <a href="system-status-help.html" target="_blank" rel="noopener noreferrer" style={{ marginLeft: "4px" }}>System Status Help File</a>.
  </p>

  <p className="subtle" style={{ marginTop: "12px", lineHeight: "1.5" }}>
    Depending on your hardware and model choices, some files may take 
    <strong> up to, and occasionally over, 10 minutes</strong> to transcribe. 
    This is normal for longer audio, dense speech, or CPU‑only processing. 
    ARC NEXUS will continue working in the background until the task completes.
  </p>
</div>


          <div className="panel">
            <h3>Demo Project</h3>
            <p className="subtle">Status: Idle • Updated just now</p>
          </div>

          
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          <div className="panel">
            <h3>System Status</h3>

            {loading && <p>Checking system...</p>}
            {error && <p className="error">{error}</p>}

            {systemStatus && (
              <div style={{ marginTop: "12px", display: "flex", flexDirection: "column", gap: "12px" }}>
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
            <p>llama3.2 (primary)</p>
            <button className="btn">Change Model</button>
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
        border: ok ? "1px solid var(--arc-green)" : "1px solid rgba(255,0,0,0.4)",
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
