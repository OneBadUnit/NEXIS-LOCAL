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

  const handleNewProject = () => {
    setActivePage("PROJECTS");
  };

  const handleOpenTranscription = () => {
    setActivePage("TRANSCRIPTION");
  };

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await axios.get("http://127.0.0.1:8000/system/check");
        setSystemStatus(res.data);
      } catch (err) {
        setError("Unable to fetch system status");
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
  }, []);

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

          {/* CARD 1 — RECENT PROJECTS HEADER */}
          <div className="nexus-card">
            <div className="nexus-section-header">
              <h2>Recent Projects</h2>
              <button onClick={handleNewProject}>New Project</button>
            </div>
          </div>

          {/* CARD 2 — DEMO PROJECT */}
          <div className="nexus-card">
            <div className="nexus-card-title">Demo Project</div>
            <div className="nexus-card-meta">
              Status: Idle • Updated just now
            </div>
          </div>

          {/* CARD 3 — RECENT ACTIVITY (NOW INSIDE GRID) */}
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
        <p>Ollama Installed: {systemStatus.ollama?.installed ? "Yes" : "No"}</p>
        <p>Ollama Running: {systemStatus.ollama?.running ? "Yes" : "No"}</p>
        <p>Config Ready: {systemStatus.config?.isReady ? "Yes" : "No"}</p>
        <p>Models Ready: {systemStatus.models?.available ? "Yes" : "No"}</p>
      </div>
    )}
  </div>

  <div className="nexus-card">
    <h2>Active Model</h2>
    <p>llama3.2 (primary)</p>
    <button>Change Model</button>
  </div>

  <div className="nexus-card">
    <h2>Quick Modules</h2>
    <button onClick={handleOpenTranscription}>Transcription</button>
    <button onClick={() => setActivePage("EXTRACTION")}>Extraction</button>
    <button onClick={() => setActivePage("SYNTHESIS")}>Synthesis</button>
  </div>

  {/* NEW: TRANSCRIPT OUTPUT BOX */}
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
