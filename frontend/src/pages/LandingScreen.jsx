// src/pages/LandingScreen.jsx
import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { ArcNContext } from "../context/ArcNContext";

const LandingScreen = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const { setActivePage } = useContext(ArcNContext);

  const runSystemCheck = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/api/system/check");

      console.log("SYSTEM CHECK RAW RESPONSE:", res.data);

      setStatus({
  configOk: res.data.config?.isReady,

  modelsOk:
    res.data.models?.available ??
    res.data.models?.isReady ??
    false,

  ollamaInstalled:
    res.data.ollama?.installed ??
    res.data.ollamaInstalled ??
    false,

  ollamaRunning:
    res.data.ollama?.running ??
    res.data.ollamaRunning ??
    false,
});


  useEffect(() => {
    runSystemCheck();
  }, []);

  const fixConfig = async () => {
    await axios.post("http://127.0.0.1:8000/api/system/fix/config");
    runSystemCheck();
  };

  const fixModels = async () => {
    await axios.post("http://127.0.0.1:8000/api/system/fix/models");
    runSystemCheck();
  };

  const handleEnterNexus = () => {
    setActivePage("NEXUS");
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

        {/* STATUS ITEMS */}
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

        {/* ENTER NEXUS */}
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
