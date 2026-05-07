// ============================================================
// ARC-NEXUS - HELP OVERLAY
// File: src/components/HelpOverlay.jsx
// Version: 002 (navigation outline + Local AI Setup section)
// ============================================================
// Two-column layout: sticky left nav TOC + scrollable content.
// Active section highlighted as user scrolls.
// Local AI Setup section uses user-first plain language
// matching the ModelConfig state machine wording exactly.
// Terminal / advanced content is hidden in collapsible sections.
// ============================================================

import React, { useState, useEffect } from "react";
import PageOverlay from "./PageOverlay";

// â”€â”€ Navigation items â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const NAV = [
  { id: "help-overview",        label: "Overview" },
  { id: "help-collect",         label: "Collect" },
  { id: "help-review",          label: "Review & Select" },
  { id: "help-create",          label: "Create Package" },
  { id: "help-refine",          label: "Refine" },
  { id: "help-local-ai",        label: "Local AI Setup",    accent: true },
  { id: "help-provider",        label: "Provider Mode" },
  { id: "help-limits",          label: "Projects & Limits" },
  { id: "help-troubleshooting", label: "Troubleshooting" },
  { id: "help-faq",             label: "FAQ" },
  { id: "help-about",           label: "About" },
];

// â”€â”€ Primitive components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionAnchor({ id }) {
  return <div id={id} style={{ scrollMarginTop: 24 }} />;
}

function SectionTitle({ children }) {
  return (
    <h2 style={{ fontSize: "1.05rem", fontWeight: 700, marginTop: 0, marginBottom: 10 }}>
      {children}
    </h2>
  );
}

function SubTitle({ children }) {
  return (
    <h3 style={{ fontSize: "0.92rem", fontWeight: 600, marginTop: 0, marginBottom: 6 }}>
      {children}
    </h3>
  );
}

function Step({ number, title, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--arc-accent)", flexShrink: 0 }}>
          {number}.
        </span>
        <SubTitle>{title}</SubTitle>
      </div>
      {children}
    </div>
  );
}

function FAQ({ q, a }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ fontWeight: 600, marginBottom: 4, marginTop: 0 }}>{q}</p>
      <p style={{ color: "rgba(255,255,255,0.58)", marginTop: 0, marginBottom: 0 }}>{a}</p>
    </div>
  );
}

function Collapsible({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 10, borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          all: "unset",
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "9px 14px",
          cursor: "pointer",
          fontSize: "0.8rem",
          color: "rgba(255,255,255,0.35)",
          background: "rgba(255,255,255,0.03)",
          userSelect: "none",
          boxSizing: "border-box",
        }}
      >
        <span style={{ fontSize: "0.7rem" }}>{open ? "â–¾" : "â–¸"}</span>
        {label}
      </button>
      {open && (
        <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.18)", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

const codeStyle = {
  background: "rgba(0,0,0,0.35)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 6,
  padding: "10px 14px",
  fontFamily: "monospace",
  fontSize: "0.82rem",
  overflowX: "auto",
  margin: "8px 0",
  whiteSpace: "pre",
};

// State explanation row for the Local AI section
function StateRow({ state, meaning, action }) {
  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1.1fr 1.2fr 1fr",
      gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.05)",
      alignItems: "start",
    }}>
      <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>{state}</p>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "rgba(255,255,255,0.48)", lineHeight: 1.4 }}>{meaning}</p>
      <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--arc-accent)", lineHeight: 1.4 }}>{action}</p>
    </div>
  );
}

