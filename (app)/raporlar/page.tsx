"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";
import TopBar from "@/components/layout/TopBar";
import BarChart from "@/components/charts/BarChart";
import LineChart from "@/components/charts/LineChart";
import CircularGauge from "@/components/ui/CircularGauge";
import { FileDown } from "lucide-react";

type Period = "günlük" | "haftalık" | "aylık";

export default function RaporlarPage() {
  const [period, setPeriod] = useState<Period>("haftalık");
  const diagnoses = useLiveQuery(() => db.diagnoses.toArray(), []) ?? [];
  const tasks = useLiveQuery(() => db.calendarTasks.toArray(), []) ?? [];

  const rangeDays = period === "günlük" ? 7 : period === "haftalık" ? 8 * 7 : 12 * 30;
  const cutoff = Date.now() - rangeDays * 86400000;
  const inRange = diagnoses.filter((d) => new Date(d.createdAt).getTime() >= cutoff);

  const barData = useMemo(() => {
    const buckets = new Map<string, number>();
    inRange.forEach((d) => {
      const date = new Date(d.createdAt);
      const key =
        period === "günlük"
          ? date.toLocaleDateString("tr-TR", { weekday: "short" })
          : period === "haftalık"
          ? `H${Math.ceil(date.getDate() / 7)}`
          : date.toLocaleDateString("tr-TR", { month: "short" });
      buckets.set(key, (buckets.get(key) ?? 0) + 1);
    });
    return Array.from(buckets.entries()).map(([label, value]) => ({ label, value, color: "#22c55e" }));
  }, [inRange, period]);

  const trendData = useMemo(() => {
    const sorted = [...inRange].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return sorted.map((d) => ({
      label: new Date(d.createdAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" }),
      value: d.isHealthy ? 100 : Math.max(10, 100 - d.severity * 20),
    }));
  }, [inRange]);

  const healthyCount = inRange.filter((d) => d.isHealthy).length;
  const sickCount = inRange.length - healthyCount;

  const diseaseFrequency = useMemo(() => {
    const map = new Map<string, number>();
    inRange
      .filter((d) => !d.isHealthy)
      .forEach((d) => map.set(d.diseaseNameTr, (map.get(d.diseaseNameTr) ?? 0) + 1));
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [inRange]);

  const completedTasks = tasks.filter((t) => t.completed).length;
  const taskCompletionPct = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const yoyData = useMemo(() => {
    const map = new Map<number, number>();
    diagnoses.forEach((d) => {
      const y = new Date(d.createdAt).getFullYear();
      map.set(y, (map.get(y) ?? 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0]);
  }, [diagnoses]);

  return (
    <div className="page-enter">
      <TopBar title="Raporlar" />
      <div className="p-4 md:p-6 max-w-3xl mx-auto flex flex-col gap-4">
        <Link
          href="/yazdir"
          target="_blank"
          className="flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-green-600 text-white text-sm font-medium"
        >
          <FileDown size={16} /> PDF Rapor Olarak İndir
        </Link>
        <div className="flex rounded-full solid-card p-1">
          {(["günlük", "haftalık", "aylık"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-full text-xs font-medium capitalize transition ${
                period === p ? "bg-brand-green-600 text-white" : "text-foreground/60"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="solid-card p-4">
          <h3 className="text-sm font-semibold mb-2">Analiz Sayısı</h3>
          <BarChart data={barData} />
        </div>

        <div className="solid-card p-4">
          <h3 className="text-sm font-semibold mb-2">Sağlık Skoru Trendi</h3>
          <LineChart data={trendData} color="#16a34a" formatValue={(v) => `${Math.round(v)}`} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="solid-card p-4 flex flex-col items-center">
            <CircularGauge
              value={inRange.length ? (healthyCount / inRange.length) * 100 : 0}
              color="#22c55e"
              sublabel="sağlıklı"
            />
            <p className="text-xs text-foreground/50 mt-2">
              {healthyCount} sağlıklı · {sickCount} hastalıklı
            </p>
          </div>
          <div className="solid-card p-4 flex flex-col items-center">
            <CircularGauge value={taskCompletionPct} color="#3b82f6" sublabel="görev" />
            <p className="text-xs text-foreground/50 mt-2">{completedTasks}/{tasks.length} tamamlandı</p>
          </div>
        </div>

        <div className="solid-card p-4">
          <h3 className="text-sm font-semibold mb-2">En Çok Tespit Edilen Hastalıklar</h3>
          {diseaseFrequency.length === 0 ? (
            <p className="text-sm text-foreground/40 py-3 text-center">Bu dönemde hastalık tespiti yok.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {diseaseFrequency.map(([name, count], i) => (
                <div key={name} className="flex items-center gap-2">
                  <span className="text-xs w-4 text-foreground/40">{i + 1}</span>
                  <span className="text-sm flex-1">{name}</span>
                  <span className="text-xs font-semibold">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="solid-card p-4">
          <h3 className="text-sm font-semibold mb-2">Yıllar Arası Karşılaştırma</h3>
          {yoyData.length < 2 ? (
            <p className="text-sm text-foreground/40 py-3 text-center">
              Karşılaştırma için en az 2 farklı yıla ait veri gerekiyor. Şu an yetersiz veri var.
            </p>
          ) : (
            <BarChart data={yoyData.map(([year, count]) => ({ label: String(year), value: count, color: "#3b82f6" }))} />
          )}
        </div>
      </div>
    </div>
  );
}
