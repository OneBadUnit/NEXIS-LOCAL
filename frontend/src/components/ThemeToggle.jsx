// ============================================================
// THEME TOGGLE
// Handles switching between ARC‑NEXUS light and dark themes.
// Persists the user's theme preference in localStorage.
// Applies theme classes directly to <body> for global styling.
// Styling is handled in: /styles/theme.css
// ============================================================

import React, { useEffect, useState } from "react";

export default function ThemeToggle() {
  // ------------------------------------------------------------
  // Local theme state (default: dark mode)
  // ------------------------------------------------------------
  const [theme, setTheme] = useState("theme-dark");

  // ------------------------------------------------------------
  // Load saved theme on initial mount
  // ------------------------------------------------------------
  useEffect(() => {
    const saved = localStorage.getItem("arcn-theme");

    if (saved) {
      setTheme(saved);
      document.body.classList.remove("theme-dark", "theme-light");
      document.body.classList.add(saved);
    } else {
      document.body.classList.add("theme-dark");
    }
  }, []);

  // ------------------------------------------------------------
  // Apply theme changes and persist to localStorage
  // ------------------------------------------------------------
  useEffect(() => {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(theme);
    localStorage.setItem("arcn-theme", theme);
  }, [theme]);

  // ------------------------------------------------------------
  // Toggle between light and dark themes
  // ------------------------------------------------------------
  const toggleTheme = () => {
    setTheme(prev =>
      prev === "theme-dark" ? "theme-light" : "theme-dark"
    );
  };

  // ------------------------------------------------------------
  // Render theme toggle button (moon / sun icon)
  // ------------------------------------------------------------
  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === "theme-dark" ? "🌙" : "☀️"}
    </button>
  );
}
