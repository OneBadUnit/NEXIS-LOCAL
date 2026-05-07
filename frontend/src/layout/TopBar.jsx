// ============================================================
// ARC-NEXUS - TOP BAR
// File: src/layout/TopBar.jsx
// Version: 010 (email/password auth — no provider/social buttons)
// ============================================================

import React from "react";
import logo from "../nexis2.png";

export default function TopBar({ onHome, openOverlay, user, onOpenAccount, onSignOut }) {
  return (
    <header className="topnav">
      {/*
        Three-zone layout:
          left   — Help button
          center — Logo (flex-centered)
          right  — Auth buttons
      */}
      <div className="topbar-inner">
        {/* LEFT — Help + Diagnostics */}
        <div className="topbar-left">
          <button
            className="nav-item topnav-help"
            onClick={() => openOverlay("help")}
          >
            Help
          </button>
          <button
            className="nav-item topnav-help"
            onClick={() => openOverlay("diagnostics")}
          >
            Diagnostics
          </button>
        </div>

        {/* CENTER — Logo */}
        <div className="topbar-center">
          <button className="brand" onClick={onHome}>
            <img src={logo} alt="ArcNexus" className="brand-logo" />
          </button>
        </div>

        {/* RIGHT — Auth (shown only when signed in) */}
        <div className="topbar-right">
          {user && (
            <>
              <span className="subtle topbar-user-email">{user.email}</span>
              <button className="nav-item topnav-help" onClick={onOpenAccount}>
                Account
              </button>
              <button className="nav-item topnav-help" onClick={onSignOut}>
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
