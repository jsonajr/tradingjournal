"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2, TrendingUp, TrendingDown, Star, CheckCircle2, XCircle, BookOpen, Zap, Clock, Edit } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Entry = {
  id: string; entry_date: string; title: string | null;
  bias: "Bullish" | "Bearish" | "Neutral" | null;
  mood: "great" | "good" | "neutral" | "bad" | "terrible" | null;
  rating: number | null; plan: string | null; notes: string | null;
  setups: string[] | null; sessions: string[] | null;
  rules_followed: boolean | null; improvement: string | null; tags: string[] | null;
};

type Trade = {
  id: string; symbol: string; direction: string;
  pnl: number; commission: number; r_multiple: number | null;
  setup: string | null; session: string | null; notes: string | null;
  entry_price: number | null; exit_price: number | null; contracts: number;
};

const MOOD_EMOJI: Record<string, string> = { great: "🟢", good: "🔵", neutral: "🟡", bad: "🟠", terrible: "🔴" };
const MOOD_LABEL: Record<string, string> = { great: "Great", good: "Good", neutral: "Neutral", bad: "Bad", terrible: "Terrible" };

function fmt(v: number) {
  const sign = v >= 0 ? "+" : "-";
  return sign + "$" + Math.abs(v).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export function JournalDayClient({ entry, trades }: { entry: Entry; trades: Trade[] }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const totalPnl = trades.reduce((s, t) => s + t.pnl - t.commission, 0);
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);

  async function handleDelete() {
    if (!confirm("Delete this journal entry? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/journal-entries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: entry.id }),
      });
      if (!res.ok) { toast.error("Failed to delete"); return; }
      toast.success("Entry deleted");
      router.push("/journal/calendar");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/journal/calendar")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{formatDate(entry.entry_date)}</p>
            <h1 className="text-xl md:text-2xl font-black leading-tight mt-0.5">
              {entry.title || "Journal Entry"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => router.push(`/journal/calendar?edit=${entry.entry_date}`)}>
            <Edit className="mr-1.5 h-3.5 w-3.5" />Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />{deleting ? "Deleting…" : "Delete Entry"}
          </Button>
        </div>
      </div>

      {/* Top stat pills */}
      <div className="mb-6 flex flex-wrap gap-2">
        {entry.mood && (
          <span className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium">
            {MOOD_EMOJI[entry.mood]} {MOOD_LABEL[entry.mood]}
          </span>
        )}
        {entry.bias && (
          <Badge variant={entry.bias === "Bullish" ? "success" : entry.bias === "Bearish" ? "destructive" : "warning"} className="text-sm px-3 py-1">
            {entry.bias}
          </Badge>
        )}
        {entry.rating != null && (
          <span className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm">
            {"★".repeat(entry.rating)}<span className="text-muted-foreground/40">{"★".repeat(5 - entry.rating)}</span>
          </span>
        )}
        {entry.rules_followed != null && (
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium",
            entry.rules_followed ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500"
          )}>
            {entry.rules_followed ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
            Rules {entry.rules_followed ? "Followed" : "Broken"}
          </span>
        )}
        {trades.length > 0 && (
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-black",
            totalPnl >= 0 ? "border-green-500/30 text-green-500" : "border-red-500/30 text-red-500"
          )}>
            {totalPnl >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
            {fmt(totalPnl)} · {trades.length} trade{trades.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">

        {/* Pre-market plan */}
        {entry.plan && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />Pre-Market Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{entry.plan}</p>
            </CardContent>
          </Card>
        )}

        {/* Post-session notes */}
        {entry.notes && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />Post-Session Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{entry.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Setups traded */}
        {entry.setups && entry.setups.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Setups Traded</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {entry.setups.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sessions */}
        {entry.sessions && entry.sessions.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-blue-500" />Sessions Traded</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-wrap gap-1.5">
                {entry.sessions.map((s) => (
                  <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Improvement focus */}
        {entry.improvement && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500" />Improvement Focus
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm leading-relaxed text-foreground/90">{entry.improvement}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trades for this day */}
      {trades.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Trades This Day</CardTitle>
              <div className="flex gap-3 text-xs text-muted-foreground">
                <span className="text-green-500 font-semibold">{wins.length}W</span>
                <span className="text-red-500 font-semibold">{losses.length}L</span>
                <span className={cn("font-black", totalPnl >= 0 ? "text-green-500" : "text-red-500")}>{fmt(totalPnl)}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Dir</TableHead>
                  <TableHead>Contracts</TableHead>
                  <TableHead>Entry</TableHead>
                  <TableHead>Exit</TableHead>
                  <TableHead>Net P&L</TableHead>
                  <TableHead>R</TableHead>
                  <TableHead>Setup</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trades.map((t) => {
                  const net = t.pnl - t.commission;
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="font-bold">{t.symbol}</TableCell>
                      <TableCell>
                        <Badge className={t.direction === "Long" ? "bg-green-500/15 text-green-500" : "bg-red-500/15 text-red-500"}>
                          {t.direction}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{t.contracts}</TableCell>
                      <TableCell className="text-xs tabular-nums">{t.entry_price ?? "—"}</TableCell>
                      <TableCell className="text-xs tabular-nums">{t.exit_price ?? "—"}</TableCell>
                      <TableCell className={cn("font-bold tabular-nums", net >= 0 ? "text-green-500" : "text-red-500")}>
                        {fmt(net)}
                      </TableCell>
                      <TableCell className="text-xs">{t.r_multiple != null ? `${t.r_multiple}R` : "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.setup || "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {trades.length === 0 && (
        <Card className="mt-4">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            No trades logged for this day
          </CardContent>
        </Card>
      )}
    </div>
  );
}