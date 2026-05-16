// ============================================================
// ARC-NEXUS - PROJECT STORAGE ADAPTER
// File: src/utils/projectStorage.js
// Version: 001 (localStorage — swap these functions for API
//               calls when backend integration is ready)
// ============================================================

const LOCAL_PREFIX = "nexis_local_";

const KEYS = {
  PROJECTS:     LOCAL_PREFIX + "arcn_projects",
  RAW_ITEMS:    LOCAL_PREFIX + "arcn_raw_items",
  OUTPUTS:      LOCAL_PREFIX + "arcn_outputs",
  // Model config is user-scoped: provider API keys must not persist between accounts.
  MODEL_CONFIG: LOCAL_PREFIX + "nexis_model_config",
};

// ------------------------------------------------------------
// PROJECTS
// ------------------------------------------------------------

export function loadProjects() {
  try {
    const raw = localStorage.getItem(KEYS.PROJECTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects) {
  try {
    localStorage.setItem(KEYS.PROJECTS, JSON.stringify(projects));
  } catch {
    console.warn("[projectStorage] Could not save projects.");
  }
}

// ------------------------------------------------------------
// RAW ITEMS  (scoped to a project)
// ------------------------------------------------------------

export function loadRawItems(projectId) {
  try {
    const raw = localStorage.getItem(KEYS.RAW_ITEMS);
    const all = raw ? JSON.parse(raw) : [];
    return all.filter((item) => item.projectId === projectId);
  } catch {
    return [];
  }
}

export function saveRawItemsForProject(projectId, items) {
  try {
    const raw = localStorage.getItem(KEYS.RAW_ITEMS);
    const all = raw ? JSON.parse(raw) : [];
    const others = all.filter((item) => item.projectId !== projectId);
    localStorage.setItem(
      KEYS.RAW_ITEMS,
      JSON.stringify([...others, ...items])
    );
  } catch {
    console.warn("[projectStorage] Could not save raw items.");
  }
}

// ------------------------------------------------------------
// OUTPUTS  (scoped to a project)
// ------------------------------------------------------------

export function loadOutputs(projectId) {
  try {
    const raw = localStorage.getItem(KEYS.OUTPUTS);
    const all = raw ? JSON.parse(raw) : [];
    return all.filter((o) => o.projectId === projectId);
  } catch {
    return [];
  }
}

export function saveOutputsForProject(projectId, outputs) {
  try {
    const raw = localStorage.getItem(KEYS.OUTPUTS);
    const all = raw ? JSON.parse(raw) : [];
    const others = all.filter((o) => o.projectId !== projectId);
    localStorage.setItem(
      KEYS.OUTPUTS,
      JSON.stringify([...others, ...outputs])
    );
  } catch {
    console.warn("[projectStorage] Could not save outputs.");
  }
}

// ------------------------------------------------------------
// COUNT HELPERS
// Used to sync storage totals to the backend on startup.
// ------------------------------------------------------------

export function countAllRawItems() {
  try {
    const raw = localStorage.getItem(KEYS.RAW_ITEMS);
    const all = raw ? JSON.parse(raw) : [];
    return all.length;
  } catch {
    return 0;
  }
}

export function countAllOutputs() {
  try {
    const raw = localStorage.getItem(KEYS.OUTPUTS);
    const all = raw ? JSON.parse(raw) : [];
    return all.length;
  } catch {
    return 0;
  }
}


// ------------------------------------------------------------
// FULL STORAGE WIPE  (call on sign-out to prevent data leakage
// between accounts sharing the same browser)
// ------------------------------------------------------------

export function clearAllProjectStorage() {
  try { localStorage.removeItem(KEYS.PROJECTS); } catch {}
  try { localStorage.removeItem(KEYS.RAW_ITEMS); } catch {}
  try { localStorage.removeItem(KEYS.OUTPUTS); } catch {}
  // Clear model config so a provider API key from one account cannot be
  // read or auto-filled by the next user on the same browser.
  // nexis_companion_path is intentionally preserved — it is device-scoped
  // (path to a local executable), not a credential.
  try { localStorage.removeItem(KEYS.MODEL_CONFIG); } catch {}
}

// ------------------------------------------------------------
// CLEANUP  (call when a project is deleted)
// ------------------------------------------------------------

export function deleteProjectData(projectId) {
  try {
    const rawRaw = localStorage.getItem(KEYS.RAW_ITEMS);
    const allRaw = rawRaw ? JSON.parse(rawRaw) : [];
    localStorage.setItem(
      KEYS.RAW_ITEMS,
      JSON.stringify(allRaw.filter((i) => i.projectId !== projectId))
    );
  } catch {
    console.warn("[projectStorage] Could not clean raw items for project.");
  }

  try {
    const rawOut = localStorage.getItem(KEYS.OUTPUTS);
    const allOut = rawOut ? JSON.parse(rawOut) : [];
    localStorage.setItem(
      KEYS.OUTPUTS,
      JSON.stringify(allOut.filter((o) => o.projectId !== projectId))
    );
  } catch {
    console.warn("[projectStorage] Could not clean outputs for project.");
  }
}

// ------------------------------------------------------------
// LOCAL-CLONE NAMESPACE MIGRATION  (call once before React renders)
// Copies each un-namespaced key into its nexis_local_ counterpart
// only when the new key does not yet exist. Old keys are never
// removed so the main app continues to work unchanged.
// ------------------------------------------------------------

export function runLocalNamespaceMigration() {
  const pairs = [
    ["arcn_projects",              LOCAL_PREFIX + "arcn_projects"],
    ["arcn_raw_items",             LOCAL_PREFIX + "arcn_raw_items"],
    ["arcn_outputs",               LOCAL_PREFIX + "arcn_outputs"],
    ["nexis_model_config",         LOCAL_PREFIX + "nexis_model_config"],
    ["nexis_companion_path",       LOCAL_PREFIX + "nexis_companion_path"],
    ["arcn_active_page",           LOCAL_PREFIX + "arcn_active_page"],
    ["arcn_active_module",         LOCAL_PREFIX + "arcn_active_module"],
    ["arcn_assimilation_state",    LOCAL_PREFIX + "arcn_assimilation_state"],
    ["arcn_saved_assimilations",   LOCAL_PREFIX + "arcn_saved_assimilations"],
    ["arcn_reconstruction_state",  LOCAL_PREFIX + "arcn_reconstruction_state"],
    ["arcn_saved_reconstructions", LOCAL_PREFIX + "arcn_saved_reconstructions"],
    ["arcn_create_state",          LOCAL_PREFIX + "arcn_create_state"],
    ["arcn_ack_version",           LOCAL_PREFIX + "arcn_ack_version"],
    ["nexusOnboardingSkipped",     LOCAL_PREFIX + "nexusOnboardingSkipped"],
  ];

  for (const [oldKey, newKey] of pairs) {
    try {
      if (localStorage.getItem(newKey) === null) {
        const oldValue = localStorage.getItem(oldKey);
        if (oldValue !== null) {
          localStorage.setItem(newKey, oldValue);
        }
      }
    } catch {
      // Ignore storage errors (private mode, quota, etc.)
    }
  }
}
