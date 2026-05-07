import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewTradeClient } from "./new-trade-client";

export const dynamic = "force-dynamic";

export default async function NewTradePage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const [{ data: accounts }, { data: settings }] = await Promise.all([
    sb.from("accounts").select("id, name, firm, type").eq("user_id", user.id).order("name"),
    sb.from("user_settings").select("auto_commission").eq("user_id", user.id).maybeSingle(),
  ]);
  return <NewTradeClient accounts={accounts ?? []} autoCommission={settings?.auto_commission ?? null} />;
}