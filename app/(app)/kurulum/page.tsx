"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/context/settings-context";
import { TURKEY_PROVINCES, CROPS } from "@/data/turkey-provinces";
import TopBar from "@/components/layout/TopBar";
import {
  CheckCircle2, XCircle, Loader2, ExternalLink, Sparkles, CloudSun, Satellite,
  Fingerprint, Bell, Timer, ChevronRight,
} from "lucide-react";

interface SetupStatus {
  gemini: boolean;
  openWeather: boolean;
  agromonitoring: boolean;
  webauthn: boolean;
  webauthnUsesLocalhost: boolean;
  push: boolean;
  cronSecret: boolean;
}

export default function KurulumPage() {
  const { settings, updateSettings } = useSettings();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string } | null>>({});
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/setup/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {});
  }, []);

  async function testConnection(service: "gemini" | "openWeather" | "agromonitoring") {
    setTesting(service);
    try {
      const res = await fetch("/api/setup/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service }),
      });
      const data = await res.json();
      setTestResults((prev) => ({ ...prev, [service]: data }));
    } catch (e) {
      setTestResults((prev) => ({ ...prev, [service]: { ok: false, message: String(e) } }));
    } finally {
      setTesting(null);
    }
  }

  const requiredCount = status ? [status.gemini].filter(Boolean).length : 0;
  const optionalCount = status
    ? [status.openWeather, status.agromonitoring, status.webauthn && !status.webauthnUsesLocalhost, status.push].filter(Boolean).length
    : 0;

  return (
    <div className="page-enter">
      <TopBar title="Kurulum" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-4">
        <div className="solid-card p-5">
          <h2 className="font-bold text-lg mb-1">PlantDX Kurulum Sihirbazı</h2>
          <p className="text-sm text-foreground/60">
            Uygulamanın hangi özelliklerinin aktif olduğunu kontrol et ve ilk ayarlarını yap.
          </p>
        </div>

        {!status ? (
          <div className="h-40 shimmer rounded-2xl" />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="solid-card p-3 flex flex-col items-center">
                <span className="text-xl font-bold text-brand-green-600">{requiredCount}/1</span>
                <span className="text-[10px] text-foreground/50">Zorunlu Entegrasyon</span>
              </div>
              <div className="solid-card p-3 flex flex-col items-center">
                <span className="text-xl font-bold text-brand-blue-500">{optionalCount}/4</span>
                <span className="text-[10px] text-foreground/50">Opsiyonel Entegrasyon</span>
              </div>
            </div>

            {/* Zorunlu */}
            <SectionHeader title="Zorunlu — Uygulamanın Çekirdeği" />
            <ServiceRow
              icon={Sparkles}
              title="Google Gemini API"
              description="AI Sohbet, Günlük Tavsiye, Görüntü Analizi, Tedavi Planları, Simülasyon verisi — tüm AI özellikleri buna bağlı"
              configured={status.gemini}
              testResult={testResults.gemini}
              testing={testing === "gemini"}
              onTest={() => testConnection("gemini")}
              docsUrl="https://aistudio.google.com/apikey"
            />

            {/* Opsiyonel */}
            <SectionHeader title="Opsiyonel — Ek Özellikler" />
            <ServiceRow
              icon={CloudSun}
              title="OpenWeatherMap"
              description="Hava durumu, tarımsal risk uyarıları, kuraklık modeli, simülasyonda gerçek hava verisi"
              configured={status.openWeather}
              testResult={testResults.openWeather}
              testing={testing === "openWeather"}
              onTest={() => testConnection("openWeather")}
              docsUrl="https://openweathermap.org/api"
            />
            <ServiceRow
              icon={Satellite}
              title="Agromonitoring (NDVI)"
              description="Uydu tabanlı bitki örtüsü/stres analizi (Bölgesel Risk Haritası)"
              configured={status.agromonitoring}
              testResult={testResults.agromonitoring}
              testing={testing === "agromonitoring"}
              onTest={() => testConnection("agromonitoring")}
              docsUrl="https://agromonitoring.com/api"
            />
            <StaticServiceRow
              icon={Fingerprint}
              title="WebAuthn (Biyometrik Giriş)"
              description={
                status.webauthnUsesLocalhost
                  ? "Şu an localhost için yapılandırılmış. Gerçek domain'e deploy ederken NEXT_PUBLIC_RP_ID / NEXT_PUBLIC_ORIGIN güncellenmeli."
                  : "Yapılandırılmış."
              }
              configured={status.webauthn && !status.webauthnUsesLocalhost}
              warning={status.webauthnUsesLocalhost}
            />
            <StaticServiceRow
              icon={Bell}
              title="Push Bildirimleri (VAPID)"
              description="Günlük tavsiye ve hava riski bildirimleri için gerekli. npx web-push generate-vapid-keys ile üretilir."
              configured={status.push}
            />
            <StaticServiceRow
              icon={Timer}
              title="Cron Koruması"
              description="Zamanlanmış bildirim endpoint'lerini yetkisiz erişime karşı korur."
              configured={status.cronSecret}
            />
          </>
        )}

        {/* İlk ayarlar */}
        <SectionHeader title="Başlangıç Ayarları" />
        <div className="solid-card p-4 flex flex-col gap-3">
          <div>
            <label className="text-xs text-foreground/50">İlin</label>
            <select
              value={settings.province}
              onChange={(e) => updateSettings({ province: e.target.value })}
              className="w-full mt-1 rounded-lg border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
            >
              {TURKEY_PROVINCES.map((p) => <option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-foreground/50 mb-1.5">Yetiştirdiğin Ürünler</p>
            <div className="flex flex-wrap gap-1.5">
              {CROPS.map((c) => {
                const active = settings.selectedCrops.includes(c);
                return (
                  <button
                    key={c}
                    onClick={() =>
                      updateSettings({
                        selectedCrops: active ? settings.selectedCrops.filter((x) => x !== c) : [...settings.selectedCrops, c],
                      })
                    }
                    className={`text-[11px] px-2.5 py-1 rounded-full ${active ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/10"}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
          <a href="/ayarlar" className="flex items-center justify-between text-sm text-brand-green-600 pt-2 border-t border-black/5 dark:border-white/5">
            Tüm ayarlara git <ChevronRight size={14} />
          </a>
        </div>

        <p className="text-[11px] text-foreground/40 text-center pb-4">
          Ortam değişkenlerini değiştirdikten sonra sunucuyu (npm run dev / deploy) yeniden başlatman gerekir.
        </p>
      </div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wide mt-2">{title}</h3>;
}

function ServiceRow({
  icon: Icon, title, description, configured, testResult, testing, onTest, docsUrl,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  configured: boolean;
  testResult: { ok: boolean; message: string } | null | undefined;
  testing: boolean;
  onTest: () => void;
  docsUrl: string;
}) {
  return (
    <div className="solid-card p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-green-50 dark:bg-white/5 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-brand-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold">{title}</p>
            {configured ? (
              <CheckCircle2 size={14} className="text-ok-500 shrink-0" />
            ) : (
              <XCircle size={14} className="text-foreground/30 shrink-0" />
            )}
          </div>
          <p className="text-xs text-foreground/50 mt-0.5">{description}</p>

          <div className="flex items-center gap-2 mt-2">
            {configured && (
              <button
                onClick={onTest}
                disabled={testing}
                className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full bg-brand-blue-500/10 text-brand-blue-600 disabled:opacity-50"
              >
                {testing && <Loader2 size={11} className="animate-spin" />}
                Bağlantıyı Test Et
              </button>
            )}
            <a
              href={docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 rounded-full bg-black/5 dark:bg-white/10 text-foreground/60"
            >
              Key Al <ExternalLink size={10} />
            </a>
          </div>

          {testResult && (
            <p className={`text-[11px] mt-2 ${testResult.ok ? "text-ok-500" : "text-danger-500"}`}>
              {testResult.ok ? "✓ " : "✗ "}
              {testResult.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StaticServiceRow({
  icon: Icon, title, description, configured, warning,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  configured: boolean;
  warning?: boolean;
}) {
  return (
    <div className="solid-card p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-brand-green-50 dark:bg-white/5 flex items-center justify-center shrink-0">
          <Icon size={16} className="text-brand-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold">{title}</p>
            {configured ? (
              <CheckCircle2 size={14} className="text-ok-500 shrink-0" />
            ) : warning ? (
              <XCircle size={14} className="text-warn-500 shrink-0" />
            ) : (
              <XCircle size={14} className="text-foreground/30 shrink-0" />
            )}
          </div>
          <p className="text-xs text-foreground/50 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
}
