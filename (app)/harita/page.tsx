"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import TopBar from "@/components/layout/TopBar";
import { TURKEY_PROVINCES } from "@/data/turkey-provinces";
import { ServerRegionRisk } from "@/lib/db/server-db";
import LineChart from "@/components/charts/LineChart";
import { Search, X, Satellite, Plus } from "lucide-react";

const RiskMap = dynamic(() => import("@/components/map/RiskMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full shimmer" />,
});

interface Polygon {
  polygonId: string;
  area: number;
  center: [number, number];
  name: string;
}

export default function HaritaPage() {
  const [regionRisk, setRegionRisk] = useState<ServerRegionRisk[]>([]);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("Hepsi");
  const [selected, setSelected] = useState<string | null>(null);

  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [ndvi, setNdvi] = useState<{ trend: any[]; stressLevel: string } | null>(null);
  const [ndviError, setNdviError] = useState<string | null>(null);
  const [selectedPolygon, setSelectedPolygon] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/region-risk")
      .then((r) => r.json())
      .then((d) => setRegionRisk(d.regionRisk ?? []));

    fetch("/api/agromonitoring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "list-polygons" }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error);
        setPolygons(
          (data.polygons ?? []).map((p: any) => ({ polygonId: p.id, area: p.area, center: p.center, name: p.name }))
        );
      })
      .catch((e) => setNdviError(e.message));
  }, []);

  async function loadNdvi(polygonId: string) {
    setSelectedPolygon(polygonId);
    setNdvi(null);
    setNdviError(null);
    try {
      const res = await fetch("/api/agromonitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get-ndvi", polygonId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNdvi(data);
    } catch (e) {
      setNdviError(e instanceof Error ? e.message : String(e));
    }
  }

  async function createSampleField() {
    if (!newFieldName.trim()) return;
    setCreating(true);
    try {
      // Basit dörtgen: merkez etrafında ~500m x 500m örnek parsel (kullanıcı gerçek koordinat çizemediği
      // durumlarda hızlı başlangıç için). Gerçek üretimde harita üzerinde çizim aracı eklenmelidir.
      const center = TURKEY_PROVINCES.find((p) => p.name === "Eskişehir")!;
      const d = 0.0025;
      const coords: [number, number][] = [
        [center.lon - d, center.lat - d],
        [center.lon + d, center.lat - d],
        [center.lon + d, center.lat + d],
        [center.lon - d, center.lat + d],
        [center.lon - d, center.lat - d],
      ];
      const res = await fetch("/api/agromonitoring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-polygon", polygon: { name: newFieldName, coordinates: coords } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPolygons((prev) => [...prev, { ...data, name: newFieldName }]);
      setNewFieldName("");
    } catch (e) {
      setNdviError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreating(false);
    }
  }

  const filteredProvinces = TURKEY_PROVINCES.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const riskByProvince = new Map(regionRisk.map((r) => [r.province, r]));

  return (
    <div className="page-enter flex flex-col h-[calc(100vh-56px)] md:h-screen">
      <TopBar title="Bölgesel Risk Haritası" />

      <div className="flex-1 grid md:grid-cols-[1fr_320px] overflow-hidden">
        <div className="relative h-64 md:h-full">
          <RiskMap regionRisk={regionRisk} onSelectProvince={setSelected} />
        </div>

        <div className="overflow-y-auto p-4 flex flex-col gap-4 border-l border-black/5 dark:border-white/5">
          {/* Arama ve filtre */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İl ara..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-black/10 dark:border-white/10 bg-transparent text-sm"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {["Hepsi", "düşük", "orta", "yüksek"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLevelFilter(lvl)}
                className={`text-[11px] px-2.5 py-1 rounded-full ${
                  levelFilter === lvl ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/10"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          {/* Lejant */}
          <div className="flex items-center gap-3 text-[11px]">
            <LegendDot color="#22c55e" label="Düşük" />
            <LegendDot color="#f59e0b" label="Orta" />
            <LegendDot color="#ef4444" label="Yüksek" />
            <LegendDot color="#94a3b8" label="Bilinmiyor" />
          </div>

          {/* İl listesi */}
          <div className="flex flex-col gap-1.5 max-h-56 overflow-y-auto">
            {filteredProvinces
              .filter((p) => {
                if (levelFilter === "Hepsi") return true;
                return riskByProvince.get(p.name)?.riskLevel === levelFilter;
              })
              .map((p) => {
                const risk = riskByProvince.get(p.name);
                return (
                  <button
                    key={p.name}
                    onClick={() => setSelected(p.name)}
                    className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-sm text-left"
                  >
                    {p.name}
                    <span className="text-[10px] text-foreground/40">{risk?.riskLevel ?? "veri yok"}</span>
                  </button>
                );
              })}
          </div>

          {/* Seçili il detayı */}
          {selected && (
            <div className="solid-card p-3 relative">
              <button onClick={() => setSelected(null)} className="absolute top-2 right-2">
                <X size={14} />
              </button>
              <h4 className="font-semibold text-sm">{selected}</h4>
              {riskByProvince.get(selected) ? (
                <div className="text-xs text-foreground/60 mt-1 flex flex-col gap-0.5">
                  <span>Baskın hastalık: {riskByProvince.get(selected)!.dominantDisease}</span>
                  <span>Etkilenen ürünler: {riskByProvince.get(selected)!.affectedCrops.join(", ") || "—"}</span>
                  <span>Rapor sayısı: {riskByProvince.get(selected)!.reportCount}</span>
                </div>
              ) : (
                <p className="text-xs text-foreground/40 mt-1">
                  Bu il için henüz yeterli kullanıcı raporu yok. Risk verisi, AI Kamera ile yapılan gerçek
                  teşhislerin toplulaştırılmasıyla oluşur.
                </p>
              )}
            </div>
          )}

          {/* NDVI Paneli */}
          <div className="solid-card p-4">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
              <Satellite size={15} /> NDVI - Uydu Verisi
            </h3>

            {ndviError && polygons.length === 0 ? (
              <p className="text-xs text-danger-500">{ndviError}</p>
            ) : (
              <>
                <div className="flex gap-2 mb-2">
                  <input
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Yeni tarla adı"
                    className="flex-1 text-xs px-2 py-1.5 rounded-lg border border-black/10 dark:border-white/10 bg-transparent"
                  />
                  <button
                    onClick={createSampleField}
                    disabled={creating}
                    className="px-2.5 rounded-lg bg-brand-green-600 text-white disabled:opacity-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <div className="flex flex-col gap-1 mb-2 max-h-24 overflow-y-auto">
                  {polygons.map((p) => (
                    <button
                      key={p.polygonId}
                      onClick={() => loadNdvi(p.polygonId)}
                      className={`text-left text-xs px-2 py-1.5 rounded-lg ${
                        selectedPolygon === p.polygonId ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/10"
                      }`}
                    >
                      {p.name} ({p.area?.toFixed?.(2) ?? "?"} ha)
                    </button>
                  ))}
                  {polygons.length === 0 && (
                    <p className="text-xs text-foreground/40">Henüz tarla eklenmedi.</p>
                  )}
                </div>

                {ndviError && <p className="text-xs text-danger-500">{ndviError}</p>}

                {ndvi && (
                  <>
                    <div className="text-xs mb-1">
                      Vejetasyon Stres Seviyesi: <b>{ndvi.stressLevel}</b>
                    </div>
                    <LineChart
                      data={ndvi.trend.filter((t) => t.ndvi !== null).map((t) => ({ label: t.date.slice(5), value: t.ndvi }))}
                      color="#16a34a"
                      formatValue={(v) => v.toFixed(2)}
                    />
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </div>
  );
}
