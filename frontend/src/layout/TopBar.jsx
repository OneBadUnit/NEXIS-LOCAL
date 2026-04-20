export default function TopBar({ setActivePage }) {
  return (
    <div className="topbar">
      <div
        className="topbar-title"
        onClick={() => setActivePage("nexus")}
        style={{ cursor: "pointer" }}
      >
        <div className="topbar-arc">ARC</div>
        <div className="topbar-nexus">NEXUS</div>
      </div>
    </div>
  );
}
