/**
 * FAO-56 Hargreaves Yöntemi ile Referans Evapotranspirasyon (ET0) hesaplama.
 * Kaynak: Allen, R.G., Pereira, L.S., Raes, D., Smith, M. (1998).
 * "Crop evapotranspiration - Guidelines for computing crop water requirements"
 * FAO Irrigation and Drainage Paper 56, Chapter 3, Equation 52.
 *
 * ET0 = 0.0023 * Ra * (Tmean + 17.8) * sqrt(Tmax - Tmin)
 *
 * Ra (dış atmosfer radyasyonu) enlem ve yılın gününe göre hesaplanır (Eq. 21-25).
 */

function solarDeclination(dayOfYear: number): number {
  return 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
}

function inverseRelativeDistance(dayOfYear: number): number {
  return 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
}

function sunsetHourAngle(latRad: number, decl: number): number {
  return Math.acos(-Math.tan(latRad) * Math.tan(decl));
}

/** Ra: dış atmosfer radyasyonu (MJ m-2 gün-1) */
export function extraterrestrialRadiation(latitudeDeg: number, dayOfYear: number): number {
  const latRad = (latitudeDeg * Math.PI) / 180;
  const decl = solarDeclination(dayOfYear);
  const dr = inverseRelativeDistance(dayOfYear);
  const ws = sunsetHourAngle(latRad, decl);
  const Gsc = 0.0820; // güneş sabiti, MJ m-2 dk-1

  return (
    ((24 * 60) / Math.PI) *
    Gsc *
    dr *
    (ws * Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.sin(ws))
  );
}

export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

/** ET0 (mm/gün) - FAO-56 Hargreaves */
export function hargreavesET0(params: {
  latitudeDeg: number;
  date: Date;
  tMax: number;
  tMin: number;
  tMean?: number;
}): number {
  const { latitudeDeg, date, tMax, tMin } = params;
  const tMean = params.tMean ?? (tMax + tMin) / 2;
  const doy = dayOfYear(date);
  const Ra = extraterrestrialRadiation(latitudeDeg, doy);
  const tempDiff = Math.max(0, tMax - tMin);
  return 0.0023 * Ra * (tMean + 17.8) * Math.sqrt(tempDiff);
}

export interface DroughtRiskDay {
  date: string;
  et0: number; // mm/gün, potansiyel su kaybı
  rainfall: number; // mm
  waterBalance: number; // rainfall - et0 (negatifse açık)
}

export type DroughtRiskLevel = "düşük" | "orta" | "yüksek";

export function computeDroughtRisk(
  dailyForecast: { date: string; minTemp: number; maxTemp: number; totalRain: number }[],
  latitudeDeg: number
): { days: DroughtRiskDay[]; riskLevel: DroughtRiskLevel; cumulativeDeficitMm: number } {
  const days: DroughtRiskDay[] = dailyForecast.map((d) => {
    const et0 = hargreavesET0({
      latitudeDeg,
      date: new Date(d.date),
      tMax: d.maxTemp,
      tMin: d.minTemp,
    });
    return {
      date: d.date,
      et0: Math.round(et0 * 100) / 100,
      rainfall: d.totalRain,
      waterBalance: Math.round((d.totalRain - et0) * 100) / 100,
    };
  });

  const cumulativeDeficitMm = Math.round(days.reduce((sum, d) => sum + d.waterBalance, 0) * 100) / 100;

  let riskLevel: DroughtRiskLevel = "düşük";
  if (cumulativeDeficitMm < -15) riskLevel = "yüksek";
  else if (cumulativeDeficitMm < -5) riskLevel = "orta";

  return { days, riskLevel, cumulativeDeficitMm };
}
