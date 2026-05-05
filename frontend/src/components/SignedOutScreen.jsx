// ============================================================
// ARC-NEXUS - SIGNED OUT SCREEN
// File: src/components/SignedOutScreen.jsx
// Version: 001 (auth gate landing)
// ============================================================

import React, { useState } from "react";
import logo from "../nexis2.png";
import SignUpOverlay from "./SignUpOverlay";
import ResetPasswordOverlay from "./ResetPasswordOverlay";

export default function SignedOutScreen({ onSignIn, onSignUpSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setErrMsg("Enter your email and password.");
      return;
    }
    setErrMsg("");
    setLoading(true);
    const error = await onSignIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setErrMsg(error.message || "Sign in failed. Check your credentials.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSignIn();
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "var(--arc-bg)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
          zIndex: 500,
          padding: 24,
        }}
      >
        {/* Logo */}
        <img
          src={logo}
          alt="NEXIS"
          style={{ height: 200, width: "auto", marginBottom: 8 }}
        />

        {/* Tagline */}
        <p
          style={{
            margin: "0 0 32px",
            color: "rgba(255,255,255,0.45)",
            fontSize: "0.88rem",
            textAlign: "center",
          }}
        >
          Use your account to save projects, inputs, and outputs.
        </p>

        {/* Sign-in form card */}
        <div
          style={{
            background: "#111",
            border: "1px solid rgba(255,255,255,0.09)",
            borderRadius: 14,
            padding: "32px 32px 28px",
            width: "100%",
            maxWidth: 380,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "1.05rem",
              fontWeight: 700,
              color: "var(--arc-text)",
            }}
          >
            Sign in to use NEXIS
          </h2>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: "0.9rem",
              color: "var(--arc-text)",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: "0.9rem",
              color: "var(--arc-text)",
              outline: "none",
              width: "100%",
              boxSizing: "border-box",
            }}
          />

          {errMsg && (
            <p style={{ margin: 0, fontSize: "0.82rem", color: "#f87171" }}>
              {errMsg}
            </p>
          )}

          <button
            onClick={handleSignIn}
            disabled={loading}
            style={{
              all: "unset",
              cursor: loading ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 0",
              borderRadius: 8,
              background: "rgba(56,189,248,0.18)",
              border: "1px solid rgba(56,189,248,0.45)",
              color: "#7dd3fc",
              fontSize: "0.9rem",
              fontWeight: 600,
              opacity: loading ? 0.6 : 1,
              transition: "opacity 0.15s",
              boxSizing: "border-box",
              width: "100%",
            }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginTop: 2,
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.82rem" }}>
              No account?
            </span>
            <button
              onClick={() => setShowSignUp(true)}
              style={{
                all: "unset",
                cursor: "pointer",
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.55)",
                fontWeight: 600,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              Sign Up
            </button>
            <button
              onClick={() => setShowReset(true)}
              style={{
                all: "unset",
                cursor: "pointer",
                fontSize: "0.82rem",
                color: "rgba(255,255,255,0.35)",
                marginLeft: "auto",
              }}
            >
              Forgot password?
            </button>
          </div>
        </div>
      </div>

      {showSignUp && (
        <SignUpOverlay
          onClose={() => setShowSignUp(false)}
          onSignUpSuccess={onSignUpSuccess}
          onGoToSignIn={() => setShowSignUp(false)}
        />
      )}

      {showReset && (
        <ResetPasswordOverlay
          onClose={() => setShowReset(false)}
          prefillEmail={email}
        />
      )}
    </>
  );
}
