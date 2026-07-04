import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON, GeminiError } from "@/lib/api/gemini-client";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    chemical: {
      type: "OBJECT",
      properties: {
        activeIngredient: { type: "STRING" },
        exampleProducts: { type: "ARRAY", items: { type: "STRING" } },
        doseLabel: { type: "STRING" },
        applicationIntervalDays: { type: "INTEGER" },
        preHarvestIntervalDays: { type: "INTEGER" },
      },
      required: ["activeIngredient", "exampleProducts", "doseLabel", "applicationIntervalDays", "preHarvestIntervalDays"],
    },
    organic: {
      type: "OBJECT",
      properties: {
        method: { type: "STRING" },
        effectivenessPercent: { type: "INTEGER" },
        applicationIntervalDays: { type: "INTEGER" },
      },
      required: ["method", "effectivenessPercent", "applicationIntervalDays"],
    },
    biologicalControl: { type: "STRING" },
    safetyEquipment: { type: "ARRAY", items: { type: "STRING" } },
    mixingWarnings: { type: "ARRAY", items: { type: "STRING" } },
    wateringAdvice: { type: "STRING" },
    estimatedRecoveryDays: { type: "INTEGER" },
  },
  required: [
    "chemical", "organic", "biologicalControl", "safetyEquipment",
    "mixingWarnings", "wateringAdvice", "estimatedRecoveryDays",
  ],
};

/**
 * Yerel tedavi veritabanında (lib/api/treatment-db.ts) bulunmayan hastalıklar için
 * Gemini'den gerçek zamanlı, yapılandırılmış bir tedavi planı üretir. Statik veritabanı
 * her zaman önceliklidir (daha hızlı ve küratörlü); bu route sadece kapsam dışı kalan
 * hastalıklar için devreye girer.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY tanımlı değil." }, { status: 500 });

  try {
    const { diseaseNameTr, plantName } = (await req.json()) as { diseaseNameTr: string; plantName?: string };
    if (!diseaseNameTr?.trim()) return NextResponse.json({ error: "diseaseNameTr gerekli." }, { status: 400 });

    const prompt = `Sen bir ziraat mühendisisin. "${diseaseNameTr}"${plantName ? ` (bitki: ${plantName})` : ""}
hastalığı/zararlısı için Türkiye'de yaygın kullanılan, gerçekçi bir tedavi planı hazırla.

Kurallar:
- activeIngredient ve exampleProducts alanlarında GERÇEK, Türkiye'de ruhsatlı/bilinen etken madde ve
  ürün isimleri kullan (uydurma isim verme; emin değilsen genel etken madde sınıfını yaz).
- doseLabel formatı MUTLAKA "SAYI-SAYI birim/dekar" şeklinde olsun (örn: "150-200 ml/dekar").
- Eğer bu bir virüs hastalığıysa ve doğrudan kimyasal tedavi yoksa, bunu açıkça belirt
  (activeIngredient: "Doğrudan kimyasal tedavi yoktur" gibi) ve organik/biyolojik önlemlere odaklan.
- estimatedRecoveryDays: düzenli tedavi ile beklenen iyileşme/kontrol süresi (gün). Tedavisi
  olmayan durumlarda 0 yaz.
- biologicalControl alanında varsa gerçek bir doğal düşman/biyopreparat belirt, yoksa dürüstçe
  "sınırlı biyolojik seçenek mevcut" gibi belirt.
- Tüm metinler Türkçe olsun.`;

    const result = await callGeminiJSON(apiKey, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      temperature: 0.3,
      maxOutputTokens: 900,
      jsonSchema: RESPONSE_SCHEMA,
    });

    return NextResponse.json({ treatment: { ...(result as object), diseaseKeyTr: diseaseNameTr, isAiGenerated: true } });
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
