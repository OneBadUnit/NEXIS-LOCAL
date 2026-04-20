import React, { useState, useEffect } from "react";
import BootScreen from "./components/BootScreen";
import Layout from "./layout/AppLayout";
import { ArcNProvider } from "./context/ArcNContext";

function App() {
  const [appReady, setAppReady] = useState(false);
  const [showBoot, setShowBoot] = useState(true);

  // When Layout mounts, mark app as ready
  useEffect(() => {
    // Small delay ensures Layout has rendered at least once
    const timer = setTimeout(() => {
      setAppReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // When appReady flips true, fade out boot screen
  const handleBootFinish = () => {
    // BootScreen will call this when its loading bar finishes
    setShowBoot(false);
  };

  return (
    <ArcNProvider>
      {showBoot && <BootScreen appReady={appReady} onFinish={handleBootFinish} />}

      {/* Layout always mounts immediately — no white flash */}
      <Layout />
    </ArcNProvider>
  );
}

export default App;
