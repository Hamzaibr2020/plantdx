"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/context/auth-context";
import { ensureProfile } from "@/lib/db/schema";
import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";

export default function AppShellLayout({ children }: { children: React.ReactNode }) {
  const { username, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !username) router.replace("/giris");
  }, [loading, username, router]);

  // Profil kaydını (yoksa) bir kez, liveQuery dışında oluştur.
  // liveQuery salt-okunur olmalıdır; yazma işlemini burada, mount anında yapıyoruz.
  useEffect(() => {
    if (username) ensureProfile().catch(() => {});
  }, [username]);

  if (loading || !username) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-4xl leaf-float">🌱</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      <Sidebar />
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
