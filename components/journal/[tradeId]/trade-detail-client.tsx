"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, TrendingUp, TrendingDown, DollarSign, Target, BarChart2 } from "lucide-react";
import { fmtMoney } from "@/lib/utils";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

type Trade = {
  id: string;
  trade_date: string;
  symbol: string;
  direction: "Long" | "Short";
  contracts: number;
  entry_price: number | null;
  exit_price: number | null;
  stop_price: number | null;
  pnl: number;
  commission: number;
  r_multiple: number | null;
  setup: string | null;
  session: string | null;
  grade: string | null;
  notes: string | null;
  accounts: { name: string; firm: string | null } | null;
};

// Map futures symbols to TradingView symbols
const TV_SYMBOL_MAP: Record<string, string> = {
  ES: "CME_MINI:ES1!",
  NQ: "CME_MINI:NQ1!",
  MES: "CME_MINI:MES1!",
  MNQ: "CME_MINI:MNQ1!",
  CL: "NYMEX:CL1!",
  GC: "COMEX:GC1!",
  RTY: "CME_MINI:RTY1!",
  YM: "CBOT_MINI:YM1!",
};

function TradingViewWidget({ symbol }: { symbol: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const tvSymbol = TV_SYMBOL_MAP[symbol] ?? `CME_MINI:${symbol}1!`;

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView === "undefined") return;
      new window.TradingView.widget({
        autosize: true,
        symbol: tvSymbol,
        interval: "5",
        timezone: "America/New_York",
        theme: "dark",
        style: "1",
        locale: "en",
        toolbar_bg: "#1a1a2e",
        enable_publishing: false,
        hide_top_toolbar: false,
        hide_legend: false,
        save_image: false,
        container_id: "tv_chart",
        studies: ["RSI@tv-basicstudies", "MACD@tv-basicstudies"],
      });
    };
    document.head.appendChild(script);
    return () => {
      try { document.head.removeChild(script); } catch {}
    };
  }, [tvSymbol]);

  return <div ref={ref} id="tv_chart" className="h-[400px] w-full rounded-lg overflow-hidden" />;
}

export function TradeDetailClient({ trade }: { trade: Trade }) {
  const router = useRouter();
  const net = trade.pnl - trade.commission;
  const isWin = net >= 0;

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

  const rr = trade.entry_price && trade.stop_price && trade.exit_price
    ? (() => {
        const risk = Math.abs(trade.entry_price - trade.stop_price);
        const reward = trade.direction === "Long"
          ? trade.exit_price - trade.entry_price
          : trade.entry_price - trade.exit_price;
        return risk > 0 ? (reward / risk).toFixed(2) : null;
      })()
    : null;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/trades"><ArrowLeft className="mr-1 h-4 w-4" />Back to Trades</Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={deleteTrade}>
          <Trash2 className="mr-1 h-3.5 w-3.5" />Delete Trade
        </Button>
      </div>

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-xl text-white ${isWin ? "bg-green-600" : "bg-red-600"}`}>
          {isWin ? <TrendingUp className="h-7 w-7" /> : <TrendingDown className="h-7 w-7" />}
        </div>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black">{trade.symbol}</h1>
            <Badge className={trade.direction === "Long" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>
              {trade.direction}
            </Badge>
            {trade.grade && <Badge variant="outline">{trade.grade}</Badge>}
          </div>
          <div className="text-sm text-muted-foreground">{trade.trade_date} · {trade.accounts?.name ?? "—"}{trade.accounts?.firm ? ` (${trade.accounts.firm})` : ""}</div>
        </div>
        <div className="ml-auto text-right">
          <div className={`text-3xl font-black ${isWin ? "text-green-400" : "text-red-400"}`}>
            {net >= 0 ? "+" : ""}{fmtMoney(Math.abs(net))}
          </div>
          <div className="text-xs text-muted-foreground">Net P&L (after ${trade.commission.toFixed(2)} fees)</div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[
          { icon: DollarSign, label: "Gross P&L", value: fmtMoney(trade.pnl, true), color: trade.pnl >= 0 ? "text-green-500" : "text-red-500" },
          { icon: Target, label: "R-Multiple", value: trade.r_multiple != null ? `${trade.r_multiple}R` : "—", color: (trade.r_multiple ?? 0) >= 0 ? "text-green-500" : "text-red-500" },
          { icon: BarChart2, label: "Risk/Reward", value: rr ? `1:${rr}` : "—", color: "text-primary" },
          { icon: TrendingUp, label: "Contracts", value: trade.contracts.toString(), color: "text-foreground" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Trade Info</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {[
              ["Entry Price", trade.entry_price ?? "—"],
              ["Exit Price", trade.exit_price ?? "—"],
              ["Stop Price", trade.stop_price ?? "—"],
              ["Commission", `$${trade.commission.toFixed(2)}`],
              ["Setup", trade.setup ?? "—"],
              ["Session", trade.session ?? "—"],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-medium">{value as string}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Notes</CardTitle></CardHeader>
          <CardContent>
            {trade.notes ? (
              <p className="text-sm leading-relaxed text-zinc-300">{trade.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes for this trade.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* TradingView Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            {trade.symbol} Chart
            <span className="text-xs text-muted-foreground font-normal ml-1">(5 min · NY timezone)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-b-lg">
          <TradingViewWidget symbol={trade.symbol} />
        </CardContent>
      </Card>
    </div>
  );
}

declare global {
  interface Window {
    TradingView: {
      widget: new (config: Record<string, unknown>) => void;
    };
  }
}