// Troubleshooting problem block
function TroubleBlock({ title, children }) {
  return (
    <div style={{ marginBottom: 20, padding: "14px 16px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <p style={{ fontWeight: 600, fontSize: "0.9rem", margin: "0 0 8px" }}>{title}</p>
      {children}
    </div>
  );
}

// â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function HelpOverlay({ onClose }) {
  const [activeSection, setActiveSection] = useState("help-overview");

  // IntersectionObserver â€” highlight whichever section is topmost in viewport
  useEffect(() => {
    const visible = new Set();

    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        });
        for (const { id } of NAV) {
          if (visible.has(id)) {
            setActiveSection(id);
            break;
          }
        }
      },
      { threshold: 0.15 }
    );

    NAV.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    });

    return () => obs.disconnect();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <PageOverlay title="Help &amp; Documentation" onClose={onClose} maxWidth={1040}>

      {/* â”€â”€ Two-column layout â”€â”€ */}
      <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>

        {/* â”€â”€ Left nav â”€â”€ */}
        <nav style={{
          width: 168,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          alignSelf: "flex-start",
          paddingRight: 20,
        }}>
          <p style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.25)", margin: "0 0 10px", textTransform: "uppercase" }}>
            Contents
          </p>
          {NAV.map(({ id, label, accent }) => {
            const isActive = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                style={{
                  all: "unset",
                  display: "block",
                  width: "100%",
                  padding: "5px 10px",
                  marginBottom: 2,
                  borderRadius: 5,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  textAlign: "left",
                  fontWeight: isActive ? 600 : 400,
                  color: isActive
                    ? (accent ? "var(--arc-accent)" : "var(--arc-text)")
                    : (accent ? "rgba(var(--arc-accent-rgb, 99,202,183),0.65)" : "rgba(255,255,255,0.38)"),
                  background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
                  borderLeft: isActive ? "2px solid var(--arc-accent)" : "2px solid transparent",
                  transition: "all 0.12s ease",
                  lineHeight: 1.35,
                  boxSizing: "border-box",
                }}
              >
                {label}
              </button>
            );
          })}
        </nav>

        {/* â”€â”€ Right content â”€â”€ */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* â•â•â•â• OVERVIEW â•â•â•â• */}
          <SectionAnchor id="help-overview" />
          <div className="panel">
            <SectionTitle>What NEXIS Does</SectionTitle>
            <p style={{ marginTop: 0 }}>
              NEXIS helps you turn source material into structured, usable output.
            </p>
            <p style={{ marginBottom: 0 }}>
              A project holds your collected sources, package outputs, and refined versions.
              The workflow: collect sources â†’ review â†’ create a package â†’ refine if needed.
            </p>
          </div>

          {/* â•â•â•â• COLLECT â•â•â•â• */}
          <SectionAnchor id="help-collect" />
          <div className="panel">
            <SectionTitle>Collect</SectionTitle>
            <p style={{ marginTop: 0 }}>Add URLs, files, or images to a project.</p>
            <p style={{ marginBottom: 0 }}>
              NEXIS extracts usable text from each source and saves it under Raw Files.
              Raw text can be viewed, copied, renamed, selected, or deleted.
            </p>
          </div>

          {/* â•â•â•â• REVIEW & SELECT â•â•â•â• */}
          <SectionAnchor id="help-review" />
          <div className="panel">
            <SectionTitle>Review &amp; Select</SectionTitle>
            <p style={{ marginTop: 0 }}>Review saved raw text before creating a package.</p>
            <p style={{ marginBottom: 0 }}>
              Use the checkbox beside each raw item to choose whether it is included.
              Only checked raw items are used when creating a package.
            </p>
          </div>

          {/* â•â•â•â• CREATE PACKAGE â•â•â•â• */}
          <SectionAnchor id="help-create" />
          <div className="panel">
            <SectionTitle>Create Package</SectionTitle>
            <p style={{ marginTop: 0 }}>Choose one package to create from the selected raw items.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 12 }}>
              <div>
                <p style={{ fontWeight: 600, marginTop: 0, marginBottom: 8, fontSize: "0.88rem" }}>Summary Package includes:</p>
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: "2", fontSize: "0.88rem" }}>
                  <li>Outline</li>
                  <li>Timeline</li>
                  <li>Key Points</li>
                  <li>Summary</li>
                </ul>
              </div>
              <div>
                <p style={{ fontWeight: 600, marginTop: 0, marginBottom: 8, fontSize: "0.88rem" }}>Creator Package includes:</p>
                <ul style={{ margin: 0, paddingLeft: 20, lineHeight: "2", fontSize: "0.88rem" }}>
                  <li>Make Engaging</li>
                  <li>Hook Script</li>
                  <li>Dialogue Script</li>
                  <li>Titles &amp; Keywords</li>
                </ul>
              </div>
            </div>
          </div>

          {/* â•â•â•â• REFINE â•â•â•â• */}
          <SectionAnchor id="help-refine" />
          <div className="panel">
            <SectionTitle>Refine</SectionTitle>
            <p style={{ marginTop: 0 }}>
              After creating a package, you can refine any output by providing an instruction.
              The refined version is saved as a new output â€” the original is not replaced.
            </p>
          </div>

          {/* â•â•â•â• LOCAL AI SETUP â•â•â•â• */}
          <SectionAnchor id="help-local-ai" />
          <div className="panel">
            <SectionTitle>Local AI Setup</SectionTitle>

            {/* What / Why */}
            <div style={{ marginBottom: 24 }}>
              <SubTitle>What is local AI?</SubTitle>
              <p style={{ marginTop: 0, marginBottom: 10 }}>
                When you use Local AI mode, all processing happens on your own computer.
                Nothing is sent to any cloud service. Your writing stays private and
                works offline.
              </p>
              <p style={{ marginBottom: 0, fontSize: "0.88rem", color: "rgba(255,255,255,0.55)" }}>
                Local AI is the <strong style={{ color: "rgba(255,255,255,0.8)" }}>default and recommended</strong> mode
                in NEXIS. Provider/API mode is available but optional.
              </p>
            </div>

            {/* Two programs explained */}
            <div style={{ marginBottom: 24 }}>
              <SubTitle>The two programs you need</SubTitle>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontWeight: 700, margin: "0 0 6px", fontSize: "0.88rem", color: "var(--arc-accent)" }}>NEXIS Local Companion</p>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                    A small program you download once. It runs quietly in the background and lets NEXIS
                    communicate with your local AI. You only need to start it â€” NEXIS handles the rest.
                  </p>
                </div>
                <div style={{ padding: "12px 14px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p style={{ fontWeight: 700, margin: "0 0 6px", fontSize: "0.88rem" }}>Ollama</p>
                  <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                    A free, open-source program that runs AI models on your computer. NEXIS can open
                    Ollama and download models for you automatically â€” no terminal needed.
                  </p>
                </div>
              </div>

              {/* Flow diagram */}
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
                {["NEXIS (browser)", "â†’", "NEXIS Companion", "â†’", "Ollama", "â†’", "AI Model"].map((item, i) => (
                  item === "â†’" ? (
                    <span key={i} style={{ color: "rgba(255,255,255,0.25)", fontSize: "1rem" }}>â†’</span>
                  ) : (
                    <span key={i} style={{
                      padding: "4px 12px",
                      borderRadius: 16,
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      background: i === 0 ? "rgba(255,255,255,0.06)" : i === 2 ? "rgba(var(--arc-accent-rgb,99,202,183),0.12)" : i === 4 ? "rgba(255,255,255,0.06)" : "rgba(var(--arc-accent-rgb,99,202,183),0.18)",
                      color: (i === 2 || i === 6) ? "var(--arc-accent)" : "rgba(255,255,255,0.75)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}>
                      {item}
                    </span>
                  )
                ))}
              </div>
              <p style={{ textAlign: "center", fontSize: "0.74rem", color: "rgba(255,255,255,0.28)", margin: "8px 0 0" }}>
                You never need to understand the details â€” NEXIS manages this flow for you.
              </p>
            </div>

            {/* First-time setup */}
            <div style={{ marginBottom: 24 }}>
              <SubTitle>First-time setup (two steps)</SubTitle>
              <Step number="1" title="Download and run the NEXIS Local Companion">
                <p style={{ marginTop: 0, marginBottom: 6 }}>
                  Download <strong>nexis-bridge.exe</strong> (Windows) or <strong>nexis-bridge</strong> (Mac/Linux)
                  and double-click it. A small window will appear â€” keep it open while using NEXIS.
                </p>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}>
                  You only need to do this once. After that, start it whenever you want to use local AI.
                </p>
              </Step>
              <Step number="2" title='Open AI Model Settings and click "Recheck"'>
                <p style={{ marginTop: 0, marginBottom: 0 }}>
                  Go to <strong>AI Model Settings</strong> in NEXIS. If Ollama is not installed,
                  NEXIS will show an "Install Ollama" button. If it is installed but not open,
                  NEXIS will offer to start it. If no model is downloaded, NEXIS will offer to
                  download one. Follow the buttons â€” no terminal needed.
                </p>
              </Step>
            </div>

            {/* State machine table */}
            <div style={{ marginBottom: 20 }}>
              <SubTitle>What NEXIS is telling you</SubTitle>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", margin: "0 0 10px" }}>
                Each message in AI Model Settings has a specific meaning and a next step.
              </p>

              {/* Table header */}
              <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr 1fr", gap: 12, padding: "6px 0 8px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>NEXIS shows</p>
                <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>What it means</p>
                <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em" }}>What to click</p>
              </div>

              <StateRow
                state="Checking your local AIâ€¦"
                meaning="NEXIS is detecting the Companion, Ollama, and available models."
                action="Wait â€” this takes a few seconds."
              />
              <StateRow
                state="NEXIS Companion is not running."
                meaning="The Companion program is not open on your computer."
                action="Download NEXIS Companion, then run it, then click Recheck."
              />
              <StateRow
                state="Ollama is not installed."
                meaning="The Ollama program needs to be downloaded and installed."
                action='Click "Install Ollama" â€” NEXIS will open the download page.'
              />
              <StateRow
                state="Ollama is installed but not open."
                meaning="Ollama is on your computer but not currently running."
                action='Click "Start Ollama" â€” NEXIS will open it for you automatically.'
              />
              <StateRow
                state="Ollama is startingâ€¦"
                meaning="NEXIS opened Ollama and is waiting for it to be ready."
                action="Wait â€” usually takes 5â€“20 seconds."
              />
              <StateRow
                state="Ollama appears to be stuck."
                meaning="Ollama was started but did not become ready in time."
                action='Click "Restart Ollama" â€” NEXIS will close and reopen it.'
              />
              <StateRow
                state="No AI model found."
                meaning="Ollama is running but no AI model has been downloaded yet."
                action='Click "Download Recommended Model" â€” NEXIS handles the download.'
              />
              <StateRow
                state="Downloading AI modelâ€¦ X%"
                meaning="A model is being downloaded. This may take several minutes."
                action="Wait for the download to finish. You can cancel if needed."
              />
              <StateRow
                state="Download failed."
                meaning="The download was interrupted or Ollama lost connection."
                action='Click "Try Again". Make sure Ollama is still open.'
              />
              <StateRow
                state="Models could not be checked right now."
                meaning="You had a working setup before, but the Companion is not reachable at the moment."
                action='Click "Recheck" or "Restart Ollama".'
              />
              <StateRow
                state="Local AI is ready."
                meaning="Everything is connected. Select a model and click Save."
                action='Select your model and click "Save".'
              />
            </div>

            {/* What NEXIS automates */}
            <div style={{ marginBottom: 8 }}>
              <SubTitle>What NEXIS handles automatically</SubTitle>
              <ul style={{ margin: "0 0 4px", paddingLeft: 20, lineHeight: "2", fontSize: "0.88rem" }}>
                <li>Detecting whether Ollama is installed and where</li>
                <li>Starting Ollama with one button click</li>
                <li>Restarting a hung Ollama</li>
                <li>Downloading the recommended AI model</li>
                <li>Showing download progress</li>
                <li>Migrating old settings automatically</li>
              </ul>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", margin: "8px 0 0" }}>
                You should not need to open a terminal or edit any settings manually.
                Advanced controls are available under the Advanced section in AI Model Settings
                if you ever need them.
              </p>
            </div>

            {/* Collapsible: what cannot be automated */}
            <Collapsible label="Things NEXIS cannot do for you (one-time only)">
              <ul style={{ margin: 0, paddingLeft: 20, lineHeight: "1.9", fontSize: "0.82rem", color: "rgba(255,255,255,0.55)" }}>
                <li><strong style={{ color: "rgba(255,255,255,0.75)" }}>Install Ollama</strong> â€” requires an installer that needs system permission. NEXIS provides the download link.</li>
                <li><strong style={{ color: "rgba(255,255,255,0.75)" }}>Start the NEXIS Companion itself</strong> â€” you must run it once per session. After the first time, it is quick.</li>
                <li><strong style={{ color: "rgba(255,255,255,0.75)" }}>Install GPU drivers</strong> â€” if your computer has a GPU, drivers are managed by the GPU manufacturer.</li>
              </ul>
            </Collapsible>
          </div>

          {/* â•â•â•â• PROVIDER MODE â•â•â•â• */}
          <SectionAnchor id="help-provider" />
          <div className="panel">
            <SectionTitle>Provider Mode</SectionTitle>
            <p style={{ marginTop: 0 }}>
              As an alternative to Local AI, you can configure a provider API key
              (such as OpenAI or Anthropic) in AI Model Settings.
            </p>
            <p style={{ marginBottom: 0, fontSize: "0.88rem", color: "rgba(255,255,255,0.55)" }}>
              Provider mode sends your text to the provider's cloud servers. The provider's
              usage costs apply â€” NEXIS does not cover them. Local AI mode is recommended
              for privacy and offline use.
            </p>
          </div>

          {/* â•â•â•â• PROJECTS & LIMITS â•â•â•â• */}
          <SectionAnchor id="help-limits" />
          <div className="panel">
            <SectionTitle>Projects &amp; Limits</SectionTitle>
            <p style={{ marginTop: 0 }}>Projects organise your work.</p>
            <p style={{ marginBottom: 8 }}>Each project contains:</p>
            <ul style={{ margin: "0 0 12px", paddingLeft: 20, lineHeight: "2", fontSize: "0.88rem" }}>
              <li>Raw Files</li>
              <li>Package Outputs</li>
              <li>Refined Outputs</li>
            </ul>
            <p style={{ marginBottom: 0 }}>Your account level may limit the number of active projects available.</p>
          </div>

          {/* â•â•â•â• TROUBLESHOOTING â•â•â•â• */}
          <SectionAnchor id="help-troubleshooting" />
          <div className="panel">
            <SectionTitle>Troubleshooting</SectionTitle>
            <p style={{ marginTop: 0, marginBottom: 16, fontSize: "0.88rem", color: "rgba(255,255,255,0.55)" }}>
              Follow these steps in order. Most issues resolve at step 1 or 2.
            </p>

            <TroubleBlock title='1. "NEXIS Companion is not running."'>
              <p style={{ margin: "0 0 6px", fontSize: "0.85rem" }}>
                Start the NEXIS Local Companion by double-clicking <strong>nexis-bridge.exe</strong>
                (Windows) or <strong>./nexis-bridge</strong> (Mac/Linux).
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}>
                Keep the window open while you use NEXIS. You can minimise it.
              </p>
            </TroubleBlock>

            <TroubleBlock title='2. "Ollama is not installed."'>
              <p style={{ margin: "0 0 6px", fontSize: "0.85rem" }}>
                Click <strong>Install Ollama</strong> in AI Model Settings. This opens
                the official Ollama download page. Install it, then click Recheck.
              </p>
            </TroubleBlock>

            <TroubleBlock title='3. "Ollama is installed but not open."'>
              <p style={{ margin: "0 0 6px", fontSize: "0.85rem" }}>
                Click <strong>Start Ollama</strong> â€” NEXIS will open it automatically.
                If it does not respond within 20 seconds, click <strong>Restart Ollama</strong>.
              </p>
            </TroubleBlock>

            <TroubleBlock title='4. "No AI model found."'>
              <p style={{ margin: "0 0 6px", fontSize: "0.85rem" }}>
                Click <strong>Download Recommended Model</strong>. NEXIS will download
                llama3.1:8b (~4.7 GB). This takes several minutes depending on your connection.
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}>
                Make sure Ollama is open during the download.
              </p>
            </TroubleBlock>

            <TroubleBlock title='5. Download was interrupted or failed.'>
              <p style={{ margin: "0 0 6px", fontSize: "0.85rem" }}>
                Click <strong>Try Again</strong>. Ollama resumes interrupted downloads where
                they left off â€” it does not restart from zero.
              </p>
              <p style={{ margin: 0, fontSize: "0.82rem", color: "rgba(255,255,255,0.45)" }}>
                If it keeps failing, make sure Ollama is still open and your internet is connected.
              </p>
            </TroubleBlock>

            <TroubleBlock title='6. "Models could not be checked right now."'>
              <p style={{ margin: "0 0 6px", fontSize: "0.85rem" }}>
                You had a working setup before, but something is temporarily unavailable.
                Click <strong>Recheck</strong>. If that does not work, click <strong>Restart Ollama</strong>.
              </p>
            </TroubleBlock>

            <TroubleBlock title="7. Local AI still not responding after all steps.">
              <p style={{ margin: "0 0 8px", fontSize: "0.85rem" }}>
                Try this sequence:
              </p>
              <ol style={{ margin: "0 0 8px", paddingLeft: 20, lineHeight: "1.9", fontSize: "0.85rem" }}>
                <li>Close the NEXIS Companion window and reopen it.</li>
                <li>In AI Model Settings, click <strong>Recheck</strong>.</li>
                <li>If Ollama shows as stuck, click <strong>Restart Ollama</strong>.</li>
                <li>If the problem persists, restart your computer and try again.</li>
              </ol>
              <Collapsible label="Advanced â€” manual commands (only if asked by support)">
                <p style={{ margin: "0 0 8px", fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>
                  Open a terminal from AI Model Settings â†’ Advanced â†’ Troubleshooting, or
                  open Command Prompt manually.
                </p>
                <p style={{ margin: "0 0 4px", fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>
                  Check if Ollama is running:
                </p>
                <pre style={codeStyle}>ollama list</pre>
                <p style={{ margin: "8px 0 4px", fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>
                  Start Ollama manually:
                </p>
                <pre style={codeStyle}>ollama serve</pre>
                <p style={{ margin: "8px 0 4px", fontSize: "0.78rem", color: "rgba(255,255,255,0.35)" }}>
                  Download the recommended model manually:
                </p>
                <pre style={codeStyle}>ollama pull llama3.1:8b</pre>
              </Collapsible>
            </TroubleBlock>

            {/* Provider troubleshooting */}
            <div style={{ marginTop: 20 }}>
              <SubTitle>Provider mode not working?</SubTitle>
              <ol style={{ margin: 0, paddingLeft: 20, lineHeight: "2", fontSize: "0.85rem" }}>
                <li>Check that your API key is correct in AI Model Settings.</li>
                <li>Confirm your provider account has available credits.</li>
                <li>Check the provider's status page for outages.</li>
              </ol>
            </div>
          </div>

          {/* â•â•â•â• FAQ â•â•â•â• */}
          <SectionAnchor id="help-faq" />
          <div className="panel">
            <SectionTitle>Frequently Asked Questions</SectionTitle>

            <FAQ
              q="Does NEXIS save my work?"
              a="Yes. Projects, raw text, outputs, and refined outputs are saved and available when you return."
            />
            <FAQ
              q="Does local AI send my text anywhere?"
              a="No. When using Local AI mode, all processing happens on your computer. Nothing leaves your machine."
            />
            <FAQ
              q="Do I need to use the terminal to set up local AI?"
              a="No. NEXIS handles Ollama detection, startup, and model downloads automatically using the NEXIS Companion."
            />
            <FAQ
              q="Can I use local AI without an internet connection?"
              a="Yes. Once the NEXIS Companion is running and a model is downloaded, local AI works offline."
            />
            <FAQ
              q="What model does NEXIS recommend?"
              a="llama3.1:8b. It is a good balance of quality and speed for most computers. NEXIS will offer to download it for you."
            />
            <FAQ
              q="Can I delete raw files or outputs?"
              a="Yes. Raw files and outputs can be deleted with confirmation."
            />
            <FAQ
              q="Can I choose what gets included in a package?"
              a="Yes. Only checked raw items are included when creating a package."
            />
            <FAQ
              q="Does NEXIS replace the original output when refining?"
              a="No. Refined work is saved as a new output."
            />
            <FAQ
              q="What is the NEXIS Companion and do I need it?"
              a="The Companion is a small background program that lets the NEXIS website talk to Ollama on your machine. You need it for Local AI mode. Provider mode does not require it."
            />
          </div>

          {/* â•â•â•â• ABOUT â•â•â•â• */}
          <SectionAnchor id="help-about" />
          <div className="panel">
            <SectionTitle>About NEXIS</SectionTitle>
            <p style={{ marginTop: 0 }}>
              NEXIS is a project-based system for collecting source material, converting it into
              structured outputs, and refining those outputs into usable work.
            </p>
            <p style={{ marginBottom: 0, color: "rgba(255,255,255,0.45)", fontSize: "0.85rem" }}>
              NEXIS is AI-assisted. Check important outputs before use.
            </p>
          </div>

        </div>{/* end right content */}
      </div>{/* end two-column layout */}
    </PageOverlay>
  );
}
