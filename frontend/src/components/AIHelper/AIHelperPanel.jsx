// ============================================================
// ARC-NEXUS - NEXIS GUIDE PANEL
// File: src/components/AIHelper/AIHelperPanel.jsx
// Version: 004 (Summary + Creator Package — Correct Terminology)
// ============================================================

import React, { useState } from "react";
import "./aiHelper.css";

const API_URL = "http://127.0.0.1:8000/ai-helper/respond";

export default function AIHelperPanel({ isOpen, onClose }) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hi — I'm NEXIS Guide. Ask me how to use Collect, Convert, or Create, or which preset and option to pick.",
    },
  ]);
  const [loading, setLoading] = useState(false);

  const updateLastAssistantMessage = (text) => {
    setMessages((prev) => {
      const updated = [...prev];
      updated[updated.length - 1] = {
        role: "assistant",
        text,
      };
      return updated;
    });
  };

  const sendMessage = async (event) => {
    event.preventDefault();

    const cleanInput = input.trim();
    if (!cleanInput || loading) return;

    setInput("");
    setLoading(true);

    setMessages((prev) => [
      ...prev,
      { role: "user", text: cleanInput },
      { role: "assistant", text: "" },
    ]);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: cleanInput,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("NEXIS Guide failed to respond.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      const chunks = [];

      while (true) {
        const { value, done } = await reader.read();

        if (done) break;

        chunks.push(decoder.decode(value));
        updateLastAssistantMessage(chunks.join(""));
      }
    } catch (error) {
      updateLastAssistantMessage(
        error.message ||
          "NEXIS Guide is unavailable. Make sure the backend and Ollama are running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className={`ai-helper-panel ${isOpen ? "open" : ""}`}>
      <div className="ai-helper-header">
        <span>NEXIS Guide</span>

        <button
          className="ai-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Close NEXIS Guide"
        >
          ×
        </button>
      </div>

      <div className="ai-helper-messages">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`msg ${message.role}`}>
            {message.text ||
              (loading && index === messages.length - 1 ? "Thinking..." : "")}
          </div>
        ))}
      </div>

      <form className="ai-helper-input" onSubmit={sendMessage}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask how to use NEXIS..."
          disabled={loading}
        />

        <button type="submit" disabled={loading}>
          {loading ? "..." : "Ask"}
        </button>
      </form>
    </section>
  );
}