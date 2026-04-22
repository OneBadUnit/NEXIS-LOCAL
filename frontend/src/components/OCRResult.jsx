import React from "react";
import "../styles/ui-widgets.css";   // for panel, neon, spacing, etc.

export default function OCRResult({ data }) {
  if (!data) return null;

  return (
    <div className="ocr-result-container">
      <h2 className="ocr-title">OCR Result</h2>

      {/* Plain text */}
      <div className="ocr-plain-text">
        {data.plain_text || "(no text detected)"}
      </div>

      {/* Metadata */}
      <details className="ocr-metadata-block">
        <summary className="ocr-metadata-summary">Metadata</summary>

        <pre className="ocr-metadata-pre">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
