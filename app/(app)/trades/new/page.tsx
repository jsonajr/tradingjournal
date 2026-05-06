import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NewTradeClient } from "./new-trade-client";

export const dynamic = "force-dynamic";

export default async function NewTradePage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();
  const { data: accounts } = await sb.from("accounts").select("id, name, firm, type").eq("user_id", user.id).order("name");
  return <NewTradeClient accounts={accounts ?? []} />;
}