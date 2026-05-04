// ============================================================
// ARC-NEXUS - TOP BAR
// File: src/layout/TopBar.jsx
// Version: 005 (Split Nav + Center Logo)
// ============================================================

import logo from "../nexis2.png";

const LEFT_NAV = [
  { id: "nexus", label: "HOME" },
  { id: "assimilation", label: "COLLECT" },
  { id: "reconstruction", label: "CONVERT" },
];

const RIGHT_NAV = [
  { id: "creation", label: "CREATE" },
  { id: "settings", label: "SETTINGS" },
  { id: "help", label: "HELP" },
];

export default function TopBar({ activePage, setActivePage }) {
  return (
    <header className="topnav">
      
      {/* LEFT */}
      <nav className="nav-left">
        {LEFT_NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {/* CENTER LOGO */}
      <button
        className="brand"
        onClick={() => setActivePage("nexus")}
      >
        <img src={logo} alt="ArcNexus" className="brand-logo" />
      </button>

      {/* RIGHT */}
      <nav className="nav-right">
        {RIGHT_NAV.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

    </header>
  );
}