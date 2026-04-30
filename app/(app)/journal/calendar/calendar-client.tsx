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
import { ChevronLeft, ChevronRight, Plus, List, Trash2, Flame, BookOpen, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Entry = {
  id: string; entry_date: string; title: string | null;
  bias: "Bullish" | "Bearish" | "Neutral" | null;
  mood: "great" | "good" | "neutral" | "bad" | "terrible" | null;
  rating: number | null; plan: string | null; notes: string | null;
  setups: string[] | null; sessions: string[] | null;
  rules_followed: boolean | null; improvement: string | null; tags: string[] | null;
};
type TradeMini = { trade_date: string; pnl: number; commission: number };
type DayStats = { pnl: number; count: number };

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const BIASES: ("Bullish" | "Bearish" | "Neutral")[] = ["Bullish","Bearish","Neutral"];
const MOODS: ("great" | "good" | "neutral" | "bad" | "terrible")[] = ["great","good","neutral","bad","terrible"];
const MOOD_LABELS = { great:"Great", good:"Good", neutral:"Neutral", bad:"Bad", terrible:"Terrible" };
const SETUP_TAGS = ["Trend Follow","VWAP Reclaim","Opening Range","Supply/Demand","Breakout","Mean Reversion","Liquidity Sweep","Fair Value Gap","News Play","Scalp"];
const SESSION_TAGS = ["London","NY Open","NY AM","NY PM","Asia"];

function calcStreak(entries: Entry[]): number {
  const dates = new Set(entries.map((e) => e.entry_date));
  let streak = 0;
  const d = new Date();
  const todayStr = d.toISOString().split("T")[0];
  d.setDate(d.getDate() - (dates.has(todayStr) ? 0 : 1));
  while (true) {
    const s = d.toISOString().split("T")[0];
    if (!dates.has(s)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function fmtPnlCents(pnl: number): string {
  const sign = pnl >= 0 ? "+" : "-";
  return sign + "$" + Math.abs(pnl).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CalendarClient({ initialEntries, trades }: { initialEntries: Entry[]; trades: TradeMini[] }) {
  const router = useRouter();
  const [entries, setEntries] = useState(initialEntries);
  const [view, setView] = useState<"cal" | "list">("cal");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [editing, setEditing] = useState<Entry | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const entryByDate = useMemo(() => { const m: Record<string, Entry> = {}; entries.forEach((e) => { m[e.entry_date] = e; }); return m; }, [entries]);
  const statsByDate = useMemo(() => {
    const m: Record<string, DayStats> = {};
    trades.forEach((t) => {
      if (!m[t.trade_date]) m[t.trade_date] = { pnl: 0, count: 0 };
      m[t.trade_date].pnl += t.pnl - t.commission;
      m[t.trade_date].count += 1;
    });
    return m;
  }, [trades]);
  const sortedList = useMemo(() => [...entries].sort((a, b) => b.entry_date.localeCompare(a.entry_date)), [entries]);

  const streak = useMemo(() => calcStreak(entries), [entries]);
  const daysJournaled = entries.length;
  const thisMonthEntries = entries.filter((e) => e.entry_date.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)).length;

  const today = new Date().toISOString().split("T")[0];
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: { day: number; cur: boolean }[] = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: prevDays - firstDay + i + 1, cur: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, cur: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - firstDay - daysInMonth + 1, cur: false });

  function openEntry(dateStr: string) {
    const existing = entryByDate[dateStr];
    setEditing(existing ?? { id: "", entry_date: dateStr, title: null, bias: null, mood: null, rating: null, plan: null, notes: null, setups: [], sessions: [], rules_followed: null, improvement: null, tags: [] });
    setEditorOpen(true);
  }

  async function saveEntry() {
    if (!editing) return;
    const isNew = !editing.id;
    const res = await fetch("/api/journal-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, entry_date: editing.entry_date }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
    if (isNew) setEntries([data.entry, ...entries]);
    else setEntries(entries.map((e) => e.entry_date === editing.entry_date ? data.entry : e));
    setEditorOpen(false);
    toast.success("Entry saved!");
    router.refresh();
  }

  async function deleteEntry() {
    if (!editing?.id || !confirm("Delete this entry?")) return;
    const res = await fetch("/api/journal-entries", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id }) });
    if (!res.ok) { toast.error("Failed"); return; }
    setEntries(entries.filter((e) => e.id !== editing.id));
    setEditorOpen(false);
    toast.success("Entry deleted");
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Playbook Calendar</h1>
          <p className="text-sm text-muted-foreground">Daily journal and planning</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={view === "cal" ? "default" : "outline"} onClick={() => setView("cal")}><CalendarDays className="mr-1 h-3.5 w-3.5" />Calendar</Button>
          <Button size="sm" variant={view === "list" ? "default" : "outline"} onClick={() => setView("list")}><List className="mr-1 h-3.5 w-3.5" />List</Button>
          <Button size="sm" onClick={() => openEntry(today)}><Plus className="mr-1 h-3.5 w-3.5" />New Entry</Button>
        </div>
      </div>

      {view === "cal" && (
        <div className="flex flex-col gap-4 max-w-3xl mx-auto md:max-w-4xl">

          {/* Top stats bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Monthly PnL */}
            {(() => {
              const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
              const monthDays = Object.entries(statsByDate).filter(([d]) => d.startsWith(prefix));
              const monthPnl = monthDays.reduce((s, [, v]) => s + v.pnl, 0);
              const winDays = monthDays.filter(([, v]) => v.pnl > 0).length;
              const lossDays = monthDays.filter(([, v]) => v.pnl < 0).length;
              const tradedDays = monthDays.length;
              const winRate = tradedDays > 0 ? Math.round((winDays / tradedDays) * 100) : null;
              const bestDay = monthDays.length > 0 ? Math.max(...monthDays.map(([, v]) => v.pnl)) : null;
              const worstDay = monthDays.length > 0 ? Math.min(...monthDays.map(([, v]) => v.pnl)) : null;
              return (<>
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Month P&amp;L</div>
                    <div className={cn("text-xl md:text-xl font-black tabular-nums", monthPnl >= 0 ? "text-green-500" : "text-red-500")}>
                      {fmtPnlCents(monthPnl)}
                    </div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{winDays}W · {lossDays}L</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Win Rate</div>
                    <div className="text-xl md:text-xl font-black text-primary">{winRate != null ? `${winRate}%` : "—"}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{tradedDays} trading days</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Best Day</div>
                    <div className="text-xl md:text-xl font-black text-green-500">{bestDay != null ? fmtPnlCents(bestDay) : "—"}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><Flame className="h-3 w-3 text-amber-500" />{streak} day streak</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 md:p-4">
                    <div className="text-[10px] md:text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Worst Day</div>
                    <div className="text-xl md:text-xl font-black text-red-500">{worstDay != null ? fmtPnlCents(worstDay) : "—"}</div>
                    <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><BookOpen className="h-3 w-3 text-primary" />{thisMonthEntries} journaled</div>
                  </CardContent>
                </Card>
              </>);
            })()}
          </div>

          {/* Calendar — max-width constrained so aspect-square stays compact */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold">{MONTHS[month]} {year}</CardTitle>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}><ChevronLeft className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => { setYear(new Date().getFullYear()); setMonth(new Date().getMonth()); }}>Today</Button>
                  <Button size="icon" variant="ghost" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}><ChevronRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-4">
              <div className="mb-1 grid grid-cols-7 gap-1">
                {DOW.map((d) => <div key={d} className="py-1 text-center text-[10px] md:text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((c, i) => {
                  const dateStr = c.cur ? `${year}-${String(month + 1).padStart(2, "0")}-${String(c.day).padStart(2, "0")}` : "";
                  const e = dateStr ? entryByDate[dateStr] : null;
                  const stats = dateStr ? statsByDate[dateStr] : null;
                  const pnl = stats?.pnl ?? null;
                  const tradeCount = stats?.count ?? null;
                  const isToday = dateStr === today;
                  const dayBg = pnl == null ? "" : pnl > 0 ? "bg-green-500/10" : pnl < 0 ? "bg-red-500/10" : "";
                  return (
                    <button key={i} onClick={() => c.cur && openEntry(dateStr)} disabled={!c.cur}
                      className={cn(
                        "relative aspect-square w-full flex flex-col rounded-lg border-2 p-1.5 md:p-1.5 transition-all overflow-hidden",
                        c.cur ? "hover:border-primary cursor-pointer" : "opacity-10 cursor-default",
                        isToday ? "border-primary ring-2 ring-primary ring-offset-1 ring-offset-background" : pnl != null && pnl > 0 ? "border-green-500/40" : pnl != null && pnl < 0 ? "border-red-500/40" : "border-border",
                        dayBg
                      )}>
                      {/* Day number */}
                      <span className={cn(
                        "text-[11px] md:text-xs font-bold leading-none",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}>{c.cur ? c.day : ""}</span>

                      {/* Journal mood dot */}
                      {e && (
                        <span className={cn(
                          "absolute top-1.5 right-1.5 h-1.5 w-1.5 md:h-1.5 md:w-1.5 rounded-full",
                          e.mood === "great" ? "bg-green-500" : e.mood === "good" ? "bg-blue-400" : e.mood === "bad" || e.mood === "terrible" ? "bg-red-500" : "bg-amber-400"
                        )} />
                      )}

                      {/* PnL centered */}
                      {pnl != null && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-0.5 -mt-1">
                          <span className={cn(
                            "font-black leading-none tabular-nums text-center",
                            "text-[10px] sm:text-[11px] md:text-sm",
                            pnl >= 0 ? "text-green-500" : "text-red-500"
                          )}>
                            {fmtPnlCents(pnl)}
                          </span>
                          {tradeCount != null && (
                            <span className="text-[8px] md:text-[11px] text-muted-foreground/50 leading-none">
                              {tradeCount} {tradeCount === 1 ? "trade" : "trades"}
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {view === "list" && (
        <Card>
          <CardHeader><CardTitle className="text-sm">All Entries</CardTitle></CardHeader>
          <CardContent>
            {sortedList.length === 0
              ? <div className="py-8 text-center text-sm text-muted-foreground">No journal entries yet — click &ldquo;New Entry&rdquo; to start</div>
              : <div className="space-y-2">{sortedList.map((e) => {
                  const moodIcon = e.mood === "great" ? "🟢" : e.mood === "good" ? "🔵" : e.mood === "bad" ? "🟠" : e.mood === "terrible" ? "🔴" : "🟡";
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
                })}</div>
            }
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
                      <button key={b} onClick={() => setEditing({ ...editing, bias: editing.bias === b ? null : b })}
                        className={cn("rounded-md border px-2.5 py-1 text-xs font-medium",
                          editing.bias === b ? b === "Bullish" ? "border-green-500 bg-green-500/15 text-green-500" : b === "Bearish" ? "border-red-500 bg-red-500/15 text-red-500" : "border-amber-500 bg-amber-500/15 text-amber-500" : "border-input text-muted-foreground hover:border-primary hover:text-primary")}>
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide">Mood</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {MOODS.map((m) => (
                      <button key={m} onClick={() => setEditing({ ...editing, mood: editing.mood === m ? null : m })}
                        className={cn("rounded-md border px-2.5 py-1 text-xs font-medium", editing.mood === m ? "border-primary bg-primary/15 text-primary" : "border-input text-muted-foreground hover:border-primary")}>
                        {MOOD_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs uppercase tracking-wide">Rating</Label>
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map((n) => (
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
                    <button onClick={() => setEditing({ ...editing, rules_followed: editing.rules_followed === true ? null : true })}
                      className={cn("flex-1 rounded-md border px-3 py-2 text-sm font-medium", editing.rules_followed === true ? "border-green-500 bg-green-500/15 text-green-500" : "border-input text-muted-foreground hover:border-primary")}>Yes ✓</button>
                    <button onClick={() => setEditing({ ...editing, rules_followed: editing.rules_followed === false ? null : false })}
                      className={cn("flex-1 rounded-md border px-3 py-2 text-sm font-medium", editing.rules_followed === false ? "border-red-500 bg-red-500/15 text-red-500" : "border-input text-muted-foreground hover:border-primary")}>No ✗</button>
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
            <button key={t} onClick={() => onChange(on ? value.filter((x) => x !== t) : [...value, t])}
              className={cn("rounded-md border px-2.5 py-1 text-xs font-medium", on ? "border-primary bg-primary/15 text-primary" : "border-input text-muted-foreground hover:border-primary")}>
              {t}
            </button>
          );
        })}
      </div>
    </div>
  );
}