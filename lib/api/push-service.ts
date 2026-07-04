import webpush from "web-push";
import { getServerDb, PushSubscriptionRecord } from "@/lib/db/server-db";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "VAPID anahtarları tanımlı değil (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT)."
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export async function sendPushToUser(username: string, payload: { title: string; body: string; url?: string }) {
  ensureConfigured();
  const db = await getServerDb();
  const targets = db.data.pushSubscriptions.filter((s) => s.username === username);
  return sendToSubscriptions(targets, payload);
}

export async function sendPushToAll(payload: { title: string; body: string; url?: string }) {
  ensureConfigured();
  const db = await getServerDb();
  return sendToSubscriptions(db.data.pushSubscriptions, payload);
}

async function sendToSubscriptions(
  targets: PushSubscriptionRecord[],
  payload: { title: string; body: string; url?: string }
) {
  const db = await getServerDb();
  const results = await Promise.allSettled(
    targets.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, JSON.stringify(payload))
    )
  );

  // Süresi dolmuş/geçersiz abonelikleri temizle (410 Gone / 404)
  const expiredEndpoints = new Set<string>();
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const statusCode = (r.reason as { statusCode?: number })?.statusCode;
      if (statusCode === 410 || statusCode === 404) expiredEndpoints.add(targets[i].endpoint);
    }
  });
  if (expiredEndpoints.size > 0) {
    db.data.pushSubscriptions = db.data.pushSubscriptions.filter((s) => !expiredEndpoints.has(s.endpoint));
    await db.write();
  }

  return {
    sent: results.filter((r) => r.status === "fulfilled").length,
    failed: results.filter((r) => r.status === "rejected").length,
  };
}
