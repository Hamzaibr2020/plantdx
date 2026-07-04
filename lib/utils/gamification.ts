import { db, ensureProfile } from "@/lib/db/schema";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  check: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  totalAnalyses: number;
  totalPlants: number;
  totalTasksCompleted: number;
  streakDays: number;
  healthyDiagnosesInARow: number;
  chatMessagesSent: number;
  level: number;
}

export const BADGES: Badge[] = [
  { id: "ilk-tarama", name: "İlk Tarama", description: "İlk bitki analizini tamamladın", icon: "Scan", check: (s) => s.totalAnalyses >= 1 },
  { id: "yesil-parmak", name: "Yeşil Parmak", description: "Bahçene 5 bitki ekledin", icon: "Sprout", check: (s) => s.totalPlants >= 5 },
  { id: "haftanin-bahcivani", name: "Haftanın Bahçıvanı", description: "7 gün üst üste aktif oldun", icon: "CalendarCheck", check: (s) => s.streakDays >= 7 },
  { id: "ai-uzmani", name: "AI Uzmanı", description: "AI asistanla 20 mesajlaştın", icon: "Bot", check: (s) => s.chatMessagesSent >= 20 },
  { id: "on-tarama", name: "Tarama Ustası", description: "10 analiz tamamladın", icon: "ScanLine", check: (s) => s.totalAnalyses >= 10 },
  { id: "elli-tarama", name: "Bitki Doktoru", description: "50 analiz tamamladın", icon: "Stethoscope", check: (s) => s.totalAnalyses >= 50 },
  { id: "gorev-onbir", name: "Düzenli Bakıcı", description: "10 bakım görevi tamamladın", icon: "ListChecks", check: (s) => s.totalTasksCompleted >= 10 },
  { id: "gorev-elli", name: "Bahçe Ustası", description: "50 bakım görevi tamamladın", icon: "Trophy", check: (s) => s.totalTasksCompleted >= 50 },
  { id: "otuz-gun-seri", name: "Sadık Bahçıvan", description: "30 gün üst üste aktif oldun", icon: "Flame", check: (s) => s.streakDays >= 30 },
  { id: "saglikli-bes", name: "Sağlık Nöbetçisi", description: "Üst üste 5 sağlıklı teşhis aldın", icon: "HeartPulse", check: (s) => s.healthyDiagnosesInARow >= 5 },
  { id: "yirmi-bitki", name: "Küçük Bahçe İmparatorluğu", description: "20 bitkiye ulaştın", icon: "Trees", check: (s) => s.totalPlants >= 20 },
  { id: "seviye-on", name: "Tecrübeli Çiftçi", description: "Seviye 10'a ulaştın", icon: "Award", check: (s) => s.level >= 10 },
];

// Basit XP eğrisi: her seviye bir öncekinden %20 daha fazla XP ister
export function xpForLevel(level: number): number {
  let total = 0;
  let need = 100;
  for (let i = 1; i < level; i++) {
    total += need;
    need = Math.round(need * 1.2);
  }
  return total;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

export async function grantXp(amount: number): Promise<{ leveledUp: boolean; newLevel: number }> {
  const profile = await ensureProfile();
  const newXp = profile.xp + amount;
  const oldLevel = profile.level;
  const newLevel = levelFromXp(newXp);

  const today = new Date().toISOString().slice(0, 10);
  let streakDays = profile.streakDays;
  if (profile.lastActiveDate !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    streakDays = profile.lastActiveDate === yesterday ? streakDays + 1 : 1;
  }

  await db.profile.update(profile.id!, {
    xp: newXp,
    level: newLevel,
    streakDays,
    lastActiveDate: today,
  });

  await recalculateBadges();

  return { leveledUp: newLevel > oldLevel, newLevel };
}

export async function recalculateBadges(): Promise<string[]> {
  const profile = await ensureProfile();
  const totalPlants = await db.plants.count();
  const totalTasksCompleted = await db.calendarTasks.filter((t) => t.completed).count();
  const chatMessagesSent = await db.chatMessages.where("role").equals("user").count();

  const recentDiagnoses = await db.diagnoses.orderBy("createdAt").reverse().limit(10).toArray();
  let healthyStreak = 0;
  for (const d of recentDiagnoses) {
    if (d.isHealthy) healthyStreak++;
    else break;
  }

  const stats: BadgeStats = {
    totalAnalyses: profile.totalAnalyses,
    totalPlants,
    totalTasksCompleted,
    streakDays: profile.streakDays,
    healthyDiagnosesInARow: healthyStreak,
    chatMessagesSent,
    level: profile.level,
  };

  const unlocked = BADGES.filter((b) => b.check(stats)).map((b) => b.id);
  await db.profile.update(profile.id!, { unlockedBadgeIds: unlocked });
  return unlocked;
}
