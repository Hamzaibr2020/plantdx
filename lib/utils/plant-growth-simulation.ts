/**
 * PlantDX Bitki Gelişim Simülasyonu
 * ===================================
 * Bir bitkinin bakım kalitesine ve türüne göre zaman içindeki büyüme eğrisini
 * modelleyen eğitici bir araç. Lojistik büyüme fonksiyonuna dayanır — popülasyon/
 * biyokütle büyümesini modellemek için agronomi ve ekolojide standart olarak
 * kullanılan gerçek bir matematiksel modeldir:
 *
 *   size(t) = K / (1 + e^(-r * (t - t_mid)))
 *
 * K = ulaşılabilir maksimum büyüklük (bakım kalitesine göre ölçeklenir)
 * r = büyüme hızı katsayısı (tür + bakım kalitesine göre)
 * t_mid = büyümenin en hızlı olduğu gün (enfleksiyon noktası)
 *
 * DÜRÜSTLÜK NOTU: Katsayılar gerçek saha ölçümleriyle kalibre edilmiş kesin
 * değerler değildir; türe göre BÜYÜKLÜK MERTEBESİ doğru olacak şekilde
 * ayarlanmış eğitici/gösterge amaçlı bir modeldir.
 */

export type GrowthCategory = "Sebze" | "Meyve" | "Çiçek" | "Süs Bitkisi" | "Ağaç" | "Diğer";

export interface SpeciesProfile {
  label: string;
  daysToMaturity: number; // hasat/olgunluğa ulaşma süresi (gün)
  baseGrowthRate: number; // r katsayısı temel değeri
  stages: { name: string; atPercent: number }[]; // büyüme yüzdesine göre evreler
}

export const SPECIES_PROFILES: Record<GrowthCategory, SpeciesProfile> = {
  Sebze: {
    label: "Sebze (örn. domates, biber)",
    daysToMaturity: 80,
    baseGrowthRate: 0.09,
    stages: [
      { name: "Çimlenme", atPercent: 0 },
      { name: "Fide", atPercent: 10 },
      { name: "Vejetatif Gelişim", atPercent: 30 },
      { name: "Çiçeklenme", atPercent: 60 },
      { name: "Meyve Tutumu", atPercent: 80 },
      { name: "Hasat Olgunluğu", atPercent: 95 },
    ],
  },
  Çiçek: {
    label: "Çiçek",
    daysToMaturity: 60,
    baseGrowthRate: 0.11,
    stages: [
      { name: "Çimlenme", atPercent: 0 },
      { name: "Fide", atPercent: 15 },
      { name: "Vejetatif Gelişim", atPercent: 40 },
      { name: "Tomurcuklanma", atPercent: 70 },
      { name: "Tam Çiçeklenme", atPercent: 90 },
    ],
  },
  "Süs Bitkisi": {
    label: "Süs Bitkisi",
    daysToMaturity: 120,
    baseGrowthRate: 0.06,
    stages: [
      { name: "Kök Tutma", atPercent: 0 },
      { name: "Genç Bitki", atPercent: 20 },
      { name: "Vejetatif Gelişim", atPercent: 50 },
      { name: "Olgun Form", atPercent: 90 },
    ],
  },
  Ağaç: {
    label: "Ağaç (ilk yıl gelişimi)",
    daysToMaturity: 365,
    baseGrowthRate: 0.025,
    stages: [
      { name: "Fidan Tutma", atPercent: 0 },
      { name: "Kök Gelişimi", atPercent: 15 },
      { name: "Gövde/Dal Gelişimi", atPercent: 40 },
      { name: "İlk Yaprak Doygunluğu", atPercent: 75 },
      { name: "Kış Dinlenmesine Hazır", atPercent: 95 },
    ],
  },
  Meyve: {
    label: "Meyve (fide/genç bitki)",
    daysToMaturity: 150,
    baseGrowthRate: 0.045,
    stages: [
      { name: "Çimlenme", atPercent: 0 },
      { name: "Fide", atPercent: 12 },
      { name: "Vejetatif Gelişim", atPercent: 35 },
      { name: "Çiçeklenme", atPercent: 65 },
      { name: "Meyve Gelişimi", atPercent: 85 },
      { name: "Hasat Olgunluğu", atPercent: 97 },
    ],
  },
  Diğer: {
    label: "Genel Bitki",
    daysToMaturity: 90,
    baseGrowthRate: 0.07,
    stages: [
      { name: "Çimlenme", atPercent: 0 },
      { name: "Genç Bitki", atPercent: 20 },
      { name: "Vejetatif Gelişim", atPercent: 50 },
      { name: "Olgunluk", atPercent: 90 },
    ],
  },
};

