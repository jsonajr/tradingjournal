import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtMoney } from "@/lib/utils";
import { TrendingUp, BookOpen, AlertTriangle, Plus } from "lucide-react";
import { EquityChart } from "@/components/journal/equity-chart";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, profile } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: trades }, { data: cooldowns }, { data: recentJournal }] = await Promise.all([
    sb.from("trades").select("*").eq("user_id", user.id).order("trade_date", { ascending: false }).limit(500),
    sb.from("cooldowns").select("*").eq("user_id", user.id).eq("is_active", true).gt("ends_at", new Date().toISOString()).order("ends_at", { ascending: true }),
    sb.from("journal_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(3),
  ]);

  const wins = (trades ?? []).filter((t) => t.pnl > 0).length;
  const losses = (trades ?? []).filter((t) => t.pnl < 0).length;
  const totalPnl = (trades ?? []).reduce((s, t) => s + t.pnl - t.commission, 0);
  const winRate = trades?.length ? (wins / trades.length) * 100 : 0;
  const grossP = (trades ?? []).filter(t=>t.pnl>0).reduce((s,t)=>s+t.pnl,0);
  const grossL = Math.abs((trades ?? []).filter(t=>t.pnl<0).reduce((s,t)=>s+t.pnl,0));
  const pf = grossL > 0 ? grossP / grossL : grossP > 0 ? 999 : 0;
  const activeCooldown = cooldowns?.[0];

  // Build equity series
  const sorted = [...(trades ?? [])].sort((a,b)=> new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
  let cum = 0;
  const series = sorted.map(t => { cum += (t.pnl - t.commission); return { x: t.trade_date, y: cum }; });

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Welcome back{profile.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}</h1>
          <p className="text-sm text-muted-foreground">Your trading overview</p>
        </div>
        <Button asChild><Link href="/journal"><Plus className="mr-1 h-4 w-4" />Log Trade</Link></Button>
      </div>

      {activeCooldown && (
        <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <div className="text-sm font-semibold">Cooldown Active</div>
              <div className="text-sm text-muted-foreground">
                {activeCooldown.reason ?? "Discipline lock"} — ends {new Date(activeCooldown.ends_at).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Net P&L" value={fmtMoney(totalPnl)} accent={totalPnl >= 0 ? "text-green-500" : "text-red-500"} sub={`${trades?.length ?? 0} trades`} />
        <Stat label="Win Rate" value={`${winRate.toFixed(1)}%`} accent="text-blue-500" sub={`${wins}W / ${losses}L`} />
        <Stat label="Profit Factor" value={pf === 999 ? "∞" : pf.toFixed(2)} accent={pf >= 1.5 ? "text-green-500" : pf >= 1 ? "text-amber-500" : "text-red-500"} />
        <Stat label="Plan" value={profile.plan.toUpperCase()} accent="text-primary" sub="Subscription" />
        <Stat label="Account" value={profile.role.toUpperCase()} accent={profile.role === "admin" ? "text-destructive" : "text-foreground"} sub={profile.email} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Equity Curve</CardTitle></CardHeader>
          <CardContent>
            {series.length > 0 ? (
              <div className="h-[260px]"><EquityChart series={series} /></div>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-muted-foreground">
                Log your first trade to see your equity curve
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm">Recent Journal</CardTitle>
            <Button size="sm" variant="ghost" asChild><Link href="/journal/calendar"><BookOpen className="mr-1 h-3.5 w-3.5" />Open</Link></Button>
          </CardHeader>
          <CardContent>
            {(recentJournal ?? []).length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No journal entries yet</div>
            ) : (
              <div className="space-y-3">
                {(recentJournal ?? []).map((j) => (
                  <Link key={j.id} href="/journal/calendar" className="block rounded-md border p-3 hover:border-primary">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">{j.entry_date}</div>
                      {j.bias && <Badge variant={j.bias === "Bullish" ? "success" : j.bias === "Bearish" ? "destructive" : "warning"}>{j.bias}</Badge>}
                    </div>
                    {j.title && <div className="mt-1 text-sm font-medium">{j.title}</div>}
                    {j.notes && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{j.notes}</div>}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm">Recent Trades</CardTitle>
          <Button size="sm" variant="ghost" asChild><Link href="/journal"><TrendingUp className="mr-1 h-3.5 w-3.5" />All Trades</Link></Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Symbol</TableHead><TableHead>Dir</TableHead><TableHead>P&amp;L</TableHead><TableHead>R</TableHead></TableRow></TableHeader>
            <TableBody>
              {(trades ?? []).slice(0, 10).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{t.trade_date}</TableCell>
                  <TableCell className="font-medium">{t.symbol}</TableCell>
                  <TableCell><Badge variant={t.direction === "Long" ? "success" : "destructive"}>{t.direction}</Badge></TableCell>
                  <TableCell className={t.pnl >= 0 ? "text-green-500" : "text-red-500"}>{fmtMoney(t.pnl)}</TableCell>
                  <TableCell className="text-xs">{t.r_multiple != null ? `${t.r_multiple}R` : "—"}</TableCell>
                </TableRow>
              ))}
              {(!trades || trades.length === 0) && <TableRow><TableCell colSpan={5} className="py-8 text-center text-muted-foreground">No trades yet — <Link href="/journal" className="text-primary hover:underline">log your first trade</Link></TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value, accent, sub }: { label: string; value: string; accent?: string; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent>
        <div className={"text-xl font-bold md:text-2xl " + (accent ?? "")}>{value}</div>
        {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}
