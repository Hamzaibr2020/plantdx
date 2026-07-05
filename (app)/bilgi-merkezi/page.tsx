"use client";

import { useState } from "react";
import { ARTICLES } from "@/data/articles";
import TopBar from "@/components/layout/TopBar";
import { Search, Clock, X, Sparkles, Loader2, AlertTriangle, Send } from "lucide-react";

const CATEGORIES = ["Hepsi", "Bitki", "Hastalık", "Zararlı", "Gübre", "Organik", "SSS"];

export default function BilgiMerkeziPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Hepsi");
  const [openId, setOpenId] = useState<string | null>(null);
  const [showAsk, setShowAsk] = useState(false);

  const filtered = ARTICLES.filter(
    (a) =>
      (category === "Hepsi" || a.category === category) &&
      (a.title.toLowerCase().includes(search.toLowerCase()) || a.tags.some((t) => t.includes(search.toLowerCase())))
  );

  const openArticle = ARTICLES.find((a) => a.id === openId);

  return (
    <div className="page-enter">
      <TopBar title="Bilgi Merkezi" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-4">
        <button
          onClick={() => setShowAsk(true)}
          className="glass-card p-4 flex items-center gap-3 bg-gradient-to-r from-brand-blue-500 to-brand-green-600 text-white text-left"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="font-semibold text-sm">AI'ya Soru Sor</p>
            <p className="text-xs text-white/80">Makalelerde bulamadığın bir şeyi doğrudan sor</p>
          </div>
        </button>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Makale ara..."
            className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-transparent text-sm"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-[11px] px-2.5 py-1 rounded-full ${category === c ? "bg-brand-green-600 text-white" : "bg-black/5 dark:bg-white/10"}`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          {filtered.map((a) => (
            <button key={a.id} onClick={() => setOpenId(a.id)} className="solid-card p-4 text-left">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-green-50 dark:bg-white/10 text-brand-green-700 dark:text-brand-green-400">{a.category}</span>
                <span className="text-[10px] text-foreground/40 flex items-center gap-0.5"><Clock size={10} /> {a.readMinutes} dk</span>
              </div>
              <h3 className="text-sm font-semibold">{a.title}</h3>
              <div className="flex gap-1 mt-1.5 flex-wrap">
                {a.tags.map((t) => (
                  <span key={t} className="text-[10px] text-foreground/40">#{t}</span>
                ))}
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-foreground/40 text-center py-10">Sonuç bulunamadı.</p>}
        </div>
      </div>

      {openArticle && (
        <div className="fixed inset-0 z-50 bg-background overflow-y-auto page-enter">
          <div className="sticky top-0 bg-background/90 backdrop-blur flex items-center justify-between p-4 border-b border-black/5 dark:border-white/5">
            <span className="text-xs text-foreground/40">{openArticle.category} · {openArticle.readMinutes} dk</span>
            <button onClick={() => setOpenId(null)}><X size={20} /></button>
          </div>
          <div className="p-5 max-w-2xl mx-auto">
            <h1 className="text-xl font-bold mb-4">{openArticle.title}</h1>
            <ArticleBody content={openArticle.content} />
          </div>
        </div>
      )}

      {showAsk && <AskAiModal onClose={() => setShowAsk(false)} onOpenArticle={(id) => { setOpenId(id); setShowAsk(false); }} />}
    </div>
  );
}

function AskAiModal({ onClose, onOpenArticle }: { onClose: () => void; onOpenArticle: (id: string) => void }) {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ answer: string; relatedArticles: { id: string; title: string }[] } | null>(null);

  async function ask() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/gemini/knowledge-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yanıt alınamadı.");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative solid-card w-full md:max-w-md rounded-b-none md:rounded-b-[20px] p-5 page-enter max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-1.5">
            <Sparkles size={16} className="text-brand-blue-500" /> AI'ya Sor
          </h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        <div className="flex gap-2 mb-4">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Örn: Limon ağacımın yaprakları neden sararıyor?"
            className="flex-1 rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
          />
          <button onClick={ask} disabled={loading} className="w-10 h-10 rounded-xl bg-brand-blue-500 text-white flex items-center justify-center shrink-0 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-xs text-danger-500 bg-danger-500/10 rounded-xl p-3">
            <AlertTriangle size={13} className="shrink-0 mt-0.5" /> {error}
          </div>
        )}

        {result && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-foreground/80 leading-relaxed">{result.answer}</p>
            {result.relatedArticles.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold text-foreground/40 uppercase tracking-wide mb-1.5">İlgili Makaleler</p>
                <div className="flex flex-col gap-1.5">
                  {result.relatedArticles.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => onOpenArticle(a.id)}
                      className="text-left text-xs px-3 py-2 rounded-lg bg-brand-green-50 dark:bg-white/5 text-brand-green-700 dark:text-brand-green-400"
                    >
                      {a.title}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ArticleBody({ content }: { content: string }) {
  const blocks = content.split("\n\n");
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed">
      {blocks.map((block, i) => {
        if (block.startsWith("## ")) {
          return <h2 key={i} className="text-base font-bold mt-2">{block.replace("## ", "")}</h2>;
        }
        if (block.startsWith("- ")) {
          return (
            <ul key={i} className="list-disc pl-5 flex flex-col gap-1">
              {block.split("\n").map((line, j) => (
                <li key={j}>{line.replace(/^- /, "")}</li>
              ))}
            </ul>
          );
        }
        return <p key={i} className="text-foreground/80">{block}</p>;
      })}
    </div>
  );
}
