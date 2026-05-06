import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CalendarClient } from "./calendar-client";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: entries }, { data: trades }] = await Promise.all([
    sb.from("journal_entries").select("*").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(365),
    sb.from("trades").select("trade_date, pnl, commission, account_id, accounts(type)").eq("user_id", user.id).order("trade_date", { ascending: false }).limit(2000),
  ]);

  const { data: accounts } = await sb.from("accounts").select("id, type").eq("user_id", user.id);
  return <CalendarClient initialEntries={entries ?? []} trades={trades ?? []} accounts={accounts ?? []} />;
}