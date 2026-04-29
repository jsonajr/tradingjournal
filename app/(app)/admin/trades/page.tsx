import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fmtMoney } from "@/lib/utils";
import { Search, Flag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminTradesPage({ searchParams }: { searchParams: Promise<{ user?: string; result?: string; from?: string; to?: string }> }) {
  const params = await searchParams;
  const sb = createAdminClient();

  let query = sb.from("trades").select("*").order("trade_date", { ascending: false }).limit(200);
  if (params.user)   query = query.eq("user_id", params.user);
  if (params.result === "win")  query = query.gt("pnl", 0);
  if (params.result === "loss") query = query.lt("pnl", 0);
  if (params.from)   query = query.gte("trade_date", params.from);
  if (params.to)     query = query.lte("trade_date", params.to);
  const { data: trades } = await query;

  const ids = [...new Set((trades ?? []).map((t) => t.user_id))];
  const { data: profiles } = await sb.from("profiles").select("id, email").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const m = new Map((profiles ?? []).map((p) => [p.id, p.email]));

  const totalPnl = (trades ?? []).reduce((s, t) => s + t.pnl - t.commission, 0);
  const flagged = (trades ?? []).filter((t) => t.is_flagged).length;

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">All Trades</h1>
        <p className="text-sm text-muted-foreground">{trades?.length ?? 0} trades · {fmtMoney(totalPnl)} net · {flagged} flagged</p>
      </div>
      <Card>
        <CardHeader>
          <form className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input name="user" defaultValue={params.user ?? ""} placeholder="User ID..." className="pl-9" />
            </div>
            <Input type="date" name="from" defaultValue={params.from ?? ""} className="w-[160px]" />
            <Input type="date" name="to"   defaultValue={params.to ?? ""}   className="w-[160px]" />
            <select name="result" defaultValue={params.result ?? ""} className="h-9 rounded-md border bg-background px-3 text-sm">
              <option value="">All</option><option value="win">Wins</option><option value="loss">Losses</option>
            </select>
            <Button type="submit">Filter</Button>
          </form>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>User</TableHead><TableHead>Symbol</TableHead><TableHead>Dir</TableHead><TableHead>P&amp;L</TableHead><TableHead>R</TableHead><TableHead>Flag</TableHead></TableRow></TableHeader>
            <TableBody>
              {(trades ?? []).map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="text-xs">{t.trade_date}</TableCell>
                  <TableCell><Link href={`/admin/users/${t.user_id}`} className="text-xs hover:text-primary hover:underline">{m.get(t.user_id) ?? t.user_id.slice(0, 8)}</Link></TableCell>
                  <TableCell className="font-medium">{t.symbol}</TableCell>
                  <TableCell><Badge variant={t.direction === "Long" ? "success" : "destructive"}>{t.direction}</Badge></TableCell>
                  <TableCell className={t.pnl >= 0 ? "text-green-500" : "text-red-500"}>{fmtMoney(t.pnl)}</TableCell>
                  <TableCell className="text-xs">{t.r_multiple != null ? `${t.r_multiple}R` : "—"}</TableCell>
                  <TableCell>{t.is_flagged && <Flag className="h-4 w-4 text-amber-500" />}</TableCell>
                </TableRow>
              ))}
              {(!trades || trades.length === 0) && <TableRow><TableCell colSpan={7} className="py-8 text-center text-muted-foreground">No trades match filters</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
