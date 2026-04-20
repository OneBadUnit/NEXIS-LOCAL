import React, { useState, useEffect } from "react";
import "./reconstruction.css";
import CopyButton from "../components/CopyButton";
import ScrollTopButton from "../components/ScrollTopButton";

export default function Reconstruction() {
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [savedItems, setSavedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------------------
     LOAD PERSISTED STATE
  ----------------------------*/
  useEffect(() => {
    const storedInput = localStorage.getItem("reconstruction-input");
    const storedOutput = localStorage.getItem("reconstruction-output");
    const storedSaves = localStorage.getItem("reconstruction-saves");

    if (storedInput) setInputText(storedInput);
    if (storedOutput) setOutputText(storedOutput);
    if (storedSaves) setSavedItems(JSON.parse(storedSaves));
  }, []);

  /* ---------------------------
     SAVE PERSISTED STATE
  ----------------------------*/
  useEffect(() => {
    localStorage.setItem("reconstruction-input", inputText);
  }, [inputText]);

  useEffect(() => {
    localStorage.setItem("reconstruction-output", outputText);
  }, [outputText]);

  useEffect(() => {
    localStorage.setItem("reconstruction-saves", JSON.stringify(savedItems));
  }, [savedItems]);

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
      "Topics / Themes",
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

  const handleReconstruct = async () => {
    if (!selectedTool || !selectedOption || !inputText) return;

    setLoading(true);
    setOutputText("");

    try {
      const response = await fetch(
        "http://localhost:8000/reconstruction/reconstruct",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: inputText,
            mode: selectedTool,
            option: selectedOption,
          }),
        }
      );

      const data = await response.json();
      setOutputText(data.output || "No output generated.");
    } catch (error) {
      setOutputText("Error processing reconstruction.");
    }

    setLoading(false);
  };

  const saveOutput = () => {
    if (!outputText) return;

    const name = prompt("Enter a name for this reconstruction:");
    if (!name) return;

    const newItem = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      name,
      timestamp: new Date().toISOString(),
      output: outputText,
      open: false,
      editing: false,
    };

    setSavedItems((prev) => [...prev, newItem]);
  };

  const clearForm = () => {
    if (!window.confirm("Really?")) return;
    if (!window.confirm("Really really?")) return;

    setInputText("");
    setOutputText("");

    localStorage.setItem("reconstruction-input", "");
    localStorage.setItem("reconstruction-output", "");
  };

  const renameItem = (id, newName) => {
    setSavedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, name: newName } : item
      )
    );
  };

  const toggleEditing = (id) => {
    setSavedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, editing: !item.editing } : item
      )
    );
  };

  const deleteItem = (id) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleOpen = (id) => {
    setSavedItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, open: !item.open } : item
      )
    );
  };

  return (
    <div className="reconstruction-container">
      <h1 className="reconstruction-title">Reconstruction</h1>

      {/* TOOLBOX */}
      <div className="toolbox">
        {Object.keys(OPTIONS).map((tool) => (
          <button
            key={tool}
            className={`tool-button ${
              selectedTool === tool ? "active" : ""
            }`}
            onClick={() => {
              setSelectedTool(tool);
              setSelectedOption(null);
            }}
          >
            {tool.charAt(0).toUpperCase() + tool.slice(1)}
          </button>
        ))}
      </div>

      {/* OPTIONS */}
      {selectedTool && (
        <div className="options-panel">
          {OPTIONS[selectedTool].map((opt) => (
            <button
              key={opt}
              className={`option-button ${
                selectedOption === opt ? "active" : ""
              }`}
              onClick={() => setSelectedOption(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}

      {/* INPUT */}
      <div className="input-card">
        <textarea
          className="input-textarea"
          placeholder="Enter text to reconstruct..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
        />
      </div>

      {/* ACTION BUTTON */}
      <button
        className={`reconstruct-button ${loading ? "loading" : ""}`}
        onClick={handleReconstruct}
        disabled={loading}
      >
        {loading ? "Reconstructing..." : "Reconstruct"}
      </button>

      {/* OUTPUT */}
      <div className="output-card">
        <h2>Output</h2>
        <pre>{outputText}</pre>

        {outputText && (
          <div className="output-actions">
            <CopyButton text={outputText} />
            <button className="save-button" onClick={saveOutput}>
              Save
            </button>
            <button className="save-button" onClick={clearForm}>
              Clear Form
            </button>
          </div>
        )}
      </div>

      {/* SAVED ITEMS */}
      <div className="saved-panel">
        <h2>Saved Reconstructions</h2>

        <div className="saved-list">
          {savedItems.map((item) => (
            <div key={item.id} className="saved-item">
              <div className="saved-header">
                {item.editing ? (
                  <input
                    className="saved-name-input"
                    value={item.name}
                    onChange={(e) => renameItem(item.id, e.target.value)}
                    onBlur={() => toggleEditing(item.id)}
                    autoFocus
                  />
                ) : (
                  <div
                    className="saved-name-display"
                    onClick={() => toggleEditing(item.id)}
                  >
                    {item.name}
                  </div>
                )}

                <button
                  className="delete-btn"
                  onClick={() => deleteItem(item.id)}
                >
                  ✕
                </button>
              </div>

              <div className="saved-timestamp">
                {new Date(item.timestamp).toLocaleString()}
              </div>

              <button
                className="view-output-btn"
                onClick={() => toggleOpen(item.id)}
              >
                {item.open ? "Hide Output" : "View Output"}
              </button>

              {item.open && (
                <pre className="saved-output">{item.output}</pre>
              )}
            </div>
          ))}
        </div>
      </div>

      <ScrollTopButton />
    </div>
  );
}
