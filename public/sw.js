const CACHE_NAME = "plantdx-v1";
const OFFLINE_URLS = ["/", "/anasayfa", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Offline-first: önce ağ, başarısız olursa önbellek (API rotalarını önbelleğe alma)
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/")) return; // API çağrıları her zaman ağdan

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});

// Push bildirimleri (WorkManager muadili - sunucu tarafından tetiklenen bildirimler)
self.addEventListener("push", (event) => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "PlantDX", {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag || "plantdx-notification",
      data: { url: data.url || "/anasayfa" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data?.url || "/anasayfa"));
});

// Periodic Background Sync (destekleyen tarayıcılarda - Chrome/Edge Android)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "plantdx-daily-check") {
    event.waitUntil(
      fetch("/api/weather?lat=39.77&lon=30.52")
        .then((r) => r.json())
        .then((data) => {
          if (data.agriAlerts?.some((a) => a.level === "tehlike")) {
            return self.registration.showNotification("Hava Riski Uyarısı", {
              body: data.agriAlerts.find((a) => a.level === "tehlike").message,
              icon: "/icons/icon-192.png",
            });
          }
        })
        .catch(() => {})
    );
  }
});
