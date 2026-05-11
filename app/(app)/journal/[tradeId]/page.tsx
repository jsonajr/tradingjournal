import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TradeDetailClient } from "./trade-detail-client";

export const dynamic = "force-dynamic";

export default async function TradeDetailPage({ params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = await params;
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const { data: trade } = await sb
    .from("trades")
    .select("*, open_time, close_time, accounts(name, firm, type)")
    .eq("id", tradeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!trade) notFound();

  const [{ data: accounts }, { data: allTrades }, { data: mistakes }] = await Promise.all([
    sb.from("accounts").select("id, name, firm").eq("user_id", user.id),
    sb.from("trades")
      .select("id, trade_date")
      .eq("user_id", user.id)
      .order("trade_date", { ascending: false })
      .order("created_at", { ascending: false }),
    sb.from("playbook_entries").select("id, title").eq("user_id", user.id).eq("type", "mistake").order("title"),
  ]);

  // Find prev/next trade IDs for navigation
  const ids = (allTrades ?? []).map(t => t.id);
  const idx = ids.indexOf(tradeId);
  const adjacent = {
    prev: idx > 0 ? ids[idx - 1] : null,
    next: idx < ids.length - 1 ? ids[idx + 1] : null,
  };

  return (
    <TradeDetailClient
      trade={trade}
      adjacent={adjacent}
      accounts={accounts ?? []}
      mistakes={mistakes ?? []}
    />
  );
}