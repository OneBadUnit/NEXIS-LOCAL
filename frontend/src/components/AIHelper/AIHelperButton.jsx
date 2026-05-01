// ============================================================
// ARC-NEXUS - NEXIS GUIDE BUTTON
// File: src/components/AIHelper/AIHelperButton.jsx
// Version: 002 (Clean UI + Non-Intrusive Design)
// ============================================================

import React from "react";
import "./aiHelper.css";

export default function AIHelperButton({ onClick }) {
  return (
    <button
      className="nexis-guide-button"
      onClick={onClick}
      aria-label="Open NEXIS Guide"
      title="NEXIS Guide"
    >
      ?
    </button>
  );
}