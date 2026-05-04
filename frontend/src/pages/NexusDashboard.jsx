// ============================================================
// ARC-NEXUS - NEXUS DASHBOARD
// File: src/pages/NexusDashboard.jsx
// Version: 007 (localStorage persistence)
// ============================================================

import React, { memo, useState, useEffect } from "react";
import ProjectWorkspace from "./ProjectWorkspace";
import {
  loadProjects,
  saveProjects,
  deleteProjectData,
} from "../utils/projectStorage";

const PROJECT_LIMIT = 3;

const NexusDashboard = () => {
  // Load projects from localStorage on first render
  const [projects, setProjects] = useState(() => loadProjects());
  const [showNewModal, setShowNewModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [activeProject, setActiveProject] = useState(null);

  // Persist projects whenever they change
  useEffect(() => {
    saveProjects(projects);
  }, [projects]);

  const atLimit = projects.length >= PROJECT_LIMIT;

  const createProject = () => {
    if (!newProjectName.trim()) return;

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
  };

  if (activeProject) {
    return (
      <ProjectWorkspace
        project={activeProject}
        onClose={() => setActiveProject(null)}
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
            onClick={() => !atLimit && setShowNewModal(true)}
            disabled={atLimit}
          >
            {atLimit ? "Limit Reached" : "+ New Project"}
          </button>

          {atLimit && (
            <p className="subtle" style={{ marginTop: 8, fontSize: "0.82rem" }}>
              Maximum of {PROJECT_LIMIT} projects reached. Delete one to continue.
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
          <p className="subtle">Plan: Free</p>
          <p className="subtle">Converts remaining: 4</p>
          <p className="subtle">Refines remaining: 2</p>
          <button className="btn primary" style={{ marginTop: "12px" }}>
            View Plans
          </button>
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
            <div className="row" style={{ justifyContent: "center" }}>
              <button className="btn" onClick={() => { setShowNewModal(false); setNewProjectName(""); }}>
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