export interface CareQuality {
  wateringConsistency: number; // 0-100
  fertilizingConsistency: number; // 0-100
  climateSuitability: number; // 0-100 (sıcaklık/ışık uygunluğu)
}

export interface GrowthPoint {
  day: number;
  sizePercent: number; // 0-100, K'ye göre normalize
  stage: string;
}

/** Bakım kalitesi ortalamasından K (ulaşılabilir maksimum) ve r (hız) çarpanı hesaplar. */
function careQualityMultipliers(care: CareQuality): { kFactor: number; rFactor: number } {
  const avg = (care.wateringConsistency + care.fertilizingConsistency + care.climateSuitability) / 3;
  // Kötü bakım hem ulaşılabilir maksimum büyüklüğü hem de büyüme hızını düşürür
  const kFactor = 0.4 + (avg / 100) * 0.6; // %40 (çok kötü bakım) - %100 (mükemmel bakım)
  const rFactor = 0.5 + (avg / 100) * 0.9; // büyüme hızı çarpanı
  return { kFactor, rFactor };
}

export function simulateGrowth(
  category: GrowthCategory,
  care: CareQuality,
  totalDays: number
): { points: GrowthPoint[]; profile: SpeciesProfile } {
  const profile = SPECIES_PROFILES[category];
  const { kFactor, rFactor } = careQualityMultipliers(care);

  const K = 100 * kFactor; // ulaşılabilir maksimum yüzde
  const r = profile.baseGrowthRate * rFactor;
  const tMid = profile.daysToMaturity * 0.45; // enfleksiyon noktası (hızlı büyüme dönemi)

  const points: GrowthPoint[] = [];
  for (let day = 0; day <= totalDays; day++) {
    const raw = K / (1 + Math.exp(-r * (day - tMid)));
    const sizePercent = Math.min(100, Math.round(raw * 10) / 10);

    let stage = profile.stages[0].name;
    for (const s of profile.stages) {
      if (sizePercent >= s.atPercent) stage = s.name;
    }

    points.push({ day, sizePercent, stage });
  }

  return { points, profile };
}

/** Kullanıcının gerçek bitki kayıtlarından (son sulama/gübreleme tarihleri) bakım kalitesi tahmini çıkarır. */
export function estimateCareQualityFromPlant(plant: {
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  lastWateredAt: string | null;
  lastFertilizedAt: string | null;
  createdAt: string;
}): CareQuality {
  const now = Date.now();

  function consistencyScore(lastAt: string | null, intervalDays: number, createdAt: string): number {
    if (!lastAt) return 30; // hiç yapılmamışsa düşük ama sıfır değil (belki yeni eklendi)
    const daysSince = (now - new Date(lastAt).getTime()) / 86400000;
    const overdueRatio = daysSince / intervalDays;
    if (overdueRatio <= 1) return 100;
    if (overdueRatio <= 2) return 70;
    if (overdueRatio <= 3) return 40;
    return 15;
  }

  const watering = consistencyScore(plant.lastWateredAt, plant.wateringIntervalDays, plant.createdAt);
  const fertilizing = consistencyScore(plant.lastFertilizedAt, plant.fertilizingIntervalDays, plant.createdAt);

  return {
    wateringConsistency: watering,
    fertilizingConsistency: fertilizing,
    climateSuitability: 75, // gerçek hava verisiyle sayfa tarafından güncellenebilir
  };
}
