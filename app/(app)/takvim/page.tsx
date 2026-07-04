"use client";

import { useState, useEffect } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db, CalendarTask } from "@/lib/db/schema";
import { grantXp } from "@/lib/utils/gamification";
import { useSettings } from "@/lib/context/settings-context";
import { TURKEY_PROVINCES } from "@/data/turkey-provinces";
import TopBar from "@/components/layout/TopBar";
import {
  Plus, CheckCircle2, Circle, Trash2, AlertTriangle, X, Sparkles, Loader2,
  CloudRain, LayoutGrid, Rows3, ChevronLeft, ChevronRight as ChevronRightIcon,
} from "lucide-react";

const TASK_TYPES: CalendarTask["type"][] = ["Sulama", "Gübreleme", "İlaçlama", "Budama", "Hasat", "Saksı Değişimi", "Kontrol"];
const PRIORITIES: CalendarTask["priority"][] = ["Normal", "Yüksek", "Acil"];

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}
function getSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "İlkbahar";
  if (m >= 6 && m <= 8) return "Yaz";
  if (m >= 9 && m <= 11) return "Sonbahar";
  return "Kış";
}

export default function TakvimPage() {
  const [selectedDate, setSelectedDate] = useState(toISODate(new Date()));
  const [showForm, setShowForm] = useState(false);
  const [showAiPlan, setShowAiPlan] = useState(false);
  const [view, setView] = useState<"strip" | "month">("strip");
  const [monthCursor, setMonthCursor] = useState(new Date());
  const { settings } = useSettings();

  const plants = useLiveQuery(() => db.plants.toArray(), []) ?? [];
  const allTasks = useLiveQuery(() => db.calendarTasks.toArray(), []) ?? [];

  const [rainTomorrow, setRainTomorrow] = useState<number | null>(null);
  useEffect(() => {
    const coords = TURKEY_PROVINCES.find((p) => p.name === settings.province);
    if (!coords) return;
    fetch(`/api/weather?lat=${coords.lat}&lon=${coords.lon}`)
      .then((r) => r.json())
      .then((d) => {
        const tomorrow = d.dailyForecast?.[1];
        if (tomorrow) setRainTomorrow(tomorrow.totalRain);
      })
      .catch(() => {});
  }, [settings.province]);

  const strip = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 3 + i);
    return d;
  });

  const dayTasks = allTasks.filter((t) => t.dueDate === selectedDate);
  const overdueTasks = allTasks.filter((t) => !t.completed && t.dueDate < toISODate(new Date()));
  const completedToday = dayTasks.filter((t) => t.completed).length;
  const completionPct = dayTasks.length ? Math.round((completedToday / dayTasks.length) * 100) : 0;

  const tomorrowIso = toISODate(new Date(Date.now() + 86400000));
  const waterTasksAffectedByRain = allTasks.filter(
    (t) => !t.completed && t.type === "Sulama" && (t.dueDate === toISODate(new Date()) || t.dueDate === tomorrowIso)
  );

  async function toggleComplete(task: CalendarTask) {
    await db.calendarTasks.update(task.id!, {
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : null,
    });
    if (!task.completed) {
      await grantXp(8);
      if (task.isRecurring && task.recurrenceDays) {
        const next = new Date(task.dueDate);
        next.setDate(next.getDate() + task.recurrenceDays);
        await db.calendarTasks.add({ ...task, id: undefined, dueDate: toISODate(next), completed: false, completedAt: null, createdAt: new Date().toISOString() });
      }
    }
  }

  async function deleteTask(id: number) {
    await db.calendarTasks.delete(id);
  }

  async function postponeWateringDueToRain() {
    for (const t of waterTasksAffectedByRain) {
      const next = new Date(t.dueDate);
      next.setDate(next.getDate() + 2);
      await db.calendarTasks.update(t.id!, { dueDate: toISODate(next) });
    }
  }

  // Ay görünümü için grid hesaplama
  const monthStart = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
  const monthEnd = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
  const startWeekday = (monthStart.getDay() + 6) % 7; // Pazartesi=0
  const monthDays: (Date | null)[] = [
    ...Array(startWeekday).fill(null),
    ...Array.from({ length: monthEnd.getDate() }, (_, i) => new Date(monthCursor.getFullYear(), monthCursor.getMonth(), i + 1)),
  ];

  return (
    <div className="page-enter">
      <TopBar title="Akıllı Takvim" />
      <div className="p-4 md:p-6 max-w-2xl mx-auto flex flex-col gap-4">
        {overdueTasks.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-danger-500 bg-danger-500/10 rounded-xl p-3">
            <AlertTriangle size={14} /> {overdueTasks.length} gecikmiş görevin var.
          </div>
        )}

        {rainTomorrow !== null && rainTomorrow > 2 && waterTasksAffectedByRain.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-brand-blue-600 bg-brand-blue-500/10 rounded-xl p-3">
            <CloudRain size={14} className="shrink-0" />
            <span className="flex-1">
              Yarın {rainTomorrow}mm yağış bekleniyor — {waterTasksAffectedByRain.length} sulama görevini
              erteleyebilirsin.
            </span>
            <button onClick={postponeWateringDueToRain} className="shrink-0 underline font-medium">
              Ertele
            </button>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex rounded-full solid-card p-1">
            <button onClick={() => setView("strip")} className={`p-1.5 rounded-full ${view === "strip" ? "bg-brand-green-600 text-white" : "text-foreground/50"}`}>
              <Rows3 size={14} />
            </button>
            <button onClick={() => setView("month")} className={`p-1.5 rounded-full ${view === "month" ? "bg-brand-green-600 text-white" : "text-foreground/50"}`}>
              <LayoutGrid size={14} />
            </button>
          </div>
          <button
            onClick={() => setShowAiPlan(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-gradient-to-r from-brand-green-600 to-brand-blue-500 text-white"
          >
            <Sparkles size={13} /> AI Bakım Planı Oluştur
          </button>
        </div>

        {view === "strip" ? (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {strip.map((d) => {
              const iso = toISODate(d);
              const active = iso === selectedDate;
              const hasTask = allTasks.some((t) => t.dueDate === iso);
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  className={`shrink-0 flex flex-col items-center gap-1 w-12 py-2 rounded-xl ${
                    active ? "bg-brand-green-600 text-white" : "solid-card"
                  }`}
                >
                  <span className="text-[10px]">{d.toLocaleDateString("tr-TR", { weekday: "short" })}</span>
                  <span className="text-sm font-bold">{d.getDate()}</span>
                  {hasTask && <span className={`w-1 h-1 rounded-full ${active ? "bg-white" : "bg-brand-green-500"}`} />}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="solid-card p-3">
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}>
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm font-semibold">
                {monthCursor.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })}
              </span>
              <button onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}>
                <ChevronRightIcon size={16} />
              </button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-foreground/40 mb-1">
              {["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"].map((d) => <span key={d}>{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((d, i) => {
                if (!d) return <div key={i} />;
                const iso = toISODate(d);
                const count = allTasks.filter((t) => t.dueDate === iso && !t.completed).length;
                const active = iso === selectedDate;
                return (
                  <button
                    key={iso}
                    onClick={() => { setSelectedDate(iso); setView("strip"); }}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative ${
                      active ? "bg-brand-green-600 text-white" : "hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {d.getDate()}
                    {count > 0 && (
                      <span className={`absolute bottom-0.5 w-1 h-1 rounded-full ${active ? "bg-white" : "bg-brand-green-500"}`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">
            {new Date(selectedDate).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })} · %{completionPct} tamamlandı
          </h3>
          <button onClick={() => setShowForm(true)} className="w-8 h-8 rounded-full bg-brand-green-600 text-white flex items-center justify-center">
            <Plus size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {dayTasks.length === 0 ? (
            <p className="text-sm text-foreground/40 py-6 text-center">Bu gün için görev yok.</p>
          ) : (
            dayTasks.map((t) => (
              <div key={t.id} className="solid-card p-3 flex items-center gap-3">
                <button onClick={() => toggleComplete(t)}>
                  {t.completed ? <CheckCircle2 className="text-ok-500" size={20} /> : <Circle className="text-foreground/30" size={20} />}
                </button>
                <div className="flex-1">
                  <p className={`text-sm ${t.completed ? "line-through text-foreground/40" : "font-medium"}`}>{t.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand-green-50 dark:bg-white/10 text-brand-green-700 dark:text-brand-green-400">{t.type}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        t.priority === "Acil" ? "bg-danger-500/15 text-danger-500" : t.priority === "Yüksek" ? "bg-warn-500/15 text-warn-500" : "bg-black/5 dark:bg-white/10 text-foreground/50"
                      }`}
                    >
                      {t.priority}
                    </span>
                  </div>
                </div>
                <button onClick={() => deleteTask(t.id!)}>
                  <Trash2 size={15} className="text-foreground/30" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && <TaskForm date={selectedDate} plants={plants} onClose={() => setShowForm(false)} />}
      {showAiPlan && (
        <AiPlanModal
          plants={plants}
          province={settings.province}
          onClose={() => setShowAiPlan(false)}
        />
      )}
    </div>
  );
}

function AiPlanModal({
  plants,
  province,
  onClose,
}: {
  plants: { id?: number; name: string; category: string; species: string | null }[];
  province: string;
  onClose: () => void;
}) {
  const [plantId, setPlantId] = useState<number | "">(plants[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [plan, setPlan] = useState<{
    tasks: { type: CalendarTask["type"]; title: string; dueOffsetDays: number; priority: CalendarTask["priority"]; isRecurring: boolean; recurrenceDays: number }[];
    planSummary: string;
  } | null>(null);
  const [applied, setApplied] = useState(false);

  async function generate() {
    const plant = plants.find((p) => p.id === plantId);
    if (!plant) return;
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/gemini/calendar-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantName: plant.name,
          category: plant.category,
          species: plant.species,
          season: getSeason(),
          province,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Plan üretilemedi.");
      setPlan(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function applyPlan() {
    if (!plan) return;
    const today = new Date();
    for (const t of plan.tasks) {
      const due = new Date(today);
      due.setDate(due.getDate() + t.dueOffsetDays);
      await db.calendarTasks.add({
        plantId: typeof plantId === "number" ? plantId : null,
        type: t.type,
        title: t.title,
        dueDate: toISODate(due),
        priority: t.priority,
        isRecurring: t.isRecurring,
        recurrenceDays: t.isRecurring ? t.recurrenceDays : null,
        completed: false,
        completedAt: null,
        createdAt: new Date().toISOString(),
      });
    }
    setApplied(true);
    setTimeout(onClose, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative solid-card w-full md:max-w-md rounded-b-none md:rounded-b-[20px] p-5 page-enter max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-1.5">
            <Sparkles size={16} className="text-brand-green-600" /> AI Bakım Planı Oluştur
          </h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>

        {plants.length === 0 ? (
          <p className="text-sm text-foreground/50">
            Plan oluşturmak için önce "Benim Bahçem" bölümüne bir bitki eklemelisin.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <select
              value={plantId}
              onChange={(e) => { setPlantId(Number(e.target.value)); setPlan(null); }}
              className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm"
            >
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>

            {!plan && !loading && (
              <button onClick={generate} className="w-full py-2.5 rounded-xl bg-brand-green-600 text-white text-sm font-medium">
                60 Günlük Plan Üret
              </button>
            )}

            {loading && (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-foreground/50">
                <Loader2 size={16} className="animate-spin" /> Bitkine özel plan hazırlanıyor...
              </div>
            )}

            {error && <p className="text-xs text-danger-500">{error}</p>}

            {plan && (
              <>
                <p className="text-xs text-foreground/60 italic">{plan.planSummary}</p>
                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                  {plan.tasks.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs solid-card p-2">
                      <span className="w-6 h-6 rounded-full bg-brand-green-50 dark:bg-white/10 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {t.dueOffsetDays}g
                      </span>
                      <span className="flex-1">{t.title}</span>
                      <span className="text-[10px] text-foreground/40">{t.type}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={applyPlan}
                  disabled={applied}
                  className="w-full py-2.5 rounded-xl bg-brand-green-600 text-white text-sm font-medium disabled:opacity-50"
                >
                  {applied ? "Takvime Eklendi ✓" : `${plan.tasks.length} Görevi Takvime Ekle`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskForm({
  date,
  plants,
  onClose,
}: {
  date: string;
  plants: { id?: number; name: string }[];
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<CalendarTask["type"]>("Sulama");
  const [priority, setPriority] = useState<CalendarTask["priority"]>("Normal");
  const [plantId, setPlantId] = useState<number | "">("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceDays, setRecurrenceDays] = useState(7);

  async function save() {
    if (!title.trim()) return;
    await db.calendarTasks.add({
      plantId: plantId === "" ? null : Number(plantId),
      type,
      title: title.trim(),
      dueDate: date,
      priority,
      isRecurring,
      recurrenceDays: isRecurring ? recurrenceDays : null,
      completed: false,
      completedAt: null,
      createdAt: new Date().toISOString(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative solid-card w-full md:max-w-sm rounded-b-none md:rounded-b-[20px] p-5 page-enter">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Yeni Görev</h3>
          <button onClick={onClose}><X size={18} /></button>
        </div>
        <div className="flex flex-col gap-3">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Görev başlığı" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          <select value={type} onChange={(e) => setType(e.target.value as CalendarTask["type"])} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
            {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={priority} onChange={(e) => setPriority(e.target.value as CalendarTask["priority"])} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          {plants.length > 0 && (
            <select value={plantId} onChange={(e) => setPlantId(e.target.value ? Number(e.target.value) : "")} className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm">
              <option value="">Bitki seçme (opsiyonel)</option>
              {plants.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
            Tekrarlayan görev
          </label>
          {isRecurring && (
            <input type="number" min={1} value={recurrenceDays} onChange={(e) => setRecurrenceDays(Number(e.target.value))} placeholder="Kaç günde bir" className="w-full rounded-xl border border-black/10 dark:border-white/10 bg-transparent px-3 py-2 text-sm" />
          )}
          <button onClick={save} className="mt-2 w-full py-2.5 rounded-xl bg-brand-green-600 text-white text-sm font-medium">Kaydet</button>
        </div>
      </div>
    </div>
  );
}
