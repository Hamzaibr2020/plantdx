"use client";

import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";
import { ensureProfile } from "@/lib/db/schema";

export default function YazdirPage() {
  const profile = useLiveQuery(() => db.profile.toCollection().first(), []);
  const plants = useLiveQuery(() => db.plants.toArray(), []) ?? [];
  const diagnoses = useLiveQuery(() => db.diagnoses.orderBy("createdAt").reverse().toArray(), []) ?? [];
  const tasks = useLiveQuery(() => db.calendarTasks.toArray(), []) ?? [];
  const fields = useLiveQuery(() => db.fields.toArray(), []) ?? [];
  const [ready, setReady] = useState(false);

  useEffect(() => {
    ensureProfile();
  }, []);

  useEffect(() => {
    if (profile !== undefined) setReady(true);
  }, [profile]);

  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, [ready]);

  const healthyCount = diagnoses.filter((d) => d.isHealthy).length;
  const sickCount = diagnoses.length - healthyCount;
  const completedTasks = tasks.filter((t) => t.completed).length;

  const diseaseFrequency = new Map<string, number>();
  diagnoses.filter((d) => !d.isHealthy).forEach((d) => diseaseFrequency.set(d.diseaseNameTr, (diseaseFrequency.get(d.diseaseNameTr) ?? 0) + 1));
  const topDiseases = Array.from(diseaseFrequency.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (!ready) {
    return <div className="p-10 text-center text-sm text-foreground/50">Rapor hazırlanıyor...</div>;
  }

  return (
    <div className="print-report bg-white text-black min-h-screen p-8 max-w-3xl mx-auto">
      <style jsx global>{`
        @media print {
          @page { margin: 1.5cm; }
          body { background: white !important; }
        }
        .print-report h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .print-report h2 { font-size: 15px; font-weight: 700; margin-top: 20px; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
        .print-report table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .print-report th, .print-report td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #eee; }
        .print-report th { color: #666; font-weight: 600; }
      `}</style>

      <div className="flex items-center justify-between mb-1">
        <div>
          <h1>PlantDX Bahçe Raporu</h1>
          <p className="text-xs text-gray-500">
            {profile?.displayName} · Oluşturulma: {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="text-2xl">🌱</div>
      </div>

      <h2>Genel Özet</h2>
      <div className="grid grid-cols-4 gap-3 text-center">
        <SummaryBox label="Bitki" value={plants.length} />
        <SummaryBox label="Toplam Analiz" value={diagnoses.length} />
        <SummaryBox label="Tarla/Parsel" value={fields.length} />
        <SummaryBox label="Tamamlanan Görev" value={`${completedTasks}/${tasks.length}`} />
      </div>

      <h2>Bitki Sağlık Durumu</h2>
      <p className="text-xs text-gray-600 mb-2">
        {diagnoses.length === 0
          ? "Henüz analiz kaydı yok."
          : `${healthyCount} sağlıklı teşhis, ${sickCount} hastalık/zararlı tespiti yapıldı.`}
      </p>

      {topDiseases.length > 0 && (
        <>
          <h2>En Sık Tespit Edilen Hastalıklar</h2>
          <table>
            <thead><tr><th>Hastalık</th><th>Tespit Sayısı</th></tr></thead>
            <tbody>
              {topDiseases.map(([name, count]) => (
                <tr key={name}><td>{name}</td><td>{count}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <h2>Bitki Listesi</h2>
      <table>
        <thead><tr><th>Ad</th><th>Kategori</th><th>Konum</th><th>Eklenme</th></tr></thead>
        <tbody>
          {plants.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{p.location ?? "—"}</td>
              <td>{new Date(p.createdAt).toLocaleDateString("tr-TR")}</td>
            </tr>
          ))}
          {plants.length === 0 && <tr><td colSpan={4}>Kayıtlı bitki yok.</td></tr>}
        </tbody>
      </table>

      <h2>Teşhis Geçmişi (Son 20)</h2>
      <table>
        <thead><tr><th>Tarih</th><th>Sonuç</th><th>Güven</th><th>Mod</th></tr></thead>
        <tbody>
          {diagnoses.slice(0, 20).map((d) => (
            <tr key={d.id}>
              <td>{new Date(d.createdAt).toLocaleDateString("tr-TR")}</td>
              <td>{d.isHealthy ? "Sağlıklı" : d.diseaseNameTr}</td>
              <td>%{Math.round(d.confidence * 100)}</td>
              <td>{d.mode === "online" ? "Çevrimiçi" : "Çevrimdışı"}</td>
            </tr>
          ))}
          {diagnoses.length === 0 && <tr><td colSpan={4}>Henüz analiz yapılmadı.</td></tr>}
        </tbody>
      </table>

      <p className="text-[10px] text-gray-400 mt-8 text-center">
        Bu rapor PlantDX uygulaması tarafından otomatik oluşturulmuştur — {new Date().toISOString()}
      </p>
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="border border-gray-200 rounded-lg py-3">
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] text-gray-500">{label}</div>
    </div>
  );
}
