"use client";

import { useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Field } from "@/lib/db/schema";
import { TURKEY_PROVINCES, CROPS } from "@/data/turkey-provinces";
import TopBar from "@/components/layout/TopBar";
import { Plus, MapPin, Sprout, Trash2, X, Pencil } from "lucide-react";

function calcHealth(p: { lastWateredAt: string | null; wateringIntervalDays: number; lastFertilizedAt: string | null; fertilizingIntervalDays: number }) {
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

export default function TarlalarPage() {
  const fields = useLiveQuery(() => db.fields.orderBy("createdAt").reverse().toArray(), []) ?? [];
  const plants = useLiveQuery(() => db.plants.toArray(), []) ?? [];
  const inventory = useLiveQuery(() => db.inventoryItems.toArray(), []) ?? [];
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Field | null>(null);

  async function deleteField(id: number) {
    const linkedPlants = plants.filter((p) => p.fieldId === id).length;
    if (linkedPlants > 0 && !confirm(`Bu tarlaya bağlı ${linkedPlants} bitki var. Tarla silinecek ama bitkiler kalacak (bağlantısız). Devam edilsin mi?`)) {
      return;
    }
    await db.fields.delete(id);
    const linked = await db.plants.where("fieldId").equals(id).toArray();
    for (const p of linked) await db.plants.update(p.id!, { fieldId: null });
  }

  return (
    <div className="page-enter">
      <TopBar title="Tarlalarım" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-4">
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-green-600 text-white text-sm font-medium"
        >
          <Plus size={16} /> Yeni Tarla / Parsel Ekle
        </button>

        {fields.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <MapPin size={40} className="text-foreground/20" />
            <p className="text-sm text-foreground/50">
              Henüz tarla eklemedin. Birden fazla tarlan/parselin varsa her birini ayrı takip edebilirsin.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {fields.map((f) => {
              const linkedPlants = plants.filter((p) => p.fieldId === f.id);
              const avgHealth = linkedPlants.length
                ? Math.round(linkedPlants.reduce((s, p) => s + calcHealth(p), 0) / linkedPlants.length)
                : null;
              const linkedInventory = inventory.filter((i) => i.fieldId === f.id);

              return (
                <div key={f.id} className="solid-card p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{f.name}</h3>
                      <p className="text-xs text-foreground/50 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {f.province} · {f.sizeDa} dekar {f.crop && `· ${f.crop}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(f); setShowForm(true); }} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                        <Pencil size={14} className="text-foreground/40" />
                      </button>
                      <button onClick={() => deleteField(f.id!)} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                        <Trash2 size={14} className="text-foreground/40" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <MiniStat label="Bitki" value={linkedPlants.length} />
                    <MiniStat label="Sağlık" value={avgHealth !== null ? `%${avgHealth}` : "—"} />
                    <MiniStat label="Envanter" value={linkedInventory.length} />
                  </div>

                  {f.notes && <p className="text-xs text-foreground/60 mt-2">{f.notes}</p>}

                  {linkedPlants.length > 0 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto">
                      {linkedPlants.map((p) => (
                        <Link key={p.id} href={`/bahcem/${p.id}`} className="shrink-0 flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full bg-brand-green-50 dark:bg-white/5 text-brand-green-700 dark:text-brand-green-400">
                          <Sprout size={11} /> {p.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <FieldForm field={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-black/5 dark:bg-white/5 rounded-lg py-1.5 flex flex-col items-center">
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[9px] text-foreground/40">{label}</span>
    </div>
  );
}

function FieldForm({ field, onClose }: { field: Field | null; onClose: () => void }) {
  const [name, setName] = useState(field?.name ?? "");
  const [sizeDa, setSizeDa] = useState(field?.sizeDa ?? 5);
  const [province, setProvince] = useState(field?.province ?? TURKEY_PROVINCES[25].name);
  const [crop, setCrop] = useState(field?.crop ?? "");
  const [notes, setNotes] = useState(field?.notes ?? "");

  async function save() {
    if (!name.trim()) return;
    if (field?.id) {
      await db.fields.update(field.id, { name: name.trim(), sizeDa, province, crop: crop || null, notes: notes || null });
    } else {
      await db.fields.add({
        name: name.trim(),
        sizeDa,
        province,
        crop: crop || null,
        polygonId: null,
        notes: notes || null,
        createdAt: new Date().toISOString(),
      });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative solid-card w-full md:max-w-sm rounded-b-none md:rounded-b-[20px] p-5 page-enter">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{field ? "Tarlayı Düzenle" : "Yeni Tarla"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tarla adı (ör: Arka Bahçe, Kuzey Parsel)" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          <div>
            <label className="text-xs text-foreground/50">Büyüklük (dekar)</label>
            <input type="number" min={0.1} step={0.1} value={sizeDa} onChange={(e) => setSizeDa(Number(e.target.value))} className="w-full mt-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          </div>
          <select value={province} onChange={(e) => setProvince(e.target.value)} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
            {TURKEY_PROVINCES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <select value={crop} onChange={(e) => setCrop(e.target.value)} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
            <option value="">Ana ürün (opsiyonel)</option>
            {CROPS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Not" rows={2} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          <button onClick={save} className="mt-2 w-full py-2.5 rounded-xl bg-brand-green-600 text-white text-sm font-medium">Kaydet</button>
        </div>
      </div>
    </div>
  );
}
