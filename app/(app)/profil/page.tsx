"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";
import { BADGES, xpForLevel } from "@/lib/utils/gamification";
import TopBar from "@/components/layout/TopBar";
import * as Icons from "lucide-react";
import { Flame, BarChart3, BookOpen, Users, Check, Lock, Pencil } from "lucide-react";

export default function ProfilPage() {
  const profile = useLiveQuery(() => db.profile.toCollection().first(), []);
  const plants = useLiveQuery(() => db.plants.count(), []) ?? 0;
  const tasks = useLiveQuery(() => db.calendarTasks.filter((t) => t.completed).count(), []) ?? 0;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  if (!profile) return <div className="p-6"><div className="h-64 shimmer rounded-2xl" /></div>;

  const currentLevelXp = xpForLevel(profile.level);
  const nextLevelXp = xpForLevel(profile.level + 1);
  const progress = Math.min(100, ((profile.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100);

  async function saveName() {
    if (!name.trim()) return setEditing(false);
    await db.profile.update(profile!.id!, { displayName: name.trim() });
    setEditing(false);
  }

  return (
    <div className="page-enter">
      <TopBar title="Profil" />
      <div className="p-4 md:p-6 max-w-lg mx-auto flex flex-col gap-4">
        <div className="solid-card p-6 flex flex-col items-center gap-2">
          <div className="w-20 h-20 rounded-full bg-brand-green-600 text-white flex items-center justify-center text-2xl font-bold">
            {profile.displayName[0]?.toUpperCase()}
          </div>
          {editing ? (
            <div className="flex gap-2">
              <input value={name} onChange={(e) => setName(e.target.value)} className="text-center rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-2 py-1 text-sm" autoFocus />
              <button onClick={saveName} className="text-xs text-brand-green-600">Kaydet</button>
            </div>
          ) : (
            <button onClick={() => { setEditing(true); setName(profile.displayName); }} className="flex items-center gap-1.5 font-bold text-lg">
              {profile.displayName} <Pencil size={13} className="text-foreground/30" />
            </button>
          )}
          <span className="text-xs px-2.5 py-1 rounded-full bg-brand-amber-400/20 text-brand-amber-600 font-semibold">Seviye {profile.level}</span>

          <div className="w-full max-w-xs mt-2">
            <div className="flex justify-between text-[10px] text-foreground/40 mb-1">
              <span>{profile.xp} XP</span>
              <span>{nextLevelXp} XP</span>
            </div>
            <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div className="h-full bg-brand-amber-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-brand-amber-600 mt-1">
            <Flame size={14} /> {profile.streakDays} gün aktif seri
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <StatBox label="Analiz" value={profile.totalAnalyses} />
          <StatBox label="Bitki" value={plants} />
          <StatBox label="Görev" value={tasks} />
          <StatBox label="En Uzun Seri" value={profile.streakDays} />
        </div>

        <div className="solid-card p-4">
          <h3 className="text-sm font-semibold mb-3">Rozetler ({profile.unlockedBadgeIds.length}/{BADGES.length})</h3>
          <div className="grid grid-cols-4 gap-3">
            {BADGES.map((b) => {
              const unlocked = profile.unlockedBadgeIds.includes(b.id);
              const Icon = (Icons as any)[b.icon] ?? Icons.Award;
              return (
                <div key={b.id} className="flex flex-col items-center gap-1 text-center" title={b.description}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${unlocked ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/5 text-foreground/20"}`}>
                    {unlocked ? <Icon size={20} /> : <Lock size={16} />}
                  </div>
                  <span className={`text-[9px] leading-tight ${unlocked ? "" : "text-foreground/30"}`}>{b.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <QuickLink href="/raporlar" icon={BarChart3} label="Raporlar" />
          <QuickLink href="/bilgi-merkezi" icon={BookOpen} label="Bilgi Merkezi" />
          <QuickLink href="/topluluk" icon={Users} label="Topluluk" />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="solid-card p-3 flex flex-col items-center">
      <span className="text-lg font-bold">{value}</span>
      <span className="text-[9px] text-foreground/40 text-center">{label}</span>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ size?: number }>; label: string }) {
  return (
    <Link href={href} className="solid-card p-4 flex flex-col items-center gap-1.5 text-brand-green-700 dark:text-brand-green-400">
      <Icon size={20} />
      <span className="text-[11px] font-medium">{label}</span>
    </Link>
  );
}
