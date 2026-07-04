"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Camera, Sprout, MessageCircle, Menu } from "lucide-react";
import { useState } from "react";
import MoreMenu from "./MoreMenu";

const TABS = [
  { href: "/anasayfa", label: "Ana Sayfa", icon: Home },
  { href: "/kamera", label: "AI Kamera", icon: Camera },
  { href: "/bahcem", label: "Bahçem", icon: Sprout },
  { href: "/sohbet", label: "AI Sohbet", icon: MessageCircle },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 inset-x-0 z-40 md:hidden">
        <div className="mx-3 mb-3 glass-card px-1.5 py-1.5 flex items-center justify-between shadow-lg">
          {TABS.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl transition ${
                  active ? "text-brand-green-600" : "text-foreground/50"
                }`}
              >
                <Icon size={20} strokeWidth={active ? 2.5 : 2} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl text-foreground/50"
          >
            <Menu size={20} />
            <span className="text-[10px] font-medium">Diğer</span>
          </button>
        </div>
      </nav>
      <MoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
