// Type officiel pour l'événement beforeinstallprompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

import React, { useEffect, useState } from "react";

const PWAInstallButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      console.log("[PWAInstallButton] beforeinstallprompt fired", e);
      e.preventDefault();
      setDeferredPrompt(e);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <button
      onClick={handleInstallClick}
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 9999,
        background: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "50%",
        width: 60,
        height: 60,
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        fontSize: 28,
        cursor: "pointer",
      }}
      aria-label="Installer l'application"
      title="Installer l'application Nutrijus"
    >
      ⬇️
    </button>
  );
};

export default PWAInstallButton;