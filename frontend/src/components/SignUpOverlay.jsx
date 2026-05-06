// ============================================================
// ARC-NEXUS - SIGN UP OVERLAY
// File: src/components/SignUpOverlay.jsx
// Version: 001 (centered modal, email confirmation flow)
// ============================================================

import React, { useState } from "react";
import { getSession } from "../lib/auth";
import ResetPasswordOverlay from "./ResetPasswordOverlay";

// ── Helpers ─────────────────────────────────────────────────

const KNOWN_DUPLICATE_MSGS = [
  "user already registered",
  "already registered",
  "email already",
  "already exists",
];

function isDuplicateError(msg = "") {
  const lower = msg.toLowerCase();
  return KNOWN_DUPLICATE_MSGS.some((phrase) => lower.includes(phrase));
}

// ── Shared button style ──────────────────────────────────────

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
  transition: "background 0.15s ease, color 0.15s ease, opacity 0.15s",
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

// ── Input component ──────────────────────────────────────────

function Field({ label, type, value, onChange, placeholder, autoFocus }) {
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
        autoFocus={autoFocus}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.13)",
          borderRadius: 8,
          padding: "9px 12px",
          fontSize: "0.9rem",
          color: "var(--arc-text)",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ── Checkbox component ───────────────────────────────────────

function CheckboxField({ id, checked, onChange, children }) {
  return (
    <label
      htmlFor={id}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        cursor: "pointer",
        fontSize: "0.82rem",
        color: "rgba(255,255,255,0.65)",
        lineHeight: 1.5,
      }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{ marginTop: 2, flexShrink: 0, accentColor: "#38bdf8" }}
      />
      {children}
    </label>
  );
}

// ── Step 1: Credentials ──────────────────────────────────────

function StepOneState({ onNext, onClose }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");

  const handleNext = () => {
    if (!email.trim() || !password.trim() || !confirm.trim()) {
      setErr("Enter your email and password.");
      return;
    }
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setErr("");
    onNext({ email: email.trim(), password });
  };

  return (
    <>
      <h2 style={{ margin: "0 0 6px", fontSize: "1.15rem", fontWeight: 700 }}>
        Create your NEXIS account
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
        Step 1 of 2
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoFocus
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
        />
        <Field
          label="Confirm Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat your password"
        />
      </div>

      {err && (
        <p style={{ margin: "14px 0 0", fontSize: "0.82rem", color: "#f87171" }}>{err}</p>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button style={btnPrimary} onClick={handleNext}>
          Next →
        </button>
        <button style={btnSecondary} onClick={onClose}>
          Cancel
        </button>
      </div>
    </>
  );
}

// ── Step 2: Profile info + agreements ───────────────────────

function StepTwoState({ onSubmit, onBack, loading }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeModel, setAgreeModel] = useState(false);
  const [agreeMistakes, setAgreeMistakes] = useState(false);
  const [err, setErr] = useState("");

  const handleCreate = () => {
    if (!firstName.trim() || !lastName.trim()) {
      setErr("First name and last name are required.");
      return;
    }
    if (!agreeTerms || !agreeModel || !agreeMistakes) {
      setErr("Please check all required agreements before continuing.");
      return;
    }
    setErr("");
    onSubmit({
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim() || null,
      company: company.trim() || null,
    });
  };

  return (
    <>
      <h2 style={{ margin: "0 0 6px", fontSize: "1.15rem", fontWeight: 700 }}>
        A little about you
      </h2>
      <p style={{ margin: "0 0 24px", fontSize: "0.8rem", color: "rgba(255,255,255,0.4)" }}>
        Step 2 of 2
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field
            label="First Name *"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First"
            autoFocus
          />
          <Field
            label="Last Name *"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last"
          />
        </div>
        <Field
          label="Phone (optional)"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
        />
        <Field
          label="Company (optional)"
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Your company or organization"
        />
      </div>

      {/* Agreements */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 20 }}>
        <CheckboxField
          id="agree-terms"
          checked={agreeTerms}
          onChange={(e) => setAgreeTerms(e.target.checked)}
        >
          I agree to the Terms of Service.
        </CheckboxField>
        <CheckboxField
          id="agree-model"
          checked={agreeModel}
          onChange={(e) => setAgreeModel(e.target.checked)}
        >
          I understand NEXIS uses my selected local model or my own API key.
        </CheckboxField>
        <CheckboxField
          id="agree-mistakes"
          checked={agreeMistakes}
          onChange={(e) => setAgreeMistakes(e.target.checked)}
        >
          I understand NEXIS can make mistakes and important work should be checked.
        </CheckboxField>
      </div>

      {err && (
        <p style={{ margin: "14px 0 0", fontSize: "0.82rem", color: "#f87171" }}>{err}</p>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
        <button
          style={{ ...btnPrimary, opacity: loading ? 0.6 : 1 }}
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating…" : "Create Account"}
        </button>
        <button style={btnSecondary} onClick={onBack} disabled={loading}>
          ← Back
        </button>
      </div>
    </>
  );
}

function VerificationSentState({ email, onClose }) {
  return (
    <>
      <h2 style={{ margin: "0 0 14px", fontSize: "1.15rem", fontWeight: 700 }}>
        Verification email sent
      </h2>
      <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.7)", fontSize: "0.92rem" }}>
        Check your inbox for the verification link sent to:
      </p>
      <p style={{ margin: "0 0 28px", fontWeight: 600, color: "#7dd3fc", wordBreak: "break-all" }}>
        {email}
      </p>
      <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.5)", fontSize: "0.82rem" }}>
        Once verified, you can sign in from the header.
      </p>
      <button style={btnSecondary} onClick={onClose}>
        Close
      </button>
    </>
  );
}

