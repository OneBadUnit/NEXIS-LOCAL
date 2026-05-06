// ============================================================
// ARC-NEXUS - MAIN FRONTEND APP
// File: src/ArcNexusApp.jsx
// Version: 005 (Logo → Onboarding completion chain)
// ============================================================

import React, { useState, useCallback } from "react";
import LogoOverlay from "./components/LogoOverlay";
import AcknowledgmentModal from "./components/AcknowledgmentModal";
import OnboardingOverlay from "./components/OnboardingOverlay";
import Layout from "./layout/AppLayout";
import { ArcNProvider } from "./context/ArcNContext";

const STORAGE_KEY = "arcn_ack_version";
const CURRENT_VERSION = "1.0.7";

function App() {
  const [logoComplete, setLogoComplete] = useState(false);

  const [showAck, setShowAck] = useState(() => {
    const savedVersion = localStorage.getItem(STORAGE_KEY);
    return savedVersion !== CURRENT_VERSION;
  });

  const handleLogoComplete = useCallback(() => {
    setLogoComplete(true);
  }, []);

  const handleAcknowledge = () => {
    localStorage.setItem(STORAGE_KEY, CURRENT_VERSION);
    setShowAck(false);
  };

  return (
    <ArcNProvider>
      <LogoOverlay onComplete={handleLogoComplete} />

      {/* Only mount OnboardingOverlay after the logo animation finishes */}
      {logoComplete && <OnboardingOverlay />}

      {showAck && <AcknowledgmentModal onAcknowledge={handleAcknowledge} />}

      <Layout />
    </ArcNProvider>
  );
}

export default App;