import { NextRequest, NextResponse } from "next/server";
import { callGemini, GeminiError } from "@/lib/api/gemini-client";
import { ARTICLES } from "@/data/articles";

const SYSTEM_PROMPT = `Sen PlantDX Bilgi Merkezi'nin Türkçe tarım bilgi asistanısın. Kullanıcıların
tarım/bahçecilik sorularını, verilen makale bağlamını önceliklendirerek ama gerekirse kendi genel
bilginle de destekleyerek yanıtla. Kısa, net ve uygulanabilir cevaplar ver (en fazla 4-5 cümle).
Eğer verilen makale bağlamı soruyla doğrudan ilgiliyse, buna dayandığını belirt. İlgisizse genel
tarımsal bilgini kullan ama uydurma teknik detay verme, emin olmadığında belirt.`;

/** Basit anahtar kelime tabanlı ilgili makale bulma (embedding olmadan hafif bir RAG) */
function findRelevantArticles(query: string, limit = 3) {
  const q = query.toLowerCase();
  const scored = ARTICLES.map((a) => {
    let score = 0;
    const haystack = (a.title + " " + a.tags.join(" ") + " " + a.content).toLowerCase();
    for (const word of q.split(/\s+/)) {
      if (word.length > 2 && haystack.includes(word)) score++;
    }
    return { article: a, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.article);
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY tanımlı değil." }, { status: 500 });

  try {
    const { question } = (await req.json()) as { question: string };
    if (!question?.trim()) return NextResponse.json({ error: "question gerekli." }, { status: 400 });

    const relevant = findRelevantArticles(question);
    const contextBlock = relevant.length
      ? relevant.map((a) => `## ${a.title}\n${a.content.slice(0, 1200)}`).join("\n\n")
      : "İlgili makale bulunamadı.";

    const prompt = `MAKALE BAĞLAMI:\n${contextBlock}\n\nSORU: ${question}`;

    const result = await callGemini(apiKey, {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.4,
      maxOutputTokens: 500,
    });

    return NextResponse.json({
      answer: result.text,
      relatedArticles: relevant.map((a) => ({ id: a.id, title: a.title })),
    });
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
