import React, { useContext, useState } from "react";
import { ArcNContext } from "../context/ArcNContext";
import TranscriptOutput from "../components/TranscriptOutput";
import CopyButton from "../components/CopyButton";
import ScrollTopButton from "../components/ScrollTopButton";

export default function Assimilation() {
  const {
    assimilationState,
    setAssimilationState,
    savedAssimilations,
    setSavedAssimilations,
    saveAssimilation,
    globalLoading,
    runWithGlobalLoading,
  } = useContext(ArcNContext);

  const { inputType, url, file, result } = assimilationState;

  const update = (patch) =>
    setAssimilationState((prev) => ({ ...prev, ...patch }));

  const switchMode = (mode) => {
    if (globalLoading) return;

    if (mode === "url") update({ inputType: "url", file: null });
    if (mode === "file") update({ inputType: "file", url: "", file: null });
    if (mode === "picture") update({ inputType: "picture", url: "", file: null });
  };

  // ============================================================
  // HANDLE SUBMIT (GLOBAL LOADING + VALIDATION)
  // ============================================================
  const handleSubmit = (e) => {
    e.preventDefault();

    // ---------------------------------------------
    // VALIDATION — prevent empty submissions
    // ---------------------------------------------
    if (
      (inputType === "url" && (!url || !url.trim())) ||
      (inputType === "file" && !file) ||
      (inputType === "picture" && !file)
    ) {
      alert("Please provide a valid URL, document, or picture before assimilating.");
      return;
    }

    runWithGlobalLoading(async () => {
      const visionEndpoint = "http://127.0.0.1:8000/vision/analyze";
      const assimilationEndpoint = "http://127.0.0.1:8000/assimilation/process";

      try {
        // ============================================================
        // PICTURE MODE → /vision/analyze (FormData)
        // ============================================================
        if (inputType === "picture") {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch(visionEndpoint, {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          const transcriptText =
            typeof data?.ocr_text === "string" && data.ocr_text.trim() !== ""
              ? data.ocr_text
              : data?.description || "";

          const thumbnail = data?.thumbnail || null;

          update({
            result: {
              ...data,
              transcript: { plain_text: transcriptText },
              thumbnail,
            },
          });

          saveAssimilation({
            id: crypto.randomUUID(),
            name: file?.name || "Picture Assimilation",
            inputType,
            url: "",
            fileName: file?.name || null,
            transcript: transcriptText,
            timestamp: Date.now(),
            thumbnail,
          });

          return;
        }

        // ============================================================
        // DOCUMENT MODE → /assimilation/process (FormData)
        // ============================================================
        if (inputType === "file") {
          const formData = new FormData();
          formData.append("source_type", "file");
          formData.append("content", "");
          formData.append("file", file);

          const res = await fetch(assimilationEndpoint, {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          const transcriptText =
            typeof data?.text === "string"
              ? data.text
              : data?.content || data?.description || "";

          update({
            result: {
              ...data,
              transcript: { plain_text: transcriptText },
            },
          });

          saveAssimilation({
            id: crypto.randomUUID(),
            name: file?.name || "Document Assimilation",
            inputType,
            url: "",
            fileName: file?.name || null,
            transcript: transcriptText,
            timestamp: Date.now(),
            thumbnail: null,
          });

          return;
        }

        // ============================================================
        // URL MODE → MUST USE FORMDATA (NOT JSON)
        // ============================================================
        if (inputType === "url") {
          const formData = new FormData();
          formData.append("source_type", "url");
          formData.append("content", url);

          // Required: send empty file field
          formData.append(
            "file",
            new Blob([], { type: "application/octet-stream" }),
            ""
          );

          const res = await fetch(assimilationEndpoint, {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          const transcriptText =
            typeof data?.text === "string"
              ? data.text
              : data?.content || data?.description || "";

          update({
            result: {
              ...data,
              transcript: { plain_text: transcriptText },
            },
          });

          saveAssimilation({
            id: crypto.randomUUID(),
            name: url || "URL Assimilation",
            inputType,
            url,
            fileName: null,
            transcript: transcriptText,
            timestamp: Date.now(),
            thumbnail: null,
          });

          return;
        }
      } catch (err) {
        console.error("Assimilation error:", err);
      }
    });
  };

  // ============================================================
  // CLEAR FORM
  // ============================================================
  const clearForm = () => {
    if (!window.confirm("Really?")) return;
    if (!window.confirm("Really really?")) return;

    update({ url: "", file: null, result: null });
  };

  const rename = (id, newName) => {
    setSavedAssimilations((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, name: newName } : item
      )
    );
  };

  const deleteAssimilation = (id) => {
    setSavedAssimilations((prev) => prev.filter((item) => item.id !== id));
  };

  const currentTranscriptText =
    typeof result?.transcript?.plain_text === "string"
      ? result.transcript.plain_text
      : "";

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="module-container">
      <h1 className="module-title">Assimilation</h1>

      {/* MODE SWITCH */}
      <div className="panel" style={{ textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", gap: "10px" }}>
          <button
            className={`btn ${inputType === "url" ? "active" : ""}`}
            onClick={() => switchMode("url")}
            disabled={globalLoading}
          >
            URL
          </button>

          <button
            className={`btn ${inputType === "file" ? "active" : ""}`}
            onClick={() => switchMode("file")}
            disabled={globalLoading}
          >
            Documents
          </button>

          <button
            className={`btn ${inputType === "picture" ? "active" : ""}`}
            onClick={() => switchMode("picture")}
            disabled={globalLoading}
          >
            Picture
          </button>
        </div>
      </div>

      {/* INPUT PANEL */}
      <div className="panel">
        <form onSubmit={handleSubmit} style={{ textAlign: "center" }}>
          {inputType === "url" && (
            <input
              type="text"
              placeholder="Enter URL…"
              value={url}
              onChange={(e) => update({ url: e.target.value })}
              disabled={globalLoading}
              style={{ width: "100%", marginBottom: "12px" }}
            />
          )}

          {inputType === "file" && (
            <input
              key="file-input"
              type="file"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                update({ file: selected });
              }}
              disabled={false}
              style={{ width: "100%", marginBottom: "12px" }}
            />
          )}

          {inputType === "picture" && (
            <input
              key="picture-input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const selected = e.target.files?.[0] ?? null;
                update({ file: selected });
              }}
              disabled={false}
              style={{ width: "100%", marginBottom: "12px" }}
            />
          )}

          <button type="submit" className="btn" disabled={globalLoading}>
            {globalLoading ? "Assimilating…" : "Assimilate"}
          </button>
        </form>
      </div>

      {/* SAVED ASSIMILATIONS */}
      <div className="panel">
        <h3>Saved Assimilations</h3>

        {savedAssimilations.length === 0 && (
          <p>No saved assimilations yet.</p>
        )}

        {savedAssimilations.map((item) => (
          <SavedCard
            key={item.id}
            item={item}
            rename={rename}
            deleteAssimilation={deleteAssimilation}
          />
        ))}
      </div>

      {/* OUTPUT */}
      <div className="panel">
        <TranscriptOutput transcript={currentTranscriptText} />

        {currentTranscriptText && (
          <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
            <CopyButton text={currentTranscriptText} />
            <button className="btn" onClick={clearForm}>
              Clear Form
            </button>
          </div>
        )}
      </div>

      <ScrollTopButton />
    </div>
  );
}

function SavedCard({ item, rename, deleteAssimilation }) {
  const [editing, setEditing] = useState(false);
  const [tempName, setTempName] = useState(item.name);
  const [expanded, setExpanded] = useState(false);

  const commit = () => {
    rename(item.id, tempName.trim() || "Untitled Assimilation");
    setEditing(false);
  };

  return (
    <div className="panel" style={{ marginBottom: "20px" }}>
      {item.thumbnail && (
        <img
          src={item.thumbnail}
          alt="thumbnail"
          style={{
            width: "100%",
            borderRadius: "6px",
            marginBottom: "10px",
          }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        {editing ? (
          <input
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            autoFocus
            style={{ flex: 1, marginRight: "10px" }}
          />
        ) : (
          <span
            style={{ fontWeight: "600", cursor: "pointer" }}
            onClick={() => setEditing(true)}
          >
            {item.name}
          </span>
        )}

        <button className="btn btn-small" onClick={() => deleteAssimilation(item.id)}>
          ✕
        </button>
      </div>

      <button
        className="btn"
        style={{ marginTop: "10px" }}
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Hide Transcript" : "View Transcript"}
      </button>

      {expanded && (
        <div style={{ marginTop: "10px" }}>
          <pre>{item.transcript || ""}</pre>
          <CopyButton text={item.transcript || ""} />
        </div>
      )}
    </div>
  );
}
