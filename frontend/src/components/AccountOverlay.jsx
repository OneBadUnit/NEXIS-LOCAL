// ============================================================
// ARC-NEXUS - ACCOUNT OVERLAY
// File: src/components/AccountOverlay.jsx
// Version: 001 (account info + change password)
// ============================================================

import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import PageOverlay from "./PageOverlay";

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
  padding: "9px 20px",
  borderRadius: 8,
  fontSize: "0.88rem",
  fontWeight: 600,
  background: "rgba(56,189,248,0.18)",
  border: "1px solid rgba(56,189,248,0.45)",
  color: "#7dd3fc",
  transition: "opacity 0.15s",
  boxSizing: "border-box",
};

function Field({ label, type = "text", value, onChange, placeholder }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", fontWeight: 500 }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

// ── Change Password section ──────────────────────────────────

function ChangePasswordSection() {
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState(null); // { type: "error"|"success", text }
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    if (!currentPw.trim() || !newPw.trim() || !confirmPw.trim()) {
      setMsg({ type: "error", text: "Complete all password fields." });
      return;
    }
    if (newPw !== confirmPw) {
      setMsg({ type: "error", text: "Passwords do not match." });
      return;
    }

    setMsg(null);
    setLoading(true);

    // Re-authenticate with current password before updating
    const { data: userData } = await supabase.auth.getUser();
    const email = userData?.user?.email;

    if (email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPw.trim(),
      });

      if (signInError) {
        setLoading(false);
        setMsg({
          type: "error",
          text: "Current password is incorrect.",
        });
        return;
      }
    } else {
      // Can't get email — fall back with a note
      setLoading(false);
      setMsg({
        type: "error",
        text: "For security, password changes may require signing in again or using password reset.",
      });
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);

    if (error) {
      setMsg({ type: "error", text: error.message || "Could not update password. Please try again." });
      return;
    }

    setMsg({ type: "success", text: "Password updated." });
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
  };

  return (
    <div className="panel" style={{ marginTop: 24 }}>
      <h3 style={{ margin: "0 0 16px", fontSize: "0.95rem", fontWeight: 700 }}>
        Change Password
      </h3>

      <p style={{ margin: "0 0 16px", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
        For security, your current password is verified before making changes.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field
          label="Current password"
          type="password"
          value={currentPw}
          onChange={(e) => setCurrentPw(e.target.value)}
          placeholder="Your current password"
        />
        <Field
          label="New password"
          type="password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          placeholder="New password"
        />
        <Field
          label="Confirm new password"
          type="password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          placeholder="Repeat new password"
        />
      </div>

      {msg && (
        <p
          style={{
            margin: "12px 0 0",
            fontSize: "0.82rem",
            color: msg.type === "success" ? "#4ade80" : "#f87171",
          }}
        >
          {msg.text}
        </p>
      )}

      <div style={{ marginTop: 16 }}>
        <button
          style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}
          onClick={handleUpdate}
          disabled={loading}
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </div>
    </div>
  );
}

// ── Main overlay ─────────────────────────────────────────────

export default function AccountOverlay({ onClose, user, profile }) {
  const tier = profile?.tier || "free";
  return (
    <PageOverlay title="Account" onClose={onClose}>

      {/* ── Identity ── */}
      <div className="panel">
        <h3 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: 700 }}>
          Account Info
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", minWidth: 64 }}>
              Email
            </span>
            <span style={{ fontSize: "0.9rem", color: "var(--arc-text)", wordBreak: "break-all" }}>
              {user?.email ?? "—"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", minWidth: 64 }}>
              User ID
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.3)",
                fontFamily: "monospace",
                wordBreak: "break-all",
              }}
            >
              {user?.id ?? "—"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", minWidth: 64 }}>
              Provider
            </span>
            <span style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.6)" }}>
              {user?.app_metadata?.provider ?? "email"}
            </span>
          </div>

          {user?.email_confirmed_at && (
            <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
              <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", minWidth: 64 }}>
                Verified
              </span>
              <span style={{ fontSize: "0.88rem", color: "#4ade80" }}>
                Yes
              </span>
            </div>
          )}

          <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
            <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", minWidth: 64 }}>
              Plan
            </span>
            <span
              style={{
                fontSize: "0.88rem",
                color: tier === "free" ? "rgba(255,255,255,0.6)" : "#7dd3fc",
                textTransform: "capitalize",
              }}
            >
              {tier}
            </span>
          </div>
        </div>
      </div>

      {/* ── Change Password ── */}
      <ChangePasswordSection />

    </PageOverlay>
  );
}
