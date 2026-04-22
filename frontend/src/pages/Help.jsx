import React, { useState } from "react";

export default function Help() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="module-container">
      <h1 className="module-title">Help & Documentation</h1>

      {/* SECTION: Assimilation */}
      <div className="panel">
        <h3>Assimilation</h3>
        <p>
          Assimilation extracts content from URLs, documents, or images. It is
          designed for fast ingestion and clean transcript output.
        </p>

        <ul>
          <li><strong>URL Mode:</strong> Paste any webpage link to extract readable content.</li>
          <li><strong>Document Mode:</strong> Upload PDFs, text files, or other supported formats.</li>
          <li><strong>Picture Mode:</strong> Upload images for OCR and description.</li>
          <li><strong>Saved Assimilations:</strong> Automatically stored with rename + delete options.</li>
        </ul>
      </div>

      {/* SECTION: Reconstruction */}
      <div className="panel">
        <h3>Reconstruction</h3>
        <p>
          Reconstruction transforms your input using selectable tools and options.
          It is persistent — your input and output remain after refresh.
        </p>

        <ul>
          <li><strong>Toolbox:</strong> Choose the transformation type (summaries, rewrites, etc.).</li>
          <li><strong>Options:</strong> Additional modifiers depending on the selected tool.</li>
          <li><strong>Reconstruct Button:</strong> Generates output using the selected settings.</li>
          <li><strong>Saved Reconstructions:</strong> Stores previous outputs for quick access.</li>
        </ul>
      </div>

      {/* SECTION: Settings */}
      <div className="panel">
        <h3>Settings</h3>
        <p>
          The Settings page allows you to adjust the Output Window Font Size and view
          system information.
        </p>

        <ul>
          <li><strong>Output Window Font Size:</strong> Controls the text size used in Assimilation, Reconstruction, and Help output windows.</li>
          <li><strong>System Info:</strong> Version, build time, browser, platform, resolution.</li>
        </ul>
      </div>

      {/* SECTION: FAQs */}
      <div className="panel">
        <h3>Frequently Asked Questions</h3>

        {/* FAQ 1 */}
        <div style={{ marginBottom: "12px" }}>
          <button className="btn" onClick={() => toggleFAQ(1)}>
            Why doesn’t Assimilation persist input/output like Reconstruction?
          </button>
          {openFAQ === 1 && (
            <div style={{ marginTop: "10px" }}>
              Assimilation is designed to save each result as an individual card
              rather than persist the active input. Reconstruction behaves like a
              workspace, so its input/output persist automatically.
            </div>
          )}
        </div>

        {/* FAQ 2 */}
        <div style={{ marginBottom: "12px" }}>
          <button className="btn" onClick={() => toggleFAQ(2)}>
            Why do some files fail to upload?
          </button>
          {openFAQ === 2 && (
            <div style={{ marginTop: "10px" }}>
              Files may fail if they are locked, corrupted, or unsupported. Try
              saving a fresh copy or ensuring the file is not open in another
              program.
            </div>
          )}
        </div>

        {/* FAQ 3 */}
        <div style={{ marginBottom: "12px" }}>
          <button className="btn" onClick={() => toggleFAQ(3)}>
            Why does Reconstruction take longer than Assimilation?
          </button>
          {openFAQ === 3 && (
            <div style={{ marginTop: "10px" }}>
              Reconstruction performs deeper transformations and may require
              multiple passes depending on the selected tool and options.
            </div>
          )}
        </div>

        {/* FAQ 4 */}
        <div style={{ marginBottom: "12px" }}>
          <button className="btn" onClick={() => toggleFAQ(4)}>
            How do I clear all saved items?
          </button>
          {openFAQ === 4 && (
            <div style={{ marginTop: "10px" }}>
              Saved Assimilations and Reconstructions can be deleted individually
              using the ✕ button. A global “Clear All” option may be added in a
              future update.
            </div>
          )}
        </div>

        {/* FAQ 5 */}
        <div style={{ marginBottom: "12px" }}>
          <button className="btn" onClick={() => toggleFAQ(5)}>
            What does “Output Window Font Size” change?
          </button>
          {openFAQ === 5 && (
            <div style={{ marginTop: "10px" }}>
              It adjusts the text size used in all output windows across ARC‑NEXUS,
              including Assimilation transcripts, Reconstruction results, and Help
              documentation. It does not affect button sizes or layout geometry.
            </div>
          )}
        </div>
      </div>

      {/* SECTION: About */}
      <div className="panel">
        <h3>About ARC‑NEXUS</h3>
        <p>
          ARC‑NEXUS is a modular, neon‑themed interface designed for fast content
          ingestion, transformation, and retrieval. Built with React, FastAPI,
          and a persistent workspace philosophy.
        </p>
      </div>
    </div>
  );
}
