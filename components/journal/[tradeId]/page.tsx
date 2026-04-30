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
    .select("*, accounts(name, firm)")
    .eq("id", tradeId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!trade) notFound();
  return <TradeDetailClient trade={trade} />;
}