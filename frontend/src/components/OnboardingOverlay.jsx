// ============================================================
// ARC-NEXUS - ONBOARDING OVERLAY
// File: src/components/OnboardingOverlay.jsx
// Shows once, after the logo animation completes.
// Parent (ArcNexusApp) only mounts this after LogoOverlay signals onComplete.
// Dismissed via "Start" button. State stored in localStorage.
// ============================================================

import React, { useState, useEffect } from "react";

const STORAGE_KEY = "nexis_onboarding_seen";

export default function OnboardingOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY);
      console.log("[LandingInfo] check — key present:", !!seen);
      if (seen) {
        console.log("[LandingInfo] already seen, skipping.");
        return;
      }
      console.log("[LandingInfo] should show");
      setVisible(true);
    } catch (e) {
      console.warn("[LandingInfo] localStorage unavailable, showing onboarding anyway");
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleStart = () => {
    console.log("[LandingInfo] dismissed");
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch (e) {
      console.warn("[LandingInfo] failed to persist onboarding completion");
    }
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9000,
      }}
    >
      <div
        className="panel"
        style={{ width: 340, margin: 0, textAlign: "center" }}
      >
        <h2 id="onboarding-title" style={{ marginTop: 0, marginBottom: 24 }}>Welcome to NEXIS</h2>

        <ol
          style={{
            textAlign: "left",
            paddingLeft: 22,
            margin: "0 0 24px",
            lineHeight: "2.2",
            fontSize: "0.95rem",
          }}
        >
          <li>Collect sources</li>
          <li>Select what matters</li>
          <li>Create structured output</li>
          <li>Refine and reuse</li>
        </ol>

        <p className="subtle" style={{ fontSize: "0.82rem", margin: "0 0 24px" }}>
          Processing requires a configured model.
        </p>

        <button
          className="btn primary"
          onClick={handleStart}
          style={{ width: "100%" }}
        >
          Start
        </button>
      </div>
    </div>
  );
}