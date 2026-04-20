import React from "react";

export default function OCRResult({ data }) {
  if (!data) return null;

  return (
    <div style={{ marginTop: "20px" }}>
      <h2>OCR Result</h2>

      {/* Plain text */}
      <div
        style={{
          padding: "12px",
          background: "#f5f5f5",
          borderRadius: "8px",
          marginBottom: "16px",
          whiteSpace: "pre-wrap",
          fontFamily: "monospace",
        }}
      >
        {data.plain_text || "(no text detected)"}
      </div>

      {/* Metadata */}
      <details>
        <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
          Metadata
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
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  );
}
