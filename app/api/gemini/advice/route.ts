import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON, GeminiError } from "@/lib/api/gemini-client";
import { computeDroughtRisk } from "@/lib/utils/et0-hargreaves";
import { TURKEY_PROVINCES } from "@/data/turkey-provinces";

export interface DailyAdviceResponse {
  headline: string;
  priority: "düşük" | "orta" | "yüksek";
  wateringAdvice: string;
  diseaseRiskAdvice: string;
  weeklyOutlook: string;
  actionItems: string[];
  dataSourcesUsed: string[];
  generatedAt: string;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    headline: { type: "STRING" },
    priority: { type: "STRING", enum: ["düşük", "orta", "yüksek"] },
    wateringAdvice: { type: "STRING" },
    diseaseRiskAdvice: { type: "STRING" },
    weeklyOutlook: { type: "STRING" },
    actionItems: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["headline", "priority", "wateringAdvice", "diseaseRiskAdvice", "weeklyOutlook", "actionItems"],
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY tanımlı değil." }, { status: 500 });
  }

  try {
    const { province, crops, season, plants, recentDiagnoses } = (await req.json()) as {
      province: string;
      crops: string[];
      season: string;
      plants: { name: string; category: string }[];
      recentDiagnoses?: { diseaseNameTr: string; isHealthy: boolean }[];
    };

    const dataSourcesUsed: string[] = ["kullanıcı profili"];
    let weatherBlock = "Hava durumu verisi mevcut değil.";
    let droughtBlock = "";

    // Mümkünse gerçek hava durumu + kuraklık riski verisiyle tavsiyeyi zenginleştir
    const weatherKey = process.env.OPENWEATHER_API_KEY;
    const coords = TURKEY_PROVINCES.find((p) => p.name === province);
    if (weatherKey && coords) {
      try {
        const [currentRes, forecastRes] = await Promise.all([
          fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=tr&appid=${weatherKey}`
          ),
          fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=tr&appid=${weatherKey}`
          ),
        ]);
        if (currentRes.ok && forecastRes.ok) {
          const current = await currentRes.json();
          const forecast = await forecastRes.json();

          weatherBlock = `Şu an: ${Math.round(current.main.temp)}°C, nem %${current.main.humidity}, rüzgar ${current.wind.speed} m/s, durum: ${current.weather?.[0]?.description}.`;
          dataSourcesUsed.push("OpenWeatherMap gerçek zamanlı hava durumu");

          const dailyMap = new Map<string, { temps: number[]; rain: number }>();
          for (const item of forecast.list ?? []) {
            const day = item.dt_txt.slice(0, 10);
            if (!dailyMap.has(day)) dailyMap.set(day, { temps: [], rain: 0 });
            const e = dailyMap.get(day)!;
            e.temps.push(item.main.temp);
            e.rain += item.rain?.["3h"] ?? 0;
          }
          const dailyForecast = Array.from(dailyMap.entries())
            .slice(0, 5)
            .map(([date, v]) => ({
              date,
              minTemp: Math.min(...v.temps),
              maxTemp: Math.max(...v.temps),
              totalRain: Math.round(v.rain * 10) / 10,
            }));

          if (dailyForecast.length > 0) {
            const risk = computeDroughtRisk(dailyForecast, coords.lat);
            droughtBlock = `FAO-56 Hargreaves modeline göre 5 günlük su dengesi: ${risk.cumulativeDeficitMm}mm (risk seviyesi: ${risk.riskLevel}).`;
            dataSourcesUsed.push("FAO-56 Hargreaves kuraklık modeli");
          }
        }
      } catch {
        // hava durumu alınamadıysa sessizce devam et, tavsiye yine de üretilir
      }
    }

    const diseaseBlock = recentDiagnoses?.length
      ? `Son teşhisler: ${recentDiagnoses
          .slice(0, 5)
          .map((d) => (d.isHealthy ? "sağlıklı" : d.diseaseNameTr))
          .join(", ")}.`
      : "Henüz teşhis geçmişi yok.";

    const prompt = `Sen deneyimli bir ziraat mühendisisin. Aşağıdaki GERÇEK verilere dayanarak
${province} ilindeki bir çiftçi/bahçıvan için bugüne özel, spesifik ve uygulanabilir bir tarım
brifingi hazırla. Genel geçer, her ile uyacak laf kalabalığı YAPMA — verilen verilere gerçekten
dayan ve mümkün olduğunca somut ol (sayı, süre, zamanlama belirt).

MEVSİM: ${season}
YETİŞTİRİLEN ÜRÜNLER: ${crops.join(", ") || "belirtilmedi"}
BAHÇEDEKİ BİTKİLER: ${plants.map((p) => `${p.name} (${p.category})`).join(", ") || "kayıtlı bitki yok"}
HAVA DURUMU: ${weatherBlock}
${droughtBlock}
HASTALIK GEÇMİŞİ: ${diseaseBlock}

Yanıtını istenen JSON şemasına göre ver. "priority" alanı bugün acil bir aksiyon gerekip
gerekmediğini yansıtmalı (don riski, aşırı sıcak, kuraklık riski "yüksek" varsa priority=yüksek).
"actionItems" en fazla 4 madde, her biri tek cümle ve uygulanabilir olsun.`;

    const result = await callGeminiJSON<DailyAdviceResponse>(apiKey, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      temperature: 0.5,
      maxOutputTokens: 800,
      jsonSchema: RESPONSE_SCHEMA,
    });

    return NextResponse.json({ ...result, dataSourcesUsed, generatedAt: new Date().toISOString() });
  } catch (err) {
    if (err instanceof GeminiError) {
      return NextResponse.json({ error: err.message, detail: err.detail }, { status: err.status || 500 });
    }
    return NextResponse.json(
      { error: "Sunucu hatası", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
