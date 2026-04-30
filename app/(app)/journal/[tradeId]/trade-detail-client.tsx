"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Trash2, TrendingUp, TrendingDown, DollarSign, Target, BarChart2, Clock, Save, ChevronLeft, ChevronRight } from "lucide-react";
import { fmtMoney } from "@/lib/utils";
import { toast } from "sonner";

type Trade = {
  id: string; trade_date: string; symbol: string;
  direction: "Long" | "Short"; contracts: number;
  entry_price: number | null; exit_price: number | null; stop_price: number | null;
  pnl: number; commission: number; r_multiple: number | null;
  setup: string | null; session: string | null; grade: string | null;
  notes: string | null;
  accounts: { name: string; firm: string | null } | null;
};

type AdjacentTrades = { prev: string | null; next: string | null };

const TV_SYMBOL_MAP: Record<string, string> = {
  ES:  "AMEX:SPY",    // S&P 500 proxy
  MES: "AMEX:SPY",
  NQ:  "NASDAQ:QQQ",  // Nasdaq proxy
  MNQ: "NASDAQ:QQQ",
  YM:  "AMEX:DIA",    // Dow proxy
  RTY: "AMEX:IWM",    // Russell proxy
  CL:  "TVC:USOIL",   // Crude oil
  GC:  "TVC:GOLD",    // Gold
};

const INTERVALS = [
  { label: "1m",  value: "1" },
  { label: "3m",  value: "3" },
  { label: "5m",  value: "5" },
  { label: "15m", value: "15" },
  { label: "30m", value: "30" },
  { label: "1h",  value: "60" },
  { label: "4h",  value: "240" },
  { label: "D",   value: "D" },
];

