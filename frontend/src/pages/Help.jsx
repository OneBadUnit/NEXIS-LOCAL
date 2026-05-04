// ============================================================
// ARC-NEXUS - HELP PAGE
// File: src/pages/Help.jsx
// Version: 003 (Current workflow — NEXIS project flow)
// ============================================================

import React from "react";

const SectionTitle = ({ children }) => (
  <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginTop: 0, marginBottom: 10 }}>
    {children}
  </h2>
);

const SubTitle = ({ children }) => (
  <h3 style={{ fontSize: "0.95rem", fontWeight: 600, marginTop: 0, marginBottom: 8 }}>
    {children}
  </h3>
);

const Step = ({ number, title, children }) => (
  <div style={{ marginBottom: 24 }}>
    <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
      <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--arc-accent)" }}>
        {number}.
      </span>
      <SubTitle>{title}</SubTitle>
    </div>
    {children}
  </div>
);

const FAQ = ({ q, a }) => (
  <div style={{ marginBottom: 20 }}>
    <p style={{ fontWeight: 600, marginBottom: 4 }}>{q}</p>
    <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 0 }}>{a}</p>
  </div>
);

export default function Help() {
  return (
    <div className="module-container">
      <h1 className="module-title" style={{ fontSize: "1.8rem", marginBottom: 32 }}>
        Help &amp; Documentation
      </h1>

      {/* WHAT NEXIS DOES */}
      <div className="panel">
        <SectionTitle>What NEXIS Does</SectionTitle>
        <p style={{ marginTop: 0 }}>
          NEXIS helps you turn source material into structured, usable output.
        </p>
        <p>
          A project holds your collected source text, package outputs, and refined versions.
          NEXIS is designed around a simple workflow: collect sources, review what was captured,
          select what to include, create a package, then refine the result if needed.
        </p>
      </div>

      {/* HOW IT WORKS */}
      <div className="panel">
        <SectionTitle>How It Works</SectionTitle>

        <Step number="1" title="Collect Sources">
          <p style={{ marginTop: 0 }}>Add URLs, files, or pictures to a project.</p>
          <p>
            NEXIS extracts usable text from each source and saves it under Raw Files.
            Raw text can be viewed, copied, renamed, selected, or deleted.
          </p>
        </Step>

        <Step number="2" title="Review & Select Raw">
          <p style={{ marginTop: 0 }}>Review the saved raw text before creating a package.</p>
          <p>
            Use the checkbox beside each raw item to choose whether it should be included.
            Only selected raw items are used when creating a package.
          </p>
        </Step>

        <Step number="3" title="Create Package">
          <p style={{ marginTop: 0 }}>Choose one package to create from the selected raw items.</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
            <div>
              <p style={{ fontWeight: 600, marginTop: 0, marginBottom: 6 }}>Summary Package includes:</p>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: "2" }}>
                <li>Outline</li>
                <li>Timeline</li>
                <li>Key Points</li>
                <li>Summary</li>
              </ul>
            </div>
            <div>
              <p style={{ fontWeight: 600, marginTop: 0, marginBottom: 6 }}>Creator Package includes:</p>
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: "2" }}>
                <li>Make Engaging</li>
                <li>Hook Script</li>
                <li>Dialogue Script</li>
                <li>Titles &amp; Keywords</li>
              </ul>
            </div>
          </div>
        </Step>

        <Step number="4" title="Review Output">
          <p style={{ marginTop: 0 }}>Created packages are saved under Outputs.</p>
          <p>
            Outputs can be viewed, copied, refined, or deleted. Original outputs are not changed
            unless you intentionally save a new refined version.
          </p>
        </Step>
      </div>

      {/* REFINE */}
      <div className="panel">
        <SectionTitle>Refine</SectionTitle>
        <p style={{ marginTop: 0 }}>
          Refine lets you improve an existing output with your own instructions.
        </p>
        <p style={{ marginBottom: 8 }}>Examples:</p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 20, lineHeight: "2" }}>
          <li>Make this more concise</li>
          <li>Rewrite this for a YouTube description</li>
          <li>Make the hook stronger</li>
          <li>Add more detail</li>
        </ul>
        <p>Refined results can be saved as new outputs.</p>
      </div>

      {/* MODEL SETUP */}
      <div className="panel">
        <SectionTitle>Model Setup</SectionTitle>
        <p style={{ marginTop: 0 }}>
          NEXIS requires a configured model before packages can be created.
        </p>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Local Model:</p>
        <p style={{ marginTop: 0, marginBottom: 16 }}>
          Use a model running on your own computer.
        </p>
        <p style={{ fontWeight: 600, marginBottom: 4 }}>Provider Key:</p>
        <p style={{ marginTop: 0, marginBottom: 16 }}>
          Use your own provider account and key.
        </p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", margin: 0 }}>
          NEXIS does not automatically call a hosted model unless you configure one.
          Whoever owns the model or provider account is responsible for any usage costs.
        </p>
      </div>

      {/* PROJECTS AND LIMITS */}
      <div className="panel">
        <SectionTitle>Projects and Limits</SectionTitle>
        <p style={{ marginTop: 0 }}>Projects organize your work.</p>
        <p style={{ marginBottom: 8 }}>Each project contains:</p>
        <ul style={{ margin: "0 0 12px", paddingLeft: 20, lineHeight: "2" }}>
          <li>Raw Files</li>
          <li>Package Outputs</li>
          <li>Refined Outputs</li>
        </ul>
        <p>Your account level may limit the number of active projects available.</p>
      </div>

      {/* IMPORTANT NOTE */}
      <div
        className="panel"
        style={{ borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.05)" }}
      >
        <SectionTitle>Important Note</SectionTitle>
        <p style={{ marginTop: 0 }}>
          NEXIS is driven by your input. NEXIS can make mistakes. Check important work.
        </p>
      </div>

      {/* FAQ */}
      <div className="panel">
        <SectionTitle>Frequently Asked Questions</SectionTitle>

        <FAQ
          q="Does NEXIS save my work?"
          a="Yes. Projects, raw text, outputs, and refined outputs are saved so you can return to them later."
        />
        <FAQ
          q="Can I delete raw files or outputs?"
          a="Yes. Raw files and outputs can be deleted with confirmation."
        />
        <FAQ
          q="Can I choose what gets included in a package?"
          a="Yes. Only checked raw items are included."
        />
        <FAQ
          q="Does NEXIS replace the original output when refining?"
          a="No. Refined work is saved as a new output."
        />
        <FAQ
          q="Does NEXIS provide the AI model?"
          a="NEXIS can connect to a configured model. This may be a local model or your own provider account."
        />
      </div>

      {/* ABOUT */}
      <div className="panel">
        <SectionTitle>About NEXIS</SectionTitle>
        <p style={{ marginTop: 0 }}>
          NEXIS is a project-based system for collecting source material, converting it into
          structured outputs, and refining those outputs into usable work.
        </p>
      </div>
    </div>
  );
}
