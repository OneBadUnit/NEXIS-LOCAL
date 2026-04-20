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
    const res = await axios.get("http://127.0.0.1:8000/system/check");

    // ⭐ ADD THIS LINE EXACTLY HERE ⭐
    console.log("SYSTEM CHECK RAW RESPONSE:", res.data);

    setStatus({
  configOk: res.data.config?.isReady,
  modelsOk: res.data.models?.available,   // <-- FIXED
  ollamaInstalled: res.data.ollama?.installed,
  ollamaRunning: res.data.ollama?.running,
});



  } catch (err) {
    console.error("System check failed:", err);
    setStatus({ error: true });
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    runSystemCheck();
  }, []);

  const fixConfig = async () => {
    await axios.post("http://127.0.0.1:8000/system/fix/config");
    runSystemCheck();
  };

  const fixModels = async () => {
    await axios.post("http://127.0.0.1:8000/system/fix/models");
    runSystemCheck();
  };

  const handleEnterNexus = () => {
    setActivePage("NEXUS");
  };

  if (loading) {
    return <div className="system-check-loading">Running system diagnostics…</div>;
  }

  if (!status || status.error) {
    return (
      <div className="system-check-panel">
        <h2>System Diagnostics</h2>
        <div className="check-item fail">Error running system check.</div>
      </div>
    );
  }

  const allGreen = status.configOk && status.modelsOk && status.ollamaInstalled && status.ollamaRunning;

  return (
  <>
    
    <div className="system-check-panel">
      <h2>System Diagnostics</h2>

      <div className={`check-item ${status.ollamaInstalled ? "ok" : "fail"}`}>
        Ollama Installed: {status.ollamaInstalled ? "Yes" : "No"}
      </div>

      <div className={`check-item ${status.ollamaRunning ? "ok" : "fail"}`}>
        Ollama Running: {status.ollamaRunning ? "Yes" : "No"}
      </div>

      <div className={`check-item ${status.configOk ? "ok" : "fail"}`}>
        Config File: {status.configOk ? "OK" : "Missing"}
        {!status.configOk && (
          <button className="fix-button" onClick={fixConfig}>Fix</button>
        )}
      </div>

      <div className={`check-item ${status.modelsOk ? "ok" : "fail"}`}>
        Models: {status.modelsOk ? "OK" : "Missing"}
        {!status.modelsOk && (
          <button className="fix-button" onClick={fixModels}>Fix</button>
        )}
      </div>

      {allGreen && (
        <button className="enter-nexus-button" onClick={handleEnterNexus}>
          ENTER NEXUS
        </button>
      )}
    </div>
    </>
  );
};

export default LandingScreen;
