"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TopBar from "@/components/layout/TopBar";
import CameraCapture from "@/components/camera/CameraCapture";
import { analyzeImageQuality } from "@/lib/utils/image-quality";
import { isOfflineModelAvailable, runOfflineInference } from "@/lib/api/tfjs-inference";
import { db } from "@/lib/db/schema";
import { grantXp } from "@/lib/utils/gamification";
import { useSettings } from "@/lib/context/settings-context";
import { WifiOff, Wifi, AlertTriangle, Loader2 } from "lucide-react";

export default function KameraPage() {
  const router = useRouter();
  const { settings } = useSettings();
  const [mode, setMode] = useState<"offline" | "online">("online");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qualityWarnings, setQualityWarnings] = useState<string[]>([]);
  const [offlineAvailable, setOfflineAvailable] = useState<boolean | null>(null);

  useState(() => {
    isOfflineModelAvailable().then(setOfflineAvailable);
  });

  async function handleCapture(dataUrl: string, imageEl: HTMLImageElement) {
    setError(null);
    const quality = analyzeImageQuality(imageEl);
    setQualityWarnings(quality.warnings);

    setAnalyzing(true);
    try {
      if (mode === "offline") {
        const available = await isOfflineModelAvailable();
        if (!available) {
          throw new Error(
            "Çevrimdışı analiz yapılamadı: cihazda eğitilmiş bir model bulunamadı. " +
              "scripts/train_plantvillage_model.py ile modeli eğitip public/models/plantvillage_web_model/ " +
              "klasörüne yerleştirmen gerekiyor. Şimdilik Çevrimiçi (Gemini Vision) modunu kullanabilirsin."
          );
        }
        const result = await runOfflineInference(imageEl);

        const id = await db.diagnoses.add({
          imageDataUrl: dataUrl,
          mode: "offline",
          diseaseClass: result.diseaseClass,
          diseaseNameTr: result.diseaseNameTr,
          confidence: result.confidence,
          severity: result.isHealthy ? 1 : 3,
          isHealthy: result.isHealthy,
          spreadRisk: null,
          recoverability: null,
          alternatives: result.alternatives,
          quarantineRecommended: false,
          latitude: null,
          longitude: null,
          plantId: null,
          createdAt: new Date().toISOString(),
          raw: result,
        });

        await afterAnalysis(result.isHealthy, result.diseaseNameTr);
        router.push(`/tanisonucu?id=${id}`);
      } else {
        const base64 = dataUrl.split(",")[1];
        const res = await fetch("/api/gemini/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mimeType: "image/jpeg" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Analiz başarısız oldu.");

        const r = data.result;
        const id = await db.diagnoses.add({
          imageDataUrl: dataUrl,
          mode: "online",
          diseaseClass: r.diseaseClass,
          diseaseNameTr: r.diseaseNameTr,
          confidence: r.confidence,
          severity: r.severity,
          isHealthy: r.isHealthy,
          spreadRisk: r.spreadRisk,
          recoverability: r.recoverability,
          alternatives: r.alternatives ?? [],
          quarantineRecommended: r.quarantineRecommended,
          latitude: null,
          longitude: null,
          plantId: null,
          createdAt: new Date().toISOString(),
          raw: r,
        });

        await afterAnalysis(r.isHealthy, r.diseaseNameTr);

        // Bölgesel risk haritasına gerçek raporu gönder (kullanıcı onaylı, anonim)
        fetch("/api/region-risk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            province: settings.province,
            diseaseNameTr: r.diseaseNameTr,
            isHealthy: r.isHealthy,
          }),
        }).catch(() => {});

        router.push(`/tanisonucu?id=${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setAnalyzing(false);
    }
  }

  async function afterAnalysis(isHealthy: boolean, diseaseName: string) {
    const profile = await import("@/lib/db/schema").then((m) => m.ensureProfile());
    await db.profile.update(profile.id!, { totalAnalyses: profile.totalAnalyses + 1 });
    await grantXp(isHealthy ? 10 : 15);
  }

  return (
    <div className="page-enter">
      <TopBar title="AI Kamera" />
      <div className="p-4 md:p-6 max-w-md mx-auto flex flex-col gap-3">
        {/* Mod anahtarı */}
        <div className="flex rounded-full solid-card p-1">
          <button
            onClick={() => setMode("online")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition ${
              mode === "online" ? "bg-brand-green-600 text-white" : "text-foreground/60"
            }`}
          >
            <Wifi size={14} /> Çevrimiçi (Gemini Vision)
          </button>
          <button
            onClick={() => setMode("offline")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full text-xs font-medium transition ${
              mode === "offline" ? "bg-brand-green-600 text-white" : "text-foreground/60"
            }`}
          >
            <WifiOff size={14} /> Çevrimdışı (TFLite)
          </button>
        </div>

        {mode === "offline" && offlineAvailable === false && (
          <div className="flex items-start gap-2 text-xs text-warn-500 bg-warn-500/10 rounded-xl p-3">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            Cihazda eğitilmiş çevrimdışı model bulunamadı. Şu an bu modda analiz yapılamaz — dürüst
            olmak adına sahte sonuç üretilmez. Model eğitimi için scripts/train_plantvillage_model.py
            dosyasına bakabilirsin.
          </div>
        )}

        <div className="relative">
          <CameraCapture onCapture={handleCapture} />
          {analyzing && (
            <div className="absolute inset-0 bg-black/60 rounded-2xl flex flex-col items-center justify-center gap-2 text-white">
              <Loader2 className="animate-spin" size={28} />
              <p className="text-sm">Analiz ediliyor...</p>
            </div>
          )}
        </div>

        {qualityWarnings.length > 0 && (
          <div className="flex flex-col gap-1">
            {qualityWarnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-warn-500 bg-warn-500/10 rounded-xl p-2.5">
                <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {w}
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-danger-500 bg-danger-500/10 rounded-xl p-3">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
      </div>
    </div>
  );
}
