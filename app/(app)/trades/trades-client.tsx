"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtMoney } from "@/lib/utils";
import { Plus, Upload, Trash2, CheckSquare, Square, Pencil } from "lucide-react";
import { toast } from "sonner";

const SETUPS  = ["Trend Follow","Mean Reversion","Breakout","VWAP Reclaim","Opening Range","Supply/Demand","Liquidity Sweep","Fair Value Gap","News Play","Scalp","Other"];
const SESSIONS = ["London","NY Open","NY AM","NY PM","Asia"];
const GRADES = ["A+","A","B","C","D"];

type Trade = {
  id: string; trade_date: string; symbol: string;
  direction: "Long" | "Short"; contracts: number;
  entry_price: number | null; exit_price: number | null;
  stop_price: number | null;
  pnl: number; commission: number; r_multiple: number | null;
  setup: string | null; session: string | null; grade: string | null;
  notes: string | null;
  accounts: { name: string } | { name: string }[] | null;
  account_id: string | null;
};

type Account = { id: string; name: string; firm: string | null };

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  );
}

function EditTradeModal({
  trade, accounts, onClose, onSaved,
}: {
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
    setup:       trade.setup    ?? "",
    session:     trade.session  ?? "",
    grade:       trade.grade    ?? "",
    notes:       trade.notes    ?? "",
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
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Execution notes, mistakes, what you did well..."
                className="min-h-[80px]"
              />
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

export function TradesClient({ initialTrades, accounts }: { initialTrades: Trade[]; accounts: Account[] }) {
  const router = useRouter();
  const [trades, setTrades] = useState(initialTrades);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);

  const allSelected = trades.length > 0 && selected.size === trades.length;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(trades.map((t) => t.id)));
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} trade${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setDeleting(true);
    let failed = 0;
    for (const id of selected) {
      const res = await fetch("/api/trades", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) failed++;
    }
    setDeleting(false);
    setTrades((prev) => prev.filter((t) => !selected.has(t.id)));
    setSelected(new Set());
    if (failed) toast.error(`${failed} failed to delete`);
    else toast.success(`${selected.size} trade${selected.size > 1 ? "s" : ""} deleted`);
    router.refresh();
  }

  async function deleteSingle(id: string) {
    if (!confirm("Delete this trade? This cannot be undone.")) return;
    const res = await fetch("/api/trades", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setTrades((prev) => prev.filter((t) => t.id !== id));
    setSelected((prev) => { const next = new Set(prev); next.delete(id); return next; });
    toast.success("Trade deleted");
    router.refresh();
  }

  function handleSaved(updated: Trade) {
    const matchedAccount = accounts.find((a) => a.id === updated.account_id);
    setTrades((prev) =>
      prev.map((t) =>
        t.id === updated.id
          ? { ...updated, accounts: matchedAccount ? { name: matchedAccount.name } : null }
          : t
      )
    );
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Trade History</h1>
          <p className="text-sm text-muted-foreground">{trades.length} trades logged</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/import"><Upload className="mr-1 h-4 w-4" />Import CSV</Link></Button>
          <Button asChild><Link href="/trades/new"><Plus className="mr-1 h-4 w-4" />New Trade</Link></Button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
          <span className="text-sm font-semibold text-destructive">{selected.size} trade{selected.size > 1 ? "s" : ""} selected</span>
          <Button size="sm" variant="destructive" onClick={deleteSelected} disabled={deleting}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />{deleting ? "Deleting..." : "Delete Selected"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">All Trades</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <button onClick={toggleAll} className="flex items-center justify-center p-1">
                    {allSelected
                      ? <CheckSquare className="h-4 w-4 text-primary" />
                      : <Square className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </TableHead>
                <TableHead className="text-sm font-semibold">Date</TableHead>
                <TableHead className="text-sm font-semibold">Account</TableHead>
                <TableHead className="text-sm font-semibold">Symbol</TableHead>
                <TableHead className="text-sm font-semibold">Dir</TableHead>
                <TableHead className="text-sm font-semibold">Qty</TableHead>
                <TableHead className="text-sm font-semibold">Entry</TableHead>
                <TableHead className="text-sm font-semibold">Exit</TableHead>
                <TableHead className="text-sm font-semibold">Gross P&L</TableHead>
                <TableHead className="text-sm font-semibold">Net P&L</TableHead>
                <TableHead className="text-sm font-semibold">R</TableHead>
                <TableHead className="text-sm font-semibold">Setup</TableHead>
                <TableHead className="text-sm font-semibold">Grade</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((t) => {
                const net = (t.pnl ?? 0) - (t.commission ?? 0);
                const isSelected = selected.has(t.id);
                return (
                  <TableRow
                    key={t.id}
                    className={`cursor-pointer hover:bg-accent/50 ${isSelected ? "bg-primary/5" : ""}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      router.push(`/journal/${t.id}`);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(t.id)} className="flex items-center justify-center p-1">
                        {isSelected
                          ? <CheckSquare className="h-4 w-4 text-primary" />
                          : <Square className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">{t.trade_date}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{Array.isArray(t.accounts) ? t.accounts[0]?.name : t.accounts?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm font-bold">{t.symbol}</TableCell>
                    <TableCell>
                      <Badge className={t.direction === "Long" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>
                        {t.direction}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{t.contracts}</TableCell>
                    <TableCell className="text-sm">{t.entry_price ?? "—"}</TableCell>
                    <TableCell className="text-sm">{t.exit_price ?? "—"}</TableCell>
                    <TableCell className={`text-base font-bold ${(t.pnl ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {fmtMoney(t.pnl ?? 0)}
                    </TableCell>
                    <TableCell className={`text-base font-bold ${net >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {fmtMoney(net)}
                    </TableCell>
                    <TableCell className="text-sm">{t.r_multiple != null ? `${t.r_multiple}R` : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.setup ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{t.grade ?? "—"}</Badge></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()} className="flex items-center gap-1 py-2">
                      <Button
                        size="icon" variant="ghost"
                        onClick={() => setEditing(t)}
                        className="h-7 w-7"
                        title="Edit trade"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => deleteSingle(t.id)} className="h-7 w-7">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {trades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={14} className="py-12 text-center text-muted-foreground">
                    No trades yet — <Link href="/trades/new" className="text-primary underline">log your first trade</Link> or <Link href="/import" className="text-primary underline">import a CSV</Link>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing && (
        <EditTradeModal
          trade={editing}
          accounts={accounts}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}