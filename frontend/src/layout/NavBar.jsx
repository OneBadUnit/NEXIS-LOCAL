// ============================================================
// NAVBAR — Module Navigation Bar
// Fixed under the TopBar. Controls module switching.
// ============================================================

export default function NavBar({ activePage, setActivePage }) {
  return (
    <div className="navbar">

      {/* -------------------------------------------------------- */}
      {/* ASSIMILATION */}
      {/* -------------------------------------------------------- */}
      <div
        className={`nav-item ${activePage === "assimilation" ? "active" : ""}`}
        onClick={() => setActivePage("assimilation")}
      >
        Assimilation
      </div>

      {/* -------------------------------------------------------- */}
      {/* RECONSTRUCTION */}
      {/* -------------------------------------------------------- */}
      <div
        className={`nav-item ${activePage === "reconstruction" ? "active" : ""}`}
        onClick={() => setActivePage("reconstruction")}
      >
        Reconstruction
      </div>

      {/* -------------------------------------------------------- */}
      {/* CREATION */}
      {/* -------------------------------------------------------- */}
      <div
        className={`nav-item ${activePage === "creation" ? "active" : ""}`}
        onClick={() => setActivePage("creation")}
      >
        Creation
      </div>

      {/* -------------------------------------------------------- */}
      {/* SETTINGS */}
      {/* -------------------------------------------------------- */}
      <div
        className={`nav-item ${activePage === "settings" ? "active" : ""}`}
        onClick={() => setActivePage("settings")}
      >
        Settings
      </div>

      {/* -------------------------------------------------------- */}
      {/* HELP */}
      {/* -------------------------------------------------------- */}
      <div
        className={`nav-item ${activePage === "help" ? "active" : ""}`}
        onClick={() => setActivePage("help")}
      >
        Help
      </div>

    </div>
  );
}
