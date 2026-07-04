"use client";

import Link from "next/link";
import {
  X, Pill, Map, CalendarDays, BarChart3, CloudSun, BookOpen, Users, User, Settings, FlaskConical, Wrench, MapPinned, Package,
} from "lucide-react";

export const ALL_LINKS = [
  { href: "/anasayfa", label: "Ana Sayfa" },
  { href: "/kamera", label: "AI Kamera" },
  { href: "/bahcem", label: "Benim Bahçem" },
  { href: "/sohbet", label: "AI Sohbet Asistanı" },
  { href: "/tarlalar", label: "Tarlalarım", icon: MapPinned },
  { href: "/envanter", label: "Envanter", icon: Package },
  { href: "/tedavi", label: "Tedavi Merkezi", icon: Pill },
  { href: "/harita", label: "Bölgesel Risk Haritası", icon: Map },
  { href: "/takvim", label: "Akıllı Takvim", icon: CalendarDays },
  { href: "/simulasyon", label: "Simülasyon", icon: FlaskConical },
  { href: "/raporlar", label: "Raporlar", icon: BarChart3 },
  { href: "/hava-durumu", label: "Hava Durumu", icon: CloudSun },
  { href: "/bilgi-merkezi", label: "Bilgi Merkezi", icon: BookOpen },
  { href: "/topluluk", label: "Topluluk", icon: Users },
  { href: "/profil", label: "Profil", icon: User },
  { href: "/ayarlar", label: "Ayarlar", icon: Settings },
  { href: "/kurulum", label: "Kurulum", icon: Wrench },
];

const MENU_LINKS = ALL_LINKS.filter((l) => l.icon);

export default function MoreMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute bottom-0 inset-x-0 solid-card rounded-b-none p-4 max-h-[75vh] overflow-y-auto page-enter">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Diğer Modüller</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {MENU_LINKS.map((link) => {
            const Icon = link.icon!;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-brand-green-50 dark:bg-white/5 text-brand-green-700 dark:text-brand-green-400 text-center"
              >
                <Icon size={22} />
                <span className="text-[11px] font-medium leading-tight">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
