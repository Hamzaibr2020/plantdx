import { NextRequest, NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getServerDb } from "@/lib/db/server-db";
import { rpID, rpName } from "@/lib/auth/webauthn";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const { username } = (await req.json()) as { username: string };
  if (!username?.trim()) return NextResponse.json({ error: "Kullanıcı adı gerekli." }, { status: 400 });

  const db = await getServerDb();
  let user = db.data.users.find((u) => u.username === username);
  if (!user) {
    user = { id: randomUUID(), username, credentials: [], reputationScore: 0, expertiseClaim: null };
    db.data.users.push(user);
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userName: username,
    userDisplayName: username,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required", // gerçek biyometrik doğrulama zorunlu
      authenticatorAttachment: "platform", // cihazın kendi parmak izi/yüz sensörü
    },
    excludeCredentials: user.credentials.map((c) => ({ id: c.id, transports: c.transports as any })),
  });

  user.currentChallenge = options.challenge;
  await db.write();

  return NextResponse.json(options);
}
