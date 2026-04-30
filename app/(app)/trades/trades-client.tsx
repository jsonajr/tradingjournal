"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/utils";
import { Plus, Upload, Trash2, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

type Trade = {
  id: string; trade_date: string; symbol: string;
  direction: "Long" | "Short"; contracts: number;
  entry_price: number | null; exit_price: number | null;
  pnl: number; commission: number; r_multiple: number | null;
  setup: string | null; grade: string | null;
  accounts: { name: string } | null;
};

export function TradesClient({ initialTrades }: { initialTrades: Trade[] }) {
  const router = useRouter();
  const [trades, setTrades] = useState(initialTrades);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

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

      {/* Bulk action bar */}
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
                <TableHead className="w-10"></TableHead>
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
                    <TableCell className="text-sm text-muted-foreground">{t.accounts?.name ?? "—"}</TableCell>
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
                    <TableCell onClick={(e) => e.stopPropagation()}>
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
    </div>
  );
}