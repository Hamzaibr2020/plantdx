"use client";

import { useState } from "react";
import TopBar from "@/components/layout/TopBar";
import DiseaseSpreadSim from "@/components/simulation/DiseaseSpreadSim";
import PlantGrowthSim from "@/components/simulation/PlantGrowthSim";
import { Bug, Sprout } from "lucide-react";

export default function SimulasyonPage() {
  const [tab, setTab] = useState<"hastalik" | "gelisim">("hastalik");

  return (
    <div className="page-enter">
      <TopBar title="Simülasyon" />
      <div className="p-4 md:p-6 max-w-3xl mx-auto flex flex-col gap-4">
        <div className="flex rounded-full solid-card p-1">
          <button
            onClick={() => setTab("hastalik")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-medium transition ${
              tab === "hastalik" ? "bg-danger-500 text-white" : "text-foreground/60"
            }`}
          >
            <Bug size={14} /> Hastalık Yayılımı
          </button>
          <button
            onClick={() => setTab("gelisim")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-xs font-medium transition ${
              tab === "gelisim" ? "bg-brand-green-600 text-white" : "text-foreground/60"
            }`}
          >
            <Sprout size={14} /> Bitki Gelişimi
          </button>
        </div>

        {tab === "hastalik" ? <DiseaseSpreadSim /> : <PlantGrowthSim />}
      </div>
    </div>
  );
}
