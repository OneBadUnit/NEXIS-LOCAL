// ============================================================
// ARC-NEXUS - ONBOARDING OVERLAY
// File: src/components/OnboardingOverlay.jsx
// Shows once, after the logo animation completes.
// Parent (ArcNexusApp) only mounts this after LogoOverlay signals onComplete.
// Dismissed via "Start" button. State stored in localStorage.
// ============================================================

import React, { useState, useEffect } from 'react';
import LogoOverlay from './LogoOverlay';

const OnboardingOverlay = ({ onComplete }) => {
  const [isSkipped, setIsSkipped] = useState(false);

  useEffect(() => {
    let isOnboardingSkipped = false;
    try {
      isOnboardingSkipped = localStorage.getItem('nexusOnboardingSkipped') === 'true';
    } catch {
      // Ignore localStorage access errors (e.g., privacy mode, sandboxed iframe)
    }

    if (isOnboardingSkipped) {
      setIsSkipped(true);
      if (onComplete) {
        onComplete();
      }
    }
  }, [onComplete]);

  const skipOnboarding = () => {
    try {
      localStorage.setItem('nexusOnboardingSkipped', 'true');
    } catch {
      // Ignore localStorage setItem errors
    }
    setIsSkipped(true);
    if (onComplete) {
      onComplete();
    }
  };

  if (isSkipped) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
      className="onboarding-overlay"
    >
      <h2 id="onboarding-title">Welcome to ArcNexus</h2>
      <p>Follow the steps to get started.</p>
      <button onClick={skipOnboarding}>Skip</button>
    </div>
  );
};

export default OnboardingOverlay;