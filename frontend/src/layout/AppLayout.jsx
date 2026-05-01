// ============================================================
// ARC-NEXUS - APP LAYOUT
// File: src/layout/AppLayout.jsx
// Version: 003 (Clean Page Routing + Product Shell)
// ============================================================

import React, { useState, useEffect } from "react";

import TopBar from "./TopBar";
import AIHelperButton from "../components/AIHelper/AIHelperButton";
import AIHelperPanel from "../components/AIHelper/AIHelperPanel";

import NexusDashboard from "../pages/NexusDashboard";
import Assimilation from "../pages/Assimilation";
import Creation from "../pages/Creation";
import Reconstruction from "../pages/Reconstruction";
import Settings from "../pages/Settings";
import Help from "../pages/Help";

import "./layout.css";

const PAGES = {
  nexus: <NexusDashboard />,
  assimilation: <Assimilation />,
  reconstruction: <Reconstruction />,
  creation: <Creation />,
  settings: <Settings />,
  help: <Help />,
};

export default function AppLayout() {
  const [activePage, setActivePage] = useState("nexus");
  const [guideOpen, setGuideOpen] = useState(false);
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
      <TopBar activePage={activePage} setActivePage={handlePageChange} />

      <main className="arcn-main">
        {PAGES[activePage] || <NexusDashboard />}
      </main>

      <AIHelperButton onClick={() => setGuideOpen((prev) => !prev)} />
      <AIHelperPanel isOpen={guideOpen} onClose={() => setGuideOpen(false)} />

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