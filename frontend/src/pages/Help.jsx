// ============================================================
// ARC-NEXUS - HELP PAGE
// File: src/pages/Help.jsx
// Version: 002 (Terminology Aligned)
// ============================================================

import React, { useState } from "react";

export default function Help() {
  const [openFAQ, setOpenFAQ] = useState(null);

  const toggleFAQ = (id) => {
    setOpenFAQ(openFAQ === id ? null : id);
  };

  return (
    <div className="module-container">
      <h1 className="module-title">Help & Documentation</h1>

      {/* COLLECT */}
      <div className="panel">
        <h3>Collect</h3>
        <p>
          Collect extracts content from URLs, files, or images. It is designed
          for fast ingestion and clean text output.
        </p>

        <ul>
          <li><strong>URL:</strong> Paste any webpage link to extract readable content.</li>
          <li><strong>File:</strong> Upload documents or media for processing.</li>
          <li><strong>Picture:</strong> Upload images for OCR and description.</li>
          <li><strong>Saved:</strong> Results are stored automatically.</li>
        </ul>
      </div>

      {/* UNDERSTAND */}
      <div className="panel">
        <h3>Understand</h3>
        <p>
          Understand transforms your input using structured presets, actions,
          and options.
        </p>

        <ul>
          <li><strong>Presets:</strong> Student, Creator, Explained, Analysis.</li>
          <li><strong>Actions:</strong> Summarize, Extract, Rewrite, Transform.</li>
          <li><strong>Options:</strong> Context-specific refinements.</li>
          <li><strong>Saved:</strong> Outputs are stored for reuse.</li>
        </ul>
      </div>

      {/* CREATE */}
      <div className="panel">
        <h3>Create</h3>
        <p>
          Create generates new content from your ideas using structured modes.
        </p>

        <ul>
          <li><strong>Modes:</strong> Script, Post, Email, Idea.</li>
          <li><strong>Options:</strong> Length or tone variations.</li>
          <li><strong>Output:</strong> Ready-to-use generated content.</li>
        </ul>
      </div>

      {/* SETTINGS */}
      <div className="panel">
        <h3>Settings</h3>
        <p>
          Adjust display and system preferences.
        </p>

        <ul>
          <li><strong>Font Size:</strong> Controls output text size.</li>
          <li><strong>System Info:</strong> Shows environment details.</li>
        </ul>
      </div>

      {/* FAQ */}
      <div className="panel">
        <h3>Frequently Asked Questions</h3>

        <FAQ
          id={1}
          open={openFAQ}
          toggle={toggleFAQ}
          q="Why doesn't Collect persist input like Understand?"
          a="Collect saves results as entries, while Understand works as a persistent workspace."
        />

        <FAQ
          id={2}
          open={openFAQ}
          toggle={toggleFAQ}
          q="Why do some files fail?"
          a="Files may be unsupported, locked, or corrupted."
        />

        <FAQ
          id={3}
          open={openFAQ}
          toggle={toggleFAQ}
          q="Why is Understand slower?"
          a="It performs deeper transformations using AI models."
        />

        <FAQ
          id={4}
          open={openFAQ}
          toggle={toggleFAQ}
          q="Can I clear all saved items?"
          a="Currently manual delete only. Bulk options may be added later."
        />

        <FAQ
          id={5}
          open={openFAQ}
          toggle={toggleFAQ}
          q="What does font size change?"
          a="It affects all output text across the system."
        />
      </div>

      {/* ABOUT */}
      <div className="panel">
        <h3>About ARC-NEXUS</h3>
        <p>
          ARC-NEXUS is a modular system for collecting, understanding, and
          creating content using local AI.
        </p>
      </div>
    </div>
  );
}

function FAQ({ id, open, toggle, q, a }) {
  return (
    <div style={{ marginBottom: "12px" }}>
      <button className="btn" onClick={() => toggle(id)}>
        {q}
      </button>
      {open === id && (
        <div style={{ marginTop: "10px" }}>
          {a}
        </div>
      )}
    </div>
  );
}