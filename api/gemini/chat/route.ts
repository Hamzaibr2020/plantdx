import { NextRequest, NextResponse } from "next/server";
import { callGemini, GeminiError, GeminiMessage } from "@/lib/api/gemini-client";

const BASE_SYSTEM_PROMPT = `Sen PlantDX uygulamasının Türkçe konuşan, uzman bir ziraat mühendisi kimliğindeki
yapay zeka asistanısın. Adın "PlantDX AI". Uzmanlık alanların:
- Bitki hastalığı teşhis ve tedavisi (fungal, bakteriyel, viral, zararlı kaynaklı)
- Gübreleme, sulama, toprak sağlığı, pH yönetimi
- Organik ve kimyasal mücadele yöntemleri, doz hesaplama mantığı
- Sera/açık alan/saksı bitkisi yetiştirme teknikleri
- Hava koşullarının bitki sağlığına etkisi
- Türkiye'nin farklı bölgelerine özgü iklim ve toprak koşulları

Davranış kuralların:
1. Emin olmadığın teşhisleri kesinmiş gibi sunma; olasılık/belirsizlik belirt ("büyük ihtimalle",
   "kesin teşhis için fotoğraf çekmeni öneririm" gibi).
2. Kimyasal doz önerirken her zaman ürün etiketindeki resmi talimatın esas olduğunu hatırlat.
3. Cevapların kısa, net, madde madde ve uygulanabilir olsun — gereksiz uzatma, akademik dil kullanma.
4. Kullanıcının bahçesi/bitkileri/konumu hakkında sana context olarak verilen bilgileri MUTLAKA
   dikkate al ve cevabını buna göre kişiselleştir (örn: "Eskişehir'de bu mevsimde..." gibi).
5. Kullanıcı bir hastalık/zararlı sorduğunda, mümkünse şu sırayla yanıtla: (a) olası teşhis,
   (b) hemen yapılması gerekenler, (c) organik ve kimyasal seçenekler, (d) önleme.
6. Eğer soru bitkiyle/tarımla hiç alakasız ise, kibarca konunun dışında olduğunu belirt ve
   tarım/bahçecilikle ilgili nasıl yardımcı olabileceğini sor.
8. Kullanıcı sohbete bir bitki/yaprak fotoğrafı eklerse, gerçek bir fitopatolog gibi görüntüyü
   analiz et: olası hastalık/zararlı/besin eksikliği belirtilerini tarif et ve tedavi öner. Emin
   değilsen "AI Kamera" modülünden daha detaylı analiz önerebilirsin.
9. Yanıtının EN SONUNA, kullanıcının sorabileceği 2-3 kısa takip sorusu ekle. Bunları TAM OLARAK
   şu formatta, ayrı bir satırda ver: "SORULAR: soru1 | soru2 | soru3"
   Bu satır kullanıcıya gösterilmeyecek, arayüz tarafından ayrıştırılacak; bu yüzden formatı bozma.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY tanımlı değil. .env.local dosyanı kontrol et." },
      { status: 500 }
    );
  }

  try {
    const { messages, context } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string; imageBase64?: string; mimeType?: string }[];
      context?: {
        province?: string;
        plants?: { name: string; category: string; species?: string | null }[];
        recentDiagnoses?: { diseaseNameTr: string; isHealthy: boolean; createdAt: string }[];
        season?: string;
      };
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages alanı boş olamaz." }, { status: 400 });
    }

    let systemInstruction = BASE_SYSTEM_PROMPT;
    if (context) {
      const parts: string[] = [];
      if (context.province) parts.push(`Kullanıcının konumu: ${context.province}.`);
      if (context.season) parts.push(`Şu anki mevsim: ${context.season}.`);
      if (context.plants?.length) {
        parts.push(
          `Kullanıcının bahçesindeki bitkiler: ${context.plants
            .map((p) => `${p.name} (${p.category}${p.species ? ", " + p.species : ""})`)
            .join(", ")}.`
        );
      }
      if (context.recentDiagnoses?.length) {
        parts.push(
          `Son teşhisler: ${context.recentDiagnoses
            .slice(0, 5)
            .map((d) => (d.isHealthy ? "Sağlıklı" : d.diseaseNameTr))
            .join(", ")}.`
        );
      }
      if (parts.length) {
        systemInstruction += `\n\nKULLANICI BAĞLAMI (cevabını buna göre kişiselleştir):\n${parts.join("\n")}`;
      }
    }

    const contents: GeminiMessage[] = messages.map((m) => {
      const parts: GeminiMessage["parts"] = [{ text: m.content }];
      if (m.imageBase64) {
        parts.push({ inline_data: { mime_type: m.mimeType || "image/jpeg", data: m.imageBase64 } });
      }
      return { role: m.role === "assistant" ? "model" : "user", parts };
    });

    const result = await callGemini(apiKey, {
      contents,
      systemInstruction,
      temperature: 0.65,
      maxOutputTokens: 1200,
    });

    // "SORULAR: ..." satırını ayrıştır ve cevaptan çıkar
    let replyText = result.text;
    let suggestions: string[] = [];
    const suggestionMatch = replyText.match(/\n?SORULAR:\s*(.+)$/i);
    if (suggestionMatch) {
      suggestions = suggestionMatch[1].split("|").map((s) => s.trim()).filter(Boolean).slice(0, 3);
      replyText = replyText.slice(0, suggestionMatch.index).trim();
    }

    return NextResponse.json({ reply: replyText, suggestions, modelUsed: result.modelUsed });
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
