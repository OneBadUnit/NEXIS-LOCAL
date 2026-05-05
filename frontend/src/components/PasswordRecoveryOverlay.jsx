// ============================================================
// ARC-NEXUS - PASSWORD RECOVERY OVERLAY
// File: src/components/PasswordRecoveryOverlay.jsx
// Version: 001 (complete password recovery after reset link)
// ============================================================

import React, { useState } from "react";
import { supabase } from "../lib/supabase";

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

const btnPrimary = {
  all: "unset",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 22px",
  borderRadius: 8,
  fontSize: "0.9rem",
  fontWeight: 600,
  background: "rgba(56,189,248,0.18)",
  border: "1px solid rgba(56,189,248,0.45)",
  color: "#7dd3fc",
  transition: "opacity 0.15s",
  boxSizing: "border-box",
};

const btnSecondary = {
  all: "unset",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 22px",
  borderRadius: 8,
  fontSize: "0.9rem",
  fontWeight: 600,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.14)",
  color: "rgba(255,255,255,0.55)",
  transition: "opacity 0.15s",
  boxSizing: "border-box",
};

export default function PasswordRecoveryOverlay({ onComplete }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errMsg, setErrMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleUpdate = async () => {
    if (!newPassword.trim() || !confirm.trim()) {
      setErrMsg("Enter your new password.");
      return;
    }
    if (newPassword !== confirm) {
      setErrMsg("Passwords do not match.");
      return;
    }
    setErrMsg("");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (error) {
      setErrMsg(error.message || "Could not update password. Please try again.");
      return;
    }

    setDone(true);
  };

  return (
    /* Full-screen backdrop — blocks dashboard until resolved */
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 4000,
        background: "rgba(0,0,0,0.88)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "#111",
          border: "1px solid rgba(255,255,255,0.10)",
          borderRadius: 14,
          padding: "36px 36px 32px",
          width: "100%",
          maxWidth: 400,
          boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
          color: "var(--arc-text)",
        }}
      >
        {!done ? (
          <>
            <h2 style={{ margin: "0 0 8px", fontSize: "1.15rem", fontWeight: 700 }}>
              Create new password
            </h2>
            <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>
              Choose a new password for your NEXIS account.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                  New password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password"
                  autoFocus
                  style={inputStyle}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
                  Confirm new password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat new password"
                  style={inputStyle}
                />
              </div>
            </div>

            {errMsg && (
              <p style={{ margin: "14px 0 0", fontSize: "0.82rem", color: "#f87171" }}>
                {errMsg}
              </p>
            )}

            <div style={{ marginTop: 24 }}>
              <button
                style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, width: "100%" }}
                onClick={handleUpdate}
                disabled={loading}
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ margin: "0 0 14px", fontSize: "1.15rem", fontWeight: 700 }}>
              Password updated
            </h2>
            <p style={{ margin: "0 0 28px", color: "rgba(255,255,255,0.6)", fontSize: "0.92rem" }}>
              Your new password is active. You can now use NEXIS normally.
            </p>
            <button style={btnSecondary} onClick={onComplete}>
              Continue to NEXIS
            </button>
          </>
        )}
      </div>
    </div>
  );
}
