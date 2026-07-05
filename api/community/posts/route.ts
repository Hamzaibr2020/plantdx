import { NextRequest, NextResponse } from "next/server";
import { getServerDb, ServerCommunityPost, TRUSTED_CONTRIBUTOR_THRESHOLD } from "@/lib/db/server-db";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const db = await getServerDb();
  const category = req.nextUrl.searchParams.get("category");
  const search = req.nextUrl.searchParams.get("q")?.toLowerCase();

  let posts = [...db.data.posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (category && category !== "Hepsi") posts = posts.filter((p) => p.category === category);
  if (search) posts = posts.filter((p) => p.title.toLowerCase().includes(search) || p.body.toLowerCase().includes(search));

  // Her gönderiye yazarın GÜNCEL itibar/uzmanlık bilgisini canlı olarak ekle
  // (isExpertVerified kayıt anındaki durumun anlık görüntüsüdür, buradaki alanlar günceldir)
  const enriched = posts.map((p) => {
    const author = db.data.users.find((u) => u.username === p.authorName);
    return {
      ...p,
      authorReputationScore: author?.reputationScore ?? 0,
      authorIsTrustedContributor: (author?.reputationScore ?? 0) >= TRUSTED_CONTRIBUTOR_THRESHOLD,
      authorExpertiseClaim: author?.expertiseClaim ?? null,
    };
  });

  return NextResponse.json({ posts: enriched });
}

export async function POST(req: NextRequest) {
  const db = await getServerDb();
  const body = (await req.json()) as Pick<ServerCommunityPost, "category" | "title" | "body" | "tags" | "authorName">;

  if (!body.title?.trim() || !body.body?.trim() || !body.authorName?.trim()) {
    return NextResponse.json({ error: "Başlık, içerik ve isim zorunludur." }, { status: 400 });
  }

  const authorName = body.authorName.trim();
  const author = db.data.users.find((u) => u.username === authorName);

  const newPost: ServerCommunityPost = {
    id: randomUUID(),
    category: body.category ?? "Soru",
    title: body.title.trim(),
    body: body.body.trim(),
    tags: body.tags ?? [],
    authorName,
    // Kayıt anındaki uzmanlık beyanı durumunun anlık görüntüsü (kendi beyanı, resmi doğrulama değil)
    isExpertVerified: !!author?.expertiseClaim,
    likeCount: 0,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };

  db.data.posts.push(newPost);
  await db.write();

  return NextResponse.json({ post: newPost }, { status: 201 });
}
