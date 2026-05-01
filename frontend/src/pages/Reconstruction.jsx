// ============================================================
// ARC-NEXUS - NEXIS CONVERT PAGE
// File: src/pages/Reconstruction.jsx
// Version: 009 (Package Run-All)
// ============================================================

import React, { useState, useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";
import { nexisUnderstand } from "../api/api";

import CopyButton from "../components/CopyButton";
import ScrollTopButton from "../components/ScrollTopButton";
import SavedCardsPanel from "../components/SavedCardsPanel";

const PACKAGES = {
  summary: {
    label: "Summary Package",
    items: ["Outline", "Timeline", "Key Points", "Summary"],
  },
  creator: {
    label: "Creator Package",
    items: ["Make Engaging", "Hook Script", "Dialogue Script", "Title Suggestions", "Keywords"],
  },
};

export default function Reconstruction() {
  const {
    reconstructionState,
    setReconstructionState,
    savedReconstructions,
    saveReconstruction,
    setSavedReconstructions,
  } = useContext(ArcNContext);

  const { input, output, preset } = reconstructionState;

  const [loading, setLoading] = useState(false);

  const selectedPackage = PACKAGES[preset] ? preset : null;

  const selectPackage = (pkg) => {
    setReconstructionState((prev) => ({
      ...prev,
      preset: pkg,
    }));
  };

  const setInput = (value) => {
    setReconstructionState((prev) => ({ ...prev, input: value }));
  };

  const setOutput = (value) => {
    setReconstructionState((prev) => ({ ...prev, output: value }));
  };

  const handleRun = async () => {
    if (!input.trim()) {
      setOutput("No input provided.");
      return;
    }

    if (!selectedPackage) {
      setOutput("Select a package first.");
      return;
    }

    setLoading(true);
    setOutput("");

    const items = PACKAGES[selectedPackage].items;
    const sections = [];

    try {
      for (const item of items) {
        const result = await nexisUnderstand({
          text: input,
          preset: selectedPackage,
          action: "transform",
          option: item,
        });

        sections.push(`=== ${item} ===\n\n${result.output || ""}`);
      }

      setOutput(sections.join("\n\n\n"));
    } catch {
      setOutput("Error processing request.");
    }

    setLoading(false);
  };

  const saveOutput = () => {
    if (!output) return;

    const name = prompt("Enter a name:");
    if (!name) return;

    saveReconstruction({ title: name, text: output });
  };

  const deleteItem = (id) => {
    setSavedReconstructions((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="module-container">
      <h1 className="module-title">CONVERT</h1>

      {/* PACKAGE SELECTION */}
      <div className="panel">
        <div className="row" style={{ alignItems: "flex-start", gap: 24 }}>
          {Object.entries(PACKAGES).map(([key, pkg]) => (
            <div key={key} style={{ flex: 1 }}>
              <button
                className={`btn ${selectedPackage === key ? "active" : ""}`}
                style={{ width: "100%", marginBottom: 12 }}
                onClick={() => selectPackage(key)}
              >
                {pkg.label}
              </button>

              <div className="subtle" style={{ marginBottom: 4 }}>
                Included:
              </div>

              <ul style={{ margin: 0, paddingLeft: 18, lineHeight: "1.9" }}>
                {pkg.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* INPUT */}
      <div className="panel">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste or type text..."
        />
      </div>

      {/* RUN */}
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button
          className="btn primary"
          onClick={handleRun}
          disabled={loading}
        >
          {loading ? "Processing..." : "Run"}
        </button>
      </div>

      {/* OUTPUT */}
      <div className="panel">
        <h3>Output</h3>

        <pre>{output || "Your result will appear here..."}</pre>

        {output && (
          <div className="row" style={{ marginTop: 10 }}>
            <CopyButton text={output} />
            <button className="btn" onClick={saveOutput}>
              Save
            </button>
          </div>
        )}
      </div>

      {/* SAVED */}
      <div className="panel">
        <SavedCardsPanel
          savedItems={savedReconstructions}
          onDelete={deleteItem}
        />
      </div>

      <ScrollTopButton />
    </div>
  );
}