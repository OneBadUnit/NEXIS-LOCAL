// ============================================================
// ARC-NEXUS - MAIN FRONTEND APP
// File: src/ArcNexusApp.jsx
// Version: 002 (Header Consistency)
// ============================================================

import React, { useState, useEffect } from "react";
import BootScreen from "./components/BootScreen";
import AcknowledgmentModal from "./components/AcknowledgmentModal";
import Layout from "./layout/AppLayout";
import { ArcNProvider } from "./context/ArcNContext";

const STORAGE_KEY = "arcn_ack_version";
const CURRENT_VERSION = "1.0.6";

function App() {
  const [appReady, setAppReady] = useState(false);
  const [showBoot, setShowBoot] = useState(true);
  const [showAck, setShowAck] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleBootFinish = () => {
    setShowBoot(false);

    const savedVersion = localStorage.getItem(STORAGE_KEY);

    if (savedVersion !== CURRENT_VERSION) {
      setShowAck(true);
    }
  };

  const handleAcknowledge = () => {
    setShowAck(false);
  };

  return (
    <ArcNProvider>
      {showBoot && (
        <BootScreen appReady={appReady} onFinish={handleBootFinish} />
      )}

      {showAck && <AcknowledgmentModal onAcknowledge={handleAcknowledge} />}

      <Layout />
    </ArcNProvider>
  );
}

export default App;