import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDate, fmtDateTz, fmtMoney } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { UserActions } from "./user-actions";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = createAdminClient();
  const { data: user } = await sb.from("profiles").select("*").eq("id", id).single();
  if (!user) notFound();

  // Get current admin's timezone preference
  const { user: adminUser } = await requireRole(["admin", "moderator"]);
  const { data: adminSettings } = await sb.from("user_settings").select("timezone").eq("user_id", adminUser.id).maybeSingle();
  const tz = adminSettings?.timezone || "America/New_York";

  const [{ data: trades }, { data: cooldowns }, { data: subscription }, { data: reflections }] = await Promise.all([
    sb.from("trades").select("*").eq("user_id", id).order("trade_date", { ascending: false }).limit(20),
    sb.from("cooldowns").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(5),
    sb.from("subscriptions").select("*").eq("user_id", id).maybeSingle(),
    sb.from("post_trade_reflections").select("*").eq("user_id", id).order("created_at", { ascending: false }).limit(20),
  ]);

  const wins = (trades ?? []).filter((t) => t.pnl > 0).length;
  const losses = (trades ?? []).filter((t) => t.pnl < 0).length;
  const totalPnl = (trades ?? []).reduce((s, t) => s + t.pnl - t.commission, 0);
  const activeCooldown = (cooldowns ?? []).find((c) => c.is_active && new Date(c.ends_at) > new Date());
  const isSuspended = (cooldowns ?? []).some((c) => c.is_active && new Date(c.ends_at) > new Date() && c.reason?.startsWith("SUSPENDED:"));

  return (
    <div className="p-4 md:p-8">
      <Link href="/admin/users" className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-xl font-bold md:text-2xl break-all">{user.email}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{user.full_name ?? "No name set"}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={user.role === "admin" ? "default" : user.role === "moderator" ? "warning" : "outline"}>{user.role}</Badge>
            <Badge variant={user.plan === "premium" ? "default" : user.plan === "pro" ? "warning" : "secondary"}>{user.plan}</Badge>
            {user.banned && <Badge variant="destructive">Banned</Badge>}
            {activeCooldown && <Badge variant="warning">Cooldown active</Badge>}
            {subscription?.status && <Badge variant="outline">Sub: {subscription.status}</Badge>}
          </div>
        </div>
        <UserActions user={user} isSuspended={isSuspended} />
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Total Trades" value={trades?.length ?? 0} />
        <Stat label="Net P&L" value={fmtMoney(totalPnl)} accent={totalPnl >= 0 ? "text-green-500" : "text-red-500"} />
        <Stat label="Wins / Losses" value={`${wins} / ${losses}`} />
        <Stat label="Last Seen" value={fmtDateTz(user.last_seen, tz)} small />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Recent Trades</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Symbol</TableHead><TableHead>Dir</TableHead><TableHead>P&amp;L</TableHead></TableRow></TableHeader>
              <TableBody>
                {(trades ?? []).slice(0, 10).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs">{t.trade_date}</TableCell>
                    <TableCell className="font-medium">{t.symbol}</TableCell>
                    <TableCell><Badge variant={t.direction === "Long" ? "success" : "destructive"}>{t.direction}</Badge></TableCell>
                    <TableCell className={t.pnl >= 0 ? "text-green-500" : "text-red-500"}>{fmtMoney(t.pnl)}</TableCell>
                  </TableRow>
                ))}
                {(!trades || trades.length === 0) && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No trades</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Cooldown History</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow><TableHead>Started</TableHead><TableHead>Ends</TableHead><TableHead>Reason</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {(cooldowns ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="text-xs">{fmtDateTz(c.starts_at, tz)}</TableCell>
                    <TableCell className="text-xs">{fmtDateTz(c.ends_at, tz)}</TableCell>
                    <TableCell className="text-xs">{c.reason ?? "—"}</TableCell>
                    <TableCell>{c.is_active && new Date(c.ends_at) > new Date() ? <Badge variant="warning">Active</Badge> : <Badge variant="outline">Expired</Badge>}</TableCell>
                  </TableRow>
                ))}
                {(!cooldowns || cooldowns.length === 0) && <TableRow><TableCell colSpan={4} className="py-6 text-center text-muted-foreground">No cooldowns</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Post-Trade Reflections */}
      {reflections && reflections.length > 0 && (
        <div className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Post-Trade Reflections</CardTitle></CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Followed Setup</TableHead>
                    <TableHead>Emotional</TableHead>
                    <TableHead>Revenge</TableHead>
                    <TableHead>Needs Break</TableHead>
                    <TableHead>Exec Plan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reflections.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{fmtDateTz(r.created_at, tz)}</TableCell>
                      <TableCell>
                        <Badge variant={r.trade_result === "win" ? "success" : "destructive"}>
                          {r.trade_result}
                        </Badge>
                      </TableCell>
                      <TableCell><YesNo val={r.followed_setup} /></TableCell>
                      <TableCell><YesNo val={r.emotional_trade} warn /></TableCell>
                      <TableCell><YesNo val={r.revenge_trade} warn /></TableCell>
                      <TableCell><YesNo val={r.needs_break} warn /></TableCell>
                      <TableCell><YesNo val={r.executed_plan} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function YesNo({ val, warn }: { val: boolean; warn?: boolean }) {
  return (
    <Badge variant={val ? (warn ? "destructive" : "success") : "outline"}>
      {val ? "Yes" : "No"}
    </Badge>
  );
}

function Stat({ label, value, accent, small }: { label: string; value: string | number; accent?: string; small?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle></CardHeader>
      <CardContent><div className={(small ? "text-sm" : "text-2xl") + " font-bold " + (accent ?? "")}>{value}</div></CardContent>
    </Card>
  );
}