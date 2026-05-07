// ============================================================
// ARC-NEXUS - SIGNED OUT SCREEN
// File: src/components/SignedOutScreen.jsx
// Version: 002 (magic-link / email-only auth)
// ============================================================

import React, { useState } from "react";
import logo from "../nexis2.png";

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: "0.9rem",
  color: "var(--arc-text)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

const cardStyle = {
  background: "#111",
  border: "1px solid rgba(255,255,255,0.09)",
  borderRadius: 14,
  padding: "32px 32px 28px",
  width: "100%",
  maxWidth: 380,
  display: "flex",
  flexDirection: "column",
  gap: 14,
};

const wrapStyle = {
  position: "fixed",
  inset: 0,
  background: "var(--arc-bg)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 500,
  padding: 24,
};

export default function SignedOutScreen({ onSendMagicLink }) {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState("idle"); // "idle" | "sent"
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setErrMsg("Enter your email address.");
      return;
    }
    setErrMsg("");
    setLoading(true);
    const { error } = await onSendMagicLink(trimmed);
    setLoading(false);
    if (error) {
      setErrMsg(error.message || "Something went wrong. Try again.");
    } else {
      setStatus("sent");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  // -- Sent confirmation
  if (status === "sent") {
    return (
      <div style={wrapStyle}>
        <img src={logo} alt="NEXIS" style={{ height: 200, width: "auto", marginBottom: 8 }} />
        <div style={cardStyle}>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.05rem", fontWeight: 700, color: "var(--arc-text)" }}>
            Check your email
          </h2>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.55)", fontSize: "0.88rem" }}>
            We sent a login link to:
          </p>
          <p style={{ margin: 0, fontWeight: 600, color: "#7dd3fc", wordBreak: "break-all", fontSize: "0.92rem" }}>
            {email}
          </p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>
            Click the link in the email to sign in. The link expires after a few minutes.
          </p>
          <button
            onClick={() => { setStatus("idle"); setEmail(""); setErrMsg(""); }}
            style={{
              all: "unset",
              cursor: "pointer",
              fontSize: "0.82rem",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              marginTop: 4,
            }}
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  // -- Sign-in form
  return (
    <div style={wrapStyle}>
      <img src={logo} alt="NEXIS" style={{ height: 200, width: "auto", marginBottom: 8 }} />
      <p style={{ margin: "0 0 32px", color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", textAlign: "center" }}>
        Use your account to save projects, inputs, and outputs.
      </p>

      <div style={cardStyle}>
        <h2 style={{ margin: "0 0 2px", fontSize: "1.05rem", fontWeight: 700, color: "var(--arc-text)" }}>
          Sign in to NEXIS
        </h2>
        <p style={{ margin: "0 0 4px", color: "rgba(255,255,255,0.4)", fontSize: "0.82rem" }}>
          We will send a login link to your email. New accounts are created automatically.
        </p>

        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={inputStyle}
        />

        {errMsg && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#f87171" }}>{errMsg}</p>
        )}

        <button
          onClick={handleSend}
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
          {loading ? "Sending..." : "Send Login Link"}
        </button>
      </div>
    </div>
  );
}
