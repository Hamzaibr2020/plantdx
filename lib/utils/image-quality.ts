export interface ImageQualityResult {
  brightness: number; // 0-255
  blurScore: number; // Laplacian varyansı - düşük = bulanık
  greenRatio: number; // 0-1, olası yaprak/bitki oranı
  warnings: string[];
}

/**
 * Görüntü kalitesini gerçek piksel verisinden analiz eder:
 * - Parlaklık: ortalama luminans
 * - Bulanıklık: Laplacian operatörü varyansı (düşük varyans = bulanık görüntü,
 *   klasik bir bilgisayarlı görü tekniği)
 * - Yeşillik oranı: HSV yeşil aralığındaki piksel oranı (yaprak/bitki tahmini)
 */
export function analyzeImageQuality(imageEl: HTMLImageElement): ImageQualityResult {
  const canvas = document.createElement("canvas");
  const SIZE = 160; // performans için küçültülmüş analiz boyutu
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(imageEl, 0, 0, SIZE, SIZE);
  const { data } = ctx.getImageData(0, 0, SIZE, SIZE);

  const gray = new Float32Array(SIZE * SIZE);
  let brightnessSum = 0;
  let greenCount = 0;

  for (let i = 0; i < SIZE * SIZE; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    gray[i] = lum;
    brightnessSum += lum;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const hue = computeHue(r, g, b, max, min);
    const sat = max === 0 ? 0 : (max - min) / max;
    if (hue >= 60 && hue <= 170 && sat > 0.15) greenCount++;
  }

  const brightness = brightnessSum / (SIZE * SIZE);

  // Laplacian varyansı (basit 3x3 kernel: [[0,1,0],[1,-4,1],[0,1,0]])
  let lapSum = 0;
  let lapSqSum = 0;
  let count = 0;
  for (let y = 1; y < SIZE - 1; y++) {
    for (let x = 1; x < SIZE - 1; x++) {
      const idx = y * SIZE + x;
      const lap =
        gray[idx - SIZE] + gray[idx + SIZE] + gray[idx - 1] + gray[idx + 1] - 4 * gray[idx];
      lapSum += lap;
      lapSqSum += lap * lap;
      count++;
    }
  }
  const lapMean = lapSum / count;
  const blurScore = lapSqSum / count - lapMean * lapMean;

  const greenRatio = greenCount / (SIZE * SIZE);

  const warnings: string[] = [];
  if (brightness < 60) warnings.push("Görüntü çok karanlık. Daha aydınlık bir ortamda tekrar çekin.");
  if (brightness > 220) warnings.push("Görüntü aşırı parlak/aşırı pozlanmış olabilir.");
  if (blurScore < 80) warnings.push("Görüntü bulanık görünüyor. Kamerayı sabit tutup tekrar deneyin.");
  if (greenRatio < 0.08) warnings.push("Kadrajda yeterli bitki/yaprak yüzeyi görünmüyor.");

  return { brightness: Math.round(brightness), blurScore: Math.round(blurScore), greenRatio, warnings };
}

function computeHue(r: number, g: number, b: number, max: number, min: number): number {
  if (max === min) return 0;
  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}
