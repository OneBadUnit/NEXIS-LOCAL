import React from "react";
import "./ui-widgets.css";

export default function ScrollTopButton() {
  return (
    <button
      className="scroll-top-button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      ↑
    </button>
  );
}
