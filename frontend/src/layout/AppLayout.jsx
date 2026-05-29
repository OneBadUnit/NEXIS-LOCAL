// ============================================================
// ARC-NEXUS - APP LAYOUT
// File: src/layout/AppLayout.jsx
// Version: 009 (local auth — Supabase gate removed)
// ============================================================

import React, { useState, useEffect } from "react";

import TopBar from "./TopBar";

import NexusDashboard from "../pages/NexusDashboard";
import HelpOverlay from "../components/HelpOverlay";
import DiagnosticsOverlay from "../components/DiagnosticsOverlay";

import "./layout.css";

// ── Local user constants ──────────────────────────────────────
// Replaces Supabase auth. The backend uses DEFAULT_USER_ID = "default"
// and performs no token validation. All tier limits in tiers.js are
// set to 99999 for every tier, so "free" is functionally unlimited locally.
const LOCAL_USER = {
  id: "local-user",
  email: "local@nexis",
};

const LOCAL_PROFILE = {
  id: "local-user",
  email: "local@nexis",
  tier: "free",
  bonus_actions: 0,
  first_name: "Local",
  last_name: "User",
  phone: null,
  company: null,
};

export default function AppLayout() {
  // null | "help"
  const [overlay, setOverlay] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const main = document.querySelector(".arcn-main");
    if (!main) return;

    const handleScroll = () => {
      setShowScrollTop(main.scrollTop > 200);
    };

    main.addEventListener("scroll", handleScroll);

    return () => {
      main.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    const main = document.querySelector(".arcn-main");
    if (main) {
      main.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="layout">
      <TopBar
        onHome={() => setOverlay(null)}
        openOverlay={(name) => setOverlay(name)}
        user={null}
      />

      <main className="arcn-main">
        <NexusDashboard user={LOCAL_USER} profile={LOCAL_PROFILE} />
      </main>

      {showScrollTop && (
        <button
          className="scroll-top-button"
          onClick={scrollToTop}
          aria-label="Scroll to top"
          title="Scroll to top"
        >
          ↑
        </button>
      )}

      {overlay === "help" && (
        <HelpOverlay onClose={() => setOverlay(null)} />
      )}
      {overlay === "diagnostics" && (
        <DiagnosticsOverlay onClose={() => setOverlay(null)} />
      )}
    </div>
  );
}
