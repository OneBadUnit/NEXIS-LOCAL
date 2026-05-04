// ============================================================
// ARC-NEXUS - PROJECT STORAGE ADAPTER
// File: src/utils/projectStorage.js
// Version: 001 (localStorage — swap these functions for API
//               calls when backend integration is ready)
// ============================================================

const KEYS = {
  PROJECTS: "arcn_projects",
  RAW_ITEMS: "arcn_raw_items",
  OUTPUTS: "arcn_outputs",
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
