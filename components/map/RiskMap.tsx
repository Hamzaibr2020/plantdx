"use client";

import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { TURKEY_PROVINCES } from "@/data/turkey-provinces";
import { ServerRegionRisk } from "@/lib/db/server-db";

const RISK_COLOR: Record<string, string> = {
  düşük: "#22c55e",
  orta: "#f59e0b",
  yüksek: "#ef4444",
  bilinmiyor: "#94a3b8",
};

export default function RiskMap({
  regionRisk,
  onSelectProvince,
}: {
  regionRisk: ServerRegionRisk[];
  onSelectProvince: (name: string) => void;
}) {
  const riskByProvince = new Map(regionRisk.map((r) => [r.province, r]));

  return (
    <MapContainer center={[39.0, 35.2]} zoom={6} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanları'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {TURKEY_PROVINCES.map((p) => {
        const risk = riskByProvince.get(p.name);
        const level = risk?.riskLevel ?? "bilinmiyor";
        return (
          <CircleMarker
            key={p.name}
            center={[p.lat, p.lon]}
            radius={risk ? 7 + Math.min(6, risk.reportCount) : 5}
            pathOptions={{ color: RISK_COLOR[level], fillColor: RISK_COLOR[level], fillOpacity: 0.7 }}
            eventHandlers={{ click: () => onSelectProvince(p.name) }}
          >
            <Popup>
              <b>{p.name}</b>
              <br />
              Risk: {level}
              {risk?.dominantDisease && (
                <>
                  <br />
                  Baskın: {risk.dominantDisease}
                </>
              )}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
