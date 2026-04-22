// ============================================================
// SCROLL TOP BUTTON
// Floating neon button that scrolls the page back to the top.
// Used across all ARC‑NEXUS modules for long content panels.
// Styling is handled in: /styles/ui-widgets.css
// ============================================================

import React from "react";
import "../styles/ui-widgets.css";

export default function ScrollTopButton() {
  // ------------------------------------------------------------
  // Smooth scroll-to-top behavior
  // ------------------------------------------------------------
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ------------------------------------------------------------
  // Render floating neon button
  // ------------------------------------------------------------
  return (
    <button
      className="scroll-top-button"
      aria-label="Scroll to top"
      onClick={scrollToTop}
    >
      ↑
    </button>
  );
}
