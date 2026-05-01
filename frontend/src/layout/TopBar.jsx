// ============================================================
// ARC-NEXUS - TOP BAR
// File: src/layout/TopBar.jsx
// Version: 002 (Product UI Navigation)
// ============================================================

const NAV_ITEMS = [
  { id: "nexus", label: "NEXUS" },
  { id: "assimilation", label: "COLLECT" },
  { id: "reconstruction", label: "CONVERT" },
  { id: "creation", label: "CREATE" },
  { id: "settings", label: "SETTINGS" },
  { id: "help", label: "HELP" },
];

export default function TopBar({ activePage, setActivePage }) {
  return (
    <header className="topnav">
      <button
        className="brand"
        type="button"
        onClick={() => setActivePage("nexus")}
        aria-label="Go to Nexus dashboard"
      >
        <span className="brand-acr">ARC</span>
        <span className="brand-nexus">NEXUS</span>
      </button>

      <nav className="nav-items" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
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