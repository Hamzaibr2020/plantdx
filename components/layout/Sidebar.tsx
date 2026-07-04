"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Leaf } from "lucide-react";
import { ALL_LINKS } from "./MoreMenu";
import {
  Home, Camera, Sprout, MessageCircle, Pill, Map, CalendarDays, BarChart3, CloudSun, BookOpen, Users, User, Settings, FlaskConical, Wrench, MapPinned, Package,
} from "lucide-react";

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  "/anasayfa": Home,
  "/kamera": Camera,
  "/bahcem": Sprout,
  "/sohbet": MessageCircle,
  "/tarlalar": MapPinned,
  "/envanter": Package,
  "/tedavi": Pill,
  "/harita": Map,
  "/takvim": CalendarDays,
  "/simulasyon": FlaskConical,
  "/raporlar": BarChart3,
  "/hava-durumu": CloudSun,
  "/bilgi-merkezi": BookOpen,
  "/topluluk": Users,
  "/profil": User,
  "/ayarlar": Settings,
  "/kurulum": Wrench,
};

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-black/5 dark:border-white/5 bg-surface">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-black/5 dark:border-white/5">
        <div className="w-9 h-9 rounded-xl bg-brand-green-600 flex items-center justify-center">
          <Leaf className="text-white" size={18} />
        </div>
        <span className="font-bold text-lg">PlantDX</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {ALL_LINKS.map((link) => {
          const Icon = ICONS[link.href];
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                active
                  ? "bg-brand-green-600 text-white"
                  : "text-foreground/70 hover:bg-brand-green-50 dark:hover:bg-white/5"
              }`}
            >
              {Icon && <Icon size={18} />}
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
