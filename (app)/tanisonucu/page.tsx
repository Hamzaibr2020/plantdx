"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Diagnosis } from "@/lib/db/schema";
import TopBar from "@/components/layout/TopBar";
import CircularGauge from "@/components/ui/CircularGauge";
import {
  CheckCircle2, AlertOctagon, Pill, MessageCircle, MapPin, Calendar, ShieldAlert, TrendingDown,
} from "lucide-react";

function ResultContent() {
  const params = useSearchParams();
  const router = useRouter();
  const id = Number(params.get("id"));
  const diagnosis = useLiveQuery(() => (id ? db.diagnoses.get(id) : undefined), [id]);

  if (diagnosis === undefined) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <div className="h-80 shimmer rounded-2xl" />
      </div>
    );
  }

  if (!diagnosis) {
    return <div className="p-6 text-center text-sm text-foreground/50">Teşhis kaydı bulunamadı.</div>;
  }

  return <ResultView diagnosis={diagnosis} />;
}

function ResultView({ diagnosis: d }: { diagnosis: Diagnosis }) {
  const router = useRouter();
  const severityLabel = ["", "Çok Hafif", "Hafif", "Orta", "Ciddi", "Kritik"][d.severity] ?? "Bilinmiyor";
  const severityColor = ["", "#22c55e", "#84cc16", "#f59e0b", "#f97316", "#ef4444"][d.severity] ?? "#8a9a91";

  return (
    <div className="page-enter">
      <TopBar title="Teşhis Sonucu" />
      <div className="p-4 md:p-6 max-w-md mx-auto flex flex-col gap-4">
        <img src={d.imageDataUrl} alt="" className="w-full aspect-square object-cover rounded-2xl" />

        {d.isHealthy ? (
          <div className="solid-card p-5 flex flex-col items-center text-center gap-2">
            <CheckCircle2 className="text-ok-500" size={40} />
            <h2 className="text-lg font-bold text-ok-500">Bitkiniz Sağlıklı Görünüyor!</h2>
            <p className="text-sm text-foreground/60">
              Bu görüntüde herhangi bir hastalık belirtisine rastlanmadı. Düzenli bakıma devam edin.
            </p>
          </div>
        ) : (
          <div className="solid-card p-5 flex flex-col items-center gap-3">
            <CircularGauge
              value={d.confidence * 100}
              color={severityColor}
              sublabel="güven skoru"
            />
            <h2 className="text-lg font-bold text-center">{d.diseaseNameTr}</h2>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Badge color={severityColor}>Şiddet: {severityLabel}</Badge>
              {d.spreadRisk && <Badge color="#3b82f6">Yayılma Riski: {d.spreadRisk}</Badge>}
              {d.recoverability !== null && <Badge color="#22c55e">Kurtarılabilirlik: %{d.recoverability}</Badge>}
            </div>
          </div>
        )}

        {d.quarantineRecommended && (
          <div className="flex items-start gap-2 text-sm text-danger-500 bg-danger-500/10 rounded-xl p-3">
            <ShieldAlert size={18} className="shrink-0 mt-0.5" />
            <span>
              <b>Karantina önerilir.</b> Yayılmayı önlemek için bu bitkiyi diğerlerinden ayırın.
            </span>
          </div>
        )}

        {d.alternatives.length > 0 && (
          <div className="solid-card p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <TrendingDown size={15} /> Alternatif Teşhisler
            </h3>
            <div className="flex flex-col gap-2">
              {d.alternatives.map((alt, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="text-foreground/70">{alt.label}</span>
                  <span className="font-medium">%{Math.round(alt.confidence * 100)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-foreground/50">
          <MapPin size={13} /> {d.latitude ? `${d.latitude.toFixed(2)}, ${d.longitude?.toFixed(2)}` : "Konum kaydedilmedi"}
          <span className="mx-1">·</span>
          <Calendar size={13} /> {new Date(d.createdAt).toLocaleDateString("tr-TR")}
        </div>

        {!d.isHealthy && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push(`/tedavi?diagnosisId=${d.id}`)}
              className="flex items-center justify-center gap-2 rounded-xl bg-brand-green-600 text-white py-3 text-sm font-medium"
            >
              <Pill size={16} /> Tedavi Planı
            </button>
            <button
              onClick={() => router.push("/sohbet")}
              className="flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/10 py-3 text-sm font-medium"
            >
              <MessageCircle size={16} /> AI'ya Sor
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      className="text-[11px] font-medium px-2.5 py-1 rounded-full"
      style={{ backgroundColor: color + "20", color }}
    >
      {children}
    </span>
  );
}

export default function TaniSonucuPage() {
  return (
    <Suspense fallback={<div className="p-6"><div className="h-80 shimmer rounded-2xl" /></div>}>
      <ResultContent />
    </Suspense>
  );
}
