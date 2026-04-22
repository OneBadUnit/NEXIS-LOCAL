// ============================================================
// ARC‑NEXUS MODULE: RECONSTRUCTION (GLOBAL VERSION)
// Text‑only transformation engine.
// Uses global ArcNContext for state + persistence.
// Saved items flow through SavedCardsPanel (view + copy only).
// ============================================================

import React, { useState, useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";
import CopyButton from "../components/CopyButton";
import ScrollTopButton from "../components/ScrollTopButton";
import SavedCardsPanel from "../components/SavedCardsPanel";

export default function Reconstruction() {
  const {
    reconstructionState,
    setReconstructionState,
    savedReconstructions,
    saveReconstruction,
    setSavedReconstructions,
    setReconstructionRefinementText,
    refineReconstructionOutput,
    keepRefinedReconstructionOutput,
    revertReconstructionOutput,
  } = useContext(ArcNContext);

  const {
    input,
    output,
    selectedTool,
    selectedOption,
    refinementText,
    originalOutputBeforeRefine,
    refining,
  } = reconstructionState;

  const [loading, setLoading] = useState(false);

  // ------------------------------------------------------------
  // TOOL OPTIONS (MUST MATCH BACKEND EXACTLY)
  // ------------------------------------------------------------
  const OPTIONS = {
    summarize: ["Short", "Medium", "Long", "Narrative", "Academic"],
    rewrite: [
      "Improve Clarity",
      "Make Concise",
      "Make Engaging",
      "Make Professional",
      "Simplify",
    ],
    extract: [
      "Key Points",
      "Entities",
      "Timeline",
      "Topics and Themes", // backend now accepts this
      "Quotes",
      "JSON Structured Data",
    ],
    transform: [
      "Into Bullet Points",
      "Into a Paragraph",
      "Into a Study Guide",
      "Into a Table",
      "Into JSON",
      "Into a Script / Dialogue",
    ],
    clean: [
      "Remove Filler",
      "Remove Timestamps",
      "Normalize Spacing",
      "Deduplicate",
      "Fix Formatting",
    ],
  };

  // ------------------------------------------------------------
  // SAFE SETTERS WITH GUARDS
  // ------------------------------------------------------------
  const setTool = (tool) => {
    if (!OPTIONS[tool] || OPTIONS[tool].length === 0) return;

    setReconstructionState((prev) => ({
      ...prev,
      selectedTool: tool,
      selectedOption: OPTIONS[tool][0], // guaranteed valid
    }));
  };

  const setOption = (opt) => {
    if (!selectedTool) return;
    if (!OPTIONS[selectedTool].includes(opt)) return;

    setReconstructionState((prev) => ({
      ...prev,
      selectedOption: opt,
    }));
  };

  const setInput = (value) => {
    setReconstructionState((prev) => ({
      ...prev,
      input: value,
    }));
  };

  const setOutput = (value) => {
    setReconstructionState((prev) => ({
      ...prev,
      output: value,
    }));
  };

  // ------------------------------------------------------------
  // RUN RECONSTRUCTION (API CALL) WITH GUARDS
  // ------------------------------------------------------------
  const handleReconstruct = async () => {
    // HARD GUARDS — prevent invalid requests
    if (!input || input.trim() === "") {
      setOutput("No input provided.");
      return;
    }

    if (!selectedTool || !OPTIONS[selectedTool]) {
      setOutput("Invalid tool selected.");
      return;
    }

    if (!selectedOption || !OPTIONS[selectedTool].includes(selectedOption)) {
      setOutput("Invalid option selected.");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      const payload = {
        text: input,
        mode: selectedTool,
        option: selectedOption,
      };

      console.log("Sending Reconstruction Payload:", payload);

      const response = await fetch(
        "http://localhost:8000/reconstruction/reconstruct",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setOutput(data.output || "No output generated.");
    } catch (err) {
      console.error("Reconstruction error:", err);
      setOutput("Error processing reconstruction.");
    }

    setLoading(false);
  };

  // ------------------------------------------------------------
  // SAVE OUTPUT
  // ------------------------------------------------------------
  const saveOutput = () => {
    if (!output) return;

    const name = prompt("Enter a name for this reconstruction:");
    if (!name) return;

    saveReconstruction({
      title: name,
      text: output,
    });
  };

  // ------------------------------------------------------------
  // DELETE SAVED ITEM
  // ------------------------------------------------------------
  const deleteItem = (id) => {
    setSavedReconstructions((prev) => prev.filter((item) => item.id !== id));
  };

  // ------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------
  return (
    <div className="module-container">
      <h1 className="module-title">Reconstruction</h1>

      {/* TOOLBOX */}
      <div className="panel" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {Object.keys(OPTIONS).map((tool) => (
            <button
              key={tool}
              className={`btn ${selectedTool === tool ? "active" : ""}`}
              onClick={() => setTool(tool)}
            >
              {tool.charAt(0).toUpperCase() + tool.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* OPTIONS */}
      {selectedTool && (
        <div className="panel" style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
            {OPTIONS[selectedTool].map((opt) => (
              <button
                key={opt}
                className={`btn ${selectedOption === opt ? "active" : ""}`}
                onClick={() => setOption(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INPUT */}
      <div className="panel">
        <textarea
          placeholder="Enter text to reconstruct..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{ width: "100%", minHeight: "160px" }}
        />
      </div>

      {/* ACTION BUTTON */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button className="btn" onClick={handleReconstruct} disabled={loading}>
          {loading ? "Reconstructing..." : "Reconstruct"}
        </button>
      </div>

      {/* OUTPUT */}
      <div className="panel">
        <h3>Output</h3>
        <pre>{output}</pre>

        {output && (
          <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
            <CopyButton text={output} />
            <button className="btn" onClick={saveOutput}>Save</button>
            <button className="btn" onClick={() => setInput("")}>Clear Input</button>
          </div>
        )}
      </div>

      {/* REFINEMENT */}
      {output && (
        <div className="panel">
          <h3>Refine Output (optional)</h3>

          <textarea
            className="refine-textarea"
            placeholder="Describe how to refine this output..."
            value={refinementText}
            onChange={(e) => setReconstructionRefinementText(e.target.value)}
          />

          <div className="refine-actions">
            <button
              className="btn"
              onClick={refineReconstructionOutput}
              disabled={!refinementText || refining}
            >
              {refining ? "Refining..." : "Refine Output"}
            </button>

            {originalOutputBeforeRefine && (
              <>
                <button className="btn" onClick={keepRefinedReconstructionOutput}>Keep Changes</button>
                <button className="btn" onClick={revertReconstructionOutput}>Revert</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* SAVED ITEMS */}
      <div className="panel">
        <h3>Saved Reconstructions</h3>

        <SavedCardsPanel
          savedItems={savedReconstructions}
          onSelect={(item) => console.log("Selected reconstruction:", item)}
          onDelete={deleteItem}
        />
      </div>

      <ScrollTopButton />
    </div>
  );
}
