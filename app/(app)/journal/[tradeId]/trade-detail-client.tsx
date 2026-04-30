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
import { ArrowLeft, Trash2, TrendingUp, TrendingDown, BarChart2, Save, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { fmtMoney } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const SETUPS  = ["Trend Follow","Mean Reversion","Breakout","VWAP Reclaim","Opening Range","Supply/Demand","Liquidity Sweep","Fair Value Gap","News Play","Scalp","Other"];
const SESSIONS = ["London","NY Open","NY AM","NY PM","Asia"];
const GRADES   = ["A+","A","B","C","D"];

type Trade = {
  id: string; trade_date: string; symbol: string;
  direction: "Long" | "Short"; contracts: number;
  entry_price: number | null; exit_price: number | null; stop_price: number | null;
  pnl: number; commission: number; r_multiple: number | null;
  setup: string | null; session: string | null; grade: string | null;
  notes: string | null; account_id: string | null; screenshot_url?: string | null;
  accounts: { name: string; firm: string | null } | { name: string; firm: string | null }[] | null;
};

type Account = { id: string; name: string; firm: string | null };
type AdjacentTrades = { prev: string | null; next: string | null };

function getAccount(accounts: Trade["accounts"]) {
  if (!accounts) return null;
  return Array.isArray(accounts) ? accounts[0] ?? null : accounts;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

function TradeScreenshot({ tradeId, existingUrl }: { tradeId: string; existingUrl: string | null }) {
  const [url, setUrl] = useState(existingUrl);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image file"); return; }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `trade-screenshots/${tradeId}.${ext}`;
    const { error: upErr } = await supabase.storage.from("trade-screenshots").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Upload failed: " + upErr.message); setUploading(false); return; }
    const { data } = supabase.storage.from("trade-screenshots").getPublicUrl(path);
    const publicUrl = data.publicUrl + "?t=" + Date.now();
    await supabase.from("trades").update({ screenshot_url: publicUrl }).eq("id", tradeId);
    setUrl(publicUrl);
    setUploading(false);
    toast.success("Screenshot saved");
  }

  async function removeScreenshot() {
    if (!confirm("Remove this screenshot?")) return;
    await supabase.from("trades").update({ screenshot_url: null }).eq("id", tradeId);
    setUrl(null);
    toast.success("Screenshot removed");
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  return (
    <div className="relative">
      {url ? (
        <div className="relative group rounded-b-lg overflow-hidden">
          <img src={url} alt="Trade screenshot" className="w-full object-contain max-h-[480px] bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
            <label className="cursor-pointer rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
              Replace
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </label>
            <button onClick={removeScreenshot} className="rounded-md bg-destructive px-4 py-2 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90">
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center gap-3 rounded-b-lg border-2 border-dashed border-border bg-muted/30 min-h-[240px] p-8 text-center transition-colors hover:border-primary/50"
        >
          {uploading ? (
            <div className="text-sm text-muted-foreground animate-pulse">Uploading...</div>
          ) : (
            <>
              <div className="text-3xl">📸</div>
              <div className="text-sm font-medium">Drop a screenshot here</div>
              <div className="text-xs text-muted-foreground">or</div>
              <label className="cursor-pointer rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors">
                Choose File
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              </label>
              <div className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP supported</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function EditTradeModal({ trade, accounts, onClose, onSaved }: {
  trade: Trade; accounts: Account[]; onClose: () => void; onSaved: (t: Trade) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    trade_date:  trade.trade_date,
    account_id:  trade.account_id ?? "",
    symbol:      trade.symbol,
    direction:   trade.direction,
    contracts:   String(trade.contracts),
    pnl:         String(trade.pnl),
    entry_price: trade.entry_price != null ? String(trade.entry_price) : "",
    exit_price:  trade.exit_price  != null ? String(trade.exit_price)  : "",
    stop_price:  trade.stop_price  != null ? String(trade.stop_price)  : "",
    commission:  String(trade.commission),
    setup:       trade.setup   ?? "",
    session:     trade.session ?? "",
    grade:       trade.grade   ?? "",
    notes:       trade.notes   ?? "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
    if (!res.ok) { toast.error(data.error ?? "Failed to save"); return; }
    toast.success("Trade updated!");
    onSaved(data.trade);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Trade — {trade.symbol} {trade.trade_date}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" value={form.trade_date} onChange={(e) => set("trade_date", e.target.value)} />
          </Field>
          <Field label="Account">
            <Select value={form.account_id || "__none__"} onValueChange={(v) => set("account_id", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="No account" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No account</SelectItem>
                {accounts.map((a) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}{a.firm ? ` (${a.firm})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Symbol">
            <Input value={form.symbol} onChange={(e) => set("symbol", e.target.value.toUpperCase())} placeholder="ES, NQ, CL..." />
          </Field>
          <Field label="Direction">
            <Select value={form.direction} onValueChange={(v) => set("direction", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Long">Long</SelectItem>
                <SelectItem value="Short">Short</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Contracts">
            <Input type="number" min="1" value={form.contracts} onChange={(e) => set("contracts", e.target.value)} />
          </Field>
          <Field label="P&L ($)">
            <Input type="number" step="0.01" value={form.pnl} onChange={(e) => set("pnl", e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Entry Price">
            <Input type="number" step="0.25" value={form.entry_price} onChange={(e) => set("entry_price", e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Exit Price">
            <Input type="number" step="0.25" value={form.exit_price} onChange={(e) => set("exit_price", e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Stop Price">
            <Input type="number" step="0.25" value={form.stop_price} onChange={(e) => set("stop_price", e.target.value)} placeholder="0.00" />
          </Field>
          <Field label="Commission ($)">
            <Input type="number" step="0.01" value={form.commission} onChange={(e) => set("commission", e.target.value)} />
          </Field>
          <Field label="Setup">
            <Select value={form.setup || "__none__"} onValueChange={(v) => set("setup", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select setup" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {SETUPS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Session">
            <Select value={form.session || "__none__"} onValueChange={(v) => set("session", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {SESSIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Grade">
            <Select value={form.grade || "__none__"} onValueChange={(v) => set("grade", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {GRADES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Notes">
              <Textarea value={form.notes} onChange={(e) => set("notes", e.target.value)}
                placeholder="Execution notes, mistakes, what you did well..."
                className="min-h-[80px]" />
            </Field>
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TradeDetailClient({ trade: initialTrade, adjacent, accounts }: {
  trade: Trade; adjacent?: AdjacentTrades; accounts: Account[];
}) {
  const router = useRouter();
  const [trade, setTrade] = useState(initialTrade);
  const [notes, setNotes] = useState(trade.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const net = trade.pnl - trade.commission;
  const account = getAccount(trade.accounts);
  const isWin = net >= 0;

  const rr = trade.entry_price && trade.stop_price && trade.exit_price
    ? (() => {
        const risk = Math.abs(trade.entry_price - trade.stop_price);
        const reward = trade.direction === "Long"
          ? trade.exit_price - trade.entry_price
          : trade.entry_price - trade.exit_price;
        return risk > 0 ? (reward / risk).toFixed(2) : null;
      })()
    : null;

  const pnlPerContract = trade.contracts > 0 ? net / trade.contracts : null;

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
    setTrade((t) => ({ ...t, notes }));
  }

  function handleSaved(updated: Trade) {
    setTrade(updated);
    setNotes(updated.notes ?? "");
    setEditOpen(false);
    router.refresh();
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
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
            <Pencil className="mr-1 h-3.5 w-3.5" />Edit Trade
          </Button>
          <Button variant="destructive" size="sm" onClick={deleteTrade}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg ${isWin ? "bg-green-600 shadow-green-900/30" : "bg-red-600 shadow-red-900/30"}`}>
          {isWin ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black">{trade.symbol}</h1>
            <Badge className={trade.direction === "Long" ? "bg-green-500/15 text-green-500 text-sm px-3" : "bg-red-500/15 text-red-500 text-sm px-3"}>
              {trade.direction}
            </Badge>
            {trade.grade && <Badge variant="outline" className="text-sm px-3">{trade.grade}</Badge>}
            {trade.setup && <Badge variant="secondary" className="text-sm">{trade.setup}</Badge>}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{trade.trade_date}</span>
            {trade.session && <><span>·</span><span>{trade.session}</span></>}
            {account?.name && <><span>·</span><span>{account.name}{account.firm ? ` (${account.firm})` : ""}</span></>}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className={`text-3xl font-black md:text-4xl truncate ${isWin ? "text-green-500" : "text-red-500"}`}>
            {net >= 0 ? "+" : ""}{fmtMoney(Math.abs(net))}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Net · ${trade.commission.toFixed(2)} fees</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Gross P&L",    value: fmtMoney(trade.pnl, true), color: trade.pnl >= 0 ? "text-green-500" : "text-red-500" },
          { label: "Net P&L",      value: fmtMoney(net, true),       color: net >= 0 ? "text-green-500" : "text-red-500" },
          { label: "R-Multiple",   value: trade.r_multiple != null ? `${trade.r_multiple}R` : "No stop set", color: trade.r_multiple == null ? "text-muted-foreground text-sm" : (trade.r_multiple ?? 0) >= 1 ? "text-green-500" : (trade.r_multiple ?? 0) >= 0 ? "text-amber-500" : "text-red-500" },
          { label: "Risk/Reward",  value: rr ? `1:${rr}` : "No stop set", color: rr ? "text-primary" : "text-muted-foreground text-sm" },
          { label: "Contracts",    value: String(trade.contracts),   color: "text-foreground" },
          { label: "Per Contract", value: pnlPerContract != null ? fmtMoney(pnlPerContract, true) : "—", color: (pnlPerContract ?? 0) >= 0 ? "text-green-500" : "text-red-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Info */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />Trade Screenshot
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg">
            <TradeScreenshot tradeId={trade.id} existingUrl={trade.screenshot_url ?? null} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Execution</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {[
                ["Entry",      trade.entry_price,  "text-green-500"],
                ["Exit",       trade.exit_price,   isWin ? "text-green-500" : "text-red-500"],
                ["Stop",       trade.stop_price,   "text-red-500"],
                ["Commission", `$${trade.commission.toFixed(2)}`, "text-amber-500"],
              ].map(([label, value, color]) => (
                <div key={label as string} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label as string}</span>
                  <span className={`font-semibold ${color as string}`}>{value ?? "—"}</span>
                </div>
              ))}
              {trade.entry_price && trade.exit_price && (
                <>
                  <div className="border-t pt-2 mt-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price Move</span>
                    <span className={`font-semibold ${isWin ? "text-green-500" : "text-red-500"}`}>
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
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Trade Notes</CardTitle>
              <Button size="sm" variant="ghost" onClick={saveNotes} disabled={savingNotes}>
                <Save className="mr-1 h-3.5 w-3.5" />{savingNotes ? "Saving..." : "Save"}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes, reflections, what you did well or wrong..."
                className="min-h-[140px] text-sm resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {editOpen && (
        <EditTradeModal
          trade={trade}
          accounts={accounts}
          onClose={() => setEditOpen(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}