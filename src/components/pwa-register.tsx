"use client";

import { useEffect } from "react";

/** Registers the service worker (production only, so dev hot-reload is not affected). */
export function PwaRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;
    navigator.serviceWorker
      .register("/sw.js")
      .catch((err) => console.error("Service worker registration failed", err));
  }, []);
  return null;
}
