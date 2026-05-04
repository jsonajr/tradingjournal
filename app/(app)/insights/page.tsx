import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fmtMoney } from "@/lib/utils";
import { TrendingUp, TrendingDown, BookOpen, Target, BarChart2, Calendar, Award, Zap } from "lucide-react";

export const dynamic = "force-dynamic";

function pct(n: number, d: number) { return d > 0 ? (n / d) * 100 : 0; }
function avg(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }
function fmtDate(yyyy_mm: string) {
  const [y, m] = yyyy_mm.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
function parseDow(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "long" });
}

export default async function InsightsPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: trades }, { data: entries }] = await Promise.all([
    sb.from("trades").select("*").eq("user_id", user.id).order("trade_date", { ascending: true }).range(0, 9999),
    sb.from("journal_entries").select("entry_date, rating, rules_followed, mood").eq("user_id", user.id),
  ]);

  const t = trades ?? [];
  const e = entries ?? [];

  if (t.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <BarChart2 className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
        <h1 className="text-xl font-bold mb-2">No trades yet</h1>
        <p className="text-muted-foreground text-sm">Log your first trade to start seeing insights.</p>
      </div>
    );
  }

  // ── Core P&L ─────────────────────────────────────────────────────────────
  const wins     = t.filter(tr => tr.pnl > 0);
  const losses   = t.filter(tr => tr.pnl < 0);
  const be       = t.filter(tr => tr.pnl === 0);
  const netPnl   = t.reduce((s, tr) => s + (tr.pnl - (tr.commission ?? 0)), 0);
  const grossPnl = t.reduce((s, tr) => s + tr.pnl, 0);
  const totalComm = t.reduce((s, tr) => s + (tr.commission ?? 0), 0);
  const grossW   = wins.reduce((s, tr) => s + tr.pnl, 0);
  const grossL   = Math.abs(losses.reduce((s, tr) => s + tr.pnl, 0));
  const pf       = grossL > 0 ? grossW / grossL : grossW > 0 ? Infinity : 0;
  const winRate  = pct(wins.length, t.length);
  const avgWin   = avg(wins.map(tr => tr.pnl));
  const avgLoss  = avg(losses.map(tr => Math.abs(tr.pnl)));
  const rTrades  = t.filter(tr => tr.r_multiple != null);
  const avgR     = avg(rTrades.map(tr => tr.r_multiple ?? 0));
  const totalContracts = t.reduce((s, tr) => s + (tr.contracts ?? 0), 0);
  const tradingDays = new Set(t.map(tr => tr.trade_date)).size;
  const sortedDates  = t.map(tr => tr.trade_date).sort();
  const firstDate    = sortedDates[0];
  const lastDate     = sortedDates[sortedDates.length - 1];
  function fmtDateRange(d: string) {
    const [y,m,dd] = d.split("-").map(Number);
    return new Date(y, m-1, dd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  // Best / worst single trade
  const bestTrade  = t.reduce((a, b) => b.pnl > a.pnl ? b : a);
  const worstTrade = t.reduce((a, b) => b.pnl < a.pnl ? b : a);

  // ── Streaks ───────────────────────────────────────────────────────────────
  let curWin = 0, curLoss = 0, maxWin = 0, maxLoss = 0;
  t.forEach(tr => {
    if (tr.pnl > 0) { curWin++; curLoss = 0; maxWin = Math.max(maxWin, curWin); }
    else if (tr.pnl < 0) { curLoss++; curWin = 0; maxLoss = Math.max(maxLoss, curLoss); }
    else { curWin = 0; curLoss = 0; }
  });

  // ── Long vs Short ─────────────────────────────────────────────────────────
  const longs  = t.filter(tr => tr.direction === "Long");
  const shorts = t.filter(tr => tr.direction === "Short");
  const longPnl  = longs.reduce((s, tr) => s + (tr.pnl - (tr.commission ?? 0)), 0);
  const shortPnl = shorts.reduce((s, tr) => s + (tr.pnl - (tr.commission ?? 0)), 0);
  const longWR   = pct(longs.filter(tr => tr.pnl > 0).length, longs.length);
  const shortWR  = pct(shorts.filter(tr => tr.pnl > 0).length, shorts.length);

  // ── Day of week ───────────────────────────────────────────────────────────
  const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const dowMap: Record<string, { pnl: number; count: number; wins: number }> = {};
  DAYS.forEach(d => { dowMap[d] = { pnl: 0, count: 0, wins: 0 }; });
  t.forEach(tr => {
    const dow = parseDow(tr.trade_date);
    if (!dowMap[dow]) dowMap[dow] = { pnl: 0, count: 0, wins: 0 };
    dowMap[dow].pnl   += tr.pnl - (tr.commission ?? 0);
    dowMap[dow].count++;
    if (tr.pnl > 0) dowMap[dow].wins++;
  });
  const dowEntries = Object.entries(dowMap).filter(([, v]) => v.count > 0).sort((a, b) => b[1].pnl - a[1].pnl);
  const bestDow  = dowEntries[0];
  const worstDow = dowEntries[dowEntries.length - 1];

  // ── Monthly breakdown ─────────────────────────────────────────────────────
  const monthMap: Record<string, { pnl: number; count: number; wins: number }> = {};
  t.forEach(tr => {
    const m = tr.trade_date.slice(0, 7);
    if (!monthMap[m]) monthMap[m] = { pnl: 0, count: 0, wins: 0 };
    monthMap[m].pnl += tr.pnl - (tr.commission ?? 0);
    monthMap[m].count++;
    if (tr.pnl > 0) monthMap[m].wins++;
  });
  const months = Object.entries(monthMap).sort(([a], [b]) => a.localeCompare(b));
  const bestMonth  = [...months].sort((a, b) => b[1].pnl - a[1].pnl)[0];
  const worstMonth = [...months].sort((a, b) => a[1].pnl - b[1].pnl)[0];
  const profitableMonths = months.filter(([, v]) => v.pnl > 0).length;

  // ── Symbol breakdown ──────────────────────────────────────────────────────
  const symMap: Record<string, { pnl: number; count: number; wins: number }> = {};
  t.forEach(tr => {
    if (!symMap[tr.symbol]) symMap[tr.symbol] = { pnl: 0, count: 0, wins: 0 };
    symMap[tr.symbol].pnl += tr.pnl - (tr.commission ?? 0);
    symMap[tr.symbol].count++;
    if (tr.pnl > 0) symMap[tr.symbol].wins++;
  });
  const symbols = Object.entries(symMap).sort((a, b) => b[1].pnl - a[1].pnl);

  // ── Setup breakdown ───────────────────────────────────────────────────────
  const setupMap: Record<string, { pnl: number; count: number; wins: number }> = {};
  t.forEach(tr => {
    if (!tr.setup) return;
    if (!setupMap[tr.setup]) setupMap[tr.setup] = { pnl: 0, count: 0, wins: 0 };
    setupMap[tr.setup].pnl += tr.pnl - (tr.commission ?? 0);
    setupMap[tr.setup].count++;
    if (tr.pnl > 0) setupMap[tr.setup].wins++;
  });
  const setups = Object.entries(setupMap).sort((a, b) => b[1].pnl - a[1].pnl);

  // ── Session breakdown ─────────────────────────────────────────────────────
  const sessionMap: Record<string, { pnl: number; count: number; wins: number }> = {};
  t.forEach(tr => {
    if (!tr.session) return;
    if (!sessionMap[tr.session]) sessionMap[tr.session] = { pnl: 0, count: 0, wins: 0 };
    sessionMap[tr.session].pnl += tr.pnl - (tr.commission ?? 0);
    sessionMap[tr.session].count++;
    if (tr.pnl > 0) sessionMap[tr.session].wins++;
  });
  const sessions = Object.entries(sessionMap).sort((a, b) => b[1].pnl - a[1].pnl);

  // ── Journal stats ─────────────────────────────────────────────────────────
  const journaledDays     = e.length;
  const rulesFollowed     = e.filter(j => j.rules_followed === true).length;
  const rulesFollowedPct  = pct(rulesFollowed, journaledDays);
  const ratedEntries      = e.filter(j => j.rating != null);
  const avgRating         = avg(ratedEntries.map(j => j.rating ?? 0));
  const journalRate       = pct(journaledDays, tradingDays);

  return (
    <div className="p-4 md:p-6">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Insights</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{fmtDateRange(firstDate)} — {fmtDateRange(lastDate)} · {t.length.toLocaleString()} trades · {tradingDays} trading days</p>
      </div>

      {/* ── SECTION 1: Core Stats ── */}
      <SectionLabel icon={<BarChart2 className="h-3.5 w-3.5" />} title="Core Statistics" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard label="Net P&L" value={fmtMoney(netPnl, true)} color={netPnl >= 0 ? "green" : "red"} sub="after commissions" />
        <StatCard label="Gross P&L" value={fmtMoney(grossPnl, true)} color={grossPnl >= 0 ? "green" : "red"} />
        <StatCard label="Commissions" value={fmtMoney(totalComm)} color="amber" sub={`avg ${fmtMoney(totalComm / t.length)} / trade`} />
        <StatCard label="Win Rate" value={`${winRate.toFixed(1)}%`} color="blue" sub={`${wins.length}W · ${losses.length}L · ${be.length}BE`} />
        <StatCard label="Profit Factor" value={pf === Infinity ? "∞" : pf.toFixed(2)} color={pf >= 2 ? "green" : pf >= 1 ? "amber" : "red"} sub={pf >= 2 ? "Excellent" : pf >= 1.5 ? "Good" : pf >= 1 ? "Marginal" : "Negative edge"} />
        <StatCard label="Total Trades" value={t.length.toLocaleString()} sub={`${tradingDays} trading days`} />
      </div>

      {/* ── SECTION 2: Trade Metrics ── */}
      <SectionLabel icon={<Target className="h-3.5 w-3.5" />} title="Trade Metrics" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard label="Avg Win" value={avgWin > 0 ? fmtMoney(avgWin) : "—"} color="green" />
        <StatCard label="Avg Loss" value={avgLoss > 0 ? fmtMoney(avgLoss) : "—"} color="red" />
        <StatCard label="Avg R-Multiple" value={rTrades.length > 0 ? `${avgR.toFixed(2)}R` : "—"} color={avgR >= 1 ? "green" : avgR > 0 ? "amber" : "red"} sub={`from ${rTrades.length} trades`} />
        <StatCard label="Total Contracts" value={totalContracts.toLocaleString()} sub={`avg ${(totalContracts / t.length).toFixed(1)} / trade`} />
        <StatCard label="Best Trade" value={fmtMoney(bestTrade.pnl, true)} color="green" sub={`${bestTrade.symbol} · ${bestTrade.trade_date}`} />
        <StatCard label="Worst Trade" value={fmtMoney(worstTrade.pnl, true)} color="red" sub={`${worstTrade.symbol} · ${worstTrade.trade_date}`} />
      </div>

      {/* ── SECTION 3: Long vs Short ── */}
      <SectionLabel icon={<TrendingUp className="h-3.5 w-3.5" />} title="Long vs Short" />
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-sm font-semibold">Long</span>
            <span className="text-xs text-muted-foreground ml-auto">{longs.length} trades</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Net P&L</div>
              <div className={`text-lg font-black ${longPnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(longPnl, true)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Win Rate</div>
              <div className="text-lg font-black text-blue-500">{longWR.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Win</div>
              <div className="text-lg font-black text-green-500">{longs.filter(tr=>tr.pnl>0).length > 0 ? fmtMoney(avg(longs.filter(tr=>tr.pnl>0).map(tr=>tr.pnl))) : "—"}</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="text-sm font-semibold">Short</span>
            <span className="text-xs text-muted-foreground ml-auto">{shorts.length} trades</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Net P&L</div>
              <div className={`text-lg font-black ${shortPnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(shortPnl, true)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Win Rate</div>
              <div className="text-lg font-black text-blue-500">{shortWR.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Avg Win</div>
              <div className="text-lg font-black text-green-500">{shorts.filter(tr=>tr.pnl>0).length > 0 ? fmtMoney(avg(shorts.filter(tr=>tr.pnl>0).map(tr=>tr.pnl))) : "—"}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: Streaks ── */}
      <SectionLabel icon={<Zap className="h-3.5 w-3.5" />} title="Streaks" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Best Win Streak" value={`${maxWin} trades`} color="green" />
        <StatCard label="Worst Loss Streak" value={`${maxLoss} trades`} color="red" />
        <StatCard label="Current Streak" value={curWin > 0 ? `${curWin}W` : curLoss > 0 ? `${curLoss}L` : "—"} color={curWin > 0 ? "green" : curLoss > 0 ? "red" : undefined} />
        <StatCard label="Profitable Months" value={`${profitableMonths} / ${months.length}`} color={profitableMonths >= months.length * 0.7 ? "green" : "amber"} />
      </div>

      {/* ── SECTION 5: Day of Week ── */}
      <SectionLabel icon={<Calendar className="h-3.5 w-3.5" />} title="Day of Week" />
      <div className="rounded-xl border border-border overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Day</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Trades</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Win Rate</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Net P&L</th>
              <th className="px-4 py-2.5 w-32 hidden md:table-cell" />
            </tr>
          </thead>
          <tbody>
            {dowEntries.map(([day, stats], i) => {
              const wr = pct(stats.wins, stats.count);
              const maxAbsPnl = Math.max(...dowEntries.map(([,v]) => Math.abs(v.pnl)));
              const barW = maxAbsPnl > 0 ? Math.abs(stats.pnl) / maxAbsPnl * 100 : 0;
              return (
                <tr key={day} className={`border-b border-border last:border-0 ${i === 0 ? "bg-green-500/5" : i === dowEntries.length - 1 ? "bg-red-500/5" : ""}`}>
                  <td className="px-4 py-3 font-medium">
                    {day.slice(0, 3)}
                    {i === 0 && <span className="ml-2 text-[10px] font-semibold text-green-500 uppercase tracking-wide">best</span>}
                    {i === dowEntries.length - 1 && <span className="ml-2 text-[10px] font-semibold text-red-500 uppercase tracking-wide">worst</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{stats.count}</td>
                  <td className="px-4 py-3 text-right text-blue-500 font-medium">{wr.toFixed(1)}%</td>
                  <td className={`px-4 py-3 text-right font-bold ${stats.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(stats.pnl, true)}</td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <div className="flex items-center h-4">
                      <div className="h-2 rounded-full" style={{ width: `${barW}%`, background: stats.pnl >= 0 ? "#22c55e" : "#ef4444", opacity: 0.7 }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── SECTION 6: Monthly ── */}
      <SectionLabel icon={<Calendar className="h-3.5 w-3.5" />} title="Monthly Breakdown" />
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <StatCard label="Best Month" value={bestMonth ? fmtDate(bestMonth[0]) : "—"} color="green" sub={bestMonth ? fmtMoney(bestMonth[1].pnl, true) : ""} />
        <StatCard label="Worst Month" value={worstMonth ? fmtDate(worstMonth[0]) : "—"} color="red" sub={worstMonth ? fmtMoney(worstMonth[1].pnl, true) : ""} />
        <StatCard label="Profitable Months" value={`${profitableMonths} / ${months.length}`} color={profitableMonths === months.length ? "green" : "amber"} />
      </div>
      <div className="rounded-xl border border-border overflow-hidden mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Month</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Trades</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Win Rate</th>
              <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Net P&L</th>
            </tr>
          </thead>
          <tbody>
            {[...months].sort(([a],[b]) => b.localeCompare(a)).map(([m, stats]) => {
              const wr = pct(stats.wins, stats.count);
              return (
                <tr key={m} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{fmtDate(m)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">{stats.count}</td>
                  <td className="px-4 py-3 text-right text-blue-500 font-medium">{wr.toFixed(1)}%</td>
                  <td className={`px-4 py-3 text-right font-bold ${stats.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(stats.pnl, true)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── SECTION 7: Symbols ── */}
      {symbols.length > 0 && (<>
        <SectionLabel icon={<TrendingUp className="h-3.5 w-3.5" />} title="By Symbol" />
        <div className="rounded-xl border border-border overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Symbol</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Trades</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Win Rate</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Net P&L</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Avg Win</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Avg Loss</th>
              </tr>
            </thead>
            <tbody>
              {symbols.map(([sym, stats]) => {
                const symTrades = t.filter(tr => tr.symbol === sym);
                const symWins   = symTrades.filter(tr => tr.pnl > 0);
                const symLosses = symTrades.filter(tr => tr.pnl < 0);
                const wr = pct(stats.wins, stats.count);
                return (
                  <tr key={sym} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-bold">{sym}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{stats.count}</td>
                    <td className="px-4 py-3 text-right text-blue-500 font-medium">{wr.toFixed(1)}%</td>
                    <td className={`px-4 py-3 text-right font-bold ${stats.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(stats.pnl, true)}</td>
                    <td className="px-4 py-3 text-right text-green-500 hidden sm:table-cell">{symWins.length > 0 ? fmtMoney(avg(symWins.map(tr=>tr.pnl))) : "—"}</td>
                    <td className="px-4 py-3 text-right text-red-500 hidden sm:table-cell">{symLosses.length > 0 ? fmtMoney(avg(symLosses.map(tr=>Math.abs(tr.pnl)))) : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ── SECTION 8: Setups ── */}
      {setups.length > 0 && (<>
        <SectionLabel icon={<Award className="h-3.5 w-3.5" />} title="By Setup" />
        <div className="rounded-xl border border-border overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Setup</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Trades</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Win Rate</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {setups.map(([setup, stats]) => {
                const wr = pct(stats.wins, stats.count);
                return (
                  <tr key={setup} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{setup}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{stats.count}</td>
                    <td className="px-4 py-3 text-right text-blue-500 font-medium">{wr.toFixed(1)}%</td>
                    <td className={`px-4 py-3 text-right font-bold ${stats.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(stats.pnl, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ── SECTION 9: Sessions ── */}
      {sessions.length > 0 && (<>
        <SectionLabel icon={<Zap className="h-3.5 w-3.5" />} title="By Session" />
        <div className="rounded-xl border border-border overflow-hidden mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Session</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Trades</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Win Rate</th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">Net P&L</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(([session, stats]) => {
                const wr = pct(stats.wins, stats.count);
                return (
                  <tr key={session} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{session}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{stats.count}</td>
                    <td className="px-4 py-3 text-right text-blue-500 font-medium">{wr.toFixed(1)}%</td>
                    <td className={`px-4 py-3 text-right font-bold ${stats.pnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(stats.pnl, true)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>)}

      {/* ── SECTION 10: Journal ── */}
      {journaledDays > 0 && (<>
        <SectionLabel icon={<BookOpen className="h-3.5 w-3.5" />} title="Journal Stats" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard label="Days Journaled" value={journaledDays.toString()} sub={`of ${tradingDays} trading days`} />
          <StatCard label="Journal Rate" value={`${journalRate.toFixed(0)}%`} color={journalRate >= 80 ? "green" : journalRate >= 50 ? "amber" : "red"} sub="vs trading days" />
          <StatCard label="Rules Followed" value={`${rulesFollowedPct.toFixed(0)}%`} color={rulesFollowedPct >= 80 ? "green" : rulesFollowedPct >= 60 ? "amber" : "red"} sub={`${rulesFollowed} of ${journaledDays} days`} />
          <StatCard label="Avg Session Rating" value={ratedEntries.length > 0 ? `${avgRating.toFixed(1)} / 5` : "—"} color="amber" />
        </div>
      </>)}

    </div>
  );
}

function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{title}</span>
      <div className="flex-1 border-t border-border" />
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: "green"|"red"|"amber"|"blue" }) {
  const colorClass = color === "green" ? "text-green-500" : color === "red" ? "text-red-500" : color === "amber" ? "text-amber-500" : color === "blue" ? "text-blue-500" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className={`text-xl font-black leading-tight ${colorClass}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</div>}
    </div>
  );
}