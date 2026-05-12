"use client";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Trash2, TrendingUp, TrendingDown, Star, CheckCircle2, XCircle, BookOpen, Zap, Clock, Edit, Pencil, Plus, FileText, Camera, ZoomIn, X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const SETUPS   = ["Trend Follow","Mean Reversion","Breakout","VWAP Reclaim","Opening Range","Supply/Demand","Liquidity Sweep","Fair Value Gap","News Play","Scalp","Other"];
const SESSIONS = ["London","NY Open","NY AM","NY PM","Asia"];
const GRADES   = ["A+","A","B","C","D"];

type Entry = {
  id: string; entry_date: string; title: string | null;
  bias: "Bullish" | "Bearish" | "Neutral" | null;
  mood: "great" | "good" | "neutral" | "bad" | "terrible" | null;
  rating: number | null; plan: string | null; notes: string | null;
  setups: string[] | null; sessions: string[] | null;
  rules_followed: boolean | null; improvement: string | null; tags: string[] | null;
  screenshot_urls: string[] | null;
} | null;

type Trade = {
  id: string; symbol: string; direction: string;
  pnl: number; commission: number; r_multiple: number | null;
  setup: string | null; session: string | null; grade: string | null;
  notes: string | null; entry_price: number | null; exit_price: number | null;
  stop_price: number | null; contracts: number; account_id: string | null;
  blown_account: boolean;
  mistake_id: string | null;
};

type Account = { id: string; name: string; firm: string | null; type: string | null };

const MOOD_EMOJI: Record<string, string> = { great: "🟢", good: "🔵", neutral: "🟡", bad: "🟠", terrible: "🔴" };
const MOOD_LABEL: Record<string, string> = { great: "Great", good: "Good", neutral: "Neutral", bad: "Bad", terrible: "Terrible" };
const BIASES = ["Bullish", "Bearish", "Neutral"] as const;
const MOODS  = ["great", "good", "neutral", "bad", "terrible"] as const;

