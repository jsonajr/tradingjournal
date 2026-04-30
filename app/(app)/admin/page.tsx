import { createAdminClient } from "@/lib/supabase/admin";
import { requireRole } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users as UsersIcon, TrendingUp, BookOpen, DollarSign, AlertTriangle, Crown, Shield, ChevronRight } from "lucide-react";
import { fmtMoney } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  await requireRole(["admin", "moderator"]);
  const sb = createAdminClient();
  const [
    { count: totalUsers },
    { count: activeUsers },
    { count: bannedUsers },
    { count: premiumUsers },
    { count: totalTrades },
    { count: totalEntries },
    { data: pnlData },
  ] = await Promise.all([
    sb.from("profiles").select("*", { count: "exact", head: true }),
    sb.from("profiles").select("*", { count: "exact", head: true }).eq("banned", false),
    sb.from("profiles").select("*", { count: "exact", head: true }).eq("banned", true),
    sb.from("profiles").select("*", { count: "exact", head: true }).eq("plan", "premium"),
    sb.from("trades").select("*", { count: "exact", head: true }),
    sb.from("journal_entries").select("*", { count: "exact", head: true }),
    sb.from("trades").select("pnl, commission"),
  ]);

  const totalPnl = (pnlData ?? []).reduce((s, t: { pnl: number; commission: number }) => s + (t.pnl - t.commission), 0);

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-amber-500/15 text-amber-500">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Admin Panel</h1>
          <p className="text-sm text-muted-foreground">Platform-wide controls and stats</p>
        </div>
      </div>

      {/* Mobile quick-nav — only shown on mobile */}
      <div className="mb-6 md:hidden">
        <div className="rounded-xl border bg-card overflow-hidden divide-y">
          <div className="px-4 py-2.5 bg-muted/40">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Quick Navigation</p>
          </div>
          {[
            { href: "/admin/users",     label: "Manage Users",    sub: "Ban, suspend, change role & plan",  color: "text-blue-500",   bg: "bg-blue-500/10",   icon: UsersIcon },
            { href: "/admin/trades",    label: "All Trades",      sub: "View trades across all accounts",   color: "text-green-500",  bg: "bg-green-500/10",  icon: TrendingUp },
            { href: "/admin/cooldowns", label: "Cooldowns",       sub: "Manage trading cooldown rules",     color: "text-amber-500",  bg: "bg-amber-500/10",  icon: AlertTriangle },
            { href: "/admin/invites",   label: "Invite Codes",    sub: "Generate and manage invite codes",  color: "text-purple-500", bg: "bg-purple-500/10", icon: Crown },
          ].map(({ href, label, sub, color, bg, icon: Icon }) => (
            <Link key={href} href={href} className="flex items-center gap-3 px-4 py-3.5 active:bg-muted/50 transition-colors">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-muted-foreground truncate">{sub}</div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 mb-6">
        <Stat label="Total Users"     value={totalUsers ?? 0}   icon={<UsersIcon className="h-4 w-4" />} />
        <Stat label="Active"          value={activeUsers ?? 0}  icon={<UsersIcon className="h-4 w-4" />} accent="text-green-500" />
        <Stat label="Banned"          value={bannedUsers ?? 0}  icon={<UsersIcon className="h-4 w-4" />} accent="text-red-500" />
        <Stat label="Premium"         value={premiumUsers ?? 0} icon={<Crown className="h-4 w-4" />}     accent="text-amber-500" />
        <Stat label="Total Trades"    value={totalTrades ?? 0}  icon={<TrendingUp className="h-4 w-4" />} />
        <Stat label="Journal Entries" value={totalEntries ?? 0} icon={<BookOpen className="h-4 w-4" />} />
      </div>

      {/* Desktop cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">Net Platform P&L</CardTitle></CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>{fmtMoney(totalPnl)}</div>
            <p className="mt-1 text-sm text-muted-foreground">Across all users, after commissions</p>
          </CardContent>
        </Card>
        <Card className="hidden md:block">
          <CardHeader><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Link href="/admin/users"     className="block rounded-md border p-3 hover:border-primary transition-colors">→ Manage users (ban, suspend, role, plan)</Link>
            <Link href="/admin/trades"    className="block rounded-md border p-3 hover:border-primary transition-colors">→ View all trades across all users</Link>
            <Link href="/admin/cooldowns" className="block rounded-md border p-3 hover:border-primary transition-colors">→ Manage cooldown rules</Link>
            <Link href="/admin/invites"   className="block rounded-md border p-3 hover:border-primary transition-colors">→ Manage invite codes</Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: number; icon: React.ReactNode; accent?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${accent ?? ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}