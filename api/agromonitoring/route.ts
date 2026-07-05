import { NextRequest, NextResponse } from "next/server";

/**
 * Agromonitoring API entegrasyonu.
 * Akış: 1) Polygon oluştur (bir kere, tarla sınırları ile)  2) NDVI verisi çek (60 günlük)
 * Gerçek Sentinel-2/Landsat-8 uydu verisi döner. Anahtar yoksa dürüst hata döner (sahte veri yok).
 */

export async function POST(req: NextRequest) {
  const apiKey = process.env.AGROMONITORING_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AGROMONITORING_API_KEY tanımlı değil." }, { status: 500 });
  }

  try {
    const { action, polygon, polygonId } = (await req.json()) as {
      action: "create-polygon" | "get-ndvi" | "list-polygons";
      polygon?: { name: string; coordinates: [number, number][] };
      polygonId?: string;
    };

    if (action === "create-polygon") {
      if (!polygon) return NextResponse.json({ error: "polygon verisi gerekli." }, { status: 400 });
      const res = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: polygon.name,
          geo_json: {
            type: "Feature",
            properties: {},
            geometry: { type: "Polygon", coordinates: [polygon.coordinates] },
          },
        }),
      });
      if (!res.ok) return NextResponse.json({ error: `Agromonitoring hatası: ${res.status}` }, { status: 502 });
      const data = await res.json();
      return NextResponse.json({ polygonId: data.id, area: data.area, center: data.center });
    }

    if (action === "list-polygons") {
      const res = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey}`);
      if (!res.ok) return NextResponse.json({ error: `Agromonitoring hatası: ${res.status}` }, { status: 502 });
      const data = await res.json();
      return NextResponse.json({ polygons: data });
    }

    if (action === "get-ndvi") {
      if (!polygonId) return NextResponse.json({ error: "polygonId gerekli." }, { status: 400 });
      const end = Math.floor(Date.now() / 1000);
      const start = end - 60 * 24 * 60 * 60; // 60 gün
      const res = await fetch(
        `https://api.agromonitoring.com/agro/1.0/ndvi/history?polyid=${polygonId}&start=${start}&end=${end}&appid=${apiKey}`
      );
      if (!res.ok) return NextResponse.json({ error: `Agromonitoring hatası: ${res.status}` }, { status: 502 });
      const data = await res.json();

      const trend = (data as Array<{ dt: number; data: { mean: number }; cl?: number }>).map((d) => ({
        date: new Date(d.dt * 1000).toISOString().slice(0, 10),
        ndvi: d.data?.mean ?? null,
        cloudCoverage: d.cl ?? null,
      }));

      const latest = trend[trend.length - 1];
      let stressLevel: "düşük" | "orta" | "yüksek" | "bilinmiyor" = "bilinmiyor";
      if (latest?.ndvi !== null && latest?.ndvi !== undefined) {
        if (latest.ndvi > 0.6) stressLevel = "düşük";
        else if (latest.ndvi > 0.3) stressLevel = "orta";
        else stressLevel = "yüksek";
      }

      return NextResponse.json({ trend, stressLevel });
    }

    return NextResponse.json({ error: "Geçersiz action." }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: "Sunucu hatası", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
