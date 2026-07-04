/**
 * PlantDX Hastalık Yayılım Simülasyonu
 * ======================================
 * Bir tarla/bahçe ızgarasında hastalığın gün gün nasıl yayılabileceğini gösteren
 * eğitici bir karar-destek aracıdır. SIR (Susceptible-Infected-Recovered) epidemiyolojik
 * modelinin basitleştirilmiş bir bitki hastalığı uyarlamasına dayanır.
 *
 * ÖNEMLİ - DÜRÜSTLÜK NOTU: Buradaki sayısal katsayılar (yayılma olasılığı, iyileşme
 * süresi vb.) gerçek saha verisiyle kalibre edilmiş kesin bilimsel değerler DEĞİLDİR;
 * nem/sıcaklık/tedavi stratejisinin yayılma hızına yönünü ve büyüklük mertebesini
 * göstermek için tasarlanmış EĞİTİCİ/GÖSTERGE amaçlı bir modeldir. Kesin karar için
 * AI Sohbet Asistanı veya bir ziraat mühendisine danışılmalıdır.
 */

export type CellState = "saglikli" | "enfekte" | "iyilesti" | "kayip";

export interface SimCell {
  state: CellState;
  infectedOnDay: number | null;
}

export type TreatmentStrategy = "yok" | "organik" | "kimyasal";

export interface SimulationParams {
  gridSize: number; // NxN
  humidity: number; // 0-100
  temperature: number; // °C
  treatmentStrategy: TreatmentStrategy;
  initialInfectedCount: number;
  totalDays: number;
  seed?: number;
}

export interface SimulationDaySnapshot {
  day: number;
  grid: CellState[][];
  healthyCount: number;
  infectedCount: number;
  recoveredCount: number;
  lostCount: number;
}

const TREATMENT_SPREAD_REDUCTION: Record<TreatmentStrategy, number> = {
  yok: 0,
  organik: 0.4,
  kimyasal: 0.7,
};

const TREATMENT_RECOVERY_CHANCE: Record<TreatmentStrategy, number> = {
  yok: 0.03, // doğal bağışıklık/kendiliğinden iyileşme çok düşük ihtimal
  organik: 0.18,
  kimyasal: 0.32,
};

const TREATMENT_RECOVERY_START_DAY: Record<TreatmentStrategy, number> = {
  yok: 8,
  organik: 5,
  kimyasal: 3,
};

const DAYS_UNTIL_LOSS: Record<TreatmentStrategy, number> = {
  yok: 12,
  organik: 18,
  kimyasal: 25,
};

// Basit, tekrarlanabilir sözde-rastgele sayı üreteci (seed'lenebilir)
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function humidityTempFactor(humidity: number, temperature: number): number {
  // Çoğu fungal patojen için 15-27°C ve yüksek nem en riskli koşuldur (bkz. hava durumu
  // modülündeki mantar riski mantığıyla tutarlı)
  const tempFactor = temperature >= 15 && temperature <= 27 ? 1 : 0.5;
  const humidityFactor = humidity / 100;
  return tempFactor * (0.3 + 0.7 * humidityFactor);
}

export function runSimulation(params: SimulationParams): SimulationDaySnapshot[] {
  const rand = mulberry32(params.seed ?? 42);
  const { gridSize, humidity, temperature, treatmentStrategy, initialInfectedCount, totalDays } = params;

  const grid: SimCell[][] = Array.from({ length: gridSize }, () =>
    Array.from({ length: gridSize }, () => ({ state: "saglikli" as CellState, infectedOnDay: null }))
  );

  // Başlangıç enfeksiyonlarını rastgele yerleştir
  let placed = 0;
  while (placed < initialInfectedCount && placed < gridSize * gridSize) {
    const x = Math.floor(rand() * gridSize);
    const y = Math.floor(rand() * gridSize);
    if (grid[y][x].state === "saglikli") {
      grid[y][x] = { state: "enfekte", infectedOnDay: 0 };
      placed++;
    }
  }

  const envFactor = humidityTempFactor(humidity, temperature);
  const spreadReduction = TREATMENT_SPREAD_REDUCTION[treatmentStrategy];
  const baseSpreadChance = envFactor * 0.55 * (1 - spreadReduction);
  const recoveryChance = TREATMENT_RECOVERY_CHANCE[treatmentStrategy];
  const recoveryStartDay = TREATMENT_RECOVERY_START_DAY[treatmentStrategy];
  const daysUntilLoss = DAYS_UNTIL_LOSS[treatmentStrategy];

  const snapshots: SimulationDaySnapshot[] = [];

  function snapshot(day: number) {
    let healthy = 0, infected = 0, recovered = 0, lost = 0;
    const stateGrid: CellState[][] = grid.map((row) =>
      row.map((c) => {
        if (c.state === "saglikli") healthy++;
        else if (c.state === "enfekte") infected++;
        else if (c.state === "iyilesti") recovered++;
        else lost++;
        return c.state;
      })
    );
    snapshots.push({ day, grid: stateGrid, healthyCount: healthy, infectedCount: infected, recoveredCount: recovered, lostCount: lost });
  }

  snapshot(0);

  for (let day = 1; day <= totalDays; day++) {
    const newlyInfected: [number, number][] = [];
    const neighborOffsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];

    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const cell = grid[y][x];
        if (cell.state !== "enfekte") continue;

        // Komşulara yayılma denemesi
        for (const [dy, dx] of neighborOffsets) {
          const ny = y + dy, nx = x + dx;
          if (ny < 0 || ny >= gridSize || nx < 0 || nx >= gridSize) continue;
          if (grid[ny][nx].state === "saglikli" && rand() < baseSpreadChance) {
            newlyInfected.push([ny, nx]);
          }
        }

        // İyileşme/kayıp değerlendirmesi
        const daysSinceInfection = day - (cell.infectedOnDay ?? 0);
        if (daysSinceInfection >= daysUntilLoss) {
          grid[y][x] = { state: "kayip", infectedOnDay: cell.infectedOnDay };
        } else if (daysSinceInfection >= recoveryStartDay && rand() < recoveryChance) {
          grid[y][x] = { state: "iyilesti", infectedOnDay: cell.infectedOnDay };
        }
      }
    }

    for (const [ny, nx] of newlyInfected) {
      if (grid[ny][nx].state === "saglikli") {
        grid[ny][nx] = { state: "enfekte", infectedOnDay: day };
      }
    }

    snapshot(day);
  }

  return snapshots;
}
