// ============================================================
// ARC-NEXUS - FRONTEND TIER CONFIG
// File: src/lib/tiers.js
// Mirrors backend app/core/tiers.py — values must stay in sync.
// Used for display only. Enforcement is always server-side.
// ============================================================

export const TIERS = {
  free: {
    label: "Free",
    max_projects: 99999,
    max_saved_raw_inputs: 99999,
    max_saved_outputs: 99999,
    monthly_raw_inputs: 99999,
    monthly_actions: 99999,
  },
  base: {
    label: "Core",
    max_projects: 99999,
    max_saved_raw_inputs: 99999,
    max_saved_outputs: 99999,
    monthly_raw_inputs: 99999,
    monthly_actions: 99999,
  },
  middle: {
    label: "Pro",
    max_projects: 99999,
    max_saved_raw_inputs: 99999,
    max_saved_outputs: 99999,
    monthly_raw_inputs: 99999,
    monthly_actions: 99999,
  },
  high: {
    label: "Max",
    max_projects: 99999,
    max_saved_raw_inputs: 99999,
    max_saved_outputs: 99999,
    monthly_raw_inputs: 99999,
    monthly_actions: 99999,
  },
};

/**
 * Returns the tier config for the given key.
 * Falls back to "free" if key is missing, null, or unrecognized.
 */
export function getTierConfig(tierKey) {
  return TIERS[tierKey] || TIERS.free;
}
