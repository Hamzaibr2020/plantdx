import { NextResponse } from "next/server";

/**
 * Hangi ortam değişkenlerinin tanımlı olduğunu kontrol eder. Değerleri ASLA döndürmez,
 * sadece var/yok bilgisini verir — güvenlik açısından key'ler client'a hiç gönderilmez.
 */
export async function GET() {
  return NextResponse.json({
    gemini: !!process.env.GEMINI_API_KEY,
    openWeather: !!process.env.OPENWEATHER_API_KEY,
    agromonitoring: !!process.env.AGROMONITORING_API_KEY,
    webauthn: !!(process.env.NEXT_PUBLIC_RP_ID && process.env.NEXT_PUBLIC_ORIGIN),
    webauthnUsesLocalhost: process.env.NEXT_PUBLIC_RP_ID === "localhost",
    push: !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    cronSecret: !!process.env.CRON_SECRET,
  });
}
