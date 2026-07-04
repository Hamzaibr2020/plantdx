import { NextRequest, NextResponse } from "next/server";
import { getServerDb, addReputation } from "@/lib/db/server-db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await getServerDb();
  const { userName } = (await req.json()) as { userName: string };

  const post = db.data.posts.find((p) => p.id === id);
  if (!post) return NextResponse.json({ error: "Gönderi bulunamadı." }, { status: 404 });

  const alreadyLiked = post.likedBy.includes(userName);
  if (alreadyLiked) {
    post.likedBy = post.likedBy.filter((u) => u !== userName);
    post.likeCount = Math.max(0, post.likeCount - 1);
    addReputation(db, post.authorName, -2); // beğeni geri alındı
  } else {
    post.likedBy.push(userName);
    post.likeCount += 1;
    addReputation(db, post.authorName, 2); // gerçek bir beğeni = itibar puanı
  }

  await db.write();
  return NextResponse.json({ likeCount: post.likeCount, liked: !alreadyLiked });
}
