"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, Trash2, TrendingUp, TrendingDown, Save, ChevronLeft, ChevronRight, Pencil, ImagePlus, X, ZoomIn } from "lucide-react";
import { fmtMoney, cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const SETUPS   = ["Trend Follow","Mean Reversion","Breakout","VWAP Reclaim","Opening Range","Supply/Demand","Liquidity Sweep","Fair Value Gap","News Play","Scalp","Other"];
const SESSIONS = ["London","NY Open","NY AM","NY PM","Asia"];
const GRADES   = ["A+","A","B","C","D"];

type Trade = {
  id: string; trade_date: string; symbol: string;
  direction: "Long" | "Short"; contracts: number;
  entry_price: number | null; exit_price: number | null; stop_price: number | null;
  pnl: number; commission: number; r_multiple: number | null;
  setup: string | null; session: string | null; grade: string | null;
  notes: string | null; account_id: string | null;
  screenshot_url?: string | null;
  blown_account?: boolean;
  mistake_id?: string | null;
  open_time?: string | null;
  close_time?: string | null;
  accounts: { name: string; firm: string | null; type?: string | null } | { name: string; firm: string | null; type?: string | null }[] | null;
};
type Account = { id: string; name: string; firm: string | null };
type AdjacentTrades = { prev: string | null; next: string | null };

function getAccount(accounts: Trade["accounts"]) {
  if (!accounts) return null;
  return Array.isArray(accounts) ? accounts[0] ?? null : accounts;
}

function FL({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

/* ── Screenshot uploader ─────────────────────────────────────────────────── */
function ScreenshotUploader({ tradeId, existingUrl, onUpdated }: {
  tradeId: string; existingUrl: string | null; onUpdated: (url: string | null) => void;
}) {
  const [url, setUrl]           = useState(existingUrl);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox]  = useState(false);
  const supabase = createClient();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    setUploading(true);
    const ext  = file.name.split(".").pop();
    const path = `trade-screenshots/${tradeId}-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("trade-screenshots").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Upload failed: " + upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("trade-screenshots").getPublicUrl(path);
    const publicUrl = data.publicUrl + "?t=" + Date.now();
    await supabase.from("trades").update({ screenshot_url: publicUrl }).eq("id", tradeId);
    setUrl(publicUrl);
    onUpdated(publicUrl);
    setUploading(false);
    toast.success("Screenshot saved");
  }

  async function remove() {
    if (!confirm("Remove this screenshot?")) return;
    await supabase.from("trades").update({ screenshot_url: null }).eq("id", tradeId);
    setUrl(null);
    onUpdated(null);
    toast.success("Screenshot removed");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <>
      {url ? (
        <div className="relative group rounded-xl overflow-hidden border border-border">
          <img
            src={url}
            alt="Trade screenshot"
            className="w-full object-contain max-h-[500px] bg-black/40 cursor-zoom-in"
            onClick={() => setLightbox(true)}
          />
          <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setLightbox(true)} className="rounded-md bg-black/70 p-1.5 text-white hover:bg-black/90">
              <ZoomIn className="h-4 w-4" />
            </button>
            <label className="rounded-md bg-primary/90 p-1.5 text-primary-foreground cursor-pointer hover:bg-primary">
              <ImagePlus className="h-4 w-4" />
              <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
            <button onClick={remove} className="rounded-md bg-destructive/90 p-1.5 text-white hover:bg-destructive">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/20 min-h-[260px] p-8 text-center hover:border-primary/50 transition-colors"
        >
          {uploading ? (
            <div className="text-sm text-muted-foreground animate-pulse">Uploading...</div>
          ) : (
            <>
              <div className="text-4xl">📸</div>
              <div className="text-sm font-semibold">Drop a screenshot here</div>
              <div className="text-xs text-muted-foreground">or</div>
              <label className="cursor-pointer rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Choose File
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
              <div className="text-xs text-muted-foreground">PNG, JPG, WEBP supported</div>
            </>
          )}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <button className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="h-8 w-8" />
          </button>
          <img src={url} alt="Trade screenshot" className="max-h-screen max-w-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </>
  );
}

/* ── Edit Trade Modal ─────────────────────────────────────────────────────── */
function EditTradeModal({ trade, accounts, mistakes, onClose, onSaved }: {
  trade: Trade; accounts: Account[]; mistakes: { id: string; title: string }[]; onClose: () => void; onSaved: (t: Trade) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    trade_date:    trade.trade_date,
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
  const showBlown   = (selectedAcc as any)?.type === "eval" || (selectedAcc as any)?.type === "funded";

  async function save() {
    if (!form.pnl) { toast.error("P&L is required"); return; }
    setSaving(true);
    const res = await fetch("/api/trades/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trade.id, ...form, mistake_id: form.mistake_id || null }),
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
    onSaved(data.trade);
  }

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Edit Trade — {trade.symbol} {trade.trade_date}</DialogTitle></DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FL label="Date"><Input type="date" value={form.trade_date} onChange={e => set("trade_date", e.target.value)} /></FL>
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
          <FL label="Entry Price"><Input type="number" step="0.25" value={form.entry_price} onChange={e => set("entry_price", e.target.value)} placeholder="0.00" /></FL>
          <FL label="Exit Price"><Input type="number" step="0.25" value={form.exit_price} onChange={e => set("exit_price", e.target.value)} placeholder="0.00" /></FL>
          <FL label="Stop Price"><Input type="number" step="0.25" value={form.stop_price} onChange={e => set("stop_price", e.target.value)} placeholder="0.00" /></FL>
          <FL label="Commission ($)"><Input type="number" step="0.01" value={form.commission} onChange={e => set("commission", e.target.value)} /></FL>
          <FL label="Setup">
            <Select value={form.setup || "__none__"} onValueChange={v => set("setup", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">None</SelectItem>{SETUPS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </FL>
          <FL label="Session">
            <Select value={form.session || "__none__"} onValueChange={v => set("session", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">None</SelectItem>{SESSIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </FL>
          <FL label="Grade">
            <Select value={form.grade || "__none__"} onValueChange={v => set("grade", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent><SelectItem value="__none__">None</SelectItem>{GRADES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </FL>
          <div className="sm:col-span-2">
            <FL label="Notes"><Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Execution notes..." className="min-h-[80px]" /></FL>
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
                className={cn("w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all",
                  form.blown_account ? "border-red-500 bg-red-500/10" : "border-border hover:border-red-500/40")}
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

/* ── Main Component ───────────────────────────────────────────────────────── */
export function TradeDetailClient({ trade: initialTrade, adjacent, accounts, mistakes = [] }: {
  trade: Trade; adjacent?: AdjacentTrades; accounts: Account[]; mistakes?: { id: string; title: string }[];
}) {
  const router  = useRouter();
  const [trade, setTrade]       = useState(initialTrade);
  const [notes, setNotes]       = useState(trade.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const net     = trade.pnl - trade.commission;
  const account = getAccount(trade.accounts);
  const isWin   = net >= 0;

  const rr = trade.entry_price && trade.stop_price && trade.exit_price
    ? (() => {
        const risk   = Math.abs(trade.entry_price - trade.stop_price);
        const reward = trade.direction === "Long"
          ? trade.exit_price - trade.entry_price
          : trade.entry_price - trade.exit_price;
        return risk > 0 ? (reward / risk).toFixed(2) : null;
      })()
    : null;

  async function deleteTrade() {
    if (!confirm("Delete this trade? This cannot be undone.")) return;
    const res = await fetch("/api/trades", {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trade.id }),
    });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    toast.success("Trade deleted");
    router.push("/trades");
    router.refresh();
  }

  async function saveNotes() {
    setSavingNotes(true);
    const res = await fetch("/api/trades/update", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...trade, accounts: undefined, notes }),
    });
    setSavingNotes(false);
    if (!res.ok) { toast.error("Failed to save notes"); return; }
    toast.success("Notes saved");
    setTrade(t => ({ ...t, notes }));
  }

  function handleSaved(updated: Trade) {
    setTrade(updated);
    setNotes(updated.notes ?? "");
    setEditOpen(false);
    router.refresh();
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">

      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/trades"><ArrowLeft className="mr-1 h-4 w-4" />Back to Trades</Link>
        </Button>
        <div className="flex items-center gap-2 flex-wrap">
          {adjacent?.prev && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/journal/${adjacent.prev}`)}>
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />Prev
            </Button>
          )}
          {adjacent?.next && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/journal/${adjacent.next}`)}>
              Next<ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={deleteTrade}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-lg",
          isWin ? "bg-green-600 shadow-green-900/30" : "bg-red-600 shadow-red-900/30"
        )}>
          {isWin ? <TrendingUp className="h-7 w-7" /> : <TrendingDown className="h-7 w-7" />}
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black">{trade.symbol}</h1>
            <Badge className={trade.direction === "Long" ? "bg-green-500/15 text-green-500 text-sm px-3" : "bg-red-500/15 text-red-500 text-sm px-3"}>
              {trade.direction}
            </Badge>
            {trade.grade && <Badge variant="outline" className="text-sm px-3">{trade.grade}</Badge>}
            {trade.setup && <Badge variant="secondary" className="text-sm">{trade.setup}</Badge>}
            {trade.blown_account && <span title="Blew account" className="text-xl">💥</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{trade.trade_date}</span>
            {trade.session && <><span>·</span><span>{trade.session}</span></>}
            {account?.name && <><span>·</span><span>{account.name}{account.firm ? ` (${account.firm})` : ""}</span></>}
            <span>·</span><span>{trade.contracts} contract{trade.contracts !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className={cn("text-3xl font-black md:text-4xl", isWin ? "text-green-500" : "text-red-500")}>
            {net >= 0 ? "+" : ""}{fmtMoney(Math.abs(net))}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">net · ${trade.commission.toFixed(2)} commission</div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Gross P&L",   value: fmtMoney(trade.pnl, true),            color: trade.pnl >= 0 ? "text-green-500" : "text-red-500" },
          { label: "Net P&L",     value: fmtMoney(net, true),                  color: net >= 0 ? "text-green-500" : "text-red-500" },
          { label: "Commission",  value: `$${trade.commission.toFixed(2)}`,     color: "text-amber-500" },
          { label: "R-Multiple",  value: trade.r_multiple != null ? `${trade.r_multiple}R` : "—", color: (trade.r_multiple ?? 0) >= 1 ? "text-green-500" : (trade.r_multiple ?? 0) >= 0 ? "text-amber-500" : "text-red-500" },
          { label: "Risk/Reward", value: rr ? `1:${rr}` : "—",                color: rr ? "text-primary" : "text-muted-foreground" },
          { label: "Per Contract",value: trade.contracts > 0 ? fmtMoney(net / trade.contracts, true) : "—", color: net >= 0 ? "text-green-500" : "text-red-500" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-3">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{s.label}</div>
              <div className={cn("text-lg font-black", s.color)}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Left: screenshot + notes */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                📸 Trade Screenshot
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ScreenshotUploader
                tradeId={trade.id}
                existingUrl={trade.screenshot_url ?? null}
                onUpdated={url => setTrade(t => ({ ...t, screenshot_url: url }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Trade Notes</CardTitle>
              <Button size="sm" variant="ghost" onClick={saveNotes} disabled={savingNotes}>
                <Save className="mr-1 h-3.5 w-3.5" />{savingNotes ? "Saving..." : "Save"}
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes, reflections, what you did well or wrong, what you'd do differently..."
                className="min-h-[160px] text-sm resize-none"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right: execution details */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Execution</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4 space-y-2.5">
              {[
                ["Entry",    trade.entry_price, "text-foreground"],
                ["Exit",     trade.exit_price,  isWin ? "text-green-500" : "text-red-500"],
                ["Stop",     trade.stop_price,  "text-red-500"],
                ["Commission", `$${trade.commission.toFixed(2)}`, "text-amber-500"],
              ].map(([label, value, color]) => (
                <div key={label as string} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label as string}</span>
                  <span className={cn("font-semibold", color as string)}>{value ?? "—"}</span>
                </div>
              ))}
              {(trade.open_time || trade.close_time) && (
                <div className="border-t border-border pt-2 mt-2 space-y-2">
                  {trade.open_time && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Open Time</span>
                      <span className="font-mono text-xs text-foreground">{new Date(trade.open_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                    </div>
                  )}
                  {trade.close_time && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Close Time</span>
                      <span className="font-mono text-xs text-foreground">{new Date(trade.close_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                    </div>
                  )}
                  {trade.open_time && trade.close_time && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-mono text-xs text-foreground">{(() => {
                        const diff = Math.floor((new Date(trade.close_time!).getTime() - new Date(trade.open_time!).getTime()) / 1000);
                        if (diff < 60) return `${diff}s`;
                        if (diff < 3600) return `${Math.floor(diff/60)}m ${diff%60}s`;
                        return `${Math.floor(diff/3600)}h ${Math.floor((diff%3600)/60)}m`;
                      })()}</span>
                    </div>
                  )}
                </div>
              )}
              {trade.entry_price && trade.exit_price && (
                <>
                  <div className="border-t border-border pt-2 mt-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price Move</span>
                    <span className={cn("font-semibold", isWin ? "text-green-500" : "text-red-500")}>
                      {trade.direction === "Long"
                        ? (trade.exit_price - trade.entry_price).toFixed(2)
                        : (trade.entry_price - trade.exit_price).toFixed(2)} pts
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-sm">Tags</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4 space-y-2">
              {trade.setup   && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Setup</span><Badge variant="secondary">{trade.setup}</Badge></div>}
              {trade.session && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Session</span><Badge variant="outline">{trade.session}</Badge></div>}
              {trade.grade   && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Grade</span><Badge variant="outline">{trade.grade}</Badge></div>}
              {!trade.setup && !trade.session && !trade.grade && (
                <div className="text-xs text-muted-foreground">No tags — click Edit to add setup, session, and grade</div>
              )}
            </CardContent>
          </Card>

          {/* Quick nav to day journal */}
          <Card>
            <CardContent className="px-4 py-3">
              <Link
                href={`/journal/calendar/${trade.trade_date}`}
                className="flex items-center justify-between text-sm hover:text-primary transition-colors"
              >
                <span className="text-muted-foreground">View day journal</span>
                <span className="font-medium">{trade.trade_date} →</span>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {editOpen && (
        <EditTradeModal
          trade={trade}
          accounts={accounts}
          mistakes={mistakes}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}