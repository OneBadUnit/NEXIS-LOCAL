// ============================================================
// ARC-NEXUS - VIEW PLANS OVERLAY
// File: src/components/ViewPlansOverlay.jsx
// Version: 001 (informational plan comparison)
// ============================================================
// Information only. No checkout or payment logic.
// Uses TIERS from frontend tier config as the single source of truth.
// ============================================================

import React from "react";
import PageOverlay from "./PageOverlay";
import { TIERS } from "../lib/tiers";

const TIER_ORDER = ["free", "base", "middle", "high"];

function PlanRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 8,
      }}
    >
      <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
        {label}
      </span>
      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>
        {value}
      </span>
    </div>
  );
}

export default function ViewPlansOverlay({ onClose, currentTier = "free" }) {
  return (
    <PageOverlay title="Plans" onClose={onClose}>
      <p
        style={{
          margin: "0 0 24px",
          color: "rgba(255,255,255,0.4)",
          fontSize: "0.85rem",
        }}
      >
        Plan information only. No payment is processed here.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          maxWidth: 720,
        }}
      >
        {TIER_ORDER.map((key) => {
          const tier = TIERS[key];
          const isCurrent = key === currentTier;

          return (
            <div
              key={key}
              style={{
                borderRadius: 12,
                border: isCurrent
                  ? "1.5px solid rgba(56,189,248,0.55)"
                  : "1px solid rgba(255,255,255,0.1)",
                background: isCurrent
                  ? "rgba(56,189,248,0.07)"
                  : "rgba(255,255,255,0.03)",
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {/* Plan name + current badge */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    color: isCurrent ? "#7dd3fc" : "var(--arc-text)",
                  }}
                >
                  {tier.label}
                </span>
                {isCurrent && (
                  <span
                    style={{
                      fontSize: "0.68rem",
                      color: "#7dd3fc",
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      background: "rgba(56,189,248,0.15)",
                      border: "1px solid rgba(56,189,248,0.35)",
                      borderRadius: 4,
                      padding: "2px 6px",
                    }}
                  >
                    CURRENT
                  </span>
                )}
              </div>

              {/* Limits */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <PlanRow label="Projects" value={tier.max_projects} />
                <PlanRow label="Saved Inputs" value={tier.max_saved_raw_inputs} />
                <PlanRow label="Saved Outputs" value={tier.max_saved_outputs} />
                <PlanRow label="Inputs / mo" value={tier.monthly_raw_inputs} />
                <PlanRow label="Actions / mo" value={tier.monthly_actions} />
              </div>
            </div>
          );
        })}
      </div>
    </PageOverlay>
  );
}
