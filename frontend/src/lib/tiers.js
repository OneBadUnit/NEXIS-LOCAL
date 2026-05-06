// ============================================================
// ARC-NEXUS - FRONTEND TIER CONFIG
// File: src/lib/tiers.js
// Mirrors backend app/core/tiers.py — values must stay in sync.
// Used for display only. Enforcement is always server-side.
// ============================================================

export const TIERS = {
  free: {
    label: "Free",
    max_projects: 1,
    max_saved_raw_inputs: 4,
    max_saved_outputs: 4,
    monthly_raw_inputs: 4,
    monthly_actions: 4,
  },
  base: {
    label: "Core",
    max_projects: 2,
    max_saved_raw_inputs: 8,
    max_saved_outputs: 8,
    monthly_raw_inputs: 8,
    monthly_actions: 12,
  },
  middle: {
    label: "Pro",
    max_projects: 3,
    max_saved_raw_inputs: 12,
    max_saved_outputs: 12,
    monthly_raw_inputs: 12,
    monthly_actions: 36,
  },
  high: {
    label: "Max",
    max_projects: 5,
    max_saved_raw_inputs: 36,
    max_saved_outputs: 36,
    monthly_raw_inputs: 36,
    monthly_actions: 108,
  },
};

/**
 * Returns the tier config for the given key.
 * Falls back to "free" if key is missing, null, or unrecognized.
 */
export function getTierConfig(tierKey) {
  return TIERS[tierKey] || TIERS.free;
}
