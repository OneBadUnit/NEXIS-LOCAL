// ============================================================
// ARC-NEXUS — AEGIS CONSENSUS CLUSTER CARD
// File: src/components/AegisConsensusCluster.jsx
// ============================================================
//
// Renders one front_page_consensus cluster from the AEGIS API.
// Visual style matches the AEGIS Front Page compact card layout.
//
// Cluster shape:
//   { topic, consensus_score, consensus_tier, keywords (JSON str),
//     headlines (JSON str), source_count, left_count, center_count,
//     right_count, tier1_count, created_at, scan_id }
//
// headlines array elements: { title, url, source, orientation, tier }
// ============================================================

import React, { useState } from "react";

// ── Helpers ───────────────────────────────────────────────────

function safeParseJson(str) {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const TIER_LABELS = {
  confirmed: "CONFIRMED",
  elevated:  "ELEVATED",
  monitored: "MONITORED",
};

function tierStyle(tier) {
  const t = (tier || "").toLowerCase();
  if (t === "confirmed") return { color: "var(--arc-accent, #00FF41)", borderColor: "var(--arc-accent, #00FF41)" };
  if (t === "elevated")  return { color: "#f59e0b", borderColor: "#f59e0b" };
  return { color: "#38bdf8", borderColor: "#38bdf8" };
}

function orientationDotColor(orientation) {
  const o = (orientation || "").toLowerCase();
  if (o === "left")   return "#60a5fa";
  if (o === "right")  return "#f87171";
  if (o === "center") return "#86efac";
  return "rgba(255,255,255,0.35)";
}

function pillStyle(color) {
  return {
    fontSize: "0.65rem",
    fontWeight: 700,
    letterSpacing: "0.05em",
    color,
    border: `1px solid ${color}55`,
    borderRadius: 3,
    padding: "2px 6px",
  };
}

// ── Component ─────────────────────────────────────────────────

export default function AegisConsensusCluster({ cluster }) {
  const [expanded, setExpanded] = useState(false);

  const headlines = safeParseJson(cluster.headlines);

  const scoreDisplay = cluster.consensus_score != null
    ? Math.round(cluster.consensus_score * 100) + "%"
    : "—";

  const totalSources = cluster.source_count || 0;
  const leftCount    = cluster.left_count   || 0;
  const centerCount  = cluster.center_count || 0;
  const rightCount   = cluster.right_count  || 0;
  const tier1Count   = cluster.tier1_count  || 0;

  const tierLabel = TIER_LABELS[(cluster.consensus_tier || "").toLowerCase()]
    || (cluster.consensus_tier || "").toUpperCase();
  const ts = tierStyle(cluster.consensus_tier);

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${ts.borderColor}33`,
        background: "rgba(255,255,255,0.025)",
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      {/* Header: badge + topic (uppercase) + source count + HEADLINES button */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        {cluster.consensus_tier && (
          <span
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              ...ts,
              border: `1px solid ${ts.borderColor}`,
              borderRadius: 3,
              padding: "2px 6px",
              flexShrink: 0,
            }}
          >
            {tierLabel}
          </span>
        )}
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cluster.topic || "Untitled topic"}
        </span>
        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", flexShrink: 0 }}>
          {totalSources} source{totalSources !== 1 ? "s" : ""}
        </span>
        {headlines.length > 0 && (
          <button
            onClick={() => setExpanded((v) => !v)}
            style={{
              all: "unset",
              cursor: "pointer",
              fontSize: "0.67rem",
              fontWeight: 700,
              letterSpacing: "0.06em",
              color: expanded ? "var(--arc-accent, #00FF41)" : "rgba(255,255,255,0.45)",
              border: `1px solid ${expanded ? "var(--arc-accent, #00FF41)" : "rgba(255,255,255,0.2)"}`,
              borderRadius: 3,
              padding: "2px 7px",
              flexShrink: 0,
              transition: "color 0.15s, border-color 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--arc-accent, #00FF41)";
              e.currentTarget.style.borderColor = "var(--arc-accent, #00FF41)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = expanded ? "var(--arc-accent, #00FF41)" : "rgba(255,255,255,0.45)";
              e.currentTarget.style.borderColor = expanded ? "var(--arc-accent, #00FF41)" : "rgba(255,255,255,0.2)";
            }}
          >
            HEADLINES
          </button>
        )}
      </div>

      {/* Orientation row: LEFT ×N  CENTER ×N  RIGHT ×N  WIRE ×N  [82%] */}
      <div style={{ display: "flex", alignItems: "center", gap: 5, flexWrap: "wrap" }}>
        {leftCount > 0 && (
          <span style={pillStyle("#60a5fa")}>LEFT ×{leftCount}</span>
        )}
        {centerCount > 0 && (
          <span style={pillStyle("#86efac")}>CENTER ×{centerCount}</span>
        )}
        {rightCount > 0 && (
          <span style={pillStyle("#f87171")}>RIGHT ×{rightCount}</span>
        )}
        {tier1Count > 0 && (
          <span style={pillStyle("#f59e0b")}>WIRE ×{tier1Count}</span>
        )}
        <span
          style={{
            fontSize: "0.67rem",
            fontWeight: 700,
            color: "var(--arc-accent, #00FF41)",
            letterSpacing: "0.04em",
          }}
        >
          {scoreDisplay}
        </span>
      </div>

      {/* Headlines list — shown when expanded */}
      {expanded && headlines.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginTop: 2 }}>
          {headlines.map((h, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: orientationDotColor(h.orientation),
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {h.url ? (
                  <a
                    href={h.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--arc-text)",
                      textDecoration: "none",
                      display: "block",
                      wordBreak: "break-word",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--arc-accent, #00FF41)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--arc-text)")}
                    title={h.title}
                  >
                    {h.title || h.url}
                  </a>
                ) : (
                  <span style={{ fontSize: "0.8rem", display: "block", wordBreak: "break-word" }}>
                    {h.title || "Untitled"}
                  </span>
                )}
              </div>
              {h.source && (
                <span style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
                  {h.source}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