function fmt(v: number) {
  const sign = v >= 0 ? "+" : "-";
  return sign + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

function FL({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

function TagBtn({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={cn(
      "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
      on ? "border-primary bg-primary/15 text-primary" : "border-input text-muted-foreground hover:border-primary hover:text-primary"
    )}>{children}</button>
  );
}

/* ── Edit Trade Modal ─────────────────────────────────────────────────────── */
function EditTradeModal({ trade, accounts, mistakes, date, onClose, onSaved }: {
  trade: Trade; accounts: Account[]; mistakes: { id: string; title: string }[]; date: string;
  onClose: () => void; onSaved: (t: Trade) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    trade_date:    date,
    account_id:    trade.account_id ?? "",
    symbol:        trade.symbol,
    direction:     trade.direction,
    contracts:     String(trade.contracts),
    pnl:           String(trade.pnl),
    entry_price:   trade.entry_price  != null ? String(trade.entry_price)  : "",
    exit_price:    trade.exit_price   != null ? String(trade.exit_price)   : "",
    stop_price:    trade.stop_price   != null ? String(trade.stop_price)   : "",
    commission:    String(trade.commission),
    setup:         trade.setup   ?? "",
    session:       trade.session ?? "",
    grade:         trade.grade   ?? "",
    notes:         trade.notes   ?? "",
    blown_account: trade.blown_account ?? false,
    mistake_id:    trade.mistake_id   ?? "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const selectedAcc = accounts.find(a => a.id === form.account_id);
  const showBlown   = selectedAcc?.type === "eval" || selectedAcc?.type === "funded";

  async function save() {
    if (!form.pnl) { toast.error("P&L is required"); return; }
    setSaving(true);
    const res = await fetch("/api/trades/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trade.id, ...form }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
    if (form.blown_account && form.account_id) {
      await fetch("/api/accounts/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.account_id, status: "failed" }),
      });
    }
    toast.success("Trade updated!");
    onSaved({ ...trade, ...data.trade });
  }

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trade — {trade.symbol} · {date}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FL label="Account">
            <Select value={form.account_id || "__none__"} onValueChange={v => set("account_id", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="No account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No account</SelectItem>
                {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}{a.firm ? ` (${a.firm})` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </FL>
          <FL label="Symbol"><Input value={form.symbol} onChange={e => set("symbol", e.target.value.toUpperCase())} /></FL>
          <FL label="Direction">
            <Select value={form.direction} onValueChange={v => set("direction", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="Long">Long</SelectItem><SelectItem value="Short">Short</SelectItem></SelectContent>
            </Select>
          </FL>
          <FL label="Contracts"><Input type="number" min="1" value={form.contracts} onChange={e => set("contracts", e.target.value)} /></FL>
          <FL label="P&L ($)"><Input type="number" step="0.01" value={form.pnl} onChange={e => set("pnl", e.target.value)} /></FL>
          <FL label="Commission ($)"><Input type="number" step="0.01" value={form.commission} onChange={e => set("commission", e.target.value)} /></FL>
          <FL label="Entry Price"><Input type="number" step="0.25" value={form.entry_price} onChange={e => set("entry_price", e.target.value)} placeholder="0.00" /></FL>
          <FL label="Exit Price"><Input type="number" step="0.25" value={form.exit_price} onChange={e => set("exit_price", e.target.value)} placeholder="0.00" /></FL>
          <FL label="Stop Price"><Input type="number" step="0.25" value={form.stop_price} onChange={e => set("stop_price", e.target.value)} placeholder="0.00" /></FL>
          <FL label="Setup">
            <Select value={form.setup || "__none__"} onValueChange={v => set("setup", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {SETUPS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FL>
          <FL label="Session">
            <Select value={form.session || "__none__"} onValueChange={v => set("session", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FL>
          <FL label="Grade">
            <Select value={form.grade || "__none__"} onValueChange={v => set("grade", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {GRADES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FL>
          <div className="sm:col-span-2">
            <FL label="Notes">
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Execution notes..." className="min-h-[80px]" />
            </FL>
          </div>
          {mistakes.length > 0 && (
            <div className="sm:col-span-2">
              <FL label="Mistake (optional)">
                <Select value={form.mistake_id || "__none__"} onValueChange={v => setForm(f => ({ ...f, mistake_id: v === "__none__" ? "" : v }))}>
                  <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {mistakes.map(m => <SelectItem key={m.id} value={m.id}>❌ {m.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FL>
            </div>
          )}
          {showBlown && (
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, blown_account: !f.blown_account }))}
                className={cn(
                  "w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                  form.blown_account ? "border-red-500 bg-red-500/10" : "border-border hover:border-red-500/40"
                )}
              >
                <span className={cn("text-xl", !form.blown_account && "grayscale opacity-40")}>💥</span>
                <div className="flex-1">
                  <div className={cn("text-sm font-semibold", form.blown_account ? "text-red-500" : "text-foreground")}>This trade blew the account</div>
                  <div className="text-xs text-muted-foreground">Marks account status as Failed</div>
                </div>
                <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0", form.blown_account ? "border-red-500 bg-red-500" : "border-muted-foreground")}>
                  {form.blown_account && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            </div>
          )}
        </div>
        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Journal Entry Editor Modal ───────────────────────────────────────────── */
function EntryEditorModal({ date, existing, onClose, onSaved }: {
  date: string; existing: Entry;
  onClose: () => void; onSaved: (e: NonNullable<Entry>) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title:         existing?.title        ?? "",
    bias:          existing?.bias         ?? null as "Bullish"|"Bearish"|"Neutral"|null,
    mood:          existing?.mood         ?? null as "great"|"good"|"neutral"|"bad"|"terrible"|null,
    rating:        existing?.rating       ?? null as number|null,
    plan:          existing?.plan         ?? "",
    notes:         existing?.notes        ?? "",
    setups:        existing?.setups       ?? [] as string[],
    sessions:      existing?.sessions     ?? [] as string[],
    rules_followed: existing?.rules_followed ?? null as boolean|null,
    improvement:   existing?.improvement  ?? "",
  });

  const toggleTag = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];

  async function save() {
    setSaving(true);
    const res = await fetch("/api/journal-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, entry_date: date, id: existing?.id }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
    toast.success("Entry saved!");
    onSaved(data.entry);
  }

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Edit" : "New"} Journal Entry — {date}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Title</Label>
            <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Strong NFP reaction — caught the move" />
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Bias</Label>
              <div className="flex flex-wrap gap-1.5">
                {BIASES.map(b => (
                  <TagBtn key={b} on={form.bias === b} onClick={() => setForm(f => ({ ...f, bias: f.bias === b ? null : b }))}>
                    {b}
                  </TagBtn>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Mood</Label>
              <div className="flex flex-wrap gap-1.5">
                {MOODS.map(m => (
                  <TagBtn key={m} on={form.mood === m} onClick={() => setForm(f => ({ ...f, mood: f.mood === m ? null : m }))}>
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </TagBtn>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Rating</Label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setForm(f => ({ ...f, rating: f.rating === n ? null : n }))} className="text-2xl leading-none">
                    <span className={n <= (form.rating ?? 0) ? "text-amber-500" : "text-muted"}> ★</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Setups Traded</Label>
            <div className="flex flex-wrap gap-1.5">
              {SETUPS.map(s => (
                <TagBtn key={s} on={form.setups.includes(s)} onClick={() => setForm(f => ({ ...f, setups: toggleTag(f.setups, s) }))}>{s}</TagBtn>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Sessions Traded</Label>
            <div className="flex flex-wrap gap-1.5">
              {SESSIONS.map(s => (
                <TagBtn key={s} on={form.sessions.includes(s)} onClick={() => setForm(f => ({ ...f, sessions: toggleTag(f.sessions, s) }))}>{s}</TagBtn>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Pre-Market Plan</Label>
              <Textarea value={form.plan} onChange={e => setForm(f => ({ ...f, plan: e.target.value }))} placeholder="Key levels, bias reasoning, setups to watch..." rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Post-Session Notes</Label>
              <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="What happened, mistakes, what you did well..." rows={4} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Rules Followed?</Label>
              <div className="flex gap-2">
                <button onClick={() => setForm(f => ({ ...f, rules_followed: f.rules_followed === true ? null : true }))}
                  className={cn("flex-1 rounded-md border px-3 py-2 text-sm font-medium", form.rules_followed === true ? "border-green-500 bg-green-500/15 text-green-500" : "border-input text-muted-foreground hover:border-primary")}>
                  Yes ✓
                </button>
                <button onClick={() => setForm(f => ({ ...f, rules_followed: f.rules_followed === false ? null : false }))}
                  className={cn("flex-1 rounded-md border px-3 py-2 text-sm font-medium", form.rules_followed === false ? "border-red-500 bg-red-500/15 text-red-500" : "border-input text-muted-foreground hover:border-primary")}>
                  No ✗
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wide">Improvement Focus</Label>
              <Input value={form.improvement} onChange={e => setForm(f => ({ ...f, improvement: e.target.value }))} placeholder="One thing to improve tomorrow..." />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Entry"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Main Day Screen ──────────────────────────────────────────────────────── */
export function JournalDayClient({ entry: initialEntry, trades: initialTrades, accounts, mistakes = [], strategies = [], date }: {
  entry: Entry; trades: Trade[]; accounts: Account[]; mistakes?: { id: string; title: string }[];
  strategies?: { id: string; name: string }[]; date: string;
}) {
  const router = useRouter();
  const [entry, setEntry]   = useState<Entry>(initialEntry);
  const [trades, setTrades] = useState(initialTrades);
  const [editing, setEditing]       = useState<Trade | null>(null);
  const [entryEditor, setEntryEditor] = useState(false);
  const [deleting, setDeleting]     = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const supabase = createClient();

  const screenshots: string[] = entry?.screenshot_urls ?? [];

  async function handleScreenshotUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!entry) { toast.error("Create a journal entry first before uploading screenshots"); return; }
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) { toast.error(`${file.name} is not an image`); continue; }
      const ext  = file.name.split(".").pop();
      const path = `journal-screenshots/${entry.id}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("trade-screenshots").upload(path, file, { upsert: true });
      if (upErr) { toast.error("Upload failed: " + upErr.message); continue; }
      const { data } = supabase.storage.from("trade-screenshots").getPublicUrl(path);
      newUrls.push(data.publicUrl + "?t=" + Date.now());
    }
    if (newUrls.length) {
      const merged = [...screenshots, ...newUrls];
      const { error } = await supabase.from("journal_entries").update({ screenshot_urls: merged }).eq("id", entry.id);
      if (error) { toast.error("Failed to save screenshot URLs"); }
      else {
        setEntry(en => en ? { ...en, screenshot_urls: merged } : en);
        toast.success(`${newUrls.length} screenshot${newUrls.length > 1 ? "s" : ""} uploaded`);
      }
    }
    setUploading(false);
    e.target.value = "";
  }

  async function removeScreenshot(url: string) {
    if (!entry) return;
    const updated = screenshots.filter(u => u !== url);
    const { error } = await supabase.from("journal_entries").update({ screenshot_urls: updated }).eq("id", entry.id);
    if (error) { toast.error("Failed to remove screenshot"); return; }
    setEntry(en => en ? { ...en, screenshot_urls: updated } : en);
    toast.success("Screenshot removed");
  }

  const sortedTrades = useMemo(() => [...trades].sort((a, b) => {
    if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
    return b.pnl - a.pnl;
  }), [trades]);

  const totalPnl  = trades.reduce((s, t) => s + t.pnl - t.commission, 0);
  const grossPnl  = trades.reduce((s, t) => s + t.pnl, 0);
  const totalComm = trades.reduce((s, t) => s + t.commission, 0);
  const wins      = trades.filter(t => t.pnl > 0);
  const losses    = trades.filter(t => t.pnl < 0);
  const winRate   = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : null;
  const bestTrade  = trades.length > 0 ? trades.reduce((a, b) => b.pnl > a.pnl ? b : a) : null;

  function handleTradeSaved(updated: Trade) {
    setTrades(prev => prev.map(t => t.id === updated.id ? updated : t));
    setEditing(null);
  }

  async function deleteTrade(id: string) {
    if (!confirm("Delete this trade? This cannot be undone.")) return;
    const res = await fetch("/api/trades", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("Failed to delete trade"); return; }
    setTrades(prev => prev.filter(t => t.id !== id));
    toast.success("Trade deleted");
  }

  async function deleteEntry() {
    if (!entry) return;
    if (!confirm("Delete this journal entry? This cannot be undone.")) return;
    setDeleting(true);
    const res = await fetch("/api/journal-entries", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id }),
    });
    setDeleting(false);
    if (!res.ok) { toast.error("Failed to delete"); return; }
    toast.success("Entry deleted");
    setEntry(null);
  }

  function handleScreenshotUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(file => {
      const url = URL.createObjectURL(file);
      setScreenshots(prev => [...prev, { url, name: file.name }]);
    });
  }

  function removeScreenshot(idx: number) {
    setScreenshots(prev => prev.filter((_, i) => i !== idx));
  }

  // Build setup options: strategies from DB + fallback hardcoded list
  const setupOptions = strategies.length > 0
    ? strategies.map(s => s.name)
    : ["Trend Follow","Mean Reversion","Breakout","VWAP Reclaim","Opening Range","Supply/Demand","Liquidity Sweep","Fair Value Gap","News Play","Scalp","Other"];

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-6xl mx-auto">

      {/* ── Header ── */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/journal/calendar")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{formatDate(date)}</p>
            <h1 className="text-xl md:text-2xl font-black leading-tight mt-0.5">
              {entry?.title || (entry ? "Journal Entry" : "No Entry Yet")}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {entry ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEntryEditor(true)}>
                <Edit className="mr-1.5 h-3.5 w-3.5" />Edit Entry
              </Button>
              <Button variant="destructive" size="sm" onClick={deleteEntry} disabled={deleting}>
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />{deleting ? "Deleting…" : "Delete Entry"}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={() => setEntryEditor(true)}>
              <FileText className="mr-1.5 h-3.5 w-3.5" />Create Journal Entry
            </Button>
          )}
          <Button asChild size="sm" variant="outline">
            <Link href="/trades/new"><Plus className="mr-1.5 h-3.5 w-3.5" />Log Trade</Link>
          </Button>
        </div>
      </div>

      {/* ── No entry banner ── */}
      {!entry && (
        <div className="mb-6 rounded-xl border border-dashed border-border p-5 text-center">
          <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-40" />
          <p className="text-sm text-muted-foreground mb-3">No journal entry for this day yet.</p>
          <Button size="sm" onClick={() => setEntryEditor(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />Create Entry
          </Button>
        </div>
      )}

      {/* ── Status pills ── */}
      {entry && (
        <div className="mb-6 flex flex-wrap gap-2">
          {entry.mood && (
            <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium">
              {MOOD_EMOJI[entry.mood]} {MOOD_LABEL[entry.mood]}
            </span>
          )}
          {entry.bias && (
            <Badge variant={entry.bias === "Bullish" ? "success" : entry.bias === "Bearish" ? "destructive" : "warning"} className="text-sm px-3 py-1">
              {entry.bias}
            </Badge>
          )}
          {entry.rating != null && (
            <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
              {"★".repeat(entry.rating)}<span className="text-muted-foreground/40">{"★".repeat(5 - entry.rating)}</span>
            </span>
          )}
          {entry.rules_followed != null && (
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium",
              entry.rules_followed ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500"
            )}>
              {entry.rules_followed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
              Rules {entry.rules_followed ? "Followed" : "Broken"}
            </span>
          )}
          {trades.length > 0 && (
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-black",
              totalPnl >= 0 ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500"
            )}>
              {totalPnl >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {fmt(totalPnl)} · {trades.length} trade{trades.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* ── Day P&L stat cards ── */}
      {trades.length > 0 && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Net P&L</div>
            <div className={cn("text-xl font-black tabular-nums", totalPnl >= 0 ? "text-green-500" : "text-red-500")}>{fmt(totalPnl)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">after commissions</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Win Rate</div>
            <div className="text-xl font-black text-blue-500">{winRate != null ? `${winRate}%` : "—"}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{wins.length}W · {losses.length}L</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Best Trade</div>
            <div className="text-xl font-black text-green-500">{bestTrade ? fmt(bestTrade.pnl) : "—"}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{bestTrade?.symbol ?? ""}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Commissions</div>
            <div className="text-xl font-black text-amber-500">${totalComm.toFixed(2)}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Gross: {fmt(grossPnl)}</div>
          </div>
        </div>
      )}

      {/* ── Journal notes ── */}
      {entry && (entry.plan || entry.notes || entry.improvement) && (
        <div className="grid gap-4 md:grid-cols-2 mb-6">
          {entry.plan && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" />Pre-Market Plan</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{entry.plan}</p>
              </CardContent>
            </Card>
          )}
          {entry.notes && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />Post-Session Notes</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{entry.notes}</p>
              </CardContent>
            </Card>
          )}
          {entry.improvement && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" />Improvement Focus</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <p className="text-sm leading-relaxed text-foreground/90">{entry.improvement}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ── Setups & Sessions — separated ── */}
      {entry && (
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {/* Setups */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />Setups Traded
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(entry.setups ?? []).map(s => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
                {(entry.setups ?? []).length === 0 && (
                  <span className="text-xs text-muted-foreground">No setups logged</span>
                )}
              </div>
              {/* Dropdown from strategies */}
              {!addingSetup ? (
                <div className="flex gap-2">
                  <Select onValueChange={val => {
                    if (val === "__new__") { setAddingSetup(true); return; }
                    // optimistic add — full save would need an API call
                    setEntry(e => e ? { ...e, setups: [...(e.setups ?? []), val] } : e);
                  }}>
                    <SelectTrigger className="h-7 text-xs flex-1">
                      <SelectValue placeholder="Add setup…" />
                    </SelectTrigger>
                    <SelectContent>
                      {setupOptions.filter(s => !(entry.setups ?? []).includes(s)).map(s => (
                        <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>
                      ))}
                      <SelectItem value="__new__" className="text-xs text-primary">+ Add new setup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    className="h-7 text-xs"
                    placeholder="Setup name…"
                    value={newSetup}
                    onChange={e => setNewSetup(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && newSetup.trim()) {
                        setEntry(en => en ? { ...en, setups: [...(en.setups ?? []), newSetup.trim()] } : en);
                        setNewSetup(""); setAddingSetup(false);
                      }
                      if (e.key === "Escape") { setAddingSetup(false); setNewSetup(""); }
                    }}
                  />
                  <Button size="sm" className="h-7 text-xs px-2" onClick={() => {
                    if (newSetup.trim()) {
                      setEntry(en => en ? { ...en, setups: [...(en.setups ?? []), newSetup.trim()] } : en);
                    }
                    setNewSetup(""); setAddingSetup(false);
                  }}>Add</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => { setAddingSetup(false); setNewSetup(""); }}>Cancel</Button>
                </div>
              )}
              {strategies.length === 0 && (
                <p className="text-[10px] text-muted-foreground">
                  <Link href="/strategies" className="underline text-primary">Add strategies</Link> to populate the dropdown.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />Sessions Traded
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {(entry.sessions ?? []).map(s => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
                {(entry.sessions ?? []).length === 0 && (
                  <span className="text-xs text-muted-foreground">No sessions logged</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SESSIONS.filter(s => !(entry.sessions ?? []).includes(s)).map(s => (
                  <TagBtn key={s} on={false} onClick={() =>
                    setEntry(e => e ? { ...e, sessions: [...(e.sessions ?? []), s] } : e)
                  }>{s}</TagBtn>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Screenshots + Trades side by side ── */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr] mb-4">

        {/* Screenshots */}
        <Card className="self-start">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />Screenshots
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            {!entry ? (
              <p className="text-xs text-muted-foreground">Create a journal entry to upload screenshots.</p>
            ) : screenshots.length === 0 ? (
              <label className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors",
                uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"
              )}>
                {uploading ? (
                  <div className="text-xs text-muted-foreground animate-pulse">Uploading…</div>
                ) : (
                  <>
                    <Camera className="h-7 w-7 text-muted-foreground opacity-40" />
                    <span className="text-xs text-muted-foreground">Click to upload charts</span>
                    <span className="text-[10px] text-muted-foreground/60">PNG, JPG, WEBP</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={handleScreenshotUpload} />
              </label>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2">
                  {screenshots.map((url, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`Screenshot ${i + 1}`} className="w-full h-24 object-cover cursor-zoom-in" onClick={() => setLightboxUrl(url)} />
                      <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setLightboxUrl(url)} className="h-5 w-5 rounded bg-black/70 text-white flex items-center justify-center hover:bg-black/90">
                          <ZoomIn className="h-3 w-3" />
                        </button>
                        <button onClick={() => removeScreenshot(url)} className="h-5 w-5 rounded bg-destructive/80 text-white flex items-center justify-center hover:bg-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <label className={cn(
                  "flex items-center gap-2 text-xs text-primary",
                  uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:underline"
                )}>
                  {uploading ? (
                    <span className="animate-pulse">Uploading…</span>
                  ) : (
                    <><ImagePlus className="h-3.5 w-3.5" />Add more</>
                  )}
                  <input type="file" accept="image/*" multiple className="hidden" disabled={uploading} onChange={handleScreenshotUpload} />
                </label>
              </>
            )}
          </CardContent>
        </Card>

        {/* Lightbox */}
        {lightboxUrl && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxUrl(null)}>
            <button className="absolute top-4 right-4 text-white/70 hover:text-white"><X className="h-8 w-8" /></button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxUrl} alt="Screenshot" className="max-h-screen max-w-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
          </div>
        )}

        {/* Trades */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />Trades This Day
              </CardTitle>
              {trades.length > 0 && (
                <div className="flex gap-3 text-xs">
                  <span className="text-green-500 font-semibold">{wins.length}W</span>
                  <span className="text-red-500 font-semibold">{losses.length}L</span>
                  <span className={cn("font-black", totalPnl >= 0 ? "text-green-500" : "text-red-500")}>{fmt(totalPnl)}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {trades.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No trades logged for this day —{" "}
                <Link href="/trades/new" className="text-primary underline">log one now</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {sortedTrades.map(t => {
                  const net = t.pnl - t.commission;
                  return (
                    <div key={t.id} className={cn(
                      "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border p-3 transition-colors",
                      net > 0 ? "border-green-500/20 bg-green-500/5" : net < 0 ? "border-red-500/20 bg-red-500/5" : "border-border"
                    )}>
                      <div className="flex items-center gap-2 min-w-[110px]">
                        <Badge className={t.direction === "Long" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>
                          {t.direction}
                        </Badge>
                        <span className="font-black text-base">{t.symbol}</span>
                        {t.blown_account && <span title="Blew account" className="text-base leading-none">💥</span>}
                      </div>
                      <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{t.contracts} contract{t.contracts !== 1 ? "s" : ""}</span>
                        {t.entry_price && <span>In: <span className="font-mono text-foreground">{t.entry_price}</span></span>}
                        {t.exit_price  && <span>Out: <span className="font-mono text-foreground">{t.exit_price}</span></span>}
                        {t.r_multiple  != null && <span className="font-medium text-primary">{t.r_multiple}R</span>}
                        {t.setup   && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t.setup}</Badge>}
                        {t.session && <Badge variant="outline"   className="text-[10px] px-1.5 py-0">{t.session}</Badge>}
                        {t.grade   && <Badge variant="outline"   className="text-[10px] px-1.5 py-0">{t.grade}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 ml-auto">
                        <div className="text-right">
                          <div className={cn("font-black tabular-nums text-base", net >= 0 ? "text-green-500" : "text-red-500")}>{fmt(net)}</div>
                          {t.commission > 0 && <div className="text-[10px] text-muted-foreground">-${t.commission.toFixed(2)} comm</div>}
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditing(t)}>
                          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => deleteTrade(t.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Modals ── */}
      {editing && (
        <EditTradeModal
          trade={editing} accounts={accounts} mistakes={mistakes} date={date}
          onClose={() => setEditing(null)} onSaved={handleTradeSaved}
        />
      )}
      {entryEditor && (
        <EntryEditorModal
          date={date} existing={entry}
          onClose={() => setEntryEditor(false)}
          onSaved={saved => { setEntry(saved); setEntryEditor(false); }}
        />
      )}
    </div>
  );
}