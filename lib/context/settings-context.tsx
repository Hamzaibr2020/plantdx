"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export interface AppSettings {
  language: "tr" | "en";
  darkMode: boolean;
  largeText: boolean;
  voiceMode: boolean;
  notifyDailyAdvice: boolean;
  notifyWeatherAlerts: boolean;
  province: string;
  fieldSizeDa: number; // dekar
  selectedCrops: string[];
}

const DEFAULT_SETTINGS: AppSettings = {
  language: "tr",
  darkMode: false,
  largeText: false,
  voiceMode: false,
  notifyDailyAdvice: true,
  notifyWeatherAlerts: true,
  province: "Eskişehir",
  fieldSizeDa: 5,
  selectedCrops: [],
};

const STORAGE_KEY = "plantdx_settings";

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (partial: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(raw) });
    } catch {
      // yoksay, varsayılan ayarlar kullanılacak
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    document.documentElement.classList.toggle("dark", settings.darkMode);
    document.documentElement.classList.toggle("text-scale-lg", settings.largeText);
  }, [settings, loaded]);

  function updateSettings(partial: Partial<AppSettings>) {
    setSettings((prev) => ({ ...prev, ...partial }));
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings, SettingsProvider içinde kullanılmalı");
  return ctx;
}
