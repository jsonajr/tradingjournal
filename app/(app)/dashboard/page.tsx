import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtMoney } from "@/lib/utils";
import { TrendingUp, BookOpen } from "lucide-react";
import { EquityChart } from "@/components/journal/equity-chart";
import { QuickTradeWrapper } from "@/components/journal/quick-trade-wrapper";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, profile } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: trades }, { data: accounts }, { data: recentJournal }, { data: userSettings }] = await Promise.all([
    sb.from("trades").select("*").eq("user_id", user.id).order("trade_date", { ascending: false }).limit(500),
    sb.from("accounts").select("id, name").eq("user_id", user.id),
    sb.from("journal_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(3),
    sb.from("user_settings").select("post_trade_popup_enabled").eq("user_id", user.id).maybeSingle(),
  ]);

  const t = trades ?? [];
  const wins = t.filter((t) => t.pnl > 0);
  const losses = t.filter((t) => t.pnl < 0);
  const totalPnl = t.reduce((s, t) => s + t.pnl - t.commission, 0);
  const winRate = t.length ? (wins.length / t.length) * 100 : 0;
  const grossP = wins.reduce((s, t) => s + t.pnl, 0);
  const grossL = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const pf = grossL > 0 ? grossP / grossL : grossP > 0 ? 999 : 0;
  const avgWin = wins.length ? grossP / wins.length : 0;
  const avgLoss = losses.length ? grossL / losses.length : 0;

  const dayPnl: Record<string, number> = {};
  t.forEach((tr) => { dayPnl[tr.trade_date] = (dayPnl[tr.trade_date] ?? 0) + (tr.pnl - tr.commission); });
  const dayEntries = Object.entries(dayPnl);
  const bestDay = dayEntries.length ? dayEntries.reduce((a, b) => b[1] > a[1] ? b : a) : null;
  const bestDayPct = bestDay && totalPnl > 0 ? (bestDay[1] / totalPnl) * 100 : null;
  const mostProfitableDay = dayEntries.length
    ? Object.entries(
        t.reduce((acc, tr) => {
          const dow = new Date(tr.trade_date).toLocaleDateString("en-US", { weekday: "long" });
          acc[dow] = (acc[dow] ?? 0) + (tr.pnl - tr.commission);
          return acc;
        }, {} as Record<string, number>)
      ).reduce((a, b) => (b[1] as number) > (a[1] as number) ? b : a, ["—", 0] as [string, number])
    : null;

  const sorted = [...t].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  let cum = 0;
  const series = sorted.map(tr => { cum += (tr.pnl - tr.commission); return { x: tr.trade_date, y: cum }; });

  // Format helpers for compact mobile display
  function fmtCompact(n: number, signed = false): string {
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : signed ? "+" : "";
    if (abs >= 100000) return `${sign}$${(abs / 1000).toFixed(0)}k`;
    if (abs >= 10000) return `${sign}$${(abs / 1000).toFixed(1)}k`;
    return `${sign}${fmtMoney(abs)}`;
  }

  return (
    <div className="p-3 md:p-8">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold md:text-3xl">Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
          <p className="text-xs text-muted-foreground md:text-sm">Your trading overview</p>
        </div>
        <QuickTradeWrapper accounts={accounts ?? []} userId={user.id} popupEnabled={userSettings?.post_trade_popup_enabled ?? true} />
      </div>

      {/* Stats grid — 3 cols on all sizes, auto font scaling */}
      <div className="mb-4 grid grid-cols-3 gap-2 md:gap-3">
        {/* Net P&L */}
        <Card><CardContent className="p-2.5 md:p-4">
          <div className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Net P&L</div>
          <div className={`text-sm sm:text-base md:text-2xl font-black leading-tight ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            {fmtCompact(totalPnl, true)}
          </div>
          <div className="text-[9px] md:text-xs text-muted-foreground mt-0.5">{t.length} trades</div>
        </CardContent></Card>

        {/* Win Rate */}
        <Card><CardContent className="p-2.5 md:p-4">
          <div className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Win Rate</div>
          <div className="text-sm sm:text-base md:text-2xl font-black leading-tight text-blue-400">{winRate.toFixed(1)}%</div>
          <div className="text-[9px] md:text-xs text-muted-foreground mt-0.5">{wins.length}W / {losses.length}L</div>
        </CardContent></Card>

        {/* Profit Factor */}
        <Card><CardContent className="p-2.5 md:p-4">
          <div className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Profit Factor</div>
          <div className={`text-sm sm:text-base md:text-2xl font-black leading-tight ${pf >= 1.5 ? "text-green-400" : pf >= 1 ? "text-amber-400" : "text-red-400"}`}>
            {pf === 999 ? "∞" : pf.toFixed(2)}
          </div>
        </CardContent></Card>

        {/* Avg Win / Loss */}
        <Card><CardContent className="p-2.5 md:p-4">
          <div className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Avg W / L</div>
          <div className="flex items-baseline gap-0.5 flex-wrap">
            <span className="text-xs sm:text-sm md:text-lg font-black text-green-400 leading-tight">{avgWin > 0 ? fmtCompact(avgWin) : "—"}</span>
            <span className="text-muted-foreground text-[9px]">/</span>
            <span className="text-xs sm:text-sm md:text-lg font-black text-red-400 leading-tight">{avgLoss > 0 ? fmtCompact(-avgLoss, true) : "—"}</span>
          </div>
          <div className="text-[9px] md:text-xs text-muted-foreground mt-0.5">per trade</div>
        </CardContent></Card>

        {/* Best Day % */}
        <Card><CardContent className="p-2.5 md:p-4">
          <div className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Best Day %</div>
          <div className={`text-sm sm:text-base md:text-2xl font-black leading-tight ${bestDay && bestDay[1] >= 0 ? "text-green-400" : "text-red-400"}`}>
            {bestDayPct != null ? `${bestDayPct.toFixed(1)}%` : "—"}
          </div>
          <div className="text-[9px] md:text-xs text-muted-foreground mt-0.5 truncate">{bestDay ? `${bestDay[0]} · ${fmtCompact(bestDay[1])}` : "No data"}</div>
        </CardContent></Card>

        {/* Most Profitable Day */}
        <Card><CardContent className="p-2.5 md:p-4">
          <div className="text-[9px] md:text-xs text-muted-foreground uppercase tracking-wide mb-1 leading-tight">Best DOW</div>
          <div className="text-sm sm:text-base md:text-2xl font-black leading-tight text-primary">
            {mostProfitableDay ? mostProfitableDay[0].slice(0, 3) : "—"}
          </div>
          <div className="text-[9px] md:text-xs text-muted-foreground mt-0.5 truncate">
            {mostProfitableDay && (mostProfitableDay[1] as number) > 0 ? fmtCompact(mostProfitableDay[1] as number) + " avg" : "No data"}
          </div>
        </CardContent></Card>
      </div>

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
            {(recentJournal ?? []).length === 0
              ? <div className="py-8 text-center text-sm text-muted-foreground">No journal entries yet</div>
              : <div className="space-y-3">{(recentJournal ?? []).map((j) => (
                  <Link key={j.id} href="/journal/calendar" className="block rounded-md border p-3 hover:border-primary">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{j.entry_date}</div>
                      {j.bias && <Badge variant={j.bias === "Bullish" ? "success" : j.bias === "Bearish" ? "destructive" : "warning"}>{j.bias}</Badge>}
                    </div>
                    {j.title && <div className="mt-1 text-sm font-medium">{j.title}</div>}
                    {j.notes && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{j.notes}</div>}
                  </Link>
                ))}</div>
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 pt-3 md:p-6">
          <CardTitle className="text-sm">Recent Trades</CardTitle>
          <Button size="sm" variant="ghost" asChild><Link href="/trades"><TrendingUp className="mr-1 h-3.5 w-3.5" />All Trades</Link></Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Symbol</TableHead><TableHead>Dir</TableHead><TableHead>Net P&L</TableHead><TableHead>R</TableHead></TableRow></TableHeader>
            <TableBody>
              {t.slice(0, 10).map((tr) => {
                const net = tr.pnl - tr.commission;
                return (
                  <TableRow key={tr.id}>
                    <TableCell className="text-xs">{tr.trade_date}</TableCell>
                    <TableCell className="font-semibold">{tr.symbol}</TableCell>
                    <TableCell><Badge className={tr.direction === "Long" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>{tr.direction}</Badge></TableCell>
                    <TableCell className={`font-bold text-base ${net >= 0 ? "text-green-400" : "text-red-400"}`}>{fmtCompact(net, true)}</TableCell>
                    <TableCell className="text-xs">{tr.r_multiple != null ? `${tr.r_multiple}R` : "—"}</TableCell>
                  </TableRow>
                );
              })}
              {t.length === 0 && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No trades yet — <Link href="/trades/new" className="text-primary hover:underline">log your first trade</Link></TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}