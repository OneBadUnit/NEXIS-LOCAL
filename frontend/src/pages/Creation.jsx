import React, { useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";
import "./creation.css";

const Creation = () => {
  const { setActivePage } = useContext(ArcNContext);

  return (
    <div className="create-root">
      <h1 className="create-title">CREATION</h1>
      <p className="create-subtitle">
        Generation tools, creative modules, and output systems.
      </p>

      <div className="create-grid">
        <div
          className="create-card"
          onClick={() => setActivePage("Dashboard")}
        >
          <h2>Generate</h2>
          <p>Create new assets, content, and artifacts.</p>
        </div>

        <div
          className="create-card"
          onClick={() => setActivePage("Dashboard")}
        >
          <h2>Expand</h2>
          <p>Extend existing material with ARC‑N synthesis.</p>
        </div>

        <div
          className="create-card"
          onClick={() => setActivePage("Dashboard")}
        >
          <h2>Remix</h2>
          <p>Transform and reinterpret source material.</p>
        </div>
      </div>
    </div>
  );
};

export default Creation;
