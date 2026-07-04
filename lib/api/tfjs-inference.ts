import { PLANTVILLAGE_CLASS_LIST, PLANTVILLAGE_CLASSES_TR } from "./disease-labels-tr";

export interface OfflineInferenceResult {
  diseaseClass: string;
  diseaseNameTr: string;
  plant: string;
  isHealthy: boolean;
  confidence: number;
  alternatives: { label: string; confidence: number }[];
}

const MODEL_URL = "/models/plantvillage_web_model/model.json";
const IMG_SIZE = 224;

let cachedModel: import("@tensorflow/tfjs").LayersModel | null = null;
let modelCheckFailed = false;

/**
 * Model dosyasının gerçekten var olup olmadığını kontrol eder.
 * scripts/train_plantvillage_model.py ile eğitilip public/models altına
 * kopyalanmadıysa bu false döner ve arayüz dürüstçe "çevrimdışı analiz yok" gösterir.
 */
export async function isOfflineModelAvailable(): Promise<boolean> {
  if (modelCheckFailed) return false;
  try {
    const res = await fetch(MODEL_URL, { method: "HEAD" });
    return res.ok;
  } catch {
    return false;
  }
}

async function loadModel() {
  if (cachedModel) return cachedModel;
  const tf = await import("@tensorflow/tfjs");
  await import("@tensorflow/tfjs-backend-webgl");
  await tf.ready();
  try {
    cachedModel = await tf.loadLayersModel(MODEL_URL);
    return cachedModel;
  } catch (err) {
    modelCheckFailed = true;
    throw new Error(
      "Çevrimdışı model yüklenemedi. public/models/plantvillage_web_model/ altında model.json bulunamadı. " +
        "scripts/train_plantvillage_model.py ile modeli eğitip dönüştürmen gerekiyor."
    );
  }
}

export async function runOfflineInference(imageElement: HTMLImageElement): Promise<OfflineInferenceResult> {
  const tf = await import("@tensorflow/tfjs");
  const model = await loadModel();

  const tensor = tf.tidy(() => {
    const img = tf.browser.fromPixels(imageElement).resizeBilinear([IMG_SIZE, IMG_SIZE]).toFloat();
    const normalized = img.div(127.5).sub(1); // MobileNetV2 preprocess_input aralığı [-1, 1]
    return normalized.expandDims(0);
  });

  const prediction = model.predict(tensor) as import("@tensorflow/tfjs").Tensor;
  const probabilities = await prediction.data();
  tensor.dispose();
  prediction.dispose();

  const indexed = Array.from(probabilities).map((p, i) => ({ index: i, prob: p }));
  indexed.sort((a, b) => b.prob - a.prob);

  const top = indexed[0];
  const className = PLANTVILLAGE_CLASS_LIST[top.index] ?? "unknown";
  const meta = PLANTVILLAGE_CLASSES_TR[className];

  const alternatives = indexed.slice(1, 5).map((entry) => {
    const cls = PLANTVILLAGE_CLASS_LIST[entry.index];
    const m = PLANTVILLAGE_CLASSES_TR[cls];
    return { label: m?.tr ?? cls, confidence: entry.prob };
  });

  return {
    diseaseClass: className,
    diseaseNameTr: meta?.tr ?? "Bilinmeyen sınıf",
    plant: meta?.plant ?? "Bilinmiyor",
    isHealthy: meta?.healthy ?? false,
    confidence: top.prob,
    alternatives,
  };
}
