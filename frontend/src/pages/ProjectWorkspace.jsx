// ============================================================
// ARC-NEXUS - PROJECT WORKSPACE
// File: src/pages/ProjectWorkspace.jsx
// Version: 002 (localStorage persistence + View/Hide/Copy on raw cards)
// ============================================================

import React, { useState, useRef, useEffect } from "react";
import { collectSource, analyzeImage, nexisUnderstand } from "../api/api";
import {
  loadRawItems,
  saveRawItemsForProject,
  loadOutputs,
  saveOutputsForProject,
} from "../utils/projectStorage";

// ------------------------------------------------------------
// UI DISPLAY RULE:
// Combine "Title Suggestions" + "Keywords" into ONE bullet
// for UX clarity. Backend still treats them as separate fields.
// DO NOT split these in the UI.
// ------------------------------------------------------------
const PACKAGES = {
  summary: {
    label: "Summary Package",
    items: ["Outline", "Timeline", "Key Points", "Summary"],
  },
  creator: {
    label: "Creator Package",
    // Display label only -- backend receives "Title Suggestions" + "Keywords" separately
    items: ["Make Engaging", "Hook Script", "Dialogue Script", "Titles & Keywords"],
  },
};

// Actual option strings sent to the backend.
// "Titles & Keywords" expands into two separate API calls.
const BACKEND_ITEMS = {
  summary: ["Outline", "Timeline", "Key Points", "Summary"],
  creator: ["Make Engaging", "Hook Script", "Dialogue Script", "Title Suggestions", "Keywords"],
};

// ------------------------------------------------------------
// Inline modal
// ------------------------------------------------------------
function Modal({ children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
    >
      <div
        className="panel"
        style={{ width: "360px", textAlign: "center", margin: 0 }}
      >
        {children}
      </div>
    </div>
  );
}

