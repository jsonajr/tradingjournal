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

  const [{ data: trades }, { data: accounts }, { data: recentJournal }] = await Promise.all([
    sb.from("trades").select("*").eq("user_id", user.id).order("trade_date", { ascending: false }).limit(500),
    sb.from("accounts").select("id, name").eq("user_id", user.id),
    sb.from("journal_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(3),
  ]);

  const wins = (trades ?? []).filter((t) => t.pnl > 0).length;
  const losses = (trades ?? []).filter((t) => t.pnl < 0).length;
  const totalPnl = (trades ?? []).reduce((s, t) => s + t.pnl - t.commission, 0);
  const winRate = trades?.length ? (wins / trades.length) * 100 : 0;
  const grossP = (trades ?? []).filter(t => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossL = Math.abs((trades ?? []).filter(t => t.pnl < 0).reduce((s, t) => s + t.pnl, 0));
  const pf = grossL > 0 ? grossP / grossL : grossP > 0 ? 999 : 0;

  const sorted = [...(trades ?? [])].sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  let cum = 0;
  const series = sorted.map(t => { cum += (t.pnl - t.commission); return { x: t.trade_date, y: cum }; });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
          <p className="text-sm text-muted-foreground">Your trading overview</p>
        </div>
        <QuickTradeWrapper accounts={accounts ?? []} userId={user.id} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Net P&L</div>
          <div className={`text-2xl font-black md:text-3xl ${totalPnl >= 0 ? "text-green-400" : "text-red-400"}`}>
            {totalPnl >= 0 ? "+" : ""}{fmtMoney(Math.abs(totalPnl))}
          </div>
          <div className="text-xs text-muted-foreground mt-1">{trades?.length ?? 0} trades</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Win Rate</div>
          <div className="text-2xl font-black md:text-3xl text-blue-400">{winRate.toFixed(1)}%</div>
          <div className="text-xs text-muted-foreground mt-1">{wins}W / {losses}L</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Profit Factor</div>
          <div className={`text-2xl font-black md:text-3xl ${pf >= 1.5 ? "text-green-400" : pf >= 1 ? "text-amber-400" : "text-red-400"}`}>
            {pf === 999 ? "∞" : pf.toFixed(2)}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Plan</div>
          <div className="text-2xl font-black md:text-3xl text-primary">{profile.plan.toUpperCase()}</div>
          <div className="text-xs text-muted-foreground mt-1 capitalize">{profile.role}</div>
        </CardContent></Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Equity Curve</CardTitle></CardHeader>
          <CardContent>
            {series.length > 0
              ? <div className="h-[260px]"><EquityChart series={series} /></div>
              : <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">Log your first trade to see your equity curve</div>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent Journal</CardTitle>
            <Button size="sm" variant="ghost" asChild><Link href="/journal/calendar"><BookOpen className="mr-1 h-3.5 w-3.5" />Open</Link></Button>
          </CardHeader>
          <CardContent>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Recent Trades</CardTitle>
          <Button size="sm" variant="ghost" asChild><Link href="/trades"><TrendingUp className="mr-1 h-3.5 w-3.5" />All Trades</Link></Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Symbol</TableHead><TableHead>Dir</TableHead><TableHead>Net P&L</TableHead><TableHead>R</TableHead></TableRow></TableHeader>
            <TableBody>
              {(trades ?? []).slice(0, 10).map((t) => {
                const net = t.pnl - t.commission;
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{t.trade_date}</TableCell>
                    <TableCell className="font-semibold">{t.symbol}</TableCell>
                    <TableCell><Badge className={t.direction === "Long" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>{t.direction}</Badge></TableCell>
                    <TableCell className={`font-bold text-base ${net >= 0 ? "text-green-400" : "text-red-400"}`}>{net >= 0 ? "+" : ""}{fmtMoney(Math.abs(net))}</TableCell>
                    <TableCell className="text-xs">{t.r_multiple != null ? `${t.r_multiple}R` : "—"}</TableCell>
                  </TableRow>
                );
              })}
              {(!trades || trades.length === 0) && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No trades yet — <Link href="/trades/new" className="text-primary hover:underline">log your first trade</Link></TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}