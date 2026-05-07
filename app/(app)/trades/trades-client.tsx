"use client";
import { useState, useMemo } from "react";
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

type AccountType = "eval" | "funded" | "live" | "pa" | "all";

type Trade = {
  id: string; trade_date: string; symbol: string;
  direction: "Long" | "Short"; contracts: number;
  entry_price: number | null; exit_price: number | null;
  stop_price: number | null;
  pnl: number; commission: number; r_multiple: number | null;
  setup: string | null; session: string | null; grade: string | null;
  notes: string | null;
  blown_account: boolean;
  accounts: { name: string; firm?: string | null; type?: string | null } | { name: string; firm?: string | null; type?: string | null }[] | null;
  account_id: string | null;
};

type Account = { id: string; name: string; firm: string | null; type: string | null };

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
    blown_account: trade.blown_account ?? false,
  });

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

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
        {/* Blown account checkbox - only for eval/funded */}
        {(() => {
          const acc = accounts.find((a) => a.id === form.account_id);
          if (acc?.type !== "eval" && acc?.type !== "funded") return null;
          return (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={!!form.blown_account}
                onChange={(e) => setForm((f) => ({ ...f, blown_account: e.target.checked }))}
                className="h-4 w-4 rounded border-input accent-red-500"
              />
              <span className="text-sm text-muted-foreground">This trade blew the account <span className="text-xs">(marks account as Failed)</span></span>
            </label>
          );
        })()}
        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ACCOUNT_TYPE_TABS: { value: AccountType; label: string; color: string }[] = [
  { value: "all",    label: "All",    color: "bg-primary/15 text-primary border-primary/30" },
  { value: "eval",   label: "Eval",   color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  { value: "funded", label: "Funded", color: "bg-blue-500/15 text-blue-500 border-blue-500/30" },
  { value: "live",   label: "Live",   color: "bg-green-500/15 text-green-500 border-green-500/30" },
];

function getTradeAccountType(trade: Trade, accounts: Account[]): string | null {
  if (!trade.account_id) return null;
  const acc = accounts.find((a) => a.id === trade.account_id);
  if (acc) return acc.type;
  // fallback: from joined data
  const joined = Array.isArray(trade.accounts) ? trade.accounts[0] : trade.accounts;
  return (joined as any)?.type ?? null;
}

export function TradesClient({ initialTrades, accounts, autoCommission }: { initialTrades: Trade[]; accounts: Account[]; autoCommission: number | null }) {
  const router = useRouter();
  const [trades, setTrades] = useState(initialTrades);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastSelectedIdx, setLastSelectedIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [activeTab, setActiveTab] = useState<AccountType>("all");

  // Determine which tabs actually have data
  const availableTabs = useMemo(() => {
    const types = new Set(trades.map((t) => getTradeAccountType(t, accounts) ?? ""));
    return ACCOUNT_TYPE_TABS.filter((tab) => tab.value === "all" || types.has(tab.value));
  }, [trades, accounts]);

  const filteredTrades = useMemo(() => {
    if (activeTab === "all") return trades;
    return trades.filter((t) => {
      const type = getTradeAccountType(t, accounts);
      return type === activeTab;
    });
  }, [trades, activeTab, accounts]);

  const allSelected = filteredTrades.length > 0 && filteredTrades.every((t) => selected.has(t.id));

  function handleRowClick(e: React.MouseEvent, id: string, idx: number) {
    if (e.shiftKey && lastSelectedIdx !== null) {
      // Shift+click: select range
      const from = Math.min(lastSelectedIdx, idx);
      const to   = Math.max(lastSelectedIdx, idx);
      setSelected(prev => {
        const next = new Set(prev);
        filteredTrades.slice(from, to + 1).forEach(t => next.add(t.id));
        return next;
      });
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+click: toggle individual
      setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      setLastSelectedIdx(idx);
    } else {
      // Plain click on checkbox column: toggle
      setSelected(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
      setLastSelectedIdx(idx);
    }
  }

  function toggleSelect(id: string, idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setLastSelectedIdx(idx);
  }

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredTrades.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelected((prev) => new Set([...prev, ...filteredTrades.map((t) => t.id)]));
    }
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

  const selectedInView = filteredTrades.filter((t) => selected.has(t.id)).length;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold md:text-4xl">Trade History</h1>
          <p className="text-sm text-muted-foreground">{filteredTrades.length} trades{activeTab !== "all" ? ` · ${activeTab}` : ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/import"><Upload className="mr-1 h-4 w-4" />Import CSV</Link></Button>
          <Button asChild><Link href="/trades/new"><Plus className="mr-1 h-4 w-4" />New Trade</Link></Button>
        </div>
      </div>

      {/* Account type pill toggle */}
      <div className="mb-5 flex items-center gap-1.5 flex-wrap">
        {availableTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition-all ${
              activeTab === tab.value
                ? tab.color
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="ml-1.5 opacity-60">
                {trades.filter((t) => getTradeAccountType(t, accounts) === tab.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {selectedInView > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
  <span className="text-sm font-semibold text-destructive">{selectedInView} trade{selectedInView > 1 ? "s" : ""} selected</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Shift+click to select range · Ctrl+click to multi-select</span>
          <Button size="sm" variant="destructive" onClick={deleteSelected} disabled={deleting}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />{deleting ? "Deleting..." : "Delete Selected"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">
          {activeTab === "all" ? "All Trades" : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Trades`}
        </CardTitle></CardHeader>
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
              {filteredTrades.map((t, idx) => {
                const net = (t.pnl ?? 0) - (t.commission ?? 0);
                const isSelected = selected.has(t.id);
                return (
                  <TableRow
                    key={t.id}
                    className={`cursor-pointer hover:bg-accent/50 ${isSelected ? "bg-primary/5" : ""}`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button")) return;
                      if (e.shiftKey || e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleRowClick(e, t.id, idx);
                        return;
                      }
                      router.push(`/journal/${t.id}`);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => { e.stopPropagation(); toggleSelect(t.id, idx); }} className="flex items-center justify-center p-1">
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{t.grade ?? "—"}</Badge>
                        {t.blown_account && <span title="Blew account" className="text-base leading-none">💥</span>}
                      </div>
                    </TableCell>
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
              {filteredTrades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={14} className="py-12 text-center text-muted-foreground">
                    {activeTab === "all"
                      ? <>No trades yet — <Link href="/trades/new" className="text-primary underline">log your first trade</Link> or <Link href="/import" className="text-primary underline">import a CSV</Link></>
                      : `No ${activeTab} trades found`}
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