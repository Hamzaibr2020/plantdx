"use client";

import { useEffect } from "react";

export default function PwaRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker desteklenmiyor veya kayıt başarısız oldu - sessizce geç,
        // uygulama service worker olmadan da (online) çalışmaya devam eder.
      });
    }
  }, []);
  return null;
}
