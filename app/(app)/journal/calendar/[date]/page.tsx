import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { JournalDayClient } from "./journal-day-client";

export const dynamic = "force-dynamic";

export default async function JournalDayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) notFound();

  const [{ data: entry }, { data: trades }, { data: accounts }] = await Promise.all([
    sb.from("journal_entries").select("*").eq("user_id", user.id).eq("entry_date", date).maybeSingle(),
    sb.from("trades").select("id,symbol,direction,pnl,commission,r_multiple,setup,session,grade,notes,entry_price,exit_price,stop_price,contracts,account_id,blown_account").eq("user_id", user.id).eq("trade_date", date).order("created_at"),
    sb.from("accounts").select("id,name,firm,type").eq("user_id", user.id),
  ]);

  return <JournalDayClient entry={entry ?? null} trades={trades ?? []} accounts={accounts ?? []} date={date} />;
}