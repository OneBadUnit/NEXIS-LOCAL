// ============================================================
// SAVED CARDS PANEL (ARC‑NEXUS STANDARD — EXPANDABLE CARDS)
// Unified card renderer for all modules.
// - Flat list
// - Expandable "View Output"
// - Copy button inside expanded panel
// ============================================================

import React, { useState, useMemo } from "react";
import CopyButton from "./CopyButton";
import "../styles/SavedCardsPanel.css";

const SavedCardsPanel = ({ savedItems, onSelect, onDelete }) => {
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  // ------------------------------------------------------------
  // SEARCH FILTER — matches title + text
  // ------------------------------------------------------------
  const filtered = useMemo(() => {
    return savedItems
      .filter((item) => {
        const text = `${item.title || ""} ${item.text || ""}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [savedItems, search]);

  return (
    <div className="saved-panel">

      {/* SEARCH BAR */}
      <input
        className="saved-search"
        placeholder="Search saved items..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* SAVED CARDS */}
      <div className="saved-list">
        {filtered.map((item) => {
          const isExpanded = expandedId === item.id;

          return (
            <div key={item.id} className="saved-card">

              {/* TITLE */}
              <div
                className="saved-title"
                onClick={() => onSelect && onSelect(item)}
              >
                {item.title || "Untitled"}
              </div>

              {/* TIMESTAMP */}
              <div className="saved-time">
                {new Date(item.timestamp).toLocaleString()}
              </div>

              {/* DELETE BUTTON */}
              <button
                className="saved-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
              >
                ✕
              </button>

              {/* EXPAND / COLLAPSE BUTTON */}
              <button
                className="saved-expand"
                onClick={() =>
                  setExpandedId(isExpanded ? null : item.id)
                }
              >
                {isExpanded ? "Hide Output" : "View Output"}
              </button>

              {/* EXPANDED OUTPUT */}
              {isExpanded && (
                <div className="saved-output">
                  <pre>{item.text || ""}</pre>
                  <CopyButton text={item.text || ""} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SavedCardsPanel;
