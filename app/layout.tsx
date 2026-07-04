import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SettingsProvider } from "@/lib/context/settings-context";
import { AuthProvider } from "@/lib/context/auth-context";
import PwaRegister from "@/components/PwaRegister";

export const metadata: Metadata = {
  title: "PlantDX - Akıllı Bitki Sağlığı ve Bahçe Yönetimi",
  description: "Yapay zeka destekli bitki hastalığı teşhisi ve bahçe yönetim uygulaması",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, Arial, sans-serif" }}
      >
        <SettingsProvider>
          <AuthProvider>
            <PwaRegister />
            {children}
          </AuthProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
