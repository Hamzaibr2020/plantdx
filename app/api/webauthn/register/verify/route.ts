import { NextRequest, NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getServerDb } from "@/lib/db/server-db";
import { rpID, origin } from "@/lib/auth/webauthn";
import type { RegistrationResponseJSON } from "@simplewebauthn/server";

export async function POST(req: NextRequest) {
  const { username, response } = (await req.json()) as {
    username: string;
    response: RegistrationResponseJSON;
  };

  const db = await getServerDb();
  const user = db.data.users.find((u) => u.username === username);
  if (!user?.currentChallenge) {
    return NextResponse.json({ error: "Önce kayıt seçenekleri istenmeli." }, { status: 400 });
  }

  try {
    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: "Doğrulama başarısız." }, { status: 400 });
    }

    const { credential } = verification.registrationInfo;
    user.credentials.push({
      id: credential.id,
      publicKey: Array.from(credential.publicKey),
      counter: credential.counter,
      transports: credential.transports,
    });
    user.currentChallenge = undefined;
    await db.write();

    return NextResponse.json({ verified: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Kayıt doğrulama hatası", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
