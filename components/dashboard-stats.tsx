"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EquityChart } from "@/components/journal/equity-chart";
import { fmtMoney } from "@/lib/utils";
import { TrendingUp, BookOpen, Calendar } from "lucide-react";

type Trade = {
  id: string; trade_date: string; symbol: string; direction: string;
  pnl: number; commission: number; r_multiple: number | null; account_id: string | null;
};
type JournalEntry = {
  id: string; entry_date: string; title: string | null;
  bias: string | null; notes: string | null;
};
type Account = { id: string; name: string; type: string | null };

const PRESETS = [
  { label: "Today", days: 0 },
  { label: "1W",    days: 7 },
  { label: "1M",    days: 30 },
  { label: "3M",    days: 90 },
  { label: "6M",    days: 180 },
  { label: "1Y",    days: 365 },
  { label: "All",   days: -1 },
];

const ACCOUNT_TABS: { label: string; type: string | null }[] = [
  { label: "Eval",      type: "eval" },
  { label: "Funded",    type: "funded" },
  { label: "Live",      type: "live" },
];

function fmtCompact(n: number, signed = false): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : signed ? "+" : "";
  if (abs >= 100000) return `${sign}$${(abs / 1000).toFixed(0)}k`;
  if (abs >= 10000)  return `${sign}$${(abs / 1000).toFixed(1)}k`;
  return `${sign}${fmtMoney(abs)}`;
}

