import React, { useState, useEffect } from "react";
import "./creation.css";
import CopyButton from "../components/CopyButton";

export default function Creation() {
  /* ----------------------------------------
     PERSISTENT STATE
  ---------------------------------------- */
  const [creationState, setCreationState] = useState(() => {
    const saved = localStorage.getItem("creationState");
    return saved
      ? JSON.parse(saved)
      : {
          tool: "reporting",
          option: "straight-report",
          input: "",
          output: "",
          tags: [],
          loading: false,
        };
  });

  const [savedCreations, setSavedCreations] = useState(() => {
    const saved = localStorage.getItem("savedCreations");
    return saved ? JSON.parse(saved) : [];
  });

  /* SAVE STATE ON CHANGE */
  useEffect(() => {
    localStorage.setItem("creationState", JSON.stringify(creationState));
  }, [creationState]);

  useEffect(() => {
    localStorage.setItem("savedCreations", JSON.stringify(savedCreations));
  }, [savedCreations]);

  /* ----------------------------------------
     UPDATE HELPERS
  ---------------------------------------- */
  const update = (field, value) => {
    setCreationState((prev) => ({ ...prev, [field]: value }));
  };

  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 1200);
  };

  /* ----------------------------------------
     TOOLBOX
  ---------------------------------------- */
  const tools = [
    { id: "reporting", label: "Reporting" },
    { id: "tone", label: "Tone Styles" },
    { id: "analysis", label: "Analysis" },
    { id: "script", label: "Video Scripts" },
    { id: "arc_nexus", label: "ARC‑NEXUS" },
  ];

  const options = {
    reporting: [
      "straight-report",
      "explainer",
      "timeline",
      "key-points",
      "claims-vs-facts",
    ],

    tone: [
      "instructional",
      "logical-debate",
      "critical-callout",
      "satirical",
      "serious-urgent",
    ],

    analysis: [
      "bias-detection",
      "narrative-analysis",
      "motive-breakdown",
      "red-flag-detector",
      "source-signals",
    ],

    script: [
      "60s",
      "2-3min",
      "5min-deep-dive",
      "conversational",
      "host-guest-dialogue",
    ],

    arc_nexus: ["synthesis", "deconstruction", "enhancement", "compression"],
  };

  /* ----------------------------------------
     GENERATE OUTPUT + TAGS
  ---------------------------------------- */
  const generate = async () => {
    if (!creationState.input.trim()) return;

    update("loading", true);

    try {
      const response = await fetch("http://localhost:5000/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: creationState.tool,
          option: creationState.option,
          input: creationState.input,
        }),
      });

      const data = await response.json();
      update("output", data.output || "No output received.");

      /* ----------------------------------------
         SECOND PASS: TAG GENERATION
      ---------------------------------------- */
      try {
        const tagResponse = await fetch("http://localhost:5000/create/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            output: data.output,
            tool: creationState.tool,
            option: creationState.option,
          }),
        });

        const tagData = await tagResponse.json();
        update("tags", tagData.tags || []);
      } catch (err) {
        update("tags", []);
      }

    } catch (err) {
      update("output", "Error connecting to backend.");
      update("tags", []);
    }

    update("loading", false);
  };

  /* ----------------------------------------
     SAVE CREATION
  ---------------------------------------- */
  const saveCreation = () => {
    if (!creationState.output.trim()) return;

    const defaultName = "New Creation";
    const name =
      prompt("Enter a name for this creation:", defaultName) || defaultName;

    const newItem = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      name,
      timestamp: new Date().toLocaleString(),
      output: creationState.output,
      tags: creationState.tags,
      open: false,
    };

    setSavedCreations((prev) => [newItem, ...prev]);
  };

  const updateSavedName = (id, newName) => {
    setSavedCreations((prev) =>
      prev.map((item) => (item.id === id ? { ...item, name: newName } : item))
    );
  };

  const deleteSaved = (id) => {
    setSavedCreations((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleSavedOpen = (id) => {
    setSavedCreations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, open: !item.open } : item
      )
    );
  };

  /* ----------------------------------------
     RENDER
  ---------------------------------------- */
  return (
    <div className="creation-container">
      <h2 className="creation-title">Creation</h2>

      {/* TOOLBOX */}
      <div className="toolbox">
        {tools.map((t) => (
          <button
            key={t.id}
            className={`tool-button ${
              creationState.tool === t.id ? "active" : ""
            }`}
            onClick={() => update("tool", t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* OPTIONS */}
      <div className="options-panel indented">
        {options[creationState.tool].map((opt) => (
          <button
            key={opt}
            className={`option-button ${
              creationState.option === opt ? "active" : ""
            }`}
            onClick={() => update("option", opt)}
          >
            {opt.replace(/-/g, " ").toUpperCase()}
          </button>
        ))}
      </div>

      {/* INPUT */}
      <div className="input-card">
        <textarea
          className="input-textarea"
          placeholder="Paste article, transcript, or describe what you want..."
          value={creationState.input}
          onChange={(e) => update("input", e.target.value)}
        />
      </div>

      {/* GENERATE BUTTON */}
      <button
        className={`generate-button ${
          creationState.loading ? "loading" : ""
        }`}
        onClick={generate}
        disabled={creationState.loading}
      >
        {creationState.loading ? "Generating..." : "Generate"}
      </button>

      {/* OUTPUT */}
      {creationState.output && (
        <div className="output-card">
          <pre>{creationState.output}</pre>

          {/* TAGS */}
          {creationState.tags?.length > 0 && (
            <div className="tag-list">
              {creationState.tags.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          )}

          <div className="output-actions">
            <button className="save-button" onClick={saveCreation}>
              Save
            </button>

            <button
              className="copy-button"
              onClick={() => copyToClipboard(creationState.output)}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* SAVED CREATIONS */}
      <div className="saved-panel">
        <h3>Saved Creations</h3>

        <div className="saved-list">
          {savedCreations.map((item) => (
            <div key={item.id} className="saved-item">
              <div className="saved-header">
                <input
                  className="saved-name-input"
                  value={item.name}
                  onChange={(e) => updateSavedName(item.id, e.target.value)}
                />

                <button
                  className="delete-btn"
                  onClick={() => deleteSaved(item.id)}
                >
                  ✕
                </button>
              </div>

              <div className="saved-timestamp">{item.timestamp}</div>

              <button
                className="view-output-btn"
                onClick={() => toggleSavedOpen(item.id)}
              >
                {item.open ? "Hide Output" : "View Output"}
              </button>

              {item.open && (
                <div className="saved-output-wrapper">
                  <pre className="saved-output">{item.output}</pre>

                  {/* SAVED TAGS */}
                  {item.tags?.length > 0 && (
                    <div className="saved-tag-list">
                      {item.tags.map((tag, i) => (
                        <span key={i} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}

                  <CopyButton text={item.output} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
