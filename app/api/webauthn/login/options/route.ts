import { NextRequest, NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { getServerDb } from "@/lib/db/server-db";
import { rpID } from "@/lib/auth/webauthn";

export async function POST(req: NextRequest) {
  const { username } = (await req.json()) as { username: string };
  const db = await getServerDb();
  const user = db.data.users.find((u) => u.username === username);

  if (!user || user.credentials.length === 0) {
    return NextResponse.json(
      { error: "Bu kullanıcı için kayıtlı biyometri bulunamadı. Önce kayıt olmalısın.", noCredentials: true },
      { status: 404 }
    );
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: user.credentials.map((c) => ({ id: c.id, transports: c.transports as any })),
  });

  user.currentChallenge = options.challenge;
  await db.write();

  return NextResponse.json(options);
}
