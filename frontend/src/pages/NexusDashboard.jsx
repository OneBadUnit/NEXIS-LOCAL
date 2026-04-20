import React, { useContext, useEffect, useState, memo } from "react";
import { ArcNContext } from "../context/ArcNContext";
import axios from "axios";
import "./nexus.css";
import TranscriptOutput from "../components/TranscriptOutput";

const NexusDashboard = () => {
  const { setActivePage } = useContext(ArcNContext);

  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fixingConfig, setFixingConfig] = useState(false);
  const [fixingModels, setFixingModels] = useState(false);
  const [fixMessage, setFixMessage] = useState("");

  const handleNewProject = () => {
    setActivePage("PROJECTS");
  };

  const handleOpenTranscription = () => {
    setActivePage("TRANSCRIPTION");
  };

  const fetchStatus = async (retry = 0) => {
  try {
    const res = await axios.get("http://127.0.0.1:8000/system/check");
    setSystemStatus(res.data);
    setError(null);
  } catch (err) {
    console.error("System status fetch failed:", err);

    if (retry < 3) {
      console.log(`Retrying system check... (${retry + 1})`);
      setTimeout(() => fetchStatus(retry + 1), 1000);
      return;
    }

    setError("Unable to fetch system status");
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleFixConfig = async () => {
    setFixingConfig(true);
    setFixMessage("");

    try {
      await axios.post("http://127.0.0.1:8000/system/fix/config");
      setFixMessage("Config file created successfully.");
      await fetchStatus();
    } catch (err) {
      setFixMessage("Failed to fix config.");
    } finally {
      setFixingConfig(false);
    }
  };

  const handleFixModels = async () => {
    setFixingModels(true);
    setFixMessage("");

    try {
      await axios.post("http://127.0.0.1:8000/system/fix/models");
      setFixMessage("Models pulled successfully.");
      await fetchStatus();
    } catch (err) {
      setFixMessage("Failed to pull models.");
    } finally {
      setFixingModels(false);
    }
  };

  return (
    <div className="nexus-dashboard">

      {/* HEADER */}
      <header className="nexus-header">
        <div className="nexus-emblem"></div>
        <h1>NEXUS</h1>
        <p className="nexus-subtitle">Cognitive Operations Hub</p>
      </header>

      {/* MAIN GRID */}
      <div className="nexus-main-grid">

        {/* LEFT COLUMN */}
        <section className="nexus-column nexus-projects">

          <div className="nexus-card">
            <div className="nexus-section-header">
              <h2>Recent Projects</h2>
              <button className="nexus-big-button" onClick={handleNewProject}>
                New Project
              </button>
            </div>
          </div>

          <div className="nexus-card">
            <div className="nexus-card-title">Demo Project</div>
            <div className="nexus-card-meta">
              Status: Idle • Updated just now
            </div>
          </div>

          <div className="nexus-card">
            <h2>Recent Activity</h2>
            <p>No recent activity yet.</p>
          </div>

        </section>

        {/* RIGHT COLUMN */}
        <section className="nexus-column nexus-system">

          <div className="nexus-card">
            <h2>System Status</h2>

            {loading && <p>Checking system...</p>}
            {error && <p style={{ color: "red" }}>{error}</p>}

            {systemStatus && (
              <div className="system-status-details">

                <p>
                  Ollama Installed: {systemStatus.ollama?.installed ? "Yes" : "No"}
                </p>

                <p>
                  Ollama Running: {systemStatus.ollama?.running ? "Yes" : "No"}
                </p>

                <p>
                  Config Ready: {systemStatus.config?.isReady ? "Yes" : "No"}
                  {!systemStatus.config?.isReady && (
                    <button
                      className="nexus-small-button"
                      onClick={handleFixConfig}
                      disabled={fixingConfig}
                    >
                      {fixingConfig ? "Fixing..." : "Fix Config"}
                    </button>
                  )}
                </p>

                <p>
                  Models Ready: {systemStatus.models?.available ? "Yes" : "No"}
                  {!systemStatus.models?.available && (
                    <button
                      className="nexus-small-button"
                      onClick={handleFixModels}
                      disabled={fixingModels}
                    >
                      {fixingModels ? "Fixing..." : "Fix Models"}
                    </button>
                  )}
                </p>

                {fixMessage && (
                  <p style={{ marginTop: "10px", color: "#4caf50" }}>
                    {fixMessage}
                  </p>
                )}

              </div>
            )}
          </div>

          <div className="nexus-card">
            <h2>Active Model</h2>
            <p>llama3.2 (primary)</p>
            <button className="nexus-small-button">Change Model</button>
          </div>

          <div className="nexus-card">
            <h2>Quick Modules</h2>

            <button
              className="nexus-big-button"
              onClick={handleOpenTranscription}
            >
              Documents
            </button>

            <button
              className="nexus-big-button"
              onClick={() => setActivePage("EXTRACTION")}
            >
              Extraction
            </button>

            <button
              className="nexus-big-button"
              onClick={() => setActivePage("SYNTHESIS")}
            >
              Synthesis
            </button>
          </div>

          <div className="nexus-card nexus-transcript-card">
            <h2>Transcript Output</h2>
            <TranscriptOutput transcript={systemStatus?.transcript} />
          </div>

        </section>

      </div>

    </div>
  );
};

export default memo(NexusDashboard);
