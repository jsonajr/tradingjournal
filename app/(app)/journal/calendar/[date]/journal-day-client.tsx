"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Trash2, TrendingUp, TrendingDown, Star, CheckCircle2, XCircle, BookOpen, Zap, Clock, Edit, Pencil, Plus } from "lucide-react";
import { cn, fmtMoney } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

const SETUPS  = ["Trend Follow","Mean Reversion","Breakout","VWAP Reclaim","Opening Range","Supply/Demand","Liquidity Sweep","Fair Value Gap","News Play","Scalp","Other"];
const SESSIONS = ["London","NY Open","NY AM","NY PM","Asia"];
const GRADES  = ["A+","A","B","C","D"];

type Entry = {
  id: string; entry_date: string; title: string | null;
  bias: "Bullish" | "Bearish" | "Neutral" | null;
  mood: "great" | "good" | "neutral" | "bad" | "terrible" | null;
  rating: number | null; plan: string | null; notes: string | null;
  setups: string[] | null; sessions: string[] | null;
  rules_followed: boolean | null; improvement: string | null; tags: string[] | null;
};

type Trade = {
  id: string; symbol: string; direction: string;
  pnl: number; commission: number; r_multiple: number | null;
  setup: string | null; session: string | null; grade: string | null;
  notes: string | null; entry_price: number | null; exit_price: number | null;
  stop_price: number | null; contracts: number; account_id: string | null;
  blown_account: boolean;
};

type Account = { id: string; name: string; firm: string | null; type: string | null };

const MOOD_EMOJI: Record<string, string> = { great: "🟢", good: "🔵", neutral: "🟡", bad: "🟠", terrible: "🔴" };
const MOOD_LABEL: Record<string, string> = { great: "Great", good: "Good", neutral: "Neutral", bad: "Bad", terrible: "Terrible" };

