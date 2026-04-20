import React, { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [theme, setTheme] = useState("theme-dark");

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

  useEffect(() => {
    document.body.classList.remove("theme-dark", "theme-light");
    document.body.classList.add(theme);
    localStorage.setItem("arcn-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === "theme-dark" ? "theme-light" : "theme-dark"));
  };

  return (
    <button className="theme-toggle" onClick={toggleTheme}>
      {theme === "theme-dark" ? "🌙" : "☀️"}
    </button>
  );
};

export default ThemeToggle;
