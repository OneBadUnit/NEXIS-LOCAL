import React, { useState, useEffect } from "react";

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
    <div className="module-container">
      <h1 className="module-title">Settings</h1>

      {/* OUTPUT WINDOW FONT SIZE */}
      <div className="panel">
        <h3>Output Window Font Size</h3>

        <p style={{ opacity: 0.7, marginBottom: "8px" }}>Preview:</p>

        <div
          style={{
            padding: "12px",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.05)",
            marginBottom: "16px",
            fontSize: "var(--arc-font-size)",
          }}
        >
          Teaching snakes to kick.
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            className={`btn ${fontSize === "small" ? "active" : ""}`}
            onClick={() => setFontSize("small")}
          >
            Small
          </button>

          <button
            className={`btn ${fontSize === "medium" ? "active" : ""}`}
            onClick={() => setFontSize("medium")}
          >
            Medium
          </button>

          <button
            className={`btn ${fontSize === "large" ? "active" : ""}`}
            onClick={() => setFontSize("large")}
          >
            Large
          </button>
        </div>
      </div>

      {/* SYSTEM INFO */}
      <div className="panel">
        <h3>System Info</h3>

        <div style={{ marginTop: "10px", lineHeight: "1.6" }}>
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