function fmt(v: number) {
  const sign = v >= 0 ? "+" : "-";
  return sign + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

function EditTradeModal({ trade, accounts, date, onClose, onSaved }: {
  trade: Trade; accounts: Account[]; date: string;
  onClose: () => void; onSaved: (t: Trade) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    trade_date:   date,
    account_id:   trade.account_id ?? "",
    symbol:       trade.symbol,
    direction:    trade.direction,
    contracts:    String(trade.contracts),
    pnl:          String(trade.pnl),
    entry_price:  trade.entry_price != null ? String(trade.entry_price) : "",
    exit_price:   trade.exit_price  != null ? String(trade.exit_price)  : "",
    stop_price:   trade.stop_price  != null ? String(trade.stop_price)  : "",
    commission:   String(trade.commission),
    setup:        trade.setup   ?? "",
    session:      trade.session ?? "",
    grade:        trade.grade   ?? "",
    notes:        trade.notes   ?? "",
    blown_account: trade.blown_account ?? false,
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const selectedAcc = accounts.find(a => a.id === form.account_id);
  const showBlown = selectedAcc?.type === "eval" || selectedAcc?.type === "funded";

  async function save() {
    if (!form.pnl) { toast.error("P&L is required"); return; }
    setSaving(true);
    const res = await fetch("/api/trades/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trade.id, ...form, blown_account: form.blown_account }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { toast.error(data.error ?? "Failed to save"); return; }
    if (form.blown_account && form.account_id) {
      await fetch("/api/accounts/status", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: form.account_id, status: "failed" }),
      });
    }
    toast.success("Trade updated!");
    onSaved(data.trade);
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trade — {trade.symbol} · {date}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FieldRow label="Account">
            <Select value={form.account_id || "__none__"} onValueChange={v => set("account_id", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="No account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No account</SelectItem>
                {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}{a.firm ? ` (${a.firm})` : ""}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Symbol">
            <Input value={form.symbol} onChange={e => set("symbol", e.target.value.toUpperCase())} />
          </FieldRow>
          <FieldRow label="Direction">
            <Select value={form.direction} onValueChange={v => set("direction", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Long">Long</SelectItem>
                <SelectItem value="Short">Short</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Contracts">
            <Input type="number" min="1" value={form.contracts} onChange={e => set("contracts", e.target.value)} />
          </FieldRow>
          <FieldRow label="P&L ($)">
            <Input type="number" step="0.01" value={form.pnl} onChange={e => set("pnl", e.target.value)} />
          </FieldRow>
          <FieldRow label="Commission ($)">
            <Input type="number" step="0.01" value={form.commission} onChange={e => set("commission", e.target.value)} />
          </FieldRow>
          <FieldRow label="Entry Price">
            <Input type="number" step="0.25" value={form.entry_price} onChange={e => set("entry_price", e.target.value)} placeholder="0.00" />
          </FieldRow>
          <FieldRow label="Exit Price">
            <Input type="number" step="0.25" value={form.exit_price} onChange={e => set("exit_price", e.target.value)} placeholder="0.00" />
          </FieldRow>
          <FieldRow label="Stop Price">
            <Input type="number" step="0.25" value={form.stop_price} onChange={e => set("stop_price", e.target.value)} placeholder="0.00" />
          </FieldRow>
          <FieldRow label="Setup">
            <Select value={form.setup || "__none__"} onValueChange={v => set("setup", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select setup" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {SETUPS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Session">
            <Select value={form.session || "__none__"} onValueChange={v => set("session", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="Grade">
            <Select value={form.grade || "__none__"} onValueChange={v => set("grade", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {GRADES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FieldRow>
          <div className="sm:col-span-2">
            <FieldRow label="Notes">
              <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Execution notes, mistakes, what you did well..." className="min-h-[80px]" />
            </FieldRow>
          </div>

          {/* Blown account toggle */}
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
                  <div className={cn("text-sm font-semibold", form.blown_account ? "text-red-500" : "text-foreground")}>
                    This trade blew the account
                  </div>
                  <div className="text-xs text-muted-foreground">Marks account status as Failed</div>
                </div>
                <div className={cn(
                  "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  form.blown_account ? "border-red-500 bg-red-500" : "border-muted-foreground"
                )}>
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

export function JournalDayClient({ entry, trades: initialTrades, accounts }: {
  entry: Entry; trades: Trade[]; accounts: Account[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [trades, setTrades] = useState(initialTrades);

  const totalPnl  = trades.reduce((s, t) => s + t.pnl - t.commission, 0);
  const grossPnl  = trades.reduce((s, t) => s + t.pnl, 0);
  const totalComm = trades.reduce((s, t) => s + t.commission, 0);
  const wins      = trades.filter(t => t.pnl > 0);
  const losses    = trades.filter(t => t.pnl < 0);
  const winRate   = trades.length > 0 ? Math.round((wins.length / trades.length) * 100) : null;
  const bestTrade  = trades.length > 0 ? trades.reduce((a, b) => b.pnl > a.pnl ? b : a) : null;
  const worstTrade = trades.length > 0 ? trades.reduce((a, b) => b.pnl < a.pnl ? b : a) : null;

  function handleSaved(updated: Trade) {
    setTrades(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
    setEditing(null);
  }

  async function deleteTrade(id: string) {
    if (!confirm("Delete this trade? This cannot be undone.")) return;
    const res = await fetch("/api/trades", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setTrades(prev => prev.filter(t => t.id !== id));
    toast.success("Trade deleted");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Delete this journal entry? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/journal-entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      toast.success("Entry deleted");
      router.push("/journal/calendar");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-5xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/journal/calendar")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{formatDate(entry.entry_date)}</p>
            <h1 className="text-xl md:text-2xl font-black leading-tight mt-0.5">
              {entry.title || "Journal Entry"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => router.push(`/journal/calendar?edit=${entry.entry_date}`)}>
            <Edit className="mr-1.5 h-3.5 w-3.5" />Edit Entry
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/trades/new`}><Plus className="mr-1.5 h-3.5 w-3.5" />Log Trade</Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />{deleting ? "Deleting…" : "Delete Entry"}
          </Button>
        </div>
      </div>

      {/* Status pills */}
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

      {/* Day P&L stats — only when trades exist */}
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

      {/* Trades for this day */}
      <Card className="mb-4">
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
              {trades.map(t => {
                const net = t.pnl - t.commission;
                return (
                  <div key={t.id} className={cn(
                    "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border p-3 transition-colors",
                    net > 0 ? "border-green-500/20 bg-green-500/5" : net < 0 ? "border-red-500/20 bg-red-500/5" : "border-border"
                  )}>
                    {/* Left: symbol + direction */}
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Badge className={t.direction === "Long" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>
                        {t.direction}
                      </Badge>
                      <span className="font-black text-base">{t.symbol}</span>
                      {t.blown_account && <span title="Blew account" className="text-base leading-none">💥</span>}
                    </div>

                    {/* Center: trade details */}
                    <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span>{t.contracts} contract{t.contracts !== 1 ? "s" : ""}</span>
                      {t.entry_price && <span>In: <span className="font-mono text-foreground">{t.entry_price}</span></span>}
                      {t.exit_price  && <span>Out: <span className="font-mono text-foreground">{t.exit_price}</span></span>}
                      {t.r_multiple  != null && <span className="font-medium text-primary">{t.r_multiple}R</span>}
                      {t.setup   && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t.setup}</Badge>}
                      {t.session && <Badge variant="outline"   className="text-[10px] px-1.5 py-0">{t.session}</Badge>}
                      {t.grade   && <Badge variant="outline"   className="text-[10px] px-1.5 py-0">{t.grade}</Badge>}
                    </div>

                    {/* Right: P&L + actions */}
                    <div className="flex items-center gap-3 ml-auto">
                      <div className="text-right">
                        <div className={cn("font-black tabular-nums text-base", net >= 0 ? "text-green-500" : "text-red-500")}>
                          {fmt(net)}
                        </div>
                        {t.commission > 0 && (
                          <div className="text-[10px] text-muted-foreground">-${t.commission.toFixed(2)} comm</div>
                        )}
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

      {/* Notes row */}
      <div className="grid gap-4 md:grid-cols-2">

        {entry.plan && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />Pre-Market Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{entry.plan}</p>
            </CardContent>
          </Card>
        )}

        {entry.notes && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />Post-Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{entry.notes}</p>
            </CardContent>
          </Card>
        )}

        {entry.setups && entry.setups.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Setups Traded</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {entry.setups.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
              </div>
            </CardContent>
          </Card>
        )}

        {entry.sessions && entry.sessions.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />Sessions Traded
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {entry.sessions.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
              </div>
            </CardContent>
          </Card>
        )}

        {entry.improvement && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />Improvement Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm leading-relaxed text-foreground/90">{entry.improvement}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit trade modal */}
      {editing && (
        <EditTradeModal
          trade={editing}
          accounts={accounts}
          date={entry.entry_date}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}