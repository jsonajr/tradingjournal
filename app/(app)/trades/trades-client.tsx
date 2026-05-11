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
  mistake_id: string | null;
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
  trade, accounts, mistakes, onClose, onSaved,
}: {
  trade: Trade; accounts: Account[]; mistakes: Mistake[]; onClose: () => void; onSaved: (t: Trade) => void;
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
    mistake_id:    trade.mistake_id   ?? "",
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
        {/* Mistake dropdown */}
        {mistakes.length > 0 && (
          <div className="mt-3">
            <Field label="Mistake (optional)">
              <Select value={form.mistake_id || "__none__"} onValueChange={v => set("mistake_id", v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="None" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {mistakes.map(m => <SelectItem key={m.id} value={m.id}>❌ {m.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        )}

        {/* Blown account toggle - only for eval/funded */}
        {(() => {
          const acc = accounts.find((a) => a.id === form.account_id);
          if (acc?.type !== "eval" && acc?.type !== "funded") return null;
          return (
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, blown_account: !f.blown_account }))}
                className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all ${form.blown_account ? "border-red-500 bg-red-500/10" : "border-border hover:border-red-500/40"}`}
              >
                <span className={!form.blown_account ? "grayscale opacity-40 text-xl" : "text-xl"}>💥</span>
                <div className="flex-1">
                  <div className={`text-sm font-semibold ${form.blown_account ? "text-red-500" : "text-foreground"}`}>This trade blew the account</div>
                  <div className="text-xs text-muted-foreground">Marks account status as Failed</div>
                </div>
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${form.blown_account ? "border-red-500 bg-red-500" : "border-muted-foreground"}`}>
                  {form.blown_account && <div className="h-2 w-2 rounded-full bg-white" />}
                </div>
              </button>
            </div>
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


/* ── Mass Edit Modal ─────────────────────────────────────────────────────── */
function MassEditModal({ count, accounts, onClose, onSaved }: {
  count: number;
  accounts: Account[];
  onClose: () => void;
  onSaved: (patch: Record<string, any>) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    account_id: "",
    setup:      "",
    session:    "",
    grade:      "",
    commission: "",
    notes:      "",
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  function save() {
    // Only include fields the user actually filled in
    const patch: Record<string, any> = {};
    if (form.account_id) patch.account_id = form.account_id;
    if (form.setup)      patch.setup      = form.setup === "__clear__" ? null : form.setup;
    if (form.session)    patch.session    = form.session === "__clear__" ? null : form.session;
    if (form.grade)      patch.grade      = form.grade === "__clear__" ? null : form.grade;
    if (form.commission !== "") patch.commission = parseFloat(form.commission) || 0;
    if (form.notes)      patch.notes      = form.notes;

    if (Object.keys(patch).length === 0) {
      toast.error("Fill in at least one field to update");
      return;
    }
    onSaved(patch);
  }

  return (
    <Dialog open onOpenChange={o => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Mass Edit</span>
            <Badge variant="secondary">{count} trades</Badge>
          </DialogTitle>
        </DialogHeader>
        <p className="text-xs text-muted-foreground -mt-2 mb-1">
          Only the fields you fill in will be updated. Leave blank to keep existing values.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Account</Label>
            <Select value={form.account_id || "__none__"} onValueChange={v => set("account_id", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="— keep existing —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— keep existing —</SelectItem>
                {accounts.map(a => (
                  <SelectItem key={a.id} value={a.id}>{a.name}{a.firm ? ` (${a.firm})` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Commission ($)</Label>
            <Input type="number" step="0.01" placeholder="— keep existing —" value={form.commission} onChange={e => set("commission", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Setup</Label>
            <Select value={form.setup || "__none__"} onValueChange={v => set("setup", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="— keep existing —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— keep existing —</SelectItem>
                <SelectItem value="__clear__">Clear setup</SelectItem>
                {["Trend Follow","Mean Reversion","Breakout","VWAP Reclaim","Opening Range","Supply/Demand","Liquidity Sweep","Fair Value Gap","News Play","Scalp","Other","ICT CISD","ICT Fair Value Gap","ICT Order Block","ICT Liquidity Sweep","ICT Optimal Trade Entry","ICT Breaker Block","ICT Power of 3"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Session</Label>
            <Select value={form.session || "__none__"} onValueChange={v => set("session", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="— keep existing —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— keep existing —</SelectItem>
                <SelectItem value="__clear__">Clear session</SelectItem>
                {["London","NY Open","NY AM","NY PM","Asia"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Grade</Label>
            <Select value={form.grade || "__none__"} onValueChange={v => set("grade", v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="— keep existing —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— keep existing —</SelectItem>
                <SelectItem value="__clear__">Clear grade</SelectItem>
                {["A+","A","B","C","D"].map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 space-y-1.5">
            <Label className="text-xs uppercase tracking-wide">Notes (appends to existing)</Label>
            <Textarea value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Leave blank to keep existing notes..." className="min-h-[60px]" />
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving..." : `Update ${count} Trade${count > 1 ? "s" : ""}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

type Mistake = { id: string; title: string };
export function TradesClient({ initialTrades, accounts, autoCommission, mistakes = [] }: { initialTrades: Trade[]; accounts: Account[]; autoCommission: number | null; mistakes?: Mistake[] }) {
  const router = useRouter();
  const [trades, setTrades] = useState(initialTrades);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [lastSelectedIdx, setLastSelectedIdx] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [massEditing, setMassEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<AccountType>("all");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("all");

  // Determine which tabs actually have data
  const availableTabs = useMemo(() => {
    const types = new Set(trades.map((t) => getTradeAccountType(t, accounts) ?? ""));
    return ACCOUNT_TYPE_TABS.filter((tab) => tab.value === "all" || types.has(tab.value));
  }, [trades, accounts]);

  const filteredTrades = useMemo(() => {
    let result = trades;
    if (activeTab !== "all") {
      result = result.filter((t) => {
        const type = getTradeAccountType(t, accounts);
        return type === activeTab;
      });
    }
    if (selectedAccountId !== "all") {
      result = result.filter((t) => t.account_id === selectedAccountId);
    }
    // Sort: date desc, then group by symbol + pnl so copy-traded accounts stack together
    return [...result].sort((a, b) => {
      if (b.trade_date !== a.trade_date) return b.trade_date.localeCompare(a.trade_date);
      if (a.symbol !== b.symbol) return a.symbol.localeCompare(b.symbol);
      return b.pnl - a.pnl;
    });
  }, [trades, activeTab, selectedAccountId, accounts]);

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

  async function massEditSelected(patch: Record<string, any>) {
    const ids = filteredTrades.filter(t => selected.has(t.id)).map(t => t.id);
    if (ids.length === 0) return;
    let failed = 0;
    for (const id of ids) {
      const trade = trades.find(t => t.id === id);
      if (!trade) continue;
      const res = await fetch("/api/trades/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...trade, accounts: undefined, ...patch, id }),
      });
      if (!res.ok) failed++;
    }
    // Update local state
    setTrades(prev => prev.map(t => {
      if (!selected.has(t.id)) return t;
      const updated = { ...t, ...patch };
      if (patch.notes && t.notes && !patch.notes.startsWith(t.notes)) {
        updated.notes = t.notes + "\n" + patch.notes;
      }
      return updated;
    }));
    setMassEditing(false);
    setSelected(new Set());
    if (failed) toast.error(`${failed} failed to update`);
    else toast.success(`${ids.length} trade${ids.length > 1 ? "s" : ""} updated`);
    router.refresh();
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
          <p className="text-sm text-muted-foreground">
            {filteredTrades.length} trades
            {activeTab !== "all" ? ` · ${activeTab}` : ""}
            {selectedAccountId !== "all" ? ` · ${accounts.find(a => a.id === selectedAccountId)?.name ?? ""}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/import"><Upload className="mr-1 h-4 w-4" />Import CSV</Link></Button>
          <Button asChild><Link href="/trades/new"><Plus className="mr-1 h-4 w-4" />New Trade</Link></Button>
        </div>
      </div>

      {/* Account type pill toggle */}
      <div className="mb-3 flex items-center gap-1.5 flex-wrap">
        {availableTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setSelectedAccountId("all"); }}
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

      {/* Account dropdown filter */}
      {accounts.length > 0 && (
        <div className="mb-5 flex items-center gap-2">
          <span className="text-xs text-muted-foreground shrink-0">Account:</span>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary max-w-xs"
          >
            <option value="all">All Accounts</option>
            {accounts
              .filter((a) => activeTab === "all" || a.type === activeTab)
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}{a.firm ? ` (${a.firm})` : ""}
                </option>
              ))}
          </select>
          {selectedAccountId !== "all" && (
            <button
              onClick={() => setSelectedAccountId("all")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear ✕
            </button>
          )}
        </div>
      )}

      {selectedInView > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3">
  <span className="text-sm font-semibold">{selectedInView} trade{selectedInView > 1 ? "s" : ""} selected</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">Shift+click to select range · Ctrl+click to multi-select</span>
          <Button size="sm" variant="outline" onClick={() => setMassEditing(true)}>
            <Pencil className="mr-1 h-3.5 w-3.5" />Mass Edit
          </Button>
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
                    <TableCell className={`text-base font-bold ${net >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {fmtMoney(net)}
                    </TableCell>
                    <TableCell className="text-sm">{t.r_multiple != null ? `${t.r_multiple}R` : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{t.setup ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline">{t.grade ?? "—"}</Badge>
                        {t.mistake_id && mistakes.find(m => m.id === t.mistake_id) && (
                          <Badge variant="outline" className="text-[10px] border-red-500/30 text-red-500 bg-red-500/5 max-w-[120px] truncate">
                            ❌ {mistakes.find(m => m.id === t.mistake_id)?.title}
                          </Badge>
                        )}
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

      {massEditing && (
        <MassEditModal
          count={filteredTrades.filter(t => selected.has(t.id)).length}
          accounts={accounts}
          onClose={() => setMassEditing(false)}
          onSaved={massEditSelected}
        />
      )}

      {editing && (
        <EditTradeModal
          trade={editing}
          accounts={accounts}
          mistakes={mistakes}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}