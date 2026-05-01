// ============================================================
// ARC-NEXUS - NEXIS CREATE PAGE
// Version: 006 (Minimal Create + Argument Mode)
// ============================================================

import React, { useState, useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";
import { nexisCreate } from "../api/api";

import CopyButton from "../components/CopyButton";
import ScrollTopButton from "../components/ScrollTopButton";
import SavedCardsPanel from "../components/SavedCardsPanel";

export default function Creation() {
  const {
    createState,
    setCreateState,
    saveReconstruction,
    savedReconstructions,
    setSavedReconstructions,
  } = useContext(ArcNContext);

  const { input, output, mode, option } = createState;

  const [loading, setLoading] = useState(false);
  const [refineText, setRefineText] = useState("");

  const MODES = {
    format: ["report", "article", "script"],
    argument: ["nexis opinion", "pro argument", "counter argument"],
    refine: ["custom"],
  };

  const REFINE_SUGGESTIONS = [
    "Make this more neutral",
    "Shorten to one page",
    "Expand the timeline section",
    "Add bullet points",
    "Remove speculation",
    "Make this easier to read",
    "Turn this into a quick summary",
    "Add a clear conclusion",
    "Make this sound more professional",
    "Focus only on key facts",
  ];

  const label = (text) =>
    text
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

  const setMode = (m) => {
    setCreateState((prev) => ({
      ...prev,
      mode: m,
      option: MODES[m][0],
    }));
  };

  const setOption = (opt) => {
    setCreateState((prev) => ({
      ...prev,
      option: opt,
    }));
  };

  const setInput = (val) => {
    setCreateState((prev) => ({
      ...prev,
      input: val,
    }));
  };

  const setOutput = (val) => {
    setCreateState((prev) => ({
      ...prev,
      output: val,
    }));
  };

  const handleCreate = async () => {
    if (!input.trim()) {
      setOutput("No input provided.");
      return;
    }

    setLoading(true);
    setOutput("");

    try {
      const payload =
        mode === "refine"
          ? {
              text: input,
              mode: "refine",
              option: refineText || "Improve clarity",
            }
          : {
              text: input,
              mode,
              option,
            };

      const result = await nexisCreate(payload);
      setOutput(result.output || "No output returned.");
    } catch (err) {
      console.error(err);
      setOutput("Error generating content.");
    }

    setLoading(false);
  };

  const saveOutput = () => {
    if (!output) return;

    const name = prompt("Enter a name:");
    if (!name) return;

    saveReconstruction({
      title: name,
      text: output,
    });
  };

  const deleteItem = (id) => {
    setSavedReconstructions((prev) =>
      prev.filter((item) => item.id !== id)
    );
  };

  return (
    <div className="module-container">
      <h1 className="module-title">CREATE</h1>

      {/* MODES */}
      <div className="panel">
        <div className="row">
          {Object.keys(MODES).map((m) => (
            <button
              key={m}
              className={`btn ${mode === m ? "active" : ""}`}
              onClick={() => setMode(m)}
            >
              {label(m)}
            </button>
          ))}
        </div>
      </div>

      {/* OPTIONS */}
      {mode !== "refine" && (
        <div className="panel">
          <div className="row">
            {MODES[mode].map((opt) => (
              <button
                key={opt}
                className={`btn ${option === opt ? "active" : ""}`}
                onClick={() => setOption(opt)}
              >
                {label(opt)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* INPUT */}
      <div className="panel">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Paste converted content here..."
        />
      </div>

      {/* REFINE INPUT */}
      {mode === "refine" && (
        <div className="panel">
          <textarea
            value={refineText}
            onChange={(e) => setRefineText(e.target.value)}
            placeholder="Enter a refinement instruction..."
          />

          <div className="row">
            {REFINE_SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                className="btn small"
                onClick={() => setRefineText(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* RUN */}
      <div style={{ textAlign: "center" }}>
        <button className="btn" onClick={handleCreate} disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* OUTPUT */}
      <div className="panel">
        <h3>Output</h3>
        <pre>{output}</pre>

        {output && (
          <div className="row">
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