// ============================================================
// ARC-NEXUS - HELP OVERLAY
// File: src/components/HelpOverlay.jsx
// Version: 001 (converted from page to overlay)
// ============================================================
// Wraps Help content in the shared PageOverlay shell.
// ============================================================

import React from "react";
import PageOverlay from "./PageOverlay";

// ── Shared primitives ───────────────────────────────────────

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

// ── Component ───────────────────────────────────────────────

export default function HelpOverlay({ onClose }) {
  return (
    <PageOverlay title="Help &amp; Documentation" onClose={onClose}>

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

        <Step number="2" title="Review &amp; Select Raw">
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

        <Step number="4" title="Refine Output">
          <p style={{ marginTop: 0 }}>
            After creating a package, you can refine any output by providing an instruction.
            The refined version is saved as a new output.
          </p>
        </Step>
      </div>

      
      {/* IF DETECT MODELS FAILS */}
      <div className="panel">
        <SectionTitle>If Detect Models Fails</SectionTitle>
        <p style={{ marginTop: 0 }}>Try these steps in order:</p>

        <Step number="1" title="Restart Ollama">
          <p style={{ marginTop: 0 }}>
            Fully close Ollama — on Windows, right-click the Ollama icon in the system tray and choose Quit.
            Then reopen Ollama.
          </p>
        </Step>

        <Step number="2" title="Restart Your Browser">
          <p style={{ marginTop: 0 }}>
            Close all browser windows completely, then reopen NEXIS and try Detect Models again.
          </p>
        </Step>

        <Step number="3" title="Verify Ollama Is Running">
          <p style={{ marginTop: 0 }}>Open a new browser tab and visit:</p>
          <pre style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.82rem", overflowX: "auto", margin: "8px 0 8px" }}>http://localhost:11434/api/tags</pre>
          <p style={{ margin: 0 }}>
            If you see a list of models, Ollama is running. If you see an error, Ollama is not
            running — start it and try again.
          </p>
        </Step>

        <Step number="4" title="Allow NEXIS in Ollama Origins (Hosted Site)">
          <p style={{ marginTop: 0 }}>
            If you are using NEXIS from the hosted site and Ollama is still not responding,
            your browser is blocking the connection. Ollama only accepts requests from specific
            origins by default.
          </p>
          <p>Run this command in Command Prompt:</p>
          <pre style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.82rem", overflowX: "auto", margin: "8px 0 8px", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>{`setx OLLAMA_ORIGINS "https://nexis-psi.vercel.app,http://localhost:3000,http://127.0.0.1:3000"`}</pre>
          <p>Then:</p>
          <ol style={{ margin: 0, paddingLeft: 20, lineHeight: "2" }}>
            <li>Fully close Ollama (system tray &#8594; Quit)</li>
            <li>Restart Ollama</li>
            <li>Return to NEXIS and click Detect Models</li>
          </ol>
        </Step>
      </div>

      {/* WINDOWS FIX SCRIPT */}
      <div className="panel">
        <SectionTitle>Windows Quick Fix Script</SectionTitle>
        <p style={{ marginTop: 0 }}>
          Copy the script below into a file named <code>fix-ollama.bat</code> and run it as Administrator.
          It configures Ollama for NEXIS and stops any running Ollama processes so you can restart cleanly.
        </p>
        <pre style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "10px 14px", fontFamily: "monospace", fontSize: "0.82rem", overflowX: "auto", margin: "8px 0 8px", whiteSpace: "pre" }}>{`@echo off
echo Configuring Ollama for NEXIS...

setx OLLAMA_ORIGINS "https://nexis-psi.vercel.app,http://localhost:3000,http://127.0.0.1:3000"

echo.
echo Stopping Ollama...
taskkill /F /IM "ollama app.exe" 2>nul
taskkill /F /IM ollama.exe 2>nul
taskkill /F /IM ollama_llama_server.exe 2>nul

echo.
echo Done.
echo Restart Ollama, then return to NEXIS and click Detect Models.
pause`}</pre>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", margin: "12px 0 0" }}>
          After running the script, restart Ollama manually, then click Detect Models in NEXIS.
        </p>
      </div>

      {/* PROVIDER / API KEYS */}
      <div className="panel">
        <SectionTitle>Provider API Keys</SectionTitle>
        <p style={{ marginTop: 0 }}>
          You can also use your own provider account (such as OpenAI or Anthropic) instead of a local model.
          Enter your API key in <strong>Settings &#8594; Model</strong>.
        </p>
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.88rem", margin: 0 }}>
          NEXIS does not automatically call a hosted model unless you configure one.
          Whoever owns the provider account is responsible for any usage costs.
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

    </PageOverlay>
  );
}
