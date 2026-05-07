// ============================================================
// ARC-NEXUS - SETUP OVERLAY
// File: src/components/SetupOverlay.jsx
// Version: 001
// ============================================================
// Full-screen onboarding overlay explaining local model setup
// and API usage options.
// ============================================================

import React from "react";
import PageOverlay from "./PageOverlay";

// ── Shared primitives ───────────────────────────────────────

const SectionHeading = ({ icon, children }) => (
  <h2
    style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontSize: "1.15rem",
      fontWeight: 700,
      marginTop: 0,
      marginBottom: 20,
      color: "var(--arc-text)",
    }}
  >
    {icon && <span style={{ fontSize: "1.1rem" }}>{icon}</span>}
    {children}
  </h2>
);

const StepHeading = ({ number, children }) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      gap: 10,
      marginBottom: 10,
      marginTop: 24,
    }}
  >
    <span
      style={{
        fontSize: "0.85rem",
        fontWeight: 700,
        color: "var(--arc-accent, #38bdf8)",
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        flexShrink: 0,
      }}
    >
      Step {number} —
    </span>
    <span style={{ fontWeight: 600, fontSize: "0.95rem" }}>{children}</span>
  </div>
);

const CodeBlock = ({ children }) => (
  <pre
    style={{
      background: "rgba(0,0,0,0.45)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8,
      padding: "12px 16px",
      margin: "10px 0",
      fontFamily: "'Courier New', Courier, monospace",
      fontSize: "0.92rem",
      color: "#7dd3fc",
      overflowX: "auto",
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
    }}
  >
    {children}
  </pre>
);

const Divider = () => (
  <hr
    style={{
      border: "none",
      borderTop: "1px solid rgba(255,255,255,0.07)",
      margin: "32px 0",
    }}
  />
);

const Label = ({ children }) => (
  <p
    style={{
      fontSize: "0.82rem",
      fontWeight: 700,
      textTransform: "uppercase",
      letterSpacing: "0.08em",
      color: "var(--arc-accent, #38bdf8)",
      margin: "0 0 6px",
    }}
  >
    {children}
  </p>
);

// ── Component ───────────────────────────────────────────────

export default function SetupOverlay({ onClose }) {
  return (
    <PageOverlay title="Setup" onClose={onClose}>

      {/* ── LOCAL MODEL SETUP ─────────────────────────────── */}
      <div className="panel">
        <SectionHeading icon="🖥">LOCAL MODEL SETUP</SectionHeading>

        <Label>What this is</Label>
        <p style={{ marginTop: 0, marginBottom: 24 }}>
          Run AI on your own computer. No monthly cost.
        </p>

        <StepHeading number={1}>Install Ollama</StepHeading>
        <p style={{ marginTop: 0, marginBottom: 4 }}>
          Download Ollama from:
        </p>
        <p style={{ marginTop: 0, marginBottom: 4 }}>
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--arc-accent, #38bdf8)" }}
          >
            https://ollama.com
          </a>
        </p>
        <p style={{ marginTop: 8, marginBottom: 0 }}>
          Install it like a normal program.
        </p>

        <StepHeading number={2}>Open Command Prompt</StepHeading>
        <ul style={{ margin: "0 0 0", paddingLeft: 22, lineHeight: "2.2", marginTop: 4 }}>
          <li>Press Windows Key</li>
          <li>Type: <code style={{ fontFamily: "monospace", color: "#7dd3fc" }}>cmd</code></li>
          <li>Press Enter</li>
        </ul>

        <StepHeading number={3}>Run the Model</StepHeading>
        <p style={{ marginTop: 0, marginBottom: 4 }}>Type or paste this:</p>
        <CodeBlock>ollama run llama3</CodeBlock>
        <p style={{ marginTop: 4, marginBottom: 0 }}>Press Enter</p>

        <div
          style={{
            marginTop: 20,
            padding: "14px 16px",
            background: "rgba(255,255,255,0.03)",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <Label>What happens</Label>
          <ul style={{ margin: 0, paddingLeft: 22, lineHeight: "2.2", marginTop: 4 }}>
            <li>It will download the model (first time only — may take a few minutes)</li>
            <li>Then it will start responding in the window</li>
          </ul>
          <p style={{ marginTop: 12, marginBottom: 0 }}>
            When you see it respond, it's working
          </p>
        </div>

        <StepHeading number={4}>Confirm it's installed</StepHeading>
        <p style={{ marginTop: 0, marginBottom: 4 }}>Type:</p>
        <CodeBlock>ollama list</CodeBlock>
        <p style={{ marginTop: 4, marginBottom: 4 }}>Press Enter</p>
        <p style={{ marginTop: 12, marginBottom: 4 }}>You should see something like:</p>
        <CodeBlock>{`NAME        SIZE\nllama3      4.0 GB`}</CodeBlock>
        <p style={{ marginTop: 8, marginBottom: 4 }}>
          If you see llama3, you're good
        </p>
        <p style={{ marginTop: 4, marginBottom: 4 }}>
          If you don't see it, run again:
        </p>
        <CodeBlock>ollama run llama3</CodeBlock>

        <div
          style={{
            marginTop: 24,
            padding: "14px 16px",
            background: "rgba(56,189,248,0.05)",
            borderRadius: 8,
            border: "1px solid rgba(56,189,248,0.18)",
          }}
        >
          <p style={{ margin: 0, fontWeight: 600 }}>Done</p>
          <p style={{ margin: "8px 0 0", color: "rgba(255,255,255,0.65)" }}>
            You can close the Command Prompt. Return to NEXIS and use your model.
          </p>
        </div>
      </div>

      <Divider />

      {/* ── OTHER WAYS ───────────────────────────────────────── */}
      <div className="panel">
        <SectionHeading>Other Ways to Run NEXIS</SectionHeading>

        <div style={{ marginBottom: 28 }}>
          <p style={{ fontWeight: 700, fontSize: "1rem", marginTop: 0, marginBottom: 6 }}>
            🌐 Use an API
          </p>
          <p style={{ marginTop: 0, marginBottom: 8 }}>
            An Application Programming Interface (API) lets you use powerful online AI models
            without running them on your computer.
          </p>
          <p style={{ marginTop: 0, marginBottom: 8 }}>
            You pay only for what you use (usually a few cents per task).
          </p>
          <p style={{ marginTop: 0, marginBottom: 0 }}>
            If you already have an API key, you can enter it in the Workspace.
          </p>
        </div>

        <Divider />

        <div>
          <p style={{ fontWeight: 700, fontSize: "1rem", marginTop: 0, marginBottom: 6 }}>
            ⚡ Hybrid <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.55)", fontSize: "0.88rem" }}>(Recommended)</span>
          </p>
          <ul style={{ margin: 0, paddingLeft: 22, lineHeight: "2.2" }}>
            <li>Use local for everyday tasks</li>
            <li>Use API for higher quality results</li>
          </ul>
        </div>
      </div>

    </PageOverlay>
  );
}
