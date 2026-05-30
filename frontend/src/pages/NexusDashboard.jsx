// ============================================================
// ARC-NEXUS - NEXUS DASHBOARD
// File: src/pages/NexusDashboard.jsx
// Version: 008 (Tier limits + usage tracking)
// ============================================================

import React, { memo, useState, useEffect, useCallback } from "react";
import ProjectWorkspace from "./ProjectWorkspace";
import {
  loadProjects,
  saveProjects,
  deleteProjectData,
} from "../utils/projectStorage";
import {
  syncUsage,
  addProjectUsage,
  removeProjectUsage,
} from "../api/api.jsx";
import { getTierConfig } from "../lib/tiers";


// ------------------------------------------------------------
// UsageLine — a single "label: used / limit" row with a bar
// ------------------------------------------------------------
function UsageLine({ label, used, limit }) {
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const atCap = used >= limit;
  const barColor = atCap ? "#ef4444" : pct >= 75 ? "#f59e0b" : "var(--arc-accent, #38bdf8)";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
        <span className="subtle" style={{ fontSize: "0.82rem" }}>{label}</span>
        <span
          style={{
            fontSize: "0.82rem",
            fontWeight: 600,
            color: atCap ? "#ef4444" : "var(--arc-text)",
          }}
        >
          {used} / {limit}
        </span>
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 4,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: barColor,
            borderRadius: 4,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

const NexusDashboard = ({ user, profile }) => {
  // Load projects from localStorage on first render
  const [projects, setProjects] = useState(() => loadProjects());
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectError, setNewProjectError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeProject, setActiveProject] = useState(null);

  // Usage / tier state
  const [usage, setUsage] = useState(null);

  // Tier resolved from profile — falls back to "free" if profile is missing or unrecognized.
  const profileTier = profile?.tier || "free";
  const tierConfig = getTierConfig(profileTier);
  const bonusActions = profile?.bonus_actions || 0;
  const monthlyActionAllowance = tierConfig.monthly_actions + bonusActions;
  console.log("[Tier] profile tier:", profileTier, "| config:", tierConfig);

  const refreshUsage = useCallback(async () => {
    try {
      // Sync storage count and profile tier to backend so enforcement
      // matches the Supabase profile tier.
      const data = await syncUsage({ projects: projects.length, tier: profileTier });
      console.log("[Usage] sync response:", data);
      setUsage(data);
    } catch {
      // Backend may not be running; silently ignore
    }
  }, [projects.length, profileTier]);

  // On mount: fetch usage from backend (backend is source of truth)
  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  // Persist projects whenever they change
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  // Project limit comes from frontend tier config (profile.tier is source of truth).
  // Falls back to 0 only when tierConfig hasn't resolved yet (shouldn't happen).
  const projectLimit = tierConfig?.max_projects ?? 0;
  const atLimit = projects.length >= projectLimit;

  const createProject = async () => {
    if (!newProjectName.trim()) return;
    setNewProjectError(null);

    try {
      await addProjectUsage();
    } catch (err) {
      setNewProjectError(err.message || "Could not create project.");
      return;
    }

    const now = Date.now();
    const newProject = {
      id: crypto.randomUUID(),
      title: newProjectName.trim(),
      createdAt: now,
      updatedAt: now,
    };

    setProjects((prev) => [newProject, ...prev]);
    setNewProjectName("");
    setShowNewModal(false);
    refreshUsage();
  };

  const confirmDelete = (e, project) => {
    e.stopPropagation();
    setDeleteTarget(project);
  };

  const executeDelete = () => {
    // Remove project data from localStorage before removing from state
    deleteProjectData(deleteTarget.id);
    setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
    // Tell backend a project slot was freed (fire-and-forget)
    removeProjectUsage().catch(() => {});
    refreshUsage();
  };

  if (activeProject) {
    return (
      <ProjectWorkspace
        project={activeProject}
        onClose={() => {
          setActiveProject(null);
          refreshUsage();
        }}
        onRename={(title) => {
          const updated = { ...activeProject, title, updatedAt: Date.now() };
          setActiveProject(updated);
          setProjects((prev) =>
            prev.map((p) => (p.id === activeProject.id ? updated : p))
          );
        }}
      />
    );
  }

  return (
    <div className="module-container">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
        }}
      >
        {/* TOP LEFT — PROJECTS */}
        <div className="panel">
          <h3>PROJECTS</h3>

          <button
            className={`btn${atLimit ? "" : " primary"}`}
            style={{ marginTop: "12px" }}
            onClick={() => {
              if (!atLimit) {
                setNewProjectError(null);
                setShowNewModal(true);
              }
            }}
            disabled={atLimit}
          >
            {atLimit ? "Project Limit Reached" : "+ New Project"}
          </button>

          {atLimit && (
            <p className="subtle" style={{ marginTop: 8, fontSize: "0.82rem" }}>
              Maximum of {projectLimit} project{projectLimit !== 1 ? "s" : ""} for your plan. Delete one or upgrade.
            </p>
          )}

          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
            {projects.length === 0 && (
              <p className="subtle">No projects yet.</p>
            )}

            {projects.map((project) => (
              <div
                key={project.id}
                onClick={() => setActiveProject(project)}
                style={{
                  position: "relative",
                  padding: "16px",
                  paddingRight: "48px",
                  borderRadius: "12px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.border = "1px solid rgba(56,189,248,0.4)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)")
                }
              >
                <div style={{ fontWeight: "600" }}>{project.title}</div>
                <div className="subtle" style={{ fontSize: "0.8rem" }}>
                  Created: {new Date(project.createdAt).toLocaleDateString()}
                </div>

                <button
                  onClick={(e) => confirmDelete(e, project)}
                  style={{
                    position: "absolute",
                    top: "50%",
                    right: "12px",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.35)",
                    fontSize: "16px",
                    lineHeight: 1,
                    padding: "4px 6px",
                    borderRadius: "6px",
                    transition: "color 0.15s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
                  aria-label="Delete project"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* TOP RIGHT — ACCOUNT STATUS */}
        <div className="panel">
          <h3>ACCOUNT STATUS</h3>

          {/* Plan label and limits come from frontend tier config (profile.tier).
              Counters come from backend (usage.current.*). */}
          <p className="subtle" style={{ marginBottom: 6 }}>
            {profile?.email || user?.email || "—"}
          </p>
          <p className="subtle" style={{ marginBottom: 14 }}>
            Plan: <strong style={{ color: "var(--arc-text)" }}>{tierConfig.label}</strong>
          </p>

          {usage ? (
            <>
              {/* Storage */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <UsageLine
                  label="Projects"
                  used={projects.length}
                  limit={tierConfig.max_projects}
                />
                <UsageLine
                  label="Saved Raw Inputs"
                  used={usage.current.raw_inputs}
                  limit={tierConfig.max_saved_raw_inputs}
                />
                <UsageLine
                  label="Saved Outputs"
                  used={usage.current.outputs}
                  limit={tierConfig.max_saved_outputs}
                />
              </div>

              {/* Monthly */}
              <p className="subtle" style={{ fontSize: "0.78rem", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                This Month
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <UsageLine
                  label="Raw Inputs Added"
                  used={usage.current.raw_inputs_this_month}
                  limit={tierConfig.monthly_raw_inputs}
                />
                <UsageLine
                  label="Actions Used"
                  used={usage.current.actions_this_month}
                  limit={monthlyActionAllowance}
                />
                {bonusActions > 0 && (
                  <p style={{ margin: "2px 0 0", fontSize: "0.78rem", color: "#4ade80" }}>
                    Bonus Actions: +{bonusActions}
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="subtle" style={{ fontSize: "0.85rem" }}>Loading usage…</p>
          )}

        </div>

        {/* BOTTOM LEFT — NEWS */}
        <div className="panel">
          <h3>NEWS</h3>
          <p className="subtle">
            NEXIS is evolving into a project-based workspace for collecting,
            converting, and refining raw information.
          </p>
        </div>

        {/* BOTTOM RIGHT — UPDATES */}
        <div className="panel">
          <h3>UPDATES</h3>
          <p className="subtle">Latest: Project workspace implemented.</p>
          <p className="subtle">Coming next: output history per project.</p>
        </div>
      </div>

      {/* NEW PROJECT MODAL */}
      {showNewModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div className="panel" style={{ width: "320px", textAlign: "center" }}>
            <h3>New Project</h3>
            <input
              type="text"
              placeholder="Project name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createProject()}
              autoFocus
            />
            {newProjectError && (
              <p style={{ color: "var(--arc-error, #ef4444)", fontSize: "0.85rem", margin: "8px 0 0" }}>
                {newProjectError}
              </p>
            )}
            <div className="row" style={{ justifyContent: "center" }}>
              <button className="btn" onClick={() => { setShowNewModal(false); setNewProjectName(""); setNewProjectError(null); }}>
                Cancel
              </button>
              <button className="btn primary" onClick={createProject}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div className="panel" style={{ width: "320px", textAlign: "center" }}>
            <h3>Delete Project?</h3>
            <p className="subtle" style={{ marginBottom: 20 }}>
              This cannot be undone.
            </p>
            <div className="row" style={{ justifyContent: "center" }}>
              <button className="btn" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button
                className="btn"
                style={{ borderColor: "#ef4444", color: "#ef4444" }}
                onClick={executeDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(NexusDashboard);