"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";

export default function RootPage() {
  const router = useRouter();
  const { username, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(username ? "/anasayfa" : "/giris");
  }, [loading, username, router]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-brand-green-50 to-white dark:from-[#0f2318] dark:to-[#0b1410]">
      <div className="text-6xl leaf-float">🌱</div>
      <p className="text-brand-green-700 dark:text-brand-green-400 font-medium">PlantDX yükleniyor...</p>
    </div>
  );
}
