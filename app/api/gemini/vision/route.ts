import { NextRequest, NextResponse } from "next/server";
import { callGeminiJSON, GeminiError } from "@/lib/api/gemini-client";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    isHealthy: { type: "BOOLEAN" },
    diseaseNameTr: { type: "STRING" },
    diseaseClass: { type: "STRING" },
    confidence: { type: "NUMBER" },
    severity: { type: "INTEGER" },
    spreadRisk: { type: "STRING", enum: ["düşük", "orta", "yüksek"] },
    recoverability: { type: "INTEGER" },
    quarantineRecommended: { type: "BOOLEAN" },
    alternatives: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { label: { type: "STRING" }, confidence: { type: "NUMBER" } },
        required: ["label", "confidence"],
      },
    },
    shortExplanationTr: { type: "STRING" },
  },
  required: [
    "isHealthy", "diseaseNameTr", "diseaseClass", "confidence", "severity",
    "spreadRisk", "recoverability", "quarantineRecommended", "alternatives", "shortExplanationTr",
  ],
};

const PROMPT = `Bu bir bitki yaprağı/bitki fotoğrafıdır. Uzman bir fitopatolog gibi analiz et.
Görüntüde bir hastalık, zararlı belirtisi veya besin eksikliği var mı incele. Emin değilsen
confidence değerini düşük tut ve alternatives alanına olası diğer teşhisleri ekle.
Türkçe hastalık adı ver (örn: "Domates Geç Yanıklık"). severity 1 (çok hafif) ile 5 (kritik) arası,
sağlıklıysa severity=1. recoverability 0-100 arası kurtarılabilirlik yüzdesi.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY tanımlı değil. Çevrimiçi analiz kullanılamıyor." },
      { status: 500 }
    );
  }

  try {
    const { imageBase64, mimeType } = (await req.json()) as { imageBase64: string; mimeType: string };
    if (!imageBase64) {
      return NextResponse.json({ error: "Görüntü verisi eksik." }, { status: 400 });
    }

    const result = await callGeminiJSON(apiKey, {
      contents: [
        {
          role: "user",
          parts: [{ text: PROMPT }, { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } }],
        },
      ],
      temperature: 0.2,
      maxOutputTokens: 800,
      jsonSchema: RESPONSE_SCHEMA,
    });

    return NextResponse.json({ result, analyzedAt: new Date().toISOString() });
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
