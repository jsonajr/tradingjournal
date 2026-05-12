"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Upload, Trash2, BookOpen, CheckSquare, Square } from "lucide-react";
import { fmtMoney } from "@/lib/utils";
import { toast } from "sonner";

type Account = { id: string; name: string; firm: string | null; type: string };
type Trade = {
  id: string;
  trade_date: string;
  symbol: string;
  direction: "Long" | "Short";
  contracts: number;
  entry_price: number | null;
  exit_price: number | null;
  pnl: number;
  commission: number;
  r_multiple: number | null;
  setup: string | null;
  grade: string | null;
  account_id: string | null;
};

const SYMBOLS = ["ES","NQ","MES","MNQ","CL","GC","RTY","YM","Other"];
const SESSIONS = ["London","NY Open","NY AM","NY PM","Asia"];
const GRADES = ["A+","A","B","C","D"];

export function JournalClient({ initialTrades, accounts, userId }: { initialTrades: Trade[]; accounts: Account[]; userId: string }) {
  const router = useRouter();
  const [trades, setTrades] = useState(initialTrades);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({
    trade_date: today, account_id: accounts[0]?.id ?? "", symbol: "ES",
    direction: "Long" as "Long" | "Short", contracts: "1", entry_price: "",
    exit_price: "", stop_price: "", pnl: "", commission: "4.00",
    setup: "", session: "NY AM", grade: "B", notes: "",
  });

  const [importAccount, setImportAccount] = useState(accounts[0]?.id ?? "");
  const [importPlatform, setImportPlatform] = useState<"tradovate" | "projectx" | "generic">("tradovate");
  const [importCsv, setImportCsv] = useState("");
  const [importing, setImporting] = useState(false);

  async function saveTrade() {
    if (!form.account_id) { toast.error("Please select an account"); return; }
    const res = await fetch("/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        contracts: parseInt(form.contracts) || 1,
        entry_price: parseFloat(form.entry_price) || null,
        exit_price: parseFloat(form.exit_price) || null,
        stop_price: parseFloat(form.stop_price) || null,
        pnl: parseFloat(form.pnl) || 0,
        commission: parseFloat(form.commission) || 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error ?? "Failed"); return; }
    setTrades([data.trade, ...trades]);
    setTradeDialogOpen(false);
    router.refresh();
  }

  async function deleteTrade(id: string) {
    if (!confirm("Delete this trade?")) return;
    const res = await fetch("/api/trades", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    setTrades(trades.filter((t) => t.id !== id));
    toast.success("Trade deleted");
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} trade(s)? This cannot be undone.`)) return;
    let failed = 0;
    for (const id of selected) {
      const res = await fetch("/api/trades", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      if (!res.ok) failed++;
    }
    setTrades(trades.filter((t) => !selected.has(t.id)));
    setSelected(new Set());
    if (failed) toast.error(`${failed} failed to delete`);
    else toast.success(`${selected.size} trades deleted`);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  }
  function toggleAll() {
    setSelected(selected.size === trades.length ? new Set() : new Set(trades.map((t) => t.id)));
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setImportCsv(await f.text());
  }

  async function runImport() {
    if (!importAccount) { toast.error("Select an account first"); return; }
    if (!importCsv) { toast.error("Upload or paste a CSV"); return; }
    setImporting(true);
    const res = await fetch("/api/import-csv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv: importCsv, platform: importPlatform, account_id: importAccount }) });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) { toast.error(data.error ?? "Import failed"); return; }
    toast.success(`Imported ${data.imported} trades`);
    setImportDialogOpen(false);
    setImportCsv("");
    router.refresh();
  }

  const noAccounts = accounts.length === 0;
  const allSelected = trades.length > 0 && selected.size === trades.length;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Trading Journal</h1>
          <p className="text-sm text-muted-foreground">{trades.length} trades logged</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Button variant="outline" asChild><Link href="/journal/calendar"><BookOpen className="mr-1 h-4 w-4" />Playbook</Link></Button>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild><Button variant="outline"><Upload className="mr-1 h-4 w-4" />Import CSV</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Import Trades from CSV</DialogTitle><DialogDescription>Tradovate, ProjectX, or generic CSV format.</DialogDescription></DialogHeader>
              {noAccounts ? (
                <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-600">Add a trading account in Settings first.</div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5"><Label>Assign to Account</Label>
                    <Select value={importAccount} onValueChange={setImportAccount}>
                      <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                      <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}{a.firm ? ` (${a.firm})` : ""}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>Platform</Label>
                    <Select value={importPlatform} onValueChange={(v) => setImportPlatform(v as "tradovate" | "projectx" | "generic")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tradovate">Tradovate</SelectItem>
                        <SelectItem value="projectx">ProjectX</SelectItem>
                        <SelectItem value="generic">Generic CSV</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5"><Label>CSV File</Label><Input type="file" accept=".csv,text/csv" onChange={handleFile} /></div>
                  {importCsv && <div className="rounded-md border bg-muted p-2 text-xs font-mono max-h-24 overflow-auto">{importCsv.split("\n").slice(0, 4).join("\n")}{importCsv.split("\n").length > 4 ? "\n..." : ""}</div>}
                </div>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                <Button onClick={runImport} disabled={importing || noAccounts}>{importing ? "Importing..." : "Import"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={tradeDialogOpen} onOpenChange={setTradeDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="mr-1 h-4 w-4" />Log Trade</Button></DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Log a Trade</DialogTitle></DialogHeader>
              {noAccounts ? (
                <div className="rounded-md border border-amber-500/50 bg-amber-500/10 p-3 text-sm text-amber-600">
                  <Link href="/settings" className="font-medium underline">Add a trading account in Settings</Link> before logging trades.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date"><Input type="date" value={form.trade_date} onChange={(e) => setForm({ ...form, trade_date: e.target.value })} /></Field>
                  <Field label="Account">
                    <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>{accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Symbol">
                    <Select value={form.symbol} onValueChange={(v) => setForm({ ...form, symbol: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SYMBOLS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Direction">
                    <Select value={form.direction} onValueChange={(v) => setForm({ ...form, direction: v as "Long" | "Short" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Long">Long</SelectItem><SelectItem value="Short">Short</SelectItem></SelectContent>
                    </Select>
                  </Field>
                  <Field label="Contracts"><Input type="number" min="1" value={form.contracts} onChange={(e) => setForm({ ...form, contracts: e.target.value })} /></Field>
                  <Field label="P&L ($)"><Input type="number" step="0.01" value={form.pnl} onChange={(e) => setForm({ ...form, pnl: e.target.value })} placeholder="0.00" /></Field>
                  <Field label="Entry"><Input type="number" step="0.25" value={form.entry_price} onChange={(e) => setForm({ ...form, entry_price: e.target.value })} placeholder="0.00" /></Field>
                  <Field label="Exit"><Input type="number" step="0.25" value={form.exit_price} onChange={(e) => setForm({ ...form, exit_price: e.target.value })} placeholder="0.00" /></Field>
                  <Field label="Stop"><Input type="number" step="0.25" value={form.stop_price} onChange={(e) => setForm({ ...form, stop_price: e.target.value })} placeholder="0.00" /></Field>
                  <Field label="Commission"><Input type="number" step="0.01" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} /></Field>
                  <Field label="Setup">
                    <Input value={form.setup} onChange={(e) => setForm({ ...form, setup: e.target.value })} placeholder="e.g. ICT FVG, VWAP Reclaim..." />
                  </Field>
                  <Field label="Session">
                    <Select value={form.session} onValueChange={(v) => setForm({ ...form, session: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{SESSIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <Field label="Grade">
                    <Select value={form.grade} onValueChange={(v) => setForm({ ...form, grade: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{GRADES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </Field>
                  <div className="col-span-2"><Field label="Notes"><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Execution notes..." /></Field></div>
                </div>
              )}
              <DialogFooter>
                <Button variant="ghost" onClick={() => setTradeDialogOpen(false)}>Cancel</Button>
                <Button onClick={saveTrade} disabled={noAccounts}>Save Trade</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3">
          <span className="text-sm font-medium text-destructive">{selected.size} trade{selected.size > 1 ? "s" : ""} selected</span>
          <Button size="sm" variant="destructive" onClick={deleteSelected}><Trash2 className="mr-1 h-3.5 w-3.5" />Delete Selected</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
        </div>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">All Trades</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <button onClick={toggleAll} className="flex items-center justify-center">
                    {allSelected ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Dir</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>P&L</TableHead>
                <TableHead>Net P&L</TableHead>
                <TableHead>R</TableHead>
                <TableHead>Setup</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((t) => {
                const net = t.pnl - t.commission;
                return (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest("button,input")) return;
                      router.push(`/journal/${t.id}`);
                    }}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(t.id)} className="flex items-center justify-center">
                        {selected.has(t.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs">{t.trade_date}</TableCell>
                    <TableCell className="font-semibold">{t.symbol}</TableCell>
                    <TableCell>
                      <Badge className={t.direction === "Long" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>
                        {t.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.contracts}</TableCell>
                    <TableCell className={`font-semibold ${t.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(t.pnl)}</TableCell>
                    <TableCell className={`font-semibold ${net >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(net)}</TableCell>
                    <TableCell className="text-xs">{t.r_multiple != null ? `${t.r_multiple}R` : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.setup ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{t.grade ?? "—"}</Badge></TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" onClick={() => deleteTrade(t.id)}>
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {trades.length === 0 && (
                <TableRow><TableCell colSpan={11} className="py-8 text-center text-muted-foreground">No trades yet — log your first trade or import a CSV</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}