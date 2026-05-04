// ============================================================
// ARC-NEXUS - LOGO OVERLAY
// File: src/components/LogoOverlay.jsx
// Version: FINAL (correct path)
// ============================================================

import React, { useEffect, useState } from "react";
import logo from "../logo.png"; // ✅ correct path for your setup

const LogoOverlay = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
    }, 2600);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="logo-overlay">
      <img
        src={logo}
        alt="ArcNexus"
        className="logo-overlay-img"
      />
    </div>
  );
};

export default LogoOverlay;