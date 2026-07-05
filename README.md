# 🌱 PlantDX — Akıllı Bitki Sağlığı ve Bahçe Yönetimi

Yapay zeka destekli bitki hastalığı teşhisi ve bahçe yönetim web uygulaması.
Next.js 15 (App Router) + TypeScript + Tailwind CSS ile inşa edilmiştir.
**Tüm AI özellikleri tek bir sağlayıcıya (Google Gemini) dayanır** — ayrı bir Anthropic/Claude
hesabına ihtiyaç yoktur.

**Mock/sahte veri yoktur.** API anahtarı tanımlı değilse veya bir model dosyası eksikse,
ilgili modül dürüstçe hata/boş durum gösterir; asla uydurma sonuç üretmez.

## 🆕 Öne Çıkan Güçlü Özellikler

- **Dayanıklı Gemini istemcisi** (`lib/api/gemini-client.ts`): otomatik model fallback zinciri
  (gemini-3.5-flash → gemini-2.5-flash → gemini-2.5-flash-lite), geçici hatalarda otomatik
  yeniden deneme, tutarlı hata mesajları.
- **Çok güçlü AI Sohbet Asistanı**: bahçe/konum/teşhis geçmişi bağlamı otomatik enjekte edilir,
  **fotoğraf gönderip analiz ettirebilirsin** (multimodal), her yanıtın sonunda takip sorusu
  önerileri gösterilir.
- **Veri temelli Günlük Tarım Tavsiyesi**: gerçek hava durumu + FAO-56 Hargreaves kuraklık
  modeli + bitki/teşhis geçmişi Gemini'ye beslenir, yapılandırılmış JSON çıktı (öncelik seviyesi,
  sulama/hastalık/haftalık görünüm, yapılacaklar listesi) döner.
- **Tedavi Merkezi**: 20+ hastalık için küratörlü yerel veritabanı (kimyasal + organik +
  **biyolojik mücadele**), kapsam dışı hastalıklar için **Gemini'den gerçek zamanlı tedavi planı**
  üretimi, iyileşme süresi tahmini, **tek tıkla takvime ekleme**.
- **Akıllı Takvim**: **AI ile 60 günlük otomatik bakım planı üretimi** (bitki türüne özgü), hava
  durumuna duyarlı sulama önerisi (yağmur bekleniyorsa görevleri erteleme), ay/liste görünümü.
- **Bilgi Merkezi**: 10 gerçek Türkçe makale + **AI'ya Sor** paneli (makale içeriğiyle
  bağlamlandırılmış hafif RAG + Gemini).
- **Hastalık Yayılım Simülasyonu + Bitki Gelişim Simülasyonu** (`/simulasyon`): SIR-benzeri
  epidemiyolojik model VE lojistik büyüme modeli, iki sekme halinde. Bitki gelişimi sekmesi
  gerçek bir bitkine bağlanıp sulama/gübreleme geçmişinden otomatik bakım kalitesi tahmini yapar.
- **Kurulum sihirbazı** (`/kurulum`): hangi entegrasyonların yapılandırıldığını gösterir,
  her servis için **gerçek bağlantı testi** yapar (sadece .env kontrolü değil).
- **Çoklu Tarla/Parsel Yönetimi** (`/tarlalar`): birden fazla tarla/parseli ayrı ayrı takip et,
  her birine bitki bağla, ortalama sağlık skorunu gör.
- **Gübre/İlaç Envanteri** (`/envanter`): stok takibi, düşük stok ve son kullanma tarihi
  uyarıları, Tedavi Merkezi'nden **tek tıkla stoktan düşme**.
- **PDF Rapor Dışa Aktarma** (`/yazdir`): tarayıcının native yazdırma motorunu kullanır (jsPDF
  yerine) — bu sayede ş/ğ/ı/İ/ö/ü/ç gibi Türkçe karakterler **hiç bozulmadan** çıkar.
