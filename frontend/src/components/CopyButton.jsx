import React, { useState } from "react";
import "../styles/ui-widgets.css";


export default function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <button className={`copy-button ${copied ? "copied" : ""}`} onClick={handleCopy}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}
