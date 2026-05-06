// ============================================================
// ARC-NEXUS - UPGRADE OVERLAY
// File: src/components/UpgradeOverlay.jsx
// Version: 001 (placeholder — purchase flow not connected)
// ============================================================

import React from "react";
import PageOverlay from "./PageOverlay";

export default function UpgradeOverlay({ onClose }) {
  return (
    <PageOverlay title="Upgrade Plan" onClose={onClose}>
      <div style={{ maxWidth: 420 }}>
        <div className="panel">
          <h3>Purchase Flow</h3>
          <p
            style={{
              margin: "0 0 12px",
              color: "rgba(255,255,255,0.5)",
              fontSize: "0.88rem",
              lineHeight: 1.7,
            }}
          >
            Upgrade purchase flow not connected yet.
          </p>
          <p
            style={{
              margin: 0,
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.8rem",
            }}
          >
            To change your plan, contact support.
          </p>
        </div>
      </div>
    </PageOverlay>
  );
}
