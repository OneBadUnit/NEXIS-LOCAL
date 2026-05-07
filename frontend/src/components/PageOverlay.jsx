// ============================================================
// ARC-NEXUS - PAGE OVERLAY SHELL
// File: src/components/PageOverlay.jsx
// Version: 001
// ============================================================
// Generic full-screen overlay used by Help and Setup.
// Covers the main workspace, locks scroll behind it,
// provides a scrollable content area and a close button.
// ============================================================

import React from "react";

export default function PageOverlay({ title, onClose, children, maxWidth = 760 }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--arc-bg)",
        zIndex: 2000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Header ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          flexShrink: 0,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          style={{
            fontSize: "1.05rem",
            fontWeight: 700,
            letterSpacing: "0.03em",
            color: "var(--arc-text)",
          }}
        >
          {title}
        </span>

        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            all: "unset",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 36,
            height: 36,
            borderRadius: 8,
            color: "rgba(255,255,255,0.45)",
            fontSize: "1.1rem",
            transition: "background 0.15s ease, color 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.color = "var(--arc-text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgba(255,255,255,0.45)";
          }}
        >
          ✕
        </button>
      </div>

      {/* ── Scrollable content ─────────────────────────────── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "36px 32px 64px",
        }}
      >
        <div style={{ maxWidth, margin: "0 auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
