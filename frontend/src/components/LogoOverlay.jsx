// ============================================================
// ARC-NEXUS - LOGO OVERLAY
// File: src/components/LogoOverlay.jsx
// Version: FINAL (correct path)
// ============================================================

import React, { useEffect } from 'react';
import OnboardingOverlay from './OnboardingOverlay';

const LogoOverlay = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) {
        onComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="logo-overlay">
      <div className="logo-spinner" />
      <p>Loading ArcNexus…</p>
      <OnboardingOverlay onComplete={onComplete} />
    </div>
  );
};

export default LogoOverlay;