- **Sesli Komut/Asistan**: AI Sohbet'te mikrofon ile konuşarak soru sorabilir, "Sesli Mod"
  ayarı açıkken AI yanıtlarını dinleyebilirsin (Web Speech API, tr-TR).
- **Topluluk İtibar Sistemi**: kendi beyanı uzmanlık rozeti + gerçek beğeni/yorum etkileşiminden
  hesaplanan itibar puanı ve "Güvenilir Katkıcı" rozeti, liderlik tablosu.

## 🚀 Hızlı Başlangıç

```bash
npm install
cp .env.local.example .env.local   # sonra gerçek API key'lerini gir
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini aç, sonra `/kurulum` sayfasından yapılandırmanı
doğrula.

### Gerekli API Anahtarları

| Servis | Kullanım Alanı | Nereden Alınır |
|---|---|---|
| `GEMINI_API_KEY` | AI Sohbet Asistanı, Günlük Tavsiye, Görüntü Analizi (Vision), Tedavi Planları, Bakım Takvimi, Bilgi Merkezi Soru-Cevap | https://aistudio.google.com/apikey |
| `OPENWEATHER_API_KEY` | Hava durumu + tarımsal risk uyarıları | https://openweathermap.org/api |
| `AGROMONITORING_API_KEY` | NDVI uydu verisi (Sentinel-2/Landsat-8) | https://agromonitoring.com/api |

Bir anahtar girilmezse o modül devre dışı kalır ve kullanıcıya net bir hata mesajı gösterilir —
uygulama çökmez. `/kurulum` sayfası bunu görsel olarak gösterir ve her servis için gerçek
bağlantı testi yapmanı sağlar.

---

## 📦 Mimari

```
app/
  (app)/                 → Oturum açmış kullanıcı sayfaları (nav shell içinde)
    anasayfa/  kamera/  tanisonucu/  tedavi/  harita/  bahcem/  sohbet/
    takvim/  raporlar/  hava-durumu/  bilgi-merkezi/  topluluk/  profil/  ayarlar/
  api/                   → Sunucu tarafı proxy route'ları (API key'ler burada gizli kalır)
  giris/                 → WebAuthn biyometrik giriş sayfası
components/              → UI, kamera, harita, grafik, layout bileşenleri
lib/
  db/schema.ts           → Dexie (IndexedDB) şeması — 8 tablo, Room muadili
  db/server-db.ts        → lowdb tabanlı paylaşımlı sunucu verisi (topluluk, WebAuthn kullanıcıları)
  api/                   → Tedavi bilgi tabanı, hastalık etiketleri, TFJS çıkarım motoru
  utils/                 → Gamification, FAO-56 Hargreaves kuraklık modeli, görüntü kalite analizi
  context/                → Ayarlar ve auth React context'leri
