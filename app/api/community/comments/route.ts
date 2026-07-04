import { NextRequest, NextResponse } from "next/server";
import { getServerDb, ServerComment, addReputation } from "@/lib/db/server-db";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const db = await getServerDb();
  const postId = req.nextUrl.searchParams.get("postId");
  if (!postId) return NextResponse.json({ error: "postId gerekli." }, { status: 400 });

  const comments = db.data.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return NextResponse.json({ comments });
}

export async function POST(req: NextRequest) {
  const db = await getServerDb();
  const body = (await req.json()) as Pick<ServerComment, "postId" | "authorName" | "body">;

  if (!body.postId || !body.body?.trim() || !body.authorName?.trim()) {
    return NextResponse.json({ error: "postId, isim ve yorum metni zorunludur." }, { status: 400 });
  }

  const postExists = db.data.posts.some((p) => p.id === body.postId);
  if (!postExists) return NextResponse.json({ error: "Gönderi bulunamadı." }, { status: 404 });

  const newComment: ServerComment = {
    id: randomUUID(),
    postId: body.postId,
    authorName: body.authorName.trim(),
    body: body.body.trim(),
    createdAt: new Date().toISOString(),
  };

  db.data.comments.push(newComment);
  addReputation(db, newComment.authorName, 1); // gerçek katkı = küçük itibar puanı
  await db.write();

  return NextResponse.json({ comment: newComment }, { status: 201 });
}
