// ============================================================
// ARC-NEXUS - RESET PASSWORD OVERLAY
// File: src/components/ResetPasswordOverlay.jsx
// Version: 001 (send reset link)
// ============================================================

import React, { useState } from "react";
import { resetPasswordForEmail } from "../lib/auth";

const btnBase = {
  all: "unset",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "9px 20px",
  borderRadius: 8,
  fontSize: "0.88rem",
  fontWeight: 600,
  transition: "opacity 0.15s",
  boxSizing: "border-box",
};

const btnPrimary = {
  ...btnBase,
  background: "rgba(56,189,248,0.18)",
  border: "1px solid rgba(56,189,248,0.45)",
  color: "#7dd3fc",
};

const btnSecondary = {
  ...btnBase,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.55)",
};

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.13)",
  borderRadius: 8,
  padding: "9px 12px",
  fontSize: "0.9rem",
  color: "var(--arc-text)",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default function ResetPasswordOverlay({ onClose, prefillEmail = "" }) {
  const [email, setEmail] = useState(prefillEmail);
  const [view, setView] = useState("form"); // "form" | "sent" | "error"
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setErrMsg("Enter your email first.");
      return;
    }
    setErrMsg("");
    setLoading(true);
    const { error } = await resetPasswordForEmail(email.trim());
    setLoading(false);

    if (error) {
      setErrMsg(error.message || "Something went wrong. Please try again.");
      setView("error");
      return;
    }

    setView("sent");
  };

  return (
    /* Backdrop */
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 3000,
        background: "rgba(0,0,0,0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal panel */}
      <div
        style={{
          position: "relative",
          background: "#111",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 14,
          padding: "36px 36px 32px",
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
          color: "var(--arc-text)",
        }}
      >
        {/* Close X */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            all: "unset",
            cursor: "pointer",
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 8,
            color: "rgba(255,255,255,0.4)",
            fontSize: "1rem",
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color = "var(--arc-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          }}
        >
          ✕
        </button>

        {/* ── Form ── */}
        {view === "form" && (
          <>
            <h2 style={{ margin: "0 0 20px", fontSize: "1.1rem", fontWeight: 700 }}>
              Reset your password
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
              <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
                placeholder="you@example.com"
                autoFocus
                style={inputStyle}
              />
            </div>

            {errMsg && (
              <p style={{ margin: "0 0 14px", fontSize: "0.82rem", color: "#f87171" }}>
                {errMsg}
              </p>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}
                onClick={handleSend}
                disabled={loading}
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
              <button style={btnSecondary} onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}

        {/* ── Sent ── */}
        {view === "sent" && (
          <>
            <h2 style={{ margin: "0 0 14px", fontSize: "1.1rem", fontWeight: 700 }}>
              Reset email sent
            </h2>
            <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.7)", fontSize: "0.92rem" }}>
              Check your inbox for a password reset link sent to:
            </p>
            <p style={{ margin: "0 0 28px", fontWeight: 600, color: "#7dd3fc", wordBreak: "break-all" }}>
              {email}
            </p>
            <button style={btnSecondary} onClick={onClose}>
              Close
            </button>
          </>
        )}

        {/* ── Error ── */}
        {view === "error" && (
          <>
            <h2 style={{ margin: "0 0 14px", fontSize: "1.1rem", fontWeight: 700 }}>
              Something went wrong
            </h2>
            <p style={{ margin: "0 0 24px", color: "#f87171", fontSize: "0.88rem" }}>
              {errMsg}
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button style={btnPrimary} onClick={() => { setView("form"); setErrMsg(""); }}>
                Try again
              </button>
              <button style={btnSecondary} onClick={onClose}>
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
