// ============================================================
// ARC-NEXUS - SIGNED OUT SCREEN
// File: src/components/SignedOutScreen.jsx
// Version: 003 (email/password auth — no magic-link, no providers)
// ============================================================
//
// AUTH CHANGE: Replaced magic-link / OTP with email+password auth.
// - Sign-in  → supabase.auth.signInWithPassword()  (via onSignIn prop)
// - Sign-up  → supabase.auth.signUp()              (via onSignUp prop)
// - No social/provider login buttons are present.
// - No magic-link / OTP buttons are present.
// - The component never touches localStorage or URL params for auth state.
//
// Props:
//   onSignIn(email, password) → Promise<{ error }>
//   onSignUp(email, password) → Promise<{ error }>
// ============================================================

import React, { useState } from "react";
import logo from "../nexis2.png";

// ── Styles ────────────────────────────────────────────────────────────────

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

const primaryBtnStyle = (loading) => ({
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
});

// ── Error message mapping ─────────────────────────────────────────────────
// Maps Supabase error codes/messages to user-friendly strings.

function mapAuthError(error) {
  if (!error) return null;
  const msg = (error.message || "").toLowerCase();
  const code = (error.code || "").toLowerCase();

  // Unconfirmed email — user signed up but hasn't clicked the confirmation link
  if (
    code === "email_not_confirmed" ||
    msg.includes("email not confirmed") ||
    msg.includes("not confirmed")
  ) {
    return "Please confirm your email before signing in.";
  }

  // Supabase rate-limit on auth emails (signup confirmation re-sends, etc.)
  if (
    msg.includes("email rate limit") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    error.status === 429
  ) {
    return "Too many email attempts. Please wait before trying again.";
  }

  // Wrong credentials
  if (
    msg.includes("invalid login credentials") ||
    msg.includes("invalid email or password") ||
    msg.includes("user not found")
  ) {
    return "Incorrect email or password.";
  }

  // Fallback — surface Supabase message directly
  return error.message || "Something went wrong. Please try again.";
}

// ── Component ─────────────────────────────────────────────────────────────

export default function SignedOutScreen({ onSignIn, onSignUp }) {
  // AUTH CHANGE: Two distinct modes replace the single magic-link flow.
  const [mode, setMode]       = useState("signin"); // "signin" | "signup"
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [errMsg, setErrMsg]   = useState("");
  const [infoMsg, setInfoMsg] = useState(""); // non-error feedback (signup success)
  const [loading, setLoading] = useState(false);

  const resetFields = () => {
    setEmail("");
    setPassword("");
    setErrMsg("");
    setInfoMsg("");
  };

  const switchMode = (next) => {
    setMode(next);
    resetFields();
  };

  // ── Sign-in handler ──────────────────────────────────────────────────────
  // Uses signInWithPassword only — no OTP, no magic-link.
  const handleSignIn = async () => {
    const trimmedEmail    = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrMsg("Enter your email and password.");
      return;
    }

    setErrMsg("");
    setInfoMsg("");
    setLoading(true);

    const { error } = await onSignIn(trimmedEmail, trimmedPassword);

    setLoading(false);

    if (error) {
      setErrMsg(mapAuthError(error));
    }
    // On success, AppLayout's onAuthStateChange fires and sets user → component unmounts.
  };

  // ── Sign-up handler ──────────────────────────────────────────────────────
  // Uses signUp (email+password). Supabase sends a confirmation email;
  // the user must confirm before they can sign in.
  const handleSignUp = async () => {
    const trimmedEmail    = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setErrMsg("Enter your email and password.");
      return;
    }
    if (trimmedPassword.length < 8) {
      setErrMsg("Password must be at least 8 characters.");
      return;
    }

    setErrMsg("");
    setInfoMsg("");
    setLoading(true);

    const { error } = await onSignUp(trimmedEmail, trimmedPassword);

    setLoading(false);

    if (error) {
      setErrMsg(mapAuthError(error));
    } else {
      // AUTH CHANGE: Signup does NOT sign the user in immediately.
      // They must confirm their email first.
      setInfoMsg("Check your email to confirm your account.");
      setPassword("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      mode === "signin" ? handleSignIn() : handleSignUp();
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  const isSignIn = mode === "signin";

  return (
    <div style={wrapStyle}>
      <img
        src={logo}
        alt="NEXIS"
        style={{ height: 200, width: "auto", marginBottom: 8 }}
      />
      <p style={{ margin: "0 0 32px", color: "rgba(255,255,255,0.45)", fontSize: "0.88rem", textAlign: "center" }}>
        Use your account to save projects, inputs, and outputs.
      </p>

      <div style={cardStyle}>
        {/* ── Title ── */}
        <h2 style={{ margin: "0 0 2px", fontSize: "1.05rem", fontWeight: 700, color: "var(--arc-text)" }}>
          {isSignIn ? "Sign in to NEXIS" : "Create an account"}
        </h2>

        {/* ── Email field ── */}
        <input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          style={inputStyle}
        />

        {/* ── Password field ── */}
        <input
          type="password"
          placeholder={isSignIn ? "Password" : "Password (min 8 characters)"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
          style={inputStyle}
        />

        {/* ── Error message ── */}
        {errMsg && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#f87171" }}>
            {errMsg}
          </p>
        )}

        {/* ── Info / success message (e.g. "check your email") ── */}
        {infoMsg && (
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#86efac" }}>
            {infoMsg}
          </p>
        )}

        {/* ── Primary action button ── */}
        <button
          onClick={isSignIn ? handleSignIn : handleSignUp}
          disabled={loading}
          style={primaryBtnStyle(loading)}
        >
          {loading
            ? (isSignIn ? "Signing in…" : "Creating account…")
            : (isSignIn ? "Sign In" : "Create Account")}
        </button>

        {/* ── Mode toggle ── */}
        <p style={{ margin: "4px 0 0", textAlign: "center", fontSize: "0.82rem", color: "rgba(255,255,255,0.38)" }}>
          {isSignIn ? "No account yet?" : "Already have an account?"}{" "}
          <button
            onClick={() => switchMode(isSignIn ? "signup" : "signin")}
            style={{
              all: "unset",
              cursor: "pointer",
              color: "#7dd3fc",
              textDecoration: "underline",
              textUnderlineOffset: 3,
            }}
          >
            {isSignIn ? "Create one" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
