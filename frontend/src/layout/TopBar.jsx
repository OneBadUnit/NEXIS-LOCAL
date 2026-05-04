// ============================================================
// ARC-NEXUS - TOP BAR
// File: src/layout/TopBar.jsx
// Version: 007 (Setup left, Help right, overlays)
// ============================================================

import logo from "../nexis2.png";

export default function TopBar({ onHome, openOverlay }) {
  return (
    <header className="topnav">
      {/*
        Three-zone layout:
          left   — Setup button
          center — Logo (absolutely centered)
          right  — Help button
      */}
      <div
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* SETUP — left */}
        <button
          className="nav-item topnav-help"
          style={{ position: "absolute", left: 0 }}
          onClick={() => openOverlay("setup")}
        >
          Setup
        </button>

        {/* LOGO — center */}
        <button className="brand" onClick={onHome}>
          <img src={logo} alt="ArcNexus" className="brand-logo" />
        </button>

        {/* HELP — right */}
        <button
          className="nav-item topnav-help"
          style={{ position: "absolute", right: 0 }}
          onClick={() => openOverlay("help")}
        >
          Help
        </button>
      </div>
    </header>
  );
}
