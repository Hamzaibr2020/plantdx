"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Plant } from "@/lib/db/schema";
import { grantXp } from "@/lib/utils/gamification";
import TopBar from "@/components/layout/TopBar";
import { Plus, Search, Droplets, Sprout } from "lucide-react";

const CATEGORIES: Plant["category"][] = ["Sebze", "Meyve", "Çiçek", "Süs Bitkisi", "Ağaç", "Diğer"];

function calcHealth(p: Plant) {
  const now = Date.now();
  let score = 100;
  if (p.lastWateredAt) {
    const overdue = (now - new Date(p.lastWateredAt).getTime()) / 86400000 - p.wateringIntervalDays;
    if (overdue > 0) score -= Math.min(40, overdue * 5);
  } else score -= 20;
  if (p.lastFertilizedAt) {
    const overdue = (now - new Date(p.lastFertilizedAt).getTime()) / 86400000 - p.fertilizingIntervalDays;
    if (overdue > 0) score -= Math.min(20, overdue * 2);
  }
  return Math.max(0, Math.round(score));
}

export default function BahcemPage() {
  const plants = useLiveQuery(() => db.plants.orderBy("createdAt").reverse().toArray(), []) ?? [];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("Hepsi");
  const [showForm, setShowForm] = useState(false);

  const filtered = plants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) &&
      (category === "Hepsi" || p.category === category)
  );

  async function quickWater(id: number) {
    await db.plants.update(id, { lastWateredAt: new Date().toISOString() });
    await grantXp(5);
  }

  return (
    <div className="page-enter">
      <TopBar title="Benim Bahçem" />
      <div className="p-4 md:p-6 max-w-3xl flex flex-col gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Bitki ara..."
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-sm"
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-10 h-10 rounded-xl bg-brand-green-600 text-white flex items-center justify-center shrink-0"
          >
            <Plus size={20} />
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {["Hepsi", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-[11px] px-2.5 py-1 rounded-full ${
                category === c ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/10"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Sprout size={40} className="text-foreground/20" />
            <p className="text-sm text-foreground/50">
              {plants.length === 0 ? "Henüz bitki eklemedin. Bahçeni oluşturmaya başla!" : "Sonuç bulunamadı."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filtered.map((p) => {
              const health = calcHealth(p);
              return (
                <Link
                  key={p.id}
                  href={`/bahcem/${p.id}`}
                  className="solid-card overflow-hidden flex flex-col"
                >
                  <div className="aspect-square bg-brand-green-50 dark:bg-white/5 relative">
                    {p.photoDataUrl ? (
                      <img src={p.photoDataUrl} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">🌿</div>
                    )}
                    <div
                      className="absolute top-1.5 right-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: health > 60 ? "#22c55e" : health > 30 ? "#f59e0b" : "#ef4444" }}
                    >
                      {health}
                    </div>
                  </div>
                  <div className="p-2.5 flex flex-col gap-1">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-[10px] text-foreground/40">{p.category}</p>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        quickWater(p.id!);
                      }}
                      className="mt-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded-lg bg-brand-blue-500/10 text-brand-blue-600"
                    >
                      <Droplets size={12} /> Sula
                    </button>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <PlantForm onClose={() => setShowForm(false)} />}
    </div>
  );
}

function PlantForm({ onClose }: { onClose: () => void }) {
  const fields = useLiveQuery(() => db.fields.toArray(), []) ?? [];
  const [name, setName] = useState("");
  const [category, setCategory] = useState<Plant["category"]>("Sebze");
  const [species, setSpecies] = useState("");
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [wateringDays, setWateringDays] = useState(3);
  const [fertilizingDays, setFertilizingDays] = useState(14);
  const [fieldId, setFieldId] = useState<number | "">("");

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!name.trim()) return;
    await db.plants.add({
      name: name.trim(),
      category,
      species: species || null,
      photoDataUrl: photo,
      location: location || null,
      fieldId: fieldId === "" ? null : Number(fieldId),
      note: note || null,
      wateringIntervalDays: wateringDays,
      fertilizingIntervalDays: fertilizingDays,
      lastWateredAt: null,
      lastFertilizedAt: null,
      lastTreatedAt: null,
      lastPrunedAt: null,
      createdAt: new Date().toISOString(),
    });
    await grantXp(20);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative solid-card w-full md:max-w-md max-h-[85vh] overflow-y-auto rounded-b-none md:rounded-b-[20px] p-5 page-enter">
        <h3 className="font-semibold mb-4">Yeni Bitki Ekle</h3>
        <div className="flex flex-col gap-3">
          <label className="w-full aspect-video rounded-xl bg-brand-green-50 dark:bg-white/5 flex items-center justify-center overflow-hidden cursor-pointer">
            {photo ? <img src={photo} className="w-full h-full object-cover" alt="" /> : <span className="text-xs text-foreground/40">Fotoğraf ekle</span>}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bitki adı" className="input-field" />
          <select value={category} onChange={(e) => setCategory(e.target.value as Plant["category"])} className="input-field">
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input value={species} onChange={(e) => setSpecies(e.target.value)} placeholder="Tür (opsiyonel)" className="input-field" />
          <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Konum (ör: Balkon)" className="input-field" />
          {fields.length > 0 && (
            <select value={fieldId} onChange={(e) => setFieldId(e.target.value ? Number(e.target.value) : "")} className="input-field">
              <option value="">Tarla seçme (opsiyonel)</option>
              {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-foreground/50">Sulama aralığı (gün)</label>
              <input type="number" min={1} value={wateringDays} onChange={(e) => setWateringDays(Number(e.target.value))} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-foreground/50">Gübreleme aralığı (gün)</label>
              <input type="number" min={1} value={fertilizingDays} onChange={(e) => setFertilizingDays(Number(e.target.value))} className="input-field" />
            </div>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not" rows={2} className="input-field" />
          <div className="flex gap-2 mt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-black/10 dark:border-white/10 text-sm">İptal</button>
            <button onClick={handleSave} className="flex-1 py-2.5 rounded-xl bg-brand-green-600 text-white text-sm font-medium">Kaydet</button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .input-field {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid var(--border-subtle);
          background: transparent;
          padding: 0.6rem 0.75rem;
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
