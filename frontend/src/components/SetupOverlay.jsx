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
    </div>
        {/* LOCAL MODEL SETUP */}
      <div className="panel">
        <SectionTitle>Local Model Setup</SectionTitle>
        <p style={{ marginTop: 0 }}>
          Use a model running on your own computer. Local AI processing happens entirely on your own machine.
        </p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", margin: "0 0 28px" }}>
          NEXIS can connect to your local Ollama from the hosted site. Your browser communicates
          with Ollama directly — no data leaves your computer.
        </p>

        {/* Windows */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: "0 0 16px", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            Windows
          </p>

          <Step number="1" title="Install Ollama">
            <p style={{ marginTop: 0 }}>
              Download and install Ollama from{" "}
              <a href="https://ollama.com/download" target="_blank" rel="noreferrer" style={{ color: "var(--arc-accent)" }}>
                ollama.com/download
              </a>
              . Once installed, Ollama runs in the background automatically.
            </p>
          </Step>

          <Step number="2" title="Open Command Prompt">
            <p style={{ marginTop: 0 }}>
              Press <strong>Win + R</strong>, type <code>cmd</code>, and press Enter.
            </p>
          </Step>

          <Step number="3" title="Download and Run a Model">
            <p style={{ marginTop: 0 }}>Run:</p>
            <pre style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.82rem", overflowX: "auto", margin: "8px 0 8px" }}>ollama run llama3.1:8b</pre>
            <p style={{ margin: 0 }}>Ollama will download and start the model. This may take a few minutes the first time.</p>
          </Step>

          <Step number="4" title="Confirm Installed Models">
            <p style={{ marginTop: 0 }}>To see all downloaded models, run:</p>
            <pre style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.82rem", overflowX: "auto", margin: "8px 0 8px" }}>ollama list</pre>
          </Step>

          <Step number="5" title="Return to NEXIS and Detect Models">
            <p style={{ marginTop: 0 }}>
              Go to <strong>Settings &#8594; Model</strong> in NEXIS and click <strong>Detect Models</strong>.
              NEXIS will find models running on your computer.
            </p>
          </Step>

          <Step number="6" title="Select Your Model">
            <p style={{ marginTop: 0, marginBottom: 0 }}>
              Once models are detected, select the one you want to use from the dropdown.
              NEXIS will use that model for all package creation and refine operations.
            </p>
          </Step>
        </div>

        {/* Mac */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: "0 0 16px", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            Mac
          </p>

          <Step number="1" title="Download and Install Ollama">
            <p style={{ marginTop: 0 }}>
              Visit{" "}
              <a href="https://ollama.com" target="_blank" rel="noreferrer" style={{ color: "var(--arc-accent)" }}>
                ollama.com
              </a>
              {" "}and download the Mac installer. Open the downloaded file and follow the installation steps.
            </p>
          </Step>

          <Step number="2" title="Open Terminal">
            <p style={{ marginTop: 0 }}>
              Open <strong>Terminal</strong> from Applications &#8594; Utilities, or press <strong>Cmd + Space</strong> and search for Terminal.
            </p>
          </Step>

          <Step number="3" title="Download and Run a Model">
            <p style={{ marginTop: 0 }}>Run:</p>
            <pre style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.82rem", overflowX: "auto", margin: "8px 0 8px" }}>ollama run llama3.1:8b</pre>
            <p style={{ margin: 0 }}>Ollama will download and start the model. This may take a few minutes the first time.</p>
          </Step>

          <Step number="4" title="Confirm Installed Models">
            <p style={{ marginTop: 0 }}>To see all downloaded models, run:</p>
            <pre style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.82rem", overflowX: "auto", margin: "8px 0 8px" }}>ollama list</pre>
          </Step>

          <Step number="5" title="Return to NEXIS and Detect Models">
            <p style={{ marginTop: 0 }}>
              Go to <strong>Settings &#8594; Model</strong> in NEXIS and click <strong>Detect Models</strong>.
              NEXIS will find models running on your computer.
            </p>
          </Step>

          <Step number="6" title="Select Your Model">
            <p style={{ marginTop: 0, marginBottom: 0 }}>
              Once models are detected, select the one you want to use from the dropdown.
              NEXIS will use that model for all package creation and refine operations.
            </p>
          </Step>
        </div>

        {/* Linux */}
        <div>
          <p style={{ fontWeight: 700, fontSize: "0.95rem", margin: "0 0 16px", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            Linux
          </p>

          <Step number="1" title="Open Terminal">
            <p style={{ marginTop: 0 }}>
              Open a terminal using your desktop environment or press <strong>Ctrl + Alt + T</strong>.
            </p>
          </Step>

          <Step number="2" title="Install Ollama">
            <p style={{ marginTop: 0 }}>Run the official install command:</p>
            <pre style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.82rem", overflowX: "auto", margin: "8px 0 8px" }}>curl -fsSL https://ollama.com/install.sh | sh</pre>
          </Step>

          <Step number="3" title="Download and Run a Model">
            <p style={{ marginTop: 0 }}>Run:</p>
            <pre style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.82rem", overflowX: "auto", margin: "8px 0 8px" }}>ollama run llama3.1:8b</pre>
            <p style={{ margin: 0 }}>Ollama will download and start the model. This may take a few minutes the first time.</p>
          </Step>

          <Step number="4" title="Confirm Installed Models">
            <p style={{ marginTop: 0 }}>To see all downloaded models, run:</p>
            <pre style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.82rem", overflowX: "auto", margin: "8px 0 8px" }}>ollama list</pre>
          </Step>

          <Step number="5" title="Return to NEXIS and Detect Models">
            <p style={{ marginTop: 0 }}>
              Go to <strong>Settings &#8594; Model</strong> in NEXIS and click <strong>Detect Models</strong>.
              NEXIS will find models running on your computer.
            </p>
          </Step>

          <Step number="6" title="Select Your Model">
            <p style={{ marginTop: 0, marginBottom: 0 }}>
              Once models are detected, select the one you want to use from the dropdown.
              NEXIS will use that model for all package creation and refine operations.
            </p>
          </Step>
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
