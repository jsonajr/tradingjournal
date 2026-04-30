import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { TradesClient } from "./trades-client";

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
  return <TradesClient initialTrades={trades ?? []} />;
}