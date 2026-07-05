import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON, GeminiError } from "@/lib/api/gemini-client";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    tasks: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          type: {
            type: "STRING",
            enum: ["Sulama", "Gübreleme", "İlaçlama", "Budama", "Hasat", "Saksı Değişimi", "Kontrol"],
          },
          title: { type: "STRING" },
          dueOffsetDays: { type: "INTEGER" },
          priority: { type: "STRING", enum: ["Normal", "Yüksek", "Acil"] },
          isRecurring: { type: "BOOLEAN" },
          recurrenceDays: { type: "INTEGER" },
        },
        required: ["type", "title", "dueOffsetDays", "priority", "isRecurring", "recurrenceDays"],
      },
    },
    planSummary: { type: "STRING" },
  },
  required: ["tasks", "planSummary"],
};

/**
 * Belirli bir bitki için sıfırdan, o türe ve mevsime özgü gerçekçi bir bakım takvimi üretir.
 * Örn: "Domates" + "Yaz" -> sulama sıklığı, gübreleme zamanlaması, budama/koltuk alma,
 * hasat tahmini gibi gerçek tarımsal pratiklere dayalı görevler.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY tanımlı değil." }, { status: 500 });

  try {
    const { plantName, category, species, season, province } = (await req.json()) as {
      plantName: string;
      category: string;
      species?: string;
      season: string;
      province: string;
    };

    if (!plantName?.trim()) return NextResponse.json({ error: "plantName gerekli." }, { status: 400 });

    const prompt = `Sen bir ziraat mühendisisin. "${plantName}" (${category}${species ? ", " + species : ""})
bitkisi için ${province} ilinde, ${season} mevsiminde başlayacak, önümüzdeki 60 gün için gerçekçi bir
bakım takvimi hazırla.

Kurallar:
- dueOffsetDays: bugünden itibaren kaç gün sonra yapılması gerektiği (0 = bugün).
- Sulama, gübreleme gibi tekrarlayan görevler için isRecurring=true ve recurrenceDays belirt
  (örn: domates yazın 2-3 günde bir sulanır -> recurrenceDays: 3).
- Tek seferlik görevler (ilk gübreleme, budama, saksı değişimi) için isRecurring=false, recurrenceDays: 0.
- En fazla 8 görev üret, gerçekten o bitki türüne özgü ve o mevsime uygun olsun.
- planSummary: 1 cümlelik, planın mantığını özetleyen Türkçe açıklama.
- Tüm başlıklar (title) kısa ve Türkçe olsun (örn: "Derinlemesine sulama", "İlk azotlu gübreleme").`;

    const result = await callGeminiJSON<{ tasks: unknown[]; planSummary: string }>(apiKey, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      temperature: 0.4,
      maxOutputTokens: 1200,
      jsonSchema: RESPONSE_SCHEMA,
    });

    return NextResponse.json(result);
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
