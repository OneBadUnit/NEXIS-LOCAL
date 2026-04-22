// ============================================================
// APP LAYOUT — Unified TopBar/Nav + Scrollable Content
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

export default function AppLayout() {
  const [activePage, setActivePage] = useState("nexus");
  const [open, setOpen] = useState(false);

  // ---------------------------------------------
  // Scroll-to-top button visibility
  // ---------------------------------------------
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const main = document.querySelector(".arcn-main");
    if (!main) return;

    const handleScroll = () => {
      setShowScrollTop(main.scrollTop > 200);
    };

    main.addEventListener("scroll", handleScroll);
    return () => main.removeEventListener("scroll", handleScroll);
  }, []);

  // ---------------------------------------------
  // Scroll-to-top action
  // ---------------------------------------------
  const scrollToTop = () => {
    const main = document.querySelector(".arcn-main");
    if (main) {
      main.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="layout">
      <TopBar activePage={activePage} setActivePage={setActivePage} />

      <main className="arcn-main">
        {activePage === "nexus" && <NexusDashboard />}
        {activePage === "assimilation" && <Assimilation />}
        {activePage === "creation" && <Creation />}
        {activePage === "reconstruction" && <Reconstruction />}
        {activePage === "settings" && <Settings />}
        {activePage === "help" && <Help />}
      </main>

      {/* AI Helper */}
      <AIHelperButton onClick={() => setOpen(!open)} />
      <AIHelperPanel isOpen={open} onClose={() => setOpen(false)} />

      {/* Scroll-to-top button */}
      {showScrollTop && (
        <button className="scroll-top-button" onClick={scrollToTop}>
          ↑
        </button>
      )}
    </div>
  );
}
