"use client";

import { useParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";
import { grantXp } from "@/lib/utils/gamification";
import TopBar from "@/components/layout/TopBar";
import { Droplets, Sprout, SprayCan, Scissors, Trash2, ArrowLeft } from "lucide-react";

export default function PlantDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);
  const plant = useLiveQuery(() => db.plants.get(id), [id]);

  if (plant === undefined) return <div className="p-6"><div className="h-64 shimmer rounded-2xl" /></div>;
  if (!plant) return <div className="p-6 text-sm text-foreground/50">Bitki bulunamadı.</div>;

  async function mark(field: "lastWateredAt" | "lastFertilizedAt" | "lastTreatedAt" | "lastPrunedAt") {
    await db.plants.update(id, { [field]: new Date().toISOString() });
    await grantXp(5);
  }

  const plantData = plant;

  async function handleDelete() {
    if (!plantData) return;
    if (!confirm(`${plantData.name} silinsin mi?`)) return;
    await db.plants.delete(id);
    router.push("/bahcem");
  }

  const cards = [
    { key: "lastWateredAt" as const, label: "Sulama", icon: Droplets, color: "#3b82f6", value: plant.lastWateredAt },
    { key: "lastFertilizedAt" as const, label: "Gübreleme", icon: Sprout, color: "#16a34a", value: plant.lastFertilizedAt },
    { key: "lastTreatedAt" as const, label: "İlaçlama", icon: SprayCan, color: "#f59e0b", value: plant.lastTreatedAt },
    { key: "lastPrunedAt" as const, label: "Budama", icon: Scissors, color: "#ef4444", value: plant.lastPrunedAt },
  ];

  return (
    <div className="page-enter">
      <TopBar title={plant.name} />
      <div className="p-4 md:p-6 max-w-lg mx-auto flex flex-col gap-4">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-xs text-foreground/50 self-start">
          <ArrowLeft size={14} /> Geri
        </button>

        <div className="aspect-video rounded-2xl bg-brand-green-50 dark:bg-white/5 overflow-hidden">
          {plant.photoDataUrl ? (
            <img src={plant.photoDataUrl} className="w-full h-full object-cover" alt="" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">🌿</div>
          )}
        </div>

        <div className="solid-card p-4">
          <h2 className="font-bold text-lg">{plant.name}</h2>
          <p className="text-xs text-foreground/50">{plant.category} {plant.species && `· ${plant.species}`}</p>
          {plant.location && <p className="text-xs text-foreground/50 mt-1">📍 {plant.location}</p>}
          {plant.note && <p className="text-sm mt-2">{plant.note}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {cards.map((c) => (
            <button
              key={c.key}
              onClick={() => mark(c.key)}
              className="solid-card p-4 flex flex-col items-start gap-2"
            >
              <c.icon size={20} style={{ color: c.color }} />
              <span className="text-sm font-medium">{c.label}</span>
              <span className="text-[10px] text-foreground/40">
                {c.value ? `Son: ${new Date(c.value).toLocaleDateString("tr-TR")}` : "Henüz yapılmadı"}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={handleDelete}
          className="flex items-center justify-center gap-2 text-sm text-danger-500 py-3 rounded-xl border border-danger-500/30"
        >
          <Trash2 size={16} /> Bitkiyi Sil
        </button>
      </div>
    </div>
  );
}
