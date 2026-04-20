import React, { useContext, useState } from "react";
import { ArcNContext } from "../context/ArcNContext";
import TranscriptOutput from "../components/TranscriptOutput";
import CopyButton from "../components/CopyButton";
import ScrollTopButton from "../components/ScrollTopButton";
import "./assimilation.css";

export default function Assimilation() {
  const {
    assimilationState,
    setAssimilationState,
    savedAssimilations,
    setSavedAssimilations,
    saveAssimilation,
  } = useContext(ArcNContext);

  const { inputType, url, file, loading, result } = assimilationState;

  const update = (patch) =>
    setAssimilationState((prev) => ({ ...prev, ...patch }));

  const switchMode = (mode) => {
    if (loading) return;

    if (mode === "url") {
      update({ inputType: "url", file: null });
    } else if (mode === "file") {
      update({ inputType: "file", url: "" });
    } else if (mode === "picture") {
      update({ inputType: "picture", url: "", file: null });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    update({ loading: true });

    try {
      let endpoint = "http://127.0.0.1:8000/assimilate";
      const formData = new FormData();

      if (inputType === "url" && url.trim() !== "") {
        formData.append("url", url);
      }

      if (inputType === "file" && file) {
        formData.append("file", file);
      }

      if (inputType === "picture" && file) {
        endpoint = "http://127.0.0.1:8000/vision";
        formData.append("file", file);
      }

      const res = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      let transcriptText = "";

      if (inputType === "picture") {
        if (typeof data?.ocr_text === "string" && data.ocr_text.trim() !== "") {
          transcriptText = data.ocr_text;
        } else if (typeof data?.description === "string") {
          transcriptText = data.description;
        }
      } else {
        if (typeof data?.content === "string") {
          transcriptText = data.content;
        } else if (typeof data?.description === "string") {
          transcriptText = data.description;
        }
      }

      const thumbnail =
        inputType === "picture" && data?.thumbnail ? data.thumbnail : null;

      const normalizedResult = {
        ...data,
        transcript: {
          plain_text: transcriptText,
        },
        thumbnail,
      };

      update({ result: normalizedResult });

      const assimilationName =
        inputType === "url" ? url : file?.name || "Untitled Assimilation";

      saveAssimilation({
        id: crypto.randomUUID(),
        name: assimilationName,
        inputType,
        url,
        fileName: file?.name || null,
        transcript: transcriptText,
        timestamp: Date.now(),
        thumbnail,
      });
    } catch (err) {
      console.error("Assimilation error:", err);
    } finally {
      update({ loading: false });
    }
  };

  const clearForm = () => {
    if (!window.confirm("Really?")) return;
    if (!window.confirm("Really really?")) return;

    update({
      url: "",
      file: null,
      result: null,
    });
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

  return (
    <div className="assimilation-wrapper">

      {/* TITLE */}
      <h2 className="assimilation-title">Assimilation</h2>

      {/* TOP BUTTONS OUTSIDE CARD */}
      <div className="assimilation-top-controls">
        <div className="input-type-toggle">
          <button
            className={`assim-btn ${inputType === "url" ? "active" : ""} ${loading ? "disabled" : ""}`}
            onClick={() => switchMode("url")}
            disabled={loading}
          >
            URL
          </button>

          <button
            className={`assim-btn ${inputType === "file" ? "active" : ""} ${loading ? "disabled" : ""}`}
            onClick={() => switchMode("file")}
            disabled={loading}
          >
            Documents
          </button>

          <button
            className={`assim-btn ${inputType === "picture" ? "active" : ""} ${loading ? "disabled" : ""}`}
            onClick={() => switchMode("picture")}
            disabled={loading}
          >
            Picture
          </button>
        </div>
      </div>

      {/* CARD HOLDS INPUT + ASSIMILATE BUTTON */}
      <div className="assimilation-center-box">
        <form id="assim-form" onSubmit={handleSubmit} className="assimilation-form">

          {inputType === "url" && (
            <input
              type="text"
              placeholder="Enter URL…"
              value={url}
              onChange={(e) => update({ url: e.target.value })}
              disabled={loading}
            />
          )}

          {inputType === "file" && (
            <input
              type="file"
              onChange={(e) => update({ file: e.target.files[0] })}
              disabled={loading}
            />
          )}

          {inputType === "picture" && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => update({ file: e.target.files[0] })}
              disabled={loading}
            />
          )}

          {/* ASSIMILATE BUTTON INSIDE CARD */}
          <button
            type="submit"
            className={`assim-submit-btn ${loading ? "disabled" : ""}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                <span style={{ marginLeft: "10px" }}>Resistance is futile…</span>
              </>
            ) : (
              "Assimilate"
            )}
          </button>

        </form>
      </div>

      {/* SAVED ASSIMILATIONS */}
      <div className="saved-assimilations-panel">
        <h3>Saved Assimilations</h3>

        <div className="saved-assimilations-list">
          {savedAssimilations.length === 0 && (
            <p className="empty-saved">No saved assimilations yet.</p>
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
      </div>

      {/* OUTPUT */}
      <div className="assimilation-output">
        <TranscriptOutput transcript={currentTranscriptText} />

        {currentTranscriptText && (
          <div className="output-actions">
            <CopyButton text={currentTranscriptText} />
            <button className="clear-button" onClick={clearForm}>
              Clear Form
            </button>
          </div>
        )}

        {result?.transcript && (
          <details style={{ marginTop: "20px" }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
              OCR Metadata
            </summary>
            <pre
              style={{
                background: "#222",
                color: "#0f0",
                padding: "12px",
                borderRadius: "8px",
                marginTop: "12px",
                overflowX: "auto",
              }}
            >
              {JSON.stringify(result.transcript, null, 2)}
            </pre>
          </details>
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
    <div className="saved-card">
      {item.thumbnail && (
        <div className="saved-card-thumbnail-container">
          <img
            src={item.thumbnail}
            alt="thumbnail"
            className="saved-card-thumbnail"
          />
        </div>
      )}

      <div className="saved-card-header">
        {editing ? (
          <input
            className="rename-input"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => e.key === "Enter" && commit()}
            autoFocus
          />
        ) : (
          <span className="saved-card-name" onClick={() => setEditing(true)}>
            {item.name}
          </span>
        )}

        <div className="saved-card-right">
          <span className="saved-card-time">
            {new Date(item.timestamp).toLocaleString()}
          </span>

          <button
            className="delete-btn"
            onClick={() => deleteAssimilation(item.id)}
          >
            ✕
          </button>
        </div>
      </div>

      <button
        className="toggle-transcript-btn"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? "Hide Transcript" : "View Transcript"}
      </button>

      {expanded && (
        <div className="saved-card-transcript">
          <pre>{item.transcript || ""}</pre>
        </div>
      )}
    </div>
  );
}
