"use client";

import { useEffect } from "react";

/**
 * Registers the service worker on every load (production and preview).
 * Chrome Android will not enable "Install app" until a SW with a fetch
 * handler is installed and controlling the page.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
  }, []);
  return null;
}
