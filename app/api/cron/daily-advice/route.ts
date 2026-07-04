import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/db/server-db";
import { sendPushToUser } from "@/lib/api/push-service";
import { callGemini } from "@/lib/api/gemini-client";

/**
 * Her sabah tetiklenir (bkz. vercel.json crons). Bildirim tercihinde
 * "notifyDailyAdvice" açık olan her kullanıcı için Gemini'den kişisel
 * bir tavsiye üretir ve push bildirimi gönderir.
 */
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret") ?? req.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY tanımlı değil." }, { status: 500 });

  const db = await getServerDb();
  const eligibleUsers = db.data.users.filter((u) => u.notificationPrefs?.notifyDailyAdvice);

  const results: { username: string; ok: boolean }[] = [];

  for (const user of eligibleUsers) {
    try {
      const prefs = user.notificationPrefs!;
      const prompt = `${prefs.province} ilinde, ${prefs.crops.join(", ") || "genel"} ürünleri için bugüne özel
      tek cümlelik kısa bir Türkçe tarım tavsiyesi ver. Bildirim metni olarak kullanılacak, kısa tut.`;

      const result = await callGemini(apiKey, {
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        temperature: 0.7,
        maxOutputTokens: 120,
      });

      await sendPushToUser(user.username, {
        title: "Günlük Tarım Tavsiyesi 🌱",
        body: result.text,
        url: "/anasayfa",
      });
      results.push({ username: user.username, ok: true });
    } catch {
      results.push({ username: user.username, ok: false });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
