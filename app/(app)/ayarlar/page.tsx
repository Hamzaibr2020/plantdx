"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/context/settings-context";
import { useAuth } from "@/lib/context/auth-context";
import { db } from "@/lib/db/schema";
import { TURKEY_PROVINCES, CROPS } from "@/data/turkey-provinces";
import { subscribeToPush } from "@/lib/utils/push-client";
import TopBar from "@/components/layout/TopBar";
import {
  Moon, Type, Mic, Bell, Download, Upload, Trash2, HelpCircle, MessageSquareWarning, Star, Info, LogOut,
} from "lucide-react";

export default function AyarlarPage() {
  const { settings, updateSettings } = useSettings();
  const { setUsername, username } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);

  // Bildirim tercihleri veya il/ürün değiştiğinde sunucuyla senkronize et
  // (cron tabanlı push bildirimleri hangi kullanıcıya ne göndereceğini buradan bilir)
  useEffect(() => {
    if (!username) return;
    fetch("/api/push/sync-prefs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        province: settings.province,
        crops: settings.selectedCrops,
        notifyDailyAdvice: settings.notifyDailyAdvice,
        notifyWeatherAlerts: settings.notifyWeatherAlerts,
      }),
    }).catch(() => {});
  }, [username, settings.province, settings.selectedCrops, settings.notifyDailyAdvice, settings.notifyWeatherAlerts]);

  async function enableNotifications() {
    if (!username) return;
    setPushStatus("İzin isteniyor...");
    const result = await subscribeToPush(username);
    setPushStatus(result.ok ? "Push bildirimleri etkinleştirildi." : result.reason ?? "Etkinleştirilemedi.");
  }

  async function exportData() {
    const [plants, diagnoses, tasks, chat, profile] = await Promise.all([
      db.plants.toArray(),
      db.diagnoses.toArray(),
      db.calendarTasks.toArray(),
      db.chatMessages.toArray(),
      db.profile.toArray(),
    ]);
    const blob = new Blob([JSON.stringify({ plants, diagnoses, tasks, chat, profile }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantdx-yedek-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data.plants) await db.plants.bulkPut(data.plants);
      if (data.diagnoses) await db.diagnoses.bulkPut(data.diagnoses);
      if (data.tasks) await db.calendarTasks.bulkPut(data.tasks);
      if (data.chat) await db.chatMessages.bulkPut(data.chat);
      setStatus("Veriler başarıyla geri yüklendi.");
    } catch {
      setStatus("Dosya okunamadı, geçerli bir PlantDX yedeği olduğundan emin ol.");
    }
  }

  async function deleteAllData() {
    if (!confirm("TÜM verilerin silinsin mi? Bu işlem geri alınamaz.")) return;
    await Promise.all([
      db.plants.clear(),
      db.diagnoses.clear(),
      db.calendarTasks.clear(),
      db.chatMessages.clear(),
      db.profile.clear(),
      db.regionRiskCache.clear(),
      db.communityPostsCache.clear(),
      db.comments.clear(),
    ]);
    setStatus("Tüm veriler silindi.");
  }

  function logout() {
    setUsername(null);
    router.push("/giris");
  }

  return (
    <div className="page-enter">
      <TopBar title="Ayarlar" />
      <div className="p-4 md:p-6 max-w-lg mx-auto flex flex-col gap-4">
        <Section title="Görünüm">
          <ToggleRow icon={Moon} label="Karanlık Mod" checked={settings.darkMode} onChange={(v) => updateSettings({ darkMode: v })} />
          <ToggleRow icon={Type} label="Büyük Yazı" checked={settings.largeText} onChange={(v) => updateSettings({ largeText: v })} />
          <ToggleRow icon={Mic} label="Sesli Mod" checked={settings.voiceMode} onChange={(v) => updateSettings({ voiceMode: v })} />
          <SelectRow
            label="Dil"
            value={settings.language}
            options={[{ value: "tr", label: "Türkçe" }, { value: "en", label: "English" }]}
            onChange={(v) => updateSettings({ language: v as "tr" | "en" })}
          />
        </Section>

        <Section title="Bildirimler">
          <ToggleRow icon={Bell} label="Günlük Tavsiye Bildirimi" checked={settings.notifyDailyAdvice} onChange={(v) => updateSettings({ notifyDailyAdvice: v })} />
          <ToggleRow icon={Bell} label="Hava Riski Bildirimi" checked={settings.notifyWeatherAlerts} onChange={(v) => updateSettings({ notifyWeatherAlerts: v })} />
          <button onClick={enableNotifications} className="flex items-center gap-2 w-full py-2.5 text-sm text-brand-green-600">
            <Bell size={16} /> Bu Cihazda Push Bildirimlerini Etkinleştir
          </button>
          {pushStatus && <p className="text-xs text-foreground/50 py-1">{pushStatus}</p>}
        </Section>

        <Section title="Tarla Bilgileri">
          <SelectRow
            label="İl"
            value={settings.province}
            options={TURKEY_PROVINCES.map((p) => ({ value: p.name, label: p.name }))}
            onChange={(v) => updateSettings({ province: v })}
          />
          <div className="flex items-center justify-between py-2.5">
            <span className="text-sm">Tarla Büyüklüğü: {settings.fieldSizeDa} dekar</span>
          </div>
          <input
            type="range"
            min={0.5}
            max={500}
            step={0.5}
            value={settings.fieldSizeDa}
            onChange={(e) => updateSettings({ fieldSizeDa: Number(e.target.value) })}
            className="w-full accent-brand-green-500"
          />
          <div className="mt-2">
            <p className="text-sm mb-2">Ürünler</p>
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
        </Section>

        <Section title="Veri Yönetimi">
          <button onClick={exportData} className="flex items-center gap-2 w-full py-2.5 text-sm">
            <Download size={16} /> Verileri Yedekle (İndir)
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 w-full py-2.5 text-sm">
            <Upload size={16} /> Yedekten Geri Yükle
          </button>
          <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={importData} />
          <button onClick={deleteAllData} className="flex items-center gap-2 w-full py-2.5 text-sm text-danger-500">
            <Trash2 size={16} /> Tüm Verileri Sil
          </button>
          {status && <p className="text-xs text-brand-green-600">{status}</p>}
        </Section>

        <Section title="Destek">
          <a href="mailto:destek@plantdx.app" className="flex items-center gap-2 w-full py-2.5 text-sm">
            <HelpCircle size={16} /> Yardım Merkezi
          </a>
          <a href="mailto:geribildirim@plantdx.app" className="flex items-center gap-2 w-full py-2.5 text-sm">
            <MessageSquareWarning size={16} /> Geri Bildirim Gönder
          </a>
          <div className="flex items-center gap-2 w-full py-2.5 text-sm text-foreground/50">
            <Star size={16} /> Uygulamayı Puanla (mağazadan)
          </div>
        </Section>

        <Section title="Hakkında">
          <InfoRow label="Sürüm" value="1.0.0" />
          <InfoRow label="AI Motoru" value="Google Gemini (Sohbet + Vision)" />
          <InfoRow label="Çevrimdışı Model" value="MobileNetV2 (PlantVillage 38 sınıf)" />
          <InfoRow label="Harita Kaynağı" value="OpenStreetMap" />
        </Section>

        <button onClick={logout} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-danger-500/30 text-danger-500 text-sm font-medium">
          <LogOut size={16} /> Çıkış Yap
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="solid-card p-4">
      <h3 className="text-xs font-semibold text-foreground/40 uppercase tracking-wide mb-2">{title}</h3>
      <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">{children}</div>
    </div>
  );
}

function ToggleRow({ icon: Icon, label, checked, onChange }: { icon: React.ComponentType<{ size?: number }>; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="flex items-center gap-2 text-sm"><Icon size={16} /> {label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition relative ${checked ? "bg-brand-green-600" : "bg-black/10 dark:bg-white/10"}`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${checked ? "left-4.5 translate-x-0" : "left-0.5"}`} style={{ left: checked ? "18px" : "2px" }} />
      </button>
    </div>
  );
}

function SelectRow({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <span className="text-sm">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="text-sm bg-transparent border border-black/10 dark:border-white/10 rounded-lg px-2 py-1">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 text-sm">
      <span className="text-foreground/50">{label}</span>
      <span>{value}</span>
    </div>
  );
}
