import React, { useState, useEffect } from "react";
import CopyButton from "../components/CopyButton";
import ScrollTopButton from "../components/ScrollTopButton";

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
    setTimeout(() => setCopied(false), 1200);
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
    // MAIN CREATION CALL
    const response = await fetch("http://localhost:8000/create/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instruction: creationState.input
      }),
    });

    const data = await response.json();
    const output = data.output || "No output received.";
    update("output", output);

    // TAG GENERATION CALL
    const tagResponse = await fetch("http://localhost:8000/create/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: output
      }),
    });

    const tagData = await tagResponse.json();
    update("tags", tagData.tags || []);

  } catch (err) {
    update("output", "Error connecting to backend.");
    update("tags", []);
  }

  update("loading", false);
};


;

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
    <div className="module-container">
      <h1 className="module-title">Creation</h1>

      {/* TOOLBOX */}
      <div className="panel" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {tools.map((t) => (
            <button
              key={t.id}
              className={`btn ${creationState.tool === t.id ? "active" : ""}`}
              onClick={() => update("tool", t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* OPTIONS */}
      <div className="panel" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", flexWrap: "wrap" }}>
          {options[creationState.tool].map((opt) => (
            <button
              key={opt}
              className={`btn ${creationState.option === opt ? "active" : ""}`}
              onClick={() => update("option", opt)}
            >
              {opt.replace(/-/g, " ").toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* INPUT */}
      <div className="panel">
        <textarea
          placeholder="Paste article, transcript, or describe what you want..."
          value={creationState.input}
          onChange={(e) => update("input", e.target.value)}
          style={{
            width: "100%",
            minHeight: "160px",
            resize: "vertical",
          }}
        />
      </div>

      {/* GENERATE BUTTON */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <button
          className="btn"
          onClick={generate}
          disabled={creationState.loading}
        >
          {creationState.loading ? "Generating..." : "Generate"}
        </button>
      </div>

      {/* OUTPUT */}
      {creationState.output && (
        <div className="panel">
          <pre>{creationState.output}</pre>

          {/* TAGS */}
          {creationState.tags?.length > 0 && (
            <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {creationState.tags.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          )}

          <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
            <button className="btn" onClick={saveCreation}>Save</button>

            <button
              className="btn"
              onClick={() => copyToClipboard(creationState.output)}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {/* SAVED CREATIONS */}
      <div className="panel">
        <h3>Saved Creations</h3>

        {savedCreations.map((item) => (
          <div key={item.id} className="panel" style={{ marginTop: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <input
                value={item.name}
                onChange={(e) => updateSavedName(item.id, e.target.value)}
                style={{ flex: 1, marginRight: "10px" }}
              />

              <button className="btn btn-small" onClick={() => deleteSaved(item.id)}>
                ✕
              </button>
            </div>

            <div style={{ opacity: 0.6, marginTop: "4px" }}>{item.timestamp}</div>

            <button
              className="btn"
              style={{ marginTop: "10px" }}
              onClick={() => toggleSavedOpen(item.id)}
            >
              {item.open ? "Hide Output" : "View Output"}
            </button>

            {item.open && (
              <div style={{ marginTop: "10px" }}>
                <pre>{item.output}</pre>

                {item.tags?.length > 0 && (
                  <div style={{ marginTop: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
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

      <ScrollTopButton />
    </div>
  );
}
