// ============================================================
// TRANSCRIPT OUTPUT
// Displays processed transcript text from OCR, Whisper, or URL
// extraction. Handles empty state and ensures clean formatting.
// Styling is handled in: /styles/transcriptOutput.css
// ============================================================

import React from "react";
import "../styles/transcriptOutput.css";

export default function TranscriptOutput({ transcript }) {
  // ------------------------------------------------------------
  // Empty state: no transcript available yet
  // ------------------------------------------------------------
  if (!transcript) {
    return (
      <div className="transcript-output">
        <p className="transcript-placeholder">
          Transcript output will appear here.
        </p>
      </div>
    );
  }

  // ------------------------------------------------------------
  // Render transcript text block
  // ------------------------------------------------------------
  return (
    <div className="transcript-output">
      <div className="transcript-text">{transcript}</div>
    </div>
  );
}
