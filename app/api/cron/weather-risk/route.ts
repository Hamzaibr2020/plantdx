import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/db/server-db";
import { sendPushToUser } from "@/lib/api/push-service";
import { TURKEY_PROVINCES } from "@/data/turkey-provinces";

/**
 * Her 6 saatte bir tetiklenir (bkz. vercel.json crons). "notifyWeatherAlerts"
 * açık olan kullanıcıların ili için gerçek OpenWeatherMap verisiyle risk kontrolü
 * yapar, "tehlike" seviyesinde uyarı varsa push bildirimi gönderir.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const weatherKey = process.env.OPENWEATHER_API_KEY;
  if (!weatherKey) return NextResponse.json({ error: "OPENWEATHER_API_KEY tanımlı değil." }, { status: 500 });

  const db = await getServerDb();
  const eligibleUsers = db.data.users.filter((u) => u.notificationPrefs?.notifyWeatherAlerts);

  const results: { username: string; sent: boolean }[] = [];

  // Aynı il için tekrar tekrar hava durumu çekmemek için önbellekle
  const provinceAlertCache = new Map<string, { level: string; message: string }[]>();

  for (const user of eligibleUsers) {
    const province = user.notificationPrefs!.province;
    const coords = TURKEY_PROVINCES.find((p) => p.name === province);
    if (!coords) continue;

    if (!provinceAlertCache.has(province)) {
      try {
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lon}&units=metric&lang=tr&appid=${weatherKey}`
        );
        const data = await res.json();
        const temp = data.main?.temp;
        const wind = data.wind?.speed;
        const humidity = data.main?.humidity;
        const alerts: { level: string; message: string }[] = [];
        if (temp <= 2) alerts.push({ level: "tehlike", message: `${province}: Don riski! Hassas bitkileri koruyun.` });
        if (temp >= 35) alerts.push({ level: "uyarı", message: `${province}: Aşırı sıcak, sulamayı artırın.` });
        if (wind >= 10) alerts.push({ level: "uyarı", message: `${province}: Kuvvetli rüzgar bekleniyor.` });
        if (humidity >= 85 && temp >= 15 && temp <= 27)
          alerts.push({ level: "uyarı", message: `${province}: Yüksek nem, mantar hastalığı riski.` });
        provinceAlertCache.set(province, alerts);
      } catch {
        provinceAlertCache.set(province, []);
      }
    }

    const alerts = provinceAlertCache.get(province) ?? [];
    const critical = alerts.find((a) => a.level === "tehlike") ?? alerts[0];

    if (critical) {
      await sendPushToUser(user.username, {
        title: "Hava Riski Uyarısı ⚠️",
        body: critical.message,
        url: "/hava-durumu",
      });
      results.push({ username: user.username, sent: true });
    } else {
      results.push({ username: user.username, sent: false });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
