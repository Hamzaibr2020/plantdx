import Dexie, { type EntityTable } from "dexie";

/**
 * PlantDX - Yerel Veritabanı Şeması (IndexedDB / Dexie)
 * Android'deki Room veritabanının web muadili. Offline-first.
 * 10 tablo: diagnoses, regionRiskCache, chatMessages, plants,
 * calendarTasks, communityPostsCache, comments, profile, fields, inventoryItems
 */

export interface Diagnosis {
  id?: number;
  imageDataUrl: string; // çekilen/seçilen fotoğrafın base64'ü (yerel önizleme)
  mode: "offline" | "online"; // TFLite/TFJS vs Gemini Vision
  diseaseClass: string;
  diseaseNameTr: string;
  confidence: number; // 0-1
  severity: 1 | 2 | 3 | 4 | 5;
  isHealthy: boolean;
  spreadRisk: "düşük" | "orta" | "yüksek" | null;
  recoverability: number | null; // 0-100
  alternatives: { label: string; confidence: number }[];
  quarantineRecommended: boolean;
  latitude: number | null;
  longitude: number | null;
  plantId: number | null;
  createdAt: string; // ISO
  raw: unknown; // API'den dönen ham yanıt (denetim/şeffaflık için)
}

export interface RegionRiskCache {
  id?: number;
  province: string;
  riskLevel: "düşük" | "orta" | "yüksek" | "bilinmiyor";
  dominantDisease: string | null;
  affectedCrops: string[];
  updatedAt: string;
  source: "user-report-aggregate" | "manual" | "none";
}

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string | null;
  suggestions?: string[];
  createdAt: string;
}

export interface Field {
  id?: number;
  name: string;
  sizeDa: number;
  province: string;
  crop: string | null;
  polygonId: string | null; // Agromonitoring NDVI ile ilişkilendirme
  notes: string | null;
  createdAt: string;
}

export interface InventoryItem {
  id?: number;
  name: string;
  type: "Gübre" | "İlaç (Kimyasal)" | "İlaç (Organik)" | "Tohum" | "Diğer";
  quantity: number;
  unit: "kg" | "g" | "l" | "ml" | "adet" | "paket";
  lowStockThreshold: number;
  purchaseDate: string | null;
  expiryDate: string | null;
  fieldId: number | null;
  notes: string | null;
  createdAt: string;
}

export interface Plant {
  id?: number;
  name: string;
  category: "Sebze" | "Meyve" | "Çiçek" | "Süs Bitkisi" | "Ağaç" | "Diğer";
  species: string | null;
  photoDataUrl: string | null;
  location: string | null;
  fieldId: number | null;
  note: string | null;
  wateringIntervalDays: number;
  fertilizingIntervalDays: number;
  lastWateredAt: string | null;
  lastFertilizedAt: string | null;
  lastTreatedAt: string | null;
  lastPrunedAt: string | null;
  createdAt: string;
}

export interface CalendarTask {
  id?: number;
  plantId: number | null;
  type: "Sulama" | "Gübreleme" | "İlaçlama" | "Budama" | "Hasat" | "Saksı Değişimi" | "Kontrol";
  title: string;
  dueDate: string; // ISO date
  priority: "Normal" | "Yüksek" | "Acil";
  isRecurring: boolean;
  recurrenceDays: number | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
}

export interface CommunityPostCache {
  id?: number;
  serverId: string; // sunucudaki gerçek kayıt id'si
  category: "Soru" | "İpucu" | "Hastalık" | "Hasat" | "Sergi" | "Yardım";
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  isExpertVerified: boolean;
  likeCount: number;
  likedByMe: boolean;
  createdAt: string;
  syncedAt: string;
}

export interface Comment {
  id?: number;
  postServerId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface Profile {
  id?: number;
  displayName: string;
  xp: number;
  level: number;
  streakDays: number;
  lastActiveDate: string | null;
  unlockedBadgeIds: string[];
  totalAnalyses: number;
  totalTasksCompleted: number;
}

export const db = new Dexie("PlantDX") as Dexie & {
  diagnoses: EntityTable<Diagnosis, "id">;
  regionRiskCache: EntityTable<RegionRiskCache, "id">;
  chatMessages: EntityTable<ChatMessage, "id">;
  plants: EntityTable<Plant, "id">;
  calendarTasks: EntityTable<CalendarTask, "id">;
  communityPostsCache: EntityTable<CommunityPostCache, "id">;
  comments: EntityTable<Comment, "id">;
  profile: EntityTable<Profile, "id">;
  fields: EntityTable<Field, "id">;
  inventoryItems: EntityTable<InventoryItem, "id">;
};

// v1: ilk şema (bazı boolean alanlar (completed, isHealthy) yanlışlıkla indexlenmişti —
// IndexedDB boolean değerleri key olarak desteklemez, bu da ".where()" sorgularının
// sessizce/hata ile başarısız olmasına yol açıyordu). v2 bu alanları index'ten çıkarır
// ve gerçekten kullanılan "role" alanını doğru şekilde indexler.
db.version(1).stores({
  diagnoses: "++id, plantId, createdAt, diseaseClass, isHealthy",
  regionRiskCache: "++id, &province, updatedAt",
  chatMessages: "++id, createdAt",
  plants: "++id, category, createdAt",
  calendarTasks: "++id, plantId, dueDate, completed, type",
  communityPostsCache: "++id, &serverId, category, createdAt",
  comments: "++id, postServerId, createdAt",
  profile: "++id",
});

db.version(2).stores({
  diagnoses: "++id, plantId, createdAt, diseaseClass",
  regionRiskCache: "++id, &province, updatedAt",
  chatMessages: "++id, createdAt, role",
  plants: "++id, category, createdAt",
  calendarTasks: "++id, plantId, dueDate, type",
  communityPostsCache: "++id, &serverId, category, createdAt",
  comments: "++id, postServerId, createdAt",
  profile: "++id",
});

// v3: Çoklu tarla/parsel yönetimi ve gübre/ilaç envanteri takibi eklendi
db.version(3).stores({
  diagnoses: "++id, plantId, createdAt, diseaseClass",
  regionRiskCache: "++id, &province, updatedAt",
  chatMessages: "++id, createdAt, role",
  plants: "++id, category, createdAt, fieldId",
  calendarTasks: "++id, plantId, dueDate, type",
  communityPostsCache: "++id, &serverId, category, createdAt",
  comments: "++id, postServerId, createdAt",
  profile: "++id",
  fields: "++id, name, createdAt",
  inventoryItems: "++id, type, fieldId, expiryDate, createdAt",
});

export async function ensureProfile(): Promise<Profile> {
  const existing = await db.profile.toCollection().first();
  if (existing) return existing;
  const newProfile: Profile = {
    displayName: "Çiftçi",
    xp: 0,
    level: 1,
    streakDays: 0,
    lastActiveDate: null,
    unlockedBadgeIds: [],
    totalAnalyses: 0,
    totalTasksCompleted: 0,
  };
  const id = await db.profile.add(newProfile);
  return { ...newProfile, id };
}
