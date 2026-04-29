"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, List, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Entry = {
  id: string;
  entry_date: string;
  title: string | null;
  bias: "Bullish" | "Bearish" | "Neutral" | null;
  mood: "great" | "good" | "neutral" | "bad" | "terrible" | null;
  rating: number | null;
  plan: string | null;
  notes: string | null;
  setups: string[] | null;
  sessions: string[] | null;
  rules_followed: boolean | null;
  improvement: string | null;
  tags: string[] | null;
};
type TradeMini = { trade_date: string; pnl: number; commission: number };

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const BIASES: ("Bullish" | "Bearish" | "Neutral")[] = ["Bullish","Bearish","Neutral"];
const MOODS: ("great" | "good" | "neutral" | "bad" | "terrible")[] = ["great","good","neutral","bad","terrible"];
const MOOD_LABELS = { great: "Great", good: "Good", neutral: "Neutral", bad: "Bad", terrible: "Terrible" };
const SETUP_TAGS = ["Trend Follow","VWAP Reclaim","Opening Range","Supply/Demand","Breakout","Mean Reversion","Liquidity Sweep","Fair Value Gap","News Play","Scalp"];
const SESSION_TAGS = ["London","NY Open","NY AM","NY PM","Asia"];

export function CalendarClient({ initialEntries, trades }: { initialEntries: Entry[]; trades: TradeMini[] }) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [view, setView] = useState<"cal" | "list">("cal");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const entryByDate = useMemo(() => {
    const m: Record<string, Entry> = {};
    entries.forEach((e) => { m[e.entry_date] = e; });
    return m;
  }, [entries]);

  const pnlByDate = useMemo(() => {
    const m: Record<string, number> = {};
    trades.forEach((t) => { m[t.trade_date] = (m[t.trade_date] ?? 0) + (t.pnl - t.commission); });
    return m;
  }, [trades]);

  function nav(dir: number) {
    let m = month + dir, y = year;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setMonth(m); setYear(y);
  }
  function goToday() { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); }

  function openEntry(date: string) {
    const existing = entryByDate[date];
    setEditing(existing ?? { id: "", entry_date: date, title: null, bias: null, mood: null, rating: null, plan: null, notes: null, setups: [], sessions: [], rules_followed: null, improvement: null, tags: [] } as Entry);
    setEditorOpen(true);
  }

  async function saveEntry() {
    if (!editing) return;
    const res = await fetch("/api/journal-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editing),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Failed to save"); return; }
    setEntries([data.entry, ...entries.filter((e) => e.id !== data.entry.id && e.entry_date !== data.entry.entry_date)]);
    setEditorOpen(false);
    toast.success("Journal entry saved!");
    router.refresh();
  }

  async function deleteEntry() {
    if (!editing?.id) return;
    if (!confirm("Delete this journal entry?")) return;
    const res = await fetch("/api/journal-entries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editing.id }),
    });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setEntries(entries.filter((e) => e.id !== editing.id));
    setEditorOpen(false);
    toast.success("Entry deleted");
    router.refresh();
  }

  // Calendar grid generation
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const today = new Date().toISOString().split("T")[0];
  const cells: { day: number; cur: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: prevDays - firstDay + i + 1, cur: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, cur: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - firstDay - daysInMonth + 1, cur: false });

  const sortedList = [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date));

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Playbook Journal</h1>
          <p className="text-sm text-muted-foreground">Daily reflections and trading log</p>
        </div>
        <div className="flex gap-2">
          <Button variant={view === "cal" ? "default" : "outline"} size="sm" onClick={() => setView("cal")}><CalendarIcon className="mr-1 h-4 w-4" />Calendar</Button>
          <Button variant={view === "list" ? "default" : "outline"} size="sm" onClick={() => setView("list")}><List className="mr-1 h-4 w-4" />List</Button>
          <Button size="sm" onClick={() => openEntry(today)}><Plus className="mr-1 h-4 w-4" />New Entry</Button>
        </div>
      </div>

      {view === "cal" && (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">{MONTHS[month]} {year}</CardTitle>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" onClick={() => nav(-1)}><ChevronLeft className="h-4 w-4" />Prev</Button>
              <Button size="sm" variant="outline" onClick={goToday}>Today</Button>
              <Button size="sm" variant="outline" onClick={() => nav(1)}>Next<ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DOW.map((d) => <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((c, i) => {
                const dateStr = c.cur ? `${year}-${String(month + 1).padStart(2, "0")}-${String(c.day).padStart(2, "0")}` : "";
                const e = dateStr ? entryByDate[dateStr] : null;
                const pnl = dateStr ? pnlByDate[dateStr] : null;
                const isToday = dateStr === today;
                const moodColor = e?.mood === "great" ? "bg-green-500/15 text-green-600" : e?.mood === "good" ? "bg-blue-500/15 text-blue-500" : e?.mood === "bad" || e?.mood === "terrible" ? "bg-red-500/15 text-red-500" : "bg-amber-500/15 text-amber-600";
                return (
                  <button
                    key={i}
                    onClick={() => c.cur && openEntry(dateStr)}
                    disabled={!c.cur}
                    className={cn(
                      "flex min-h-[60px] flex-col rounded-md border p-1.5 text-left transition-colors md:min-h-[90px] md:p-2",
                      c.cur ? "hover:border-primary hover:bg-primary/5 cursor-pointer" : "opacity-30 cursor-default",
                      isToday && "border-primary bg-primary/5",
                      e && "border-primary/40",
                    )}
                  >
                    <div className={cn("text-[11px] font-semibold mb-1", isToday && "text-primary")}>{c.day}</div>
                    {e && <div className={cn("rounded px-1 py-0.5 text-[9px] font-semibold mb-0.5 truncate", moodColor)}>{e.bias ? `${e.bias} · ` : ""}{e.title || "Entry"}</div>}
                    {pnl != null && <div className={cn("mt-auto text-[10px] font-bold", pnl >= 0 ? "text-green-500" : "text-red-500")}>{pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}</div>}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {view === "list" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">All Entries</CardTitle></CardHeader>
          <CardContent>
            {sortedList.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No journal entries yet — click "New Entry" to start</div>
            ) : (
              <div className="space-y-2">
                {sortedList.map((e) => {
                  const moodIcon = e.mood === "great" ? "🟢" : e.mood === "good" ? "🔵" : e.mood === "bad" ? "🟠" : e.mood === "terrible" ? "🔴" : e.mood === "neutral" ? "🟡" : "⚪";
                  return (
                    <button key={e.id} onClick={() => openEntry(e.entry_date)} className="w-full rounded-md border p-3 text-left hover:border-primary hover:bg-primary/5">
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-bold">{e.entry_date} <span className="text-xs font-normal text-muted-foreground">{moodIcon} {e.mood ?? ""}</span></div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {e.bias && <Badge variant={e.bias === "Bullish" ? "success" : e.bias === "Bearish" ? "destructive" : "warning"}>{e.bias}</Badge>}
                          {e.rating != null && <span className="text-xs text-amber-500">{"★".repeat(e.rating)}{"☆".repeat(5 - e.rating)}</span>}
                        </div>
                      </div>
                      {e.title && <div className="mt-1 text-sm font-medium">{e.title}</div>}
                      {(e.notes || e.plan) && <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{e.notes || e.plan}</div>}
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit" : "New"} Journal Entry — {editing?.entry_date}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wide">Title</Label>
                <Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} placeholder="e.g. Strong NFP reaction — caught the move" />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide">Bias</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {BIASES.map((b) => (
                      <button
                        key={b}
                        onClick={() => setEditing({ ...editing, bias: editing.bias === b ? null : b })}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs font-medium",
                          editing.bias === b
                            ? b === "Bullish" ? "border-green-500 bg-green-500/15 text-green-500"
                            : b === "Bearish" ? "border-red-500 bg-red-500/15 text-red-500"
                            : "border-amber-500 bg-amber-500/15 text-amber-500"
                            : "border-input text-muted-foreground hover:border-primary hover:text-primary",
                        )}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide">Mood</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOODS.map((m) => (
                      <button
                        key={m}
                        onClick={() => setEditing({ ...editing, mood: editing.mood === m ? null : m })}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs font-medium",
                          editing.mood === m ? "border-primary bg-primary/15 text-primary" : "border-input text-muted-foreground hover:border-primary",
                        )}
                      >
                        {MOOD_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide">Rating</Label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button key={n} onClick={() => setEditing({ ...editing, rating: editing.rating === n ? null : n })} className="text-2xl leading-none">
                        <span className={n <= (editing.rating ?? 0) ? "text-amber-500" : "text-muted"}>★</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <TagSection label="Setups Traded" tags={SETUP_TAGS} value={editing.setups ?? []} onChange={(v) => setEditing({ ...editing, setups: v })} />
              <TagSection label="Sessions Traded" tags={SESSION_TAGS} value={editing.sessions ?? []} onChange={(v) => setEditing({ ...editing, sessions: v })} />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide">Pre-Market Plan</Label>
                  <Textarea value={editing.plan ?? ""} onChange={(e) => setEditing({ ...editing, plan: e.target.value })} placeholder="Key levels, bias reasoning, setups to watch..." rows={4} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide">Post-Session Notes</Label>
                  <Textarea value={editing.notes ?? ""} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} placeholder="What happened, mistakes, what you did well..." rows={4} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide">Rules Followed?</Label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing({ ...editing, rules_followed: editing.rules_followed === true ? null : true })}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm font-medium",
                        editing.rules_followed === true ? "border-green-500 bg-green-500/15 text-green-500" : "border-input text-muted-foreground hover:border-primary",
                      )}
                    >Yes ✓</button>
                    <button
                      onClick={() => setEditing({ ...editing, rules_followed: editing.rules_followed === false ? null : false })}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm font-medium",
                        editing.rules_followed === false ? "border-red-500 bg-red-500/15 text-red-500" : "border-input text-muted-foreground hover:border-primary",
                      )}
                    >No ✗</button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide">Improvement Focus</Label>
                  <Input value={editing.improvement ?? ""} onChange={(e) => setEditing({ ...editing, improvement: e.target.value })} placeholder="One thing to improve tomorrow..." />
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="flex sm:justify-between">
            {editing?.id && <Button variant="destructive" size="sm" onClick={deleteEntry}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete</Button>}
            <div className="flex gap-2 sm:ml-auto">
              <Button variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button onClick={saveEntry}>Save Entry</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TagSection({ label, tags, value, onChange }: { label: string; tags: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-wide">{label}</Label>
      <div className="flex flex-wrap gap-1.5">
        {tags.map((t) => {
          const on = value.includes(t);
          return (
            <button
              key={t}
              onClick={() => onChange(on ? value.filter((x) => x !== t) : [...value, t])}
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs font-medium",
                on ? "border-primary bg-primary/15 text-primary" : "border-input text-muted-foreground hover:border-primary",
              )}
            >
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}
