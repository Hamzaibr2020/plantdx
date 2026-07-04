import { NextResponse } from "next/server";
import { getServerDb, TRUSTED_CONTRIBUTOR_THRESHOLD } from "@/lib/db/server-db";

export async function GET() {
  const db = await getServerDb();

  const top = [...db.data.users]
    .filter((u) => u.reputationScore > 0)
    .sort((a, b) => b.reputationScore - a.reputationScore)
    .slice(0, 10)
    .map((u) => ({
      username: u.username,
      reputationScore: u.reputationScore,
      expertiseClaim: u.expertiseClaim ?? null,
      isTrustedContributor: u.reputationScore >= TRUSTED_CONTRIBUTOR_THRESHOLD,
    }));

  return NextResponse.json({ leaderboard: top, threshold: TRUSTED_CONTRIBUTOR_THRESHOLD });
}
