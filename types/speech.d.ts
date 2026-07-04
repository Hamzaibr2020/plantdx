// TypeScript'in lib.dom.d.ts dosyası SpeechRecognitionResult/ResultList/Alternative
// tiplerini içerir ama ana SpeechRecognition arayüzünü ve olay tiplerini İÇERMEZ.
// Burada sadece eksik olan parçalar tanımlanır; mevcut tiplerle çakışmamak için
// SpeechRecognitionResult/ResultList yeniden tanımlanmaz.

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInterface extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface Window {
  SpeechRecognition: { new (): SpeechRecognitionInterface };
  webkitSpeechRecognition?: { new (): SpeechRecognitionInterface };
}