function DuplicateEmailState({ email, onTryAnother }) {
  const [showReset, setShowReset] = useState(false);

  return (
    <>
      <h2 style={{ margin: "0 0 14px", fontSize: "1.1rem", fontWeight: 700 }}>
        Email already in use
      </h2>
      <p style={{ margin: "0 0 8px", color: "rgba(255,255,255,0.7)", fontSize: "0.92rem" }}>
        This email may already be linked to an account:
      </p>
      <p style={{ margin: "0 0 20px", fontWeight: 600, color: "#7dd3fc", wordBreak: "break-all" }}>
        {email}
      </p>
      <p style={{ margin: "0 0 24px", color: "rgba(255,255,255,0.55)", fontSize: "0.85rem" }}>
        Check for a typo or reset your password.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button style={btnPrimary} onClick={onTryAnother}>
          Try another email
        </button>
        <button style={btnSecondary} onClick={() => setShowReset(true)}>
          Reset Password
        </button>
      </div>

      {showReset && (
        <ResetPasswordOverlay
          onClose={() => setShowReset(false)}
          prefillEmail={email}
        />
      )}
    </>
  );
}

function GeneralErrorState({ message, onTryAgain, onClose }) {
  return (
    <>
      <h2 style={{ margin: "0 0 14px", fontSize: "1.1rem", fontWeight: 700 }}>
        Sign up failed
      </h2>
      <p style={{ margin: "0 0 24px", color: "#f87171", fontSize: "0.88rem" }}>
        {message}
      </p>
      <div style={{ display: "flex", gap: 10 }}>
        <button style={btnPrimary} onClick={onTryAgain}>
          Try again
        </button>
        <button style={btnSecondary} onClick={onClose}>
          Cancel
        </button>
      </div>
    </>
  );
}

// ── Main overlay ─────────────────────────────────────────────

export default function SignUpOverlay({ onClose, onSignUpSuccess, onGoToSignIn }) {
  // "step1" | "step2" | "sent" | "duplicate" | "error"
  const [view, setView] = useState("step1");
  const [credentials, setCredentials] = useState(null); // { email, password }
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Called when step 1 passes validation — move to step 2
  const handleStepOne = (creds) => {
    setCredentials(creds);
    setView("step2");
  };

  // Called when step 2 passes validation — actually create the account
  const handleSubmit = async (profileInfo) => {
    if (!credentials) return;
    setLoading(true);
    const { data, error } = await onSignUpSuccess(credentials.email, credentials.password, profileInfo);
    setLoading(false);
    setSubmittedEmail(credentials.email);

    console.log("Supabase signUp response:", data, error);

    // Always check active session first. Supabase may have silently signed the
    // user in (e.g. email confirmation disabled, or auto-confirm). If a session
    // exists, the user is already authenticated — close the overlay.
    const session = await getSession();
    if (session) {
      console.log("[Auth] session active after signUp — closing overlay");
      onClose();
      return;
    }

    if (error) {
      if (isDuplicateError(error.message)) {
        setView("duplicate");
      } else {
        setErrorMsg(error.message || "An unexpected error occurred.");
        setView("error");
      }
      return;
    }

    // Supabase returns a success-like response for existing emails but with
    // an empty identities array — treat that as a duplicate/existing account.
    const identities = data?.user?.identities;
    if (!identities || identities.length === 0) {
      setView("duplicate");
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
          maxWidth: 420,
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

        {/* Content by state */}
        {view === "step1" && (
          <StepOneState
            onNext={handleStepOne}
            onClose={onClose}
          />
        )}
        {view === "step2" && (
          <StepTwoState
            onSubmit={handleSubmit}
            onBack={() => setView("step1")}
            loading={loading}
          />
        )}
        {view === "sent" && (
          <VerificationSentState email={submittedEmail} onClose={onClose} />
        )}
        {view === "duplicate" && (
          <DuplicateEmailState
            email={submittedEmail}
            onTryAnother={() => setView("form")}
          />
        )}
        {view === "error" && (
          <GeneralErrorState
            message={errorMsg}
            onTryAgain={() => setView("form")}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
