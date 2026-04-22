import React, { useState, useRef } from "react";
import "./AIHelperPanel.css";

export default function AIHelperPanel() {
  const [aiText, setAiText] = useState("");
  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);

  // Lifted out of the loop — no-loop-func warning resolved
  const handleHistoryClick = (item) => {
    setAiText(item);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!aiText.trim()) return;

    setHistory((prev) => [...prev, aiText]);
    setAiText("");
    inputRef.current?.focus();
  };

  return (
    <div className="ai-helper-panel">
      <h2>ARC‑NEXUS AI Helper</h2>

      <form onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          placeholder="Ask ARC‑NEXUS anything..."
        />
        <button type="submit">Send</button>
      </form>

      <div className="history">
        <h3>History</h3>
        {history.map((item, index) => (
          <div
            key={index}
            className="history-item"
            onClick={() => handleHistoryClick(item)}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
