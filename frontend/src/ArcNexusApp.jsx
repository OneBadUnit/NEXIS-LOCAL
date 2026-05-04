// ============================================================
// ARC-NEXUS - MAIN FRONTEND APP
// File: src/ArcNexusApp.jsx
// Version: 003 (Replace BootScreen With LogoOverlay)
// ============================================================

import React, { useState } from "react";
import LogoOverlay from "./components/LogoOverlay";
import AcknowledgmentModal from "./components/AcknowledgmentModal";
import Layout from "./layout/AppLayout";
import { ArcNProvider } from "./context/ArcNContext";

const STORAGE_KEY = "arcn_ack_version";
const CURRENT_VERSION = "1.0.6";

function App() {
  const [showAck, setShowAck] = useState(() => {
    const savedVersion = localStorage.getItem(STORAGE_KEY);
    return savedVersion !== CURRENT_VERSION;
  });

  const handleAcknowledge = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setShowAck(false);
  };

  return (
    <ArcNProvider>
      <LogoOverlay />

      {showAck && <AcknowledgmentModal onAcknowledge={handleAcknowledge} />}

      <Layout />
    </ArcNProvider>
  );
}

export default App;