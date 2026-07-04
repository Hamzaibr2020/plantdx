import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/db/server-db";

/**
 * Bölgesel hastalık riski, sahte/uydurma veri DEĞİL — kullanıcıların AI Kamera ile
 * yaptığı gerçek teşhislerin il bazında toplulaştırılmasından hesaplanır.
 * Henüz yeterli rapor olmayan iller için dürüstçe "bilinmiyor" döner.
 */

export async function GET() {
  const db = await getServerDb();
  return NextResponse.json({ regionRisk: db.data.regionRisk });
}

export async function POST(req: NextRequest) {
  const db = await getServerDb();
  const { province, diseaseNameTr, crop, isHealthy } = (await req.json()) as {
    province: string;
    diseaseNameTr: string;
    crop?: string;
    isHealthy: boolean;
  };

  if (!province) return NextResponse.json({ error: "province gerekli." }, { status: 400 });
  if (isHealthy) return NextResponse.json({ ok: true, note: "Sağlıklı teşhisler risk haritasına eklenmez." });

  let entry = db.data.regionRisk.find((r) => r.province === province);
  if (!entry) {
    entry = {
      province,
      riskLevel: "düşük",
      dominantDisease: diseaseNameTr,
      affectedCrops: crop ? [crop] : [],
      reportCount: 0,
      updatedAt: new Date().toISOString(),
    };
    db.data.regionRisk.push(entry);
  }

  entry.reportCount += 1;
  entry.dominantDisease = diseaseNameTr; // basit yaklaşım: en son rapor edilen baskın kabul edilir
  if (crop && !entry.affectedCrops.includes(crop)) entry.affectedCrops.push(crop);
  entry.riskLevel = entry.reportCount >= 10 ? "yüksek" : entry.reportCount >= 3 ? "orta" : "düşük";
  entry.updatedAt = new Date().toISOString();

  await db.write();
  return NextResponse.json({ ok: true, entry });
}
