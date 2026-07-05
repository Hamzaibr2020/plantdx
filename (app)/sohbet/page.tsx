"use client";

import { useState, useRef, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db/schema";
import { grantXp } from "@/lib/utils/gamification";
import { useSettings } from "@/lib/context/settings-context";
import TopBar from "@/components/layout/TopBar";
import { Send, Trash2, Loader2, Bot, User, ImagePlus, X, AlertTriangle, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { startVoiceRecognition, speak, stopSpeaking, isSpeechRecognitionSupported, isSpeechSynthesisSupported, VoiceRecognitionHandle } from "@/lib/utils/speech";

const QUICK_TEMPLATES = [
  "Domateslerimde sararma var, ne yapmalıyım?",
  "Organik gübre nasıl hazırlarım?",
  "Bu hafta hangi bitkileri sulamalıyım?",
  "Kırmızı örümcek ile nasıl mücadele ederim?",
];

function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "İlkbahar";
  if (m >= 6 && m <= 8) return "Yaz";
  if (m >= 9 && m <= 11) return "Sonbahar";
  return "Kış";
}

export default function SohbetPage() {
  const messages = useLiveQuery(() => db.chatMessages.orderBy("createdAt").toArray(), []) ?? [];
  const plants = useLiveQuery(() => db.plants.toArray(), []) ?? [];
  const recentDiagnoses = useLiveQuery(() => db.diagnoses.orderBy("createdAt").reverse().limit(5).toArray(), []) ?? [];
  const { settings } = useSettings();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<{ dataUrl: string; base64: string; mimeType: string } | null>(null);
  const [lastSuggestions, setLastSuggestions] = useState<string[]>([]);
  const [listening, setListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const recognitionRef = useRef<VoiceRecognitionHandle | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    setVoiceError(null);
    setListening(true);
    recognitionRef.current = startVoiceRecognition({
      onResult: (transcript) => setInput(transcript),
      onError: (message) => {
        setVoiceError(message);
        setListening(false);
      },
      onEnd: () => setListening(false),
    });
  }

  function toggleSpeak(messageId: number, text: string) {
    if (speakingId === messageId) {
      stopSpeaking();
      setSpeakingId(null);
      return;
    }
    setSpeakingId(messageId);
    speak(text, () => setSpeakingId(null));
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    setLastSuggestions(last?.role === "assistant" ? last.suggestions ?? [] : []);
    if (settings.voiceMode && last?.role === "assistant" && last.id) {
      setSpeakingId(last.id);
      speak(last.content, () => setSpeakingId(null));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setAttachedImage({ dataUrl, base64: dataUrl.split(",")[1], mimeType: file.type || "image/jpeg" });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function send(text: string) {
    const image = attachedImage;
    if ((!text.trim() && !image) || sending) return;
    setError(null);
    setInput("");
    setAttachedImage(null);
    setLastSuggestions([]);

    await db.chatMessages.add({
      role: "user",
      content: text.trim() || "(fotoğraf gönderildi)",
      imageDataUrl: image?.dataUrl ?? null,
      createdAt: new Date().toISOString(),
    });
    await grantXp(3);
    setSending(true);

    try {
      const allMessages = await db.chatMessages.orderBy("createdAt").toArray();
      const history = allMessages.map((m, i) => ({
        role: m.role,
        content: m.content,
        // Sadece en son mesajın görselini gönderiyoruz (token/maliyet tasarrufu);
        // geçmiş fotoğraflar için model zaten metin özetiyle bağlamı korur.
        ...(i === allMessages.length - 1 && image ? { imageBase64: image.base64, mimeType: image.mimeType } : {}),
      }));

      const res = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          context: {
            province: settings.province,
            season: getSeason(),
            plants: plants.map((p) => ({ name: p.name, category: p.category, species: p.species })),
            recentDiagnoses: recentDiagnoses.map((d) => ({
              diseaseNameTr: d.diseaseNameTr,
              isHealthy: d.isHealthy,
              createdAt: d.createdAt,
            })),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yanıt alınamadı.");
      await db.chatMessages.add({
        role: "assistant",
        content: data.reply,
        suggestions: data.suggestions ?? [],
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  async function clearHistory() {
    if (!confirm("Sohbet geçmişi silinsin mi?")) return;
    await db.chatMessages.clear();
  }

  return (
    <div className="page-enter flex flex-col h-[calc(100vh-56px)] md:h-screen">
      <TopBar title="AI Sohbet Asistanı" />

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 max-w-2xl w-full mx-auto">
        {messages.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Bot size={36} className="text-brand-green-400" />
            <p className="text-sm text-foreground/50">
              Tarım uzmanı AI asistanına her şeyi sorabilir, bir bitki fotoğrafı da gönderebilirsin.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-xs">
              {QUICK_TEMPLATES.map((t) => (
                <button
                  key={t}
                  onClick={() => send(t)}
                  className="text-xs text-left px-3 py-2 rounded-xl bg-brand-green-50 dark:bg-white/5 text-brand-green-700 dark:text-brand-green-400"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-7 h-7 rounded-full bg-brand-green-600 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                m.role === "user" ? "bg-brand-green-600 text-white rounded-br-sm" : "solid-card rounded-bl-sm"
              }`}
            >
              {m.imageDataUrl && (
                <img src={m.imageDataUrl} alt="" className="w-40 h-40 object-cover rounded-xl mb-2" />
              )}
              {m.content}
              {m.role === "assistant" && isSpeechSynthesisSupported() && (
                <button
                  onClick={() => toggleSpeak(m.id!, m.content)}
                  className="ml-2 inline-flex align-middle text-foreground/30 hover:text-brand-green-600"
                >
                  {speakingId === m.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                </button>
              )}
            </div>
            {m.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-black/10 dark:bg-white/10 flex items-center justify-center shrink-0">
                <User size={14} />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-full bg-brand-green-600 flex items-center justify-center">
              <Bot size={14} className="text-white" />
            </div>
            <div className="solid-card px-3.5 py-2.5 rounded-2xl rounded-bl-sm flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30 animate-bounce" />
            </div>
          </div>
        )}

        {!sending && lastSuggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 pl-9">
            {lastSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs px-3 py-1.5 rounded-full border border-brand-green-500/30 text-brand-green-700 dark:text-brand-green-400"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-danger-500 bg-danger-500/10 rounded-xl p-3 mx-auto max-w-md">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t border-black/5 dark:border-white/5 flex flex-col gap-2 max-w-2xl w-full mx-auto">
        {attachedImage && (
          <div className="relative w-16 h-16">
            <img src={attachedImage.dataUrl} className="w-16 h-16 object-cover rounded-lg" alt="" />
            <button
              onClick={() => setAttachedImage(null)}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center"
            >
              <X size={11} />
            </button>
          </div>
        )}
        {voiceError && <p className="text-[11px] text-danger-500 px-1">{voiceError}</p>}
        <div className="flex items-center gap-2">
          <button onClick={clearHistory} className="p-2.5 rounded-xl text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5 shrink-0">
            <Trash2 size={16} />
          </button>
          <label className="p-2.5 rounded-xl text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5 shrink-0 cursor-pointer">
            <ImagePlus size={16} />
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAttach} />
          </label>
          {isSpeechRecognitionSupported() && (
            <button
              onClick={toggleListening}
              className={`p-2.5 rounded-xl shrink-0 ${listening ? "bg-danger-500 text-white animate-pulse" : "text-foreground/40 hover:bg-black/5 dark:hover:bg-white/5"}`}
            >
              {listening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send(input)}
            placeholder={listening ? "Dinleniyor..." : "Bir soru sor veya fotoğraf ekle..."}
            className="flex-1 rounded-full border border-black/10 dark:border-white/10 bg-transparent px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-green-500"
          />
          <button
            onClick={() => send(input)}
            disabled={sending || (!input.trim() && !attachedImage)}
            className="w-10 h-10 rounded-full bg-brand-green-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
