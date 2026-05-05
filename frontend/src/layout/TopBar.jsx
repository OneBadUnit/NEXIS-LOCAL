// ============================================================
// ARC-NEXUS - TOP BAR
// File: src/layout/TopBar.jsx
// Version: 007 (Setup left, Help right, overlays)
// ============================================================

import React, { useState } from "react";
import logo from "../nexis2.png";

export default function TopBar({ onHome, openOverlay, user, onOpenSignUp, onOpenAccount, onSignIn, onSignOut }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setAuthMsg("Email and password are required.");
      return;
    }
    setAuthMsg("");
    const error = await onSignIn(email, password);
    if (error) {
      setAuthMsg(error.message || "Sign in failed.");
    }
  };

  return (
    <header className="topnav">
      {/*
        Three-zone layout:
          left   — Setup button
          center — Logo (flex-centered)
          right  — Auth + Help button
      */}
      <div className="topbar-inner">
        {/* LEFT — Setup */}
        <div className="topbar-left">
          <button
            className="nav-item topnav-help"
            onClick={() => openOverlay("setup")}
          >
            Setup
          </button>

          <button
            className="nav-item topnav-help"
            onClick={() => openOverlay("help")}
          >
            Help
          </button>
        </div>

        {/* CENTER — Logo */}
        <div className="topbar-center">
          <button className="brand" onClick={onHome}>
            <img src={logo} alt="ArcNexus" className="brand-logo" />
          </button>
        </div>

        {/* RIGHT — Auth + Help */}
        <div className="topbar-right">
          {user ? (
            <>
              <span className="subtle topbar-user-email">{user.email}</span>
              <button className="nav-item topnav-help" onClick={onOpenAccount}>
                Account
              </button>
              <button className="nav-item topnav-help" onClick={onSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="topbar-input"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="topbar-input topbar-input--pw"
              />
              <button className="nav-item topnav-help" onClick={onOpenSignUp}>
                Sign Up
              </button>
              <button className="nav-item topnav-help" onClick={handleSignIn}>
                Sign In
              </button>
              {authMsg && (
                <span style={{ fontSize: "0.78rem", color: "#f87171", whiteSpace: "nowrap" }}>
                  {authMsg}
                </span>
              )}
            </>
          )}
          
        </div>
      </div>
    </header>
  );
}
