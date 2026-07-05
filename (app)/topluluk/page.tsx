"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { ServerCommunityPost, ServerComment } from "@/lib/db/server-db";
import TopBar from "@/components/layout/TopBar";
import { Heart, MessageSquare, Plus, X, BadgeCheck, ShieldCheck, Search, Trophy, User as UserIcon, Info } from "lucide-react";

const CATEGORIES: ServerCommunityPost["category"][] = ["Soru", "İpucu", "Hastalık", "Hasat", "Sergi", "Yardım"];

type EnrichedPost = ServerCommunityPost & {
  authorReputationScore: number;
  authorIsTrustedContributor: boolean;
  authorExpertiseClaim: string | null;
};

export default function TopluluKPage() {
  const { username } = useAuth();
  const [posts, setPosts] = useState<EnrichedPost[]>([]);
  const [category, setCategory] = useState<string>("Hepsi");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [openPost, setOpenPost] = useState<EnrichedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [myProfile, setMyProfile] = useState<{ reputationScore: number; expertiseClaim: string | null; isTrustedContributor: boolean } | null>(null);

  function load() {
    const params = new URLSearchParams();
    if (category !== "Hepsi") params.set("category", category);
    if (search) params.set("q", search);
    fetch(`/api/community/posts?${params}`)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .finally(() => setLoading(false));
  }

  function loadMyProfile() {
    if (!username) return;
    fetch(`/api/community/profile?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then(setMyProfile);
  }

  useEffect(() => {
    load();
    loadMyProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, search]);

  async function toggleLike(post: EnrichedPost) {
    const res = await fetch(`/api/community/posts/${post.id}/like`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userName: username }),
    });
    const data = await res.json();
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, likeCount: data.likeCount, likedBy: data.liked ? [...p.likedBy, username!] : p.likedBy.filter((u) => u !== username) } : p)));
  }

  return (
    <div className="page-enter">
      <TopBar title="Topluluk" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-4">
        {/* Profil / itibar özeti */}
        {myProfile && (
          <button onClick={() => setShowProfile(true)} className="solid-card p-3 flex items-center gap-3 text-left">
            <div className="w-9 h-9 rounded-full bg-brand-green-600 text-white flex items-center justify-center shrink-0">
              <UserIcon size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{username}</p>
              <p className="text-[11px] text-foreground/50 flex items-center gap-1">
                İtibar: {myProfile.reputationScore}
                {myProfile.isTrustedContributor && (
                  <span className="flex items-center gap-0.5 text-brand-blue-500"><ShieldCheck size={11} /> Güvenilir Katkıcı</span>
                )}
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setShowLeaderboard(true); }} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5">
              <Trophy size={16} className="text-brand-amber-500" />
            </button>
          </button>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ara..." className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-sm" />
          </div>
          <button onClick={() => setShowForm(true)} className="w-10 h-10 rounded-xl bg-brand-green-600 text-white flex items-center justify-center shrink-0">
            <Plus size={20} />
          </button>
        </div>

        <div className="flex gap-1.5 flex-wrap">
          {["Hepsi", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`text-[11px] px-2.5 py-1 rounded-full ${category === c ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/10"}`}>
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-24 shimmer rounded-2xl" />)}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {posts.map((p) => (
              <div key={p.id} className="solid-card p-4">
                <button className="text-left w-full" onClick={() => setOpenPost(p)}>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-green-50 dark:bg-white/10 text-brand-green-700 dark:text-brand-green-400">{p.category}</span>
                    <span className="text-[11px] text-foreground/40 flex items-center gap-1">{p.authorName}</span>
                    {p.authorExpertiseClaim && (
                      <span className="flex items-center gap-0.5 text-[10px] text-brand-blue-500" title="Kendi beyanı">
                        <BadgeCheck size={11} /> {p.authorExpertiseClaim}
                      </span>
                    )}
                    {p.authorIsTrustedContributor && (
                      <span className="flex items-center gap-0.5 text-[10px] text-brand-amber-600">
                        <ShieldCheck size={11} /> Güvenilir Katkıcı
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold">{p.title}</h3>
                  <p className="text-xs text-foreground/60 mt-1 line-clamp-2">{p.body}</p>
                </button>
                <div className="flex items-center gap-4 mt-3">
                  <button onClick={() => toggleLike(p)} className="flex items-center gap-1 text-xs text-foreground/50">
                    <Heart size={14} className={p.likedBy.includes(username ?? "") ? "fill-danger-500 text-danger-500" : ""} /> {p.likeCount}
                  </button>
                  <button onClick={() => setOpenPost(p)} className="flex items-center gap-1 text-xs text-foreground/50">
                    <MessageSquare size={14} /> Yorumlar
                  </button>
                </div>
              </div>
            ))}
            {posts.length === 0 && <p className="text-sm text-foreground/40 text-center py-10">Sonuç bulunamadı.</p>}
          </div>
        )}
      </div>

      {showForm && <NewPostForm onClose={() => { setShowForm(false); load(); }} authorName={username ?? ""} />}
      {openPost && (
        <PostDetail
          post={openPost}
          authorName={username ?? ""}
          onClose={() => { setOpenPost(null); load(); }}
        />
      )}
      {showProfile && myProfile && (
        <ProfileModal
          username={username ?? ""}
          profile={myProfile}
          onClose={() => { setShowProfile(false); loadMyProfile(); load(); }}
        />
      )}
      {showLeaderboard && <LeaderboardModal onClose={() => setShowLeaderboard(false)} />}
    </div>
  );
}

