"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(12);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [isMinDurationDone, setIsMinDurationDone] = useState(false);

  useEffect(() => {
    const minDurationMs = 3000;
    sessionStorage.setItem("home-splash-done", "0");

    const handleLoad = () => setIsPageLoaded(true);
    if (document.readyState === "complete") {
      setIsPageLoaded(true);
    } else {
      window.addEventListener("load", handleLoad, { once: true });
    }

    const progressInterval = window.setInterval(() => {
      setProgress((current) => (current >= 90 ? current : current + 2));
    }, 50);

    const minDurationTimer = window.setTimeout(() => {
      setIsMinDurationDone(true);
    }, minDurationMs);

    return () => {
      window.removeEventListener("load", handleLoad);
      window.clearInterval(progressInterval);
      window.clearTimeout(minDurationTimer);
    };
  }, []);

  useEffect(() => {
    if (!isPageLoaded || !isMinDurationDone) return;

    setProgress(100);
    const leaveTimer = window.setTimeout(() => setIsLeaving(true), 120);
    const hideTimer = window.setTimeout(() => {
      sessionStorage.setItem("home-splash-done", "1");
      window.dispatchEvent(new Event("home-splash-done"));
      setIsVisible(false);
    }, 620);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, [isPageLoaded, isMinDurationDone]);

  if (!isVisible) return null;

  return (
    <div className={`splash-screen${isLeaving ? " is-leaving" : ""}`}>
      <div className="splash-glow" />
      <div className="splash-content">
        <img src="/images/logo-air.png" alt="Telaga Cipta Water Logo" className="splash-water-logo" />
        <img
          src="/images/logo-text-telagacipta.png"
          alt="Telaga Cipta Indonesia"
          className="splash-text-logo"
        />
        <div className="splash-progress" aria-label="Loading homepage" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
          <span className="splash-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <style>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          background: #ffffff;
          overflow: hidden;
          opacity: 1;
          transition: opacity 0.45s ease;
        }
        .splash-screen.is-leaving {
          opacity: 0;
          pointer-events: none;
        }
        .splash-glow {
          position: absolute;
          width: 58vmin;
          aspect-ratio: 1;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(115, 177, 255, 0.22) 0%, rgba(115, 177, 255, 0) 70%);
          filter: blur(10px);
          animation: pulseGlow 2.1s ease-in-out infinite;
        }
        .splash-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          transform: translateY(-28px);
        }
        .splash-water-logo {
          width: min(26vw, 230px);
          height: auto;
          object-fit: contain;
          filter: drop-shadow(0 18px 38px rgba(5, 28, 74, 0.44));
          opacity: 1;
          transform: translateY(-82vh) scale(0.92);
          animation: dropIn 1.15s cubic-bezier(0.15, 0.74, 0.2, 1.02) 0.1s forwards,
            settleFloat 2.2s ease-in-out 1.35s infinite;
        }
        .splash-text-logo {
          width: min(76vw, 620px);
          height: min(22vw, 180px);
          object-fit: cover;
          object-position: center;
          opacity: 0;
          transform: translateY(14px) scale(0.98);
          filter: drop-shadow(0 10px 24px rgba(4, 22, 58, 0.38));
          animation: revealText 0.72s ease 1.3s forwards;
        }
        .splash-progress {
          margin-top: 6px;
          width: min(52vw, 360px);
          height: 7px;
          border-radius: 999px;
          background: rgba(23, 76, 173, 0.12);
          overflow: hidden;
          opacity: 0;
          transform: translateY(8px);
          animation: revealText 0.6s ease 1.45s forwards;
          box-shadow: inset 0 0 0 1px rgba(23, 76, 173, 0.08);
        }
        .splash-progress-fill {
          display: block;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(90deg, #0f59d6 0%, #23a9ff 100%);
          box-shadow: 0 0 12px rgba(35, 169, 255, 0.45);
          transition: width 0.16s ease-out;
        }
        @keyframes settleFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes dropIn {
          0% { transform: translateY(-82vh) scale(0.92); }
          72% { transform: translateY(12px) scale(1.02); }
          100% { transform: translateY(0) scale(1); }
        }
        @keyframes revealText {
          0% { opacity: 0; transform: translateY(14px) scale(0.98); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(0.96); }
          50% { opacity: 1; transform: scale(1.04); }
        }
      `}</style>
    </div>
  );
}
