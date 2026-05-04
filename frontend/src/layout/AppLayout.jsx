// ============================================================
// ARC-NEXUS - APP LAYOUT
// File: src/layout/AppLayout.jsx
// Version: 005 (Help + Setup as overlays)
// ============================================================

import React, { useState, useEffect } from "react";

import TopBar from "./TopBar";

import NexusDashboard from "../pages/NexusDashboard";
import HelpOverlay from "../components/HelpOverlay";
import SetupOverlay from "../components/SetupOverlay";

import "./layout.css";

export default function AppLayout() {
  // null | "help" | "setup"
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
      />

      <main className="arcn-main">
        <NexusDashboard />
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

      {/* Overlays — rendered on top of everything */}
      {overlay === "help" && (
        <HelpOverlay onClose={() => setOverlay(null)} />
      )}
      {overlay === "setup" && (
        <SetupOverlay onClose={() => setOverlay(null)} />
      )}
    </div>
  );
}
