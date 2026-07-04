/**
 * PlantDX Gemini İstemcisi
 * ========================
 * Tüm Gemini çağrıları bu modül üzerinden geçer. Sebebi:
 * - Tek bir yerden model adı yönetimi (Google modelleri sık günceller/kaldırır)
 * - Birincil model kullanılamıyorsa (404/model bulunamadı) otomatik yedek modele geçiş
 * - Geçici hatalarda (429 rate limit, 503 aşırı yük) otomatik yeniden deneme
 * - Tutarlı, anlaşılır hata mesajları (Gemini'nin gerçek hata detayını kullanıcıya taşır)
 *
 * Model tercih sırası: en yeni GA (genel kullanıma açık) stabil modelden başlayıp
 * geriye doğru düşer. Bu sayede hesap/bölge bazlı model kullanılabilirlik farkları
 * uygulamayı kırmaz.
 */

const MODEL_CHAIN = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-2.5-flash-lite"];
const MAX_RETRIES_PER_MODEL = 2;
const RETRY_DELAY_MS = 800;

export interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

export interface GeminiMessage {
  role: "user" | "model";
  parts: GeminiPart[];
}

export interface GeminiCallOptions {
  contents: GeminiMessage[];
  systemInstruction?: string;
  temperature?: number;
  maxOutputTokens?: number;
  jsonMode?: boolean;
  jsonSchema?: object;
}

export interface GeminiCallResult {
  text: string;
  modelUsed: string;
  finishReason?: string;
}

export class GeminiError extends Error {
  status: number;
  detail?: string;
  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function callGemini(apiKey: string, options: GeminiCallOptions): Promise<GeminiCallResult> {
  if (!apiKey) throw new GeminiError("GEMINI_API_KEY tanımlı değil.", 500);

  let lastError: GeminiError | null = null;

  for (const model of MODEL_CHAIN) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const body: Record<string, unknown> = {
          contents: options.contents,
          generationConfig: {
            temperature: options.temperature ?? 0.6,
            maxOutputTokens: options.maxOutputTokens ?? 1024,
            ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
            ...(options.jsonSchema ? { responseSchema: options.jsonSchema } : {}),
          },
        };
        if (options.systemInstruction) {
          body.systemInstruction = { parts: [{ text: options.systemInstruction }] };
        }

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        );

        if (res.status === 404) {
          // Bu model bu hesap/bölgede yok - yedek modele geç
          lastError = new GeminiError(`Model kullanılamıyor: ${model}`, 404);
          break; // bu modeli terk et, sıradaki modele geç
        }

        if (res.status === 429 || res.status === 503) {
          // Geçici hata - kısa bekleme sonrası aynı modeli tekrar dene
          lastError = new GeminiError(`Gemini geçici olarak meşgul (${res.status})`, res.status);
          if (attempt < MAX_RETRIES_PER_MODEL) {
            await sleep(RETRY_DELAY_MS * (attempt + 1));
            continue;
          }
          break;
        }

        if (!res.ok) {
          const errBody = await res.text();
          let detail = errBody;
          try {
            const parsed = JSON.parse(errBody);
            detail = parsed.error?.message ?? errBody;
          } catch {
            /* düz metin hata, olduğu gibi kullan */
          }
          throw new GeminiError(`Gemini API hatası (${res.status})`, res.status, detail);
        }

        const data = await res.json();
        const candidate = data.candidates?.[0];
        const finishReason = candidate?.finishReason;

        if (candidate?.finishReason === "SAFETY" || candidate?.finishReason === "PROHIBITED_CONTENT") {
          throw new GeminiError(
            "İçerik güvenlik filtresine takıldı. Lütfen farklı bir şekilde ifade et.",
            400
          );
        }

        const text = candidate?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ?? "";

        if (!text) {
          const blockReason = data.promptFeedback?.blockReason;
          throw new GeminiError(
            blockReason ? `Gemini yanıtı engellendi: ${blockReason}` : "Gemini'den boş yanıt geldi.",
            502
          );
        }

        return { text, modelUsed: model, finishReason };
      } catch (err) {
        if (err instanceof GeminiError) {
          if (err.status === 404 || err.status === 429 || err.status === 503) {
            lastError = err;
            continue; // yeniden dene veya sıradaki modele geç
          }
          throw err; // gerçek hata (400, 401, 403, safety vb.) - direkt fırlat
        }
        // ağ hatası vb.
        lastError = new GeminiError(
          "Gemini'ye bağlanılamadı.",
          500,
          err instanceof Error ? err.message : String(err)
        );
      }
    }
  }

  throw lastError ?? new GeminiError("Tüm Gemini modelleri başarısız oldu.", 500);
}

/** JSON modunda çağırıp otomatik parse eder. Ayrıştırma başarısızsa anlamlı hata fırlatır. */
export async function callGeminiJSON<T = unknown>(apiKey: string, options: GeminiCallOptions): Promise<T> {
  const result = await callGemini(apiKey, { ...options, jsonMode: true });
  try {
    return JSON.parse(result.text) as T;
  } catch {
    throw new GeminiError("Gemini yanıtı geçerli JSON değildi.", 502, result.text.slice(0, 300));
  }
}
