import { NextRequest, NextResponse } from "next/server";
import { callGemini } from "@/lib/api/gemini-client";

/**
 * Kurulum sayfasından tetiklenir. Her servise gerçek, minimal bir istek atarak
 * key'in gerçekten çalışıp çalışmadığını doğrular (sadece .env.local'da var olup
 * olmadığına bakmakla yetinmez).
 */
export async function POST(req: NextRequest) {
  const { service } = (await req.json()) as { service: "gemini" | "openWeather" | "agromonitoring" };

  try {
    if (service === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return NextResponse.json({ ok: false, message: "GEMINI_API_KEY tanımlı değil." });
      const result = await callGemini(apiKey, {
        contents: [{ role: "user", parts: [{ text: "Sadece 'OK' yaz." }] }],
        maxOutputTokens: 10,
      });
      return NextResponse.json({ ok: true, message: `Bağlantı başarılı (model: ${result.modelUsed})` });
    }

    if (service === "openWeather") {
      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) return NextResponse.json({ ok: false, message: "OPENWEATHER_API_KEY tanımlı değil." });
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=39.77&lon=30.52&appid=${apiKey}`
      );
      if (!res.ok) {
        const body = await res.text();
        return NextResponse.json({ ok: false, message: `API hatası (${res.status}): ${body.slice(0, 150)}` });
      }
      return NextResponse.json({ ok: true, message: "Bağlantı başarılı." });
    }

    if (service === "agromonitoring") {
      const apiKey = process.env.AGROMONITORING_API_KEY;
      if (!apiKey) return NextResponse.json({ ok: false, message: "AGROMONITORING_API_KEY tanımlı değil." });
      const res = await fetch(`https://api.agromonitoring.com/agro/1.0/polygons?appid=${apiKey}`);
      if (!res.ok) {
        const body = await res.text();
        return NextResponse.json({ ok: false, message: `API hatası (${res.status}): ${body.slice(0, 150)}` });
      }
      return NextResponse.json({ ok: true, message: "Bağlantı başarılı." });
    }

    return NextResponse.json({ ok: false, message: "Bilinmeyen servis." });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
