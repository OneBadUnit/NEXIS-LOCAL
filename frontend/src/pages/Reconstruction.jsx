import React, { useContext } from "react";
import { ArcNContext } from "../context/ArcNContext";
import "./reconstruction.css";

const Reconstruction = () => {
  const { setActivePage } = useContext(ArcNContext);

  return (
    <div className="recon-root">
      <h1 className="recon-title">RECONSTRUCTION</h1>
      <p className="recon-subtitle">
        Structural rebuilding, refinement, and transformation tools.
      </p>

      <div className="recon-grid">
        <div
          className="recon-card"
          onClick={() => setActivePage("Dashboard")}
        >
          <h2>Refine</h2>
          <p>Improve clarity, structure, and consistency.</p>
        </div>

        <div
          className="recon-card"
          onClick={() => setActivePage("Dashboard")}
        >
          <h2>Transform</h2>
          <p>Convert formats, restructure data, and rebuild outputs.</p>
        </div>

        <div
          className="recon-card"
          onClick={() => setActivePage("Dashboard")}
        >
          <h2>Map</h2>
          <p>Generate structural and semantic mappings.</p>
        </div>
      </div>
    </div>
  );
};

export default Reconstruction;
