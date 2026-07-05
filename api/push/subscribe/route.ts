import { NextRequest, NextResponse } from "next/server";
import { getServerDb } from "@/lib/db/server-db";

export async function POST(req: NextRequest) {
  const { username, subscription } = (await req.json()) as {
    username: string;
    subscription: { endpoint: string; keys: { p256dh: string; auth: string } };
  };

  if (!username || !subscription?.endpoint) {
    return NextResponse.json({ error: "username ve subscription gerekli." }, { status: 400 });
  }

  const db = await getServerDb();
  db.data.pushSubscriptions = db.data.pushSubscriptions.filter((s) => s.endpoint !== subscription.endpoint);
  db.data.pushSubscriptions.push({
    username,
    endpoint: subscription.endpoint,
    keys: subscription.keys,
    createdAt: new Date().toISOString(),
  });
  await db.write();

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { endpoint } = (await req.json()) as { endpoint: string };
  const db = await getServerDb();
  db.data.pushSubscriptions = db.data.pushSubscriptions.filter((s) => s.endpoint !== endpoint);
  await db.write();
  return NextResponse.json({ ok: true });
}
