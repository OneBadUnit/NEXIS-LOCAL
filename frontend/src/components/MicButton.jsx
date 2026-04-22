import React from "react";
import "../styles/ui-widgets.css";

export default function MicButton({ onClick }) {
  return (
    <button className="mic-button" onClick={onClick}>
      🎤
    </button>
  );
}
