import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users as UsersIcon, TrendingUp, BookOpen, DollarSign, AlertTriangle } from "lucide-react";
import { fmtMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const sb = createAdminClient();
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: bannedUsers },
    { count: totalTrades },
    { count: totalEntries },
    { count: activeCooldowns },
    { data: pnlData },
  ] = await Promise.all([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("profiles").select("*", { count: "exact", head: true }).eq("banned", false),
    sb.from("profiles").select("*", { count: "exact", head: true }).eq("banned", true),
    sb.from("trades").select("*", { count: "exact", head: true }),
    sb.from("journal_entries").select("*", { count: "exact", head: true }),
    sb.from("cooldowns").select("*", { count: "exact", head: true }).eq("is_active", true).gt("ends_at", new Date().toISOString()),
    sb.from("trades").select("pnl, commission"),
  ]);

  const totalPnl = (pnlData ?? []).reduce((s, t: { pnl: number; commission: number }) => s + (t.pnl - t.commission), 0);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-destructive/15 text-destructive">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Platform-wide controls and stats</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Total Users" value={totalUsers ?? 0} icon={<UsersIcon className="h-4 w-4" />} />
        <Stat label="Active" value={activeUsers ?? 0} icon={<UsersIcon className="h-4 w-4" />} accent="text-green-500" />
        <Stat label="Banned" value={bannedUsers ?? 0} icon={<UsersIcon className="h-4 w-4" />} accent="text-red-500" />
        <Stat label="Total Trades" value={totalTrades ?? 0} icon={<TrendingUp className="h-4 w-4" />} />
        <Stat label="Journal Entries" value={totalEntries ?? 0} icon={<BookOpen className="h-4 w-4" />} />
        <Stat label="Active Cooldowns" value={activeCooldowns ?? 0} icon={<AlertTriangle className="h-4 w-4" />} accent="text-amber-500" />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Net Platform P&amp;L</CardTitle></CardHeader>
          <CardContent>
            <div className={"text-3xl font-bold " + (totalPnl >= 0 ? "text-green-500" : "text-red-500")}>{fmtMoney(totalPnl)}</div>
            <p className="mt-1 text-sm text-muted-foreground">Across all users, after commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <a href="/admin/users" className="block rounded-md border p-3 hover:border-primary">→ Manage users (ban, change role/plan, force logout)</a>
            <a href="/admin/trades" className="block rounded-md border p-3 hover:border-primary">→ View all trades, flag suspicious activity</a>
            <a href="/admin/cooldowns" className="block rounded-md border p-3 hover:border-primary">→ Configure global cooldown rules</a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: number | string; icon: React.ReactNode; accent?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className={"text-2xl font-bold " + (accent ?? "")}>{value}</div>
      </CardContent>
    </Card>
  );
}
