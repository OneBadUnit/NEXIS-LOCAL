// ============================================================
// ARC-NEXUS - NEXUS DASHBOARD
// File: src/pages/NexusDashboard.jsx
// Version: 008 (Tier limits + usage tracking)
// ============================================================

import React, { memo, useState, useEffect } from "react";
import ProjectWorkspace from "./ProjectWorkspace";
import AegisPanel from "../components/AegisPanel";
import { WikipediaMostViewed, WikipediaWatchlist, WikipediaCurrentEvents, WikipediaAegisTopics } from "../components/WikipediaSignalCard";
import {
  loadProjects,
  saveProjects,
  deleteProjectData,
} from "../utils/projectStorage";
import {
  addProjectUsage,
  removeProjectUsage,
} from "../api/api.jsx";
import { getTierConfig } from "../lib/tiers";


const NexusDashboard = ({ user, profile }) => {
  // Load projects from localStorage on first render
  const [projects, setProjects] = useState(() => loadProjects());
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectError, setNewProjectError] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeProject, setActiveProject] = useState(null);

  // Tier resolved from profile — falls back to "free" if profile is missing or unrecognized.
  const profileTier = profile?.tier || "free";
  const tierConfig = getTierConfig(profileTier);

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
  };

  if (activeProject) {
    return (
      <ProjectWorkspace
        project={activeProject}
        onClose={() => {
          setActiveProject(null);
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
      <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "24px" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr)",
          gap: "24px",
          alignItems: "start",
        }}
      >
      {/* LEFT — PROJECTS */}
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

          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", maxHeight: "240px" }}>
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
                <div style={{ fontWeight: "600", wordBreak: "break-word" }}>{project.title}</div>
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

      {/* RIGHT — AEGIS */}
      <AegisPanel />

      </div>{/* end top row */}

      {/* BOTTOM ROW — Wikipedia Signal Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "24px",
        }}
      >
        <WikipediaMostViewed />
        <WikipediaWatchlist />
        <WikipediaCurrentEvents />
        <WikipediaAegisTopics />
      </div>

      </div>{/* end flex column */}

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