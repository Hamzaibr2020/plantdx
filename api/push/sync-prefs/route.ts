import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/db/server-db";
import { randomUUID } from "crypto";

/**
 * Kullanıcının il/ürün/bildirim tercihlerini sunucuya senkronize eder.
 * Zamanlanmış (cron) push bildirimleri bu bilgiyi kullanarak hangi kullanıcıya
 * hangi ile özel tavsiye/uyarı göndereceğini belirler.
 */
export async function POST(req: NextRequest) {
  const { username, province, crops, notifyDailyAdvice, notifyWeatherAlerts } = (await req.json()) as {
    username: string;
    province: string;
    crops: string[];
    notifyDailyAdvice: boolean;
    notifyWeatherAlerts: boolean;
  };

  if (!username) return NextResponse.json({ error: "username gerekli." }, { status: 400 });

  const db = await getServerDb();
  let user = db.data.users.find((u) => u.username === username);
  if (!user) {
    user = { id: randomUUID(), username, credentials: [], reputationScore: 0, expertiseClaim: null };
    db.data.users.push(user);
  }
  user.notificationPrefs = { province, crops, notifyDailyAdvice, notifyWeatherAlerts };
  await db.write();

  return NextResponse.json({ ok: true });
}
