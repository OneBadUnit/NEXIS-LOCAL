// ============================================================
// ARC-NEXUS - NEXIS COLLECT PAGE
// File: src/pages/Assimilation.jsx
// Version: 005 (Mode Fix + Saved Panel + Convert Integration)
// ============================================================

import React, { useState, useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";
import { collectSource, analyzeImage } from "../api/api";

import TranscriptOutput from "../components/TranscriptOutput";
import CopyButton from "../components/CopyButton";
import ScrollTopButton from "../components/ScrollTopButton";
import SavedCardsPanel from "../components/SavedCardsPanel";

export default function Assimilation() {
  const {
    assimilationState,
    setAssimilationState,
    saveAssimilation,
    savedAssimilations,
    setSavedAssimilations,
    globalLoading,
    runWithGlobalLoading,
    setReconstructionState,
  } = useContext(ArcNContext);

  const { inputType, url, file, result } = assimilationState;

  const [error, setError] = useState(null);

  const label = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  const update = (patch) =>
    setAssimilationState((prev) => ({ ...prev, ...patch }));

  const switchMode = (mode) => {
    if (globalLoading) return;

    update({
      inputType: mode,
      url: mode === "url" ? url : "",
      file: null,
      result: null,
    });

    setError(null);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setError(null);

    if (inputType === "url" && !url.trim()) {
      setError("Enter a URL.");
      return;
    }

    if ((inputType === "file" || inputType === "picture") && !file) {
      setError("Select a file.");
      return;
    }

    runWithGlobalLoading(async () => {
      try {
        if (inputType === "picture") {
          const formData = new FormData();
          formData.append("file", file);

          const data = await analyzeImage(formData);
          const text = data.description || "";

          update({
            result: {
              transcript: { plain_text: text },
            },
          });

          saveAssimilation({
            title: file.name,
            text,
          });

          return;
        }

        const formData = new FormData();

        if (inputType === "file") {
          formData.append("source_type", "file");
          formData.append("file", file);
        }

        if (inputType === "url") {
          formData.append("source_type", "url");
          formData.append("content", url);
        }

        const data = await collectSource(formData);
        const text = data.text || "";

        update({
          result: {
            transcript: { plain_text: text },
          },
        });

        saveAssimilation({
          title: inputType === "url" ? url : file.name,
          text,
        });
      } catch (err) {
        setError(err.message || "Failed to collect. Check input and try again.");
      }
    });
  };

  const clearForm = () => {
    update({ url: "", file: null, result: null });
    setError(null);
  };

  const sendToConvert = () => {
    if (!currentText) return;
    setReconstructionState((prev) => ({ ...prev, input: currentText }));
  };

  const deleteItem = (id) => {
    setSavedAssimilations((prev) => prev.filter((item) => item.id !== id));
  };

  const currentText = result?.transcript?.plain_text || "";

  return (
    <div className="module-container">
      <h1 className="module-title">COLLECT</h1>

      <div className="panel">
        <div className="row">
          {["url", "file", "picture"].map((mode) => (
            <button
              key={mode}
              className={`btn ${inputType === mode ? "active" : ""}`}
              onClick={() => switchMode(mode)}
              disabled={globalLoading}
            >
              {label(mode)}
            </button>
          ))}
        </div>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          {inputType === "url" && (
            <input
              value={url}
              onChange={(event) => update({ url: event.target.value })}
              placeholder="Enter URL"
            />
          )}

          {(inputType === "file" || inputType === "picture") && (
            <input
              type="file"
              accept={inputType === "picture" ? "image/*" : undefined}
              onChange={(event) =>
                update({ file: event.target.files?.[0] || null })
              }
            />
          )}

          {error && (
            <p style={{ color: "var(--accent-red, #e05a5a)", marginTop: 8, marginBottom: 0 }}>
              {error}
            </p>
          )}

          <button className="btn" disabled={globalLoading}>
            {globalLoading ? "Processing..." : "Collect"}
          </button>
        </form>
      </div>

      <div className="panel">
        <TranscriptOutput transcript={currentText} />

        {currentText && (
          <div className="row" style={{ marginTop: 10 }}>
            <CopyButton text={currentText} />
            <button className="btn" onClick={sendToConvert}>
              Send to Convert
            </button>
            <button className="btn" onClick={clearForm}>
              Clear
            </button>
          </div>
        )}
      </div>

      <div className="panel">
        <SavedCardsPanel
          savedItems={savedAssimilations}
          onDelete={deleteItem}
        />
      </div>

      <ScrollTopButton />
    </div>
  );
}