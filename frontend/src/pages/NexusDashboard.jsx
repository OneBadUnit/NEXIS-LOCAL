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

  // Wrapped in useCallback to satisfy ESLint and prevent infinite loops
  const fetchStatus = useCallback(
    async (retry = 0) => {
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
    },
    [] // no external dependencies needed
  );

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
      <h1 className="module-title">THE NEXUS</h1>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {/* LEFT COLUMN */}
        <div>
          {/* Recent Projects */}
          <div className="panel">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3>Recent Projects</h3>
              <button className="btn" onClick={() => setActivePage("PROJECTS")}>
                New Project
              </button>
            </div>
          </div>

          {/* Demo Project */}
          <div className="panel">
            <h3>Demo Project</h3>
            <p style={{ opacity: 0.7 }}>Status: Idle • Updated just now</p>
          </div>

          {/* Recent Activity */}
          <div className="panel">
            <h3>Recent Activity</h3>
            <p>No recent activity yet.</p>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* System Status */}
          <div className="panel">
            <h3>System Status</h3>

            {loading && <p>Checking system...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {systemStatus && (
              <div style={{ marginTop: "10px" }}>
                <StatusRow
                  label="Ollama Installed"
                  ok={systemStatus.ollama?.installed}
                />

                <StatusRow
                  label="Ollama Running"
                  ok={systemStatus.ollama?.running}
                />

                <StatusRow label="Config Ready" ok={systemStatus.config?.isReady}>
                  {!systemStatus.config?.isReady && (
                    <button
                      className="btn"
                      onClick={handleFixConfig}
                      disabled={fixingConfig}
                    >
                      {fixingConfig ? "Fixing..." : "Fix Config"}
                    </button>
                  )}
                </StatusRow>

                <StatusRow
                  label="Models Ready"
                  ok={systemStatus.models?.available}
                >
                  {!systemStatus.models?.available && (
                    <button
                      className="btn"
                      onClick={handleFixModels}
                      disabled={fixingModels}
                    >
                      {fixingModels ? "Fixing..." : "Fix Models"}
                    </button>
                  )}
                </StatusRow>

                {fixMessage && (
                  <p style={{ marginTop: "10px", color: "var(--arc-green)" }}>
                    {fixMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Active Model */}
          <div className="panel">
            <h3>Active Model</h3>
            <p>llama3.2 (primary)</p>
            <button className="btn">Change Model</button>
          </div>

          {/* Quick Modules */}
          <div className="panel">
            <h3>Quick Modules</h3>

            <button className="btn" onClick={() => setActivePage("TRANSCRIPTION")}>
              Documents
            </button>

            <button className="btn" onClick={() => setActivePage("EXTRACTION")}>
              Extraction
            </button>

            <button className="btn" onClick={() => setActivePage("SYNTHESIS")}>
              Synthesis
            </button>
          </div>

          {/* Transcript Output */}
          <div className="panel">
            <h3>Transcript Output</h3>
            <TranscriptOutput transcript={systemStatus?.transcript} />
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

export default memo(NexusDashboard);
