import { NextRequest, NextResponse } from "next/server";
import { getServerDb, findOrCreateUser, TRUSTED_CONTRIBUTOR_THRESHOLD } from "@/lib/db/server-db";

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get("username");
  if (!username) return NextResponse.json({ error: "username gerekli." }, { status: 400 });

  const db = await getServerDb();
  const user = db.data.users.find((u) => u.username === username);

  return NextResponse.json({
    reputationScore: user?.reputationScore ?? 0,
    expertiseClaim: user?.expertiseClaim ?? null,
    isTrustedContributor: (user?.reputationScore ?? 0) >= TRUSTED_CONTRIBUTOR_THRESHOLD,
    trustedContributorThreshold: TRUSTED_CONTRIBUTOR_THRESHOLD,
  });
}

/**
 * expertiseClaim TAMAMEN KENDİ BEYANIDIR. PlantDX bu bilgiyi hiçbir resmi kurumla
 * doğrulamaz (diploma, oda kaydı vb. kontrolü yapılmaz). Arayüzde her zaman
 * "kendi beyanı" ibaresiyle birlikte gösterilir — bu route bunu değiştirmez.
 */
export async function POST(req: NextRequest) {
  const { username, expertiseClaim } = (await req.json()) as { username: string; expertiseClaim: string | null };
  if (!username?.trim()) return NextResponse.json({ error: "username gerekli." }, { status: 400 });

  const db = await getServerDb();
  const user = findOrCreateUser(db, username.trim());
  user.expertiseClaim = expertiseClaim?.trim() || null;
  await db.write();

  return NextResponse.json({ ok: true, expertiseClaim: user.expertiseClaim });
}
