"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { APP_ROOT, publicAsset } from "./deployment";
import { useStore } from "./store";

interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PwaState {
  installed: boolean;
  canInstall: boolean;
  installing: boolean;
  install: () => Promise<void>;
}

const PwaContext = createContext<PwaState | null>(null);

/** Always mounted: Chrome can emit its one-shot install event on any page. */
export function PwaProvider({ children }: { children: ReactNode }) {
  const { showToast } = useStore();
  const [deferredPrompt, setDeferredPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const updateDisplayMode = () => {
      const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone;
      setInstalled(standalone.matches || iosStandalone === true);
    };
    updateDisplayMode();

    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    standalone.addEventListener("change", updateDisplayMode);

    if (process.env.NODE_ENV === "production" && window.isSecureContext && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register(publicAsset("sw.js"), {
        scope: APP_ROOT,
        updateViaCache: "none",
      }).catch((error: unknown) => {
        // A service-worker failure must not block the online app.
        console.warn("Play Points offline support is unavailable:", error);
      });
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      standalone.removeEventListener("change", updateDisplayMode);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt || installing) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") showToast("Installation requested. Chrome will finish adding the app.");
    } catch {
      showToast("Please use Chrome’s menu to install the app.");
    } finally {
      // The browser permits each deferred event to be used only once.
      setDeferredPrompt(null);
      setInstalling(false);
    }
  }, [deferredPrompt, installing, showToast]);

  return (
    <PwaContext.Provider value={{ installed, canInstall: !!deferredPrompt, installing, install }}>
      {children}
    </PwaContext.Provider>
  );
}

export function usePwa() {
  const context = useContext(PwaContext);
  if (!context) throw new Error("usePwa must be used inside PwaProvider");
  return context;
}
