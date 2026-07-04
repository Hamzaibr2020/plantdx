"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, InventoryItem } from "@/lib/db/schema";
import { getLocalTreatment, getTreatment, scaleDose, TreatmentInfo } from "@/lib/api/treatment-db";
import { useSettings } from "@/lib/context/settings-context";
import TopBar from "@/components/layout/TopBar";
import {
  FlaskConical, Leaf, Shield, Droplets, Clock, AlertTriangle, Bug, Sparkles,
  CalendarPlus, CheckCircle2, Loader2, Package, Minus,
} from "lucide-react";

function TedaviContent() {
  const params = useSearchParams();
  const diagnosisId = Number(params.get("diagnosisId"));
  const diagnosis = useLiveQuery(() => (diagnosisId ? db.diagnoses.get(diagnosisId) : undefined), [diagnosisId]);
  const { settings } = useSettings();
  const [tab, setTab] = useState<"chemical" | "organic" | "biological">("chemical");
  const [fieldSize, setFieldSize] = useState(settings.fieldSizeDa);
  const [aiTreatment, setAiTreatment] = useState<TreatmentInfo | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [addedToCalendar, setAddedToCalendar] = useState(false);
  const inventory = useLiveQuery(() => db.inventoryItems.toArray(), []) ?? [];
  const [deductItemId, setDeductItemId] = useState<number | "">("");
  const [deductAmount, setDeductAmount] = useState(1);
  const [deductStatus, setDeductStatus] = useState<string | null>(null);

  const relevantInventory = inventory.filter((i) =>
    tab === "chemical" ? i.type === "İlaç (Kimyasal)" : tab === "organic" ? i.type === "İlaç (Organik)" || i.type === "Gübre" : false
  );

  async function deductFromInventory() {
    if (deductItemId === "") return;
    const item = inventory.find((i) => i.id === deductItemId);
    if (!item) return;
    const newQty = Math.max(0, item.quantity - deductAmount);
    await db.inventoryItems.update(item.id!, { quantity: newQty });
    setDeductStatus(
      newQty <= item.lowStockThreshold
        ? `${item.name} güncellendi (${newQty} ${item.unit} kaldı) — stok kritik seviyede!`
        : `${item.name} güncellendi (${newQty} ${item.unit} kaldı).`
    );
  }

  const diseaseName = diagnosis?.diseaseNameTr ?? "Genel";
  const localTreatment = getLocalTreatment(diseaseName);
  const treatment: TreatmentInfo = localTreatment ?? aiTreatment ?? getTreatment(diseaseName);
  const isUsingAiFallback = !localTreatment;

  useEffect(() => {
    if (localTreatment || diseaseName === "Genel" || !diagnosisId) return;
    setAiLoading(true);
    setAiError(null);
    fetch("/api/gemini/treatment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ diseaseNameTr: diseaseName }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Tedavi planı üretilemedi.");
        setAiTreatment(data.treatment);
      })
      .catch((e) => setAiError(e.message))
      .finally(() => setAiLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diseaseName, diagnosisId]);

  const timeline =
    treatment.chemical.applicationIntervalDays > 0
      ? Array.from({ length: 3 }).map((_, i) => ({
          day: i * treatment.chemical.applicationIntervalDays,
          label: i === 0 ? "İlk uygulama" : `${i + 1}. uygulama`,
        }))
      : [];

  async function addTreatmentToCalendar() {
    if (timeline.length === 0) return;
    const today = new Date();
    for (const t of timeline) {
      const due = new Date(today);
      due.setDate(due.getDate() + t.day);
      await db.calendarTasks.add({
        plantId: diagnosis?.plantId ?? null,
        type: "İlaçlama",
        title: `${diseaseName} - ${t.label}`,
        dueDate: due.toISOString().slice(0, 10),
        priority: t.day === 0 ? "Yüksek" : "Normal",
        isRecurring: false,
        recurrenceDays: null,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      });
    }
    setAddedToCalendar(true);
  }

  return (
    <div className="page-enter">
      <TopBar title="Tedavi Merkezi" />
      <div className="p-4 md:p-6 max-w-md mx-auto flex flex-col gap-4">
        <div className="solid-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-foreground/50">Teşhis</p>
              <h2 className="font-bold text-lg">{diseaseName}</h2>
            </div>
            {isUsingAiFallback && diseaseName !== "Genel" && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-brand-blue-500/10 text-brand-blue-600">
                <Sparkles size={11} /> AI Üretimi
              </span>
            )}
          </div>
        </div>

        {aiLoading && (
          <div className="solid-card p-4 flex items-center gap-2 text-sm text-foreground/50">
            <Loader2 size={16} className="animate-spin" /> Bu hastalık için özel tedavi planı üretiliyor...
          </div>
        )}
        {aiError && (
          <div className="flex items-start gap-2 text-xs text-warn-500 bg-warn-500/10 rounded-xl p-3">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" />
            Özel tedavi planı üretilemedi ({aiError}). Genel öneriler gösteriliyor, AI Sohbet
            Asistanına da danışabilirsin.
          </div>
        )}

        <div className="flex rounded-full solid-card p-1">
          <button
            onClick={() => setTab("chemical")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition ${
              tab === "chemical" ? "bg-brand-blue-500 text-white" : "text-foreground/60"
            }`}
          >
            <FlaskConical size={14} /> Kimyasal
          </button>
          <button
            onClick={() => setTab("organic")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition ${
              tab === "organic" ? "bg-brand-green-600 text-white" : "text-foreground/60"
            }`}
          >
            <Leaf size={14} /> Organik
          </button>
          <button
            onClick={() => setTab("biological")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition ${
              tab === "biological" ? "bg-brand-amber-500 text-white" : "text-foreground/60"
            }`}
          >
            <Bug size={14} /> Biyolojik
          </button>
        </div>

        {tab === "chemical" && (
          <div className="solid-card p-4 flex flex-col gap-3">
            <Row label="Etken Madde" value={treatment.chemical.activeIngredient} />
            {treatment.chemical.exampleProducts.length > 0 && (
              <Row label="Örnek Ürünler" value={treatment.chemical.exampleProducts.join(", ")} />
            )}

            {treatment.chemical.applicationIntervalDays > 0 && (
              <>
                <div>
                  <label className="text-xs text-foreground/50">Tarla/Bahçe Büyüklüğü (dekar)</label>
                  <input
                    type="number"
                    min={0.1}
                    step={0.1}
                    value={fieldSize}
                    onChange={(e) => setFieldSize(Number(e.target.value))}
                    className="w-full mt-1 rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
                  />
                </div>
                <Row label="Hesaplanan Doz" value={scaleDose(treatment.chemical.doseLabel, fieldSize)} highlight />
                <Row label="Uygulama Aralığı" value={`${treatment.chemical.applicationIntervalDays} günde bir`} />
                <Row label="Hasat Öncesi Güvenlik Süresi" value={`${treatment.chemical.preHarvestIntervalDays} gün`} />
              </>
            )}
          </div>
        )}

        {tab === "organic" && (
          <div className="solid-card p-4 flex flex-col gap-3">
            <Row label="Yöntem" value={treatment.organic.method} />
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-foreground/50">Tahmini Etkinlik</span>
                <span className="text-xs font-semibold">%{treatment.organic.effectivenessPercent}</span>
              </div>
              <div className="h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-brand-green-500 rounded-full"
                  style={{ width: `${treatment.organic.effectivenessPercent}%` }}
                />
              </div>
            </div>
            {treatment.organic.applicationIntervalDays > 0 && (
              <Row label="Uygulama Aralığı" value={`${treatment.organic.applicationIntervalDays} günde bir`} />
            )}
          </div>
        )}

        {tab === "biological" && (
          <div className="solid-card p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <Bug size={18} className="text-brand-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-foreground/80">{treatment.biologicalControl}</p>
            </div>
          </div>
        )}

        {/* Envanterden düşme */}
        {tab !== "biological" && relevantInventory.length > 0 && (
          <div className="solid-card p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Package size={15} /> Envanterden Düş
            </h3>
            <div className="flex gap-2">
              <select
                value={deductItemId}
                onChange={(e) => setDeductItemId(e.target.value ? Number(e.target.value) : "")}
                className="flex-1 rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-xs"
              >
                <option value="">Ürün seç</option>
                {relevantInventory.map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit} kaldı)</option>
                ))}
              </select>
              <input
                type="number"
                min={0.1}
                step={0.1}
                value={deductAmount}
                onChange={(e) => setDeductAmount(Number(e.target.value))}
                className="w-20 rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-2 py-2 text-xs"
              />
              <button
                onClick={deductFromInventory}
                disabled={deductItemId === ""}
                className="flex items-center gap-1 px-3 rounded-lg bg-brand-blue-500 text-white text-xs disabled:opacity-40"
              >
                <Minus size={12} /> Düş
              </button>
            </div>
            {deductStatus && <p className="text-[11px] text-foreground/60 mt-2">{deductStatus}</p>}
          </div>
        )}

        {/* Güvenlik ekipmanı */}
        {treatment.safetyEquipment.length > 0 && (
          <div className="solid-card p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Shield size={15} /> Güvenlik Ekipmanı
            </h3>
            <div className="flex flex-wrap gap-2">
              {treatment.safetyEquipment.map((item) => (
                <span key={item} className="text-xs px-2.5 py-1 rounded-full bg-brand-blue-500/10 text-brand-blue-600">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {treatment.mixingWarnings.length > 0 && (
          <div className="flex flex-col gap-2">
            {treatment.mixingWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-warn-500 bg-warn-500/10 rounded-xl p-2.5">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-brand-blue-600 bg-brand-blue-500/10 rounded-xl p-3">
          <Droplets size={14} className="shrink-0 mt-0.5" /> {treatment.wateringAdvice}
        </div>

        {/* İyileşme süresi */}
        {treatment.estimatedRecoveryDays > 0 && (
          <div className="solid-card p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Clock size={15} /> Beklenen İyileşme Süresi
            </h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-amber-400 to-brand-green-500 rounded-full w-full" />
              </div>
              <span className="text-sm font-bold whitespace-nowrap">{treatment.estimatedRecoveryDays} gün</span>
            </div>
            <p className="text-[11px] text-foreground/40 mt-2">
              Düzenli tedavi uygulanması durumunda, benzer vakalara dayalı yaklaşık süre.
            </p>
          </div>
        )}

        {/* Tedavi takvimi */}
        {timeline.length > 0 && (
          <div className="solid-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-1.5">
                <Clock size={15} /> Gün Bazlı Tedavi Takvimi
              </h3>
              <button
                onClick={addTreatmentToCalendar}
                disabled={addedToCalendar}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full bg-brand-green-600 text-white disabled:opacity-50"
              >
                {addedToCalendar ? <CheckCircle2 size={12} /> : <CalendarPlus size={12} />}
                {addedToCalendar ? "Eklendi" : "Takvime Ekle"}
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {timeline.map((t, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-brand-green-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {t.day}g
                  </div>
                  <span className="text-sm">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-[11px] text-foreground/40 text-center">
          Bu bilgiler genel tarımsal danışmanlık niteliğindedir. Ürün etiketindeki resmi talimatlar
          her zaman önceliklidir.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-xs text-foreground/50">{label}</p>
      <p className={`text-sm ${highlight ? "font-bold text-brand-green-600" : "font-medium"}`}>{value}</p>
    </div>
  );
}

export default function TedaviPage() {
  return (
    <Suspense fallback={<div className="p-6"><div className="h-80 shimmer rounded-2xl" /></div>}>
      <TedaviContent />
    </Suspense>
  );
}
