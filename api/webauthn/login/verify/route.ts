import { NextRequest, NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { getServerDb } from "@/lib/db/server-db";
import { rpID, origin } from "@/lib/auth/webauthn";
import type { AuthenticationResponseJSON } from "@simplewebauthn/server";

export async function POST(req: NextRequest) {
  const { username, response } = (await req.json()) as {
    username: string;
    response: AuthenticationResponseJSON;
  };

  const db = await getServerDb();
  const user = db.data.users.find((u) => u.username === username);
  if (!user?.currentChallenge) {
    return NextResponse.json({ error: "Önce giriş seçenekleri istenmeli." }, { status: 400 });
  }

  const credential = user.credentials.find((c) => c.id === response.id);
  if (!credential) return NextResponse.json({ error: "Bilinmeyen kimlik bilgisi." }, { status: 400 });

  try {
    const verification = await verifyAuthenticationResponse({
      response,
      expectedChallenge: user.currentChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: credential.id,
        publicKey: new Uint8Array(credential.publicKey),
        counter: credential.counter,
        transports: credential.transports as any,
      },
    });

    if (!verification.verified) {
      return NextResponse.json({ error: "Doğrulama başarısız." }, { status: 400 });
    }

    credential.counter = verification.authenticationInfo.newCounter;
    user.currentChallenge = undefined;
    await db.write();

    // Basit oturum çerezi (gerçek projede imzalı JWT/iron-session önerilir)
    const res = NextResponse.json({ verified: true, username: user.username });
    res.cookies.set("plantdx_session", user.username, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    return res;
  } catch (err) {
    return NextResponse.json(
      { error: "Giriş doğrulama hatası", detail: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
