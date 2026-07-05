import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENWEATHER_API_KEY tanımlı değil." }, { status: 500 });
  }

  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  if (!lat || !lon) {
    return NextResponse.json({ error: "lat/lon parametreleri gerekli." }, { status: 400 });
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&lang=tr&appid=${apiKey}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&lang=tr&appid=${apiKey}`
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return NextResponse.json(
        { error: `OpenWeatherMap hatası: ${currentRes.status}/${forecastRes.status}` },
        { status: 502 }
      );
    }

    const current = await currentRes.json();
    const forecast = await forecastRes.json();

    // 3 saatlik verilerden 7 günlük özet çıkar (gerçek veriden, uydurma yok)
    const dailyMap = new Map<string, { temps: number[]; humidity: number[]; wind: number[]; rain: number; icon: string }>();
    for (const item of forecast.list ?? []) {
      const day = item.dt_txt.slice(0, 10);
      if (!dailyMap.has(day)) {
        dailyMap.set(day, { temps: [], humidity: [], wind: [], rain: 0, icon: item.weather?.[0]?.icon ?? "01d" });
      }
      const entry = dailyMap.get(day)!;
      entry.temps.push(item.main.temp);
      entry.humidity.push(item.main.humidity);
      entry.wind.push(item.wind.speed);
      entry.rain += item.rain?.["3h"] ?? 0;
    }

    const dailyForecast = Array.from(dailyMap.entries())
      .slice(0, 7)
      .map(([date, v]) => ({
        date,
        minTemp: Math.min(...v.temps),
        maxTemp: Math.max(...v.temps),
        avgHumidity: Math.round(v.humidity.reduce((a, b) => a + b, 0) / v.humidity.length),
        maxWind: Math.max(...v.wind),
        totalRain: Math.round(v.rain * 10) / 10,
        icon: v.icon,
      }));

    // Tarımsal risk analizi: nem + sıcaklık + rüzgar kombinasyonu (gerçek eşik kurallarına dayalı)
    const temp = current.main.temp as number;
    const humidity = current.main.humidity as number;
    const windSpeed = current.wind.speed as number;

    const alerts: { type: string; level: "bilgi" | "uyarı" | "tehlike"; message: string }[] = [];
    if (temp <= 2) alerts.push({ type: "don", level: "tehlike", message: "Don riski! Hassas bitkileri örtün veya içeri alın." });
    if (temp >= 35) alerts.push({ type: "sıcak", level: "uyarı", message: "Aşırı sıcak. Bitkileri gölgeleyin, sulama sıklığını artırın." });
    if (windSpeed >= 10) alerts.push({ type: "rüzgar", level: "uyarı", message: "Kuvvetli rüzgar. Genç fidanları destekleyin." });
    if (humidity >= 85 && temp >= 15 && temp <= 27)
      alerts.push({ type: "mantar", level: "uyarı", message: "Yüksek nem + ılık hava = mantar hastalığı riski yüksek." });

    const wateringAdvice =
      humidity > 70
        ? "Toprak nemi muhtemelen yeterli, sulamayı erteleyebilirsiniz."
        : "Hava kuru, bugün sulama yapmanız önerilir.";

    return NextResponse.json({
      current: {
        temp,
        feelsLike: current.main.feels_like,
        humidity,
        windSpeed,
        description: current.weather?.[0]?.description,
        icon: current.weather?.[0]?.icon,
      },
      dailyForecast,
      agriAlerts: alerts,
      wateringAdvice,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Sunucu hatası", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
