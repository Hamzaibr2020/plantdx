"use client";

import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, InventoryItem } from "@/lib/db/schema";
import TopBar from "@/components/layout/TopBar";
import { Plus, X, AlertTriangle, Trash2, Pencil, Package, Clock } from "lucide-react";

const TYPES: InventoryItem["type"][] = ["Gübre", "İlaç (Kimyasal)", "İlaç (Organik)", "Tohum", "Diğer"];
const UNITS: InventoryItem["unit"][] = ["kg", "g", "l", "ml", "adet", "paket"];

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.round((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export default function EnvanterPage() {
  const items = useLiveQuery(() => db.inventoryItems.orderBy("createdAt").reverse().toArray(), []) ?? [];
  const fields = useLiveQuery(() => db.fields.toArray(), []) ?? [];
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<InventoryItem | null>(null);
  const [filter, setFilter] = useState<string>("Hepsi");

  const lowStock = items.filter((i) => i.quantity <= i.lowStockThreshold);
  const expiringSoon = items.filter((i) => {
    const d = daysUntil(i.expiryDate);
    return d !== null && d <= 30 && d >= 0;
  });
  const expired = items.filter((i) => {
    const d = daysUntil(i.expiryDate);
    return d !== null && d < 0;
  });

  const filtered = filter === "Hepsi" ? items : items.filter((i) => i.type === filter);

  async function deleteItem(id: number) {
    await db.inventoryItems.delete(id);
  }

  return (
    <div className="page-enter">
      <TopBar title="Envanter" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-4">
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-green-600 text-white text-sm font-medium"
        >
          <Plus size={16} /> Yeni Ürün Ekle
        </button>

        {(lowStock.length > 0 || expiringSoon.length > 0 || expired.length > 0) && (
          <div className="flex flex-col gap-2">
            {expired.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-danger-500 bg-danger-500/10 rounded-xl p-3">
                <AlertTriangle size={14} /> {expired.length} ürünün son kullanma tarihi geçmiş.
              </div>
            )}
            {expiringSoon.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-warn-500 bg-warn-500/10 rounded-xl p-3">
                <Clock size={14} /> {expiringSoon.length} ürünün son kullanma tarihi 30 gün içinde doluyor.
              </div>
            )}
            {lowStock.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-brand-blue-600 bg-brand-blue-500/10 rounded-xl p-3">
                <Package size={14} /> {lowStock.length} ürün kritik stok seviyesinde.
              </div>
            )}
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {["Hepsi", ...TYPES].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`text-[11px] px-2.5 py-1 rounded-full ${filter === t ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/10"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Package size={40} className="text-foreground/20" />
            <p className="text-sm text-foreground/50">Envanterinde henüz ürün yok.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((item) => {
              const isLow = item.quantity <= item.lowStockThreshold;
              const expiryDays = daysUntil(item.expiryDate);
              const field = fields.find((f) => f.id === item.fieldId);

              return (
                <div key={item.id} className="solid-card p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium truncate">{item.name}</p>
                      {isLow && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-warn-500/15 text-warn-500 shrink-0">Düşük Stok</span>}
                    </div>
                    <p className="text-[11px] text-foreground/50 mt-0.5">
                      {item.type} · {item.quantity} {item.unit}
                      {field && ` · ${field.name}`}
                    </p>
                    {expiryDays !== null && (
                      <p className={`text-[10px] mt-0.5 ${expiryDays < 0 ? "text-danger-500" : expiryDays <= 30 ? "text-warn-500" : "text-foreground/40"}`}>
                        {expiryDays < 0 ? `${Math.abs(expiryDays)} gün önce doldu` : `SKT: ${expiryDays} gün kaldı`}
                      </p>
                    )}
                  </div>
                  <button onClick={() => { setEditing(item); setShowForm(true); }} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 shrink-0">
                    <Pencil size={14} className="text-foreground/40" />
                  </button>
                  <button onClick={() => deleteItem(item.id!)} className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 shrink-0">
                    <Trash2 size={14} className="text-foreground/40" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && <InventoryForm item={editing} fields={fields} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function InventoryForm({
  item, fields, onClose,
}: {
  item: InventoryItem | null;
  fields: { id?: number; name: string }[];
  onClose: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [type, setType] = useState<InventoryItem["type"]>(item?.type ?? "Gübre");
  const [quantity, setQuantity] = useState(item?.quantity ?? 1);
  const [unit, setUnit] = useState<InventoryItem["unit"]>(item?.unit ?? "kg");
  const [lowStockThreshold, setLowStockThreshold] = useState(item?.lowStockThreshold ?? 1);
  const [purchaseDate, setPurchaseDate] = useState(item?.purchaseDate ?? "");
  const [expiryDate, setExpiryDate] = useState(item?.expiryDate ?? "");
  const [fieldId, setFieldId] = useState<number | "">(item?.fieldId ?? "");
  const [notes, setNotes] = useState(item?.notes ?? "");

  async function save() {
    if (!name.trim()) return;
    const payload = {
      name: name.trim(),
      type,
      quantity,
      unit,
      lowStockThreshold,
      purchaseDate: purchaseDate || null,
      expiryDate: expiryDate || null,
      fieldId: fieldId === "" ? null : Number(fieldId),
      notes: notes || null,
    };
    if (item?.id) {
      await db.inventoryItems.update(item.id, payload);
    } else {
      await db.inventoryItems.add({ ...payload, createdAt: new Date().toISOString() });
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative solid-card w-full md:max-w-sm rounded-b-none md:rounded-b-[20px] p-5 page-enter max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">{item ? "Ürünü Düzenle" : "Yeni Ürün"}</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ürün adı (ör: Mankozeb 80 WP)" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          <select value={type} onChange={(e) => setType(e.target.value as InventoryItem["type"])} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-foreground/50">Miktar</label>
              <input type="number" min={0} step={0.1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-full mt-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-foreground/50">Birim</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as InventoryItem["unit"])} className="w-full mt-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-foreground/50">Kritik Stok Eşiği</label>
            <input type="number" min={0} step={0.1} value={lowStockThreshold} onChange={(e) => setLowStockThreshold(Number(e.target.value))} className="w-full mt-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-foreground/50">Alım Tarihi</label>
              <input type="date" value={purchaseDate ?? ""} onChange={(e) => setPurchaseDate(e.target.value)} className="w-full mt-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="text-xs text-foreground/50">Son Kullanma</label>
              <input type="date" value={expiryDate ?? ""} onChange={(e) => setExpiryDate(e.target.value)} className="w-full mt-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
            </div>
          </div>
          {fields.length > 0 && (
            <select value={fieldId} onChange={(e) => setFieldId(e.target.value ? Number(e.target.value) : "")} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
              <option value="">Tarla seçme (opsiyonel)</option>
              {fields.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          )}
          <textarea value={notes ?? ""} onChange={(e) => setNotes(e.target.value)} placeholder="Not" rows={2} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          <button onClick={save} className="mt-2 w-full py-2.5 rounded-xl bg-brand-green-600 text-white text-sm font-medium">Kaydet</button>
        </div>
      </div>
    </div>
  );
}
