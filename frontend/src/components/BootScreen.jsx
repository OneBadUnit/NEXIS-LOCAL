import React, { useEffect, useState } from "react";
import "../styles/boot.css";


export default function BootScreen({ appReady, onFinish }) {
  const [progress, setProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  // Simulated loading bar (3 seconds)
  useEffect(() => {
    const duration = 3000;
    const interval = 20;
    const steps = duration / interval;
    let current = 0;

    const timer = setInterval(() => {
      current++;
      setProgress((current / steps) * 100);

      if (current >= steps) {
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  // When BOTH the bar is done AND the app is ready → fade out
  useEffect(() => {
    if (progress >= 100 && appReady) {
      setFadeOut(true);

      // Wait for fade-out animation to finish
      const timer = setTimeout(() => {
        onFinish();
      }, 600);

      return () => clearTimeout(timer);
    }
  }, [progress, appReady, onFinish]);

  return (
    <div className={`boot-screen ${fadeOut ? "fade-out" : ""}`}>
      <div className="boot-center">
        <div className="boot-acr">A R C</div>
        <div className="boot-nexus">NEXUS</div>

        <div className="boot-bar">
          <div
            className="boot-bar-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}
