import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DashboardStats } from "@/components/dashboard-stats";
import { QuickTradeWrapper } from "@/components/journal/quick-trade-wrapper";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { user, profile } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: trades }, { data: accounts }, { data: recentJournal }, { data: userSettings }] = await Promise.all([
    sb.from("trades").select("id, trade_date, symbol, direction, pnl, commission, r_multiple").eq("user_id", user.id).order("trade_date", { ascending: false }),
    sb.from("accounts").select("id, name").eq("user_id", user.id),
    sb.from("journal_entries").select("id, entry_date, title, bias, notes").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(3),
    sb.from("user_settings").select("post_trade_popup_enabled").eq("user_id", user.id).maybeSingle(),
  ]);

  return (
    <DashboardStats
      allTrades={trades ?? []}
      recentJournal={recentJournal ?? []}
      profileName={profile.full_name}
      accounts={accounts ?? []}
      userId={user.id}
      popupEnabled={userSettings?.post_trade_popup_enabled ?? true}
      QuickTradeWrapper={QuickTradeWrapper}
    />
  );
}