// frontend/src/components/TranscriptOutput.jsx

import React from "react";
import "./transcriptOutput.css";

export default function TranscriptOutput({ transcript }) {
  if (!transcript) {
    return (
      <div className="transcript-output">
        <p className="transcript-placeholder">
          Transcript output will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="transcript-output">
      <div className="transcript-text">{transcript}</div>
    </div>
  );
}
