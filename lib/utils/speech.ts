/**
 * Web Speech API sarmalayıcı fonksiyonlar. Tarayıcı desteği cihaza göre değişir
 * (Chrome/Edge iyi destekler, Firefox SpeechRecognition'ı desteklemez — bu durumda
 * dürüstçe "desteklenmiyor" durumu döndürülür, sahte/simüle bir tanıma yapılmaz).
 */

type SpeechRecognitionInstance = InstanceType<typeof window.SpeechRecognition>;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface VoiceRecognitionHandle {
  stop: () => void;
}

export function startVoiceRecognition(options: {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}): VoiceRecognitionHandle | null {
  if (!isSpeechRecognitionSupported()) {
    options.onError("Bu tarayıcı sesli komutu desteklemiyor. Chrome veya Edge kullanmayı deneyebilirsin.");
    return null;
  }

  const SpeechRecognitionCtor =
    window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition: typeof window.SpeechRecognition }).webkitSpeechRecognition;

  const recognition: SpeechRecognitionInstance = new SpeechRecognitionCtor();
  recognition.lang = "tr-TR";
  recognition.continuous = false;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let transcript = "";
    let isFinal = false;
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
      if (event.results[i].isFinal) isFinal = true;
    }
    options.onResult(transcript, isFinal);
  };

  recognition.onerror = (event) => {
    const messages: Record<string, string> = {
      "no-speech": "Ses algılanamadı, tekrar dener misin?",
      "not-allowed": "Mikrofon izni reddedildi. Tarayıcı ayarlarından izin vermen gerekiyor.",
      "audio-capture": "Mikrofon bulunamadı.",
    };
    options.onError(messages[event.error] ?? `Ses tanıma hatası: ${event.error}`);
  };

  recognition.onend = () => options.onEnd();

  try {
    recognition.start();
  } catch {
    options.onError("Ses tanıma başlatılamadı.");
    return null;
  }

  return { stop: () => recognition.stop() };
}

export function speak(text: string, onEnd?: () => void): void {
  if (!isSpeechSynthesisSupported()) return;
  window.speechSynthesis.cancel(); // önceki konuşmayı kes
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "tr-TR";
  utterance.rate = 1.0;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (isSpeechSynthesisSupported()) window.speechSynthesis.cancel();
}
