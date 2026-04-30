import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { JournalClient } from "./journal-client";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: trades }, { data: accounts }] = await Promise.all([
    sb.from("trades").select("*").eq("user_id", user.id).order("trade_date", { ascending: false }).limit(500),
    sb.from("accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
  ]);

  return <JournalClient initialTrades={trades ?? []} accounts={accounts ?? []} userId={user.id} />;
}