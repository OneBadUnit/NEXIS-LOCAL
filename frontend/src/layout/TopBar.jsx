// ============================================================
// TOPBAR + NAVBAR (Unified ARC‑NEXUS Command Bar)
// Single fixed header containing brand + module navigation.
// ============================================================

export default function TopBar({ activePage, setActivePage }) {
  return (
    <div className="topnav">

      {/* -------------------------------------------------------- */}
      {/* ARC / NEXUS BRANDING */}
      {/* -------------------------------------------------------- */}
      <div className="brand" onClick={() => setActivePage("nexus")}>
        <div className="brand-acr">A R C</div>
        <div className="brand-nexus">NEXUS</div>
      </div>

      {/* -------------------------------------------------------- */}
      {/* MODULE NAVIGATION */}
      {/* -------------------------------------------------------- */}
      <div className="nav-items">

        <div
          className={`nav-item ${activePage === "assimilation" ? "active" : ""}`}
          onClick={() => setActivePage("assimilation")}
        >
          Assimilation
        </div>

        <div
          className={`nav-item ${activePage === "reconstruction" ? "active" : ""}`}
          onClick={() => setActivePage("reconstruction")}
        >
          Reconstruction
        </div>

        <div
          className={`nav-item ${activePage === "creation" ? "active" : ""}`}
          onClick={() => setActivePage("creation")}
        >
          Creation
        </div>

        <div
          className={`nav-item ${activePage === "settings" ? "active" : ""}`}
          onClick={() => setActivePage("settings")}
        >
          Settings
        </div>

        <div
          className={`nav-item ${activePage === "help" ? "active" : ""}`}
          onClick={() => setActivePage("help")}
        >
          Help
        </div>

      </div>
    </div>
  );
}
