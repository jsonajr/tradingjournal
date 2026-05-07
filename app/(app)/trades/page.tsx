import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TradesClient } from "./trades-client";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const [{ data: trades }, { data: accounts }, { data: userSettings }] = await Promise.all([
    sb.from("trades")
      .select("id, trade_date, symbol, direction, contracts, entry_price, exit_price, stop_price, pnl, commission, r_multiple, setup, session, grade, notes, account_id, blown_account, accounts(name, firm, type)")
      .eq("user_id", user.id)
      .order("trade_date", { ascending: false })
      .limit(500),
    sb.from("accounts")
      .select("id, name, firm, type")
      .eq("user_id", user.id),
    sb.from("user_settings").select("auto_commission").eq("user_id", user.id).maybeSingle(),
  ]);
  return <TradesClient initialTrades={trades ?? []} accounts={accounts ?? []} autoCommission={userSettings?.auto_commission ?? null} />;
}