data/                    → 81 il listesi, ürün listesi, Bilgi Merkezi makaleleri
scripts/train_plantvillage_model.py → Çevrimdışı TFJS modeli eğitim scripti
public/models/           → Eğitilmiş model buraya yerleştirilir (repo'da YOK, aşağıya bakın)
```

### Veri Katmanı
- **Kişisel veri** (bitkiler, teşhisler, takvim, sohbet, profil): tarayıcıda **IndexedDB** (Dexie) —
  offline-first, cihazdan çıkmaz.
- **Paylaşımlı veri** (topluluk gönderileri, bölgesel risk haritası, WebAuthn kimlik bilgileri):
  sunucuda `data/server-db.json` (lowdb, dosya tabanlı gerçek kalıcı depolama). Üretimde bunu
  Postgres/MySQL gibi gerçek bir veritabanına taşımanız önerilir (aşağıda "Üretime Geçiş" bölümüne bakın).

---

## 🔐 Biyometrik Giriş (WebAuthn)

`@simplewebauthn` ile gerçek parmak izi/yüz tanıma (Touch ID, Face ID, Windows Hello, Android
biometric) entegre edilmiştir. **Localhost'ta çalışır**; gerçek bir domain'e deploy ederken
`.env.local` içindeki şu değerleri güncellemeyi unutmayın:

```
NEXT_PUBLIC_RP_ID=sizin-domaininiz.com
NEXT_PUBLIC_ORIGIN=https://sizin-domaininiz.com
```

WebAuthn **HTTPS zorunlu kılar** (localhost hariç). Vercel/Netlify gibi platformlar bunu
otomatik sağlar.

---

## 🧠 Çevrimdışı AI Modeli (TFLite/TFJS)

Çevrimdışı analiz modu, `public/models/plantvillage_web_model/` klasöründe eğitilmiş bir
TensorFlow.js modeli arar. **Bu repo'da model dosyası YOKTUR** — 54.000+ görüntülük PlantVillage
veri seti indirip saatlerce GPU eğitimi gerektirir, bu yüzden burada dahil edilmedi.

Kendi modelinizi eğitmek için:

```bash
pip install tensorflow tensorflowjs
python scripts/train_plantvillage_model.py --data_dir ./plantvillage_dataset --epochs 15
tensorflowjs_converter --input_format=keras \
  ./trained_model/plantvillage_model.keras \
  public/models/plantvillage_web_model
cp ./trained_model/class_names.json public/models/plantvillage_web_model/
```

Model dosyası yoksa uygulama **sahte sonuç üretmez** — "çevrimdışı analiz kullanılamıyor" mesajı
gösterir ve kullanıcıyı Çevrimiçi (Gemini Vision) moduna yönlendirir.

---

## 🔔 Bildirimler / Arka Plan Görevleri

`public/sw.js` bir service worker kaydeder ve şunları destekler:
- Offline sayfa önbellekleme
- Web Push bildirimleri (`push` event)
- Periodic Background Sync (yalnızca Chrome/Edge Android destekler)

**Not:** Gerçek push bildirimleri göndermek için sunucu tarafında VAPID anahtarları ve bir push
servisi (`web-push` npm paketi) kurmanız gerekir — bu iskelet, altyapıyı hazırlar ama VAPID
anahtar üretimi ortam bazlı olduğundan bu repoya dahil edilmemiştir.

---

## 🗺️ Harita

Leaflet + OpenStreetMap kullanılır, **API anahtarı gerekmez**. Bölgesel risk verisi,
kullanıcıların AI Kamera ile yaptığı gerçek teşhislerin il bazında toplulaştırılmasından
oluşur — uydurma istatistik yoktur. Yeterli rapor olmayan iller "bilinmiyor" olarak işaretlenir.

---

## 🏗️ Üretime Geçiş Notları

Bu proje gerçek, çalışan bir mimari sunar ama tek-sunuculu basit bir kuruluma göre
tasarlanmıştır. Gerçek ölçekli üretime taşırken:

1. **`lib/db/server-db.ts`** (lowdb/JSON dosyası) → Postgres/MySQL + Prisma veya benzeri bir
   ORM'e taşıyın (eşzamanlı yazma/okuma için dosya tabanlı depolama yeterli değildir).
2. **Oturum yönetimi** basit bir cookie ile yapılmıştır (`app/api/webauthn/login/verify/route.ts`)
   → imzalı JWT veya `iron-session` gibi bir kütüphaneyle güçlendirin.
3. **Görsel depolama**: Şu an fotoğraflar base64 olarak IndexedDB'de tutulur (cihaz sınırlı).
   Çok kullanıcılı/senkronize bir sistem isterseniz S3/Cloudflare R2 gibi bir object storage'a
   yükleyip URL saklayın.
4. **Rate limiting**: `/api/gemini/*` route'larına kötüye kullanımı önlemek
   için rate limit eklemeniz önerilir.

---

## 📜 Komutlar

```bash
npm run dev      # geliştirme sunucusu
npm run build    # üretim build'i (TypeScript tip kontrolü dahil)
npm run start    # üretim sunucusu
```

Bu proje `npm run build` ile **tip hatası olmadan** derlenir ve 31 route'un tamamı başarıyla
oluşturulur.
