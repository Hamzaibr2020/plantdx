"use client";

import { useEffect, useState } from "react";
import { WifiOff, Search } from "lucide-react";

export default function TopBar({ title }: { title?: string }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 md:px-6 bg-background/80 backdrop-blur border-b border-black/5 dark:border-white/5">
      <h1 className="font-semibold text-base truncate">{title}</h1>
      <div className="flex items-center gap-2">
        {!online && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-warn-500 bg-warn-500/10 px-2 py-1 rounded-full">
            <WifiOff size={12} /> Çevrimdışı
          </span>
        )}
        <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
          <Search size={18} />
        </button>
      </div>
    </header>
  );
}
