"use client";

import { useState, useMemo, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Plant } from "@/lib/db/schema";
import {
  simulateGrowth, estimateCareQualityFromPlant, SPECIES_PROFILES, GrowthCategory, CareQuality,
} from "@/lib/utils/plant-growth-simulation";
import { useSettings } from "@/lib/context/settings-context";
import { TURKEY_PROVINCES } from "@/data/turkey-provinces";
import MultiLineChart from "@/components/charts/MultiLineChart";
import { Sprout, Info, Link2, Unlink, CloudSun, Loader2 } from "lucide-react";

const CATEGORIES: GrowthCategory[] = ["Sebze", "Çiçek", "Süs Bitkisi", "Ağaç", "Meyve", "Diğer"];

export default function PlantGrowthSim() {
  const { settings } = useSettings();
  const plants = useLiveQuery(() => db.plants.toArray(), []) ?? [];

  const [linkedPlantId, setLinkedPlantId] = useState<number | null>(null);
  const [category, setCategory] = useState<GrowthCategory>("Sebze");
  const [care, setCare] = useState<CareQuality>({ wateringConsistency: 80, fertilizingConsistency: 60, climateSuitability: 75 });
  const [weatherLoading, setWeatherLoading] = useState(false);

  const linkedPlant = plants.find((p) => p.id === linkedPlantId) ?? null;

  useEffect(() => {
    if (!linkedPlant) return;
    setCategory(linkedPlant.category as GrowthCategory);
    setCare(estimateCareQualityFromPlant(linkedPlant));
  }, [linkedPlant]);

  async function loadRealClimate() {
    const coords = TURKEY_PROVINCES.find((p) => p.name === settings.province);
    if (!coords) return;
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`);
      const data = await res.json();
      if (res.ok) {
        const temp = data.current.temp;
        // 15-27°C çoğu bitki için ideal aralık kabul edilir (hava durumu modülündeki
        // mantık ile tutarlı); bu aralıktan uzaklaştıkça uygunluk skoru düşer
        const suitability = temp >= 15 && temp <= 27 ? 95 : Math.max(20, 95 - Math.abs(temp - 21) * 4);
        setCare((c) => ({ ...c, climateSuitability: Math.round(suitability) }));
      }
    } catch {
      // sessizce geç
    } finally {
      setWeatherLoading(false);
    }
  }

  const totalDays = category === "Ağaç" ? 365 : category === "Meyve" ? 150 : 90;

  const idealSim = useMemo(
    () => simulateGrowth(category, { wateringConsistency: 100, fertilizingConsistency: 100, climateSuitability: 100 }, totalDays),
    [category, totalDays]
  );
  const actualSim = useMemo(() => simulateGrowth(category, care, totalDays), [category, care, totalDays]);

  const sampleStep = Math.max(1, Math.floor(totalDays / 60));
  const chartData = actualSim.points
    .filter((_, i) => i % sampleStep === 0)
    .map((p, i) => ({
      label: `${p.day}`,
      values: [p.sizePercent, idealSim.points[i * sampleStep]?.sizePercent ?? null],
    }));

  const finalActual = actualSim.points[actualSim.points.length - 1];
  const finalIdeal = idealSim.points[idealSim.points.length - 1];
  const gapPercent = Math.round(finalIdeal.sizePercent - finalActual.sizePercent);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 text-xs text-brand-blue-600 bg-brand-blue-500/10 rounded-xl p-3">
        <Info size={14} className="shrink-0 mt-0.5" />
        Lojistik büyüme modeline dayanan eğitici bir görselleştirme. Bakım kalitesinin büyüme hızı
        ve ulaşılabilir maksimum gelişime etkisinin yönünü gösterir — laboratuvar hassasiyetinde
        kesin bir tahmin değildir.
      </div>

      {/* Bitki bağlama */}
      <div className="solid-card p-4">
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
          <Sprout size={15} /> Simülasyon Kaynağı
        </h3>
        {plants.length === 0 ? (
          <p className="text-xs text-foreground/50">
            "Benim Bahçem"e bir bitki eklersen, gerçek sulama/gübreleme geçmişinden otomatik bakım
            kalitesi tahmini yapabilirim. Şimdilik genel bir tür seçerek deneyebilirsin.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setLinkedPlantId(null)}
              className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full ${
                linkedPlantId === null ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/10"
              }`}
            >
              <Unlink size={11} /> Genel Tür
            </button>
            {plants.map((p) => (
              <button
                key={p.id}
                onClick={() => setLinkedPlantId(p.id!)}
                className={`flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full ${
                  linkedPlantId === p.id ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/10"
                }`}
              >
                <Link2 size={11} /> {p.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tür seçimi (bitki bağlı değilse) */}
      {!linkedPlant && (
        <div className="solid-card p-4">
          <p className="text-xs text-foreground/50 mb-2">Bitki Türü</p>
          <div className="grid grid-cols-3 gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`text-[11px] py-2 rounded-lg ${category === c ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/10"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bakım kalitesi kontrolleri */}
      <div className="solid-card p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Bakım Kalitesi</h3>
          <button
            onClick={loadRealClimate}
            disabled={weatherLoading}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full bg-brand-blue-500/10 text-brand-blue-600"
          >
            {weatherLoading ? <Loader2 size={11} className="animate-spin" /> : <CloudSun size={11} />}
            Gerçek iklim verisi
          </button>
        </div>
        {linkedPlant && (
          <p className="text-[11px] text-foreground/40">
            {linkedPlant.name} için sulama/gübreleme geçmişinden otomatik tahmin edildi, istersen
            aşağıdan ayarlayabilirsin.
          </p>
        )}
        <CareSlider label={`Sulama Düzeni: %${care.wateringConsistency}`} value={care.wateringConsistency} onChange={(v) => setCare((c) => ({ ...c, wateringConsistency: v }))} />
        <CareSlider label={`Gübreleme Düzeni: %${care.fertilizingConsistency}`} value={care.fertilizingConsistency} onChange={(v) => setCare((c) => ({ ...c, fertilizingConsistency: v }))} />
        <CareSlider label={`İklim Uygunluğu: %${care.climateSuitability}`} value={care.climateSuitability} onChange={(v) => setCare((c) => ({ ...c, climateSuitability: v }))} />
      </div>

      {/* Büyüme grafiği */}
      <div className="solid-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Büyüme Eğrisi ({totalDays} gün)</h3>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-brand-green-500" /> Senin bakımın</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-foreground/20" /> İdeal bakım</span>
          </div>
        </div>
        <MultiLineChart
          data={chartData}
          series={[
            { name: "Senin bakımın", color: "#16a34a" },
            { name: "İdeal bakım", color: "#94a3b8" },
          ]}
          formatValue={(v) => `%${Math.round(v)}`}
        />
      </div>

      {/* Güncel evre */}
      <div className="grid grid-cols-2 gap-3">
        <div className="solid-card p-4 flex flex-col items-center">
          <span className="text-2xl font-bold text-brand-green-600">%{finalActual.sizePercent}</span>
          <span className="text-[10px] text-foreground/50 text-center mt-1">{totalDays}. gündeki tahmini gelişim</span>
          <span className="text-xs font-medium mt-1">{finalActual.stage}</span>
        </div>
        <div className="solid-card p-4 flex flex-col items-center">
          <span className={`text-2xl font-bold ${gapPercent > 15 ? "text-danger-500" : gapPercent > 5 ? "text-warn-500" : "text-ok-500"}`}>
            -%{Math.max(0, gapPercent)}
          </span>
          <span className="text-[10px] text-foreground/50 text-center mt-1">ideal bakıma göre kayıp potansiyel</span>
        </div>
      </div>

      {/* Evre zaman çizelgesi */}
      <div className="solid-card p-4">
        <h3 className="text-sm font-semibold mb-3">Büyüme Evreleri</h3>
        <div className="flex flex-col gap-2">
          {actualSim.profile.stages.map((s) => {
            const reached = finalActual.sizePercent >= s.atPercent;
            return (
              <div key={s.name} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full shrink-0 ${reached ? "bg-brand-green-600" : "bg-black/10 dark:bg-white/10"}`} />
                <span className={`text-sm ${reached ? "" : "text-foreground/40"}`}>{s.name}</span>
                <span className="text-[10px] text-foreground/30 ml-auto">%{s.atPercent}+</span>
              </div>
            );
          })}
        </div>
      </div>

      {gapPercent > 10 && (
        <div className="flex items-start gap-2 text-xs text-warn-500 bg-warn-500/10 rounded-xl p-3">
          <Info size={14} className="shrink-0 mt-0.5" />
          Bakım kalitesindeki tutarsızlık, potansiyel gelişimin yaklaşık %{gapPercent} gerisinde
          kalmana yol açabilir. Akıllı Takvim'den düzenli sulama/gübreleme hatırlatıcısı kurmayı
          düşünebilirsin.
        </div>
      )}
    </div>
  );
}

function CareSlider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-xs text-foreground/50 mb-1">{label}</p>
      <input type="range" min={0} max={100} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brand-green-500" />
    </div>
  );
}
