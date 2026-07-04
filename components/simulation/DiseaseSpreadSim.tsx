"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { runSimulation, SimulationDaySnapshot, TreatmentStrategy } from "@/lib/utils/disease-simulation";
import { useSettings } from "@/lib/context/settings-context";
import { TURKEY_PROVINCES } from "@/data/turkey-provinces";
import LineChart from "@/components/charts/LineChart";
import { Play, Pause, RotateCcw, Info, CloudSun, Loader2 } from "lucide-react";

const STATE_COLOR: Record<string, string> = {
  saglikli: "#22c55e",
  enfekte: "#ef4444",
  iyilesti: "#3b82f6",
  kayip: "#3f3f46",
};

export default function DiseaseSpreadSim() {
  const { settings } = useSettings();
  const [humidity, setHumidity] = useState(70);
  const [temperature, setTemperature] = useState(22);
  const [strategy, setStrategy] = useState<TreatmentStrategy>("yok");
  const [gridSize, setGridSize] = useState(12);
  const [initialInfected, setInitialInfected] = useState(3);
  const [day, setDay] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [useRealWeather, setUseRealWeather] = useState(false);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const totalDays = 30;

  const snapshots = useMemo<SimulationDaySnapshot[]>(
    () =>
      runSimulation({
        gridSize,
        humidity,
        temperature,
        treatmentStrategy: strategy,
        initialInfectedCount: initialInfected,
        totalDays,
        seed: 42,
      }),
    [gridSize, humidity, temperature, strategy, initialInfected]
  );

  const current = snapshots[Math.min(day, snapshots.length - 1)];

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setDay((d) => {
          if (d >= totalDays) {
            setPlaying(false);
            return d;
          }
          return d + 1;
        });
      }, 400);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing]);

  async function loadRealWeather() {
    const coords = TURKEY_PROVINCES.find((p) => p.name === settings.province);
    if (!coords) return;
    setWeatherLoading(true);
    try {
      const res = await fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`);
      const data = await res.json();
      if (res.ok) {
        setHumidity(data.current.humidity);
        setTemperature(Math.round(data.current.temp));
        setUseRealWeather(true);
      }
    } catch {
      // sessizce geç, kullanıcı manuel değer girmeye devam edebilir
    } finally {
      setWeatherLoading(false);
    }
  }

  function reset() {
    setPlaying(false);
    setDay(0);
  }

  const chartData = snapshots.slice(0, day + 1).map((s) => ({ label: `${s.day}`, value: s.infectedCount }));
  const lossChartData = snapshots.slice(0, day + 1).map((s) => ({ label: `${s.day}`, value: s.lostCount }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-2 text-xs text-brand-blue-600 bg-brand-blue-500/10 rounded-xl p-3">
        <Info size={14} className="shrink-0 mt-0.5" />
        Bu bir eğitici karar-destek simülasyonudur; SIR epidemiyolojik modelinin basitleştirilmiş
          bir uyarlamasıdır. Nem/sıcaklık/tedavi stratejisinin yayılma hızına etkisinin yönünü ve
          büyüklük mertebesini gösterir — kesin bilimsel tahmin değildir.
        </div>

        {/* Kontrol paneli */}
        <div className="solid-card p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Senaryo Parametreleri</h3>
            <button
              onClick={loadRealWeather}
              disabled={weatherLoading}
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full bg-brand-blue-500/10 text-brand-blue-600"
            >
              {weatherLoading ? <Loader2 size={11} className="animate-spin" /> : <CloudSun size={11} />}
              {settings.province} verisini kullan
            </button>
          </div>

          <SliderRow label={`Nem: %${humidity}`} value={humidity} min={10} max={100} onChange={(v) => { setHumidity(v); setUseRealWeather(false); reset(); }} />
          <SliderRow label={`Sıcaklık: ${temperature}°C`} value={temperature} min={-5} max={40} onChange={(v) => { setTemperature(v); setUseRealWeather(false); reset(); }} />
          <SliderRow label={`Başlangıç enfeksiyon sayısı: ${initialInfected}`} value={initialInfected} min={1} max={10} onChange={(v) => { setInitialInfected(v); reset(); }} />

          <div>
            <p className="text-xs text-foreground/50 mb-1.5">Tedavi Stratejisi</p>
            <div className="flex rounded-full bg-black/5 dark:bg-white/5 p-1">
              {(["yok", "organik", "kimyasal"] as TreatmentStrategy[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { setStrategy(s); reset(); }}
                  className={`flex-1 py-2 rounded-full text-xs font-medium capitalize transition ${
                    strategy === s ? "bg-brand-green-600 text-white" : "text-foreground/60"
                  }`}
                >
                  {s === "yok" ? "Tedavi Yok" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid görselleştirme */}
        <div className="solid-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Gün {current.day} / {totalDays}</h3>
            <div className="flex items-center gap-2">
              <button onClick={reset} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
                <RotateCcw size={15} />
              </button>
              <button
                onClick={() => setPlaying(!playing)}
                className="w-9 h-9 rounded-full bg-brand-green-600 text-white flex items-center justify-center"
              >
                {playing ? <Pause size={15} /> : <Play size={15} />}
              </button>
            </div>
          </div>

          <div
            className="grid gap-0.5 mb-3"
            style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
          >
            {current.grid.flatMap((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  className="aspect-square rounded-sm transition-colors duration-300"
                  style={{ backgroundColor: STATE_COLOR[cell] }}
                />
              ))
            )}
          </div>

          <input
            type="range"
            min={0}
            max={totalDays}
            value={day}
            onChange={(e) => { setPlaying(false); setDay(Number(e.target.value)); }}
            className="w-full accent-brand-green-500"
          />

          <div className="flex items-center gap-4 mt-3 text-[11px]">
            <LegendDot color={STATE_COLOR.saglikli} label={`Sağlıklı (${current.healthyCount})`} />
            <LegendDot color={STATE_COLOR.enfekte} label={`Enfekte (${current.infectedCount})`} />
            <LegendDot color={STATE_COLOR.iyilesti} label={`İyileşti (${current.recoveredCount})`} />
            <LegendDot color={STATE_COLOR.kayip} label={`Kayıp (${current.lostCount})`} />
          </div>
        </div>

        {/* Trend grafikleri */}
        <div className="solid-card p-4">
          <h3 className="text-sm font-semibold mb-2">Enfeksiyon Sayısı Trendi</h3>
          <LineChart data={chartData} color="#ef4444" />
        </div>
        <div className="solid-card p-4">
          <h3 className="text-sm font-semibold mb-2">Kayıp (Kurtarılamayan) Bitki Trendi</h3>
          <LineChart data={lossChartData} color="#3f3f46" />
        </div>

        <div className="solid-card p-4">
          <h3 className="text-sm font-semibold mb-2">Ne Öğrendik?</h3>
          <p className="text-xs text-foreground/60 leading-relaxed">
            {strategy === "yok"
              ? "Tedavi uygulanmadığında, özellikle yüksek nem ve ılık sıcaklıklarda enfeksiyon hızla yayılıyor ve kayıp oranı artıyor. Erken müdahale kritik önem taşıyor."
              : strategy === "organik"
              ? "Organik mücadele yayılma hızını belirgin şekilde yavaşlatıyor ama kimyasal kadar hızlı sonuç vermiyor — sabırlı ve düzenli uygulama gerekiyor."
              : "Kimyasal mücadele en hızlı sonucu veriyor; yayılma hızı ve kayıp oranı en düşük seviyede. Ancak hasat öncesi güvenlik sürelerine dikkat etmeyi unutma."}
          </p>
        </div>
      </div>
  );
}

function SliderRow({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <p className="text-xs text-foreground/50 mb-1">{label}</p>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-brand-green-500" />
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}
