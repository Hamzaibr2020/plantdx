"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/context/settings-context";
import { TURKEY_PROVINCES } from "@/data/turkey-provinces";
import TopBar from "@/components/layout/TopBar";
import { Droplets, Wind, Thermometer, AlertTriangle, Info, XCircle } from "lucide-react";

interface WeatherData {
  current: { temp: number; feelsLike: number; humidity: number; windSpeed: number; description: string; icon: string };
  dailyForecast: { date: string; minTemp: number; maxTemp: number; avgHumidity: number; maxWind: number; totalRain: number; icon: string }[];
  agriAlerts: { type: string; level: "bilgi" | "uyarı" | "tehlike"; message: string }[];
  wateringAdvice: string;
}

const ALERT_STYLE = {
  bilgi: { color: "#3b82f6", icon: Info },
  uyarı: { color: "#f59e0b", icon: AlertTriangle },
  tehlike: { color: "#ef4444", icon: XCircle },
};

export default function HavaDurumuPage() {
  const { settings } = useSettings();
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const province = TURKEY_PROVINCES.find((p) => p.name === settings.province) ?? TURKEY_PROVINCES[25];

  useEffect(() => {
    setData(null);
    setError(null);
    fetch(`/api/weather?lat=${province.lat}&lon=${province.lon}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error);
        setData(d);
      })
      .catch((e) => setError(e.message));
  }, [province.lat, province.lon]);

  return (
    <div className="page-enter">
      <TopBar title="Hava Durumu" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-4">
        <p className="text-xs text-foreground/40">{settings.province}</p>

        {error && <div className="text-sm text-danger-500 solid-card p-4">{error}</div>}

        {!data && !error && <div className="h-40 shimmer rounded-2xl" />}

        {data && (
          <>
            <div className="solid-card p-6 flex items-center gap-4 bg-gradient-to-br from-brand-blue-500/10 to-brand-green-500/10">
              <img src={`https://openweathermap.org/img/wn/${data.current.icon}@4x.png`} alt="" className="w-20 h-20" />
              <div>
                <p className="text-4xl font-bold">{Math.round(data.current.temp)}°C</p>
                <p className="text-sm text-foreground/60 capitalize">{data.current.description}</p>
                <p className="text-xs text-foreground/40">Hissedilen: {Math.round(data.current.feelsLike)}°C</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniStat icon={Droplets} label="Nem" value={`${data.current.humidity}%`} />
              <MiniStat icon={Wind} label="Rüzgar" value={`${data.current.windSpeed} m/s`} />
              <MiniStat icon={Thermometer} label="Hissedilen" value={`${Math.round(data.current.feelsLike)}°C`} />
            </div>

            {data.agriAlerts.length > 0 && (
              <div className="flex flex-col gap-2">
                {data.agriAlerts.map((a, i) => {
                  const style = ALERT_STYLE[a.level];
                  const Icon = style.icon;
                  return (
                    <div key={i} className="flex items-start gap-2 text-sm rounded-xl p-3" style={{ backgroundColor: style.color + "15", color: style.color }}>
                      <Icon size={16} className="shrink-0 mt-0.5" /> {a.message}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="solid-card p-4 flex items-start gap-2 text-sm">
              <Droplets size={16} className="text-brand-blue-500 shrink-0 mt-0.5" />
              {data.wateringAdvice}
            </div>

            <div className="solid-card p-4">
              <h3 className="text-sm font-semibold mb-3">7 Günlük Tahmin</h3>
              <div className="flex flex-col gap-2">
                {data.dailyForecast.map((d) => (
                  <div key={d.date} className="flex items-center gap-3">
                    <span className="text-xs w-16 text-foreground/50">
                      {new Date(d.date).toLocaleDateString("tr-TR", { weekday: "short", day: "2-digit" })}
                    </span>
                    <img src={`https://openweathermap.org/img/wn/${d.icon}.png`} alt="" className="w-8 h-8" />
                    <span className="text-xs text-foreground/40 flex-1">{d.totalRain > 0 ? `${d.totalRain}mm yağış` : "Yağışsız"}</span>
                    <span className="text-sm">
                      <b>{Math.round(d.maxTemp)}°</b> <span className="text-foreground/40">{Math.round(d.minTemp)}°</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ size?: number; className?: string }>; label: string; value: string }) {
  return (
    <div className="solid-card p-3 flex flex-col items-center gap-1">
      <Icon size={16} className="text-brand-blue-500" />
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[10px] text-foreground/40">{label}</span>
    </div>
  );
}
