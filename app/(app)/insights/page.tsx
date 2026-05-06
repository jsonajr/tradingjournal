import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { InsightsClient } from "./insights-client";
import { BarChart2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InsightsPage() {
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: trades }, { data: entries }, { data: accounts }] = await Promise.all([
    sb.from("trades").select("*").eq("user_id", user.id).order("trade_date", { ascending: true }).range(0, 9999),
    sb.from("journal_entries").select("entry_date, rating, rules_followed, mood").eq("user_id", user.id),
    sb.from("accounts").select("id, type, status").eq("user_id", user.id),
  ]);

  if (!trades || trades.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center">
        <BarChart2 className="h-12 w-12 text-muted-foreground mb-4 opacity-40" />
        <h1 className="text-xl font-bold mb-2">No trades yet</h1>
        <p className="text-muted-foreground text-sm">Log your first trade to start seeing insights.</p>
      </div>
    );
  }

  return (
    <InsightsClient
      allTrades={trades}
      entries={entries ?? []}
      accounts={accounts ?? []}
    />
  );
}