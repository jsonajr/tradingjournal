import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/utils";
import { TrendingUp, TrendingDown, BookOpen, DollarSign, Target, BarChart2, Calendar, Flame, Award, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: trades }, { data: entries }] = await Promise.all([
    sb.from("trades").select("*").eq("user_id", user.id),
    sb.from("journal_entries").select("entry_date, rating, rules_followed").eq("user_id", user.id),
  ]);

  const t = trades ?? [];
  const e = entries ?? [];

  const wins = t.filter(tr => tr.pnl > 0);
  const losses = t.filter(tr => tr.pnl < 0);
  const breakeven = t.filter(tr => tr.pnl === 0);
  const totalPnl = t.reduce((s, tr) => s + (tr.pnl - tr.commission), 0);
  const totalGrossPnl = t.reduce((s, tr) => s + tr.pnl, 0);
  const totalCommission = t.reduce((s, tr) => s + (tr.commission ?? 0), 0);
  const winRate = t.length ? (wins.length / t.length) * 100 : 0;
  const avgWin = wins.length ? wins.reduce((s, tr) => s + tr.pnl, 0) / wins.length : 0;
  const avgLoss = losses.length ? Math.abs(losses.reduce((s, tr) => s + tr.pnl, 0)) / losses.length : 0;
  const grossP = wins.reduce((s, tr) => s + tr.pnl, 0);
  const grossL = Math.abs(losses.reduce((s, tr) => s + tr.pnl, 0));
  const pf = grossL > 0 ? grossP / grossL : grossP > 0 ? 999 : 0;
  const rTrades = t.filter(tr => tr.r_multiple != null);
  const avgRMultiple = rTrades.length ? rTrades.reduce((s, tr) => s + (tr.r_multiple ?? 0), 0) / rTrades.length : 0;
  const totalContracts = t.reduce((s, tr) => s + (tr.contracts ?? 0), 0);
  const avgContracts = t.length ? totalContracts / t.length : 0;

  // Best/worst trade
  const bestTrade = t.length ? t.reduce((a, b) => b.pnl > a.pnl ? b : a) : null;
  const worstTrade = t.length ? t.reduce((a, b) => b.pnl < a.pnl ? b : a) : null;

  // Day of week breakdown
  const dowPnl: Record<string, { pnl: number; count: number }> = {};
  t.forEach(tr => {
    const [y,m,d] = tr.trade_date.split("-").map(Number); const dow = new Date(y, m-1, d).toLocaleDateString("en-US", { weekday: "long" });
    if (!dowPnl[dow]) dowPnl[dow] = { pnl: 0, count: 0 };
    dowPnl[dow].pnl += tr.pnl - tr.commission;
    dowPnl[dow].count++;
  });
  const bestDay = Object.entries(dowPnl).sort((a, b) => b[1].pnl - a[1].pnl)[0];
  const worstDay = Object.entries(dowPnl).sort((a, b) => a[1].pnl - b[1].pnl)[0];

  // Best trading month
  const monthPnl: Record<string, number> = {};
  t.forEach(tr => {
    const m = tr.trade_date.slice(0, 7);
    monthPnl[m] = (monthPnl[m] ?? 0) + (tr.pnl - tr.commission);
  });
  const bestMonth = Object.entries(monthPnl).sort((a, b) => b[1] - a[1])[0];

  // Journal stats
  const rulesFollowedCount = e.filter(j => j.rules_followed === true).length;
  const avgRating = e.filter(j => j.rating != null).reduce((s, j) => s + (j.rating ?? 0), 0) / (e.filter(j => j.rating != null).length || 1);

  // Symbol breakdown
  const symPnl: Record<string, number> = {};
  t.forEach(tr => { symPnl[tr.symbol] = (symPnl[tr.symbol] ?? 0) + (tr.pnl - tr.commission); });
  const topSymbols = Object.entries(symPnl).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Setup breakdown
  const setupPnl: Record<string, { pnl: number; count: number }> = {};
  t.forEach(tr => {
    if (!tr.setup) return;
    if (!setupPnl[tr.setup]) setupPnl[tr.setup] = { pnl: 0, count: 0 };
    setupPnl[tr.setup].pnl += tr.pnl - tr.commission;
    setupPnl[tr.setup].count++;
  });
  const topSetups = Object.entries(setupPnl).sort((a, b) => b[1].pnl - a[1].pnl).slice(0, 5);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Insights</h1>
        <p className="text-sm text-muted-foreground">Your complete trading statistics</p>
      </div>

      {/* Overview */}
      <Section title="Overview" icon={<BarChart2 className="h-4 w-4" />}>
        <StatGrid>
          <Stat label="Total Trades" value={t.length.toString()} sub="all time" />
          <Stat label="Total Net P&L" value={fmtMoney(totalPnl, true)} color={totalPnl >= 0 ? "text-green-500" : "text-red-500"} />
          <Stat label="Gross P&L" value={fmtMoney(totalGrossPnl, true)} color={totalGrossPnl >= 0 ? "text-green-500" : "text-red-500"} />
          <Stat label="Total Commissions" value={fmtMoney(totalCommission)} color="text-amber-500" />
          <Stat label="Win Rate" value={`${winRate.toFixed(1)}%`} sub={`${wins.length}W / ${losses.length}L / ${breakeven.length}BE`} color="text-blue-600" />
          <Stat label="Profit Factor" value={pf === 999 ? "∞" : pf.toFixed(2)} color={pf >= 1.5 ? "text-green-500" : pf >= 1 ? "text-amber-500" : "text-red-500"} />
        </StatGrid>
      </Section>

      {/* Trade metrics */}
      <Section title="Trade Metrics" icon={<Target className="h-4 w-4" />}>
        <StatGrid>
          <Stat label="Avg Win" value={avgWin > 0 ? fmtMoney(avgWin) : "—"} color="text-green-500" />
          <Stat label="Avg Loss" value={avgLoss > 0 ? fmtMoney(avgLoss) : "—"} color="text-red-500" />
          <Stat label="Avg R-Multiple" value={t.some(tr => tr.r_multiple != null) ? `${avgRMultiple.toFixed(2)}R` : "—"} color={avgRMultiple >= 1 ? "text-green-500" : "text-amber-500"} />
          <Stat label="Total Contracts" value={totalContracts.toLocaleString()} sub={`avg ${avgContracts.toFixed(1)} per trade`} />
          <Stat label="Best Trade" value={bestTrade ? fmtMoney(bestTrade.pnl, true) : "—"} sub={bestTrade?.symbol} color="text-green-500" />
          <Stat label="Worst Trade" value={worstTrade ? fmtMoney(worstTrade.pnl, true) : "—"} sub={worstTrade?.symbol} color="text-red-500" />
        </StatGrid>
      </Section>

      {/* Timing */}
      <Section title="Timing & Patterns" icon={<Calendar className="h-4 w-4" />}>
        <StatGrid>
          <Stat label="Best Day of Week" value={bestDay?.[0]?.slice(0, 3) ?? "—"} sub={bestDay ? fmtMoney(bestDay[1].pnl, true) + ` · ${bestDay[1].count} trades` : ""} color="text-green-500" />
          <Stat label="Worst Day of Week" value={worstDay?.[0]?.slice(0, 3) ?? "—"} sub={worstDay ? fmtMoney(worstDay[1].pnl, true) + ` · ${worstDay[1].count} trades` : ""} color="text-red-500" />
          <Stat label="Best Month" value={bestMonth ? new Date(parseInt(bestMonth[0].split("-")[0]), parseInt(bestMonth[0].split("-")[1])-1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" }) : "—"} sub={bestMonth ? fmtMoney(bestMonth[1], true) : ""} color="text-green-500" />
          <Stat label="Unique Trading Days" value={new Set(t.map(tr => tr.trade_date)).size.toString()} />
          <Stat label="Avg Trades/Day" value={new Set(t.map(tr => tr.trade_date)).size > 0 ? (t.length / new Set(t.map(tr => tr.trade_date)).size).toFixed(1) : "—"} />
          <Stat label="Total Trading Days" value={new Set(t.map(tr => tr.trade_date)).size.toString()} sub="unique dates" />
        </StatGrid>
      </Section>

      {/* Journal */}
      <Section title="Journal Stats" icon={<BookOpen className="h-4 w-4" />}>
        <StatGrid>
          <Stat label="Days Journaled" value={e.length.toString()} />
          <Stat label="Rules Followed" value={e.length > 0 ? `${((rulesFollowedCount / e.length) * 100).toFixed(0)}%` : "—"} sub={`${rulesFollowedCount} of ${e.length} days`} color={rulesFollowedCount / (e.length || 1) >= 0.7 ? "text-green-500" : "text-amber-500"} />
          <Stat label="Avg Session Rating" value={e.some(j => j.rating != null) ? `${avgRating.toFixed(1)} / 5` : "—"} color="text-amber-500" />
          <Stat label="Journal Rate" value={t.length > 0 && e.length > 0 ? `${Math.min(100, (e.length / new Set(t.map(tr => tr.trade_date)).size) * 100).toFixed(0)}%` : "—"} sub="vs trading days" />
        </StatGrid>
      </Section>

      {/* Symbol breakdown */}
      {topSymbols.length > 0 && (
        <Section title="Top Symbols" icon={<TrendingUp className="h-4 w-4" />}>
          <div className="grid gap-2">
            {topSymbols.map(([sym, pnl]) => (
              <div key={sym} className="flex items-center justify-between rounded-lg border p-3">
                <span className="font-bold text-sm">{sym}</span>
                <span className={`font-bold text-sm ${pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(pnl, true)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Setup breakdown */}
      {topSetups.length > 0 && (
        <Section title="Top Setups" icon={<Award className="h-4 w-4" />}>
          <div className="grid gap-2">
            {topSetups.map(([setup, { pnl, count }]) => (
              <div key={setup} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <span className="font-bold text-sm">{setup}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{count} trades</span>
                </div>
                <span className={`font-bold text-sm ${pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(pnl, true)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}{title}
      </h2>
      {children}
    </div>
  );
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{children}</div>;
}

function Stat({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</div>
        <div className={`text-xl font-black ${color ?? "text-foreground"}`}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </CardContent>
    </Card>
  );
}