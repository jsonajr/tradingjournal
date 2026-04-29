import { NextRequest, NextResponse } from "next/server";
import { apiRequireRole, logAdminAction } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const auth = await apiRequireRole(["admin", "moderator"]);
  if ("error" in auth) return auth.error;
  const { action, id, reason } = await request.json();
  const sb = createAdminClient();

  if (action === "flag") {
    await sb.from("trades").update({ is_flagged: true, flag_reason: reason ?? "Suspicious" }).eq("id", id);
    await logAdminAction(auth.profile.id, "flag_trade", undefined, { trade_id: id });
    return NextResponse.json({ message: "Trade flagged" });
  }
  if (action === "unflag") {
    await sb.from("trades").update({ is_flagged: false, flag_reason: null }).eq("id", id);
    await logAdminAction(auth.profile.id, "unflag_trade", undefined, { trade_id: id });
    return NextResponse.json({ message: "Trade unflagged" });
  }
  if (action === "delete") {
    if (auth.profile.role !== "admin") return NextResponse.json({ error: "Admin only" }, { status: 403 });
    await sb.from("trades").delete().eq("id", id);
    await logAdminAction(auth.profile.id, "delete_trade", undefined, { trade_id: id });
    return NextResponse.json({ message: "Trade deleted" });
  }
  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
