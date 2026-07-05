import { NextRequest, NextResponse } from "next/server";
import { sendPushToUser, sendPushToAll } from "@/lib/api/push-service";

export async function POST(req: NextRequest) {
  try {
    const { title, body, username, url } = (await req.json()) as {
      title: string;
      body: string;
      username?: string;
      url?: string;
    };

    if (!title || !body) return NextResponse.json({ error: "title ve body gerekli." }, { status: 400 });

    const result = username ? await sendPushToUser(username, { title, body, url }) : await sendPushToAll({ title, body, url });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: "Push gönderilemedi", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