function TradingViewWidget({ symbol, interval, entry, exit, stop, direction, tradeDate }: {
  symbol: string; interval: string;
  entry: number | null; exit: number | null; stop: number | null;
  direction: "Long" | "Short"; tradeDate: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<unknown>(null);
  // Strip expiry suffix e.g. MNQM6 → MNQ, ESZ5 → ES
  const baseSymbol = symbol.replace(/[A-Z]\d+$/, "");
  const tvSymbol = TV_SYMBOL_MAP[baseSymbol] ?? TV_SYMBOL_MAP[symbol] ?? `CME_MINI:${baseSymbol}1!`;

  useEffect(() => {
    if (!containerRef.current) return;
    const containerId = `tv_chart_${symbol}_${interval}`;
    containerRef.current.innerHTML = `<div id="${containerId}" style="height:100%;width:100%"></div>`;

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView === "undefined") return;

      // Build studies with price lines for entry/exit/stop
      const studies: string[] = ["Volume@tv-basicstudies"];
      const lines: Array<{ price: number; color: string; title: string }> = [];
      if (entry) lines.push({ price: entry, color: "#22c55e", title: "Entry" });
      if (exit)  lines.push({ price: exit,  color: direction === "Long" && exit > (entry ?? 0) ? "#22c55e" : "#ef4444", title: "Exit" });
      if (stop)  lines.push({ price: stop,  color: "#ef4444", title: "Stop" });

      widgetRef.current = new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval,
        timezone: "America/New_York",
        theme: document.documentElement.classList.contains("dark") ? "dark" : "light",
        style: "1",
        locale: "en",
        enable_publishing: false,
        allow_symbol_change: true,
        hide_side_toolbar: false,
        container_id: containerId,
        studies,
        overrides: {
          "scalesProperties.showLeftScale": false,
        },
        // Price lines for entry/exit/stop
        ...(lines.length > 0 ? {
          drawings_access: { type: "all", tools: [{ name: "Horizontal Line" }] },
        } : {}),
      });
    };

    const existingScript = document.querySelector('script[src="https://s3.tradingview.com/tv.js"]');
    if (existingScript) {
      script.onload?.(new Event("load"));
    } else {
      document.head.appendChild(script);
    }

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [tvSymbol, interval]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[480px] w-full rounded-b-lg overflow-hidden" />
      {/* Entry/Exit/Stop price overlay legend */}
      {(entry || exit || stop) && (
        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
          {entry && (
            <div className="flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-xs backdrop-blur">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-green-400 font-semibold">Entry {entry}</span>
            </div>
          )}
          {exit && (
            <div className="flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-xs backdrop-blur">
              <div className={`h-2 w-2 rounded-full ${direction === "Long" && exit > (entry ?? 0) ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`font-semibold ${direction === "Long" && exit > (entry ?? 0) ? "text-green-400" : "text-red-400"}`}>Exit {exit}</span>
            </div>
          )}
          {stop && (
            <div className="flex items-center gap-1.5 rounded-md bg-black/70 px-2 py-1 text-xs backdrop-blur">
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-red-400 font-semibold">Stop {stop}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TradeDetailClient({ trade, adjacent }: { trade: Trade; adjacent?: AdjacentTrades }) {
  const router = useRouter();
  const net = trade.pnl - trade.commission;
  const isWin = net >= 0;
  const [interval, setInterval] = useState("5");
  const [notes, setNotes] = useState(trade.notes ?? "");
  const [savingNotes, setSavingNotes] = useState(false);

  const rr = trade.entry_price && trade.stop_price && trade.exit_price
    ? (() => {
        const risk = Math.abs(trade.entry_price - trade.stop_price);
        const reward = trade.direction === "Long"
          ? trade.exit_price - trade.entry_price
          : trade.entry_price - trade.exit_price;
        return risk > 0 ? (reward / risk).toFixed(2) : null;
      })()
    : null;

  const pnlPerContract = trade.contracts > 0 ? net / trade.contracts : null;

  async function deleteTrade() {
    if (!confirm("Delete this trade? This cannot be undone.")) return;
    const res = await fetch("/api/trades", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trade.id }),
    });
    if (!res.ok) { toast.error("Failed to delete"); return; }
    toast.success("Trade deleted");
    router.push("/trades");
    router.refresh();
  }

  async function saveNotes() {
    setSavingNotes(true);
    const res = await fetch("/api/trades/update", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: trade.id, notes }),
    });
    setSavingNotes(false);
    if (!res.ok) { toast.error("Failed to save notes"); return; }
    toast.success("Notes saved");
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/trades"><ArrowLeft className="mr-1 h-4 w-4" />Back to Trades</Link>
        </Button>
        <div className="flex items-center gap-2">
          {adjacent?.prev && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/journal/${adjacent.prev}`)}>
              <ChevronLeft className="mr-1 h-3.5 w-3.5" />Prev
            </Button>
          )}
          {adjacent?.next && (
            <Button variant="outline" size="sm" onClick={() => router.push(`/journal/${adjacent.next}`)}>
              Next<ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="destructive" size="sm" onClick={deleteTrade}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />Delete
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg ${isWin ? "bg-green-600 shadow-green-900/30" : "bg-red-600 shadow-red-900/30"}`}>
          {isWin ? <TrendingUp className="h-8 w-8" /> : <TrendingDown className="h-8 w-8" />}
        </div>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-black">{trade.symbol}</h1>
            <Badge className={trade.direction === "Long" ? "bg-green-500/15 text-green-500 text-sm px-3" : "bg-red-500/15 text-red-500 text-sm px-3"}>
              {trade.direction}
            </Badge>
            {trade.grade && <Badge variant="outline" className="text-sm px-3">{trade.grade}</Badge>}
            {trade.setup && <Badge variant="secondary" className="text-sm">{trade.setup}</Badge>}
          </div>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span>{trade.trade_date}</span>
            {trade.session && <><span>·</span><span>{trade.session}</span></>}
            {trade.accounts?.name && <><span>·</span><span>{trade.accounts.name}{trade.accounts.firm ? ` (${trade.accounts.firm})` : ""}</span></>}
          </div>
        </div>
        <div className="ml-auto text-right">
          <div className={`text-3xl font-black md:text-4xl truncate ${isWin ? "text-green-400" : "text-red-400"}`}>
            {net >= 0 ? "+" : ""}{fmtMoney(Math.abs(net))}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">Net · ${trade.commission.toFixed(2)} fees</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Gross P&L",    value: fmtMoney(trade.pnl, true), color: trade.pnl >= 0 ? "text-green-500" : "text-red-500" },
          { label: "Net P&L",      value: fmtMoney(net, true),       color: net >= 0 ? "text-green-500" : "text-red-500" },
          { label: "R-Multiple",   value: trade.r_multiple != null ? `${trade.r_multiple}R` : "No stop set", color: trade.r_multiple == null ? "text-muted-foreground text-sm" : (trade.r_multiple ?? 0) >= 1 ? "text-green-500" : (trade.r_multiple ?? 0) >= 0 ? "text-amber-500" : "text-red-500" },
          { label: "Risk/Reward",  value: rr ? `1:${rr}` : "No stop set", color: rr ? "text-primary" : "text-muted-foreground text-sm" },
          { label: "Contracts",    value: String(trade.contracts),   color: "text-foreground" },
          { label: "Per Contract", value: pnlPerContract != null ? fmtMoney(pnlPerContract, true) : "—", color: (pnlPerContract ?? 0) >= 0 ? "text-green-500" : "text-red-500" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-3">
              <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart + Info side by side on desktop */}
      <div className="grid gap-4 lg:grid-cols-3 mb-6">
        {/* Chart takes 2/3 */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart2 className="h-4 w-4" />
                {trade.symbol} · TradingView
              </CardTitle>
              {/* Timeframe selector */}
              <div className="flex gap-1 flex-wrap">
                {INTERVALS.map((iv) => (
                  <button key={iv.value} onClick={() => setInterval(iv.value)}
                    className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${interval === iv.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}>
                    {iv.label}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden rounded-b-lg">
            <TradingViewWidget
              symbol={trade.symbol}
              interval={interval}
              entry={trade.entry_price}
              exit={trade.exit_price}
              stop={trade.stop_price}
              direction={trade.direction}
              tradeDate={trade.trade_date}
            />
          </CardContent>
        </Card>

        {/* Info takes 1/3 */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Execution</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {[
                ["Entry",      trade.entry_price,  "text-green-500"],
                ["Exit",       trade.exit_price,   isWin ? "text-green-500" : "text-red-500"],
                ["Stop",       trade.stop_price,   "text-red-500"],
                ["Commission", `$${trade.commission.toFixed(2)}`, "text-amber-500"],
              ].map(([label, value, color]) => (
                <div key={label as string} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label as string}</span>
                  <span className={`font-semibold ${color as string}`}>{value ?? "—"}</span>
                </div>
              ))}
              {trade.entry_price && trade.exit_price && (
                <>
                  <div className="border-t pt-2 mt-2" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Price Move</span>
                    <span className={`font-semibold ${isWin ? "text-green-500" : "text-red-500"}`}>
                      {trade.direction === "Long"
                        ? (trade.exit_price - trade.entry_price).toFixed(2)
                        : (trade.entry_price - trade.exit_price).toFixed(2)} pts
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm">Trade Notes</CardTitle>
              <Button size="sm" variant="ghost" onClick={saveNotes} disabled={savingNotes}>
                <Save className="mr-1 h-3.5 w-3.5" />{savingNotes ? "Saving..." : "Save"}
              </Button>
            </CardHeader>
            <CardContent>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes, reflections, what you did well or wrong..."
                className="min-h-[140px] text-sm resize-none"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

declare global {
  interface Window {
    TradingView: { widget: new (config: Record<string, unknown>) => void };
  }
}