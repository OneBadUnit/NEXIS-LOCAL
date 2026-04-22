// ============================================================
// SYSTEM CHECK PANEL
// Displays the full ARC‑NEXUS environment diagnostic results.
// Shows Ollama status, model availability, config readiness,
// and provides Fix actions when issues are detected.
// Styling is handled in: /styles/SystemCheckPanel.css
// ============================================================

import React, { useContext } from "react";
import "../styles/SystemCheckPanel.css";

export default function SystemCheckPanel({
  hasRunCheck,
  result,
  loading,
  onFixConfig,
  onFixModels
}) {

  // ------------------------------------------------------------
  // Pre-check: user has not run system check yet
  // ------------------------------------------------------------
  if (!hasRunCheck) {
    return (
      <div className="system-check-hint">
        Run the system check to verify your environment.
      </div>
    );
  }

  // ------------------------------------------------------------
  // Loading state while backend performs checks
  // ------------------------------------------------------------
  if (loading) {
    return (
      <div className="system-check-panel">
        <div className="system-check-title">System Check</div>
        <div className="system-check-hint">Running checks...</div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // No result returned (unexpected backend state)
  // ------------------------------------------------------------
  if (!result) {
    return (
      <div className="system-check-panel">
        <div className="system-check-title">System Check</div>
        <div className="system-check-error">No results available.</div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Determine if all system checks passed
  // ------------------------------------------------------------
  const allGreen =
    result.ollama?.installed &&
    result.ollama?.running &&
    result.models?.available &&
    result.config?.isReady;

  // ------------------------------------------------------------
  // Render full system check panel
  // ------------------------------------------------------------
  return (
    <div className="system-check-panel">
      <div className="system-check-title">System Check</div>

      {/* Ollama Installed */}
      <div className="system-check-row">
        <strong>Ollama Installed:</strong>{" "}
        {result.ollama?.installed ? (
          <span className="status-badge ok">OK</span>
        ) : (
          <span className="status-badge fail">Missing</span>
        )}
      </div>

      {/* Ollama Running */}
      <div className="system-check-row">
        <strong>Ollama Running:</strong>{" "}
        {result.ollama?.running ? (
          <span className="status-badge ok">OK</span>
        ) : (
          <span className="status-badge fail">Stopped</span>
        )}
      </div>

      {/* Required Models */}
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

      {/* ARC‑N Config */}
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

      

      <div className="system-check-footer">
        System check completed. Resolve any issues above to continue.
      </div>
    </div>
  );
}
