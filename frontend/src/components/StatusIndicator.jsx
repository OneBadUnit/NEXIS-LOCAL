// ============================================================
// STATUS INDICATOR
// Displays the current ARC‑NEXUS system status message.
// Pulls live status from global ArcNContext.
// Styling is handled via global/top‑bar CSS.
// ============================================================

import React, { useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";

export default function StatusIndicator() {
  // ------------------------------------------------------------
  // Access global status message from context
  // ------------------------------------------------------------
  const { statusMessage } = useContext(ArcNContext);

  // ------------------------------------------------------------
  // Render status text inside the top bar indicator
  // ------------------------------------------------------------
  return (
    <div className="status-indicator">
      {statusMessage}
    </div>
  );
}