// ============================================================
// PROJECT WORKSPACE
// ============================================================
export default function ProjectWorkspace({ project, onClose, onRename }) {
  // ----------------------------------------------------------
  // Project name editing
  // ----------------------------------------------------------
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(project.title);
  const nameInputRef = useRef(null);

  // Keep nameValue in sync if parent updates the project title
  useEffect(() => {
    setNameValue(project.title);
  }, [project.title]);

  const commitName = () => {
    const trimmed = nameValue.trim();
    if (trimmed && trimmed !== project.title) {
      onRename(trimmed);
    } else {
      setNameValue(project.title);
    }
    setEditingName(false);
  };

  // ----------------------------------------------------------
  // Raw items â€” loaded from localStorage on mount
  // ----------------------------------------------------------
  const [rawItems, setRawItems] = useState(() => loadRawItems(project.id));
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemName, setEditingItemName] = useState("");
  // IDs of items whose text is currently shown
  const [expandedRawIds, setExpandedRawIds] = useState([]);
  // ID of last-copied item (for "Copied" feedback)
  const [copiedRawId, setCopiedRawId] = useState(null);

  // Persist raw items whenever they change
  useEffect(() => {
    saveRawItemsForProject(project.id, rawItems);
  }, [rawItems, project.id]);

  const addRawItem = (item) => {
    setRawItems((prev) => [item, ...prev]);
  };

  const toggleIncluded = (id) => {
    setRawItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, included: !item.included, updatedAt: Date.now() }
          : item
      )
    );
  };

  const startRenameItem = (item) => {
    setEditingItemId(item.id);
    setEditingItemName(item.title);
  };

  const commitRenameItem = (id) => {
    const trimmed = editingItemName.trim();
    if (trimmed) {
      setRawItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, title: trimmed, updatedAt: Date.now() }
            : item
        )
      );
    }
    setEditingItemId(null);
  };

  const toggleRawExpanded = (id) => {
    setExpandedRawIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const copyRawItem = (item) => {
    navigator.clipboard.writeText(item.text).catch(() => {});
    setCopiedRawId(item.id);
    setTimeout(() => setCopiedRawId(null), 1400);
  };

  // ----------------------------------------------------------
  // Delete confirmation state
  // deleteTarget: { kind: "raw" | "output", id: string } | null
  // ----------------------------------------------------------
  const [deleteTarget, setDeleteTarget] = useState(null);

  const confirmDelete = (kind, id) => {
    setDeleteTarget({ kind, id });
  };

  const executeDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.kind === "raw") {
      setRawItems((prev) => prev.filter((item) => item.id !== deleteTarget.id));
      // Clean expanded/copied state for deleted item
      setExpandedRawIds((prev) => prev.filter((x) => x !== deleteTarget.id));
      if (copiedRawId === deleteTarget.id) setCopiedRawId(null);
    } else {
      setOutputs((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      if (expandedOutputId === deleteTarget.id) setExpandedOutputId(null);
      if (copiedOutputId === deleteTarget.id) setCopiedOutputId(null);
    }
    setDeleteTarget(null);
  };

  // ----------------------------------------------------------
  // Collect state
  // ----------------------------------------------------------
  const [collectMode, setCollectMode] = useState("url");
  const [urlInput, setUrlInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [collectError, setCollectError] = useState(null);
  const [collectLoading, setCollectLoading] = useState(false);
  const fileRef = useRef(null);

  const handleCollect = async () => {
    setCollectError(null);

    if (collectMode === "url" && !urlInput.trim()) {
      setCollectError("Enter a URL.");
      return;
    }
    if ((collectMode === "file" || collectMode === "image") && !fileInput) {
      setCollectError("Select a file.");
      return;
    }

    setCollectLoading(true);

    try {
      let text = "";
      let type = collectMode;

      if (collectMode === "image") {
        const fd = new FormData();
        fd.append("file", fileInput);
        const data = await analyzeImage(fd);
        text = data.description || "";
      } else {
        const fd = new FormData();
        if (collectMode === "file") {
          fd.append("source_type", "file");
          fd.append("file", fileInput);
        } else {
          fd.append("source_type", "url");
          fd.append("content", urlInput);
        }
        const data = await collectSource(fd);
        text = data.text || "";
      }

      if (!text) {
        setCollectError("No content could be extracted.");
        setCollectLoading(false);
        return;
      }

      const label =
        collectMode === "url"
          ? urlInput
          : fileInput?.name || "Uploaded file";

      const now = Date.now();
      addRawItem({
        id: crypto.randomUUID(),
        projectId: project.id,
        title: label,
        type,
        text,
        included: true,
        createdAt: now,
        updatedAt: now,
      });

      setUrlInput("");
      setFileInput(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (err) {
      setCollectError(err.message || "Collect failed.");
    }

    setCollectLoading(false);
  };

  // ----------------------------------------------------------
  // Convert state
  // ----------------------------------------------------------
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [convertConfirmOpen, setConvertConfirmOpen] = useState(false);
  const [convertLoading, setConvertLoading] = useState(false);

  // Outputs -- loaded from localStorage on mount
  const [outputs, setOutputs] = useState(() => loadOutputs(project.id));
  const [expandedOutputId, setExpandedOutputId] = useState(null);
  const [copiedOutputId, setCopiedOutputId] = useState(null);

  // Persist outputs whenever they change
  useEffect(() => {
    saveOutputsForProject(project.id, outputs);
  }, [outputs, project.id]);

  const includedItems = rawItems.filter((item) => item.included);

  const handleCreateClick = (pkg) => {
    if (includedItems.length === 0) return;
    setSelectedPackage(pkg);
    setConvertConfirmOpen(true);
  };

  const handleConvertConfirm = async () => {
    setConvertConfirmOpen(false);
    setConvertLoading(true);

    const combinedText = includedItems.map((item) => item.text).join("\n\n");
    const backendItems = BACKEND_ITEMS[selectedPackage];
    const sections = [];

    try {
      for (const item of backendItems) {
        const payload = {
          text: combinedText,
          preset: selectedPackage,
          action: "transform",
          option: item,
        };
        console.log("[Convert] request:", { preset: payload.preset, action: payload.action, option: payload.option });
        const result = await nexisUnderstand(payload);
        console.log("[Convert] response ok for:", item);
        sections.push(`=== ${item} ===\n\n${result.output || ""}`);
      }

      setOutputs((prev) => [
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          packageType: selectedPackage,
          content: sections.join("\n\n\n"),
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    } catch (err) {
      const detail = err?.message || String(err);
      console.error("[ProjectWorkspace] Convert failed:", detail, err);
      setOutputs((prev) => [
        {
          id: crypto.randomUUID(),
          projectId: project.id,
          packageType: selectedPackage,
          content: `Error: ${detail}`,
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    }

    setConvertLoading(false);
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "var(--arc-bg)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* --------------------------------------------------------
          TOP BAR
      -------------------------------------------------------- */}
      <div
        style={{
          height: 56,
          background: "#080808",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
          gap: 12,
          flexShrink: 0,
        }}
      >
        <button
  className="btn"
  style={{ padding: "6px 12px" }}
  onClick={onClose}
>
  &larr; Back
</button>

        <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
          {editingName ? (
            <input
              ref={nameInputRef}
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitName();
                if (e.key === "Escape") {
                  setNameValue(project.title);
                  setEditingName(false);
                }
              }}
              autoFocus
              style={{
                background: "transparent",
                border: "1px solid rgba(56,189,248,0.5)",
                borderRadius: 8,
                color: "var(--arc-text)",
                fontSize: "1rem",
                fontWeight: 700,
                padding: "4px 10px",
                width: "auto",
                minWidth: 200,
                marginBottom: 0,
              }}
            />
          ) : (
            <span
              onClick={() => setEditingName(true)}
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                cursor: "text",
                padding: "4px 10px",
                borderRadius: 8,
                border: "1px solid transparent",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = "transparent")
              }
            >
              {nameValue}
            </span>
          )}
        </div>

        <button className="btn" style={{ padding: "6px 12px" }} onClick={onClose}>
          &times;
        </button>
      </div>

      {/* --------------------------------------------------------
          MAIN â€” TWO-PANEL LAYOUT
      -------------------------------------------------------- */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          overflow: "hidden",
        }}
      >
        {/* ======================================================
            LEFT PANEL â€” COLLECT + RAW FILES
        ====================================================== */}
        <div
          style={{
            borderRight: "1px solid rgba(255,255,255,0.08)",
            overflow: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* COLLECT */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="subtle" style={{ fontSize: "1.72rem", marginBottom: 15 }}>1. Collect Sources</div>
            

            <div className="row" style={{ marginBottom: 14 }}>
              {["url", "file", "image"].map((mode) => (
                <button
                  key={mode}
                  className={`btn${collectMode === mode ? " active" : ""}`}
                  onClick={() => {
                    setCollectMode(mode);
                    setCollectError(null);
                  }}
                  disabled={collectLoading}
                >
                  {mode === "url" ? "URL" : mode === "file" ? "File" : "Image"}
                </button>
              ))}
            </div>

            {collectMode === "url" && (
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCollect()}
                placeholder="Enter URL..."
                disabled={collectLoading}
              />
            )}
            {(collectMode === "file" || collectMode === "image") && (
              <input
                ref={fileRef}
                type="file"
                accept={collectMode === "image" ? "image/*" : undefined}
                onChange={(e) => setFileInput(e.target.files?.[0] || null)}
                disabled={collectLoading}
                style={{ marginBottom: 12 }}
              />
            )}

            {collectError && (
              <p
                style={{
                  color: "var(--arc-error)",
                  margin: "0 0 10px",
                  fontSize: "0.88rem",
                }}
              >
                {collectError}
              </p>
            )}

            <button
              className="btn primary"
              onClick={handleCollect}
              disabled={collectLoading}
            >
              {collectLoading ? "Collecting..." : "Collect"}
            </button>
          </div>

          {/* RAW FILES */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="subtle" style={{ fontSize: "1.72rem", marginBottom: 15 }}>2. Review &amp; Select Raw</div>
            

            {rawItems.length === 0 && (
              <p className="subtle" style={{ margin: 0 }}>
                No items collected yet.
              </p>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {rawItems.map((item) => {
                const isExpanded = expandedRawIds.includes(item.id);
                const isCopied = copiedRawId === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.07)",
                      background: "rgba(255,255,255,0.03)",
                      overflow: "hidden",
                    }}
                  >
                    {/* Card header row */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 12px",
                      }}
                    >
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={item.included}
                        onChange={() => toggleIncluded(item.id)}
                        style={{
                          width: 16,
                          height: 16,
                          cursor: "pointer",
                          marginBottom: 0,
                          flexShrink: 0,
                        }}
                      />

                      {/* Title (editable) + type badge */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {editingItemId === item.id ? (
                          <input
                            value={editingItemName}
                            onChange={(e) =>
                              setEditingItemName(e.target.value)
                            }
                            onBlur={() => commitRenameItem(item.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter")
                                commitRenameItem(item.id);
                              if (e.key === "Escape")
                                setEditingItemId(null);
                            }}
                            autoFocus
                            style={{
                              fontSize: "0.88rem",
                              padding: "2px 6px",
                              marginBottom: 0,
                              width: "100%",
                            }}
                          />
                        ) : (
                          <span
                            onClick={() => startRenameItem(item)}
                            style={{
                              fontSize: "0.88rem",
                              cursor: "text",
                              display: "block",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            title={item.title}
                          >
                            {item.title}
                          </span>
                        )}
                        <span
                          className="subtle"
                          style={{
                            fontSize: "0.72rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {item.type}
                        </span>
                      </div>

                      {/* View / Hide */}
                      <button
                        className="btn"
                        style={{ padding: "3px 10px", fontSize: "0.8rem" }}
                        onClick={() => toggleRawExpanded(item.id)}
                      >
                        {isExpanded ? "Hide" : "View"}
                      </button>

                      {/* Copy */}
                      <button
                        className="btn"
                        style={{
                          padding: "3px 10px",
                          fontSize: "0.8rem",
                          ...(isCopied
                            ? { borderColor: "var(--arc-accent)", color: "var(--arc-accent)" }
                            : {}),
                        }}
                        onClick={() => copyRawItem(item)}
                      >
                        {isCopied ? "Copied" : "Copy"}
                      </button>

                      {/* Delete */}
                      <button
                        className="btn"
                        style={{
                          padding: "3px 10px",
                          fontSize: "0.8rem",
                          borderColor: "rgba(239,68,68,0.4)",
                          color: "rgba(239,68,68,0.7)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#ef4444";
                          e.currentTarget.style.color = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                          e.currentTarget.style.color = "rgba(239,68,68,0.7)";
                        }}
                        onClick={() => confirmDelete("raw", item.id)}
                      >
                        Delete
                      </button>
                    </div>

                    {/* Expanded raw text */}
                    {isExpanded && (
                      <div
                        style={{
                          borderTop: "1px solid rgba(255,255,255,0.06)",
                          padding: "12px",
                        }}
                      >
                        <pre
                          style={{
                            margin: 0,
                            fontSize: "0.82rem",
                            maxHeight: 240,
                            overflow: "auto",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        >
                          {item.text}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================================================
            RIGHT PANEL -- CONVERT + OUTPUTS
        ====================================================== */}
        <div
          style={{
            overflow: "auto",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* PACKAGES */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="subtle" style={{ fontSize: "1.72rem", marginBottom: 15 }}>3. Select Package</div>
            

            {includedItems.length === 0 && (
              <p
                className="subtle"
                style={{ fontSize: "0.88rem", marginBottom: 16 }}
              >
                Check at least one raw file to enable convert.
              </p>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              {Object.entries(PACKAGES).map(([key, pkg]) => (
                <div
                  key={key}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "rgba(255,255,255,0.03)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>
                    {pkg.label}
                  </div>

                  <div>
                    <div
                      className="subtle"
                      style={{ fontSize: "0.78rem", marginBottom: 6 }}
                    >
                      Included:
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: 16,
                        lineHeight: "1.8",
                        fontSize: "0.88rem",
                      }}
                    >
                      {pkg.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <button
                    className="btn primary"
                    disabled={includedItems.length === 0 || convertLoading}
                    onClick={() => handleCreateClick(key)}
                    style={{ alignSelf: "flex-start" }}
                  >
                    {convertLoading && selectedPackage === key
                      ? "Processing..."
                      : "Create"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* OUTPUTS */}
          {outputs.length > 0 && (
            <div className="panel" style={{ marginBottom: 0 }}>
              <div className="subtle" style={{ fontSize: "1.72rem", marginBottom: 15 }}>4. Review Output</div>
              

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {outputs.map((out) => {
                  const isExpanded = expandedOutputId === out.id;
                  return (
                    <div
                      key={out.id}
                      style={{
                        borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.08)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "10px 14px",
                          background: "rgba(255,255,255,0.04)",
                          gap: 8,
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <span
                            style={{ fontWeight: 600, fontSize: "0.9rem" }}
                          >
                            {PACKAGES[out.packageType]?.label ||
                              out.packageType}
                          </span>
                          <span
                            className="subtle"
                            style={{
                              fontSize: "0.78rem",
                              marginLeft: 10,
                            }}
                          >
                            {new Date(out.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <button
                          className="btn"
                          style={{ padding: "3px 10px", fontSize: "0.8rem" }}
                          onClick={() =>
                            setExpandedOutputId(isExpanded ? null : out.id)
                          }
                        >
                          {isExpanded ? "Hide" : "View"}
                        </button>
                        <button
                          className="btn"
                          style={{
                            padding: "3px 10px",
                            fontSize: "0.8rem",
                            ...(copiedOutputId === out.id
                              ? { borderColor: "var(--arc-accent)", color: "var(--arc-accent)" }
                              : {}),
                          }}
                          onClick={() => {
                            navigator.clipboard.writeText(out.content).catch(() => {});
                            setCopiedOutputId(out.id);
                            setTimeout(() => setCopiedOutputId(null), 1400);
                          }}
                        >
                          {copiedOutputId === out.id ? "Copied" : "Copy"}
                        </button>
                        <button
                          className="btn"
                          style={{
                            padding: "3px 10px",
                            fontSize: "0.8rem",
                            borderColor: "rgba(239,68,68,0.4)",
                            color: "rgba(239,68,68,0.7)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#ef4444";
                            e.currentTarget.style.color = "#ef4444";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
                            e.currentTarget.style.color = "rgba(239,68,68,0.7)";
                          }}
                          onClick={() => confirmDelete("output", out.id)}
                        >
                          Delete
                        </button>
                      </div>

                      {isExpanded && (
                        <div style={{ padding: "14px" }}>
                          <pre
                            style={{
                              marginTop: 0,
                              maxHeight: 400,
                              overflow: "auto",
                            }}
                          >
                            {out.content}
                          </pre>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --------------------------------------------------------
          CONVERT CONFIRMATION MODAL
      -------------------------------------------------------- */}
      {convertConfirmOpen && selectedPackage && (
        <Modal>
          <h3 style={{ marginTop: 0 }}>Confirm Convert</h3>

          <div style={{ textAlign: "left", marginBottom: 16 }}>
            <div
              className="subtle"
              style={{ fontSize: "0.85rem", marginBottom: 8 }}
            >
              Package:{" "}
              <strong style={{ color: "var(--arc-text)" }}>
                {PACKAGES[selectedPackage].label}
              </strong>
            </div>
            <div
              className="subtle"
              style={{ fontSize: "0.85rem", marginBottom: 6 }}
            >
              Using {includedItems.length} item
              {includedItems.length !== 1 ? "s" : ""}:
            </div>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: "0.85rem",
                lineHeight: "1.8",
              }}
            >
              {includedItems.map((item) => (
                <li key={item.id}>{item.title}</li>
              ))}
            </ul>
          </div>

          <div className="row" style={{ justifyContent: "center" }}>
            <button
              className="btn"
              onClick={() => {
                setConvertConfirmOpen(false);
                setSelectedPackage(null);
              }}
            >
              Cancel
            </button>
            <button className="btn primary" onClick={handleConvertConfirm}>
              Confirm
            </button>
          </div>
        </Modal>
      )}

      {/* --------------------------------------------------------
          DELETE CONFIRMATION MODAL
      -------------------------------------------------------- */}
      {deleteTarget && (
        <Modal>
          <h3 style={{ marginTop: 0 }}>Delete this item?</h3>
          <p className="subtle" style={{ marginBottom: 20 }}>
            This action cannot be undone.
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
        </Modal>
      )}
    </div>
  );
}


