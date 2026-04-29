import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fmtMoney } from "@/lib/utils";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const { data: trades } = await sb
    .from("trades")
    .select("*, accounts(name)")
    .eq("user_id", user.id)
    .order("trade_date", { ascending: false })
    .limit(500);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Trade History</h1>
          <p className="text-sm text-muted-foreground">{trades?.length ?? 0} trades logged</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link href="/import"><Upload className="mr-1 h-4 w-4" />Import CSV</Link></Button>
          <Button asChild><Link href="/trades/new"><Plus className="mr-1 h-4 w-4" />New Trade</Link></Button>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-sm">All Trades</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Symbol</TableHead>
                <TableHead>Dir</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Entry</TableHead>
                <TableHead>Exit</TableHead>
                <TableHead>Gross P&L</TableHead>
                <TableHead>Net P&L</TableHead>
                <TableHead>R</TableHead>
                <TableHead>Setup</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades?.map((t) => {
                const net = (t.pnl ?? 0) - (t.commission ?? 0);
                return (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{t.trade_date}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{(t.accounts as { name: string } | null)?.name ?? "—"}</TableCell>
                    <TableCell className="font-semibold">{t.symbol}</TableCell>
                    <TableCell>
                      <Badge className={t.direction === "Long" ? "bg-green-500/15 text-green-500 hover:bg-green-500/20" : "bg-red-500/15 text-red-500 hover:bg-red-500/20"}>
                        {t.direction}
                      </Badge>
                    </TableCell>
                    <TableCell>{t.contracts}</TableCell>
                    <TableCell className="text-xs">{t.entry_price ?? "—"}</TableCell>
                    <TableCell className="text-xs">{t.exit_price ?? "—"}</TableCell>
                    <TableCell className={`font-semibold ${(t.pnl ?? 0) >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(t.pnl ?? 0)}</TableCell>
                    <TableCell className={`font-semibold ${net >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(net)}</TableCell>
                    <TableCell className="text-xs">{t.r_multiple != null ? `${t.r_multiple}R` : "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.setup ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{t.grade ?? "—"}</Badge></TableCell>
                  </TableRow>
                );
              })}
              {(!trades || trades.length === 0) && (
                <TableRow><TableCell colSpan={12} className="py-12 text-center text-muted-foreground">No trades yet — <Link href="/trades/new" className="text-primary underline">log your first trade</Link> or <Link href="/import" className="text-primary underline">import a CSV</Link></TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}