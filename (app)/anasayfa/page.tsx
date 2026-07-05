"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";
import { useSettings } from "@/lib/context/settings-context";
import { useAuth } from "@/lib/context/auth-context";
import TopBar from "@/components/layout/TopBar";
import CircularGauge from "@/components/ui/CircularGauge";
import { TURKEY_PROVINCES } from "@/data/turkey-provinces";
import { computeDroughtRisk } from "@/lib/utils/et0-hargreaves";
import { Camera, Sun, Moon, Sunrise, CloudDrizzle, Droplets, AlertTriangle, ChevronRight, CheckCircle2 } from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return { text: "İyi geceler", icon: Moon };
  if (h < 12) return { text: "Günaydın", icon: Sunrise };
  if (h < 18) return { text: "İyi günler", icon: Sun };
  return { text: "İyi akşamlar", icon: Moon };
}

export default function AnaSayfaPage() {
  const { username } = useAuth();
  const { settings } = useSettings();
  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const plants = useLiveQuery(() => db.plants.toArray(), []) ?? [];
  const diagnoses = useLiveQuery(() => db.diagnoses.orderBy("createdAt").reverse().limit(5).toArray(), []) ?? [];
  const tasks = useLiveQuery(
    () => db.calendarTasks.filter((t) => !t.completed).sortBy("dueDate"),
    []
  ) ?? [];
  const profile = useLiveQuery(() => db.profile.toCollection().first(), []);

  const [advice, setAdvice] = useState<{
    data: {
      headline: string;
      priority: "düşük" | "orta" | "yüksek";
      wateringAdvice: string;
      diseaseRiskAdvice: string;
      weeklyOutlook: string;
      actionItems: string[];
      dataSourcesUsed: string[];
    } | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });
  const [weather, setWeather] = useState<any>(null);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [droughtRisk, setDroughtRisk] = useState<ReturnType<typeof computeDroughtRisk> | null>(null);

  const healthScore = plants.length
    ? Math.round(plants.reduce((sum, p) => sum + calcPlantHealth(p), 0) / plants.length)
    : null;

  const province = TURKEY_PROVINCES.find((p) => p.name === settings.province) ?? TURKEY_PROVINCES[25];

  useEffect(() => {
    fetch(`/api/weather?lat=${province.lat}&lon=${province.lon}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setWeather(data);
        const risk = computeDroughtRisk(data.dailyForecast.slice(0, 5), province.lat);
        setDroughtRisk(risk);
      })
      .catch((e) => setWeatherError(e.message));
  }, [province.lat, province.lon]);

  useEffect(() => {
    fetch("/api/gemini/advice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        province: settings.province,
        crops: settings.selectedCrops,
        season: getSeason(),
        plants: plants.map((p) => ({ name: p.name, category: p.category })),
        recentDiagnoses: diagnoses.map((d) => ({ diseaseNameTr: d.diseaseNameTr, isHealthy: d.isHealthy })),
      }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setAdvice({ data, loading: false, error: null });
      })
      .catch((e) => setAdvice({ data: null, loading: false, error: e.message }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.province, plants.length, diagnoses.length]);

  async function completeTask(id: number) {
    await db.calendarTasks.update(id, { completed: true, completedAt: new Date().toISOString() });
  }

  return (
    <div className="page-enter">
      <TopBar title="Ana Sayfa" />
      <div className="p-4 md:p-6 flex flex-col gap-4 max-w-3xl">
        <div className="flex items-center gap-2">
          <GreetingIcon className="text-brand-amber-500" size={20} />
          <h2 className="text-lg font-semibold">
            {greeting.text}, {username}
          </h2>
        </div>

        {/* İstatistik kartları */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="Bitki" value={plants.length} />
          <StatCard
            label="Sağlık Puanı"
            value={healthScore !== null ? `${healthScore}` : "—"}
            color={healthScore !== null && healthScore < 50 ? "text-danger-500" : "text-brand-green-600"}
          />
          <StatCard label="Aktiflik" value={profile ? `${profile.streakDays}g` : "—"} />
        </div>

        <Link
          href="/kamera"
          className="glass-card p-4 flex items-center gap-3 bg-gradient-to-r from-brand-green-600 to-brand-green-500 text-white"
        >
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
            <Camera size={22} />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Hızlı Analiz</p>
            <p className="text-xs text-white/80">Bir fotoğraf çek, saniyeler içinde teşhis al</p>
          </div>
          <ChevronRight size={18} />
        </Link>

        {/* Görevler */}
        <SectionCard title="Bugünkü Görevler" href="/takvim">
          {tasks.length === 0 ? (
            <p className="text-sm text-foreground/50 py-2">Bekleyen görev yok, harika gidiyorsun!</p>
          ) : (
            <div className="flex flex-col gap-2">
              {tasks.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-2 py-1.5">
                  <button onClick={() => completeTask(t.id!)}>
                    <CheckCircle2 size={18} className="text-foreground/30 hover:text-brand-green-600" />
                  </button>
                  <span className="text-sm flex-1">{t.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-amber-400/20 text-brand-amber-600">
                    {t.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Hava durumu */}
        <SectionCard title="Hava Durumu" href="/hava-durumu">
          {weatherError ? (
            <p className="text-xs text-danger-500">{weatherError}</p>
          ) : !weather ? (
            <div className="h-16 shimmer rounded-xl" />
          ) : (
            <div className="flex items-center gap-4">
              <img
                src={`https://openweathermap.org/img/wn/${weather.current.icon}@2x.png`}
                alt=""
                className="w-14 h-14"
              />
              <div>
                <p className="text-2xl font-bold">{Math.round(weather.current.temp)}°C</p>
                <p className="text-xs text-foreground/60 capitalize">{weather.current.description}</p>
              </div>
              <div className="ml-auto text-xs text-foreground/60 flex items-center gap-1">
                <Droplets size={14} /> {weather.current.humidity}%
              </div>
            </div>
          )}
        </SectionCard>

        {/* AI Günlük Tarım Tavsiyesi */}
        <div className="solid-card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">AI Günlük Tarım Tavsiyesi</h3>
            {advice.data && (
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  advice.data.priority === "yüksek"
                    ? "bg-danger-500/15 text-danger-500"
                    : advice.data.priority === "orta"
                    ? "bg-warn-500/15 text-warn-500"
                    : "bg-ok-500/15 text-ok-500"
                }`}
              >
                {advice.data.priority === "yüksek" ? "Acil" : advice.data.priority === "orta" ? "Dikkat" : "Normal"}
              </span>
            )}
          </div>

          {advice.loading ? (
            <div className="flex flex-col gap-2">
              <div className="h-4 w-2/3 shimmer rounded-lg" />
              <div className="h-3 w-full shimmer rounded-lg" />
              <div className="h-3 w-5/6 shimmer rounded-lg" />
            </div>
          ) : advice.error ? (
            <p className="text-xs text-danger-500">{advice.error}</p>
          ) : advice.data ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold text-brand-green-700 dark:text-brand-green-400">{advice.data.headline}</p>

              <div className="flex flex-col gap-2">
                <AdviceRow icon={Droplets} label="Sulama" text={advice.data.wateringAdvice} />
                <AdviceRow icon={AlertTriangle} label="Hastalık Riski" text={advice.data.diseaseRiskAdvice} />
                <AdviceRow icon={CloudDrizzle} label="Haftalık Görünüm" text={advice.data.weeklyOutlook} />
              </div>

              {advice.data.actionItems.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1 border-t border-black/5 dark:border-white/5">
                  <p className="text-[11px] font-semibold text-foreground/50 uppercase tracking-wide">Bugün Yapılacaklar</p>
                  {advice.data.actionItems.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="w-4 h-4 rounded-full bg-brand-green-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {advice.data.dataSourcesUsed.length > 0 && (
                <p className="text-[10px] text-foreground/30">Kaynak: {advice.data.dataSourcesUsed.join(" · ")}</p>
              )}
            </div>
          ) : null}
        </div>

        {/* Kuraklık risk kartı */}
        <SectionCard title="Kuraklık / Toprak Nemi Riski">
          {!droughtRisk ? (
            <div className="h-16 shimmer rounded-xl" />
          ) : (
            <div className="flex items-center gap-4">
              <div
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  droughtRisk.riskLevel === "yüksek"
                    ? "bg-danger-500/15 text-danger-500"
                    : droughtRisk.riskLevel === "orta"
                    ? "bg-warn-500/15 text-warn-500"
                    : "bg-ok-500/15 text-ok-500"
                }`}
              >
                Risk: {droughtRisk.riskLevel}
              </div>
              <p className="text-xs text-foreground/60 flex-1">
                5 günlük su dengesi: <b>{droughtRisk.cumulativeDeficitMm} mm</b> (FAO-56 Hargreaves ET0
                modeline göre)
              </p>
            </div>
          )}
        </SectionCard>

        {/* Son analizler */}
        <SectionCard title="Son Analizler" href="/raporlar">
          {diagnoses.length === 0 ? (
            <p className="text-sm text-foreground/50 py-2">Henüz analiz yapılmadı.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {diagnoses.map((d) => (
                <div key={d.id} className="shrink-0 w-24">
                  <img src={d.imageDataUrl} className="w-24 h-24 object-cover rounded-xl" alt="" />
                  <p className="text-[10px] mt-1 truncate">{d.diseaseNameTr}</p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

function AdviceRow({ icon: Icon, label, text }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-brand-blue-500 shrink-0 mt-0.5" />
      <p className="text-xs text-foreground/70">
        <span className="font-medium text-foreground/90">{label}: </span>
        {text}
      </p>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="glass-card p-3 flex flex-col items-center">
      <span className={`text-xl font-bold ${color ?? ""}`}>{value}</span>
      <span className="text-[10px] text-foreground/50">{label}</span>
    </div>
  );
}

function SectionCard({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <div className="solid-card p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {href && (
          <Link href={href} className="text-xs text-brand-green-600 flex items-center gap-0.5">
            Tümü <ChevronRight size={12} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function calcPlantHealth(plant: { lastWateredAt: string | null; wateringIntervalDays: number; lastFertilizedAt: string | null; fertilizingIntervalDays: number }) {
  const now = Date.now();
  let score = 100;
  if (plant.lastWateredAt) {
    const daysSince = (now - new Date(plant.lastWateredAt).getTime()) / 86400000;
    const overdue = daysSince - plant.wateringIntervalDays;
    if (overdue > 0) score -= Math.min(40, overdue * 5);
  } else {
    score -= 20;
  }
  if (plant.lastFertilizedAt) {
    const daysSince = (now - new Date(plant.lastFertilizedAt).getTime()) / 86400000;
    const overdue = daysSince - plant.fertilizingIntervalDays;
    if (overdue > 0) score -= Math.min(20, overdue * 2);
  }
  return Math.max(0, Math.round(score));
}

function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "İlkbahar";
  if (m >= 6 && m <= 8) return "Yaz";
  if (m >= 9 && m <= 11) return "Sonbahar";
  return "Kış";
}
