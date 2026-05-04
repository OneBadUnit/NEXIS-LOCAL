// ============================================================
// ARC-NEXUS - TOP BAR
// File: src/layout/TopBar.jsx
// Version: 006 (Minimal: logo + Help)
// ============================================================

import logo from "../nexis2.png";

export default function TopBar({ setActivePage }) {
  return (
    <header className="topnav">
      {/* LOGO — click to go home */}
      <button
        className="brand"
        onClick={() => setActivePage("nexus")}
      >
        <img src={logo} alt="ArcNexus" className="brand-logo" />
      </button>

      {/* HELP */}
      <button
        className="nav-item topnav-help"
        onClick={() => setActivePage("help")}
      >
        Help
      </button>
    </header>
  );
}
