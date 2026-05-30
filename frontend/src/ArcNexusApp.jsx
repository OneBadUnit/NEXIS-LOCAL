// ============================================================
// ARC-NEXUS - MAIN FRONTEND APP
// File: src/ArcNexusApp.jsx
// Version: 006 (startup overlays removed — NEXIS-LOCAL local-only)
// ============================================================

import React, { useState } from "react";
import AcknowledgmentModal from "./components/AcknowledgmentModal";
import Layout from "./layout/AppLayout";
import { ArcNProvider } from "./context/ArcNContext";

const STORAGE_KEY = "nexis_local_arcn_ack_version";
const CURRENT_VERSION = "1.0.7";

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
      {showAck && <AcknowledgmentModal onAcknowledge={handleAcknowledge} />}
      <Layout />
    </ArcNProvider>
  );
}

export default App;