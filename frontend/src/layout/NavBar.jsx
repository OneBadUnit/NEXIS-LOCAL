export default function NavBar({ activePage, setActivePage }) {
  return (
    <div className="navbar">
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
  );
}
