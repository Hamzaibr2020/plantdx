import { JSONFilePreset } from "lowdb/node";
import path from "path";
import { randomUUID } from "crypto";

export interface ServerCommunityPost {
  id: string;
  category: "Soru" | "İpucu" | "Hastalık" | "Hasat" | "Sergi" | "Yardım";
  title: string;
  body: string;
  tags: string[];
  authorName: string;
  isExpertVerified: boolean;
  likeCount: number;
  likedBy: string[]; // authorName listesi (basit demo kimlik; gerçek projede user id)
  createdAt: string;
}

export interface ServerComment {
  id: string;
  postId: string;
  authorName: string;
  body: string;
  createdAt: string;
}

export interface ServerRegionRisk {
  province: string;
  riskLevel: "düşük" | "orta" | "yüksek";
  dominantDisease: string;
  affectedCrops: string[];
  reportCount: number;
  updatedAt: string;
}

export interface WebAuthnCredential {
  id: string; // base64url credential id
  publicKey: number[]; // Uint8Array olarak saklanamadığı için array
  counter: number;
  transports?: string[];
}

export interface ServerUser {
  id: string;
  username: string;
  currentChallenge?: string;
  credentials: WebAuthnCredential[];
  notificationPrefs?: {
    province: string;
    crops: string[];
    notifyDailyAdvice: boolean;
    notifyWeatherAlerts: boolean;
  };
  // Topluluk itibar sistemi. expertiseClaim KENDİ BEYANIDIR — PlantDX bunu resmi bir
  // diploma/lisans olarak DOĞRULAMAZ; arayüzde her zaman "kendi beyanı" olarak etiketlenir.
  // reputationScore ise gerçek topluluk etkileşiminden (beğeni, yorum, paylaşım) hesaplanan
  // gerçek bir sayıdır ve "Güvenilir Katkıcı" rozetinin eşiğini belirler.
  expertiseClaim?: string | null;
  reputationScore: number;
}

export const TRUSTED_CONTRIBUTOR_THRESHOLD = 50;

export interface PushSubscriptionRecord {
  username: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  createdAt: string;
}

interface DbShape {
  posts: ServerCommunityPost[];
  comments: ServerComment[];
  regionRisk: ServerRegionRisk[];
  users: ServerUser[];
  pushSubscriptions: PushSubscriptionRecord[];
}

const DB_PATH = path.join(process.cwd(), "data", "server-db.json");

const SEED_POSTS: ServerCommunityPost[] = [
  {
    id: randomUUID(),
    category: "Hastalık",
    title: "Domateslerimde yapraklar sararıyor, geç yanıklık mı?",
    body: "Antalya'da sera domatesi yetiştiriyorum. Alt yapraklarda kahverengi lekeler var ve hızla yayılıyor. Nem oranı yüksek. Bu geç yanıklık (Phytophthora infestans) belirtisi mi, yoksa erken yanıklık mı? Fotoğraf çekip AI Kamera ile taradım, sonuç %78 güvenle geç yanıklık dedi.",
    tags: ["domates", "geç-yanıklık", "sera"],
    authorName: "Mehmet_Antalya",
    isExpertVerified: true,
    likeCount: 12,
    likedBy: [],
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: randomUUID(),
    category: "İpucu",
    title: "Organik kırmızı örümcek mücadelesinde işe yarayan yöntem",
    body: "3 yıldır kimyasal kullanmadan bahçe yapıyorum. Kırmızı örümcek için sabunlu su + neem yağı karışımını haftada bir uyguluyorum, yaprak altlarını unutmayın. Ayrıca bitkiler arası nem artırmak (misting) popülasyonu ciddi düşürüyor.",
    tags: ["organik", "kırmızı-örümcek", "zararlı"],
    authorName: "BahceciAyse",
    isExpertVerified: false,
    likeCount: 34,
    likedBy: [],
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString(),
  },
  {
    id: randomUUID(),
    category: "Soru",
    title: "Salçalık biberler için gübreleme aralığı ne olmalı?",
    body: "İlk kez salçalık biber ekiyorum, Eskişehir'de açık alanda. Ne sıklıkla azotlu gübre vermeliyim, meyve bağlama döneminde değişiyor mu?",
    tags: ["biber", "gübreleme"],
    authorName: "YeniCiftci_Hamza",
    isExpertVerified: false,
    likeCount: 3,
    likedBy: [],
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: randomUUID(),
    category: "Hasat",
    title: "Bu yılki üzüm hasadı beklediğimden bereketli oldu",
    body: "Külleme ile mücadele için erken ilaçlama yaptık, kükürt bazlı organik ürünle 3 uygulama. Sonuç: geçen yıla göre %40 daha fazla verim. Detaylı programı yorumlarda paylaşırım isteyen olursa.",
    tags: ["üzüm", "hasat", "külleme"],
    authorName: "BagciKemal",
    isExpertVerified: false,
    likeCount: 21,
    likedBy: [],
    createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: randomUUID(),
    category: "Yardım",
    title: "Saksı bitkimin kökleri çürümüş olabilir mi?",
    body: "Yaprakları sarardı, toprak sürekli ıslak kalıyordu. Saksıdan çıkardığımda kökler siyahımsı ve yumuşak. Kurtarma şansı var mı yoksa direkt atayım mı?",
    tags: ["kök-çürüklüğü", "saksı-bitkisi"],
    authorName: "EvBahcesi_Zeynep",
    isExpertVerified: true,
    likeCount: 8,
    likedBy: [],
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: randomUUID(),
    category: "Sergi",
    title: "Balkonumda 6 ay sonra ilk salatalık hasadı 🥒",
    body: "Küçük bir balkon bahçesiyle başladım, PlantDX'in sulama hatırlatıcıları sayesinde hiç ihmal etmedim. İlk salatalıklarım geldi, çok mutluyum!",
    tags: ["balkon-bahçesi", "salatalık"],
    authorName: "BalkonBahcesi_Fatma",
    isExpertVerified: false,
    likeCount: 45,
    likedBy: [],
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  },
];

let dbPromise: ReturnType<typeof JSONFilePreset<DbShape>> | null = null;

export async function getServerDb() {
  if (!dbPromise) {
    dbPromise = JSONFilePreset<DbShape>(DB_PATH, {
      posts: SEED_POSTS,
      comments: [],
      regionRisk: [],
      users: [],
      pushSubscriptions: [],
    });
  }
  const db = await dbPromise;
  await db.read();
  return db;
}

/** Kullanıcıyı bulur, yoksa oluşturur (itibar/uzmanlık işlemleri için ortak yardımcı). */
export function findOrCreateUser(db: Awaited<ReturnType<typeof getServerDb>>, username: string): ServerUser {
  let user = db.data.users.find((u) => u.username === username);
  if (!user) {
    user = { id: randomUUID(), username, credentials: [], reputationScore: 0, expertiseClaim: null };
    db.data.users.push(user);
  }
  return user;
}

export function addReputation(db: Awaited<ReturnType<typeof getServerDb>>, username: string, points: number): void {
  const user = findOrCreateUser(db, username);
  user.reputationScore = Math.max(0, user.reputationScore + points);
}
