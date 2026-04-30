import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { TradeDetailClient } from "./trade-detail-client";

export const dynamic = "force-dynamic";

export default async function TradeDetailPage({ params }: { params: Promise<{ tradeId: string }> }) {
  const { tradeId } = await params;
  const { user } = await requireRole(["user", "moderator", "admin"]);
  const sb = await createClient();

  const [{ data: trade }, { data: allTrades }] = await Promise.all([
    sb.from("trades").select("*, accounts(name, firm)").eq("id", tradeId).eq("user_id", user.id).maybeSingle(),
    sb.from("trades").select("id").eq("user_id", user.id).order("trade_date", { ascending: false }).order("created_at", { ascending: false }),
  ]);

  if (!trade) notFound();

  const ids = (allTrades ?? []).map((t) => t.id);
  const idx = ids.indexOf(tradeId);
  const adjacent = {
    prev: idx > 0 ? ids[idx - 1] : null,
    next: idx < ids.length - 1 ? ids[idx + 1] : null,
  };

  return <TradeDetailClient trade={trade} adjacent={adjacent} />;
}