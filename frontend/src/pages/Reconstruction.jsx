// ============================================================
// ARC-NEXUS - NEXIS UNDERSTAND PAGE
// File: src/pages/Reconstruction.jsx
// Version: 005 (Preset-Aware Logic + Expanded Creator Options)
// ============================================================

import React, { useState, useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";
import { nexisUnderstand } from "../api/api";

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
  } = useContext(ArcNContext);

  const { input, output, preset, action, selectedOption } = reconstructionState;

  const [loading, setLoading] = useState(false);

  const PRESETS = ["student", "creator", "explained", "analysis"];

  const RULES = {
    student: {
      summarize: ["Short", "Medium", "Long"],
      extract: ["Key Points", "Quotes", "Entities"],
      rewrite: ["Simplify", "Improve Clarity"],
      transform: ["Study Guide", "Paragraph"],
      clean: ["Remove Filler", "Fix Formatting"],
    },
    creator: {
      summarize: ["Short", "Medium"],
      extract: ["Key Points", "Quotes", "Timeline"],
      rewrite: ["Make Engaging", "Improve Flow"],
      transform: [
        "Dialogue Script",
        "Narrative Story",
        "Hook Script",
        "Social Post",
      ],
      clean: ["Remove Filler"],
    },
    explained: {
      summarize: ["Short", "Medium"],
      extract: ["Key Points", "Entities"],
      rewrite: ["Improve Clarity", "Simplify"],
      transform: ["Paragraph", "Study Guide"],
      clean: ["Normalize Spacing", "Remove Filler"],
    },
    analysis: {
      summarize: ["Long"],
      extract: ["Key Points", "Entities", "Timeline"],
      rewrite: ["Make Professional", "Improve Clarity"],
      transform: ["JSON", "Paragraph"],
      clean: ["Deduplicate", "Fix Formatting"],
    },
  };

  const label = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const safePreset = RULES[preset] ? preset : "explained";
  const availableActions = Object.keys(RULES[safePreset]);
  const safeAction = RULES[safePreset][action] ? action : availableActions[0];
  const availableOptions = RULES[safePreset][safeAction];
  const safeOption = availableOptions.includes(selectedOption)
    ? selectedOption
    : availableOptions[0];

  const setPreset = (nextPreset) => {
    const firstAction = Object.keys(RULES[nextPreset])[0];
    const firstOption = RULES[nextPreset][firstAction][0];

    setReconstructionState((prev) => ({
      ...prev,
      preset: nextPreset,
      action: firstAction,
      selectedOption: firstOption,
    }));
  };

  const setAction = (nextAction) => {
    setReconstructionState((prev) => ({
      ...prev,
      action: nextAction,
      selectedOption: RULES[safePreset][nextAction][0],
    }));
  };

  const setOption = (nextOption) => {
    setReconstructionState((prev) => ({
      ...prev,
      selectedOption: nextOption,
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

    setLoading(true);
    setOutput("");

    try {
      const result = await nexisUnderstand({
        text: input,
        preset: safePreset,
        action: safeAction,
        option: safeOption,
      });

      setOutput(result.output || "No output returned.");
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

      <div className="panel">
        <div style={{ marginBottom: 16 }}>
          <div className="subtle" style={{ marginBottom: 6 }}>
            1. Choose a preset
          </div>

          <div className="row">
            {PRESETS.map((item) => (
              <button
                key={item}
                className={`btn ${safePreset === item ? "active" : ""}`}
                onClick={() => setPreset(item)}
              >
                {label(item)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="subtle" style={{ marginBottom: 6 }}>
            2. Choose an action
          </div>

          <div className="row">
            {availableActions.map((item) => (
              <button
                key={item}
                className={`btn ${safeAction === item ? "active" : ""}`}
                onClick={() => setAction(item)}
              >
                {label(item)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="subtle" style={{ marginBottom: 6 }}>
            3. Choose an option
          </div>

          <div className="row">
            {availableOptions.map((item) => (
              <button
                key={item}
                className={`btn ${safeOption === item ? "active" : ""}`}
                onClick={() => setOption(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Paste or type text..."
        />
      </div>

      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <button
          className="btn primary"
          onClick={handleRun}
          disabled={loading}
        >
          {loading ? "Processing..." : "Run"}
        </button>
      </div>

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