function ProfileModal({
  username, profile, onClose,
}: {
  username: string;
  profile: { reputationScore: number; expertiseClaim: string | null; isTrustedContributor: boolean };
  onClose: () => void;
}) {
  const [claim, setClaim] = useState(profile.expertiseClaim ?? "");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch("/api/community/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, expertiseClaim: claim.trim() || null }),
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative solid-card w-full md:max-w-sm rounded-b-none md:rounded-b-[20px] p-5 page-enter">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Topluluk Profilim</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="solid-card p-3 flex flex-col items-center">
            <span className="text-xl font-bold text-brand-green-600">{profile.reputationScore}</span>
            <span className="text-[10px] text-foreground/50">İtibar Puanı</span>
          </div>
          <div className="solid-card p-3 flex flex-col items-center">
            <span className={`text-xl font-bold ${profile.isTrustedContributor ? "text-brand-blue-500" : "text-foreground/30"}`}>
              {profile.isTrustedContributor ? "✓" : "—"}
            </span>
            <span className="text-[10px] text-foreground/50 text-center">Güvenilir Katkıcı</span>
          </div>
        </div>

        <label className="text-xs text-foreground/50">Uzmanlık/Deneyim Beyanı (opsiyonel)</label>
        <input
          value={claim}
          onChange={(e) => setClaim(e.target.value)}
          placeholder="ör: Ziraat Mühendisi, 10 yıllık çiftçi"
          className="w-full mt-1 mb-2 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
        />
        <div className="flex items-start gap-2 text-[11px] text-foreground/40 bg-black/5 dark:bg-white/5 rounded-lg p-2.5 mb-4">
          <Info size={12} className="shrink-0 mt-0.5" />
          Bu alan tamamen kendi beyanındır. PlantDX bunu bir diploma/lisans karşısında doğrulamaz;
          gönderilerinde her zaman "kendi beyanı" olarak gösterilir. Gerçek "Güvenilir Katkıcı"
          rozeti ise topluluktan aldığın beğeni/yorum etkileşimine göre otomatik hesaplanır.
        </div>

        <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl bg-brand-green-600 text-white text-sm font-medium disabled:opacity-50">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

function LeaderboardModal({ onClose }: { onClose: () => void }) {
  const [leaderboard, setLeaderboard] = useState<{ username: string; reputationScore: number; expertiseClaim: string | null; isTrustedContributor: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/community/leaderboard")
      .then((r) => r.json())
      .then((d) => setLeaderboard(d.leaderboard ?? []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative solid-card w-full md:max-w-sm rounded-b-none md:rounded-b-[20px] p-5 page-enter max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-1.5"><Trophy size={16} className="text-brand-amber-500" /> En Çok Katkı Sağlayanlar</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-2">{[1, 2, 3].map((i) => <div key={i} className="h-12 shimmer rounded-xl" />)}</div>
        ) : leaderboard.length === 0 ? (
          <p className="text-sm text-foreground/40 text-center py-6">Henüz itibar puanı kazanan olmadı.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {leaderboard.map((u, i) => (
              <div key={u.username} className="flex items-center gap-3 solid-card p-2.5">
                <span className="w-6 text-center text-sm font-bold text-foreground/40">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.username}</p>
                  {u.expertiseClaim && <p className="text-[10px] text-brand-blue-500">{u.expertiseClaim}</p>}
                </div>
                {u.isTrustedContributor && <ShieldCheck size={14} className="text-brand-amber-500 shrink-0" />}
                <span className="text-sm font-bold text-brand-green-600 shrink-0">{u.reputationScore}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function NewPostForm({ onClose, authorName }: { onClose: () => void; authorName: string }) {
  const [category, setCategory] = useState<ServerCommunityPost["category"]>("Soru");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    await fetch("/api/community/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, title, body, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), authorName }),
    });
    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative solid-card w-full md:max-w-md rounded-b-none md:rounded-b-[20px] p-5 page-enter">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Yeni Paylaşım</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value as ServerCommunityPost["category"])} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Başlık" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="İçerik" rows={4} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Etiketler (virgülle ayır)" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          <button onClick={save} disabled={saving} className="w-full py-2.5 rounded-xl bg-brand-green-600 text-white text-sm font-medium disabled:opacity-50">
            {saving ? "Paylaşılıyor..." : "Paylaş"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PostDetail({ post, authorName, onClose }: { post: EnrichedPost; authorName: string; onClose: () => void }) {
  const [comments, setComments] = useState<ServerComment[]>([]);
  const [text, setText] = useState("");

  function loadComments() {
    fetch(`/api/community/comments?postId=${post.id}`).then((r) => r.json()).then((d) => setComments(d.comments ?? []));
  }

  useEffect(() => { loadComments(); }, [post.id]);

  async function send() {
    if (!text.trim()) return;
    await fetch("/api/community/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, authorName, body: text }),
    });
    setText("");
    loadComments();
  }

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto page-enter">
      <div className="sticky top-0 bg-background/90 backdrop-blur flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
        <span className="text-xs text-foreground/40">{post.category}</span>
        <button onClick={onClose}><X size={20} /></button>
      </div>
      <div className="p-5 max-w-2xl mx-auto flex flex-col gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-foreground/40 mb-1 flex-wrap">
            {post.authorName}
            {post.authorExpertiseClaim && (
              <span className="flex items-center gap-0.5 text-brand-blue-500"><BadgeCheck size={12} /> {post.authorExpertiseClaim}</span>
            )}
            {post.authorIsTrustedContributor && (
              <span className="flex items-center gap-0.5 text-brand-amber-600"><ShieldCheck size={12} /> Güvenilir Katkıcı</span>
            )}
          </div>
          <h1 className="text-lg font-bold mb-2">{post.title}</h1>
          <p className="text-sm text-foreground/80 whitespace-pre-wrap">{post.body}</p>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Yorumlar ({comments.length})</h3>
          {comments.map((c) => (
            <div key={c.id} className="solid-card p-3">
              <p className="text-xs font-medium mb-1">{c.authorName}</p>
              <p className="text-sm text-foreground/80">{c.body}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="text-xs text-foreground/40">Henüz yorum yok.</p>}
        </div>

        <div className="flex gap-2 sticky bottom-3">
          <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Yorum yaz..." className="flex-1 rounded-full border border-black/10 dark:border-white/10 bg-background px-4 py-2.5 text-sm" />
          <button onClick={send} className="px-4 rounded-full bg-brand-green-600 text-white text-sm font-medium">Gönder</button>
        </div>
      </div>
    </div>
  );
}
