// ============================================================
// ARC-NEXUS - NEXIS COLLECT PAGE
// File: src/pages/Assimilation.jsx
// Version: 004 (ESLint Cleanup)
// ============================================================

import React, { useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";
import { collectSource, analyzeImage } from "../api/api";

import TranscriptOutput from "../components/TranscriptOutput";
import CopyButton from "../components/CopyButton";
import ScrollTopButton from "../components/ScrollTopButton";

export default function Assimilation() {
  const {
    assimilationState,
    setAssimilationState,
    saveAssimilation,
    globalLoading,
    runWithGlobalLoading,
  } = useContext(ArcNContext);

  const { inputType, url, file, result } = assimilationState;

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
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      (inputType === "url" && !url.trim()) ||
      ((inputType === "file" || inputType === "picture") && !file)
    ) {
      alert("Provide valid input.");
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
            id: crypto.randomUUID(),
            name: file.name,
            transcript: text,
            timestamp: Date.now(),
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
          id: crypto.randomUUID(),
          name: inputType === "url" ? url : file.name,
          transcript: text,
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error("Collect error:", error);
      }
    });
  };

  const clearForm = () => {
    update({ url: "", file: null, result: null });
  };

  const currentText = result?.transcript?.plain_text || "";

  return (
    <div className="module-container">
      <h1 className="module-title">COLLECT</h1>

      <div className="panel">
        <div className="row">
          {["URL", "File", "Picture"].map((mode) => (
            <button
              key={mode}
              className={`btn ${inputType === mode ? "active" : ""}`}
              onClick={() => switchMode(mode)}
              disabled={globalLoading}
            >
              {mode}
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

          <button className="btn" disabled={globalLoading}>
            {globalLoading ? "Processing..." : "Collect"}
          </button>
        </form>
      </div>

      <div className="panel">
        <TranscriptOutput transcript={currentText} />

        {currentText && (
          <div className="row">
            <CopyButton text={currentText} />
            <button className="btn" onClick={clearForm}>
              Clear
            </button>
          </div>
        )}
      </div>

      <ScrollTopButton />
    </div>
  );
}