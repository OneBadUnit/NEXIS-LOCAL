import React, { useState, useEffect } from "react";
import "./settings.css";

/* STATIC BUILD TIME */
const BUILD_TIME = new Date().toLocaleString();

export default function Settings() {
  const [fontSize, setFontSize] = useState(
    localStorage.getItem("arcFontSize") || "medium"
  );

  /* APPLY FONT SIZE GLOBALLY */
  useEffect(() => {
    const sizeMap = {
      small: "0.9rem",
      medium: "1rem",
      large: "1.2rem",
    };

    document.documentElement.style.setProperty(
      "--arc-font-size",
      sizeMap[fontSize]
    );

    localStorage.setItem("arcFontSize", fontSize);
  }, [fontSize]);

  const systemInfo = {
    version: "ARC‑NEXUS v1.0.0",
    build: BUILD_TIME,
    browser: navigator.userAgent,
    platform: navigator.platform,
    resolution: `${window.innerWidth} x ${window.innerHeight}`,
  };

  return (
    <div className="settings-wrapper">
      <h2 className="settings-title">Settings</h2>

      {/* OUTPUT WINDOW FONT SIZE */}
      <div className="settings-card">
        <h3>Output Window Font Size</h3>
        <p className="preview-label">Preview:</p>
        <div className="font-preview">
          Teaching snakes to kick.
        </div>

        <div className="font-size-options">
          <button
            className={`font-btn ${fontSize === "small" ? "active" : ""}`}
            onClick={() => setFontSize("small")}
          >
            Small
          </button>

          <button
            className={`font-btn ${fontSize === "medium" ? "active" : ""}`}
            onClick={() => setFontSize("medium")}
          >
            Medium
          </button>

          <button
            className={`font-btn ${fontSize === "large" ? "active" : ""}`}
            onClick={() => setFontSize("large")}
          >
            Large
          </button>
        </div>
      </div>

      {/* SYSTEM INFO */}
      <div className="settings-card">
        <h3>System Info</h3>

        <div className="system-info">
          <p><strong>Version:</strong> {systemInfo.version}</p>
          <p><strong>Build Time:</strong> {systemInfo.build}</p>
          <p><strong>Browser:</strong> {systemInfo.browser}</p>
          <p><strong>Platform:</strong> {systemInfo.platform}</p>
          <p><strong>Resolution:</strong> {systemInfo.resolution}</p>
        </div>
      </div>
    </div>
  );
}