export function DashboardStats({
  allTrades,
  recentJournal,
  profileName,
  accounts,
  userId,
  popupEnabled,
  QuickTradeWrapper,
}: {
  allTrades: Trade[];
  recentJournal: JournalEntry[];
  profileName: string | null;
  accounts: Account[];
  userId: string;
  popupEnabled: boolean;
  QuickTradeWrapper: React.ComponentType<{ accounts: { id: string; name: string }[]; userId: string; popupEnabled: boolean }>;
}) {
  const [preset,     setPreset]     = useState(-1);
  const [customFrom, setCustomFrom] = useState("");
  const [customTo,   setCustomTo]   = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [acctTab,    setAcctTab]    = useState<string | null>("eval"); // default to Eval

  // ── Filter trades by account type ────────────────────────────────────────
  const accountsOfType = useMemo(() => {
    return accounts.filter(a => (a.type ?? "live") === acctTab);
  }, [accounts, acctTab]);

  const accountIds = useMemo(
    () => new Set(accountsOfType.map(a => a.id)),
    [accountsOfType]
  );

  const tradesForType = useMemo(() => {
    return allTrades.filter(t => t.account_id && accountIds.has(t.account_id));
  }, [allTrades, accountIds]);

  // ── Filter by date preset ─────────────────────────────────────────────────
  const trades = useMemo(() => {
    const base = tradesForType;
    if (preset === -1 && !customFrom && !customTo) return base;
    const now = new Date();
    let from: Date | null = null;
    let to:   Date | null = null;
    if (customFrom) {
      from = new Date(customFrom);
      to   = customTo ? new Date(customTo) : now;
    } else if (preset === 0) {
      const today = now.toISOString().split("T")[0];
      return base.filter(t => t.trade_date === today);
    } else if (preset > 0) {
      from = new Date(now);
      from.setDate(from.getDate() - preset);
      to = now;
    }
    if (!from) return base;
    return base.filter(t => {
      const d = new Date(t.trade_date);
      return d >= from! && d <= to!;
    });
  }, [tradesForType, preset, customFrom, customTo]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const wins     = trades.filter(t => t.pnl > 0);
  const losses   = trades.filter(t => t.pnl < 0);
  const totalPnl = trades.reduce((s, t) => s + t.pnl - t.commission, 0);
  const winRate  = trades.length ? (wins.length / trades.length) * 100 : 0;
  const grossP   = wins.reduce((s, t) => s + t.pnl, 0);
  const grossL   = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const pf       = grossL > 0 ? grossP / grossL : grossP > 0 ? 999 : 0;
  const avgWin   = wins.length   ? grossP / wins.length   : 0;
  const avgLoss  = losses.length ? grossL / losses.length : 0;

  const dayPnl: Record<string, number> = {};
  trades.forEach(t => { dayPnl[t.trade_date] = (dayPnl[t.trade_date] ?? 0) + (t.pnl - t.commission); });
  const dayEntries = Object.entries(dayPnl);
  const bestDay    = dayEntries.length ? dayEntries.reduce((a, b) => b[1] > a[1] ? b : a) : null;
  const bestDayPct = bestDay && totalPnl > 0 ? (bestDay[1] / totalPnl) * 100 : null;

  const mostProfitableDay = dayEntries.length
    ? Object.entries(
        trades.reduce((acc, tr) => {
          const [y, m, d] = tr.trade_date.split("-").map(Number);
          const dow = new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
          acc[dow] = (acc[dow] ?? 0) + (tr.pnl - tr.commission);
          return acc;
        }, {} as Record<string, number>)
      ).reduce((a, b) => (b[1] as number) > (a[1] as number) ? b : a, ["—", 0] as [string, number])
    : null;

  const sorted = [...trades].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  let cum = 0;
  const series = sorted.map(tr => { cum += (tr.pnl - tr.commission); return { x: tr.trade_date, y: cum }; });

  return (
    <div className="p-3 md:p-8">

      {/* ── Header ── */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold md:text-3xl">
            Welcome back{profileName ? `, ${profileName.split(" ")[0]}` : ""}
          </h1>
          <p className="text-xs text-muted-foreground md:text-sm">Your trading overview</p>
        </div>
        <QuickTradeWrapper accounts={accounts} userId={userId} popupEnabled={popupEnabled} />
      </div>

      {/* ── Account type toggle ── */}
      <div className="mb-4 flex items-center gap-1 rounded-xl border border-border bg-card p-1 w-fit">
        {ACCOUNT_TABS.map(tab => {
          const isActive = acctTab === tab.type;
          // Count trades for this type
          const count = accounts.filter(a => (a.type ?? "live") === tab.type).length;

          return (
            <button
              key={tab.label}
              onClick={() => setAcctTab(tab.type)}
              className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-black shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0 text-[10px] font-mono ${
                  isActive ? "bg-black/20 text-black" : "bg-muted text-muted-foreground"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Date range filter ── */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        {PRESETS.map(p => (
          <button
            key={p.label}
            onClick={() => { setPreset(p.days); setShowCustom(false); setCustomFrom(""); setCustomTo(""); }}
            className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
              preset === p.days && !customFrom
                ? "border-primary bg-primary/15 text-primary"
                : "border-input text-muted-foreground hover:border-primary hover:text-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => setShowCustom(v => !v)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium border transition-colors ${
            customFrom ? "border-primary bg-primary/15 text-primary" : "border-input text-muted-foreground hover:border-primary"
          }`}
        >
          Custom
        </button>
        {showCustom && (
          <div className="flex items-center gap-1.5">
            <input type="date" value={customFrom} onChange={e => { setCustomFrom(e.target.value); setPreset(-2); }}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs" />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-xs" />
          </div>
        )}
        {trades.length !== allTrades.length && (
          <span className="text-xs text-muted-foreground ml-1">{trades.length} of {allTrades.length} trades</span>
        )}
      </div>

      {/* ── Stats grid ── */}
      <div className="mb-4 grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
        <Card><CardContent className="p-3 md:p-4">
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Net P&L</div>
          <div className={`text-lg sm:text-xl md:text-2xl font-black leading-tight ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
            {fmtCompact(totalPnl, true)}
          </div>
          <div className="text-[9px] md:text-xs text-muted-foreground mt-0.5">{trades.length} trades</div>
        </CardContent></Card>

        <Card><CardContent className="p-3 md:p-4">
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Win Rate</div>
          <div className="text-lg sm:text-xl md:text-2xl font-black leading-tight text-blue-600">{winRate.toFixed(1)}%</div>
          <div className="text-[9px] md:text-xs text-muted-foreground mt-0.5">{wins.length}W / {losses.length}L</div>
        </CardContent></Card>

        <Card><CardContent className="p-3 md:p-4">
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Profit Factor</div>
          <div className={`text-lg sm:text-xl md:text-2xl font-black leading-tight ${pf >= 1.5 ? "text-green-500" : pf >= 1 ? "text-amber-500" : "text-red-500"}`}>
            {pf === 999 ? "∞" : pf.toFixed(2)}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-3 md:p-4">
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Avg W / L</div>
          <div className="flex items-baseline gap-0.5 flex-wrap">
            <span className="text-base sm:text-lg md:text-xl font-black text-green-500 leading-tight">{avgWin > 0 ? `+${fmtCompact(avgWin)}` : "—"}</span>
            <span className="text-muted-foreground text-[9px]">/</span>
            <span className="text-base sm:text-lg md:text-xl font-black text-red-500 leading-tight">{avgLoss > 0 ? fmtCompact(-avgLoss, true) : "—"}</span>
          </div>
          <div className="text-[9px] md:text-xs text-muted-foreground mt-0.5">per trade</div>
        </CardContent></Card>

        <Card><CardContent className="p-3 md:p-4">
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Best Day %</div>
          <div className={`text-sm sm:text-base md:text-2xl font-black leading-tight ${bestDay && bestDay[1] >= 0 ? "text-green-500" : "text-red-500"}`}>
            {bestDayPct != null ? `${bestDayPct.toFixed(1)}%` : "—"}
          </div>
          <div className="text-[9px] md:text-xs text-muted-foreground mt-0.5 truncate">{bestDay ? `${bestDay[0]} · ${fmtCompact(bestDay[1])}` : "No data"}</div>
        </CardContent></Card>

        <Card><CardContent className="p-3 md:p-4">
          <div className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Best DOW</div>
          <div className="text-sm sm:text-base md:text-2xl font-black leading-tight text-primary">
            {mostProfitableDay ? mostProfitableDay[0].slice(0, 3) : "—"}
          </div>
          <div className="text-[9px] md:text-xs text-muted-foreground mt-0.5 truncate">
            {mostProfitableDay && (mostProfitableDay[1] as number) > 0 ? fmtCompact(mostProfitableDay[1] as number) + " avg" : "No data"}
          </div>
        </CardContent></Card>
      </div>

      {/* ── Equity + Journal ── */}
      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2 px-3 pt-3 md:p-6"><CardTitle className="text-sm">Equity Curve</CardTitle></CardHeader>
          <CardContent className="px-3 pb-3 md:p-6">
            {series.length > 0
              ? <div className="h-[220px] md:h-[260px]"><EquityChart series={series} /></div>
              : <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">Log your first trade to see your equity curve</div>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3 md:p-6">
            <CardTitle className="text-sm">Recent Journal</CardTitle>
            <Button size="sm" variant="ghost" asChild><Link href="/journal/calendar"><BookOpen className="mr-1 h-3.5 w-3.5" />Open</Link></Button>
          </CardHeader>
          <CardContent className="px-3 pb-3 md:p-6">
            {recentJournal.length === 0
              ? <div className="py-8 text-center text-sm text-muted-foreground">No journal entries yet</div>
              : <div className="space-y-3">{recentJournal.map(j => (
                  <Link key={j.id} href="/journal/calendar" className="block rounded-md border p-3 hover:border-primary">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{j.entry_date}</div>
                      {j.bias && <Badge variant={j.bias === "Bullish" ? "success" : j.bias === "Bearish" ? "destructive" : "warning"}>{j.bias}</Badge>}
                    </div>
                    {j.title  && <div className="mt-1 text-sm font-medium">{j.title}</div>}
                    {j.notes  && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{j.notes}</div>}
                  </Link>
                ))}</div>
            }
          </CardContent>
        </Card>
      </div>

      {/* ── Recent Trades ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3 md:p-6">
          <CardTitle className="text-sm">Recent Trades</CardTitle>
          <Button size="sm" variant="ghost" asChild><Link href="/trades"><TrendingUp className="mr-1 h-3.5 w-3.5" />All Trades</Link></Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Symbol</TableHead>
              <TableHead>Dir</TableHead><TableHead>Net P&L</TableHead><TableHead>R</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {trades.slice(0, 10).map(tr => {
                const net = tr.pnl - tr.commission;
                return (
                  <TableRow key={tr.id}>
                    <TableCell className="text-xs">{tr.trade_date}</TableCell>
                    <TableCell className="font-semibold">{tr.symbol}</TableCell>
                    <TableCell><Badge className={tr.direction === "Long" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>{tr.direction}</Badge></TableCell>
                    <TableCell className={`font-bold text-base ${net >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtCompact(net, true)}</TableCell>
                    <TableCell className="text-xs">{tr.r_multiple != null ? `${tr.r_multiple}R` : "—"}</TableCell>
                  </TableRow>
                );
              })}
              {trades.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No trades in this range</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}