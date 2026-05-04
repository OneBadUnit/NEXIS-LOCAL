// ============================================================
// ARC-NEXUS - APP LAYOUT
// File: src/layout/AppLayout.jsx
// Version: 004 (Dashboard-only routing)
// ============================================================

import React, { useState, useEffect } from "react";

import TopBar from "./TopBar";

import NexusDashboard from "../pages/NexusDashboard";
import Help from "../pages/Help";

import "./layout.css";

const PAGES = {
  nexus: <NexusDashboard />,
  help: <Help />,
};

export default function AppLayout() {
  const [activePage, setActivePage] = useState("nexus");
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

  const handlePageChange = (page) => {
    setActivePage(page);

    const main = document.querySelector(".arcn-main");
    if (main) {
      main.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    const main = document.querySelector(".arcn-main");

    if (main) {
      main.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="layout">
      <TopBar setActivePage={handlePageChange} />

      <main className="arcn-main">
        {PAGES[activePage] || <NexusDashboard />}
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
    </div>
  );
}
