import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TradesClient } from "./trades-client";

export const dynamic = "force-dynamic";

export default async function TradesPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const [{ data: trades }, { data: accounts }] = await Promise.all([
    sb.from("trades")
      .select("*, accounts(name)")
      .eq("user_id", user.id)
      .order("trade_date", { ascending: false })
      .limit(500),
    sb.from("accounts")
      .select("id, name, firm")
      .eq("user_id", user.id),
  ]);
  return <TradesClient initialTrades={trades ?? []} accounts={accounts ?? []} />;
}