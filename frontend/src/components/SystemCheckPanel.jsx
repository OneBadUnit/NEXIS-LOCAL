// src/components/SystemCheckPanel.jsx
import React, { useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";
import "./SystemCheckPanel.css";

const SystemCheckPanel = ({ hasRunCheck, result, loading, onFixConfig, onFixModels }) => {
  const { setActivePage } = useContext(ArcNContext);

  if (!hasRunCheck) {
    return (
      <div className="system-check-hint">
        Run the system check to verify your environment.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="system-check-panel">
        <div className="system-check-title">System Check</div>
        <div className="system-check-hint">Running checks...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="system-check-panel">
        <div className="system-check-title">System Check</div>
        <div className="system-check-error">No results available.</div>
      </div>
    );
  }

  const allGreen =
    result.ollama?.installed &&
    result.ollama?.running &&
    result.models?.available &&
    result.config?.isReady;

  return (
    <div className="system-check-panel">
      <div className="system-check-title">System Check</div>

      <div className="system-check-row">
        <strong>Ollama Installed:</strong>{" "}
        {result.ollama?.installed ? (
          <span className="status-badge ok">OK</span>
        ) : (
          <span className="status-badge fail">Missing</span>
        )}
      </div>

      <div className="system-check-row">
        <strong>Ollama Running:</strong>{" "}
        {result.ollama?.running ? (
          <span className="status-badge ok">OK</span>
        ) : (
          <span className="status-badge fail">Stopped</span>
        )}
      </div>

      <div className="system-check-row">
        <strong>Required Models:</strong>{" "}
        {result.models?.available ? (
          <span className="status-badge ok">OK</span>
        ) : (
          <>
            <span className="status-badge fail">Missing</span>
            {onFixModels && (
              <button className="fix-button" onClick={onFixModels}>
                Fix
              </button>
            )}
          </>
        )}
      </div>

      <div className="system-check-row">
        <strong>ARC‑N Config:</strong>{" "}
        {result.config?.isReady ? (
          <span className="status-badge ok">Ready</span>
        ) : (
          <>
            <span className="status-badge fail">Incomplete</span>
            {onFixConfig && (
              <button className="fix-button" onClick={onFixConfig}>
                Fix
              </button>
            )}
          </>
        )}
      </div>

      {allGreen && (
        <button
          className="enter-nexus-button"
          onClick={() => setActivePage("Nexus")}
        >
          ENTER NEXUS
        </button>
      )}

      <div className="system-check-footer">
        System check completed. Resolve any issues above to continue.
      </div>
    </div>
  );
};

export default SystemCheckPanel;
